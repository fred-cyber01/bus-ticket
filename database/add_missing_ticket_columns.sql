-- Add missing columns to tickets table for Supabase
-- Run this in Supabase SQL Editor

-- Add passenger_age column
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS passenger_age integer;

-- Add passenger_email column
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS passenger_email varchar(255);

-- Add qr_code column for storing QR code data URL
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS qr_code text;

-- Add booking_reference column for unique booking reference
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS booking_reference varchar(100);

-- Add total_seats column to cars table if missing
ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS total_seats integer DEFAULT 50;

-- Update existing cars to have total_seats if they have capacity
UPDATE cars 
SET total_seats = capacity 
WHERE total_seats IS NULL AND capacity IS NOT NULL;

-- Create index on booking_reference for quick lookups
CREATE INDEX IF NOT EXISTS idx_tickets_booking_reference ON tickets(booking_reference);

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tickets' 
ORDER BY ordinal_position;
