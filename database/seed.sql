-- =====================================================================
-- Batloung Farm Distribution System — seed data
-- Lesotho trading operation (Maseru) buying from suppliers registered in
-- the eight South African provinces required by the assignment.
-- Safe to re-run: every statement is idempotent.
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE payments;
TRUNCATE TABLE sale_details;
TRUNCATE TABLE sales;
TRUNCATE TABLE purchase_details;
TRUNCATE TABLE purchases;
TRUNCATE TABLE stock;
TRUNCATE TABLE users;
TRUNCATE TABLE vendors;
TRUNCATE TABLE fruits;
TRUNCATE TABLE suppliers;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------- suppliers
-- province values are exactly the eight required South African provinces.
INSERT INTO suppliers (business_name, contact_person, phone, province, address) VALUES
  ('Highveld Citrus Growers',    'Pieter van Wyk',   '+27 13 741 2288', 'Mpumalanga',    'Plot 42, Schoemanskloof Road, Nelspruit'),
  ('Lowveld Fruit Estate',       'Thandi Mokoena',   '+27 15 307 4419', 'Limpopo',       'Farm 118, Letsitele, Tzaneen'),
  ('Ceres Valley Orchards',      'Anna de Klerk',    '+27 23 312 8807', 'Western Cape',  'Koue Bokkeveld Road, Ceres'),
  ('Vaal River Produce Co-op',   'Johannes Botha',   '+27 16 982 6650', 'Free State',    '15 Kerk Street, Parys'),
  ('Drakensberg Berry Traders',  'Sipho Ndlovu',     '+27 33 345 7123', 'KwaZulu-Natal','27 Longmarket Street, Pietermaritzburg'),
  ('Gauteng Fresh Wholesalers',  'Nomsa Dlamini',    '+27 11 493 2201', 'Gauteng',       '44 Motor City, Johannesburg'),
  ('Sunday River Packhouse',     'Lucas Mabaso',     '+27 41 466 3390', 'Eastern Cape',  '2 Produce Row, Kirkwood'),
  ('Hartbeespoort Stone Fruit',  'Elizabeth Khumalo','+27 12 253 9077', 'North West',    '88 Damdoryn Road, Hartbeespoort');

-- ------------------------------------------------------------------- fruits
INSERT INTO fruits (name, description, status, small_price, medium_price, large_price) VALUES
  ('Apples',  'Crisp Royal Gala apples packed for the Maseru market.',        'ACTIVE',  180.00, 240.00, 320.00),
  ('Bananas', 'Ripe bananas sourced from Tzaneen and matured in Maseru.',     'ACTIVE',  120.00, 165.00, 210.00),
  ('Oranges', 'Valencia oranges, best seller in the lowlands districts.',     'ACTIVE',  150.00, 200.00, 265.00),
  ('Mangoes', 'Sweet mangoes in season, sold in medium crates.',              'ACTIVE',  210.00, 275.00, 350.00),
  ('Grapes',  'Seedless grapes from the Koue Bokkeveld.',                     'ACTIVE',  260.00, 330.00, 410.00),
  ('Pears',   'Cold-stored pears for the off-season market.',                 'INACTIVE', 170.00, 225.00, 295.00);

-- --------------------------------------------------------------- stock rows
-- bf_create_fruit normally creates these; seeding writes them directly.
INSERT INTO stock (fruit_id, packaging_size, available_quantity, low_stock_threshold)
SELECT f.id, s.size, 0, 20
FROM fruits f
CROSS JOIN (SELECT 'SMALL' AS size UNION ALL SELECT 'MEDIUM' UNION ALL SELECT 'LARGE') s;

-- ------------------------------------------------------------------ vendors
-- Lesotho Market vendors, Maseru district.
INSERT INTO vendors (name, phone, location, registration_date) VALUES
  ('Maseru Market Traders',       '+266 2231 4478', 'Maseru Market, Market Road, Maseru',        '2025-02-10'),
  ('Leribe Fresh Produce',        '+266 2240 0912', 'Main Street, Hlotse, Leribe',               '2025-03-04'),
  ('Berea Fruit Corner',          '+266 2225 6610', 'Teyateyaneng Market, Berea',                '2025-04-18'),
  ('Mafeteng Grocers',            '+266 2270 3345', 'Shop 6, Mafeteng Main South, Mafeteng',     '2025-06-02'),
  ('Qacha''s Nek Trade Store',    '+266 2295 1180', 'Old Post Office Road, Qacha''s Nek',        '2025-07-21'),
  ('Mokhotlong Village Supplies','+266 2290 5547', 'Boitumelo Street, Mokhotlong',              '2025-09-09');

-- ------------------------------------------------------------------ users
-- Default admin user (password: admin123) and vendor users (password: vendor123)
-- Passwords are bcrypt hashed with cost 10
INSERT INTO users (email, password_hash, full_name, role, vendor_id, is_active) VALUES
  ('admin@batloungfarm.ls', '$2b$10$pcQI0h5GhXJkPBnaEEY9geYI1CbQI2DER2RZJK2yP8tP.PlaM79gi', 'Batloung Farm Admin', 'ADMIN', NULL, TRUE),
  ('maseru@vendor.ls', '$2b$10$/mdh6zqeUOSpFWYwFSEPmuXjS0Kd8hHxyZgDC6oc/vLXwHF15a9u.', 'Maseru Market Traders', 'VENDOR', 1, TRUE),
  ('leribe@vendor.ls', '$2b$10$/mdh6zqeUOSpFWYwFSEPmuXjS0Kd8hHxyZgDC6oc/vLXwHF15a9u.', 'Leribe Fresh Produce', 'VENDOR', 2, TRUE),
  ('berea@vendor.ls', '$2b$10$/mdh6zqeUOSpFWYwFSEPmuXjS0Kd8hHxyZgDC6oc/vLXwHF15a9u.', 'Berea Fruit Corner', 'VENDOR', 3, TRUE),
  ('mafeteng@vendor.ls', '$2b$10$/mdh6zqeUOSpFWYwFSEPmuXjS0Kd8hHxyZgDC6oc/vLXwHF15a9u.', 'Mafeteng Grocers', 'VENDOR', 4, TRUE),
  ('qacha@vendor.ls', '$2b$10$/mdh6zqeUOSpFWYwFSEPmuXjS0Kd8hHxyZgDC6oc/vLXwHF15a9u.', 'Qacha''s Nek Trade Store', 'VENDOR', 5, TRUE),
  ('mokhotlong@vendor.ls', '$2b$10$/mdh6zqeUOSpFWYwFSEPmuXjS0Kd8hHxyZgDC6oc/vLXwHF15a9u.', 'Mokhotlong Village Supplies', 'VENDOR', 6, TRUE);

-- ---------------------------------------------------------------- purchases
INSERT INTO purchases (supplier_id, purchase_date, total_amount) VALUES
  (1, '2026-10-05', 4250.00),   -- Highveld Citrus
  (2, '2026-10-12', 3120.00),   -- Lowveld Fruit
  (3, '2026-10-20', 5480.00),   -- Ceres Valley
  (4, '2026-11-02', 2375.00),   -- Vaal River
  (5, '2026-11-09', 3990.00),   -- Drakensberg Berry
  (6, '2026-11-14', 6100.00);   -- Gauteng Fresh

INSERT INTO purchase_details (purchase_id, fruit_id, packaging_size, quantity, unit_cost) VALUES
  (1, 3, 'MEDIUM', 15, 200.00),
  (1, 1, 'LARGE',   5, 250.00),
  (2, 2, 'MEDIUM', 12, 165.00),
  (2, 5, 'SMALL',   4, 285.00),
  (3, 5, 'LARGE',  10, 410.00),
  (3, 1, 'MEDIUM',  8, 160.00),
  (4, 3, 'SMALL',  12, 145.00),
  (4, 6, 'MEDIUM',  5, 139.00),
  (5, 4, 'MEDIUM', 10, 240.00),
  (5, 2, 'SMALL',   9, 110.00),
  (6, 1, 'LARGE',  10, 320.00),
  (6, 4, 'LARGE',   8, 300.00);

-- -------------------------------------------------------------------- sales
INSERT INTO sales (vendor_id, sale_date, payment_method, payment_status, total_amount, paid_amount) VALUES
  (1, '2026-10-08', 'CASH',         'PAID',           2000.00, 2000.00),
  (2, '2026-10-15', 'MOBILE_MONEY', 'PAID',           1400.00, 1400.00),
  (3, '2026-10-24', 'CREDIT',       'UNPAID',         3400.00,    0.00),
  (4, '2026-11-04', 'CREDIT',       'PARTIALLY_PAID', 1850.00,  900.00),
  (1, '2026-11-10', 'CASH',         'PAID',           2450.00, 2450.00),
  (5, '2026-11-16', 'CREDIT',       'PARTIALLY_PAID', 1200.00,  400.00);

INSERT INTO sale_details (sale_id, fruit_id, packaging_size, quantity, unit_price) VALUES
  (1, 3, 'MEDIUM', 10, 200.00),
  (1, 1, 'LARGE',   2, 300.00),
  (2, 2, 'MEDIUM',  5, 165.00),
  (2, 2, 'SMALL',   4, 120.00),
  (3, 5, 'LARGE',   7, 410.00),
  (3, 1, 'MEDIUM',  1, 240.00),
  (3, 3, 'SMALL',   1, 150.00),
  (4, 3, 'SMALL',   6, 150.00),
  (4, 2, 'MEDIUM',  4, 165.00),
  (4, 1, 'SMALL',   2, 180.00),
  (5, 4, 'MEDIUM',  8, 275.00),
  (5, 1, 'SMALL',   1, 180.00),
  (6, 4, 'MEDIUM',  3, 275.00),
  (6, 2, 'SMALL',   3, 120.00);

-- ----------------------------------------------------------------- payments
INSERT INTO payments (sale_id, payment_method, amount, payment_date) VALUES
  (1, 'CASH',         2000.00, '2026-10-08'),
  (2, 'MOBILE_MONEY', 1400.00, '2026-10-15'),
  (4, 'CASH',          900.00, '2026-11-06'),
  (5, 'CASH',         2450.00, '2026-11-10'),
  (6, 'MOBILE_MONEY',  400.00, '2026-11-16');

-- -------------------------------------------------------------------- stock
-- Bought minus sold, per fruit and pack size. Only rows with movement are
-- updated; everything else starts at zero from the block above.
UPDATE stock st
JOIN (
  SELECT fruit_id, packaging_size, SUM(quantity) AS qty
  FROM purchase_details GROUP BY fruit_id, packaging_size
) b ON b.fruit_id = st.fruit_id AND b.packaging_size = st.packaging_size
SET st.available_quantity = b.qty;

UPDATE stock st
JOIN (
  SELECT fruit_id, packaging_size, SUM(quantity) AS qty
  FROM sale_details GROUP BY fruit_id, packaging_size
) s ON s.fruit_id = st.fruit_id AND s.packaging_size = st.packaging_size
SET st.available_quantity = GREATEST(st.available_quantity - s.qty, 0);

-- A few low-stock rows so the dashboard alert panel has something to show.
UPDATE stock SET available_quantity = 8  WHERE fruit_id = 2 AND packaging_size = 'SMALL';
UPDATE stock SET available_quantity = 5  WHERE fruit_id = 6 AND packaging_size = 'MEDIUM';
UPDATE stock SET low_stock_threshold = 10 WHERE fruit_id = 2;
