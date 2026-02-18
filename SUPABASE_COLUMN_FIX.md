# Quick Fix: Add Missing Columns to Supabase

## Issue
The booking system is failing with error: "Could not find the 'passenger_age' column of 'tickets' in the schema cache"

## Solution
Run the SQL migration to add missing columns to your Supabase database.

## Steps

### 1. Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project: `gbeoqupuwleygrtjkiss`
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### 2. Copy and Paste this SQL
```sql
-- Add missing columns to tickets table
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS passenger_age integer;

ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS passenger_email varchar(255);

ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS qr_code text;

ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS booking_reference varchar(100);

-- Add total_seats to cars table
ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS total_seats integer DEFAULT 50;

-- Update existing cars
UPDATE cars 
SET total_seats = capacity 
WHERE total_seats IS NULL AND capacity IS NOT NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_tickets_booking_reference ON tickets(booking_reference);
```

### 3. Run the Query
1. Click **Run** button (or press F5)
2. You should see "Success. No rows returned"

### 4. Verify the Changes
Run this query to verify all columns exist:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tickets' 
ORDER BY ordinal_position;
```

You should see:
- ✅ passenger_age (integer)
- ✅ passenger_email (character varying)
- ✅ qr_code (text)
- ✅ booking_reference (character varying)

## Test Booking
After running the SQL:
1. Go to your booking page: https://bus-ticket-theta.vercel.app
2. Select a trip
3. Choose seats
4. Fill in passenger details
5. Click "Confirm & Continue to Payment"
6. ✅ Booking should now work!

## Files Updated (for commit)
- ✅ `supabase_schema.sql` - Updated with new columns
- ✅ `database/add_missing_ticket_columns.sql` - Migration script

No backend code changes needed - the code already expects these columns.
