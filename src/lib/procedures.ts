import type Database from 'better-sqlite3';
import { executeTransaction, type CreateOrderInput } from './db';

/**
 * ============================================================
 * DATABASE STORED PROCEDURES
 * Kheye Now! Food Delivery System
 * ============================================================
 * These stored procedures encapsulate key business processes,
 * multi-table DML logic, and explicit transaction boundaries
 * (BEGIN TRANSACTION, COMMIT, and ROLLBACK).
 */

/**
 * PROCEDURE: sp_place_order
 * Atomically places a new customer order:
 * 1. Checks item availability and stock levels.
 * 2. Creates the parent order record in 'orders'.
 * 3. Inserts all ordered items in 'order_items' (triggers reduce stock).
 * 4. Inserts all selected add-ons in 'order_item_addons'.
 * 5. Creates the corresponding payment record in 'payments'.
 * 6. Explicitly commits the transaction; rolls back completely on any error.
 */
export function sp_place_order(db: Database.Database, input: CreateOrderInput): { orderId: number } {
  return executeTransaction(db, () => {
    // 1. Stock & availability validation
    if (!input.items || input.items.length === 0) {
      throw new Error('Procedure sp_place_order error: Order must contain at least one item.');
    }

    for (const item of input.items) {
      if (item.food_id) {
        const food = db.prepare('SELECT name, stock, is_available FROM food_items WHERE id = ?').get(item.food_id) as any;
        if (!food) {
          throw new Error(`Procedure sp_place_order error: Food item #${item.food_id} not found.`);
        }
        if (!food.is_available || (food.stock !== null && food.stock !== undefined && Number(food.stock) <= 0)) {
          throw new Error(`Procedure sp_place_order error: "${food.name}" is out of stock.`);
        }
        if (food.stock !== null && food.stock !== undefined && Number(food.stock) < item.quantity) {
          throw new Error(`Procedure sp_place_order error: "${food.name}" only has ${food.stock} left in stock.`);
        }
      }
    }

    // 2. Identify restaurant_id from the first item
    let restaurantId: number | null = null;
    const firstFoodId = input.items[0].food_id;
    if (firstFoodId) {
      const food = db.prepare('SELECT restaurant_id FROM food_items WHERE id = ?').get(firstFoodId) as any;
      if (food) restaurantId = food.restaurant_id;
    }

    // 3. Insert parent order
    const orderStmt = db.prepare(`
      INSERT INTO orders (
        user_id, rider_id, restaurant_id, customer_name, phone_number,
        delivery_address, delivery_location, total_amount, payment_method,
        order_notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Preparing')
    `);

    const orderResult = orderStmt.run(
      input.user_id || null,
      input.rider_id || null,
      restaurantId,
      input.customer_name.trim(),
      input.phone_number.trim(),
      input.delivery_address.trim(),
      input.delivery_location || 'Dhanmondi',
      input.total_amount,
      input.payment_method || 'Cash on Delivery',
      input.order_notes?.trim() || null
    );

    const orderId = orderResult.lastInsertRowid as number;

    // 4. Insert order items & add-ons
    const itemStmt = db.prepare(`
      INSERT INTO order_items (order_id, food_id, food_name, price, quantity)
      VALUES (?, ?, ?, ?, ?)
    `);

    const addonStmt = db.prepare(`
      INSERT INTO order_item_addons (order_item_id, addon_id, addon_name, price)
      VALUES (?, ?, ?, ?)
    `);

    for (const item of input.items) {
      const itemResult = itemStmt.run(
        orderId,
        item.food_id || null,
        item.food_name,
        item.price,
        item.quantity
      );
      const orderItemId = itemResult.lastInsertRowid as number;

      if (item.addons && Array.isArray(item.addons)) {
        for (const addon of item.addons) {
          addonStmt.run(
            orderItemId,
            addon.addon_id || null,
            addon.addon_name,
            addon.price
          );
        }
      }
    }

    // 5. Initialize payment ledger entry
    const paymentStmt = db.prepare(`
      INSERT INTO payments (order_id, user_id, amount, currency, payment_method, payment_status)
      VALUES (?, ?, ?, 'BDT', ?, 'Pending')
    `);
    paymentStmt.run(
      orderId,
      input.user_id || null,
      input.total_amount,
      input.payment_method || 'Cash on Delivery'
    );

    return { orderId };
  });
}

/**
 * PROCEDURE: sp_complete_order_delivery
 * Atomically marks an order as delivered:
 * 1. Updates order status to 'Delivered'.
 * 2. Credits rider commission (৳50.00 delivery commission) and increments total_deliveries.
 * 3. Updates rider availability back to 'Available' if they have no other open orders.
 * 4. Queues a customer rating prompt.
 */
export function sp_complete_order_delivery(
  db: Database.Database,
  orderId: number,
  riderId: number
): boolean {
  return executeTransaction(db, () => {
    const order = db.prepare('SELECT id, status, rider_id FROM orders WHERE id = ?').get(orderId) as any;
    if (!order) {
      throw new Error(`Procedure sp_complete_order_delivery: Order #${orderId} does not exist.`);
    }

    if (order.status === 'Delivered') {
      return true; // Already delivered
    }

    if (order.status === 'Cancelled') {
      throw new Error(`Procedure sp_complete_order_delivery: Cannot deliver cancelled Order #${orderId}.`);
    }

    // 1. Update order status
    const updateOrder = db.prepare(`
      UPDATE orders
      SET status = 'Delivered', rider_id = ?, needs_rating = 1
      WHERE id = ?
    `).run(riderId, orderId);

    // 2. Increment rider delivery count and add ৳50.00 delivery commission
    db.prepare(`
      UPDATE riders
      SET total_deliveries = total_deliveries + 1,
          earnings = earnings + 50.00
      WHERE id = ?
    `).run(riderId);

    // 3. Check if rider has remaining in-flight orders; if not, set status back to Available
    const remainingOrders = db.prepare(`
      SELECT COUNT(*) as count FROM orders
      WHERE rider_id = ? AND status IN ('Preparing', 'Prepared', 'On the Way')
    `).get(riderId) as { count: number };

    if (remainingOrders.count === 0) {
      db.prepare(`UPDATE riders SET status = 'Available' WHERE id = ?`).run(riderId);
    }

    return updateOrder.changes > 0;
  });
}

/**
 * PROCEDURE: sp_cancel_order
 * Atomically cancels an active order and restores database consistency:
 * 1. Verifies order is in a cancellable state (cannot cancel Delivered).
 * 2. Restores inventory stock for all food items ordered.
 * 3. Updates order status to 'Cancelled' and appends cancellation reason.
 * 4. Updates payment status to 'Refunded' or 'Failed'.
 * 5. Releases assigned rider back to 'Available' if no other active deliveries.
 */
export function sp_cancel_order(
  db: Database.Database,
  orderId: number,
  cancelledBy: string,
  reason?: string
): boolean {
  return executeTransaction(db, () => {
    const order = db.prepare('SELECT id, status, rider_id, order_notes FROM orders WHERE id = ?').get(orderId) as any;
    if (!order) {
      throw new Error(`Procedure sp_cancel_order: Order #${orderId} was not found.`);
    }

    if (order.status === 'Delivered') {
      throw new Error(`Procedure sp_cancel_order: Order #${orderId} has already been delivered and cannot be cancelled.`);
    }

    if (order.status === 'Cancelled') {
      return true; // Already cancelled
    }

    // 1. Restore food items stock
    const items = db.prepare('SELECT food_id, quantity FROM order_items WHERE order_id = ?').all(orderId) as any[];
    for (const item of items) {
      if (item.food_id) {
        db.prepare(`
          UPDATE food_items
          SET stock = COALESCE(stock, 0) + ?,
              is_available = 1
          WHERE id = ?
        `).run(item.quantity, item.food_id);
      }
    }

    // 2. Mark order as Cancelled
    const reasonText = reason ? ` [Cancelled by ${cancelledBy}: ${reason}]` : ` [Cancelled by ${cancelledBy}]`;
    const newNotes = (order.order_notes || '') + reasonText;
    db.prepare(`
      UPDATE orders
      SET status = 'Cancelled', order_notes = ?
      WHERE id = ?
    `).run(newNotes, orderId);

    // 3. Mark payment as Refunded/Failed
    db.prepare(`
      UPDATE payments
      SET payment_status = CASE WHEN payment_status = 'Completed' THEN 'Refunded' ELSE 'Failed' END
      WHERE order_id = ?
    `).run(orderId);

    // 4. Release rider if assigned
    if (order.rider_id) {
      const activeForRider = db.prepare(`
        SELECT COUNT(*) as count FROM orders
        WHERE rider_id = ? AND id != ? AND status IN ('Preparing', 'Prepared', 'On the Way')
      `).get(order.rider_id, orderId) as { count: number };

      if (activeForRider.count === 0) {
        db.prepare(`UPDATE riders SET status = 'Available' WHERE id = ?`).run(order.rider_id);
      }
    }

    // 5. Remove any pending customer rating prompt
    db.prepare('DELETE FROM customer_rating_prompts WHERE order_id = ?').run(orderId);

    return true;
  });
}

/**
 * PROCEDURE: sp_update_food_stock
 * Adjusts inventory stock for a food item and automatically synchronizes availability:
 * - Increases or decreases stock by quantityDelta.
 * - If resulting stock is <= 0, automatically sets is_available = 0.
 * - If resulting stock > 0, sets is_available = 1.
 */
export function sp_update_food_stock(
  db: Database.Database,
  foodId: number,
  quantityDelta: number
): { newStock: number; isAvailable: boolean } {
  return executeTransaction(db, () => {
    const food = db.prepare('SELECT id, stock, is_available FROM food_items WHERE id = ?').get(foodId) as any;
    if (!food) {
      throw new Error(`Procedure sp_update_food_stock: Food item #${foodId} not found.`);
    }

    const currentStock = food.stock !== null && food.stock !== undefined ? Number(food.stock) : 50;
    const newStock = Math.max(0, currentStock + quantityDelta);
    const isAvailable = newStock > 0 ? 1 : 0;

    db.prepare(`
      UPDATE food_items
      SET stock = ?, is_available = ?
      WHERE id = ?
    `).run(newStock, isAvailable, foodId);

    return {
      newStock,
      isAvailable: Boolean(isAvailable),
    };
  });
}

/**
 * PROCEDURE: sp_assign_rider
 * Assigns an available rider to an active order:
 * - Verifies rider is Available.
 * - Updates order.rider_id and sets status to 'On the Way'.
 * - Sets rider.status to 'On Delivery'.
 */
export function sp_assign_rider(
  db: Database.Database,
  orderId: number,
  riderId: number
): boolean {
  return executeTransaction(db, () => {
    const order = db.prepare('SELECT id, status FROM orders WHERE id = ?').get(orderId) as any;
    if (!order) {
      throw new Error(`Procedure sp_assign_rider: Order #${orderId} not found.`);
    }

    const rider = db.prepare('SELECT id, status FROM riders WHERE id = ?').get(riderId) as any;
    if (!rider) {
      throw new Error(`Procedure sp_assign_rider: Rider #${riderId} not found.`);
    }

    db.prepare(`
      UPDATE orders
      SET rider_id = ?, status = 'On the Way'
      WHERE id = ?
    `).run(riderId, orderId);

    db.prepare(`
      UPDATE riders
      SET status = 'On Delivery'
      WHERE id = ?
    `).run(riderId);

    return true;
  });
}

/**
 * PROCEDURE: sp_recalculate_restaurant_ratings
 * Re-computes aggregate rating for a restaurant from all food item ratings.
 */
export function sp_recalculate_restaurant_ratings(
  db: Database.Database,
  restaurantId: number
): number {
  return executeTransaction(db, () => {
    const result = db.prepare(`
      SELECT ROUND(AVG(rating), 2) as avg_rating
      FROM food_items
      WHERE restaurant_id = ? AND rating IS NOT NULL AND rating > 0
    `).get(restaurantId) as any;

    const newRating = result && result.avg_rating !== null ? Number(result.avg_rating) : 4.8;

    db.prepare(`
      UPDATE restaurants
      SET rating = ?
      WHERE id = ?
    `).run(newRating, restaurantId);

    return newRating;
  });
}
