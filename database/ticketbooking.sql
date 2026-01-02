-- ============================================
-- Professional Bus Ticketing System Database
-- Database: ticketbooking
-- Version: 2.0
-- ============================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- ============================================
-- DATABASE CREATION
-- ============================================
CREATE DATABASE IF NOT EXISTS `ticketbooking` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `ticketbooking`;

-- ============================================
-- TABLE: admins
-- Description: System administrators
-- ============================================
DROP TABLE IF EXISTS `admins`;
CREATE TABLE `admins` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('super_admin', 'admin') DEFAULT 'admin',
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_email` (`email`),
  INDEX `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: users
-- Description: Regular users/customers
-- ============================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_name` VARCHAR(100) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `phone` VARCHAR(20) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(150) DEFAULT NULL,
  `reset_token` VARCHAR(100) DEFAULT NULL,
  `reset_token_expiry` DATETIME DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_username` (`user_name`),
  INDEX `idx_email` (`email`),
  INDEX `idx_phone` (`phone`),
  INDEX `idx_reset_token` (`reset_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: companies
-- Description: Bus transport companies
-- ============================================
DROP TABLE IF EXISTS `companies`;
CREATE TABLE `companies` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL UNIQUE,
  `phone` VARCHAR(20) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `address` TEXT DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: cars
-- Description: Bus/vehicle information
-- ============================================
DROP TABLE IF EXISTS `cars`;
CREATE TABLE `cars` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` INT UNSIGNED NOT NULL,
  `plate_number` VARCHAR(20) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `capacity` INT UNSIGNED NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_plate` (`plate_number`),
  INDEX `idx_company` (`company_id`),
  CONSTRAINT `fk_cars_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: drivers
-- Description: Bus drivers
-- ============================================
DROP TABLE IF EXISTS `drivers`;
CREATE TABLE `drivers` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `license_number` VARCHAR(50) NOT NULL UNIQUE,
  `category` VARCHAR(20) DEFAULT NULL,
  `plate_number` VARCHAR(20) DEFAULT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_license` (`license_number`),
  INDEX `idx_email` (`email`),
  INDEX `idx_plate` (`plate_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: stops
-- Description: Bus stops/stations
-- ============================================
DROP TABLE IF EXISTS `stops`;
CREATE TABLE `stops` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL UNIQUE,
  `location` VARCHAR(255) DEFAULT NULL,
  `latitude` DECIMAL(10, 8) DEFAULT NULL,
  `longitude` DECIMAL(11, 8) DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: routes
-- Description: Bus routes
-- ============================================
DROP TABLE IF EXISTS `routes`;
CREATE TABLE `routes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `origin_stop_id` INT UNSIGNED NOT NULL,
  `destination_stop_id` INT UNSIGNED NOT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_name` (`name`),
  INDEX `idx_origin` (`origin_stop_id`),
  INDEX `idx_destination` (`destination_stop_id`),
  CONSTRAINT `fk_routes_origin` FOREIGN KEY (`origin_stop_id`) REFERENCES `stops` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_routes_destination` FOREIGN KEY (`destination_stop_id`) REFERENCES `stops` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: route_stops
-- Description: Intermediate stops for routes
-- ============================================
DROP TABLE IF EXISTS `route_stops`;
CREATE TABLE `route_stops` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `route_id` INT UNSIGNED NOT NULL,
  `stop_id` INT UNSIGNED NOT NULL,
  `stop_order` INT UNSIGNED NOT NULL,
  `travel_time` INT UNSIGNED DEFAULT 0 COMMENT 'Minutes from origin',
  `is_final_stop` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_route_stop_order` (`route_id`, `stop_order`),
  INDEX `idx_route` (`route_id`),
  INDEX `idx_stop` (`stop_id`),
  INDEX `idx_order` (`stop_order`),
  CONSTRAINT `fk_route_stops_route` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_route_stops_stop` FOREIGN KEY (`stop_id`) REFERENCES `stops` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: destination_prices
-- Description: Pricing between stops
-- ============================================
DROP TABLE IF EXISTS `destination_prices`;
CREATE TABLE `destination_prices` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `route_id` INT UNSIGNED NOT NULL,
  `start_stop_id` INT UNSIGNED NOT NULL,
  `end_stop_id` INT UNSIGNED NOT NULL,
  `price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_route_segment` (`route_id`, `start_stop_id`, `end_stop_id`),
  INDEX `idx_route` (`route_id`),
  INDEX `idx_start_stop` (`start_stop_id`),
  INDEX `idx_end_stop` (`end_stop_id`),
  CONSTRAINT `fk_dest_prices_route` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_dest_prices_start` FOREIGN KEY (`start_stop_id`) REFERENCES `stops` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_dest_prices_end` FOREIGN KEY (`end_stop_id`) REFERENCES `stops` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: daily_schedules
-- Description: Daily recurring schedules
-- ============================================
DROP TABLE IF EXISTS `daily_schedules`;
CREATE TABLE `daily_schedules` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `route_id` INT UNSIGNED NOT NULL,
  `car_id` INT UNSIGNED NOT NULL,
  `driver_id` INT UNSIGNED DEFAULT NULL,
  `car_name` VARCHAR(100) DEFAULT NULL,
  `departure_time` TIME NOT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_route` (`route_id`),
  INDEX `idx_car` (`car_id`),
  INDEX `idx_driver` (`driver_id`),
  INDEX `idx_departure` (`departure_time`),
  INDEX `idx_active` (`is_active`),
  CONSTRAINT `fk_daily_schedules_route` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_daily_schedules_car` FOREIGN KEY (`car_id`) REFERENCES `cars` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_daily_schedules_driver` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: trips
-- Description: Trip instances
-- ============================================
DROP TABLE IF EXISTS `trips`;
CREATE TABLE `trips` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `route_id` INT UNSIGNED NOT NULL,
  `car_id` INT UNSIGNED NOT NULL,
  `car_name` VARCHAR(100) DEFAULT NULL,
  `driver_id` INT UNSIGNED DEFAULT NULL,
  `departure_time` DATETIME NOT NULL,
  `actual_departure_time` DATETIME DEFAULT NULL,
  `actual_arrival_time` DATETIME DEFAULT NULL,
  `last_stop_id` INT UNSIGNED DEFAULT NULL,
  `last_stop_time` DATETIME DEFAULT NULL,
  `status` ENUM('scheduled', 'in_transit', 'completed', 'cancelled') DEFAULT 'scheduled',
  `trip_status` VARCHAR(50) DEFAULT 'scheduled',
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_route` (`route_id`),
  INDEX `idx_car` (`car_id`),
  INDEX `idx_driver` (`driver_id`),
  INDEX `idx_departure` (`departure_time`),
  INDEX `idx_status` (`status`),
  INDEX `idx_active` (`is_active`),
  CONSTRAINT `fk_trips_route` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_trips_car` FOREIGN KEY (`car_id`) REFERENCES `cars` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_trips_driver` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_trips_last_stop` FOREIGN KEY (`last_stop_id`) REFERENCES `stops` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: trip_stop_times
-- Description: Scheduled times for stops in trips
-- ============================================
DROP TABLE IF EXISTS `trip_stop_times`;
CREATE TABLE `trip_stop_times` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `trip_id` INT UNSIGNED NOT NULL,
  `stop_id` INT UNSIGNED NOT NULL,
  `arrival_time` TIME DEFAULT NULL,
  `departure_time` TIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_trip` (`trip_id`),
  INDEX `idx_stop` (`stop_id`),
  CONSTRAINT `fk_trip_stop_times_trip` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_trip_stop_times_stop` FOREIGN KEY (`stop_id`) REFERENCES `stops` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: tickets
-- Description: Active ticket bookings
-- ============================================
DROP TABLE IF EXISTS `tickets`;
CREATE TABLE `tickets` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `trip_id` INT UNSIGNED NOT NULL,
  `boarding_stop_id` INT UNSIGNED NOT NULL,
  `dropoff_stop_id` INT UNSIGNED NOT NULL,
  `seat_number` INT UNSIGNED NOT NULL,
  `price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `passenger_name` VARCHAR(150) DEFAULT NULL,
  `passenger_phone` VARCHAR(20) DEFAULT NULL,
  `departure_time` DATETIME DEFAULT NULL,
  `booking_date` DATE DEFAULT NULL,
  `status` ENUM('Pending', 'Accepted', 'On Board', 'Completed', 'Cancelled', 'Rejected') DEFAULT 'Pending',
  `payment_status` ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
  `payment_method` VARCHAR(50) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_user` (`user_id`),
  INDEX `idx_trip` (`trip_id`),
  INDEX `idx_boarding_stop` (`boarding_stop_id`),
  INDEX `idx_dropoff_stop` (`dropoff_stop_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_payment_status` (`payment_status`),
  INDEX `idx_booking_date` (`booking_date`),
  CONSTRAINT `fk_tickets_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_tickets_trip` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_tickets_boarding` FOREIGN KEY (`boarding_stop_id`) REFERENCES `stops` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_tickets_dropoff` FOREIGN KEY (`dropoff_stop_id`) REFERENCES `stops` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: tickets2
-- Description: Archived/completed tickets
-- ============================================
DROP TABLE IF EXISTS `tickets2`;
CREATE TABLE `tickets2` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `original_ticket_id` INT UNSIGNED DEFAULT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `trip_id` INT UNSIGNED DEFAULT NULL,
  `boarding_stop_id` INT UNSIGNED DEFAULT NULL,
  `dropoff_stop_id` INT UNSIGNED DEFAULT NULL,
  `seat_number` INT UNSIGNED DEFAULT NULL,
  `price` DECIMAL(10, 2) DEFAULT 0.00,
  `passenger_name` VARCHAR(150) DEFAULT NULL,
  `passenger_phone` VARCHAR(20) DEFAULT NULL,
  `departure_time` DATETIME DEFAULT NULL,
  `booking_date` DATE DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT NULL,
  `payment_status` VARCHAR(50) DEFAULT NULL,
  `payment_method` VARCHAR(50) DEFAULT NULL,
  `archived_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_user` (`user_id`),
  INDEX `idx_original_ticket` (`original_ticket_id`),
  INDEX `idx_archived` (`archived_at`),
  CONSTRAINT `fk_tickets2_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DEFAULT DATA INSERTION
-- ============================================

-- Insert default admin
-- Password: admin123@ (bcrypt hashed)
INSERT INTO `admins` (`name`, `email`, `password`, `role`, `is_active`) VALUES
('System Administrator', 'fred@admin.com', '$2b$10$YourBcryptHashHereForAdmin123@Password', 'super_admin', 1);

-- Note: You'll need to hash the password 'admin123@' using bcrypt in your Node.js application
-- Update the password field after running the application for the first time

-- ============================================
-- SAMPLE DATA (Optional - Remove in production)
-- ============================================

-- Sample Companies
INSERT INTO `companies` (`name`, `phone`, `email`, `address`) VALUES
('Elite Bus Services', '+250788123456', 'info@elitebus.rw', 'Kigali, Rwanda'),
('Rwanda Express Transport', '+250788234567', 'contact@rwandaexpress.rw', 'Kigali, Rwanda');

-- Sample Stops
INSERT INTO `stops` (`name`, `location`, `latitude`, `longitude`) VALUES
('Nyabugogo', 'Kigali', -1.9536, 30.0606),
('Kimironko', 'Kigali', -1.9447, 30.1308),
('Remera', 'Kigali', -1.9578, 30.1044),
('Muhanga', 'Southern Province', -2.0844, 29.7419),
('Huye', 'Southern Province', -2.5969, 29.7392),
('Rubavu', 'Western Province', -1.6789, 29.2664),
('Musanze', 'Northern Province', -1.4992, 29.6358);

-- Sample Cars
INSERT INTO `cars` (`company_id`, `plate_number`, `name`, `capacity`) VALUES
(1, 'RAD 001A', 'Volvo B9R', 45),
(1, 'RAD 002B', 'Mercedes Travego', 50),
(2, 'RAD 003C', 'Scania K360', 48);

-- Sample Drivers
-- Password: driver123 (bcrypt hashed)
INSERT INTO `drivers` (`name`, `license_number`, `category`, `plate_number`, `phone`, `email`, `password`) VALUES
('John Mugabo', 'DL001234', 'D', 'RAD 001A', '+250788345678', 'john.mugabo@elitebus.rw', '$2b$10$YourBcryptHashHereForDriver123'),
('Peter Nkusi', 'DL001235', 'D', 'RAD 002B', '+250788456789', 'peter.nkusi@elitebus.rw', '$2b$10$YourBcryptHashHereForDriver123'),
('Emmanuel Habimana', 'DL001236', 'D', 'RAD 003C', '+250788567890', 'emmanuel.h@rwandaexpress.rw', '$2b$10$YourBcryptHashHereForDriver123');

-- Sample Routes
INSERT INTO `routes` (`name`, `origin_stop_id`, `destination_stop_id`) VALUES
('Kigali - Huye', 1, 5),
('Kigali - Rubavu', 1, 6),
('Kigali - Musanze', 1, 7);

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
INSERT INTO `daily_schedules` (`route_id`, `car_id`, `driver_id`, `car_name`, `departure_time`, `is_active`) VALUES
(1, 1, 1, 'Volvo B9R', '06:00:00', 1),
(1, 2, 2, 'Mercedes Travego', '08:00:00', 1),
(2, 3, 3, 'Scania K360', '07:00:00', 1),
(3, 1, 1, 'Volvo B9R', '14:00:00', 1);

-- ============================================
-- VIEWS (Optional - For reporting)
-- ============================================

CREATE OR REPLACE VIEW `v_active_tickets` AS
SELECT 
    t.id,
    t.seat_number,
    t.price,
    t.status,
    t.payment_status,
    u.user_name,
    u.email AS user_email,
    u.phone AS user_phone,
    tr.departure_time,
    r.name AS route_name,
    s1.name AS boarding_stop,
    s2.name AS dropoff_stop,
    c.plate_number,
    c.name AS car_name
FROM tickets t
JOIN users u ON t.user_id = u.id
JOIN trips tr ON t.trip_id = tr.id
JOIN routes r ON tr.route_id = r.id
JOIN stops s1 ON t.boarding_stop_id = s1.id
JOIN stops s2 ON t.dropoff_stop_id = s2.id
JOIN cars c ON tr.car_id = c.id
WHERE t.status IN ('Pending', 'Accepted', 'On Board');

CREATE OR REPLACE VIEW `v_trip_summary` AS
SELECT 
    tr.id AS trip_id,
    r.name AS route_name,
    c.plate_number,
    c.name AS car_name,
    c.capacity,
    d.name AS driver_name,
    tr.departure_time,
    tr.status,
    COUNT(t.id) AS booked_seats,
    (c.capacity - COUNT(t.id)) AS available_seats
FROM trips tr
JOIN routes r ON tr.route_id = r.id
JOIN cars c ON tr.car_id = c.id
LEFT JOIN drivers d ON tr.driver_id = d.id
LEFT JOIN tickets t ON tr.id = t.trip_id AND t.status IN ('Accepted', 'On Board', 'Pending')
WHERE tr.is_active = 1
GROUP BY tr.id;

-- ============================================
-- STORED PROCEDURES
-- ============================================

DELIMITER $$

-- Procedure to get available seats for a trip segment
CREATE PROCEDURE `sp_get_available_seats`(
    IN p_trip_id INT,
    IN p_boarding_stop_order INT,
    IN p_dropoff_stop_order INT
)
BEGIN
    SELECT DISTINCT t.seat_number
    FROM tickets t
    JOIN trips tr ON t.trip_id = tr.id
    JOIN route_stops rs_boarding ON tr.route_id = rs_boarding.route_id 
        AND t.boarding_stop_id = rs_boarding.stop_id
    JOIN route_stops rs_dropoff ON tr.route_id = rs_dropoff.route_id 
        AND t.dropoff_stop_id = rs_dropoff.stop_id
    WHERE t.trip_id = p_trip_id
        AND t.status IN ('Accepted', 'On Board', 'Pending')
        AND (
            p_boarding_stop_order < rs_dropoff.stop_order 
            AND p_dropoff_stop_order > rs_boarding.stop_order
        );
END$$

DELIMITER ;

-- ============================================
-- TRIGGERS
-- ============================================

DELIMITER $$

-- Trigger to update route_stops is_final_stop
CREATE TRIGGER `trg_update_final_stop` BEFORE INSERT ON `route_stops`
FOR EACH ROW
BEGIN
    DECLARE dest_stop INT;
    
    SELECT destination_stop_id INTO dest_stop
    FROM routes
    WHERE id = NEW.route_id;
    
    IF NEW.stop_id = dest_stop THEN
        SET NEW.is_final_stop = 1;
    ELSE
        SET NEW.is_final_stop = 0;
    END IF;
END$$

DELIMITER ;

-- ============================================
-- INDEXES FOR OPTIMIZATION
-- ============================================

-- Additional composite indexes for common queries
CREATE INDEX `idx_tickets_trip_status` ON `tickets` (`trip_id`, `status`);
CREATE INDEX `idx_trips_route_date` ON `trips` (`route_id`, `departure_time`);
CREATE INDEX `idx_trips_car_active` ON `trips` (`car_id`, `is_active`);
CREATE INDEX `idx_daily_schedules_route_active` ON `daily_schedules` (`route_id`, `is_active`);

-- ============================================
-- GRANT PERMISSIONS (Update with your credentials)
-- ============================================

-- CREATE USER IF NOT EXISTS 'ticketbooking_user'@'localhost' IDENTIFIED BY 'YourSecurePassword123!';
-- GRANT ALL PRIVILEGES ON ticketbooking.* TO 'ticketbooking_user'@'localhost';
-- FLUSH PRIVILEGES;

-- ============================================
-- DATABASE INFORMATION
-- ============================================

SELECT 'Database ticketbooking created successfully!' AS Status;
SELECT COUNT(*) AS AdminCount FROM admins;
SELECT COUNT(*) AS CompanyCount FROM companies;
SELECT COUNT(*) AS StopCount FROM stops;
SELECT COUNT(*) AS RouteCount FROM routes;
SELECT COUNT(*) AS CarCount FROM cars;
SELECT COUNT(*) AS DriverCount FROM drivers;

COMMIT;
