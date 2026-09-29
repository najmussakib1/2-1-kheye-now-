-- ============================================================
-- SEED DATA FOR KHEYE NOW! FOOD DELIVERY SYSTEM
-- ============================================================

-- Seed basic_restaurant (Default password: 'salt:derivedKey' generated for 123456)
-- Password '123456' hash
INSERT OR IGNORE INTO restaurants (id, name, owner_name, email, phone_number, address, trade_licence_url, categories, image_url, rating, password_hash)
VALUES (
    1,
    'basic_restaurant',
    'Main Kitchen Master',
    'basic_restaurant@kheyenow.com',
    '01700000000',
    'Dhanmondi 27, Dhaka',
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    'Fast Food, Juice, Desi Feast, Burgers, Pizza, Pasta, Desserts, Beverages',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
    4.9,
    -- scrypt hash for '123456'
    'd87f9d9c7e755ed84c7092660df034f8:51a9da9af4f74665948697818469aae4bc49296cba770638e252bed9372640e951535b700a9c20ce600f72da19f13fade0b97912250a69c5d5e8f8827a169f2d'
);

-- Food items linked to basic_restaurant (restaurant_id = 1)
INSERT INTO food_items (restaurant_id, name, description, base_price, sale_price, is_available, category, rating, image_url, images_json) VALUES
-- Desi Feast
(1, 'Royal Kacchi Biryani', 'Authentic Dhaka style fragrant Basmati rice with tender mutton, potatoes, and signature spices.', 450.00, 380.00, 1, 'Desi Feast', 4.9, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800&auto=format&fit=crop&q=80"]'),
(1, 'Chittagong Beef Kala Bhuna', 'Traditional slow-cooked dark caramelized tender beef cooked with heritage spices & mustard oil.', 480.00, 420.00, 1, 'Desi Feast', 5.0, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80"]'),
(1, 'Special Beef Tehari', 'Mustard oil cooked tender beef chunks cooked with aromatic short-grain rice & green chillies.', 320.00, 280.00, 1, 'Desi Feast', 4.9, 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800&auto=format&fit=crop&q=80"]'),
(1, 'Hyderabadi Chicken Dum Biryani', 'Marinated chicken layered with saffron Basmati rice, fried onions, and fresh mint.', 390.00, 340.00, 1, 'Desi Feast', 4.8, 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=800&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=800&auto=format&fit=crop&q=80"]'),

-- Burgers & Chicken
(1, 'Smokey BBQ Smash Burger', 'Double juicy beef patties, melted cheddar, crispy bacon, caramelized onions & secret BBQ sauce.', 350.00, 299.00, 1, 'Burgers', 4.8, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&auto=format&fit=crop&q=80"]'),
(1, 'Crispy Naga Chicken Burger', 'Super spicy naga pepper glazed fried chicken thigh patty, jalapenos, melted cheese & mayo.', 310.00, 260.00, 1, 'Burgers', 4.7, 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=800&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=800&auto=format&fit=crop&q=80"]'),
(1, 'Crispy Naga Fried Chicken (4 pcs)', 'Spicy naga pepper marinated crispy fried chicken legs & thighs served with mint dip.', 360.00, 299.00, 1, 'Burgers', 4.8, 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800&auto=format&fit=crop&q=80"]'),
(1, 'Classic Double Cheeseburger', 'Two flame-grilled beef patties, double American cheese, pickles, onions & house burger sauce.', 290.00, 240.00, 1, 'Burgers', 4.6, 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&auto=format&fit=crop&q=80"]'),

-- Pizza
(1, 'Truffle Mushroom Pizza', 'Hand-tossed sourdough pizza topped with wild mushrooms, truffle oil, mozzarella & fresh basil.', 650.00, 549.00, 1, 'Pizza', 4.7, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80"]'),
(1, 'Ultimate Pepperoni Feast Pizza', 'Loaded with double pepperoni, mozzarella, parmesan and house marinara sauce.', 690.00, 599.00, 1, 'Pizza', 4.8, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&auto=format&fit=crop&q=80"]'),
(1, 'BBQ Grilled Chicken Pizza', 'Smokey barbecue chicken, red onions, bell peppers, cilantro and smoked gouda cheese.', 620.00, 520.00, 1, 'Pizza', 4.7, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80"]'),

-- Pasta
(1, 'Creamy Alfredo Chicken Pasta', 'Fettuccine in rich garlic parmesan cream sauce with grilled chicken breast and herbs.', 420.00, 360.00, 1, 'Pasta', 4.6, 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&auto=format&fit=crop&q=80"]'),
(1, 'Spicy Garlic Butter Prawn Pasta', 'Penne pasta tossed with succulent prawns, chili flakes, garlic, white wine & parsley.', 490.00, 430.00, 1, 'Pasta', 4.9, 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800&auto=format&fit=crop&q=80"]'),

-- Desserts
(1, 'Molten Lava Chocolate Cake', 'Warm chocolate cake with a molten chocolate center served with vanilla bean ice cream.', 250.00, 199.00, 1, 'Desserts', 4.9, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&auto=format&fit=crop&q=80"]'),
(1, 'Royal Shahi Falooda', 'Traditional cold dessert with rose syrup, vermicelli, sweet basil seeds, ice cream & dry fruits.', 220.00, 180.00, 1, 'Desserts', 4.8, 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=800&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=800&auto=format&fit=crop&q=80"]'),
(1, 'Nutella Belgian Waffle', 'Freshly baked warm waffle drizzled with generous Nutella, crushed hazelnut & whipped cream.', 260.00, 220.00, 1, 'Desserts', 4.7, 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=800&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=800&auto=format&fit=crop&q=80"]'),

-- Beverages & Juice
(1, 'Mango Passionfruit Smoothie', 'Refreshing blended fresh mango, passionfruit pulp, Greek yogurt and honey.', 180.00, 149.00, 1, 'Juice', 4.7, 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&auto=format&fit=crop&q=80"]'),
(1, 'Matcha Green Tea Boba Shake', 'Premium Japanese matcha green tea latte with chewy tapioca boba pearls.', 220.00, 185.00, 1, 'Beverages', 4.6, 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=800&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1558857563-b371033873b8?w=800&auto=format&fit=crop&q=80"]'),
(1, 'Iced Salted Caramel Macchiato', 'Espresso shot with cold milk, salted caramel drizzle, and vanilla syrup over ice.', 200.00, 165.00, 1, 'Beverages', 4.8, 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&auto=format&fit=crop&q=80"]'),
(1, 'Fresh Cold-Pressed Orange Juice', '100% pure fresh Valencia oranges pressed fresh with crushed ice and mint.', 160.00, 130.00, 1, 'Juice', 4.9, 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800&auto=format&fit=crop&q=80"]');

-- ============================================================
-- Seed Sample Rider (Password '123456')
-- ============================================================
INSERT OR IGNORE INTO riders (
    id, full_name, phone_number, email, vehicle_type, vehicle_number, driving_license, nid_number, address, avatar_url, status, total_deliveries, rating, earnings, password_hash
) VALUES (
    1,
    'Rahim Ahmed',
    '01800000000',
    'rider@kheyenow.com',
    'Motorcycle',
    'Dhaka Metro-HA-11-2233',
    'DL-882391024',
    '19962691234567890',
    'Mirpur 10, Dhaka',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    'Available',
    142,
    4.95,
    14250.00,
    -- scrypt hash for '123456'
    'd87f9d9c7e755ed84c7092660df034f8:51a9da9af4f74665948697818469aae4bc49296cba770638e252bed9372640e951535b700a9c20ce600f72da19f13fade0b97912250a69c5d5e8f8827a169f2d'
);

-- ============================================================
-- Seed Food Add-ons with Pictures for Restaurant 1
-- ============================================================
INSERT INTO food_addons (food_id, restaurant_id, name, price, image_url, is_available) VALUES
-- Addons for Royal Kacchi Biryani (food_id: 1)
(1, 1, 'Extra Tender Mutton Piece', 120.00, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop&q=80', 1),
(1, 1, 'Special Shahi Borhani (250ml)', 60.00, 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400&auto=format&fit=crop&q=80', 1),
(1, 1, 'Golden Boiled Egg (1 pc)', 25.00, 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&auto=format&fit=crop&q=80', 1),
(1, 1, 'Aloo Bokhara Chutney', 30.00, 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=400&auto=format&fit=crop&q=80', 1),

-- Addons for Smokey BBQ Smash Burger (food_id: 5)
(5, 1, 'Melted Cheddar Cheese Slice', 45.00, 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400&auto=format&fit=crop&q=80', 1),
(5, 1, 'Crispy Beef Bacon Strips (2 pcs)', 75.00, 'https://images.unsplash.com/photo-1528607929212-2636ec44253e?w=400&auto=format&fit=crop&q=80', 1),
(5, 1, 'Extra Truffle BBQ Sauce Dip', 35.00, 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=400&auto=format&fit=crop&q=80', 1),
(5, 1, 'Spicy Caramelized Jalapenos', 30.00, 'https://images.unsplash.com/photo-1588644525273-f37b60d78512?w=400&auto=format&fit=crop&q=80', 1),

-- Addons for Truffle Mushroom Pizza (food_id: 9)
(9, 1, 'Extra Stuffed Mozzarella Crust', 95.00, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80', 1),
(9, 1, 'Spicy Beef Pepperoni Topping', 85.00, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&auto=format&fit=crop&q=80', 1),
(9, 1, 'Garlic Herb Cream Dip', 35.00, 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=400&auto=format&fit=crop&q=80', 1),

-- Addons for Creamy Alfredo Chicken Pasta (food_id: 12)
(12, 1, 'Extra Sautéed Garlic Mushrooms', 60.00, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&auto=format&fit=crop&q=80', 1),
(12, 1, 'Grilled Chicken Strips', 70.00, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&auto=format&fit=crop&q=80', 1),
(12, 1, 'Parmesan Cheese Crust Topping', 45.00, 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&auto=format&fit=crop&q=80', 1);

-- ============================================================
-- Seed Sample Users (Password '123456')
-- ============================================================
INSERT OR IGNORE INTO users (id, full_name, phone_number, email, address, gender, password_hash)
VALUES
(1, 'Sakib Ahmed', '01711000001', 'sakib@example.com', 'Road 8A, Dhanmondi, Dhaka', 'Male', 'd87f9d9c7e755ed84c7092660df034f8:51a9da9af4f74665948697818469aae4bc49296cba770638e252bed9372640e951535b700a9c20ce600f72da19f13fade0b97912250a69c5d5e8f8827a169f2d'),
(2, 'Nafis Rahman', '01711000002', 'nafis@example.com', 'Road 11, Banani, Dhaka', 'Male', 'd87f9d9c7e755ed84c7092660df034f8:51a9da9af4f74665948697818469aae4bc49296cba770638e252bed9372640e951535b700a9c20ce600f72da19f13fade0b97912250a69c5d5e8f8827a169f2d');

-- ============================================================
-- Seed Sample Orders Across Different Areas in Dhaka
-- ============================================================
INSERT INTO orders (id, user_id, rider_id, customer_name, phone_number, delivery_address, delivery_location, total_amount, payment_method, order_notes, status, is_rated)
VALUES
-- Dhanmondi Orders (User 1)
(1, 1, 1, 'Sakib Ahmed', '01711000001', 'House 14, Road 8A, Dhanmondi, Dhaka', 'Dhanmondi', 1250.00, 'Cash on Delivery', 'Ring the bell twice on 3rd floor', 'Delivered', 1),
(2, 1, 1, 'Sakib Ahmed', '01711000001', 'House 22, Road 27, Dhanmondi, Dhaka', 'Dhanmondi', 1680.00, 'bKash', 'Please leave with security', 'Delivered', 1),
(3, 1, 1, 'Sakib Ahmed', '01711000001', 'House 8, Road 4, Dhanmondi, Dhaka', 'Dhanmondi', 980.00, 'bKash', 'Contact on arrival', 'Delivered', 1),
(4, NULL, 1, 'Ayesha Khan', '01722334455', 'Shimanto Square, Dhanmondi, Dhaka', 'Dhanmondi', 2150.00, 'Cash on Delivery', 'Extra cutlery please', 'Delivered', 1),

-- Gulshan Orders (User 2)
(5, 2, 1, 'Nafis Rahman', '01711000002', 'Road 45, Gulshan 2, Dhaka', 'Gulshan', 2600.00, 'Credit Card', 'Call when downstairs', 'Delivered', 1),
(6, 2, 1, 'Nafis Rahman', '01711000002', 'Avenue 1, Gulshan 1, Dhaka', 'Gulshan', 1750.00, 'bKash', 'Deliver to reception', 'Delivered', 1),

-- Banani Orders (User 2)
(7, 2, 1, 'Nafis Rahman', '01711000002', 'Road 11, Block D, Banani, Dhaka', 'Banani', 2450.00, 'bKash', 'Apartment 4B', 'Delivered', 1),

-- Mirpur Orders
(8, NULL, 1, 'Farhan Kabir', '01911223344', 'Section 10, Mirpur, Dhaka', 'Mirpur', 1420.00, 'Cash on Delivery', 'Near Benarasi Palli', 'Delivered', 1),
(9, NULL, 1, 'Farhan Kabir', '01911223344', 'Section 2, Mirpur, Dhaka', 'Mirpur', 850.00, 'Cash on Delivery', '', 'Delivered', 1),

-- Uttara Orders
(10, NULL, 1, 'Sadia Islam', '01811223344', 'Sector 7, Uttara, Dhaka', 'Uttara', 1980.00, 'bKash', 'House 12, Road 5', 'Delivered', 1);

-- ============================================================
-- Seed Order Items (Connecting orders to food_items)
-- ============================================================
INSERT INTO order_items (id, order_id, food_id, food_name, price, quantity) VALUES
-- Order 1 (Dhanmondi)
(1, 1, 1, 'Royal Kacchi Biryani', 380.00, 3),
(2, 1, 17, 'Mango Passionfruit Smoothie', 149.00, 2),

-- Order 2 (Dhanmondi)
(3, 2, 1, 'Royal Kacchi Biryani', 380.00, 4),
(4, 2, 5, 'Smokey BBQ Smash Burger', 299.00, 3),
(5, 2, 20, 'Fresh Cold-Pressed Orange Juice', 130.00, 2),

-- Order 3 (Dhanmondi)
(6, 3, 5, 'Smokey BBQ Smash Burger', 299.00, 4),
(7, 3, 14, 'Molten Lava Chocolate Cake', 199.00, 2),

-- Order 4 (Dhanmondi)
(8, 4, 1, 'Royal Kacchi Biryani', 380.00, 5),
(9, 4, 2, 'Chittagong Beef Kala Bhuna', 420.00, 3),

-- Order 5 (Gulshan)
(10, 5, 9, 'Truffle Mushroom Pizza', 549.00, 5),
(11, 5, 10, 'Ultimate Pepperoni Feast Pizza', 599.00, 4),
(12, 5, 13, 'Spicy Garlic Butter Prawn Pasta', 430.00, 3),

-- Order 6 (Gulshan)
(13, 6, 9, 'Truffle Mushroom Pizza', 549.00, 3),
(14, 6, 12, 'Creamy Alfredo Chicken Pasta', 360.00, 4),
(15, 6, 19, 'Iced Salted Caramel Macchiato', 165.00, 3),

-- Order 7 (Banani)
(16, 7, 10, 'Ultimate Pepperoni Feast Pizza', 599.00, 5),
(17, 7, 9, 'Truffle Mushroom Pizza', 549.00, 4),
(18, 7, 11, 'BBQ Grilled Chicken Pizza', 520.00, 3),

-- Order 8 (Mirpur)
(19, 8, 3, 'Special Beef Tehari', 280.00, 6),
(20, 8, 6, 'Crispy Naga Chicken Burger', 260.00, 5),
(21, 8, 7, 'Crispy Naga Fried Chicken (4 pcs)', 299.00, 4),

-- Order 9 (Mirpur)
(22, 9, 3, 'Special Beef Tehari', 280.00, 4),
(23, 9, 15, 'Royal Shahi Falooda', 180.00, 3),

-- Order 10 (Uttara)
(24, 10, 4, 'Hyderabadi Chicken Dum Biryani', 340.00, 5),
(25, 10, 16, 'Nutella Belgian Waffle', 220.00, 4),
(26, 10, 8, 'Classic Double Cheeseburger', 240.00, 3);

-- Seed Addons for Order 1
INSERT INTO order_item_addons (order_item_id, addon_id, addon_name, price)
VALUES (1, 1, 'Extra Tender Mutton Piece', 120.00), (1, 2, 'Golden Boiled Egg (1 pc)', 25.00);

-- ============================================================
-- Seed Customer Food Ratings
-- ============================================================
INSERT INTO food_ratings (order_id, food_id, restaurant_id, user_id, rating, review_text) VALUES
(1, 1, 1, 1, 5.0, 'Best Kacchi in Dhanmondi! Super tender mutton.'),
(2, 5, 1, 1, 4.9, 'Crispy, smoky beef patty with melted cheese.'),
(3, 14, 1, 1, 5.0, 'Rich warm chocolate core, delightful dessert!'),
(5, 9, 1, 2, 4.8, 'Sourdough crust was airy and truffle aroma was intense!'),
(6, 12, 1, 2, 4.7, 'Very creamy parmesan Alfredo sauce, loved it.'),
(7, 10, 1, 2, 4.9, 'Loaded with savory pepperoni slices, crispy crust!'),
(8, 3, 1, NULL, 5.0, 'Authentic mustard oil tehari flavor, unbeatable!'),
(10, 4, 1, NULL, 4.8, 'Fragrant dum biryani with tender chicken.');

