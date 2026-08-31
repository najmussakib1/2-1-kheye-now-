-- ============================================================
-- SEED DATA FOR KHEYE NOW! FOOD DELIVERY SYSTEM
-- SQL INSERT commands for food_items table
-- ============================================================

INSERT INTO food_items (name, description, base_price, sale_price, is_available, category, rating, image_url) VALUES
-- Desi Feast
('Royal Kacchi Biryani', 'Authentic Dhaka style fragrant Basmati rice with tender mutton, potatoes, and signature spices.', 450.00, 380.00, 1, 'Desi Feast', 4.9, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80'),
('Chittagong Beef Kala Bhuna', 'Traditional slow-cooked dark caramelized tender beef cooked with heritage spices & mustard oil.', 480.00, 420.00, 1, 'Desi Feast', 5.0, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80'),
('Special Beef Tehari', 'Mustard oil cooked tender beef chunks cooked with aromatic short-grain rice & green chillies.', 320.00, 280.00, 1, 'Desi Feast', 4.9, 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800&auto=format&fit=crop&q=80'),
('Hyderabadi Chicken Dum Biryani', 'Marinated chicken layered with saffron Basmati rice, fried onions, and fresh mint.', 390.00, 340.00, 1, 'Desi Feast', 4.8, 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=800&auto=format&fit=crop&q=80'),

-- Burgers & Chicken
('Smokey BBQ Smash Burger', 'Double juicy beef patties, melted cheddar, crispy bacon, caramelized onions & secret BBQ sauce.', 350.00, 299.00, 1, 'Burgers', 4.8, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80'),
('Crispy Naga Chicken Burger', 'Super spicy naga pepper glazed fried chicken thigh patty, jalapenos, melted cheese & mayo.', 310.00, 260.00, 1, 'Burgers', 4.7, 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=800&auto=format&fit=crop&q=80'),
('Crispy Naga Fried Chicken (4 pcs)', 'Spicy naga pepper marinated crispy fried chicken legs & thighs served with mint dip.', 360.00, 299.00, 1, 'Burgers', 4.8, 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800&auto=format&fit=crop&q=80'),
('Classic Double Cheeseburger', 'Two flame-grilled beef patties, double American cheese, pickles, onions & house burger sauce.', 290.00, 240.00, 1, 'Burgers', 4.6, 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&auto=format&fit=crop&q=80'),

-- Pizza
('Truffle Mushroom Pizza', 'Hand-tossed sourdough pizza topped with wild mushrooms, truffle oil, mozzarella & fresh basil.', 650.00, 549.00, 1, 'Pizza', 4.7, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80'),
('Ultimate Pepperoni Feast Pizza', 'Loaded with double pepperoni, mozzarella, parmesan and house marinara sauce.', 690.00, 599.00, 1, 'Pizza', 4.8, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&auto=format&fit=crop&q=80'),
('BBQ Grilled Chicken Pizza', 'Smokey barbecue chicken, red onions, bell peppers, cilantro and smoked gouda cheese.', 620.00, 520.00, 1, 'Pizza', 4.7, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80'),

-- Pasta
('Creamy Alfredo Chicken Pasta', 'Fettuccine in rich garlic parmesan cream sauce with grilled chicken breast and herbs.', 420.00, 360.00, 1, 'Pasta', 4.6, 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&auto=format&fit=crop&q=80'),
('Spicy Garlic Butter Prawn Pasta', 'Penne pasta tossed with succulent prawns, chili flakes, garlic, white wine & parsley.', 490.00, 430.00, 1, 'Pasta', 4.9, 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800&auto=format&fit=crop&q=80'),

-- Desserts
('Molten Lava Chocolate Cake', 'Warm chocolate cake with a molten chocolate center served with vanilla bean ice cream.', 250.00, 199.00, 1, 'Desserts', 4.9, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&auto=format&fit=crop&q=80'),
('Royal Shahi Falooda', 'Traditional cold dessert with rose syrup, vermicelli, sweet basil seeds, ice cream & dry fruits.', 220.00, 180.00, 1, 'Desserts', 4.8, 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=800&auto=format&fit=crop&q=80'),
('Nutella Belgian Waffle', 'Freshly baked warm waffle drizzled with generous Nutella, crushed hazelnut & whipped cream.', 260.00, 220.00, 1, 'Desserts', 4.7, 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=800&auto=format&fit=crop&q=80'),

-- Beverages
('Mango Passionfruit Smoothie', 'Refreshing blended fresh mango, passionfruit pulp, Greek yogurt and honey.', 180.00, 149.00, 1, 'Beverages', 4.7, 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&auto=format&fit=crop&q=80'),
('Matcha Green Tea Boba Shake', 'Premium Japanese matcha green tea latte with chewy tapioca boba pearls.', 220.00, 185.00, 1, 'Beverages', 4.6, 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=800&auto=format&fit=crop&q=80'),
('Iced Salted Caramel Macchiato', 'Espresso shot with cold milk, salted caramel drizzle, and vanilla syrup over ice.', 200.00, 165.00, 1, 'Beverages', 4.8, 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&auto=format&fit=crop&q=80');
