import Database from 'better-sqlite3';
import path from 'path';

export interface FoodItem {
  id: number;
  name: string;
  description: string;
  base_price: number;
  sale_price: number;
  is_available: number | boolean;
  category: string;
  rating: number;
  image_url: string;
  created_at?: string;
}

export interface User {
  id: number;
  full_name: string;
  phone_number: string;
  email: string;
  address?: string;
  gender?: string;
  password_hash: string;
  created_at?: string;
}

export type SafeUser = Omit<User, 'password_hash'>;

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
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name VARCHAR(255) NOT NULL,
        phone_number VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        address TEXT,
        gender VARCHAR(20),
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

// SQL Query method to get all food items or filter by category
export function getFoodItemsFromDb(category?: string): FoodItem[] {
  const db = getDb();
  try {
    if (category && category.toLowerCase() !== 'all') {
      const stmt = db.prepare(`
        SELECT id, name, description, base_price, sale_price, is_available, category, rating, image_url, created_at 
        FROM food_items 
        WHERE category = ? 
        ORDER BY id DESC
      `);
      return stmt.all(category) as FoodItem[];
    } else {
      const stmt = db.prepare(`
        SELECT id, name, description, base_price, sale_price, is_available, category, rating, image_url, created_at 
        FROM food_items 
        ORDER BY id DESC
      `);
      return stmt.all() as FoodItem[];
    }
  } finally {
    db.close();
  }
}

// SQL Query method to get a single food item by ID
export function getFoodItemByIdFromDb(id: number): FoodItem | null {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      SELECT id, name, description, base_price, sale_price, is_available, category, rating, image_url, created_at 
      FROM food_items 
      WHERE id = ?
    `);
    const result = stmt.get(id);
    return (result as FoodItem) || null;
  } finally {
    db.close();
  }
}

// SQL Query method to get 5 similar products (same category or popular)
export function getSimilarFoodItemsFromDb(currentId: number, category: string, limit = 5): FoodItem[] {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      SELECT id, name, description, base_price, sale_price, is_available, category, rating, image_url, created_at 
      FROM food_items 
      WHERE id != ? AND (category = ? OR 1=1)
      ORDER BY (CASE WHEN category = ? THEN 0 ELSE 1 END), id DESC
      LIMIT ?
    `);
    return stmt.all(currentId, category, category, limit) as FoodItem[];
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
  password_hash: string;
}): SafeUser {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      INSERT INTO users (full_name, phone_number, email, address, gender, password_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      user.full_name,
      user.phone_number,
      user.email.toLowerCase(),
      user.address || null,
      user.gender || null,
      user.password_hash
    );

    return {
      id: info.lastInsertRowid as number,
      full_name: user.full_name,
      phone_number: user.phone_number,
      email: user.email.toLowerCase(),
      address: user.address,
      gender: user.gender,
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
      SELECT id, full_name, phone_number, email, address, gender, password_hash, created_at 
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
      SELECT id, full_name, phone_number, email, address, gender, created_at 
      FROM users 
      WHERE id = ?
    `);
    const user = stmt.get(id);
    return (user as SafeUser) || null;
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

