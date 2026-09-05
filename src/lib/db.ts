import Database from 'better-sqlite3';
import path from 'path';

export interface FoodItem {
  id: number;
  restaurant_id?: number;
  name: string;
  description: string;
  base_price: number;
  sale_price: number;
  is_available: number | boolean;
  category: string;
  rating: number;
  image_url: string;
  images?: string[];
  images_json?: string;
  created_at?: string;
  restaurant_name?: string;
  restaurant_logo?: string;
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
  password_hash: string;
  created_at?: string;
}

export type SafeRestaurant = Omit<Restaurant, 'password_hash'>;

export interface OrderItemInput {
  food_id?: number;
  food_name: string;
  price: number;
  quantity: number;
}

export interface CreateOrderInput {
  user_id?: number | null;
  customer_name: string;
  phone_number: string;
  delivery_address: string;
  total_amount: number;
  payment_method?: string;
  order_notes?: string;
  items: OrderItemInput[];
}

export interface OrderRecord {
  id: number;
  user_id: number | null;
  customer_name: string;
  phone_number: string;
  delivery_address: string;
  total_amount: number;
  payment_method: string;
  order_notes?: string;
  status: string;
  created_at: string;
  items?: OrderItemInput[];
}

const DB_PATH = path.join(process.cwd(), 'kheye_now.db');

// Helper to open database connection safely in Next.js environment
export function getDb() {
  const db = new Database(DB_PATH, { verbose: process.env.NODE_ENV === 'development' ? console.log : undefined });
  db.pragma('foreign_keys = ON');
  
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

    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        customer_name VARCHAR(255) NOT NULL,
        phone_number VARCHAR(50) NOT NULL,
        delivery_address TEXT NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'Cash on Delivery',
        order_notes TEXT,
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
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
  `);
  
  return db;
}

function formatFoodItem(row: any): FoodItem {
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
  return {
    ...row,
    images,
    images_json: row.images_json || JSON.stringify(images),
  };
}

// SQL Query method to get all food items or filter by category, restaurant, or search term
export function getFoodItemsFromDb(category?: string, restaurantId?: number, search?: string): FoodItem[] {
  const db = getDb();
  try {
    let query = `
      SELECT f.id, f.restaurant_id, f.name, f.description, f.base_price, f.sale_price, f.is_available, f.category, f.rating, f.image_url, f.images_json, f.created_at, r.name as restaurant_name, r.image_url as restaurant_logo 
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

// SQL Query method to get a single food item by ID
export function getFoodItemByIdFromDb(id: number): FoodItem | null {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      SELECT f.id, f.restaurant_id, f.name, f.description, f.base_price, f.sale_price, f.is_available, f.category, f.rating, f.image_url, f.images_json, f.created_at, r.name as restaurant_name, r.image_url as restaurant_logo 
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

// SQL Query method to get 5 similar products (same category or popular)
export function getSimilarFoodItemsFromDb(currentId: number, category: string, limit = 5): FoodItem[] {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      SELECT f.id, f.restaurant_id, f.name, f.description, f.base_price, f.sale_price, f.is_available, f.category, f.rating, f.image_url, f.images_json, f.created_at, r.name as restaurant_name, r.image_url as restaurant_logo 
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

// Add a new food item for a restaurant (supports multiple images)
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
}): FoodItem {
  const db = getDb();
  try {
    const imagesList = item.images && item.images.length > 0
      ? item.images
      : item.image_url ? [item.image_url] : [];
    const imagesJson = item.images_json || JSON.stringify(imagesList);
    const coverImage = imagesList[0] || item.image_url || '';

    const stmt = db.prepare(`
      INSERT INTO food_items (restaurant_id, name, description, base_price, sale_price, category, image_url, images_json, is_available)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      item.is_available !== undefined ? (item.is_available ? 1 : 0) : 1
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
      is_available: item.is_available !== undefined ? Boolean(item.is_available) : true,
      rating: 4.8,
    };
  } finally {
    db.close();
  }
}

// Update food item in DB (supports editing all details and multiple images)
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
  }
): FoodItem | null {
  const db = getDb();
  try {
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
      imagesJson = current.images_json || '[]';
      try {
        imagesList = JSON.parse(imagesJson);
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
    const is_available = updates.is_available !== undefined ? (updates.is_available ? 1 : 0) : current.is_available;

    const stmt = db.prepare(`
      UPDATE food_items
      SET name = ?, description = ?, base_price = ?, sale_price = ?, category = ?, image_url = ?, images_json = ?, is_available = ?
      WHERE id = ? AND restaurant_id = ?
    `);
    stmt.run(name, description, base_price, sale_price, category, coverImage, imagesJson, is_available, itemId, restaurantId);

    return getFoodItemByIdFromDb(itemId);
  } finally {
    db.close();
  }
}

// Update food item availability
export function updateFoodItemAvailabilityInDb(itemId: number, restaurantId: number, isAvailable: boolean): boolean {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      UPDATE food_items 
      SET is_available = ? 
      WHERE id = ? AND restaurant_id = ?
    `);
    const info = stmt.run(isAvailable ? 1 : 0, itemId, restaurantId);
    return info.changes > 0;
  } finally {
    db.close();
  }
}

// Delete food item for a restaurant
export function deleteFoodItemInDb(itemId: number, restaurantId: number): boolean {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      DELETE FROM food_items 
      WHERE id = ? AND restaurant_id = ?
    `);
    const info = stmt.run(itemId, restaurantId);
    return info.changes > 0;
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

    if (updates.length === 0) return findUserByIdFromDb(userId);

    params.push(userId);
    const stmt = db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...params);

    return findUserByIdFromDb(userId);
  } finally {
    db.close();
  }
}

export function updateUserAddressInDb(userId: number, address: string): void {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      UPDATE users 
      SET address = ? 
      WHERE id = ?
    `);
    stmt.run(address.trim(), userId);
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
    const current = findRestaurantByIdFromDb(id);
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

    return findRestaurantByIdFromDb(id);
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

export function createOrderInDb(input: CreateOrderInput): { orderId: number } {
  const db = getDb();
  try {
    const insertOrderTx = db.transaction(() => {
      const orderStmt = db.prepare(`
        INSERT INTO orders (user_id, customer_name, phone_number, delivery_address, total_amount, payment_method, order_notes, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Confirmed')
      `);
      
      const orderResult = orderStmt.run(
        input.user_id || null,
        input.customer_name.trim(),
        input.phone_number.trim(),
        input.delivery_address.trim(),
        input.total_amount,
        input.payment_method || 'Cash on Delivery',
        input.order_notes?.trim() || null
      );

      const orderId = orderResult.lastInsertRowid as number;

      const itemStmt = db.prepare(`
        INSERT INTO order_items (order_id, food_id, food_name, price, quantity)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const item of input.items) {
        itemStmt.run(
          orderId,
          item.food_id || null,
          item.food_name,
          item.price,
          item.quantity
        );
      }

      return orderId;
    });

    const orderId = insertOrderTx();
    return { orderId };
  } finally {
    db.close();
  }
}
