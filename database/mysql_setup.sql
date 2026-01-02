-- =================================================================
-- Rwanda Bus Ticketing System - Complete MySQL Setup
-- Database: ticketbooking
-- Run this script in phpMyAdmin or MySQL Workbench
-- =================================================================

USE ticketbooking;

-- Create missing tables for payment and subscription system

-- =====================================================
-- SUBSCRIPTION PLANS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  duration_days INT NOT NULL DEFAULT 30,
  bus_limit INT NOT NULL DEFAULT 3,
  features JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price, duration_days, bus_limit, features, is_active) VALUES
('Free Trial', '30-day free trial with up to 3 buses. Perfect for testing the system.', 0.00, 30, 3, '{"support": "email", "analytics": false, "priority_listing": false, "custom_branding": false}', 1),
('Standard', 'Standard plan for small to medium transport companies. Up to 10 buses.', 50000.00, 30, 10, '{"support": "email+phone", "analytics": true, "priority_listing": false, "custom_branding": false}', 1),
('Premium', 'Premium plan for large transport companies. Up to 20 buses with priority support.', 100000.00, 30, 20, '{"support": "24/7", "analytics": true, "priority_listing": true, "custom_branding": true}', 1)
ON DUPLICATE KEY UPDATE name=name;

-- =====================================================
-- COMPANY MANAGERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS company_managers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role ENUM('owner', 'manager') DEFAULT 'manager',
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  INDEX idx_email (email),
  INDEX idx_company (company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- COMPANY SUBSCRIPTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS company_subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  plan_id INT NOT NULL,
  payment_id INT,
  start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP NOT NULL,
  amount_paid DECIMAL(10, 2) DEFAULT 0.00,
  status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
  auto_renew BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  INDEX idx_company (company_id),
  INDEX idx_status (status),
  INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PAYMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT,
  user_id INT,
  payment_type ENUM('ticket', 'subscription') NOT NULL,
  reference_id INT,
  amount DECIMAL(10, 2) NOT NULL,
  system_fee DECIMAL(10, 2) DEFAULT 10.00,
  payment_method ENUM('mtn_momo', 'airtel_money', 'momopay', 'bank_transfer') NOT NULL,
  transaction_ref VARCHAR(255) UNIQUE NOT NULL,
  phone_number VARCHAR(20),
  status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
  payment_data JSON,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_transaction_ref (transaction_ref),
  INDEX idx_status (status),
  INDEX idx_company (company_id),
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SYSTEM EARNINGS TABLE (10 RWF per ticket)
-- =====================================================
CREATE TABLE IF NOT EXISTS system_earnings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payment_id INT NOT NULL,
  ticket_id INT,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 10.00,
  status ENUM('pending', 'withdrawn') DEFAULT 'pending',
  withdrawn_at TIMESTAMP NULL,
  withdrawal_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
  INDEX idx_payment (payment_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SYSTEM WITHDRAWALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS system_withdrawals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  amount DECIMAL(10, 2) NOT NULL,
  withdrawal_method ENUM('mtn_momo', 'bank_transfer') NOT NULL,
  phone_number VARCHAR(20),
  bank_account VARCHAR(100),
  bank_name VARCHAR(100),
  transaction_ref VARCHAR(255),
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  notes TEXT,
  processed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PAYMENT WEBHOOKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_webhooks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payment_id INT,
  provider ENUM('mtn_momo', 'airtel_money', 'momopay') NOT NULL,
  transaction_ref VARCHAR(255),
  webhook_data JSON NOT NULL,
  status ENUM('received', 'processed', 'failed') DEFAULT 'received',
  processed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
  INDEX idx_transaction_ref (transaction_ref),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TRIPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS trips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  route_id INT NOT NULL,
  car_id INT NOT NULL,
  driver_id INT,
  departure_date DATE NOT NULL,
  departure_time TIME NOT NULL,
  arrival_time TIME,
  available_seats INT NOT NULL,
  total_seats INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  status ENUM('scheduled', 'boarding', 'departed', 'arrived', 'cancelled') DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE RESTRICT,
  FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE RESTRICT,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL,
  INDEX idx_route (route_id),
  INDEX idx_date (departure_date),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TICKETS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  trip_id INT NOT NULL,
  booking_reference VARCHAR(50) UNIQUE NOT NULL,
  passenger_name VARCHAR(255) NOT NULL,
  passenger_phone VARCHAR(20) NOT NULL,
  passenger_email VARCHAR(255),
  seat_number VARCHAR(10),
  from_stop_id INT NOT NULL,
  to_stop_id INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  payment_id INT,
  payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  ticket_status ENUM('booked', 'confirmed', 'on_board', 'completed', 'cancelled') DEFAULT 'booked',
  qr_code TEXT,
  booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMP NULL,
  cancelled_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE RESTRICT,
  FOREIGN KEY (from_stop_id) REFERENCES stops(id) ON DELETE RESTRICT,
  FOREIGN KEY (to_stop_id) REFERENCES stops(id) ON DELETE RESTRICT,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_trip (trip_id),
  INDEX idx_booking_ref (booking_reference),
  INDEX idx_payment_status (payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- =====================================================

-- Add subscription fields to companies table
ALTER TABLE companies 
  ADD COLUMN IF NOT EXISTS tin VARCHAR(50) UNIQUE,
  ADD COLUMN IF NOT EXISTS status ENUM('pending', 'approved', 'rejected', 'blocked') DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_by INT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status ENUM('active', 'expired', 'cancelled') DEFAULT 'expired',
  ADD COLUMN IF NOT EXISTS current_plan_id INT,
  ADD COLUMN IF NOT EXISTS bus_limit INT DEFAULT 3,
  ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP NULL,
  ADD CONSTRAINT fk_companies_approved_by FOREIGN KEY (approved_by) REFERENCES admins(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_companies_plan FOREIGN KEY (current_plan_id) REFERENCES subscription_plans(id) ON DELETE SET NULL;

-- Update companies that already exist to approved status
UPDATE companies SET status = 'approved' WHERE status = 'pending';

-- =====================================================
-- CREATE DEFAULT ADMIN IF NOT EXISTS
-- =====================================================
INSERT INTO admins (name, email, password, role, is_active)
SELECT 'System Admin', 'admin@ticketbus.rw', '$2a$10$wqsqElzVdniSALsOIQb5GOXtnxW8jEPHUI1XIToAEL9NlbxXMqF1.', 'super_admin', 1
WHERE NOT EXISTS (SELECT 1 FROM admins WHERE email = 'admin@ticketbus.rw');

-- =====================================================
-- CREATE DEFAULT CUSTOMER IF NOT EXISTS
-- =====================================================
INSERT INTO users (user_name, email, phone, password, full_name, is_active)
SELECT 'customer', 'customer@example.com', '+250788123456', '$2a$10$wqsqElzVdniSALsOIQb5GOXtnxW8jEPHUI1XIToAEL9NlbxXMqF1.', 'Test Customer', 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'customer@example.com');

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT 'Database setup completed successfully!' as message,
       (SELECT COUNT(*) FROM subscription_plans) as subscription_plans,
       (SELECT COUNT(*) FROM admins) as total_admins,
       (SELECT COUNT(*) FROM users) as total_users,
       (SELECT COUNT(*) FROM companies) as total_companies;
