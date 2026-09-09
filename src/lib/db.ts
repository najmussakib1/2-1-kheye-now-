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
  total_amount: number;
  payment_method?: string;
  order_notes?: string;
  items: OrderItemInput[];
}

export interface OrderRecord {
  id: number;
  user_id: number | null;
  rider_id?: number | null;
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
  `);
  
  // Graceful column additions for existing sqlite database
  try {
    db.exec(`ALTER TABLE orders ADD COLUMN rider_id INTEGER REFERENCES riders(id) ON DELETE SET NULL;`);
  } catch {
    // column might already exist
  }

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
        INSERT INTO orders (user_id, rider_id, customer_name, phone_number, delivery_address, total_amount, payment_method, order_notes, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed')
      `);
      
      const orderResult = orderStmt.run(
        input.user_id || null,
        input.rider_id || null,
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

      // Automatically initialize pending payment record in payment schema
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

      return orderId;
    });

    const orderId = insertOrderTx();
    return { orderId };
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

    return getAddonByIdFromDb(addonId);
  } finally {
    db.close();
  }
}

export function deleteAddonInDb(addonId: number, restaurantId: number): boolean {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      DELETE FROM food_addons
      WHERE id = ? AND restaurant_id = ?
    `);
    const info = stmt.run(addonId, restaurantId);
    return info.changes > 0;
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
      SELECT id, full_name, phone_number, email, vehicle_type, vehicle_number, driving_license, nid_number, address, avatar_url, status, total_deliveries, rating, earnings, created_at
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
    const stmt = db.prepare(`
      UPDATE riders
      SET status = ?
      WHERE id = ?
    `);
    const info = stmt.run(status, riderId);
    return info.changes > 0;
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

    if (updates.length === 0) return findRiderByIdFromDb(riderId);

    params.push(riderId);
    const stmt = db.prepare(`UPDATE riders SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...params);

    return findRiderByIdFromDb(riderId);
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

export function updateOrderStatusByRiderInDb(orderId: number, riderId: number, status: string): boolean {
  const db = getDb();
  try {
    const updateTx = db.transaction(() => {
      const stmt = db.prepare(`
        UPDATE orders
        SET status = ?, rider_id = ?
        WHERE id = ?
      `);
      const info = stmt.run(status, riderId, orderId);

      // If status is 'Delivered', increment rider total_deliveries and add ৳50 delivery commission to earnings
      if (status === 'Delivered') {
        db.prepare(`
          UPDATE riders
          SET total_deliveries = total_deliveries + 1,
              earnings = earnings + 50.00
          WHERE id = ?
        `).run(riderId);
      }

      return info.changes > 0;
    });

    return updateTx();
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

/** Toggle wishlist: adds item if not present, removes if already present. Returns true if now wishlisted. */
export function toggleWishlistItemInDb(userId: number, foodId: number): boolean {
  const db = getDb();
  try {
    const wishlistId = getOrCreateWishlist(db, userId);
    const existing = db.prepare('SELECT id FROM wishlist_items WHERE wishlist_id = ? AND food_id = ?').get(wishlistId, foodId);
    if (existing) {
      db.prepare('DELETE FROM wishlist_items WHERE wishlist_id = ? AND food_id = ?').run(wishlistId, foodId);
      return false;
    } else {
      db.prepare('INSERT INTO wishlist_items (wishlist_id, food_id) VALUES (?, ?)').run(wishlistId, foodId);
      return true;
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
