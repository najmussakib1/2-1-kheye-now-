-- ============================================================
-- DATABASE SCHEMA FOR KHEYE NOW! FOOD DELIVERY SYSTEM
-- CSE Database Course Project
-- ============================================================

-- ============================================================
-- Table: restaurants
-- ============================================================
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

-- ============================================================
-- Table: food_items (Single unified table for all foods)
-- ============================================================
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

-- ============================================================
-- Table: users
-- ============================================================
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

-- ============================================================
-- Table: riders (Delivery Rider Portfolio & Auth)
-- ============================================================
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
    location VARCHAR(100) DEFAULT 'Dhanmondi',
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
CREATE INDEX IF NOT EXISTS idx_riders_location ON riders(location);

-- ============================================================
-- Table: orders
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    rider_id INTEGER,
    customer_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    delivery_address TEXT NOT NULL,
    delivery_location VARCHAR(100) DEFAULT 'Dhanmondi',
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'Cash on Delivery',
    order_notes TEXT,
    status VARCHAR(50) DEFAULT 'Pending',
    is_rated BOOLEAN DEFAULT 0,
    needs_rating BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (rider_id) REFERENCES riders(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_rider_id ON orders(rider_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_location ON orders(delivery_location);

-- ============================================================
-- Table: order_items
-- ============================================================
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

-- ============================================================
-- Table: food_addons (Model for customizable food add-ons with photos)
-- ============================================================
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

-- ============================================================
-- Table: order_item_addons (Stores multiple add-ons per order item)
-- ============================================================
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

-- ============================================================
-- Table: payments (Payment Schema)
-- ============================================================
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

-- ============================================================
-- Table: wishlists (One wishlist per customer)
-- ============================================================
CREATE TABLE IF NOT EXISTS wishlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);

-- ============================================================
-- Table: wishlist_items (Many items per wishlist)
-- ============================================================
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

-- ============================================================
-- Table: food_ratings (Customer ratings for ordered foods)
-- ============================================================
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

-- ============================================================
-- Table: customer_rating_prompts (Rating prompt queue)
-- ============================================================
CREATE TABLE IF NOT EXISTS customer_rating_prompts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL UNIQUE,
    user_id INTEGER,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_rating_prompts_user_id ON customer_rating_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_rating_prompts_status ON customer_rating_prompts(status);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Trigger 1: Auto-assign order on creation to least engaged available rider in same location
CREATE TRIGGER IF NOT EXISTS trigger_assign_order_on_insert
AFTER INSERT ON orders
FOR EACH ROW
WHEN NEW.rider_id IS NULL AND NEW.status = 'Pending'
BEGIN
  UPDATE orders
  SET rider_id = (
    SELECT r.id FROM riders r
    WHERE r.status = 'Available' 
      AND LOWER(TRIM(r.location)) = LOWER(TRIM(NEW.delivery_location))
    ORDER BY (
      SELECT COUNT(*) FROM orders o 
      WHERE o.rider_id = r.id AND o.status IN ('Pending', 'Preparing', 'On the Way')
    ) ASC, r.total_deliveries ASC, r.id ASC
    LIMIT 1
  ),
  status = CASE 
    WHEN (
      SELECT r2.id FROM riders r2
      WHERE r2.status = 'Available' 
        AND LOWER(TRIM(r2.location)) = LOWER(TRIM(NEW.delivery_location))
      LIMIT 1
    ) IS NOT NULL THEN 'Preparing'
    ELSE 'Pending'
  END
  WHERE id = NEW.id
    AND (
      SELECT r3.id FROM riders r3
      WHERE r3.status = 'Available' 
        AND LOWER(TRIM(r3.location)) = LOWER(TRIM(NEW.delivery_location))
      LIMIT 1
    ) IS NOT NULL;
END;

-- Trigger 2: Auto-assign oldest pending order when a rider becomes 'Available' or updates location
CREATE TRIGGER IF NOT EXISTS trigger_assign_orders_when_rider_available
AFTER UPDATE OF status, location ON riders
FOR EACH ROW
WHEN NEW.status = 'Available'
BEGIN
  UPDATE orders
  SET rider_id = NEW.id,
      status = 'Preparing'
  WHERE id = (
    SELECT o.id FROM orders o
    WHERE o.rider_id IS NULL AND o.status = 'Pending'
      AND LOWER(TRIM(o.delivery_location)) = LOWER(TRIM(NEW.location))
    ORDER BY o.id ASC
    LIMIT 1
  );
END;

-- Trigger 3: Recalculate food rating & restaurant rating automatically when a user review is inserted
CREATE TRIGGER IF NOT EXISTS trigger_update_ratings_on_review
AFTER INSERT ON food_ratings
FOR EACH ROW
BEGIN
  -- 1. Update the food item rating to the average of all its customer reviews
  UPDATE food_items
  SET rating = ROUND((
    SELECT AVG(rating) FROM food_ratings WHERE food_id = NEW.food_id
  ), 2)
  WHERE id = NEW.food_id;

  -- 2. Update the restaurant rating to the average of all food items of this restaurant
  UPDATE restaurants
  SET rating = ROUND((
    SELECT AVG(rating) FROM food_items 
    WHERE restaurant_id = NEW.restaurant_id AND rating IS NOT NULL AND rating > 0
  ), 2)
  WHERE id = NEW.restaurant_id;

  -- 3. Mark the order as rated and complete the prompt
  UPDATE orders
  SET is_rated = 1, needs_rating = 0
  WHERE id = NEW.order_id;

  UPDATE customer_rating_prompts
  SET status = 'completed'
  WHERE order_id = NEW.order_id;
END;

-- Trigger 4: Prompt user for rating when order status becomes 'Delivered'
CREATE TRIGGER IF NOT EXISTS trigger_prompt_rating_on_delivery
AFTER UPDATE OF status ON orders
FOR EACH ROW
WHEN NEW.status = 'Delivered' AND (OLD.status != 'Delivered' OR OLD.status IS NULL)
BEGIN
  UPDATE orders
  SET needs_rating = 1, is_rated = 0
  WHERE id = NEW.id;

  INSERT OR REPLACE INTO customer_rating_prompts (order_id, user_id, status, created_at)
  VALUES (NEW.id, NEW.user_id, 'pending', CURRENT_TIMESTAMP);
END;
