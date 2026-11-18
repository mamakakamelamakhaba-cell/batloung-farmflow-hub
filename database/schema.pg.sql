-- =====================================================================
-- Batloung Farm Distribution System — PostgreSQL schema
-- Target: PostgreSQL 14+ (Neon, Supabase, Railway, etc.)
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Vendors table (must be first due to FK from users)
CREATE TABLE IF NOT EXISTS vendors (
  id                BIGSERIAL PRIMARY KEY,
  name              VARCHAR(120)    NOT NULL,
  phone             VARCHAR(40)     NOT NULL UNIQUE,
  location          VARCHAR(255)    NOT NULL,
  registration_date DATE            NOT NULL,
  created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id             BIGSERIAL PRIMARY KEY,
  email          VARCHAR(255)    NOT NULL UNIQUE,
  password_hash  VARCHAR(255)    NOT NULL,
  full_name      VARCHAR(120)    NOT NULL,
  role           VARCHAR(20)     NOT NULL DEFAULT 'ADMIN',
  vendor_id      BIGINT          NULL,
  is_active      BOOLEAN         NOT NULL DEFAULT TRUE,
  last_login     TIMESTAMPTZ     NULL,
  created_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_users_role CHECK (role IN ('ADMIN','VENDOR')),
  CONSTRAINT fk_users_vendor FOREIGN KEY (vendor_id) REFERENCES vendors (id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id             BIGSERIAL PRIMARY KEY,
  business_name  VARCHAR(140)    NOT NULL,
  contact_person VARCHAR(120)    NOT NULL,
  phone          VARCHAR(40)     NOT NULL UNIQUE,
  province       VARCHAR(40)     NOT NULL,
  address        VARCHAR(255)    NOT NULL,
  created_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_suppliers_province CHECK (province IN (
    'Gauteng','Free State','KwaZulu-Natal','Western Cape',
    'Eastern Cape','Limpopo','Mpumalanga','North West'))
);

-- Fruits table
CREATE TABLE IF NOT EXISTS fruits (
  id           BIGSERIAL PRIMARY KEY,
  name         VARCHAR(60)       NOT NULL UNIQUE,
  description  VARCHAR(2000)     NOT NULL DEFAULT '',
  status       VARCHAR(10)       NOT NULL DEFAULT 'ACTIVE',
  small_price  DECIMAL(12,2)     NOT NULL DEFAULT 0.00,
  medium_price DECIMAL(12,2)     NOT NULL DEFAULT 0.00,
  large_price  DECIMAL(12,2)     NOT NULL DEFAULT 0.00,
  created_at   TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_fruits_status CHECK (status IN ('ACTIVE','INACTIVE')),
  CONSTRAINT ck_fruits_prices CHECK (small_price >= 0 AND medium_price >= 0 AND large_price >= 0)
);

-- Purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id            BIGSERIAL PRIMARY KEY,
  supplier_id   BIGINT          NOT NULL,
  purchase_date DATE            NOT NULL,
  total_amount  DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  created_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_purchases_supplier FOREIGN KEY (supplier_id)
    REFERENCES suppliers (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT ck_purchases_total CHECK (total_amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id);

-- Purchase details table
CREATE TABLE IF NOT EXISTS purchase_details (
  id             BIGSERIAL PRIMARY KEY,
  purchase_id    BIGINT          NOT NULL,
  fruit_id       BIGINT          NOT NULL,
  packaging_size VARCHAR(10)     NOT NULL,
  quantity       INT             NOT NULL,
  unit_cost      DECIMAL(12,2)   NOT NULL,
  CONSTRAINT fk_pd_purchase FOREIGN KEY (purchase_id)
    REFERENCES purchases (id) ON DELETE CASCADE,
  CONSTRAINT fk_pd_fruit FOREIGN KEY (fruit_id)
    REFERENCES fruits (id) ON DELETE RESTRICT,
  CONSTRAINT ck_pd_size CHECK (packaging_size IN ('SMALL','MEDIUM','LARGE')),
  CONSTRAINT ck_pd_qty CHECK (quantity > 0),
  CONSTRAINT ck_pd_cost CHECK (unit_cost > 0)
);

CREATE INDEX IF NOT EXISTS idx_purchase_details_purchase ON purchase_details(purchase_id);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
  id             BIGSERIAL PRIMARY KEY,
  vendor_id      BIGINT          NOT NULL,
  sale_date      DATE            NOT NULL,
  payment_method VARCHAR(20)     NOT NULL,
  payment_status VARCHAR(20)     NOT NULL DEFAULT 'UNPAID',
  total_amount   DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  paid_amount    DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  created_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_sales_vendor FOREIGN KEY (vendor_id)
    REFERENCES vendors (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT ck_sales_method CHECK (payment_method IN ('CASH','MOBILE_MONEY','CREDIT')),
  CONSTRAINT ck_sales_status CHECK (payment_status IN ('PAID','PARTIALLY_PAID','UNPAID')),
  CONSTRAINT ck_sales_amounts CHECK (total_amount >= 0 AND paid_amount >= 0 AND paid_amount <= total_amount)
);

CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_vendor ON sales(vendor_id);

-- Sale details table
CREATE TABLE IF NOT EXISTS sale_details (
  id             BIGSERIAL PRIMARY KEY,
  sale_id        BIGINT          NOT NULL,
  fruit_id       BIGINT          NOT NULL,
  packaging_size VARCHAR(10)     NOT NULL,
  quantity       INT             NOT NULL,
  unit_price     DECIMAL(12,2)   NOT NULL,
  CONSTRAINT fk_sd_sale FOREIGN KEY (sale_id)
    REFERENCES sales (id) ON DELETE CASCADE,
  CONSTRAINT fk_sd_fruit FOREIGN KEY (fruit_id)
    REFERENCES fruits (id) ON DELETE RESTRICT,
  CONSTRAINT ck_sd_size CHECK (packaging_size IN ('SMALL','MEDIUM','LARGE')),
  CONSTRAINT ck_sd_qty CHECK (quantity > 0),
  CONSTRAINT ck_sd_price CHECK (unit_price >= 0)
);

CREATE INDEX IF NOT EXISTS idx_sale_details_sale ON sale_details(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_details_fruit ON sale_details(fruit_id);

-- Stock table
CREATE TABLE IF NOT EXISTS stock (
  id                  BIGSERIAL PRIMARY KEY,
  fruit_id            BIGINT          NOT NULL,
  packaging_size      VARCHAR(10)     NOT NULL,
  available_quantity  INT             NOT NULL DEFAULT 0,
  low_stock_threshold INT             NOT NULL DEFAULT 20,
  updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_stock_fruit FOREIGN KEY (fruit_id)
    REFERENCES fruits (id) ON DELETE RESTRICT,
  CONSTRAINT ck_stock_size CHECK (packaging_size IN ('SMALL','MEDIUM','LARGE')),
  CONSTRAINT ck_stock_qty CHECK (available_quantity >= 0),
  CONSTRAINT ck_stock_threshold CHECK (low_stock_threshold >= 0),
  UNIQUE (fruit_id, packaging_size)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id             BIGSERIAL PRIMARY KEY,
  sale_id        BIGINT          NOT NULL,
  payment_method VARCHAR(20)     NOT NULL,
  amount         DECIMAL(12,2)   NOT NULL,
  payment_date   DATE            NOT NULL,
  created_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_payments_sale FOREIGN KEY (sale_id)
    REFERENCES sales (id) ON DELETE CASCADE,
  CONSTRAINT ck_payments_method CHECK (payment_method IN ('CASH','MOBILE_MONEY')),
  CONSTRAINT ck_payments_amount CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_payments_sale ON payments(sale_id);

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stock_updated_at ON stock;
CREATE TRIGGER update_stock_updated_at BEFORE UPDATE ON stock
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();