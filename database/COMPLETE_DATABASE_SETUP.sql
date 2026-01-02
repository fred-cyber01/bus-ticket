-- ============================================
-- RWANDA BUS TICKETING SYSTEM - COMPLETE DATABASE
-- Version: 3.0 - Complete Edition
-- Date: December 12, 2025
-- Database: ticketbooking
-- ============================================
-- This file contains:
-- - All base tables (users, companies, buses, routes, trips, tickets)
-- - Payment system (MTN, Airtel, MoMoPay, Bank Transfer)
-- - Subscription plans (Free Trial, Standard, Premium)
-- - Company management and approval workflow
-- - QR code ticketing system
-- - System earnings tracking (10 RWF per ticket)
-- ============================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- Drop existing database and create fresh
DROP DATABASE IF EXISTS `ticketbooking`;
CREATE DATABASE `ticketbooking` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `ticketbooking`;

-- ============================================
-- CORE USER MANAGEMENT TABLES
-- ============================================

-- Admins Table
CREATE TABLE `admins` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('super_admin', 'admin', 'moderator') DEFAULT 'admin',
  `phone` VARCHAR(20),
  `reset_token` VARCHAR(255),
  `reset_token_expiry` TIMESTAMP NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `last_login` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_email` (`email`),
  INDEX `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Regular Users (Customers)
CREATE TABLE `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) UNIQUE NOT NULL,
  `phone` VARCHAR(20),
  `password` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(150),
  `reset_token` VARCHAR(255),
  `reset_token_expiry` TIMESTAMP NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `last_login` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_username` (`user_name`),
  INDEX `idx_email` (`email`),
  INDEX `idx_phone` (`phone`),
  INDEX `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SUBSCRIPTION SYSTEM TABLES
-- ============================================

-- Subscription Plans
CREATE TABLE `subscription_plans` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `duration_days` INT NOT NULL DEFAULT 30,
  `bus_limit` INT NOT NULL DEFAULT 3,
  `features` JSON,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_name` (`name`),
  INDEX `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- COMPANY MANAGEMENT TABLES
-- ============================================

-- Companies (Bus Transport Companies)
CREATE TABLE `companies` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_name` VARCHAR(150) NOT NULL,
  `tin` VARCHAR(50) UNIQUE,
  `contact_info` TEXT,
  `phone` VARCHAR(20),
  `email` VARCHAR(150),
  `address` TEXT,
  `status` ENUM('pending', 'approved', 'rejected', 'blocked') DEFAULT 'pending',
  `approved_by` INT UNSIGNED,
  `approved_at` TIMESTAMP NULL,
  `rejection_reason` TEXT,
  `subscription_status` ENUM('active', 'expired', 'cancelled') DEFAULT 'expired',
  `current_plan_id` INT UNSIGNED,
  `bus_limit` INT DEFAULT 3,
  `trial_start_date` TIMESTAMP NULL,
  `trial_end_date` TIMESTAMP NULL,
  `subscription_expires_at` TIMESTAMP NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_name` (`company_name`),
  INDEX `idx_tin` (`tin`),
  INDEX `idx_status` (`status`),
  INDEX `idx_subscription_status` (`subscription_status`),
  CONSTRAINT `fk_companies_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `admins` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_companies_plan` FOREIGN KEY (`current_plan_id`) REFERENCES `subscription_plans` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Company Managers (Company Owners/Managers)
CREATE TABLE `company_managers` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20),
  `role` ENUM('owner', 'manager') DEFAULT 'manager',
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_email` (`email`),
  INDEX `idx_company` (`company_id`),
  CONSTRAINT `fk_managers_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Company Subscriptions History
CREATE TABLE `company_subscriptions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INT UNSIGNED NOT NULL,
  `plan_id` INT UNSIGNED NOT NULL,
  `payment_id` INT UNSIGNED,
  `start_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `end_date` TIMESTAMP NOT NULL,
  `amount_paid` DECIMAL(10, 2) DEFAULT 0.00,
  `status` ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
  `auto_renew` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_company` (`company_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_dates` (`start_date`, `end_date`),
  CONSTRAINT `fk_subscriptions_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_subscriptions_plan` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FLEET MANAGEMENT TABLES
-- ============================================

-- Cars/Buses
CREATE TABLE `cars` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INT UNSIGNED NOT NULL,
  `plate_number` VARCHAR(20) UNIQUE NOT NULL,
  `name` VARCHAR(100),
  `type` VARCHAR(50),
  `capacity` INT NOT NULL DEFAULT 30,
  `park` VARCHAR(100),
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_plate` (`plate_number`),
  INDEX `idx_company` (`company_id`),
  INDEX `idx_active` (`is_active`),
  CONSTRAINT `fk_cars_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Drivers
CREATE TABLE `drivers` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(20),
  `email` VARCHAR(150),
  `license_number` VARCHAR(50) UNIQUE,
  `category` VARCHAR(10),
  `plate_number` VARCHAR(20),
  `password` VARCHAR(255),
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_license` (`license_number`),
  INDEX `idx_company` (`company_id`),
  INDEX `idx_plate` (`plate_number`),
  CONSTRAINT `fk_drivers_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ROUTE MANAGEMENT TABLES
-- ============================================

-- Bus Stops/Stations
CREATE TABLE `stops` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `city` VARCHAR(100),
  `district` VARCHAR(100),
  `province` VARCHAR(100),
  `location` TEXT,
  `latitude` DECIMAL(10, 8),
  `longitude` DECIMAL(11, 8),
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_name` (`name`),
  INDEX `idx_city` (`city`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Routes
CREATE TABLE `routes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INT UNSIGNED,
  `name` VARCHAR(150) NOT NULL,
  `origin_stop_id` INT UNSIGNED NOT NULL,
  `destination_stop_id` INT UNSIGNED NOT NULL,
  `description` TEXT,
  `distance_km` DECIMAL(10, 2),
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_name` (`name`),
  INDEX `idx_origin` (`origin_stop_id`),
  INDEX `idx_destination` (`destination_stop_id`),
  CONSTRAINT `fk_routes_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_routes_origin` FOREIGN KEY (`origin_stop_id`) REFERENCES `stops` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_routes_destination` FOREIGN KEY (`destination_stop_id`) REFERENCES `stops` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Route Stops (Intermediate stops)
CREATE TABLE `route_stops` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `route_id` INT UNSIGNED NOT NULL,
  `stop_id` INT UNSIGNED NOT NULL,
  `stop_order` INT NOT NULL,
  `distance_km` DECIMAL(10, 2),
  `travel_time` INT COMMENT 'Minutes from origin',
  `is_final_stop` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_route` (`route_id`),
  INDEX `idx_stop` (`stop_id`),
  INDEX `idx_order` (`route_id`, `stop_order`),
  CONSTRAINT `fk_route_stops_route` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_route_stops_stop` FOREIGN KEY (`stop_id`) REFERENCES `stops` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Destination Prices
CREATE TABLE `destination_prices` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `route_id` INT UNSIGNED NOT NULL,
  `start_stop_id` INT UNSIGNED NOT NULL,
  `end_stop_id` INT UNSIGNED NOT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_route` (`route_id`),
  INDEX `idx_stops` (`start_stop_id`, `end_stop_id`),
  CONSTRAINT `fk_dest_prices_route` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dest_prices_start` FOREIGN KEY (`start_stop_id`) REFERENCES `stops` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dest_prices_end` FOREIGN KEY (`end_stop_id`) REFERENCES `stops` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Daily Schedules
CREATE TABLE `daily_schedules` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `route_id` INT UNSIGNED NOT NULL,
  `car_id` INT UNSIGNED NOT NULL,
  `driver_id` INT UNSIGNED,
  `car_name` VARCHAR(100),
  `departure_time` TIME NOT NULL,
  `arrival_time` TIME,
  `days_of_week` VARCHAR(50) COMMENT 'Comma-separated: Mon,Tue,Wed,Thu,Fri,Sat,Sun',
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_route` (`route_id`),
  INDEX `idx_car` (`car_id`),
  INDEX `idx_time` (`departure_time`),
  CONSTRAINT `fk_daily_schedules_route` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_daily_schedules_car` FOREIGN KEY (`car_id`) REFERENCES `cars` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_daily_schedules_driver` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TRIP AND BOOKING TABLES
-- ============================================

-- Trips (Actual trip instances)
CREATE TABLE `trips` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `route_id` INT UNSIGNED NOT NULL,
  `car_id` INT UNSIGNED NOT NULL,
  `driver_id` INT UNSIGNED,
  `schedule_id` INT UNSIGNED,
  `trip_date` DATE NOT NULL,
  `departure_time` TIME NOT NULL,
  `arrival_time` TIME,
  `origin_id` INT UNSIGNED NOT NULL,
  `destination_id` INT UNSIGNED NOT NULL,
  `last_stop_id` INT UNSIGNED,
  `available_seats` INT NOT NULL,
  `total_seats` INT NOT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `status` ENUM('scheduled', 'boarding', 'departed', 'arrived', 'cancelled') DEFAULT 'scheduled',
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_route` (`route_id`),
  INDEX `idx_date` (`trip_date`),
  INDEX `idx_status` (`status`),
  INDEX `idx_car` (`car_id`),
  CONSTRAINT `fk_trips_route` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_trips_car` FOREIGN KEY (`car_id`) REFERENCES `cars` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_trips_driver` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_trips_origin` FOREIGN KEY (`origin_id`) REFERENCES `stops` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_trips_destination` FOREIGN KEY (`destination_id`) REFERENCES `stops` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_trips_last_stop` FOREIGN KEY (`last_stop_id`) REFERENCES `stops` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trip Stop Times
CREATE TABLE `trip_stop_times` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `trip_id` INT UNSIGNED NOT NULL,
  `stop_id` INT UNSIGNED NOT NULL,
  `arrival_time` TIME,
  `departure_time` TIME,
  `stop_order` INT NOT NULL,
  `is_final_stop` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_trip` (`trip_id`),
  INDEX `idx_stop` (`stop_id`),
  CONSTRAINT `fk_trip_stop_times_trip` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_trip_stop_times_stop` FOREIGN KEY (`stop_id`) REFERENCES `stops` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PAYMENT SYSTEM TABLES
-- ============================================

-- Payments
CREATE TABLE `payments` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INT UNSIGNED,
  `user_id` INT UNSIGNED,
  `payment_type` ENUM('ticket', 'subscription') NOT NULL,
  `reference_id` INT UNSIGNED COMMENT 'ticket_id or subscription_id',
  `amount` DECIMAL(10, 2) NOT NULL,
  `system_fee` DECIMAL(10, 2) DEFAULT 10.00,
  `payment_method` ENUM('mtn_momo', 'airtel_money', 'momopay', 'bank_transfer') NOT NULL,
  `transaction_ref` VARCHAR(255) UNIQUE NOT NULL,
  `phone_number` VARCHAR(20),
  `status` ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
  `payment_data` JSON,
  `completed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_transaction_ref` (`transaction_ref`),
  INDEX `idx_status` (`status`),
  INDEX `idx_company` (`company_id`),
  INDEX `idx_user` (`user_id`),
  CONSTRAINT `fk_payments_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_payments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System Earnings (10 RWF per ticket)
CREATE TABLE `system_earnings` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `payment_id` INT UNSIGNED NOT NULL,
  `ticket_id` INT UNSIGNED,
  `amount` DECIMAL(10, 2) NOT NULL DEFAULT 10.00,
  `status` ENUM('pending', 'withdrawn') DEFAULT 'pending',
  `withdrawn_at` TIMESTAMP NULL,
  `withdrawal_id` INT UNSIGNED,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_payment` (`payment_id`),
  INDEX `idx_status` (`status`),
  CONSTRAINT `fk_earnings_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System Withdrawals
CREATE TABLE `system_withdrawals` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `amount` DECIMAL(10, 2) NOT NULL,
  `withdrawal_method` ENUM('mtn_momo', 'bank_transfer') NOT NULL,
  `phone_number` VARCHAR(20),
  `bank_account` VARCHAR(100),
  `bank_name` VARCHAR(100),
  `transaction_ref` VARCHAR(255),
  `status` ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  `notes` TEXT,
  `processed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payment Webhooks
CREATE TABLE `payment_webhooks` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `payment_id` INT UNSIGNED,
  `provider` ENUM('mtn_momo', 'airtel_money', 'momopay') NOT NULL,
  `transaction_ref` VARCHAR(255),
  `webhook_data` JSON NOT NULL,
  `status` ENUM('received', 'processed', 'failed') DEFAULT 'received',
  `processed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_transaction_ref` (`transaction_ref`),
  INDEX `idx_status` (`status`),
  CONSTRAINT `fk_webhooks_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TICKETING SYSTEM TABLES
-- ============================================

-- Tickets (with QR Code support)
CREATE TABLE `tickets` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `trip_id` INT UNSIGNED NOT NULL,
  `booking_reference` VARCHAR(50) UNIQUE NOT NULL,
  `passenger_name` VARCHAR(255) NOT NULL,
  `passenger_phone` VARCHAR(20) NOT NULL,
  `passenger_email` VARCHAR(255),
  `passenger_age` INT,
  `passenger_gender` VARCHAR(10),
  `seat_number` VARCHAR(10),
  `boarding_stop_id` INT UNSIGNED NOT NULL,
  `dropoff_stop_id` INT UNSIGNED NOT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `payment_id` INT UNSIGNED,
  `payment_status` ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  `ticket_status` ENUM('booked', 'confirmed', 'on_board', 'completed', 'cancelled') DEFAULT 'booked',
  `qr_code` TEXT COMMENT 'QR code data for conductor scanning',
  `departure_time` DATETIME,
  `booking_date` DATE,
  `booked_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `confirmed_at` TIMESTAMP NULL,
  `cancelled_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_user` (`user_id`),
  INDEX `idx_trip` (`trip_id`),
  INDEX `idx_booking_ref` (`booking_reference`),
  INDEX `idx_payment_status` (`payment_status`),
  INDEX `idx_ticket_status` (`ticket_status`),
  CONSTRAINT `fk_tickets_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_tickets_trip` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_tickets_boarding` FOREIGN KEY (`boarding_stop_id`) REFERENCES `stops` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_tickets_dropoff` FOREIGN KEY (`dropoff_stop_id`) REFERENCES `stops` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_tickets_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INSERT DEFAULT DATA
-- ============================================

-- Default Subscription Plans
INSERT INTO `subscription_plans` (`name`, `description`, `price`, `duration_days`, `bus_limit`, `features`, `is_active`) VALUES
('Free Trial', '30-day free trial with up to 3 buses. Perfect for testing the system.', 0.00, 30, 3, '{"support": "email", "analytics": false, "priority_listing": false, "custom_branding": false}', 1),
('Standard', 'Standard plan for small to medium transport companies. Up to 10 buses.', 50000.00, 30, 10, '{"support": "email+phone", "analytics": true, "priority_listing": false, "custom_branding": false}', 1),
('Premium', 'Premium plan for large transport companies. Up to 20 buses with priority support.', 100000.00, 30, 20, '{"support": "24/7", "analytics": true, "priority_listing": true, "custom_branding": true}', 1);

-- Default Admin User
-- Email: admin@ticketbus.rw
-- Password: admin123
INSERT INTO `admins` (`name`, `email`, `password`, `role`, `is_active`) VALUES
('System Administrator', 'admin@ticketbus.rw', '$2a$10$wqsqElzVdniSALsOIQb5GOXtnxW8jEPHUI1XIToAEL9NlbxXMqF1.', 'super_admin', 1);

-- Default Test Customer
-- Email: customer@example.com
-- Password: customer123
INSERT INTO `users` (`user_name`, `email`, `phone`, `password`, `full_name`, `is_active`) VALUES
('customer', 'customer@example.com', '+250788123456', '$2a$10$wqsqElzVdniSALsOIQb5GOXtnxW8jEPHUI1XIToAEL9NlbxXMqF1.', 'Test Customer', 1);

-- Sample Bus Stops
INSERT INTO `stops` (`name`, `city`, `district`, `province`, `location`, `latitude`, `longitude`, `is_active`) VALUES
('Nyabugogo Bus Terminal', 'Kigali', 'Nyarugenge', 'Kigali City', 'Nyabugogo, Kigali', -1.940600, 30.057400, 1),
('Kimironko', 'Kigali', 'Gasabo', 'Kigali City', 'Kimironko, Kigali', -1.944700, 30.130800, 1),
('Remera', 'Kigali', 'Gasabo', 'Kigali City', 'Remera, Kigali', -1.957800, 30.104400, 1),
('Muhanga', 'Muhanga', 'Muhanga', 'Southern Province', 'Muhanga Town', -2.084400, 29.741900, 1),
('Huye (Butare)', 'Huye', 'Huye', 'Southern Province', 'Huye Town', -2.596900, 29.739200, 1),
('Rubavu (Gisenyi)', 'Rubavu', 'Rubavu', 'Western Province', 'Rubavu Town', -1.678900, 29.266400, 1),
('Musanze (Ruhengeri)', 'Musanze', 'Musanze', 'Northern Province', 'Musanze Town', -1.499200, 29.635800, 1),
('Rusizi (Cyangugu)', 'Rusizi', 'Rusizi', 'Western Province', 'Rusizi Town', -2.485600, 28.908900, 1);

-- Sample Company (Approved)
INSERT INTO `companies` (`company_name`, `tin`, `contact_info`, `phone`, `email`, `address`, `status`, `subscription_status`, `current_plan_id`, `bus_limit`, `is_active`) VALUES
('Rwanda Express Transport', '100123456', 'KN 5 Ave, Kigali\nPhone: +250788111222\nEmail: info@rwandaexpress.rw', '+250788111222', 'info@rwandaexpress.rw', 'Kigali, Rwanda', 'approved', 'active', 2, 10, 1);

-- Sample Company Manager for Rwanda Express
-- Email: manager@rwandaexpress.rw
-- Password: manager123
INSERT INTO `company_managers` (`company_id`, `name`, `email`, `password`, `phone`, `role`, `status`) VALUES
(1, 'Jean Paul Uwimana', 'manager@rwandaexpress.rw', '$2a$10$wqsqElzVdniSALsOIQb5GOXtnxW8jEPHUI1XIToAEL9NlbxXMqF1.', '+250788333444', 'owner', 'active');

-- Sample Active Subscription for Rwanda Express
INSERT INTO `company_subscriptions` (`company_id`, `plan_id`, `start_date`, `end_date`, `amount_paid`, `status`, `auto_renew`) VALUES
(1, 2, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 50000.00, 'active', 0);

-- Sample Buses for Rwanda Express
INSERT INTO `cars` (`company_id`, `plate_number`, `name`, `type`, `capacity`, `park`, `is_active`) VALUES
(1, 'RAD 001A', 'Volvo B9R', 'Luxury Coach', 45, 'Nyabugogo', 1),
(1, 'RAD 002B', 'Mercedes Travego', 'Luxury Coach', 50, 'Nyabugogo', 1),
(1, 'RAD 003C', 'Scania K360', 'Standard Coach', 48, 'Nyabugogo', 1);

-- Sample Drivers
-- Password: driver123
INSERT INTO `drivers` (`company_id`, `name`, `phone`, `email`, `license_number`, `category`, `plate_number`, `password`, `is_active`) VALUES
(1, 'John Mugabo', '+250788555666', 'john.mugabo@rwandaexpress.rw', 'DL001234', 'D', 'RAD 001A', '$2a$10$wqsqElzVdniSALsOIQb5GOXtnxW8jEPHUI1XIToAEL9NlbxXMqF1.', 1),
(1, 'Peter Nkusi', '+250788555667', 'peter.nkusi@rwandaexpress.rw', 'DL001235', 'D', 'RAD 002B', '$2a$10$wqsqElzVdniSALsOIQb5GOXtnxW8jEPHUI1XIToAEL9NlbxXMqF1.', 1),
(1, 'Emmanuel Habimana', '+250788555668', 'emmanuel.h@rwandaexpress.rw', 'DL001236', 'D', 'RAD 003C', '$2a$10$wqsqElzVdniSALsOIQb5GOXtnxW8jEPHUI1XIToAEL9NlbxXMqF1.', 1);

-- Sample Routes
INSERT INTO `routes` (`company_id`, `name`, `origin_stop_id`, `destination_stop_id`, `description`, `distance_km`, `is_active`) VALUES
(1, 'Kigali - Huye', 1, 5, 'Daily service from Kigali to Huye via Muhanga', 135, 1),
(1, 'Kigali - Rubavu', 1, 6, 'Daily service from Kigali to Rubavu (Gisenyi)', 155, 1),
(1, 'Kigali - Musanze', 1, 7, 'Daily service from Kigali to Musanze (Ruhengeri)', 90, 1);

-- Sample Route Stops
INSERT INTO `route_stops` (`route_id`, `stop_id`, `stop_order`, `travel_time`, `is_final_stop`) VALUES
-- Kigali - Huye route
(1, 1, 1, 0, 0),      -- Nyabugogo (origin)
(1, 4, 2, 60, 0),     -- Muhanga
(1, 5, 3, 150, 1),    -- Huye (destination)
-- Kigali - Rubavu route
(2, 1, 1, 0, 0),      -- Nyabugogo (origin)
(2, 6, 2, 180, 1),    -- Rubavu (destination)
-- Kigali - Musanze route
(3, 1, 1, 0, 0),      -- Nyabugogo (origin)
(3, 7, 2, 120, 1);    -- Musanze (destination)

-- Sample Destination Prices
INSERT INTO `destination_prices` (`route_id`, `start_stop_id`, `end_stop_id`, `price`) VALUES
-- Kigali - Huye prices
(1, 1, 4, 1500.00),   -- Nyabugogo to Muhanga
(1, 1, 5, 3000.00),   -- Nyabugogo to Huye
(1, 4, 5, 1800.00),   -- Muhanga to Huye
-- Kigali - Rubavu prices
(2, 1, 6, 4500.00),   -- Nyabugogo to Rubavu
-- Kigali - Musanze prices
(3, 1, 7, 2500.00);   -- Nyabugogo to Musanze

-- Sample Daily Schedules
INSERT INTO `daily_schedules` (`route_id`, `car_id`, `driver_id`, `car_name`, `departure_time`, `arrival_time`, `days_of_week`, `is_active`) VALUES
(1, 1, 1, 'Volvo B9R', '06:00:00', '08:30:00', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun', 1),
(1, 2, 2, 'Mercedes Travego', '08:00:00', '10:30:00', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun', 1),
(2, 3, 3, 'Scania K360', '07:00:00', '10:00:00', 'Mon,Wed,Fri,Sun', 1),
(3, 1, 1, 'Volvo B9R', '14:00:00', '16:00:00', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun', 1);

-- Sample Trips (for today and next 3 days)
INSERT INTO `trips` (`route_id`, `car_id`, `driver_id`, `trip_date`, `departure_time`, `arrival_time`, `origin_id`, `destination_id`, `available_seats`, `total_seats`, `price`, `status`, `is_active`) VALUES
-- Today's trips
(1, 1, 1, CURDATE(), '06:00:00', '08:30:00', 1, 5, 45, 45, 3000.00, 'scheduled', 1),
(1, 2, 2, CURDATE(), '08:00:00', '10:30:00', 1, 5, 50, 50, 3000.00, 'scheduled', 1),
(2, 3, 3, CURDATE(), '07:00:00', '10:00:00', 1, 6, 48, 48, 4500.00, 'scheduled', 1),
(3, 1, 1, CURDATE(), '14:00:00', '16:00:00', 1, 7, 45, 45, 2500.00, 'scheduled', 1),
-- Tomorrow's trips
(1, 1, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '06:00:00', '08:30:00', 1, 5, 45, 45, 3000.00, 'scheduled', 1),
(1, 2, 2, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '08:00:00', '10:30:00', 1, 5, 50, 50, 3000.00, 'scheduled', 1),
(2, 3, 3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '07:00:00', '10:00:00', 1, 6, 48, 48, 4500.00, 'scheduled', 1),
(3, 1, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '14:00:00', '16:00:00', 1, 7, 45, 45, 2500.00, 'scheduled', 1);

-- ============================================
-- CREATE USEFUL VIEWS
-- ============================================

-- Active Trips View
CREATE OR REPLACE VIEW `v_active_trips` AS
SELECT 
    t.id,
    t.trip_date,
    t.departure_time,
    t.arrival_time,
    r.name AS route_name,
    s1.name AS origin,
    s2.name AS destination,
    c.name AS car_name,
    c.plate_number,
    d.name AS driver_name,
    t.available_seats,
    t.total_seats,
    t.price,
    t.status,
    comp.company_name
FROM trips t
JOIN routes r ON t.route_id = r.id
JOIN stops s1 ON t.origin_id = s1.id
JOIN stops s2 ON t.destination_id = s2.id
JOIN cars c ON t.car_id = c.id
LEFT JOIN drivers d ON t.driver_id = d.id
LEFT JOIN companies comp ON c.company_id = comp.id
WHERE t.is_active = 1 AND t.status != 'cancelled';

-- Active Subscriptions View
CREATE OR REPLACE VIEW `v_active_subscriptions` AS
SELECT 
    cs.id,
    c.company_name,
    c.tin,
    sp.name AS plan_name,
    sp.price AS plan_price,
    sp.bus_limit,
    cs.start_date,
    cs.end_date,
    cs.amount_paid,
    cs.status,
    DATEDIFF(cs.end_date, NOW()) AS days_remaining
FROM company_subscriptions cs
JOIN companies c ON cs.company_id = c.id
JOIN subscription_plans sp ON cs.plan_id = sp.id
WHERE cs.status = 'active';

-- System Earnings Summary View
CREATE OR REPLACE VIEW `v_system_earnings_summary` AS
SELECT 
    DATE(se.created_at) AS date,
    COUNT(se.id) AS total_transactions,
    SUM(se.amount) AS total_earnings,
    SUM(CASE WHEN se.status = 'withdrawn' THEN se.amount ELSE 0 END) AS withdrawn,
    SUM(CASE WHEN se.status = 'pending' THEN se.amount ELSE 0 END) AS pending
FROM system_earnings se
GROUP BY DATE(se.created_at)
ORDER BY date DESC;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT 
    'Database setup completed successfully!' AS message,
    (SELECT COUNT(*) FROM subscription_plans) AS subscription_plans,
    (SELECT COUNT(*) FROM admins) AS total_admins,
    (SELECT COUNT(*) FROM users) AS total_users,
    (SELECT COUNT(*) FROM companies) AS total_companies,
    (SELECT COUNT(*) FROM cars) AS total_buses,
    (SELECT COUNT(*) FROM stops) AS total_stops,
    (SELECT COUNT(*) FROM routes) AS total_routes,
    (SELECT COUNT(*) FROM trips) AS total_trips,
    'Login Credentials' AS '---',
    'Admin: admin@ticketbus.rw / admin123' AS admin_login,
    'Customer: customer@example.com / customer123' AS customer_login,
    'Company Manager: manager@rwandaexpress.rw / manager123' AS manager_login,
    'Driver: john.mugabo@rwandaexpress.rw / driver123' AS driver_login;

COMMIT;

-- ============================================
-- END OF COMPLETE DATABASE SETUP
-- ============================================
