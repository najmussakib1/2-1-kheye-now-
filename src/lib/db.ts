import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';
import {
  sp_place_order,
  sp_complete_order_delivery,
  sp_cancel_order,
  sp_update_food_stock,
  sp_assign_rider,
  sp_recalculate_restaurant_ratings,
} from './procedures';

export interface FoodItem {
  id: number;
  restaurant_id?: number;
  name: string;
  description: string;
  base_price: number;
  sale_price: number;
  discount_percentage?: number;
  stock_status?: string;
  is_available: number | boolean;
  stock?: number;
  category: string;
  rating: number;
  image_url: string;
  images?: string[];
  images_json?: string;
  created_at?: string;
  restaurant_name?: string;
  restaurant_logo?: string;
  restaurant_rating?: number;
}

export interface User {
  id: number;
  full_name: string;
  phone_number: string;
  email: string;
  address?: string;
  gender?: string;
  avatar_url?: string;
  password_hash: string;
  created_at?: string;
}

export type SafeUser = Omit<User, 'password_hash'>;

export interface Restaurant {
  id: number;
  name: string;
  owner_name: string;
  email: string;
  phone_number: string;
  address: string;
  trade_licence_url?: string;
  categories: string;
  image_url?: string;
  rating: number;
  total_earnings?: number;
  password_hash: string;
  created_at?: string;
}

export type SafeRestaurant = Omit<Restaurant, 'password_hash'>;

// ---- Rider Types ----
export interface Rider {
  id: number;
  full_name: string;
  phone_number: string;
  email: string;
  vehicle_type: string;
  vehicle_number?: string;
  driving_license?: string;
  nid_number?: string;
  address?: string;
  avatar_url?: string;
  status: string; // 'Available' | 'On Delivery' | 'Offline'
  location?: string; // Delivery zone e.g. 'Dhanmondi'
  total_deliveries: number;
  rating: number;
  earnings: number;
  password_hash: string;
  created_at?: string;
}

export type SafeRider = Omit<Rider, 'password_hash'>;

// ---- Add-On Types ----
export interface FoodAddon {
  id: number;
  food_id: number;
  restaurant_id: number;
  name: string;
  price: number;
  image_url?: string;
  is_available: number | boolean;
  created_at?: string;
}

export interface OrderItemAddonInput {
  addon_id?: number;
  addon_name: string;
  price: number;
}

export interface OrderItemAddonRecord {
  id: number;
  order_item_id: number;
  addon_id?: number;
  addon_name: string;
  price: number;
}

// ---- Payment Types (Payment Schema) ----
export type PaymentStatus = 'Pending' | 'Completed' | 'Failed' | 'Refunded';
export type PaymentMethod = 'Cash on Delivery' | 'bKash' | 'Nagad' | 'Card' | 'Online Payment';

export interface PaymentRecord {
  id: number;
  order_id: number;
  user_id?: number | null;
  amount: number;
  currency: string;
  payment_method: string;
  payment_status: PaymentStatus;
  transaction_id?: string | null;
  payment_gateway?: string | null;
  gateway_response?: string | null;
  paid_at?: string | null;
  created_at?: string;
}

export interface OrderItemInput {
  food_id?: number;
  food_name: string;
  price: number;
  quantity: number;
  addons?: OrderItemAddonInput[];
}

export interface CreateOrderInput {
  user_id?: number | null;
  rider_id?: number | null;
  customer_name: string;
  phone_number: string;
  delivery_address: string;
  delivery_location?: string;
  total_amount: number;
  payment_method?: string;
  order_notes?: string;
  items: OrderItemInput[];
}

export interface OrderRecord {
  id: number;
  user_id: number | null;
  rider_id?: number | null;
  restaurant_id?: number | null;
  customer_name: string;
  phone_number: string;
  delivery_address: string;
  delivery_location?: string;
  total_amount: number;
  payment_method: string;
  order_notes?: string;
  status: string;
  is_rated?: boolean | number;
  needs_rating?: boolean | number;
  created_at: string;
  items?: OrderItemInput[];
}

// ---- Rating Types ----
export interface FoodRatingRecord {
  id: number;
  order_id: number;
  food_id: number;
  restaurant_id: number;
  user_id?: number | null;
  rating: number;
  review_text?: string | null;
  created_at?: string;
}

export interface OrderFoodRatingInput {
  food_id: number;
  rating: number;
  review_text?: string;
}

export interface SubmitOrderRatingsResult {
  orderId: number;
  restaurantId: number;
  restaurantName: string;
  previousRestaurantRating: number;
  newRestaurantRating: number;
  updatedFoods: {
    foodId: number;
    foodName: string;
    newRating: number;
  }[];
}

export interface PendingRatingOrderItem {
  id: number;
  order_id: number;
  food_id: number;
  food_name: string;
  price: number;
  quantity: number;
  image_url?: string;
  current_food_rating?: number;
}

export interface PendingRatingOrder {
  id: number;
  user_id: number | null;
  rider_id: number | null;
  customer_name: string;
  phone_number: string;
  delivery_address: string;
  total_amount: number;
  status: string;
  is_rated: number;
  created_at: string;
  restaurant_id: number;
  restaurant_name: string;
  restaurant_logo?: string;
  restaurant_rating: number;
  items: PendingRatingOrderItem[];
}

export * from './constants';
export * from './procedures';

// ============================================================
// DATABASE USER-DEFINED FUNCTIONS (UDFs) & BUSINESS LOGIC
// ============================================================

/** Calculates discount percentage between base_price and sale_price */
export function calculateDiscount(basePrice: number, salePrice: number): number {
  const base = Number(basePrice);
  const sale = Number(salePrice);
  if (!base || base <= 0 || !sale || sale >= base) return 0;
  return Math.round(((base - sale) / base) * 100);
}

/** Determines stock status string based on inventory level */
export function getFoodStockStatus(stock?: number, isAvailable?: boolean | number): string {
  const s = stock !== null && stock !== undefined ? Number(stock) : 50;
  const avail = isAvailable ? 1 : 0;
  if (!avail || s <= 0) return 'Out of Stock';
  if (s <= 5) return 'Low Stock';
  return 'In Stock';
}

/** Computes delivery fee based on delivery zone and total order amount (free delivery >= ৳1500) */
export function calculateDeliveryFee(location?: string, totalAmount?: number): number {
  const total = Number(totalAmount) || 0;
  if (total >= 1500) return 0.00;
  const loc = (location || '').trim().toLowerCase();
  if (loc === 'dhanmondi') return 40.00;
  if (loc === 'gulshan' || loc === 'banani') return 60.00;
  if (loc === 'uttara' || loc === 'mirpur') return 70.00;
  return 50.00;
}

/** Computes estimated delivery turnaround time */
export function estimateDeliveryTime(location?: string, status?: string): string {
  const s = (status || '').trim();
  if (s === 'Delivered') return 'Delivered';
  if (s === 'Cancelled') return 'Cancelled';
  if (s === 'On the Way') return '15 - 25 mins';
  if (s === 'Prepared') return '25 - 35 mins';
  if (s === 'Preparing') return '35 - 45 mins';
  return '40 - 55 mins';
}

/** Computes delivery rider commission (৳50.00 base + 2% bonus of order total) */
export function calculateRiderCommission(totalAmount: number): number {
  const total = Number(totalAmount) || 0;
  return Math.round((50.00 + (total * 0.02)) * 100) / 100;
}

/** Formats structured receipt order summary string */
export function formatOrderSummary(name: string, total: number, method?: string): string {
  return `Order of ৳${Number(total || 0).toFixed(2)} for ${name || 'Guest'} (${method || 'Cash on Delivery'})`;
}

/**
 * Registers custom User-Defined SQL Functions (UDFs) into SQLite engine.
 * Allows these functions to be directly executed inside SQL SELECT, WHERE, and ORDER BY clauses.
 */
export function registerDatabaseFunctions(db: Database.Database) {
  db.function('calculate_discount', { deterministic: true }, (basePrice: any, salePrice: any) => {
    return calculateDiscount(Number(basePrice), Number(salePrice));
  });

  db.function('get_food_stock_status', { deterministic: true }, (stock: any, isAvailable: any) => {
    return getFoodStockStatus(Number(stock), isAvailable);
  });

  db.function('calculate_delivery_fee', { deterministic: true }, (location: any, totalAmount: any) => {
    return calculateDeliveryFee(String(location || ''), Number(totalAmount));
  });

  db.function('estimate_delivery_time', { deterministic: true }, (location: any, status: any) => {
    return estimateDeliveryTime(String(location || ''), String(status || ''));
  });

  db.function('calculate_rider_commission', { deterministic: true }, (totalAmount: any) => {
    return calculateRiderCommission(Number(totalAmount));
  });

  db.function('format_order_summary', { deterministic: true }, (name: any, total: any, method: any) => {
    return formatOrderSummary(String(name || ''), Number(total), String(method || ''));
  });
}

const DB_PATH = path.join(process.cwd(), 'kheye_now.db');

// Helper to open database connection safely in Next.js environment
export function getDb() {
  const db = new Database(DB_PATH, { verbose: process.env.NODE_ENV === 'development' ? console.log : undefined });
  db.pragma('foreign_keys = ON');
  registerDatabaseFunctions(db);
  
  // Ensure tables exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS restaurants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL,
        owner_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone_number VARCHAR(50) UNIQUE NOT NULL,
        address TEXT NOT NULL,
        trade_licence_url TEXT,
        categories TEXT DEFAULT 'Fast Food, Juice',
        image_url TEXT,
        rating DECIMAL(3, 2) DEFAULT 4.8,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_restaurants_name ON restaurants(name);
    CREATE INDEX IF NOT EXISTS idx_restaurants_email ON restaurants(email);
    CREATE INDEX IF NOT EXISTS idx_restaurants_phone ON restaurants(phone_number);
    CREATE INDEX IF NOT EXISTS idx_restaurants_rating ON restaurants(rating);

    CREATE TABLE IF NOT EXISTS food_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        restaurant_id INTEGER DEFAULT 1,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        base_price DECIMAL(10, 2) NOT NULL,
        sale_price DECIMAL(10, 2) NOT NULL,
        is_available BOOLEAN DEFAULT 1,
        category VARCHAR(100) DEFAULT 'General',
        rating DECIMAL(3, 2) DEFAULT 4.8,
        image_url TEXT,
        images_json TEXT DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_food_items_restaurant_id ON food_items(restaurant_id);
    CREATE INDEX IF NOT EXISTS idx_food_items_category ON food_items(category);
    CREATE INDEX IF NOT EXISTS idx_food_items_is_available ON food_items(is_available);

    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name VARCHAR(255) NOT NULL,
        phone_number VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        address TEXT,
        gender VARCHAR(20),
        avatar_url TEXT,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);

    CREATE TABLE IF NOT EXISTS riders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name VARCHAR(255) NOT NULL,
        phone_number VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        vehicle_type VARCHAR(50) DEFAULT 'Motorcycle',
        vehicle_number VARCHAR(100),
        driving_license VARCHAR(100),
        nid_number VARCHAR(100),
        address TEXT,
        avatar_url TEXT,
        status VARCHAR(50) DEFAULT 'Available',
        total_deliveries INTEGER DEFAULT 0,
        rating DECIMAL(3, 2) DEFAULT 4.9,
        earnings DECIMAL(10, 2) DEFAULT 0.00,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_riders_email ON riders(email);
    CREATE INDEX IF NOT EXISTS idx_riders_phone ON riders(phone_number);
    CREATE INDEX IF NOT EXISTS idx_riders_status ON riders(status);

    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        rider_id INTEGER,
        customer_name VARCHAR(255) NOT NULL,
        phone_number VARCHAR(50) NOT NULL,
        delivery_address TEXT NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'Cash on Delivery',
        order_notes TEXT,
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (rider_id) REFERENCES riders(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_rider_id ON orders(rider_id);
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

    CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        food_id INTEGER,
        food_name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        quantity INTEGER NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

    CREATE TABLE IF NOT EXISTS food_addons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        food_id INTEGER NOT NULL,
        restaurant_id INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        image_url TEXT,
        is_available BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (food_id) REFERENCES food_items(id) ON DELETE CASCADE,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_food_addons_food_id ON food_addons(food_id);
    CREATE INDEX IF NOT EXISTS idx_food_addons_restaurant_id ON food_addons(restaurant_id);

    CREATE TABLE IF NOT EXISTS order_item_addons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_item_id INTEGER NOT NULL,
        addon_id INTEGER,
        addon_name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
        FOREIGN KEY (addon_id) REFERENCES food_addons(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_order_item_addons_item_id ON order_item_addons(order_item_id);

    CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        user_id INTEGER,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'BDT',
        payment_method VARCHAR(50) NOT NULL,
        payment_status VARCHAR(50) DEFAULT 'Pending',
        transaction_id VARCHAR(255) UNIQUE,
        payment_gateway VARCHAR(100),
        gateway_response TEXT,
        paid_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
    CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);

    CREATE TABLE IF NOT EXISTS wishlists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);

    CREATE TABLE IF NOT EXISTS wishlist_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wishlist_id INTEGER NOT NULL,
        food_id INTEGER NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(wishlist_id, food_id),
        FOREIGN KEY (wishlist_id) REFERENCES wishlists(id) ON DELETE CASCADE,
        FOREIGN KEY (food_id) REFERENCES food_items(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist_id ON wishlist_items(wishlist_id);
    CREATE INDEX IF NOT EXISTS idx_wishlist_items_food_id ON wishlist_items(food_id);

    CREATE TABLE IF NOT EXISTS food_ratings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        food_id INTEGER NOT NULL,
        restaurant_id INTEGER NOT NULL,
        user_id INTEGER,
        rating DECIMAL(3, 2) NOT NULL,
        review_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (food_id) REFERENCES food_items(id) ON DELETE CASCADE,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_food_ratings_order_id ON food_ratings(order_id);
    CREATE INDEX IF NOT EXISTS idx_food_ratings_food_id ON food_ratings(food_id);
    CREATE INDEX IF NOT EXISTS idx_food_ratings_restaurant_id ON food_ratings(restaurant_id);
  `);
  
  // Graceful column additions for existing sqlite database
  try {
    db.exec(`ALTER TABLE orders ADD COLUMN rider_id INTEGER REFERENCES riders(id) ON DELETE SET NULL;`);
  } catch {
    // column might already exist
  }
  try {
    db.exec(`ALTER TABLE orders ADD COLUMN is_rated BOOLEAN DEFAULT 0;`);
  } catch {
    // column might already exist
  }
  try {
    db.exec(`ALTER TABLE orders ADD COLUMN delivery_location VARCHAR(100) DEFAULT 'Dhanmondi';`);
  } catch {
    // column might already exist
  }
  try {
    db.exec(`ALTER TABLE orders ADD COLUMN needs_rating BOOLEAN DEFAULT 0;`);
  } catch {
    // column might already exist
  }
  try {
    db.exec(`ALTER TABLE riders ADD COLUMN location VARCHAR(100) DEFAULT 'Dhanmondi';`);
  } catch {
    // column might already exist
  }
  try {
    db.exec(`ALTER TABLE orders ADD COLUMN restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE SET NULL;`);
  } catch {
    // column might already exist
  }
  try {
    db.exec(`ALTER TABLE food_items ADD COLUMN stock INTEGER DEFAULT 50;`);
  } catch {
    // column might already exist
  }

  // Create customer_rating_prompts table if not exists
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS customer_rating_prompts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL UNIQUE,
        user_id INTEGER,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `);
  } catch {
    // ignore
  }

  // Trigger 1: Stock reduction on order items insert & auto stock-out
  try {
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS trigger_reduce_stock_on_order_item
      AFTER INSERT ON order_items
      BEGIN
        UPDATE food_items
        SET stock = MAX(0, COALESCE(stock, 0) - NEW.quantity),
            is_available = CASE WHEN (COALESCE(stock, 0) - NEW.quantity) <= 0 THEN 0 ELSE is_available END
        WHERE id = NEW.food_id;
      END;
    `);
  } catch {
    // ignore
  }

  // Trigger 2: When a rider becomes Available, assign any prepared orders waiting for rider
  // Trigger 2: Assign a waiting order when a rider's availability or zone changes.
  // The legacy trigger_assign_orders_when_rider_available only matched orders in
  // status 'Pending', which no code path writes (sp_place_order inserts
  // 'Preparing'), so waiting orders were never picked up. Drop it once, on the
  // first boot after this change, so it cannot race the corrected trigger.
  try {
    const legacy = db
      .prepare("SELECT 1 FROM sqlite_master WHERE type = 'trigger' AND name = 'trigger_assign_orders_when_rider_available'")
      .get();
    if (legacy) {
      db.exec('DROP TRIGGER trigger_assign_orders_when_rider_available;');
    }
  } catch {
    // ignore - legacy trigger already gone
  }

  try {
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS trigger_assign_waiting_order_on_rider_update
      AFTER UPDATE OF status, location ON riders
      WHEN NEW.status IN ('Available', 'On Delivery')
        AND NEW.location IS NOT NULL
        AND TRIM(NEW.location) != ''
      BEGIN
        UPDATE orders
        SET rider_id = (
          SELECT r.id FROM riders r
          WHERE r.status IN ('Available', 'On Delivery')
            AND LOWER(TRIM(r.location)) = LOWER(TRIM(NEW.location))
          ORDER BY
            CASE WHEN r.status = 'Available' THEN 0 ELSE 1 END ASC,
            (
              SELECT COUNT(*) FROM orders o
              WHERE o.rider_id = r.id
                AND o.status IN ('Pending', 'Preparing', 'Prepared', 'On the Way', 'Picked Up')
            ) ASC,
            r.total_deliveries ASC,
            r.id ASC
          LIMIT 1
        )
        WHERE id = (
          SELECT o.id FROM orders o
          WHERE o.rider_id IS NULL
            AND o.status IN ('Pending', 'Preparing', 'Prepared')
            AND LOWER(TRIM(o.delivery_location)) = LOWER(TRIM(NEW.location))
          ORDER BY o.id ASC
          LIMIT 1
        );
      END;
    `);
  } catch {
    // ignore - trigger already exists
  }

  // Trigger 3: After food rating inserted, update food rating, restaurant rating, mark order rated, close prompt
  try {
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS trigger_update_ratings_on_review
      AFTER INSERT ON food_ratings
      BEGIN
        UPDATE food_items
        SET rating = (
          SELECT ROUND(AVG(rating), 2) FROM food_ratings WHERE food_id = NEW.food_id
        )
        WHERE id = NEW.food_id;

        UPDATE restaurants
        SET rating = (
          SELECT ROUND(AVG(fi.rating), 2)
          FROM food_items fi
          WHERE fi.restaurant_id = NEW.restaurant_id
            AND fi.rating IS NOT NULL AND fi.rating > 0
        )
        WHERE id = NEW.restaurant_id;

        UPDATE orders
        SET is_rated = CASE
          WHEN (SELECT COUNT(*) FROM order_items WHERE order_id = NEW.order_id) =
               (SELECT COUNT(*) FROM food_ratings WHERE order_id = NEW.order_id)
          THEN 1 ELSE is_rated
        END,
        needs_rating = CASE
          WHEN (SELECT COUNT(*) FROM order_items WHERE order_id = NEW.order_id) =
               (SELECT COUNT(*) FROM food_ratings WHERE order_id = NEW.order_id)
          THEN 0 ELSE needs_rating
        END
        WHERE id = NEW.order_id;

        UPDATE customer_rating_prompts
        SET status = 'completed'
        WHERE order_id = NEW.order_id
          AND (SELECT COUNT(*) FROM order_items WHERE order_id = NEW.order_id) =
              (SELECT COUNT(*) FROM food_ratings WHERE order_id = NEW.order_id);
      END;
    `);
  } catch {
    // ignore - trigger already exists
  }

  // Trigger 4: When order status changes to Delivered, set needs_rating=1 and insert prompt
  try {
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS trigger_prompt_rating_on_delivery
      AFTER UPDATE OF status ON orders
      WHEN NEW.status = 'Delivered' AND OLD.status != 'Delivered'
      BEGIN
        UPDATE orders SET needs_rating = 1 WHERE id = NEW.id;
        INSERT OR IGNORE INTO customer_rating_prompts (order_id, user_id, status)
        VALUES (NEW.id, NEW.user_id, 'pending');
      END;
    `);
  } catch {
    // ignore - trigger already exists
  }

  // Add total_earnings column to restaurants if not exists
  try {
    db.exec(`ALTER TABLE restaurants ADD COLUMN total_earnings REAL DEFAULT 0;`);
  } catch {
    // column might already exist
  }

  // Trigger 5: Assign rider when order is prepared by restaurant
  try {
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS trigger_assign_order_on_prepared
      AFTER UPDATE OF status ON orders
      WHEN NEW.status = 'Prepared' AND OLD.status != 'Prepared' AND NEW.rider_id IS NULL
      BEGIN
        UPDATE orders SET
          rider_id = (
            SELECT r.id FROM riders r
            WHERE r.status = 'Available' AND r.location = NEW.delivery_location
            ORDER BY (
              SELECT COUNT(*) FROM orders o2 WHERE o2.rider_id = r.id AND o2.status IN ('Prepared','On the Way')
            ) ASC,
            r.total_deliveries ASC,
            r.id ASC
            LIMIT 1
          )
        WHERE id = NEW.id;
      END;
    `);
  } catch { }

  // Trigger 6: Update earnings on delivery
  try {
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS trigger_update_earnings_on_delivery
      AFTER UPDATE OF status ON orders
      WHEN NEW.status = 'Delivered' AND OLD.status != 'Delivered'
      BEGIN
        UPDATE riders
        SET earnings = earnings + (NEW.total_amount * 0.80)
        WHERE id = NEW.rider_id;
        UPDATE restaurants
        SET total_earnings = total_earnings + (NEW.total_amount * 0.20)
        WHERE id = NEW.restaurant_id;
      END;
    `);
  } catch { }

  // Trigger 7: Re-run rider assignment on ANY order update.
  // Keeps the schema.sql definition in sync on existing databases, since
  // CREATE TRIGGER IF NOT EXISTS will not replace an already-created trigger.
  // Eligible rider = online/available ('Available' or 'On Delivery', never
  // 'Offline') in the order's zone; free riders sort before busy ones, then
  // by fewest engaged orders, then fewest lifetime deliveries, then lowest id.
  try {
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS trigger_assign_rider_on_order_update
      AFTER UPDATE ON orders
      FOR EACH ROW
      WHEN NEW.rider_id IS NULL
        AND NEW.status IN ('Pending', 'Preparing', 'Prepared')
        AND NEW.delivery_location IS NOT NULL
        AND TRIM(NEW.delivery_location) != ''
        AND EXISTS (
          SELECT 1 FROM riders r
          WHERE r.status IN ('Available', 'On Delivery')
            AND LOWER(TRIM(r.location)) = LOWER(TRIM(NEW.delivery_location))
        )
      BEGIN
        UPDATE orders
        SET rider_id = (
          SELECT r.id FROM riders r
          WHERE r.status IN ('Available', 'On Delivery')
            AND LOWER(TRIM(r.location)) = LOWER(TRIM(NEW.delivery_location))
          ORDER BY
            CASE WHEN r.status = 'Available' THEN 0 ELSE 1 END ASC,
            (
              SELECT COUNT(*) FROM orders o
              WHERE o.rider_id = r.id
                AND o.status IN ('Pending', 'Preparing', 'Prepared', 'On the Way', 'Picked Up')
            ) ASC,
            r.total_deliveries ASC,
            r.id ASC
          LIMIT 1
        )
        WHERE id = NEW.id;
      END;
    `);
  } catch { }

  // Seed default restaurant and food items if DB is empty (Explicit Transaction: BEGIN -> COMMIT / ROLLBACK)
  try {
    const count = db.prepare('SELECT COUNT(*) as cnt FROM restaurants').get() as any;
    if (count.cnt === 0) {
      db.exec('BEGIN TRANSACTION');
      try {
        // Generate scrypt password hash compatible with verifyPassword in auth.ts
        const salt = crypto.randomBytes(16).toString('hex');
        const derivedKey = crypto.scryptSync('123456', salt, 64);
        const hash = `${salt}:${derivedKey.toString('hex')}`;

        db.exec(`
          INSERT INTO restaurants (id, name, owner_name, email, phone_number, address, trade_licence_url, categories, image_url, password_hash)
          VALUES (1, 'basic_restaurant', 'Main Kitchen Master', 'basic_restaurant@kheyenow.com', '01700000000', 'Dhanmondi 27, Dhaka', NULL, 'Fast Food, Juice, Desi Feast, Burgers, Pizza, Pasta, Desserts, Beverages', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80', '${hash}');
        `);

        const restId = 1;

        const foods = [
          {
            name: 'Royal Kacchi Biryani',
            desc: 'Authentic Dhaka style fragrant Basmati rice with tender mutton, potatoes, and signature spices.',
            base: 450,
            sale: 380,
            cat: 'Desi Feast',
            img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80'
          },
          {
            name: 'Chittagong Beef Kala Bhuna',
            desc: 'Traditional slow-cooked dark caramelized tender beef cooked with heritage spices & mustard oil.',
            base: 480,
            sale: 420,
            cat: 'Desi Feast',
            img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80'
          },
          {
            name: 'Special Beef Tehari',
            desc: 'Mustard oil cooked tender beef chunks cooked with aromatic short-grain rice & green chillies.',
            base: 320,
            sale: 280,
            cat: 'Desi Feast',
            img: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800&auto=format&fit=crop&q=80'
          },
          {
            name: 'Smokey BBQ Smash Burger',
            desc: 'Double juicy beef patties, melted cheddar, crispy bacon, caramelized onions & secret BBQ sauce.',
            base: 350,
            sale: 299,
            cat: 'Burgers',
            img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80'
          },
          {
            name: 'Crispy Naga Chicken Burger',
            desc: 'Super spicy naga pepper glazed fried chicken thigh patty, jalapenos, melted cheese & mayo.',
            base: 310,
            sale: 260,
            cat: 'Burgers',
            img: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=800&auto=format&fit=crop&q=80'
          },
          {
            name: 'Truffle Mushroom Pizza',
            desc: 'Hand-tossed sourdough pizza topped with wild mushrooms, truffle oil, mozzarella & fresh basil.',
            base: 650,
            sale: 549,
            cat: 'Pizza',
            img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80'
          },
          {
            name: 'Ultimate Pepperoni Feast Pizza',
            desc: 'Loaded with double pepperoni, mozzarella, parmesan and house marinara sauce.',
            base: 690,
            sale: 599,
            cat: 'Pizza',
            img: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&auto=format&fit=crop&q=80'
          },
          {
            name: 'Creamy Alfredo Chicken Pasta',
            desc: 'Fettuccine in rich garlic parmesan cream sauce with grilled chicken breast and herbs.',
            base: 420,
            sale: 360,
            cat: 'Pasta',
            img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&auto=format&fit=crop&q=80'
          },
          {
            name: 'Molten Lava Chocolate Cake',
            desc: 'Warm chocolate cake with a molten chocolate center served with vanilla bean ice cream.',
            base: 250,
            sale: 199,
            cat: 'Desserts',
            img: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&auto=format&fit=crop&q=80'
          },
          {
            name: 'Mango Passionfruit Smoothie',
            desc: 'Refreshing blended fresh mango, passionfruit pulp, Greek yogurt and honey.',
            base: 180,
            sale: 149,
            cat: 'Juice',
            img: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&auto=format&fit=crop&q=80'
          },
        ];

        const insertFood = db.prepare(`
          INSERT INTO food_items (restaurant_id, name, description, base_price, sale_price, category, image_url, images_json, is_available)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        `);

        for (const f of foods) {
          insertFood.run(restId, f.name, f.desc, f.base, f.sale, f.cat, f.img, JSON.stringify([f.img]));
        }

        // Also seed an available Rider for deliveries
        db.prepare(`
          INSERT OR IGNORE INTO riders (
            id, full_name, phone_number, email, vehicle_type, vehicle_number, driving_license, nid_number, address, location, avatar_url, status, total_deliveries, rating, earnings, password_hash
          ) VALUES (
            1, 'Rahim Ahmed', '01800000000', 'rider@kheyenow.com', 'Motorcycle', 'Dhaka Metro-HA-11-2233', 'DL-882391024', '19962691234567890', 'Mirpur 10, Dhaka', 'Dhanmondi', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80', 'Available', 142, 4.95, 14250.00, '${hash}'
          )
        `).run();

        // Explicit COMMIT upon completing all initial inserts
        db.exec('COMMIT');
      } catch (seedErr) {
        // Explicit ROLLBACK if seeding encounters an error
        if (db.inTransaction) {
          db.exec('ROLLBACK');
        }
        console.error('Seed transaction rolled back due to error:', seedErr);
      }
    }
  } catch (e) {
    console.error('Seed check error:', e);
  }

  return db;
}

/**
 * Executes a callback within an explicit database transaction.
 * Employs explicit 'BEGIN TRANSACTION', 'COMMIT', and 'ROLLBACK' SQL statements.
 * Supports nested operations using SQLite SAVEPOINTS.
 */
export function executeTransaction<T>(db: Database.Database, operation: () => T): T {
  const isOuter = !db.inTransaction;
  const savepoint = isOuter ? null : `sp_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

  if (isOuter) {
    db.exec('BEGIN TRANSACTION');
  } else {
    db.exec(`SAVEPOINT ${savepoint}`);
  }

  try {
    const result = operation();
    if (isOuter) {
      db.exec('COMMIT');
    } else {
      db.exec(`RELEASE SAVEPOINT ${savepoint}`);
    }
    return result;
  } catch (error) {
    if (isOuter) {
      if (db.inTransaction) {
        db.exec('ROLLBACK');
      }
    } else if (savepoint) {
      db.exec(`ROLLBACK TO SAVEPOINT ${savepoint}`);
    }
    throw error;
  }
}

export function formatFoodItem(row: any): FoodItem {
  let images: string[] = [];
  if (row.images_json) {
    try {
      const parsed = JSON.parse(row.images_json);
      if (Array.isArray(parsed) && parsed.length > 0) {
        images = parsed;
      }
    } catch {
      // ignore json parse error
    }
  }
  if (images.length === 0 && row.image_url) {
    images = [row.image_url];
  }
  const stock = row.stock !== undefined && row.stock !== null ? Number(row.stock) : 50;
  // If stock is 0 or less, ensure is_available reflects stock-out
  const is_available = stock <= 0 ? 0 : (row.is_available ? 1 : 0);
  const discount_percentage = row.discount_percentage !== undefined
    ? Number(row.discount_percentage)
    : calculateDiscount(row.base_price, row.sale_price);
  const stock_status = row.stock_status || getFoodStockStatus(stock, is_available);

  return {
    ...row,
    discount_percentage,
    stock_status,
    stock,
    is_available,
    images,
    images_json: row.images_json || JSON.stringify(images),
  };
}

// SQL Query method to get all food items (using database UDFs calculate_discount and get_food_stock_status)
export function getFoodItemsFromDb(category?: string, restaurantId?: number, search?: string): FoodItem[] {
  const db = getDb();
  try {
    let query = `
      SELECT f.id, f.restaurant_id, f.name, f.description, f.base_price, f.sale_price,
             calculate_discount(f.base_price, f.sale_price) AS discount_percentage,
             get_food_stock_status(f.stock, f.is_available) AS stock_status,
             f.is_available, f.stock, f.category, f.rating, f.image_url, f.images_json, f.created_at,
             r.name as restaurant_name, r.image_url as restaurant_logo, r.rating as restaurant_rating 
      FROM food_items f
      LEFT JOIN restaurants r ON f.restaurant_id = r.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (category && category.toLowerCase() !== 'all') {
      query += ` AND f.category = ?`;
      params.push(category);
    }
    if (restaurantId) {
      query += ` AND f.restaurant_id = ?`;
      params.push(restaurantId);
    }
    if (search && search.trim()) {
      query += ` AND (LOWER(f.name) LIKE ? OR LOWER(f.description) LIKE ? OR LOWER(r.name) LIKE ?)`;
      const s = `%${search.trim().toLowerCase()}%`;
      params.push(s, s, s);
    }

    query += ` ORDER BY f.id DESC`;

    const stmt = db.prepare(query);
    const rows = stmt.all(...params);
    return rows.map(formatFoodItem);
  } finally {
    db.close();
  }
}

// SQL Query method to get a single food item by ID (using database UDFs)
export function getFoodItemByIdFromDb(id: number): FoodItem | null {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      SELECT f.id, f.restaurant_id, f.name, f.description, f.base_price, f.sale_price,
             calculate_discount(f.base_price, f.sale_price) AS discount_percentage,
             get_food_stock_status(f.stock, f.is_available) AS stock_status,
             f.is_available, f.stock, f.category, f.rating, f.image_url, f.images_json, f.created_at,
             r.name as restaurant_name, r.image_url as restaurant_logo, r.rating as restaurant_rating 
      FROM food_items f
      LEFT JOIN restaurants r ON f.restaurant_id = r.id
      WHERE f.id = ?
    `);
    const result = stmt.get(id);
    return result ? formatFoodItem(result) : null;
  } finally {
    db.close();
  }
}

// SQL Query method to get 5 similar products (same category or popular) (using database UDFs)
export function getSimilarFoodItemsFromDb(currentId: number, category: string, limit = 5): FoodItem[] {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      SELECT f.id, f.restaurant_id, f.name, f.description, f.base_price, f.sale_price,
             calculate_discount(f.base_price, f.sale_price) AS discount_percentage,
             get_food_stock_status(f.stock, f.is_available) AS stock_status,
             f.is_available, f.stock, f.category, f.rating, f.image_url, f.images_json, f.created_at,
             r.name as restaurant_name, r.image_url as restaurant_logo, r.rating as restaurant_rating 
      FROM food_items f
      LEFT JOIN restaurants r ON f.restaurant_id = r.id
      WHERE f.id != ? AND (f.category = ? OR 1=1)
      ORDER BY (CASE WHEN f.category = ? THEN 0 ELSE 1 END), f.id DESC
      LIMIT ?
    `);
    const rows = stmt.all(currentId, category, category, limit);
    return rows.map(formatFoodItem);
  } finally {
    db.close();
  }
}

// Add a new food item for a restaurant (Explicit Transaction: BEGIN -> COMMIT / ROLLBACK)
export function createFoodItemInDb(item: {
  restaurant_id: number;
  name: string;
  description?: string;
  base_price: number;
  sale_price: number;
  category: string;
  image_url?: string;
  images?: string[];
  images_json?: string;
  is_available?: boolean | number;
  stock?: number;
}): FoodItem {
  const db = getDb();
  try {
    return executeTransaction(db, () => {
      const imagesList = item.images && item.images.length > 0
        ? item.images
        : item.image_url ? [item.image_url] : [];
      const imagesJson = item.images_json || JSON.stringify(imagesList);
      const coverImage = imagesList[0] || item.image_url || '';
      const initialStock = item.stock !== undefined ? Number(item.stock) : 50;
      const isAvailable = initialStock <= 0 ? 0 : (item.is_available !== undefined ? (item.is_available ? 1 : 0) : 1);

      const stmt = db.prepare(`
        INSERT INTO food_items (restaurant_id, name, description, base_price, sale_price, category, image_url, images_json, is_available, stock)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(
        item.restaurant_id,
        item.name.trim(),
        item.description?.trim() || null,
        item.base_price,
        item.sale_price,
        item.category || 'Fast Food',
        coverImage || null,
        imagesJson,
        isAvailable,
        initialStock
      );

      return {
        id: info.lastInsertRowid as number,
        restaurant_id: item.restaurant_id,
        name: item.name,
        description: item.description || '',
        base_price: item.base_price,
        sale_price: item.sale_price,
        category: item.category,
        image_url: coverImage,
        images: imagesList,
        images_json: imagesJson,
        is_available: Boolean(isAvailable),
        stock: initialStock,
        rating: 4.8,
      };
    });
  } finally {
    db.close();
  }
}

// Update food item in DB (Explicit Transaction: BEGIN -> COMMIT / ROLLBACK)
export function updateFoodItemInDb(
  itemId: number,
  restaurantId: number,
  updates: {
    name?: string;
    description?: string;
    base_price?: number;
    sale_price?: number;
    category?: string;
    image_url?: string;
    images?: string[];
    images_json?: string;
    is_available?: boolean | number;
    stock?: number;
  }
): FoodItem | null {
  const db = getDb();
  try {
    return executeTransaction(db, () => {
      const current = db.prepare('SELECT * FROM food_items WHERE id = ? AND restaurant_id = ?').get(itemId, restaurantId) as any;
      if (!current) return null;

      let imagesList = updates.images;
      let imagesJson = updates.images_json;
      if (imagesList && imagesList.length > 0) {
        imagesJson = JSON.stringify(imagesList);
      } else if (imagesJson) {
        try {
          imagesList = JSON.parse(imagesJson);
        } catch {
          imagesList = [];
        }
      } else if (updates.image_url) {
        imagesList = [updates.image_url];
        imagesJson = JSON.stringify(imagesList);
      } else {
        const fallbackJson = current.images_json || '[]';
        imagesJson = fallbackJson;
        try {
          imagesList = JSON.parse(fallbackJson);
        } catch {
          imagesList = current.image_url ? [current.image_url] : [];
        }
      }

      const coverImage = (imagesList && imagesList.length > 0) ? imagesList[0] : (updates.image_url ?? current.image_url);

      const name = updates.name !== undefined ? updates.name.trim() : current.name;
      const description = updates.description !== undefined ? updates.description.trim() : current.description;
      const base_price = updates.base_price !== undefined ? updates.base_price : current.base_price;
      const sale_price = updates.sale_price !== undefined ? updates.sale_price : current.sale_price;
      const category = updates.category !== undefined ? updates.category.trim() : current.category;
      const stock = updates.stock !== undefined ? Number(updates.stock) : (current.stock !== undefined && current.stock !== null ? Number(current.stock) : 50);
      
      let is_available: number;
      if (stock <= 0) {
        is_available = 0;
      } else if (updates.is_available !== undefined) {
        is_available = updates.is_available ? 1 : 0;
      } else {
        is_available = current.is_available ? 1 : 0;
      }

      const stmt = db.prepare(`
        UPDATE food_items
        SET name = ?, description = ?, base_price = ?, sale_price = ?, category = ?, image_url = ?, images_json = ?, is_available = ?, stock = ?
        WHERE id = ? AND restaurant_id = ?
      `);
      stmt.run(name, description, base_price, sale_price, category, coverImage, imagesJson, is_available, stock, itemId, restaurantId);

      const updatedRow = db.prepare(`
        SELECT f.id, f.restaurant_id, f.name, f.description, f.base_price, f.sale_price, f.is_available, f.stock, f.category, f.rating, f.image_url, f.images_json, f.created_at, r.name as restaurant_name, r.image_url as restaurant_logo, r.rating as restaurant_rating 
        FROM food_items f
        LEFT JOIN restaurants r ON f.restaurant_id = r.id
        WHERE f.id = ?
      `).get(itemId);
      return updatedRow ? formatFoodItem(updatedRow) : null;
    });
  } finally {
    db.close();
  }
}

// Update food item availability (Explicit Transaction: BEGIN -> COMMIT / ROLLBACK)
export function updateFoodItemAvailabilityInDb(itemId: number, restaurantId: number, isAvailable: boolean): boolean {
  const db = getDb();
  try {
    return executeTransaction(db, () => {
      const stmt = db.prepare(`
        UPDATE food_items 
        SET is_available = ? 
        WHERE id = ? AND restaurant_id = ?
      `);
      const info = stmt.run(isAvailable ? 1 : 0, itemId, restaurantId);
      return info.changes > 0;
    });
  } finally {
    db.close();
  }
}

// Delete food item for a restaurant (Explicit Transaction: BEGIN -> COMMIT / ROLLBACK)
export function deleteFoodItemInDb(itemId: number, restaurantId: number): boolean {
  const db = getDb();
  try {
    return executeTransaction(db, () => {
      const stmt = db.prepare(`
        DELETE FROM food_items 
        WHERE id = ? AND restaurant_id = ?
      `);
      const info = stmt.run(itemId, restaurantId);
      return info.changes > 0;
    });
  } finally {
    db.close();
  }
}

// ============================================================
// USER DATABASE QUERIES (SQL Prepared Statements)
// ============================================================

export function createUserInDb(user: {
  full_name: string;
  phone_number: string;
  email: string;
  address?: string;
  gender?: string;
  avatar_url?: string;
  password_hash: string;
}): SafeUser {
  const db = getDb();
  try {
    return executeTransaction(db, () => {
      const stmt = db.prepare(`
        INSERT INTO users (full_name, phone_number, email, address, gender, avatar_url, password_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(
        user.full_name,
        user.phone_number,
        user.email.toLowerCase(),
        user.address || null,
        user.gender || null,
        user.avatar_url || null,
        user.password_hash
      );

      return {
        id: info.lastInsertRowid as number,
        full_name: user.full_name,
        phone_number: user.phone_number,
        email: user.email.toLowerCase(),
        address: user.address,
        gender: user.gender,
        avatar_url: user.avatar_url,
      };
    });
  } finally {
    db.close();
  }
}

export function findUserByEmailOrPhoneFromDb(identifier: string): User | null {
  const db = getDb();
  try {
    const cleanId = identifier.trim().toLowerCase();
    const stmt = db.prepare(`
      SELECT id, full_name, phone_number, email, address, gender, avatar_url, password_hash, created_at 
      FROM users 
      WHERE LOWER(email) = ? OR LOWER(phone_number) = ?
    `);
    const user = stmt.get(cleanId, cleanId);
    return (user as User) || null;
  } finally {
    db.close();
  }
}

export function findUserByIdFromDb(id: number): SafeUser | null {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      SELECT id, full_name, phone_number, email, address, gender, avatar_url, created_at 
      FROM users 
      WHERE id = ?
    `);
    const user = stmt.get(id);
    return (user as SafeUser) || null;
  } finally {
    db.close();
  }
}

export function updateUserProfileInDb(userId: number, data: {
  full_name?: string;
  phone_number?: string;
  address?: string;
  gender?: string;
  avatar_url?: string;
}): SafeUser | null {
  const db = getDb();
  try {
    return executeTransaction(db, () => {
      const updates: string[] = [];
      const params: any[] = [];

      if (data.full_name !== undefined) {
        updates.push('full_name = ?');
        params.push(data.full_name.trim());
      }
      if (data.phone_number !== undefined) {
        updates.push('phone_number = ?');
        params.push(data.phone_number.trim());
      }
      if (data.address !== undefined) {
        updates.push('address = ?');
        params.push(data.address.trim());
      }
      if (data.gender !== undefined) {
        updates.push('gender = ?');
        params.push(data.gender);
      }
      if (data.avatar_url !== undefined) {
        updates.push('avatar_url = ?');
        params.push(data.avatar_url);
      }

      if (updates.length > 0) {
        params.push(userId);
        const stmt = db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`);
        stmt.run(...params);
      }

      const user = db.prepare(`
        SELECT id, full_name, phone_number, email, address, gender, avatar_url, created_at 
        FROM users 
        WHERE id = ?
      `).get(userId);
      return (user as SafeUser) || null;
    });
  } finally {
    db.close();
  }
}

export function updateUserAddressInDb(userId: number, address: string): void {
  const db = getDb();
  try {
    executeTransaction(db, () => {
      const stmt = db.prepare(`
        UPDATE users 
        SET address = ? 
        WHERE id = ?
      `);
      stmt.run(address.trim(), userId);
    });
  } finally {
    db.close();
  }
}

// ============================================================
// RESTAURANT DATABASE QUERIES (SQL Prepared Statements)
// ============================================================

export function createRestaurantInDb(rest: {
  name: string;
  owner_name: string;
  email: string;
  phone_number: string;
  address: string;
  trade_licence_url?: string;
  categories: string;
  image_url?: string;
  password_hash: string;
}): SafeRestaurant {
  const db = getDb();
  try {
    return executeTransaction(db, () => {
      const stmt = db.prepare(`
        INSERT INTO restaurants (name, owner_name, email, phone_number, address, trade_licence_url, categories, image_url, password_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(
        rest.name.trim(),
        rest.owner_name.trim(),
        rest.email.toLowerCase().trim(),
        rest.phone_number.trim(),
        rest.address.trim(),
        rest.trade_licence_url || null,
        rest.categories || 'Fast Food, Juice',
        rest.image_url || null,
        rest.password_hash
      );

      return {
        id: info.lastInsertRowid as number,
        name: rest.name,
        owner_name: rest.owner_name,
        email: rest.email.toLowerCase(),
        phone_number: rest.phone_number,
        address: rest.address,
        trade_licence_url: rest.trade_licence_url,
        categories: rest.categories,
        image_url: rest.image_url,
        rating: 4.8,
      };
    });
  } finally {
    db.close();
  }
}

export function findRestaurantByEmailOrPhoneOrNameFromDb(identifier: string): Restaurant | null {
  const db = getDb();
  try {
    const cleanId = identifier.trim().toLowerCase();
    const stmt = db.prepare(`
      SELECT id, name, owner_name, email, phone_number, address, trade_licence_url, categories, image_url, rating, password_hash, created_at 
      FROM restaurants 
      WHERE LOWER(email) = ? OR LOWER(phone_number) = ? OR LOWER(name) = ?
    `);
    const rest = stmt.get(cleanId, cleanId, cleanId);
    return (rest as Restaurant) || null;
  } finally {
    db.close();
  }
}

export function findRestaurantByIdFromDb(id: number): SafeRestaurant | null {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      SELECT id, name, owner_name, email, phone_number, address, trade_licence_url, categories, image_url, rating, created_at 
      FROM restaurants 
      WHERE id = ?
    `);
    const rest = stmt.get(id);
    return (rest as SafeRestaurant) || null;
  } finally {
    db.close();
  }
}

// Update restaurant profile details (including logo image_url)
export function updateRestaurantProfileInDb(
  id: number,
  updates: {
    name?: string;
    owner_name?: string;
    phone_number?: string;
    address?: string;
    categories?: string;
    image_url?: string;
  }
): SafeRestaurant | null {
  const db = getDb();
  try {
    return executeTransaction(db, () => {
      const current = db.prepare(`
        SELECT id, name, owner_name, email, phone_number, address, trade_licence_url, categories, image_url, rating, created_at 
        FROM restaurants 
        WHERE id = ?
      `).get(id) as SafeRestaurant | undefined;
      if (!current) return null;

      const name = updates.name !== undefined ? updates.name.trim() : current.name;
      const owner_name = updates.owner_name !== undefined ? updates.owner_name.trim() : current.owner_name;
      const phone_number = updates.phone_number !== undefined ? updates.phone_number.trim() : current.phone_number;
      const address = updates.address !== undefined ? updates.address.trim() : current.address;
      const categories = updates.categories !== undefined ? updates.categories.trim() : current.categories;
      const image_url = updates.image_url !== undefined ? updates.image_url.trim() : (current.image_url || null);

      const stmt = db.prepare(`
        UPDATE restaurants
        SET name = ?, owner_name = ?, phone_number = ?, address = ?, categories = ?, image_url = ?
        WHERE id = ?
      `);
      stmt.run(name, owner_name, phone_number, address, categories, image_url, id);

      const updated = db.prepare(`
        SELECT id, name, owner_name, email, phone_number, address, trade_licence_url, categories, image_url, rating, created_at 
        FROM restaurants 
        WHERE id = ?
      `).get(id);
      return (updated as SafeRestaurant) || null;
    });
  } finally {
    db.close();
  }
}

// Fetch all registered restaurants for customer search and filter
export function getAllRestaurantsFromDb(): SafeRestaurant[] {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      SELECT id, name, owner_name, email, phone_number, address, trade_licence_url, categories, image_url, rating, created_at 
      FROM restaurants 
      ORDER BY id ASC
    `);
    return stmt.all() as SafeRestaurant[];
  } finally {
    db.close();
  }
}

// ============================================================
// ORDERS DATABASE QUERIES (SQL Prepared Statements & Transactions)
// ============================================================

// Check stock for all items before placing an order. Returns null if OK, or an error string if any item is out of stock.
export function checkStockForOrderItems(items: { food_id?: number; quantity: number }[]): string | null {
  const db = getDb();
  try {
    for (const item of items) {
      if (!item.food_id) continue;
      const food = db.prepare('SELECT name, stock, is_available FROM food_items WHERE id = ?').get(item.food_id) as any;
      if (!food) continue;
      if (!food.is_available || (food.stock !== null && food.stock !== undefined && Number(food.stock) <= 0)) {
        return `"${food.name}" is out of stock and cannot be ordered.`;
      }
      if (food.stock !== null && food.stock !== undefined && Number(food.stock) < item.quantity) {
        return `"${food.name}" only has ${food.stock} left in stock, but you requested ${item.quantity}.`;
      }
    }
    return null;
  } finally {
    db.close();
  }
}

// Create order via stored procedure sp_place_order with explicit transaction control (BEGIN -> COMMIT / ROLLBACK)
export function createOrderInDb(input: CreateOrderInput): { orderId: number } {
  const db = getDb();
  try {
    return sp_place_order(db, input);
  } finally {
    db.close();
  }
}

export function getOrderByIdFromDb(orderId: number): any | null {
  const db = getDb();
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
    if (!order) return null;

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId) as any[];
    for (const item of items) {
      const addons = db.prepare('SELECT * FROM order_item_addons WHERE order_item_id = ?').all(item.id) as any[];
      item.addons = addons;
    }
    order.items = items;
    return order;
  } finally {
    db.close();
  }
}

// Get all orders for a specific restaurant, with items and rider info
export function getOrdersByRestaurantIdFromDb(restaurantId: number): any[] {
  const db = getDb();
  try {
    const orders = db.prepare(`
      SELECT o.*, r.full_name as rider_name, r.phone_number as rider_phone
      FROM orders o
      LEFT JOIN riders r ON o.rider_id = r.id
      WHERE o.restaurant_id = ?
      ORDER BY o.created_at DESC
    `).all(restaurantId) as any[];

    for (const order of orders) {
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id) as any[];
      order.items = items;
    }
    return orders;
  } finally {
    db.close();
  }
}

// Update order status by restaurant (e.g. Preparing -> Prepared, or Cancelled via sp_cancel_order)
export function updateOrderStatusByRestaurantInDb(orderId: number, restaurantId: number, status: string): boolean {
  const db = getDb();
  try {
    if (status === 'Cancelled') {
      return sp_cancel_order(db, orderId, 'Restaurant', 'Cancelled by restaurant management');
    }
    return executeTransaction(db, () => {
      const stmt = db.prepare(`
        UPDATE orders SET status = ? WHERE id = ? AND restaurant_id = ?
      `);
      const info = stmt.run(status, orderId, restaurantId);
      return info.changes > 0;
    });
  } finally {
    db.close();
  }
}

// ============================================================
// FOOD ADD-ONS DATABASE QUERIES
// ============================================================

export function getAddonsByFoodIdFromDb(foodId: number): FoodAddon[] {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      SELECT id, food_id, restaurant_id, name, price, image_url, is_available, created_at
      FROM food_addons
      WHERE food_id = ?
      ORDER BY id ASC
    `);
    return stmt.all(foodId) as FoodAddon[];
  } finally {
    db.close();
  }
}

export function getAddonByIdFromDb(id: number): FoodAddon | null {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      SELECT id, food_id, restaurant_id, name, price, image_url, is_available, created_at
      FROM food_addons
      WHERE id = ?
    `);
    const row = stmt.get(id);
    return (row as FoodAddon) || null;
  } finally {
    db.close();
  }
}

export function createAddonInDb(addon: {
  food_id: number;
  restaurant_id: number;
  name: string;
  price: number;
  image_url?: string;
  is_available?: boolean | number;
}): FoodAddon {
  const db = getDb();
  try {
    return executeTransaction(db, () => {
      const stmt = db.prepare(`
        INSERT INTO food_addons (food_id, restaurant_id, name, price, image_url, is_available)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(
        addon.food_id,
        addon.restaurant_id,
        addon.name.trim(),
        addon.price,
        addon.image_url?.trim() || null,
        addon.is_available !== undefined ? (addon.is_available ? 1 : 0) : 1
      );

      return {
        id: info.lastInsertRowid as number,
        food_id: addon.food_id,
        restaurant_id: addon.restaurant_id,
        name: addon.name.trim(),
        price: addon.price,
        image_url: addon.image_url || undefined,
        is_available: addon.is_available !== undefined ? Boolean(addon.is_available) : true,
      };
    });
  } finally {
    db.close();
  }
}

export function updateAddonInDb(
  addonId: number,
  restaurantId: number,
  updates: {
    name?: string;
    price?: number;
    image_url?: string;
    is_available?: boolean | number;
  }
): FoodAddon | null {
  const db = getDb();
  try {
    return executeTransaction(db, () => {
      const current = db.prepare('SELECT * FROM food_addons WHERE id = ? AND restaurant_id = ?').get(addonId, restaurantId) as any;
      if (!current) return null;

      const name = updates.name !== undefined ? updates.name.trim() : current.name;
      const price = updates.price !== undefined ? Number(updates.price) : current.price;
      const image_url = updates.image_url !== undefined ? updates.image_url.trim() : current.image_url;
      const is_available = updates.is_available !== undefined ? (updates.is_available ? 1 : 0) : current.is_available;

      const stmt = db.prepare(`
        UPDATE food_addons
        SET name = ?, price = ?, image_url = ?, is_available = ?
        WHERE id = ? AND restaurant_id = ?
      `);
      stmt.run(name, price, image_url, is_available, addonId, restaurantId);

      const row = db.prepare(`
        SELECT id, food_id, restaurant_id, name, price, image_url, is_available, created_at
        FROM food_addons
        WHERE id = ?
      `).get(addonId);
      return (row as FoodAddon) || null;
    });
  } finally {
    db.close();
  }
}

export function deleteAddonInDb(addonId: number, restaurantId: number): boolean {
  const db = getDb();
  try {
    return executeTransaction(db, () => {
      const stmt = db.prepare(`
        DELETE FROM food_addons
        WHERE id = ? AND restaurant_id = ?
      `);
      const info = stmt.run(addonId, restaurantId);
      return info.changes > 0;
    });
  } finally {
    db.close();
  }
}

// ============================================================
// RIDER DATABASE QUERIES (Portfolio & Dedicated Authentication)
// ============================================================

export function createRiderInDb(rider: {
  full_name: string;
  phone_number: string;
  email: string;
  vehicle_type?: string;
  vehicle_number?: string;
  driving_license?: string;
  nid_number?: string;
  address?: string;
  avatar_url?: string;
  password_hash: string;
}): SafeRider {
  const db = getDb();
  try {
    return executeTransaction(db, () => {
      const stmt = db.prepare(`
        INSERT INTO riders (full_name, phone_number, email, vehicle_type, vehicle_number, driving_license, nid_number, address, avatar_url, password_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(
        rider.full_name.trim(),
        rider.phone_number.trim(),
        rider.email.toLowerCase().trim(),
        rider.vehicle_type?.trim() || 'Motorcycle',
        rider.vehicle_number?.trim() || null,
        rider.driving_license?.trim() || null,
        rider.nid_number?.trim() || null,
        rider.address?.trim() || null,
        rider.avatar_url || null,
        rider.password_hash
      );

      return {
        id: info.lastInsertRowid as number,
        full_name: rider.full_name.trim(),
        phone_number: rider.phone_number.trim(),
        email: rider.email.toLowerCase().trim(),
        vehicle_type: rider.vehicle_type || 'Motorcycle',
        vehicle_number: rider.vehicle_number,
        driving_license: rider.driving_license,
        nid_number: rider.nid_number,
        address: rider.address,
        avatar_url: rider.avatar_url,
        status: 'Available',
        total_deliveries: 0,
        rating: 4.9,
        earnings: 0.00,
      };
    });
  } finally {
    db.close();
  }
}

export function findRiderByEmailOrPhoneFromDb(identifier: string): Rider | null {
  const db = getDb();
  try {
    const cleanId = identifier.trim().toLowerCase();
    const stmt = db.prepare(`
      SELECT id, full_name, phone_number, email, vehicle_type, vehicle_number, driving_license, nid_number, address, avatar_url, status, total_deliveries, rating, earnings, password_hash, created_at
      FROM riders
      WHERE LOWER(email) = ? OR LOWER(phone_number) = ?
    `);
    const row = stmt.get(cleanId, cleanId);
    return (row as Rider) || null;
  } finally {
    db.close();
  }
}

export function findRiderByIdFromDb(id: number): SafeRider | null {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      SELECT id, full_name, phone_number, email, vehicle_type, vehicle_number, driving_license, nid_number, address, avatar_url, status, location, total_deliveries, rating, earnings, created_at
      FROM riders
      WHERE id = ?
    `);
    const row = stmt.get(id);
    return (row as SafeRider) || null;
  } finally {
    db.close();
  }
}

export function updateRiderStatusInDb(riderId: number, status: string): boolean {
  const db = getDb();
  try {
    return executeTransaction(db, () => {
      const stmt = db.prepare(`
        UPDATE riders
        SET status = ?
        WHERE id = ?
      `);
      const info = stmt.run(status, riderId);
      return info.changes > 0;
    });
  } finally {
    db.close();
  }
}

export function updateRiderProfileInDb(
  riderId: number,
  data: {
    full_name?: string;
    phone_number?: string;
    vehicle_type?: string;
    vehicle_number?: string;
    address?: string;
    avatar_url?: string;
  }
): SafeRider | null {
  const db = getDb();
  try {
    return executeTransaction(db, () => {
      const updates: string[] = [];
      const params: any[] = [];

      if (data.full_name !== undefined) {
        updates.push('full_name = ?');
        params.push(data.full_name.trim());
      }
      if (data.phone_number !== undefined) {
        updates.push('phone_number = ?');
        params.push(data.phone_number.trim());
      }
      if (data.vehicle_type !== undefined) {
        updates.push('vehicle_type = ?');
        params.push(data.vehicle_type.trim());
      }
      if (data.vehicle_number !== undefined) {
        updates.push('vehicle_number = ?');
        params.push(data.vehicle_number.trim());
      }
      if (data.address !== undefined) {
        updates.push('address = ?');
        params.push(data.address.trim());
      }
      if (data.avatar_url !== undefined) {
        updates.push('avatar_url = ?');
        params.push(data.avatar_url.trim());
      }

      if (updates.length > 0) {
        params.push(riderId);
        const stmt = db.prepare(`UPDATE riders SET ${updates.join(', ')} WHERE id = ?`);
        stmt.run(...params);
      }

      const row = db.prepare(`
        SELECT id, full_name, phone_number, email, vehicle_type, vehicle_number, driving_license, nid_number, address, avatar_url, status, total_deliveries, rating, earnings, created_at
        FROM riders
        WHERE id = ?
      `).get(riderId);
      return (row as SafeRider) || null;
    });
  } finally {
    db.close();
  }
}

export function getRiderDeliveriesFromDb(riderId: number): any[] {
  const db = getDb();
  try {
    // Deliveries assigned to this rider or pending orders available for pickup
    const stmt = db.prepare(`
      SELECT o.id, o.customer_name, o.phone_number, o.delivery_address, o.total_amount, o.payment_method, o.order_notes, o.status, o.created_at, o.rider_id
      FROM orders o
      WHERE o.rider_id = ? OR (o.rider_id IS NULL AND o.status = 'Confirmed')
      ORDER BY o.id DESC
      LIMIT 20
    `);
    const rows = stmt.all(riderId) as any[];

    for (const order of rows) {
      const items = db.prepare('SELECT id, food_name, price, quantity FROM order_items WHERE order_id = ?').all(order.id) as any[];
      for (const item of items) {
        item.addons = db.prepare('SELECT addon_name, price FROM order_item_addons WHERE order_item_id = ?').all(item.id);
      }
      order.items = items;
    }

    return rows;
  } finally {
    db.close();
  }
}

// Multi-step DML transaction: updates order status via stored procedure
// If delivered, executes sp_complete_order_delivery (increments rider deliveries, credits earnings, queues rating prompt)
// If cancelled, executes sp_cancel_order (restores inventory stock, sets payment refunded/failed, frees rider)
export function updateOrderStatusByRiderInDb(orderId: number, riderId: number, status: string): boolean {
  const db = getDb();
  try {
    if (status === 'Delivered') {
      return sp_complete_order_delivery(db, orderId, riderId);
    }
    if (status === 'Cancelled') {
      return sp_cancel_order(db, orderId, 'Rider');
    }
    return executeTransaction(db, () => {
      const stmt = db.prepare(`
        UPDATE orders
        SET status = ?, rider_id = ?
        WHERE id = ?
      `);
      const info = stmt.run(status, riderId, orderId);
      return info.changes > 0;
    });
  } finally {
    db.close();
  }
}

/**
 * STORED PROCEDURE WRAPPER: cancelOrderInDb
 * Invokes sp_cancel_order to cancel an order, restore stock, refund payment, and release rider.
 */
export function cancelOrderInDb(orderId: number, cancelledBy: string, reason?: string): boolean {
  const db = getDb();
  try {
    return sp_cancel_order(db, orderId, cancelledBy, reason);
  } finally {
    db.close();
  }
}

/**
 * STORED PROCEDURE WRAPPER: updateFoodStockInDb
 * Invokes sp_update_food_stock to safely alter stock and auto-synchronize availability.
 */
export function updateFoodStockInDb(foodId: number, quantityDelta: number): { newStock: number; isAvailable: boolean } {
  const db = getDb();
  try {
    return sp_update_food_stock(db, foodId, quantityDelta);
  } finally {
    db.close();
  }
}

/**
 * STORED PROCEDURE WRAPPER: assignRiderToOrderInDb
 * Invokes sp_assign_rider to bind an available rider to an order.
 */
export function assignRiderToOrderInDb(orderId: number, riderId: number): boolean {
  const db = getDb();
  try {
    return sp_assign_rider(db, orderId, riderId);
  } finally {
    db.close();
  }
}

/**
 * STORED PROCEDURE WRAPPER: recalculateRestaurantRatingsInDb
 * Invokes sp_recalculate_restaurant_ratings to update overall restaurant score.
 */
export function recalculateRestaurantRatingsInDb(restaurantId: number): number {
  const db = getDb();
  try {
    return sp_recalculate_restaurant_ratings(db, restaurantId);
  } finally {
    db.close();
  }
}

// ============================================================
// PAYMENT SCHEMA DATABASE QUERIES
// ============================================================

export function createPaymentRecordInDb(record: {
  order_id: number;
  user_id?: number | null;
  amount: number;
  currency?: string;
  payment_method: string;
  payment_status?: PaymentStatus;
  transaction_id?: string;
  payment_gateway?: string;
  gateway_response?: string;
}): PaymentRecord {
  const db = getDb();
  try {
    return executeTransaction(db, () => {
      const stmt = db.prepare(`
        INSERT INTO payments (order_id, user_id, amount, currency, payment_method, payment_status, transaction_id, payment_gateway, gateway_response)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(
        record.order_id,
        record.user_id || null,
        record.amount,
        record.currency || 'BDT',
        record.payment_method,
        record.payment_status || 'Pending',
        record.transaction_id || null,
        record.payment_gateway || null,
        record.gateway_response || null
      );

      return {
        id: info.lastInsertRowid as number,
        order_id: record.order_id,
        user_id: record.user_id,
        amount: record.amount,
        currency: record.currency || 'BDT',
        payment_method: record.payment_method,
        payment_status: record.payment_status || 'Pending',
        transaction_id: record.transaction_id,
        payment_gateway: record.payment_gateway,
        gateway_response: record.gateway_response,
        paid_at: null,
      };
    });
  } finally {
    db.close();
  }
}

export function getPaymentByOrderIdFromDb(orderId: number): PaymentRecord | null {
  const db = getDb();
  try {
    const stmt = db.prepare('SELECT * FROM payments WHERE order_id = ?');
    const row = stmt.get(orderId);
    return (row as PaymentRecord) || null;
  } finally {
    db.close();
  }
}

// ---- Wishlist Types ----
export interface WishlistRecord {
  id: number;
  user_id: number;
  created_at?: string;
}

export interface WishlistItemRecord {
  id: number;
  wishlist_id: number;
  food_id: number;
  added_at?: string;
}

// ---- Wishlist Functions ----

/** Find or create a wishlist for the user, returns wishlist id */
function getOrCreateWishlist(db: Database.Database, userId: number): number {
  const existing = db.prepare('SELECT id FROM wishlists WHERE user_id = ?').get(userId) as { id: number } | undefined;
  if (existing) return existing.id;
  const info = db.prepare('INSERT INTO wishlists (user_id) VALUES (?)').run(userId);
  return info.lastInsertRowid as number;
}

/** Toggle wishlist: adds item if not present, removes if already present. Returns true if now wishlisted. Protected by explicit BEGIN TRANSACTION -> COMMIT / ROLLBACK */
export function toggleWishlistItemInDb(userId: number, foodId: number): boolean {
  const db = getDb();
  try {
    db.exec('BEGIN TRANSACTION');
    try {
      const wishlistId = getOrCreateWishlist(db, userId);
      const existing = db.prepare('SELECT id FROM wishlist_items WHERE wishlist_id = ? AND food_id = ?').get(wishlistId, foodId);
      let result: boolean;
      if (existing) {
        db.prepare('DELETE FROM wishlist_items WHERE wishlist_id = ? AND food_id = ?').run(wishlistId, foodId);
        result = false;
      } else {
        db.prepare('INSERT INTO wishlist_items (wishlist_id, food_id) VALUES (?, ?)').run(wishlistId, foodId);
        result = true;
      }
      db.exec('COMMIT');
      return result;
    } catch (txError) {
      if (db.inTransaction) {
        db.exec('ROLLBACK');
      }
      throw txError;
    }
  } finally {
    db.close();
  }
}

/** Get all food items in the user's wishlist with full food details */
export function getWishlistItemsForUserFromDb(userId: number): FoodItem[] {
  const db = getDb();
  try {
    const rows = db.prepare(`
      SELECT fi.*, r.name AS restaurant_name, r.image_url AS restaurant_logo
      FROM wishlist_items wi
      JOIN wishlists w ON wi.wishlist_id = w.id
      JOIN food_items fi ON wi.food_id = fi.id
      LEFT JOIN restaurants r ON fi.restaurant_id = r.id
      WHERE w.user_id = ?
      ORDER BY wi.added_at DESC
    `).all(userId) as any[];
    return rows.map(formatFoodItem);
  } finally {
    db.close();
  }
}

/** Get all food IDs in the user's wishlist (lightweight, for heart-icon state) */
export function getWishlistFoodIdsForUserFromDb(userId: number): number[] {
  const db = getDb();
  try {
    const rows = db.prepare(`
      SELECT wi.food_id
      FROM wishlist_items wi
      JOIN wishlists w ON wi.wishlist_id = w.id
      WHERE w.user_id = ?
    `).all(userId) as { food_id: number }[];
    return rows.map(r => r.food_id);
  } finally {
    db.close();
  }
}

/** Check if a single food item is in user's wishlist */
export function isInWishlistFromDb(userId: number, foodId: number): boolean {
  const db = getDb();
  try {
    const row = db.prepare(`
      SELECT 1
      FROM wishlist_items wi
      JOIN wishlists w ON wi.wishlist_id = w.id
      WHERE w.user_id = ? AND wi.food_id = ?
    `).get(userId, foodId);
    return !!row;
  } finally {
    db.close();
  }
}

// ============================================================
// FOOD RATINGS & RESTAURANT RECALCULATION QUERIES
// ============================================================

/**
 * Check whether an order belongs to the given customer.
 * Returns false for orders that do not exist, so a caller can treat
 * "not found" and "not yours" the same way without leaking existence.
 */
export function orderBelongsToUser(orderId: number, userId: number): boolean {
  const db = getDb();
  try {
    const row = db.prepare('SELECT 1 AS ok FROM orders WHERE id = ? AND user_id = ?').get(orderId, userId);
    return !!row;
  } finally {
    db.close();
  }
}

/**
 * Get a delivered order belonging to THIS user that has not been rated yet.
 *
 * Ownership is enforced in every lookup: an order is only ever returned when
 * `orders.user_id` matches the authenticated user. The previous version
 * returned orders with no `user_id` predicate at all when a specific orderId
 * or a localStorage candidate list was supplied, and fell back to "newest
 * delivered unrated order in the whole table" for anonymous callers, so one
 * customer was shown another customer's review prompt.
 *
 * Resolution order (all scoped to userId):
 * 1. the specific orderId, if the caller asked for one
 * 2. that orderId appearing in the caller's localStorage candidates
 * 3. the user's oldest pending customer_rating_prompts entry
 * 4. the user's most recent delivered unrated order
 *
 * Returns null when there is no session or nothing is pending.
 */
export function getPendingRatingOrderForUser(
  userId?: number | null,
  orderId?: number | null,
  candidateOrderIds?: number[]
): PendingRatingOrder | null {
  const db = getDb();
  try {
    // Without an authenticated customer there is no owner to scope to, so
    // there is nothing we can safely return.
    if (!userId) return null;

    // "Delivered but not yet rated", qualified by alias because the prompt
    // lookup joins two tables that both have a `status` column.
    const unrated = (a: string) =>
      `${a}.status = 'Delivered' AND (${a}.needs_rating = 1 OR ${a}.is_rated = 0 OR ${a}.is_rated IS NULL)`;
    let orderRow: any = null;

    if (orderId) {
      orderRow = db.prepare(`
        SELECT o.* FROM orders o
        WHERE o.id = ? AND o.user_id = ? AND ${unrated('o')}
      `).get(orderId, userId);
    }

    if (!orderRow && candidateOrderIds && candidateOrderIds.length > 0) {
      const placeholders = candidateOrderIds.map(() => '?').join(',');
      orderRow = db.prepare(`
        SELECT o.* FROM orders o
        WHERE o.id IN (${placeholders}) AND o.user_id = ? AND ${unrated('o')}
        ORDER BY o.id DESC LIMIT 1
      `).get(...candidateOrderIds, userId);
    }

    // Check customer_rating_prompts table created by trigger.
    // Joined to orders so the prompt row and the order owner must agree.
    if (!orderRow) {
      orderRow = db.prepare(`
        SELECT o.* FROM customer_rating_prompts p
        JOIN orders o ON o.id = p.order_id
        WHERE p.status = 'pending' AND p.user_id = ? AND o.user_id = ? AND ${unrated('o')}
        ORDER BY p.id ASC LIMIT 1
      `).get(userId, userId);
    }

    if (!orderRow) {
      orderRow = db.prepare(`
        SELECT o.* FROM orders o
        WHERE o.user_id = ? AND ${unrated('o')}
        ORDER BY o.id DESC LIMIT 1
      `).get(userId);
    }

    if (!orderRow) return null;

    // Final guard: never hand back an order owned by somebody else, whatever
    // the branches above matched.
    if (Number(orderRow.user_id) !== Number(userId)) return null;

    // Fetch items with food & restaurant information
    const items = db.prepare(`
      SELECT 
        oi.id,
        oi.order_id,
        oi.food_id,
        oi.food_name,
        oi.price,
        oi.quantity,
        f.image_url,
        f.rating as current_food_rating,
        f.restaurant_id,
        r.name as restaurant_name,
        r.image_url as restaurant_logo,
        r.rating as restaurant_rating
      FROM order_items oi
      LEFT JOIN food_items f ON oi.food_id = f.id
      LEFT JOIN restaurants r ON f.restaurant_id = r.id
      WHERE oi.order_id = ?
    `).all(orderRow.id) as any[];

    // Extract restaurant info from first item or fallback to restaurant 1
    let restId = 1;
    let restName = 'Restaurant';
    let restLogo = '';
    let restRating = 4.8;

    for (const it of items) {
      if (it.restaurant_id) {
        restId = it.restaurant_id;
        restName = it.restaurant_name || restName;
        restLogo = it.restaurant_logo || restLogo;
        restRating = Number(it.restaurant_rating) || restRating;
        break;
      }
    }

    if (restName === 'Restaurant') {
      const r = db.prepare('SELECT id, name, image_url, rating FROM restaurants WHERE id = ?').get(restId) as any;
      if (r) {
        restName = r.name;
        restLogo = r.image_url || '';
        restRating = Number(r.rating) || 4.8;
      }
    }

    return {
      id: orderRow.id,
      user_id: orderRow.user_id,
      rider_id: orderRow.rider_id,
      customer_name: orderRow.customer_name,
      phone_number: orderRow.phone_number,
      delivery_address: orderRow.delivery_address,
      total_amount: Number(orderRow.total_amount),
      status: orderRow.status,
      is_rated: Number(orderRow.is_rated || 0),
      created_at: orderRow.created_at,
      restaurant_id: restId,
      restaurant_name: restName,
      restaurant_logo: restLogo,
      restaurant_rating: restRating,
      items: items.map(it => ({
        id: it.id,
        order_id: it.order_id,
        food_id: it.food_id,
        food_name: it.food_name,
        price: Number(it.price),
        quantity: Number(it.quantity),
        image_url: it.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
        current_food_rating: Number(it.current_food_rating || 4.8),
      })),
    };
  } finally {
    db.close();
  }
}

/**
 * Submit ratings for all foods in a delivered order.
 * Inserts into food_ratings; SQLite triggers automatically:
 *  - Update food rating (avg of all ratings)
 *  - Update restaurant rating (avg of food ratings)
 *  - Mark order is_rated=1 and needs_rating=0 once all items rated
 *  - Close the customer_rating_prompts entry
 */
export function submitOrderRatingsInDb(
  orderId: number,
  userId: number | null,
  ratings: OrderFoodRatingInput[]
): SubmitOrderRatingsResult {
  const db = getDb();
  try {
    // Explicit transaction control: all rating inserts and trigger updates happen atomically
    db.exec('BEGIN TRANSACTION');
    try {
      // 1. Verify order exists
      const order = db.prepare('SELECT id, status, is_rated FROM orders WHERE id = ?').get(orderId) as any;
      if (!order) {
        throw new Error(`Order #${orderId} was not found`);
      }

      const updatedFoods: { foodId: number; foodName: string; newRating: number }[] = [];
      let primaryRestId = 1;
      let primaryRestName = 'Restaurant';
      let prevRestRating = 4.8;

      // 2. Insert food ratings — triggers handle the rest
      for (const item of ratings) {
        const food = db.prepare('SELECT id, name, restaurant_id, rating FROM food_items WHERE id = ?').get(item.food_id) as any;
        if (!food) continue;

        const restId = food.restaurant_id || 1;
        primaryRestId = restId;
        primaryRestName = food.restaurant_name || primaryRestName;

        const restRow = db.prepare('SELECT name, rating FROM restaurants WHERE id = ?').get(restId) as any;
        if (restRow) {
          primaryRestName = restRow.name;
          prevRestRating = Number(restRow.rating) || 4.8;
        }

        const ratingVal = Math.min(5, Math.max(1, Number(item.rating) || 5));

        // Insert — triggers auto-update food rating, restaurant rating, order status
        db.prepare(`
          INSERT OR IGNORE INTO food_ratings (order_id, food_id, restaurant_id, user_id, rating, review_text)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(orderId, item.food_id, restId, userId, ratingVal, item.review_text?.trim() || null);

        updatedFoods.push({
          foodId: item.food_id,
          foodName: food.name,
          newRating: ratingVal,
        });
      }

      // 3. Read updated restaurant rating (trigger already updated it)
      const restRow = db.prepare('SELECT rating FROM restaurants WHERE id = ?').get(primaryRestId) as any;
      const newRestRating = restRow ? Number(restRow.rating) || prevRestRating : prevRestRating;

      // Explicit COMMIT
      db.exec('COMMIT');

      return {
        orderId,
        restaurantId: primaryRestId,
        restaurantName: primaryRestName,
        previousRestaurantRating: prevRestRating,
        newRestaurantRating: newRestRating,
        updatedFoods,
      };
    } catch (txError) {
      // Explicit ROLLBACK if any rating operation fails
      if (db.inTransaction) {
        db.exec('ROLLBACK');
      }
      throw txError;
    }
  } finally {
    db.close();
  }
}

// ============================================================
// USER ORDERS HISTORY
// ============================================================

export interface UserOrderSummary {
  id: number;
  status: string;
  total_amount: number;
  delivery_location: string;
  delivery_address: string;
  payment_method: string;
  is_rated: number;
  needs_rating: number;
  created_at: string;
  rider_name: string | null;
  estimated_delivery_time?: string;
  delivery_fee?: number;
  order_summary?: string;
  items: { food_name: string; quantity: number; price: number }[];
}

/**
 * Get all orders for a specific user, newest first, with item summaries and rider info.
 * Leverages database UDFs: estimate_delivery_time, calculate_delivery_fee, and format_order_summary.
 */
export function getUserOrdersFromDb(userId: number): UserOrderSummary[] {
  const db = getDb();
  try {
    const orders = db.prepare(`
      SELECT o.id, o.status, o.total_amount, o.delivery_location, o.delivery_address,
             o.payment_method, o.is_rated, o.needs_rating, o.created_at,
             r.full_name as rider_name,
             estimate_delivery_time(o.delivery_location, o.status) as estimated_delivery_time,
             calculate_delivery_fee(o.delivery_location, o.total_amount) as delivery_fee,
             format_order_summary(o.customer_name, o.total_amount, o.payment_method) as order_summary
      FROM orders o
      LEFT JOIN riders r ON o.rider_id = r.id
      WHERE o.user_id = ?
      ORDER BY o.id DESC
    `).all(userId) as any[];

    return orders.map((order) => {
      const items = db.prepare(`
        SELECT food_name, quantity, price FROM order_items WHERE order_id = ?
      `).all(order.id) as any[];
      return {
        id: order.id,
        status: order.status,
        total_amount: Number(order.total_amount),
        delivery_location: order.delivery_location || 'Dhanmondi',
        delivery_address: order.delivery_address || '',
        payment_method: order.payment_method || 'Cash on Delivery',
        is_rated: Number(order.is_rated || 0),
        needs_rating: Number(order.needs_rating || 0),
        created_at: order.created_at,
        rider_name: order.rider_name || null,
        estimated_delivery_time: order.estimated_delivery_time,
        delivery_fee: Number(order.delivery_fee || 0),
        order_summary: order.order_summary,
        items: items.map((it) => ({
          food_name: it.food_name,
          quantity: Number(it.quantity),
          price: Number(it.price),
        })),
      };
    });
  } finally {
    db.close();
  }
}

// ============================================================
// RIDER LOCATION UPDATE
// ============================================================

/**
 * Update a rider's current delivery zone location.
 * When rider is Available, trigger will auto-assign pending orders in that zone.
 * Protected by explicit transaction control (BEGIN -> COMMIT / ROLLBACK).
 */
export function updateRiderLocationInDb(riderId: number, location: string): boolean {
  const db = getDb();
  try {
    return executeTransaction(db, () => {
      const result = db.prepare(`
        UPDATE riders SET location = ? WHERE id = ?
      `).run(location, riderId);
      return result.changes > 0;
    });
  } finally {
    db.close();
  }
}

// ============================================================
// POPULAR, TRENDING, TOP 5 ORDERED & MOST RATED FOOD ITEMS (AREA-AWARE)
// ============================================================

export interface TopOrderedFoodItem extends FoodItem {
  rank: number;
  total_ordered: number;
  order_count: number;
}

export interface MostRatedFoodItem extends FoodItem {
  review_count: number;
}

export interface FeaturedFoodResponse {
  userArea: string | null;
  selectedArea: string;
  availableAreas: string[];
  top5MostOrdered: TopOrderedFoodItem[];
  /** Items most frequently added to wishlists across all users */
  mostWishlisted: FoodItem[];
  mostRated: MostRatedFoodItem[];
}

/**
 * Identify a user's primary/most frequent delivery location from their past orders.
 * Returns null if the user has no past orders.
 */
export function getUserDeliveryAreaFromDb(userId: number, externalDb?: Database.Database): string | null {
  const db = externalDb || getDb();
  const shouldClose = !externalDb;
  try {
    const row = db.prepare(`
      SELECT delivery_location, COUNT(*) as cnt
      FROM orders
      WHERE user_id = ? AND delivery_location IS NOT NULL AND TRIM(delivery_location) != ''
      GROUP BY delivery_location
      ORDER BY cnt DESC, id DESC
      LIMIT 1
    `).get(userId) as { delivery_location: string } | undefined;

    if (row && row.delivery_location) {
      return row.delivery_location;
    }

    // Fallback: check user registered address string for known neighborhood names
    const user = db.prepare(`SELECT address FROM users WHERE id = ?`).get(userId) as { address?: string } | undefined;
    if (user?.address) {
      const addr = user.address.toLowerCase();
      const knownAreas = ['Dhanmondi', 'Gulshan', 'Banani', 'Mirpur', 'Uttara', 'Mohakhali', 'Badda', 'Bashundhara'];
      for (const a of knownAreas) {
        if (addr.includes(a.toLowerCase())) {
          return a;
        }
      }
    }

    return null;
  } finally {
    if (shouldClose) db.close();
  }
}

/**
 * Returns all distinct delivery areas found in orders, with standard Dhaka zones.
 */
export function getAvailableDeliveryAreasFromDb(externalDb?: Database.Database): string[] {
  const db = externalDb || getDb();
  const shouldClose = !externalDb;
  try {
    const rows = db.prepare(`
      SELECT DISTINCT delivery_location
      FROM orders
      WHERE delivery_location IS NOT NULL AND TRIM(delivery_location) != ''
      ORDER BY delivery_location ASC
    `).all() as { delivery_location: string }[];

    const defaultAreas = ['Dhanmondi', 'Gulshan', 'Banani', 'Mirpur', 'Uttara'];
    const areas = rows.map((r) => r.delivery_location);
    return Array.from(new Set([...areas, ...defaultAreas]));
  } finally {
    if (shouldClose) db.close();
  }
}

/**
 * Get Featured Food Items including:
 * 1. Top 5 Most Ordered items (by total quantity in area or citywide, with #1-#5 ranking)
 * 2. Trending food items (recent orders + rating momentum score)
 * 3. Most rated food items (highest customer satisfaction & review counts)
 * 4. Popular products (top favorites)
 *
 * Fully area-aware: if area is specified (or resolved from user's order history),
 * recommendations prioritize dishes popular in that neighborhood.
 */
export function getFeaturedFoodItemsFromDb(options?: {
  area?: string | null;
  userId?: number | null;
  limit?: number;
}): FeaturedFoodResponse {
  const db = getDb();
  try {
    let userArea: string | null = null;
    if (options?.userId) {
      userArea = getUserDeliveryAreaFromDb(options.userId, db);
    }

    // Determine area to filter by: explicit area override > user's order area > 'All'
    let selectedArea = 'All';
    if (options?.area && options.area.trim() !== '' && options.area.toLowerCase() !== 'all') {
      selectedArea = options.area.trim();
    } else if (userArea) {
      selectedArea = userArea;
    }

    const areaFilter = selectedArea !== 'All' ? selectedArea : null;
    const availableAreas = getAvailableDeliveryAreasFromDb(db);
    const limit = options?.limit || 8;

    // 1. Top 5 Most Ordered Items (Area specific, fallback backfilled if < 5)
    let topOrderedRows = db.prepare(`
      SELECT f.id, f.restaurant_id, f.name, f.description, f.base_price, f.sale_price,
             calculate_discount(f.base_price, f.sale_price) AS discount_percentage,
             get_food_stock_status(f.stock, f.is_available) AS stock_status,
             f.is_available, f.stock, f.category, f.rating, f.image_url, f.images_json, f.created_at,
             r.name as restaurant_name, r.image_url as restaurant_logo, r.rating as restaurant_rating,
             COALESCE(SUM(oi.quantity), 0) as total_ordered,
             COUNT(DISTINCT o.id) as order_count
      FROM food_items f
      JOIN order_items oi ON f.id = oi.food_id
      JOIN orders o ON oi.order_id = o.id
      LEFT JOIN restaurants r ON f.restaurant_id = r.id
      WHERE o.status != 'Cancelled'
        AND (? IS NULL OR LOWER(o.delivery_location) = LOWER(?))
      GROUP BY f.id
      ORDER BY total_ordered DESC, order_count DESC, f.rating DESC
      LIMIT 5
    `).all(areaFilter, areaFilter) as any[];

    // If fewer than 5 items found for this specific area, backfill from citywide most ordered items
    if (topOrderedRows.length < 5) {
      const existingIds = topOrderedRows.map((r) => r.id);
      const placeholders = existingIds.length > 0 ? existingIds.map(() => '?').join(',') : '0';
      const backfillLimit = 5 - topOrderedRows.length;

      const backfillRows = db.prepare(`
        SELECT f.id, f.restaurant_id, f.name, f.description, f.base_price, f.sale_price,
               calculate_discount(f.base_price, f.sale_price) AS discount_percentage,
               get_food_stock_status(f.stock, f.is_available) AS stock_status,
               f.is_available, f.stock, f.category, f.rating, f.image_url, f.images_json, f.created_at,
               r.name as restaurant_name, r.image_url as restaurant_logo, r.rating as restaurant_rating,
               COALESCE(SUM(oi.quantity), 0) as total_ordered,
               COUNT(DISTINCT o.id) as order_count
        FROM food_items f
        JOIN order_items oi ON f.id = oi.food_id
        JOIN orders o ON oi.order_id = o.id
        LEFT JOIN restaurants r ON f.restaurant_id = r.id
        WHERE o.status != 'Cancelled'
          AND f.id NOT IN (${placeholders})
        GROUP BY f.id
        ORDER BY total_ordered DESC, order_count DESC, f.rating DESC
        LIMIT ?
      `).all(...existingIds, backfillLimit) as any[];

      topOrderedRows = [...topOrderedRows, ...backfillRows];
    }

    // If still fewer than 5 (e.g. empty order table), backfill from top-rated food catalog
    if (topOrderedRows.length < 5) {
      const existingIds = topOrderedRows.map((r) => r.id);
      const placeholders = existingIds.length > 0 ? existingIds.map(() => '?').join(',') : '0';
      const backfillLimit = 5 - topOrderedRows.length;

      const catalogFallback = db.prepare(`
        SELECT f.id, f.restaurant_id, f.name, f.description, f.base_price, f.sale_price,
               calculate_discount(f.base_price, f.sale_price) AS discount_percentage,
               get_food_stock_status(f.stock, f.is_available) AS stock_status,
               f.is_available, f.stock, f.category, f.rating, f.image_url, f.images_json, f.created_at,
               r.name as restaurant_name, r.image_url as restaurant_logo, r.rating as restaurant_rating,
               0 as total_ordered,
               0 as order_count
        FROM food_items f
        LEFT JOIN restaurants r ON f.restaurant_id = r.id
        WHERE f.id NOT IN (${placeholders})
        ORDER BY f.rating DESC
        LIMIT ?
      `).all(...existingIds, backfillLimit) as any[];

      topOrderedRows = [...topOrderedRows, ...catalogFallback];
    }

    const top5MostOrdered: TopOrderedFoodItem[] = topOrderedRows.slice(0, 5).map((row, idx) => ({
      ...formatFoodItem(row),
      rank: idx + 1,
      total_ordered: Number(row.total_ordered || 0),
      order_count: Number(row.order_count || 0),
    }));

    // 2. Most Wishlisted Food Items (Items most frequently added to wishlists by all users)
    const mostWishlistedRows = db.prepare(`
      SELECT f.id, f.restaurant_id, f.name, f.description, f.base_price, f.sale_price,
             calculate_discount(f.base_price, f.sale_price) AS discount_percentage,
             get_food_stock_status(f.stock, f.is_available) AS stock_status,
             f.is_available, f.stock, f.category, f.rating, f.image_url, f.images_json, f.created_at,
             r.name as restaurant_name, r.image_url as restaurant_logo, r.rating as restaurant_rating,
             COUNT(wi.id) AS wishlist_count
      FROM food_items f
      LEFT JOIN wishlist_items wi ON f.id = wi.food_id
      LEFT JOIN restaurants r ON f.restaurant_id = r.id
      WHERE f.is_available = 1
      GROUP BY f.id
      ORDER BY wishlist_count DESC, f.rating DESC, f.id DESC
      LIMIT ?
    `).all(limit) as any[];

    const mostWishlisted: FoodItem[] = mostWishlistedRows.map(formatFoodItem);

    // 3. Most Rated Products (Ordered by rating and review volume in food_ratings)
    const mostRatedRows = db.prepare(`
      SELECT f.id, f.restaurant_id, f.name, f.description, f.base_price, f.sale_price,
             calculate_discount(f.base_price, f.sale_price) AS discount_percentage,
             get_food_stock_status(f.stock, f.is_available) AS stock_status,
             f.is_available, f.stock, f.category, f.rating, f.image_url, f.images_json, f.created_at,
             r.name as restaurant_name, r.image_url as restaurant_logo, r.rating as restaurant_rating,
             COUNT(fr.id) as review_count
      FROM food_items f
      LEFT JOIN food_ratings fr ON f.id = fr.food_id
      LEFT JOIN restaurants r ON f.restaurant_id = r.id
      WHERE f.is_available = 1
      GROUP BY f.id
      ORDER BY f.rating DESC, review_count DESC, f.sale_price ASC
      LIMIT ?
    `).all(limit) as any[];

    const mostRated: MostRatedFoodItem[] = mostRatedRows.map((row) => ({
      ...formatFoodItem(row),
      review_count: Number(row.review_count || 0),
    }));

    return {
      userArea,
      selectedArea,
      availableAreas,
      top5MostOrdered,
      mostWishlisted,
      mostRated,
    };
  } finally {
    db.close();
  }
}

