-- ============================================================================
-- COMPLETE SCHEMA FIX FOR SUPABASE
-- ============================================================================
-- Run this in Supabase SQL Editor to add all missing columns

-- Fix cars/buses table - add total_seats column
ALTER TABLE cars
  ADD COLUMN IF NOT EXISTS total_seats integer DEFAULT 30;

-- Update total_seats to match capacity where it's not set
UPDATE cars 
SET total_seats = capacity 
WHERE total_seats = 30 OR total_seats IS NULL;

-- Add missing columns to cars table
ALTER TABLE cars
  ADD COLUMN IF NOT EXISTS type varchar(50) DEFAULT 'Standard Bus',
  ADD COLUMN IF NOT EXISTS park varchar(100);

-- Add missing columns to trips table for booking system
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS company_id bigint,
  ADD COLUMN IF NOT EXISTS trip_date date,
  ADD COLUMN IF NOT EXISTS price numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_seats integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS occupied_seats integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS available_seats integer DEFAULT 0;

-- Update available_seats calculation for existing trips
UPDATE trips 
SET available_seats = COALESCE(total_seats, 0) - COALESCE(occupied_seats, 0)
WHERE available_seats IS NULL OR available_seats = 0;

-- Add foreign key constraint for company_id in trips
ALTER TABLE trips
  DROP CONSTRAINT IF EXISTS trips_company_id_fkey;
  
ALTER TABLE trips
  ADD CONSTRAINT trips_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Add missing columns to tickets table
ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS company_id bigint,
  ADD COLUMN IF NOT EXISTS route_id bigint,
  ADD COLUMN IF NOT EXISTS booking_reference varchar(100) UNIQUE,
  ADD COLUMN IF NOT EXISTS ticket_price numeric(12,2) DEFAULT 0;

-- Add foreign key constraints for tickets
ALTER TABLE tickets
  DROP CONSTRAINT IF EXISTS tickets_company_id_fkey;
  
ALTER TABLE tickets
  ADD CONSTRAINT tickets_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;

ALTER TABLE tickets
  DROP CONSTRAINT IF EXISTS tickets_route_id_fkey;
  
ALTER TABLE tickets
  ADD CONSTRAINT tickets_route_id_fkey 
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE SET NULL;

-- Add missing columns to drivers table
ALTER TABLE drivers
  ADD COLUMN IF NOT EXISTS category varchar(10) DEFAULT 'D',
  ADD COLUMN IF NOT EXISTS plate_number varchar(20);

-- Add missing columns to routes table
ALTER TABLE routes
  ADD COLUMN IF NOT EXISTS company_id bigint,
  ADD COLUMN IF NOT EXISTS distance numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duration integer DEFAULT 0;

-- Add foreign key for routes company_id
ALTER TABLE routes
  DROP CONSTRAINT IF EXISTS routes_company_id_fkey;
  
ALTER TABLE routes
  ADD CONSTRAINT routes_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cars_company ON cars(company_id);
CREATE INDEX IF NOT EXISTS idx_cars_active ON cars(is_active);
CREATE INDEX IF NOT EXISTS idx_trips_company ON trips(company_id);
CREATE INDEX IF NOT EXISTS idx_trips_date ON trips(trip_date);
CREATE INDEX IF NOT EXISTS idx_trips_route ON trips(route_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_tickets_company ON tickets(company_id);
CREATE INDEX IF NOT EXISTS idx_tickets_route ON tickets(route_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(ticket_status);
CREATE INDEX IF NOT EXISTS idx_tickets_payment ON tickets(payment_status);
CREATE INDEX IF NOT EXISTS idx_drivers_company ON drivers(company_id);
CREATE INDEX IF NOT EXISTS idx_routes_company ON routes(company_id);

-- Success message
SELECT 'Schema updated successfully! You can now run the setup script.' as message;
