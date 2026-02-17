-- ============================================================================
-- STEP 1: RUN THIS IN SUPABASE SQL EDITOR FIRST
-- ============================================================================
-- Go to: Supabase Dashboard → SQL Editor → New Query
-- Paste this entire script and click "Run"

-- Add missing columns to trips table for booking system
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS company_id bigint,
  ADD COLUMN IF NOT EXISTS trip_date date,
  ADD COLUMN IF NOT EXISTS price numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_seats integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS occupied_seats integer DEFAULT 0;

-- Add foreign key constraint for company_id
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

-- Add foreign key constraints
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trips_company ON trips(company_id);
CREATE INDEX IF NOT EXISTS idx_trips_date ON trips(trip_date);
CREATE INDEX IF NOT EXISTS idx_trips_route ON trips(route_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_tickets_company ON tickets(company_id);
CREATE INDEX IF NOT EXISTS idx_tickets_route ON tickets(route_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(ticket_status);
CREATE INDEX IF NOT EXISTS idx_tickets_payment ON tickets(payment_status);

-- Success message
SELECT 'Schema updated successfully! Now run: node setup-complete-system.js' as message;
