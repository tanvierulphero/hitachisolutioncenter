-- ========================================================
-- HITACHI SOLUTION CENTER - cPanel MySQL / MariaDB Schema
-- Database: hitachi_app / localmarket247
-- Import this file into phpMyAdmin -> SQL tab
-- ========================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Table: products
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` VARCHAR(128) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `sku` VARCHAR(100) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `brand` VARCHAR(100) NOT NULL,
  `price` DOUBLE NOT NULL DEFAULT 0,
  `stock` INT NOT NULL DEFAULT 0,
  `unit` VARCHAR(50) NOT NULL DEFAULT 'Pcs',
  `description` TEXT,
  `specs` LONGTEXT,
  `image_url` TEXT,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Products Data
INSERT INTO `products` (`id`, `name`, `sku`, `category`, `brand`, `price`, `stock`, `unit`, `description`, `specs`, `image_url`) VALUES
('prod-1', 'Hitachi Hiscrew 37 S-Type Screw Compressor', 'HIT-HS-37S', 'Screw Air Compressor', 'Hitachi', 650000, 3, 'Set', 'High-performance S-Type oil-flooded rotary screw air compressor with advanced microprocessor control, superior energy efficiency, and low noise levels.', '[{"label":"Motor Power","value":"37 kW (50 HP)"},{"label":"Free Air Delivery","value":"6.2 m³/min"},{"label":"Working Pressure","value":"8.5 Bar"}]', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=60'),
('prod-2', 'Atlas Copco GA37 VSD+ Variable Speed Compressor', 'AC-GA37-VSD', 'Screw Air Compressor', 'Atlas Copco', 890000, 2, 'Set', 'Premium variable speed drive (VSD+) rotary screw compressor. Saves up to 50% energy compared to fixed-speed models.', '[{"label":"Motor Power","value":"37 kW (50 HP)"},{"label":"Working Pressure","value":"4 - 13 Bar"}]', 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&auto=format&fit=crop&q=60'),
('prod-3', 'Hitachi Synthetic Screw Oil (Food Grade) 20L', 'HIT-OIL-20L', 'Lubricant Oil', 'Hitachi', 18500, 25, 'Can', 'Genuine 100% synthetic compressor oil for Hitachi rotary screw compressors. 8,000 hours operating lifetime.', '[]', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=60');


-- 2. Table: customers
DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers` (
  `id` VARCHAR(128) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `company` VARCHAR(255) DEFAULT '',
  `phone` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) DEFAULT '',
  `address` TEXT,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Customers Data
INSERT INTO `customers` (`id`, `name`, `company`, `phone`, `email`, `address`) VALUES
('cust-1', 'Anwar Hossain', 'Ha-Meem Textile Mills Ltd.', '01711-223344', 'anwar@hameemgroup.com', 'Nishat Nagar, Tongi, Gazipur.'),
('cust-2', 'Engr. Shahadat Hossain', 'Square Pharmaceuticals PLC', '01819-887766', 'shahadat@squaregroup.com', 'Kaliyakir Industrial Zone, Gazipur.');


-- 3. Table: documents
DROP TABLE IF EXISTS `documents`;
CREATE TABLE `documents` (
  `id` VARCHAR(128) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `doc_number` VARCHAR(100) NOT NULL,
  `date` VARCHAR(50) NOT NULL,
  `due_date` VARCHAR(50) DEFAULT NULL,
  `customer_id` VARCHAR(128) NOT NULL,
  `customer_name` VARCHAR(255) NOT NULL,
  `customer_company` VARCHAR(255) DEFAULT '',
  `customer_phone` VARCHAR(100) DEFAULT '',
  `customer_email` VARCHAR(255) DEFAULT '',
  `customer_address` TEXT,
  `subject` TEXT,
  `salutation` VARCHAR(255) DEFAULT '',
  `opening_paragraph` TEXT,
  `closing_paragraph` TEXT,
  `items` LONGTEXT,
  `subtotal` DOUBLE NOT NULL DEFAULT 0,
  `tax_rate` DOUBLE DEFAULT 0,
  `tax_amount` DOUBLE DEFAULT 0,
  `discount` DOUBLE DEFAULT 0,
  `total` DOUBLE NOT NULL DEFAULT 0,
  `paid_amount` DOUBLE DEFAULT 0,
  `due_amount` DOUBLE DEFAULT 0,
  `status` VARCHAR(50) NOT NULL,
  `terms` TEXT,
  `notes` TEXT,
  `signature_label` VARCHAR(255) DEFAULT 'Authorized Signature',
  `signature_name` VARCHAR(255) DEFAULT 'Hitachi Air Solution Center',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Documents Data
INSERT INTO `documents` (`id`, `type`, `doc_number`, `date`, `due_date`, `customer_id`, `customer_name`, `customer_company`, `customer_phone`, `customer_email`, `customer_address`, `subject`, `salutation`, `opening_paragraph`, `closing_paragraph`, `items`, `subtotal`, `tax_rate`, `tax_amount`, `discount`, `total`, `paid_amount`, `due_amount`, `status`, `terms`, `notes`, `signature_label`, `signature_name`) VALUES
('doc-1', 'INVOICE', 'HSC/INV/2026/001', '2026-03-01', '2026-03-15', 'cust-1', 'Anwar Hossain', 'Ha-Meem Textile Mills Ltd.', '01711-223344', 'anwar@hameemgroup.com', 'Nishat Nagar, Tongi, Gazipur.', 'Supply & Commissioning of Hitachi 37kW Screw Compressor', 'Dear Sir,', 'We are pleased to submit our commercial invoice for the high-efficiency screw air compressor supplied as per your work order.', 'Thank you for choosing Hitachi Solution Center.', '[{"id":"item-1","name":"Hitachi Hiscrew 37 S-Type Screw Compressor","brand":"Hitachi","quantity":1,"price":650000,"total":650000,"unit":"Set"}]', 650000, 5, 32500, 10000, 672500, 400000, 272500, 'PARTIAL', '1. Warranty: 1 Year.\n2. Payment: 50% Advance.', 'Delivered to Tongi Plant', 'Managing Director', 'MD MAHI UDDIN');


-- 4. Table: staff_users
DROP TABLE IF EXISTS `staff_users`;
CREATE TABLE `staff_users` (
  `id` VARCHAR(128) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(100) DEFAULT '',
  `passcode` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) NOT NULL,
  `designation` VARCHAR(255) DEFAULT '',
  `status` VARCHAR(50) NOT NULL DEFAULT 'Active',
  `permissions` LONGTEXT,
  `created_at` VARCHAR(50) NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Staff Data
INSERT INTO `staff_users` (`id`, `name`, `email`, `phone`, `passcode`, `role`, `designation`, `status`, `permissions`, `created_at`) VALUES
('staff-admin-1', 'MD MAHI UDDIN', 'mahi@hitachisolutioncenter.com', '01715-994956', 'admin123', 'ADMIN', 'Managing Director & Owner', 'Active', '["view_overview","view_inventory","manage_inventory","view_documents","create_documents","edit_documents","delete_documents","view_due_ledger","manage_due_ledger","view_reports","manage_settings","view_staff_management"]', '2026-01-01'),
('staff-mgr-1', 'Kamrul Hasan', 'kamrul@hitachisolutioncenter.com', '01799-498199', 'mgr123', 'MANAGER', 'Operations Manager', 'Active', '["view_overview","view_inventory","manage_inventory","view_documents","create_documents","edit_documents","view_due_ledger","manage_due_ledger","view_reports"]', '2026-01-15');


-- 5. Table: settings
DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
  `id` VARCHAR(128) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `slogan` VARCHAR(255) DEFAULT '',
  `address` TEXT,
  `phone1` VARCHAR(100) DEFAULT '',
  `phone2` VARCHAR(100) DEFAULT '',
  `email` VARCHAR(255) DEFAULT '',
  `website` VARCHAR(255) DEFAULT '',
  `invoice_prefix` VARCHAR(100) DEFAULT 'INV',
  `quote_prefix` VARCHAR(100) DEFAULT 'QUO',
  `offer_prefix` VARCHAR(100) DEFAULT 'OFF',
  `bill_prefix` VARCHAR(100) DEFAULT 'BIL',
  `tax_rate` DOUBLE DEFAULT 0,
  `terms` TEXT,
  `signature_name` VARCHAR(255) DEFAULT '',
  `signature_label` VARCHAR(255) DEFAULT '',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Settings Data
INSERT INTO `settings` (`id`, `name`, `slogan`, `address`, `phone1`, `phone2`, `email`, `website`, `invoice_prefix`, `quote_prefix`, `offer_prefix`, `bill_prefix`, `tax_rate`, `terms`, `signature_name`, `signature_label`) VALUES
('global_settings', 'hitachisolutioncenter', 'Your Problem Solution is Sustainable Partner', 'Hazi Siddik Complex, Molla Market, Bason Sharok, Gazipur City.', '01715-994956', '01799-498199', 'info@hitachisolutioncenter.com', 'www.hitachiairsolutioncenter.com', 'HSC/INV/2026/', 'HSC/QT/2026/', 'HSC/OF/2026/', 'HSC/BILL/2026/', 5, '1. Delivery: Within 7 working days upon receipt of work order.\n2. Payment: 50% advance with work order & 50% upon delivery.\n3. Warranty: 1 Year comprehensive brand warranty.', 'MD MAHI UDDIN', 'Managing Director');

-- 6. Table: field_dispatches
DROP TABLE IF EXISTS `field_dispatches`;
CREATE TABLE `field_dispatches` (
  `id` VARCHAR(128) NOT NULL,
  `dispatch_number` VARCHAR(100) NOT NULL,
  `staff_id` VARCHAR(128) NOT NULL,
  `staff_name` VARCHAR(255) NOT NULL,
  `customer_id` VARCHAR(128) NOT NULL,
  `customer_name` VARCHAR(255) NOT NULL,
  `customer_company` VARCHAR(255) DEFAULT '',
  `customer_phone` VARCHAR(100) DEFAULT '',
  `purpose` TEXT,
  `dispatch_date` VARCHAR(50) NOT NULL,
  `return_date` VARCHAR(50) DEFAULT NULL,
  `status` VARCHAR(50) NOT NULL,
  `notes` TEXT,
  `items` LONGTEXT,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
