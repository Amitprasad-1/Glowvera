USE glowvera_db;

-- Insert default users (Password: 'password123' bcrypt-hashed)
-- BCrypt hash: $2a$10$zD9wY9kQ9F/XG1jX6uP/xOZvNq/y4P9P6U4a31/t4vO1K7dI234yS
INSERT INTO users (id, name, email, password_hash, role) VALUES 
(1, 'Glowvera Client', 'client@glowvera.com', '$2a$10$zD9wY9kQ9F/XG1jX6uP/xOZvNq/y4P9P6U4a31/t4vO1K7dI234yS', 'CLIENT'),
(2, 'Glowvera Admin', 'admin@glowvera.com', '$2a$10$zD9wY9kQ9F/XG1jX6uP/xOZvNq/y4P9P6U4a31/t4vO1K7dI234yS', 'ADMIN');

-- Insert categories
INSERT INTO categories (id, name) VALUES 
(1, 'Hair Care'),
(2, 'Beard & Grooming'),
(3, 'Spa & Massage'),
(4, 'Skin & Facial');

-- Insert services (Unisex)
INSERT INTO services (id, category_id, name, price, duration_minutes) VALUES 
-- Hair Care (Cat 1)
(1, 1, 'Unisex Haircut & Styling', 800.00, 45),
(2, 1, 'Luxury Hair Spa & Deep Conditioning', 1500.00, 60),
(3, 1, 'Professional Hair Coloring', 4000.00, 120),
(4, 1, 'Hair Blowout & Styling', 600.00, 30),
-- Beard & Grooming (Cat 2)
(5, 2, 'Classic Beard Trim & Razor Styling', 400.00, 30),
(6, 2, 'Hot Towel Royal Shave', 500.00, 45),
-- Spa & Massage (Cat 3)
(7, 3, 'Swedish Deep Tissue Massage', 2500.00, 60),
(8, 3, 'Hot Stone Relaxing Therapy', 3500.00, 90),
-- Skin & Facial (Cat 4)
(9, 4, 'Charcoal Deep Cleansing Facial', 1500.00, 45),
(10, 4, 'Luxury Anti-Aging Facial', 2500.00, 60);

-- Insert stylists with schedules (Format: Start, End, BreakStart, BreakEnd)
INSERT INTO stylists (id, name, is_active, working_start, working_end, break_start, break_end) VALUES 
(1, 'Alex Carter', 1, '09:00:00', '18:00:00', '13:00:00', '14:00:00'),
(2, 'Sophia Bennett', 1, '10:00:00', '19:00:00', '14:00:00', '15:00:00'),
(3, 'Marcus Vance', 1, '09:00:00', '18:00:00', '12:00:00', '13:00:00'),
(4, 'Elena Rostova', 1, '11:00:00', '20:00:00', '15:00:00', '16:00:00');

-- Map services to stylists (Skill matrix)
INSERT INTO stylist_services (stylist_id, service_id) VALUES 
-- Alex Carter (Hair Specialist): Haircuts, spa, coloring, blowout
(1, 1), (1, 2), (1, 3), (1, 4),
-- Sophia Bennett (Massage Therapist): Swedish, Hot stone
(2, 7), (2, 8),
-- Marcus Vance (Barber & Groomer): Haircut, blowout, beard trim, razor shave
(3, 1), (3, 4), (3, 5), (3, 6),
-- Elena Rostova (Skin & Massage): Deep cleansing, anti-aging, Swedish massage
(4, 9), (4, 10), (4, 7);
