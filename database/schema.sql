-- =====================================================================
-- Batloung Farm Distribution System — MySQL schema
-- Target: MySQL 8.0+ (tested shape); runs on defaultdb
--
-- NOTE: the original project used a PostgreSQL-specific numeric type that
-- MySQL does not have. All money columns here are DECIMAL(12,2).
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `batloung_farm` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `batloung_farm`;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email          VARCHAR(255)    NOT NULL,
  password_hash  VARCHAR(255)    NOT NULL,
  full_name      VARCHAR(120)    NOT NULL,
  role           VARCHAR(20)     NOT NULL DEFAULT 'ADMIN',
  vendor_id      BIGINT UNSIGNED NULL,
  is_active      BOOLEAN         NOT NULL DEFAULT TRUE,
  last_login     TIMESTAMP       NULL,
  created_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  CONSTRAINT ck_users_role CHECK (role IN ('ADMIN','VENDOR')),
  CONSTRAINT fk_users_vendor FOREIGN KEY (vendor_id) REFERENCES vendors (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS suppliers (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  business_name  VARCHAR(140)    NOT NULL,
  contact_person VARCHAR(120)    NOT NULL,
  phone          VARCHAR(40)     NOT NULL,
  province       VARCHAR(40)     NOT NULL,
  address        VARCHAR(255)    NOT NULL,
  created_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_suppliers_phone (phone),
  CONSTRAINT ck_suppliers_province CHECK (province IN (
    'Gauteng','Free State','KwaZulu-Natal','Western Cape',
    'Eastern Cape','Limpopo','Mpumalanga','North West'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS fruits (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name         VARCHAR(60)    NOT NULL,
  description  VARCHAR(2000)  NOT NULL DEFAULT '',
  status       VARCHAR(10)    NOT NULL DEFAULT 'ACTIVE',
  small_price  DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
  medium_price DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
  large_price  DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
  created_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_fruits_name (name),
  CONSTRAINT ck_fruits_status CHECK (status IN ('ACTIVE','INACTIVE')),
  CONSTRAINT ck_fruits_prices CHECK (small_price >= 0 AND medium_price >= 0 AND large_price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vendors (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name              VARCHAR(120)    NOT NULL,
  phone             VARCHAR(40)     NOT NULL,
  location          VARCHAR(255)    NOT NULL,
  registration_date DATE            NOT NULL,
  created_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vendors_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS purchases (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  supplier_id   BIGINT UNSIGNED NOT NULL,
  purchase_date DATE            NOT NULL,
  total_amount  DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_purchases_date (purchase_date),
  KEY idx_purchases_supplier (supplier_id),
  CONSTRAINT fk_purchases_supplier FOREIGN KEY (supplier_id)
    REFERENCES suppliers (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT ck_purchases_total CHECK (total_amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS purchase_details (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  purchase_id    BIGINT UNSIGNED NOT NULL,
  fruit_id       BIGINT UNSIGNED NOT NULL,
  packaging_size VARCHAR(10)     NOT NULL,
  quantity       INT             NOT NULL,
  unit_cost      DECIMAL(12,2)   NOT NULL,
  PRIMARY KEY (id),
  KEY idx_purchase_details_purchase (purchase_id),
  CONSTRAINT fk_pd_purchase FOREIGN KEY (purchase_id)
    REFERENCES purchases (id) ON DELETE CASCADE,
  CONSTRAINT fk_pd_fruit FOREIGN KEY (fruit_id)
    REFERENCES fruits (id) ON DELETE RESTRICT,
  CONSTRAINT ck_pd_size CHECK (packaging_size IN ('SMALL','MEDIUM','LARGE')),
  CONSTRAINT ck_pd_qty CHECK (quantity > 0),
  CONSTRAINT ck_pd_cost CHECK (unit_cost > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sales (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vendor_id      BIGINT UNSIGNED NOT NULL,
  sale_date      DATE            NOT NULL,
  payment_method VARCHAR(20)     NOT NULL,
  payment_status VARCHAR(20)     NOT NULL DEFAULT 'UNPAID',
  total_amount   DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  paid_amount    DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  created_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sales_date (sale_date),
  KEY idx_sales_vendor (vendor_id),
  CONSTRAINT fk_sales_vendor FOREIGN KEY (vendor_id)
    REFERENCES vendors (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT ck_sales_method CHECK (payment_method IN ('CASH','MOBILE_MONEY','CREDIT')),
  CONSTRAINT ck_sales_status CHECK (payment_status IN ('PAID','PARTIALLY_PAID','UNPAID')),
  CONSTRAINT ck_sales_amounts CHECK (total_amount >= 0 AND paid_amount >= 0 AND paid_amount <= total_amount)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sale_details (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sale_id        BIGINT UNSIGNED NOT NULL,
  fruit_id       BIGINT UNSIGNED NOT NULL,
  packaging_size VARCHAR(10)     NOT NULL,
  quantity       INT             NOT NULL,
  unit_price     DECIMAL(12,2)   NOT NULL,
  PRIMARY KEY (id),
  KEY idx_sale_details_sale (sale_id),
  KEY idx_sale_details_fruit (fruit_id),
  CONSTRAINT fk_sd_sale FOREIGN KEY (sale_id)
    REFERENCES sales (id) ON DELETE CASCADE,
  CONSTRAINT fk_sd_fruit FOREIGN KEY (fruit_id)
    REFERENCES fruits (id) ON DELETE RESTRICT,
  CONSTRAINT ck_sd_size CHECK (packaging_size IN ('SMALL','MEDIUM','LARGE')),
  CONSTRAINT ck_sd_qty CHECK (quantity > 0),
  CONSTRAINT ck_sd_price CHECK (unit_price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stock (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  fruit_id            BIGINT UNSIGNED NOT NULL,
  packaging_size      VARCHAR(10)     NOT NULL,
  available_quantity  INT             NOT NULL DEFAULT 0,
  low_stock_threshold INT             NOT NULL DEFAULT 20,
  updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_stock_fruit_size (fruit_id, packaging_size),
  CONSTRAINT fk_stock_fruit FOREIGN KEY (fruit_id)
    REFERENCES fruits (id) ON DELETE RESTRICT,
  CONSTRAINT ck_stock_size CHECK (packaging_size IN ('SMALL','MEDIUM','LARGE')),
  CONSTRAINT ck_stock_qty CHECK (available_quantity >= 0),
  CONSTRAINT ck_stock_threshold CHECK (low_stock_threshold >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sale_id        BIGINT UNSIGNED NOT NULL,
  payment_method VARCHAR(20)     NOT NULL,
  amount         DECIMAL(12,2)   NOT NULL,
  payment_date   DATE            NOT NULL,
  created_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_payments_sale (sale_id),
  CONSTRAINT fk_payments_sale FOREIGN KEY (sale_id)
    REFERENCES sales (id) ON DELETE CASCADE,
  CONSTRAINT ck_payments_method CHECK (payment_method IN ('CASH','MOBILE_MONEY')),
  CONSTRAINT ck_payments_amount CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
