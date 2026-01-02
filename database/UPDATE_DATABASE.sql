-- ============================================
-- Database Update Script for Bus Booking System
-- Run this to update your existing database schema
-- ============================================

USE `ticketbooking`;

-- ============================================
-- 1. UPDATE USERS TABLE
-- Make phone and full_name nullable for specification compliance
-- ============================================
ALTER TABLE `users` 
  MODIFY COLUMN `phone` VARCHAR(20) DEFAULT NULL,
  MODIFY COLUMN `full_name` VARCHAR(150) DEFAULT NULL;

-- Remove unique constraint from phone to allow NULL values
ALTER TABLE `users` 
  DROP INDEX `phone`;

-- Add back index on phone without unique constraint
ALTER TABLE `users` 
  ADD INDEX `idx_phone` (`phone`);

-- ============================================
-- 2. VERIFY USERS TABLE STRUCTURE
-- Expected columns: id, user_name, email, phone, password, full_name, reset_token, reset_token_expiry, is_active, created_at, updated_at
-- ============================================

-- ============================================
-- 3. VERIFY TICKETS TABLE
-- Should have all booking-related fields
-- ============================================

-- Check if passenger_name and passenger_phone exist
-- If not, add them
SET @dbname = DATABASE();
SET @tablename = "tickets";
SET @columnname = "passenger_name";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD ", @columnname, " VARCHAR(100) DEFAULT NULL AFTER seat_number")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = "passenger_phone";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD ", @columnname, " VARCHAR(20) DEFAULT NULL AFTER passenger_name")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================
-- 4. ENSURE ALL INDEXES EXIST
-- ============================================

-- Users table indexes
ALTER TABLE `users` ADD INDEX IF NOT EXISTS `idx_username` (`user_name`);
ALTER TABLE `users` ADD INDEX IF NOT EXISTS `idx_email` (`email`);
ALTER TABLE `users` ADD INDEX IF NOT EXISTS `idx_active` (`is_active`);

-- Trips table indexes
ALTER TABLE `trips` ADD INDEX IF NOT EXISTS `idx_route` (`route_id`);
ALTER TABLE `trips` ADD INDEX IF NOT EXISTS `idx_date` (`trip_date`);
ALTER TABLE `trips` ADD INDEX IF NOT EXISTS `idx_status` (`status`);

-- Tickets table indexes
ALTER TABLE `tickets` ADD INDEX IF NOT EXISTS `idx_user` (`user_id`);
ALTER TABLE `tickets` ADD INDEX IF NOT EXISTS `idx_trip` (`trip_id`);
ALTER TABLE `tickets` ADD INDEX IF NOT EXISTS `idx_status` (`status`);
ALTER TABLE `tickets` ADD INDEX IF NOT EXISTS `idx_booking_date` (`booking_date`);

-- ============================================
-- 5. ADD SAMPLE ADMIN USER (if not exists)
-- Password: admin123@
-- ============================================
INSERT INTO `admins` (`name`, `email`, `password`, `role`, `is_active`)
SELECT 'System Administrator', 'admin@admin.com', '$2a$10$X5mXJ3hQvL.P5fRXz9rVpOKGhP5ZGqk8qP.5L4hJg5gD5hQvL.P5f', 'super_admin', 1
WHERE NOT EXISTS (
  SELECT 1 FROM `admins` WHERE `email` = 'admin@admin.com'
);

-- ============================================
-- 6. ADD SAMPLE DATA FOR TESTING
-- ============================================

-- Insert sample company
INSERT INTO `companies` (`name`, `phone`, `email`, `address`, `is_active`)
SELECT 'Elite Express', '+250788123456', 'info@eliteexpress.rw', 'Kigali, Rwanda', 1
WHERE NOT EXISTS (
  SELECT 1 FROM `companies` WHERE `name` = 'Elite Express'
);

-- Get company ID
SET @company_id = (SELECT `id` FROM `companies` WHERE `name` = 'Elite Express' LIMIT 1);

-- Insert sample car
INSERT INTO `cars` (`company_id`, `plate_number`, `name`, `capacity`, `is_active`)
SELECT @company_id, 'RAD123A', 'Scania Bus 001', 45, 1
WHERE NOT EXISTS (
  SELECT 1 FROM `cars` WHERE `plate_number` = 'RAD123A'
);

-- Insert sample stops
INSERT INTO `stops` (`name`, `city`, `district`, `latitude`, `longitude`, `is_active`)
SELECT 'Nyabugogo Bus Terminal', 'Kigali', 'Nyarugenge', -1.9406, 30.0574, 1
WHERE NOT EXISTS (
  SELECT 1 FROM `stops` WHERE `name` = 'Nyabugogo Bus Terminal'
);

INSERT INTO `stops` (`name`, `city`, `district`, `latitude`, `longitude`, `is_active`)
SELECT 'Musanze Bus Station', 'Musanze', 'Musanze', -1.4987, 29.6353, 1
WHERE NOT EXISTS (
  SELECT 1 FROM `stops` WHERE `name` = 'Musanze Bus Station'
);

INSERT INTO `stops` (`name`, `city`, `district`, `latitude`, `longitude`, `is_active`)
SELECT 'Rubavu Bus Park', 'Rubavu', 'Rubavu', -1.6777, 29.2604, 1
WHERE NOT EXISTS (
  SELECT 1 FROM `stops` WHERE `name` = 'Rubavu Bus Park'
);

-- ============================================
-- 7. VERIFICATION QUERIES
-- Run these to check if updates were successful
-- ============================================

-- Check users table structure
SELECT 
    'users' as table_name,
    COLUMN_NAME, 
    COLUMN_TYPE, 
    IS_NULLABLE, 
    COLUMN_KEY,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'ticketbooking' 
AND TABLE_NAME = 'users'
ORDER BY ORDINAL_POSITION;

-- Check tickets table structure
SELECT 
    'tickets' as table_name,
    COLUMN_NAME, 
    COLUMN_TYPE, 
    IS_NULLABLE, 
    COLUMN_KEY,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'ticketbooking' 
AND TABLE_NAME = 'tickets'
ORDER BY ORDINAL_POSITION;

-- Check if admin exists
SELECT id, name, email, role, is_active FROM admins WHERE email = 'admin@admin.com';

-- Check if sample data exists
SELECT 
    (SELECT COUNT(*) FROM companies) as companies_count,
    (SELECT COUNT(*) FROM cars) as cars_count,
    (SELECT COUNT(*) FROM stops) as stops_count,
    (SELECT COUNT(*) FROM admins) as admins_count;

-- ============================================
-- UPDATE COMPLETE
-- ============================================
SELECT 'Database update completed successfully!' as status;
