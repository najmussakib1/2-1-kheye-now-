/**
 * ============================================================
 * COMPLEX SQL QUERIES MODULE
 * Kheye Now! Multi-Vendor Food Delivery System
 * ============================================================
 * This module isolates multi-table joins, subqueries, ranking,
 * aggregations, analytics, and complex business recommendation queries.
 */

import { getDb, formatFoodItem, type FoodItem, type TopOrderedFoodItem, type MostRatedFoodItem } from './db';

export interface MostRatedRestaurant {
  id: number;
  name: string;
  owner_name: string;
  email: string;
  phone_number: string;
  address: string;
  categories: string;
  image_url: string | null;
  rating: number;
  review_count: number;
  total_dishes: number;
}

export interface SuggestedAddon {
  addon_id: number;
  food_id: number;
  addon_name: string;
  price: number;
  times_added: number;
}

export interface RestaurantStatsData {
  mostOrderedItem: {
    id: number;
    name: string;
    total_quantity: number;
    order_count: number;
    image_url: string | null;
    sale_price: number;
  }[];
  mostRatedFood: {
    id: number;
    name: string;
    rating: number;
    review_count: number;
    image_url: string | null;
    sale_price: number;
  }[];
  mostOrderedLocation: {
    location: string;
    order_count: number;
    total_spent: number;
  }[];
  mostAddedAddon: {
    addon_id: number;
    name: string;
    price: number;
    times_added: number;
    food_name: string;
  }[];
  mostRevenueProduct: {
    id: number;
    name: string;
    total_quantity: number;
    total_revenue: number;
    image_url: string | null;
    sale_price: number;
  }[];
  overview: {
    totalRevenue: number;
    totalOrders: number;
    totalDelivered: number;
    avgOrderValue: number;
    totalItems: number;
  };
}

/**
 * ------------------------------------------------------------
 * COMPLEX QUERY 1: Most Rated Restaurants (Home Page)
 * ------------------------------------------------------------
 * Computes restaurant ranking according to rating and customer review count
 * aggregated from food_ratings.
 */
export function getMostRatedRestaurants(limit = 6): MostRatedRestaurant[] {
  const db = getDb();
  try {
    const rows = db.prepare(`
      SELECT 
        r.id, 
        r.name, 
        r.owner_name, 
        r.email, 
        r.phone_number, 
        r.address, 
        r.categories, 
        r.image_url, 
        r.rating,
        COUNT(DISTINCT fr.id) AS review_count,
        COUNT(DISTINCT f.id) AS total_dishes
      FROM restaurants r
      LEFT JOIN food_items f ON r.id = f.restaurant_id
      LEFT JOIN food_ratings fr ON r.id = fr.restaurant_id
      GROUP BY r.id
      ORDER BY r.rating DESC, review_count DESC, total_dishes DESC
      LIMIT ?
    `).all(limit) as any[];

    return rows.map((r) => ({
      id: Number(r.id),
      name: String(r.name),
      owner_name: String(r.owner_name || ''),
      email: String(r.email || ''),
      phone_number: String(r.phone_number || ''),
      address: String(r.address || ''),
      categories: String(r.categories || ''),
      image_url: r.image_url || null,
      rating: Number(r.rating || 0),
      review_count: Number(r.review_count || 0),
      total_dishes: Number(r.total_dishes || 0),
    }));
  } finally {
    db.close();
  }
}

/**
 * ------------------------------------------------------------
 * COMPLEX QUERY 2: Most Ordered Items from a Specific Restaurant
 * ------------------------------------------------------------
 * Returns top-ordered dishes belonging to the restaurant of the current item,
 * excluding the current item itself.
 */
export function getMostOrderedItemsByRestaurant(
  restaurantId: number,
  excludeFoodId?: number,
  limit = 5
): FoodItem[] {
  const db = getDb();
  try {
    const rows = db.prepare(`
      SELECT 
        f.id, f.restaurant_id, f.name, f.description, f.base_price, f.sale_price,
        calculate_discount(f.base_price, f.sale_price) AS discount_percentage,
        get_food_stock_status(f.stock, f.is_available) AS stock_status,
        f.is_available, f.stock, f.category, f.rating, f.image_url, f.images_json, f.created_at,
        r.name AS restaurant_name, r.image_url AS restaurant_logo, r.rating AS restaurant_rating,
        COALESCE(SUM(oi.quantity), 0) AS total_ordered
      FROM food_items f
      LEFT JOIN order_items oi ON f.id = oi.food_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'Cancelled'
      LEFT JOIN restaurants r ON f.restaurant_id = r.id
      WHERE f.restaurant_id = ? 
        AND (? IS NULL OR f.id != ?)
        AND f.is_available = 1
      GROUP BY f.id
      ORDER BY total_ordered DESC, f.rating DESC, f.id DESC
      LIMIT ?
    `).all(restaurantId, excludeFoodId || null, excludeFoodId || null, limit) as any[];

    return rows.map(formatFoodItem);
  } finally {
    db.close();
  }
}

/**
 * ------------------------------------------------------------
 * COMPLEX QUERY 3: Most Rated Items from a Specific Restaurant
 * ------------------------------------------------------------
 * Returns top rated food items from this restaurant with review counts,
 * excluding the current item itself.
 */
export function getMostRatedItemsByRestaurant(
  restaurantId: number,
  excludeFoodId?: number,
  limit = 5
): FoodItem[] {
  const db = getDb();
  try {
    const rows = db.prepare(`
      SELECT 
        f.id, f.restaurant_id, f.name, f.description, f.base_price, f.sale_price,
        calculate_discount(f.base_price, f.sale_price) AS discount_percentage,
        get_food_stock_status(f.stock, f.is_available) AS stock_status,
        f.is_available, f.stock, f.category, f.rating, f.image_url, f.images_json, f.created_at,
        r.name AS restaurant_name, r.image_url AS restaurant_logo, r.rating AS restaurant_rating,
        COUNT(fr.id) AS review_count
      FROM food_items f
      LEFT JOIN food_ratings fr ON f.id = fr.food_id
      LEFT JOIN restaurants r ON f.restaurant_id = r.id
      WHERE f.restaurant_id = ?
        AND (? IS NULL OR f.id != ?)
        AND f.is_available = 1
      GROUP BY f.id
      ORDER BY f.rating DESC, review_count DESC, f.sale_price ASC
      LIMIT ?
    `).all(restaurantId, excludeFoodId || null, excludeFoodId || null, limit) as any[];

    return rows.map(formatFoodItem);
  } finally {
    db.close();
  }
}

/**
 * ------------------------------------------------------------
 * COMPLEX QUERY 4: Most Added Add-ons for a Specific Food Item
 * ------------------------------------------------------------
 * Queries order_item_addons and order_items to compute which add-ons
 * have been chosen most frequently by customers for this specific food.
 */
export function getMostAddedAddonsForFood(foodId: number, limit = 5): SuggestedAddon[] {
  const db = getDb();
  try {
    const rows = db.prepare(`
      SELECT 
        fa.id AS addon_id,
        fa.food_id,
        fa.name AS addon_name,
        fa.price,
        COUNT(oia.id) AS times_added
      FROM food_addons fa
      LEFT JOIN order_item_addons oia ON fa.id = oia.addon_id
      LEFT JOIN order_items oi ON oia.order_item_id = oi.id
      WHERE fa.food_id = ? AND fa.is_available = 1
      GROUP BY fa.id
      ORDER BY times_added DESC, fa.price ASC
      LIMIT ?
    `).all(foodId, limit) as any[];

    return rows.map((r) => ({
      addon_id: Number(r.addon_id),
      food_id: Number(r.food_id),
      addon_name: String(r.addon_name),
      price: Number(r.price),
      times_added: Number(r.times_added || 0),
    }));
  } finally {
    db.close();
  }
}

/**
 * ------------------------------------------------------------
 * COMPLEX QUERY 5: Restaurant Analytics & Statistics Dashboard
 * ------------------------------------------------------------
 * Authorized query for restaurant dashboard stats page:
 * - Most Ordered Item
 * - Most Rated Food
 * - Most Ordered Location
 * - Most Added Add-ons
 * - Most Sell or Revenue Product
 * - Overall financial & order overview
 */
export function getRestaurantStatistics(restaurantId: number): RestaurantStatsData {
  const db = getDb();
  const TOP = 3;
  try {
    // 5.1 Most Ordered Item
    const mostOrderedRows = db.prepare(`
      SELECT 
        f.id, 
        f.name, 
        f.image_url, 
        f.sale_price,
        COALESCE(SUM(oi.quantity), 0) AS total_quantity,
        COUNT(DISTINCT o.id) AS order_count
      FROM food_items f
      JOIN order_items oi ON f.id = oi.food_id
      JOIN orders o ON oi.order_id = o.id
      WHERE f.restaurant_id = ? AND o.status != 'Cancelled'
      GROUP BY f.id
      ORDER BY total_quantity DESC, order_count DESC
      LIMIT ?
    `).all(restaurantId, TOP) as any[];

    const mostOrderedItem = mostOrderedRows.map((r) => ({
      id: Number(r.id),
      name: String(r.name),
      image_url: r.image_url || null,
      sale_price: Number(r.sale_price),
      total_quantity: Number(r.total_quantity || 0),
      order_count: Number(r.order_count || 0),
    }));

    // 5.2 Most Rated Food
    const mostRatedRows = db.prepare(`
      SELECT 
        f.id, 
        f.name, 
        f.image_url, 
        f.sale_price,
        f.rating,
        COUNT(fr.id) AS review_count
      FROM food_items f
      LEFT JOIN food_ratings fr ON f.id = fr.food_id
      WHERE f.restaurant_id = ?
      GROUP BY f.id
      ORDER BY f.rating DESC, review_count DESC
      LIMIT ?
    `).all(restaurantId, TOP) as any[];

    const mostRatedFood = mostRatedRows.map((r) => ({
      id: Number(r.id),
      name: String(r.name),
      image_url: r.image_url || null,
      sale_price: Number(r.sale_price),
      rating: Number(r.rating || 0),
      review_count: Number(r.review_count || 0),
    }));

    // 5.3 Most Ordered Location
    const mostOrderedLocationRows = db.prepare(`
      SELECT 
        o.delivery_location AS location,
        COUNT(DISTINCT o.id) AS order_count,
        COALESCE(SUM(o.total_amount), 0) AS total_spent
      FROM orders o
      WHERE o.restaurant_id = ? 
        AND o.status != 'Cancelled'
        AND o.delivery_location IS NOT NULL
        AND TRIM(o.delivery_location) != ''
      GROUP BY LOWER(o.delivery_location)
      ORDER BY order_count DESC, total_spent DESC
      LIMIT ?
    `).all(restaurantId, TOP) as any[];

    const mostOrderedLocation = mostOrderedLocationRows.map((r) => ({
      location: String(r.location),
      order_count: Number(r.order_count || 0),
      total_spent: Number(r.total_spent || 0),
    }));

    // 5.4 Most Added Add-on
    const mostAddedAddonRows = db.prepare(`
      SELECT 
        fa.id AS addon_id,
        fa.name AS name,
        fa.price AS price,
        f.name AS food_name,
        COUNT(oia.id) AS times_added
      FROM food_addons fa
      JOIN food_items f ON fa.food_id = f.id
      JOIN order_item_addons oia ON fa.id = oia.addon_id
      JOIN order_items oi ON oia.order_item_id = oi.id
      JOIN orders o ON oi.order_id = o.id
      WHERE fa.restaurant_id = ? AND o.status != 'Cancelled'
      GROUP BY fa.id
      ORDER BY times_added DESC
      LIMIT ?
    `).all(restaurantId, TOP) as any[];

    const mostAddedAddon = mostAddedAddonRows.map((r) => ({
      addon_id: Number(r.addon_id),
      name: String(r.name),
      price: Number(r.price || 0),
      times_added: Number(r.times_added || 0),
      food_name: String(r.food_name || ''),
    }));

    // 5.5 Most Sell or Revenue Product (Product generating highest total revenue = price * quantity)
    const mostRevenueRows = db.prepare(`
      SELECT 
        f.id,
        f.name,
        f.image_url,
        f.sale_price,
        COALESCE(SUM(oi.quantity), 0) AS total_quantity,
        COALESCE(SUM(oi.price * oi.quantity), 0) AS total_revenue
      FROM food_items f
      JOIN order_items oi ON f.id = oi.food_id
      JOIN orders o ON oi.order_id = o.id
      WHERE f.restaurant_id = ? AND o.status != 'Cancelled'
      GROUP BY f.id
      ORDER BY total_revenue DESC, total_quantity DESC
      LIMIT ?
    `).all(restaurantId, TOP) as any[];

    const mostRevenueProduct = mostRevenueRows.map((r) => ({
      id: Number(r.id),
      name: String(r.name),
      image_url: r.image_url || null,
      sale_price: Number(r.sale_price),
      total_quantity: Number(r.total_quantity || 0),
      total_revenue: Number(r.total_revenue || 0),
    }));

    // Overview Totals
    const overviewRow = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN o.status != 'Cancelled' THEN o.total_amount ELSE 0 END), 0) AS total_revenue,
        COUNT(DISTINCT o.id) AS total_orders,
        COUNT(DISTINCT CASE WHEN o.status = 'Delivered' THEN o.id END) AS total_delivered,
        (SELECT COUNT(*) FROM food_items WHERE restaurant_id = ?) AS total_items
      FROM orders o
      WHERE o.restaurant_id = ?
    `).get(restaurantId, restaurantId) as any;

    const totalRev = Number(overviewRow?.total_revenue || 0);
    const totalOrd = Number(overviewRow?.total_orders || 0);

    return {
      mostOrderedItem,
      mostRatedFood,
      mostOrderedLocation,
      mostAddedAddon,
      mostRevenueProduct,
      overview: {
        totalRevenue: totalRev,
        totalOrders: totalOrd,
        totalDelivered: Number(overviewRow?.total_delivered || 0),
        avgOrderValue: totalOrd > 0 ? Math.round(totalRev / totalOrd) : 0,
        totalItems: Number(overviewRow?.total_items || 0),
      },
    };
  } finally {
    db.close();
  }
}

/**
 * ------------------------------------------------------------
 * COMPLEX QUERY 6: Featured Food Items (Top 5 Most Ordered, Most Wishlisted, Most Rated)
 * ------------------------------------------------------------
 * Area-aware multi-table aggregation across:
 * - food_items, order_items, orders (rank-ordered top 5 by area with catalog backfills)
 * - food_items, wishlist_items (most wishlisted across customer accounts)
 * - food_items, food_ratings (most rated by verified diners)
 */
export function getFeaturedFoodItems(options?: {
  area?: string | null;
  userId?: number | null;
  limit?: number;
}) {
  // Delegate to or re-export the unified featured query from db
  const { getFeaturedFoodItemsFromDb } = require('./db');
  return getFeaturedFoodItemsFromDb(options);
}

