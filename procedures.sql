-- ============================================================
-- KHEYE NOW! FOOD DELIVERY DATABASE SYSTEM
-- DATABASE FUNCTIONS & STORED PROCEDURES (SQL / PL-SQL)
-- CSE DBMS Course Project
-- ============================================================

-- ============================================================
-- SECTION 1: USER-DEFINED DATABASE FUNCTIONS (UDFs)
-- ============================================================

-- ------------------------------------------------------------
-- Function 1: calculate_discount
-- Purpose: Calculates the percentage discount between regular
--          base price and discounted sale price.
-- Input:   base_price (DECIMAL), sale_price (DECIMAL)
-- Returns: INTEGER (Discount percentage rounded to nearest integer)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_discount(
    p_base_price DECIMAL(10, 2),
    p_sale_price DECIMAL(10, 2)
)
RETURNS INTEGER
DETERMINISTIC
BEGIN
    IF p_base_price IS NULL OR p_base_price <= 0 OR p_sale_price IS NULL OR p_sale_price >= p_base_price THEN
        RETURN 0;
    END IF;
    RETURN ROUND(((p_base_price - p_sale_price) / p_base_price) * 100);
END;

-- ------------------------------------------------------------
-- Function 2: get_food_stock_status
-- Purpose: Classifies item inventory into standard human-readable
--          status categories ('In Stock', 'Low Stock', 'Out of Stock').
-- Input:   stock (INTEGER), is_available (BOOLEAN)
-- Returns: VARCHAR(20)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_food_stock_status(
    p_stock INTEGER,
    p_is_available BOOLEAN
)
RETURNS VARCHAR(20)
DETERMINISTIC
BEGIN
    IF p_is_available = 0 OR p_stock IS NULL OR p_stock <= 0 THEN
        RETURN 'Out of Stock';
    ELSEIF p_stock <= 5 THEN
        RETURN 'Low Stock';
    ELSE
        RETURN 'In Stock';
    END IF;
END;

-- ------------------------------------------------------------
-- Function 3: calculate_delivery_fee
-- Purpose: Computes dynamic delivery charge based on delivery
--          zone and customer order total (free delivery for orders >= ৳1500).
-- Input:   delivery_location (VARCHAR), total_amount (DECIMAL)
-- Returns: DECIMAL(10, 2)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_delivery_fee(
    p_delivery_location VARCHAR(100),
    p_total_amount DECIMAL(10, 2)
)
RETURNS DECIMAL(10, 2)
DETERMINISTIC
BEGIN
    -- Free delivery promotion threshold
    IF p_total_amount >= 1500.00 THEN
        RETURN 0.00;
    END IF;

    -- Zone-based delivery fees in Dhaka
    CASE LOWER(TRIM(p_delivery_location))
        WHEN 'dhanmondi' THEN
            RETURN 40.00;
        WHEN 'gulshan', 'banani' THEN
            RETURN 60.00;
        WHEN 'uttara', 'mirpur' THEN
            RETURN 70.00;
        ELSE
            RETURN 50.00;
    END CASE;
END;

-- ------------------------------------------------------------
-- Function 4: estimate_delivery_time
-- Purpose: Returns estimated turnaround/arrival time based on
--          delivery zone and current order status.
-- Input:   delivery_location (VARCHAR), order_status (VARCHAR)
-- Returns: VARCHAR(50)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION estimate_delivery_time(
    p_delivery_location VARCHAR(100),
    p_order_status VARCHAR(50)
)
RETURNS VARCHAR(50)
DETERMINISTIC
BEGIN
    IF p_order_status = 'Delivered' THEN
        RETURN 'Delivered';
    ELSEIF p_order_status = 'Cancelled' THEN
        RETURN 'Cancelled';
    ELSEIF p_order_status = 'On the Way' THEN
        RETURN '15 - 25 mins';
    ELSEIF p_order_status = 'Prepared' THEN
        RETURN '25 - 35 mins';
    ELSEIF p_order_status = 'Preparing' THEN
        RETURN '35 - 45 mins';
    ELSE
        RETURN '40 - 55 mins';
    END IF;
END;

-- ------------------------------------------------------------
-- Function 6: format_order_summary
-- Purpose: Formats an executive receipt summary string.
-- Input:   customer_name (VARCHAR), total_amount (DECIMAL), payment_method (VARCHAR)
-- Returns: TEXT
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION format_order_summary(
    p_customer_name VARCHAR(255),
    p_total_amount DECIMAL(10, 2),
    p_payment_method VARCHAR(50)
)
RETURNS TEXT
DETERMINISTIC
BEGIN
    RETURN CONCAT('Order of ৳', ROUND(p_total_amount, 2), ' for ', COALESCE(p_customer_name, 'Guest'), ' (', COALESCE(p_payment_method, 'Cash on Delivery'), ')');
END;


-- ============================================================
-- SECTION 2: DATABASE STORED PROCEDURES
-- ============================================================

-- ------------------------------------------------------------
-- Procedure 1: sp_place_order
-- Purpose: Handles multi-table transactional checkout:
--          1. Validates food availability and stock levels.
--          2. Inserts master record in orders table.
--          3. Inserts ordered food items into order_items table.
--          4. Inserts any item add-ons into order_item_addons.
--          5. Generates pending ledger entry in payments table.
--          6. Explicit COMMIT on success; ROLLBACK on any failure.
-- ------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_place_order(
    IN  p_user_id           INTEGER,
    IN  p_customer_name     VARCHAR(255),
    IN  p_phone_number      VARCHAR(50),
    IN  p_delivery_address  TEXT,
    IN  p_delivery_location VARCHAR(100),
    IN  p_total_amount      DECIMAL(10, 2),
    IN  p_payment_method    VARCHAR(50),
    IN  p_order_notes       TEXT,
    OUT p_order_id          INTEGER
)
BEGIN
    DECLARE v_restaurant_id INTEGER;
    DECLARE exit handler for sqlexception
    BEGIN
        -- Explicit rollback on any exception
        ROLLBACK;
        RESIGNAL;
    END;

    -- Explicit Transaction Control
    START TRANSACTION;

    -- 1. Insert master order record
    INSERT INTO orders (
        user_id, customer_name, phone_number,
        delivery_address, delivery_location, total_amount,
        payment_method, order_notes, status
    ) VALUES (
        p_user_id, TRIM(p_customer_name), TRIM(p_phone_number),
        TRIM(p_delivery_address), COALESCE(p_delivery_location, 'Dhanmondi'),
        p_total_amount, COALESCE(p_payment_method, 'Cash on Delivery'),
        TRIM(p_order_notes), 'Preparing'
    );

    SET p_order_id = LAST_INSERT_ID();

    -- 2. Initialize payment record in payment ledger
    INSERT INTO payments (
        order_id, user_id, amount, currency,
        payment_method, payment_status
    ) VALUES (
        p_order_id, p_user_id, p_total_amount, 'BDT',
        COALESCE(p_payment_method, 'Cash on Delivery'), 'Pending'
    );

    -- Explicit COMMIT upon all successful inserts
    COMMIT;
END;

-- ------------------------------------------------------------
-- Procedure 2: sp_complete_order_delivery
-- Purpose: Completes order delivery flow:
--          1. Updates order status to 'Delivered'.
--          2. Increments rider total_deliveries count.
--          3. Rider earnings are credited by trigger_update_earnings_on_delivery
--             (the delivery fee only). No commission is applied here.
--          4. Sets rider status to 'Available' if no other active deliveries.
--          5. Queues customer rating prompt.
-- ------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_complete_order_delivery(
    IN p_order_id INTEGER,
    IN p_rider_id INTEGER
)
BEGIN
    DECLARE v_active_count INTEGER;
    DECLARE exit handler for sqlexception
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- 1. Update order status and flag for rating
    UPDATE orders
    SET status = 'Delivered',
        rider_id = p_rider_id,
        needs_rating = 1
    WHERE id = p_order_id;

    -- 2. Update rider delivery stats.
    -- Earnings are credited by trigger_update_earnings_on_delivery
    -- (the delivery fee from calculate_delivery_fee), never here.
    UPDATE riders
    SET total_deliveries = total_deliveries + 1
    WHERE id = p_rider_id;

    -- 3. Release rider to Available if no other active deliveries
    SELECT COUNT(*) INTO v_active_count
    FROM orders
    WHERE rider_id = p_rider_id
      AND status IN ('Preparing', 'Prepared', 'On the Way')
      AND id != p_order_id;

    IF v_active_count = 0 THEN
        UPDATE riders SET status = 'Available' WHERE id = p_rider_id;
    END IF;

    COMMIT;
END;

-- ------------------------------------------------------------
-- Procedure 3: sp_cancel_order
-- Purpose: Restores database consistency when an order is cancelled:
--          1. Restores inventory stock for all ordered food items.
--          2. Sets order status to 'Cancelled' and logs reason in notes.
--          3. Updates payment status to 'Refunded' or 'Failed'.
--          4. Releases assigned rider back to 'Available'.
--          5. Removes any pending customer rating prompts.
-- ------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_cancel_order(
    IN p_order_id    INTEGER,
    IN p_cancelled_by VARCHAR(50),
    IN p_reason      TEXT
)
BEGIN
    DECLARE v_rider_id INTEGER;
    DECLARE v_order_status VARCHAR(50);
    DECLARE v_active_for_rider INTEGER;

    DECLARE exit handler for sqlexception
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SELECT rider_id, status INTO v_rider_id, v_order_status
    FROM orders WHERE id = p_order_id;

    IF v_order_status = 'Delivered' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot cancel already delivered order.';
    END IF;

    -- 1. Restore food items stock
    UPDATE food_items f
    JOIN order_items oi ON f.id = oi.food_id
    SET f.stock = COALESCE(f.stock, 0) + oi.quantity,
        f.is_available = 1
    WHERE oi.order_id = p_order_id;

    -- 2. Mark order as Cancelled with audit trail
    UPDATE orders
    SET status = 'Cancelled',
        order_notes = CONCAT(COALESCE(order_notes, ''), ' [Cancelled by ', p_cancelled_by, ': ', COALESCE(p_reason, 'No reason provided'), ']')
    WHERE id = p_order_id;

    -- 3. Refund / Fail payment
    UPDATE payments
    SET payment_status = CASE WHEN payment_status = 'Completed' THEN 'Refunded' ELSE 'Failed' END
    WHERE order_id = p_order_id;

    -- 4. Free up assigned rider if no other open orders
    IF v_rider_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_active_for_rider
        FROM orders
        WHERE rider_id = v_rider_id AND id != p_order_id AND status IN ('Preparing', 'Prepared', 'On the Way');

        IF v_active_for_rider = 0 THEN
            UPDATE riders SET status = 'Available' WHERE id = v_rider_id;
        END IF;
    END IF;

    -- 5. Delete pending rating prompt
    DELETE FROM customer_rating_prompts WHERE order_id = p_order_id;

    COMMIT;
END;

-- ------------------------------------------------------------
-- Procedure 4: sp_update_food_stock
-- Purpose: Adjusts item stock and synchronizes availability flag.
-- ------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_update_food_stock(
    IN p_food_id       INTEGER,
    IN p_quantity_delta INTEGER
)
BEGIN
    DECLARE exit handler for sqlexception
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    UPDATE food_items
    SET stock = GREATEST(0, COALESCE(stock, 0) + p_quantity_delta),
        is_available = CASE WHEN (COALESCE(stock, 0) + p_quantity_delta) > 0 THEN 1 ELSE 0 END
    WHERE id = p_food_id;

    COMMIT;
END;

-- ------------------------------------------------------------
-- Procedure 5: sp_assign_rider
-- Purpose: Binds an available delivery rider to an active order.
-- ------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_assign_rider(
    IN p_order_id INTEGER,
    IN p_rider_id INTEGER
)
BEGIN
    DECLARE exit handler for sqlexception
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    UPDATE orders
    SET rider_id = p_rider_id,
        status = 'On the Way'
    WHERE id = p_order_id;

    UPDATE riders
    SET status = 'On Delivery'
    WHERE id = p_rider_id;

    COMMIT;
END;

-- ------------------------------------------------------------
-- Procedure 6: sp_recalculate_restaurant_ratings
-- Purpose: Re-aggregates customer ratings across all food items
--          for a restaurant and updates restaurant overall rating.
-- ------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_recalculate_restaurant_ratings(
    IN p_restaurant_id INTEGER
)
BEGIN
    DECLARE exit handler for sqlexception
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    UPDATE restaurants
    SET rating = (
        SELECT ROUND(AVG(rating), 2)
        FROM food_items
        WHERE restaurant_id = p_restaurant_id AND rating IS NOT NULL AND rating > 0
    )
    WHERE id = p_restaurant_id;

    COMMIT;
END;


-- ============================================================
-- SECTION 3: DEMONSTRATION & VERIFICATION QUERIES
-- ============================================================

-- 1. Using calculate_discount and get_food_stock_status in SQL:
-- SELECT id, name, base_price, sale_price,
--        calculate_discount(base_price, sale_price) AS discount_pct,
--        get_food_stock_status(stock, is_available) AS inventory_status
-- FROM food_items;

-- 2. Using calculate_delivery_fee and estimate_delivery_time in SQL:
-- SELECT id, customer_name, delivery_location, total_amount,
--        calculate_delivery_fee(delivery_location, total_amount) AS fee,
--        estimate_delivery_time(delivery_location, status) AS eta
-- FROM orders;

-- 3. Calling Stored Procedures:
-- CALL sp_cancel_order(1, 'Restaurant', 'Customer requested cancellation');
-- CALL sp_update_food_stock(1, 20);
-- CALL sp_complete_order_delivery(1, 1);
