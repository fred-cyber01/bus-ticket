-- ============================================================================
-- FIX TRIPS FOR CUSTOMER BOOKING
-- ============================================================================
-- Run this in Supabase SQL Editor to make trips bookable by customers

-- Update all trips to be active and set available_seats
UPDATE trips
SET 
  is_active = true,
  status = 'scheduled',
  available_seats = COALESCE(total_seats, 30) - COALESCE(occupied_seats, 0)
WHERE is_active IS NULL OR available_seats IS NULL OR available_seats = 0;

-- Make sure all trips have total_seats set
UPDATE trips
SET total_seats = 30
WHERE total_seats IS NULL OR total_seats = 0;

-- Recalculate available_seats for all trips
UPDATE trips
SET available_seats = total_seats - COALESCE(occupied_seats, 0);

-- Set future trips as scheduled
UPDATE trips
SET status = 'scheduled'
WHERE trip_date >= CURRENT_DATE AND (status IS NULL OR status = '');

-- Select some results to verify
SELECT 
  id,
  trip_date,
  departure_time,
  status,
  is_active,
  total_seats,
  occupied_seats,
  available_seats,
  company_id,
  route_id
FROM trips
WHERE trip_date >= CURRENT_DATE
ORDER BY trip_date, departure_time
LIMIT 10;

SELECT 'Trips updated successfully! ' || COUNT(*)::text || ' trips are now bookable.' as message
FROM trips
WHERE is_active = true AND available_seats > 0 AND trip_date >= CURRENT_DATE;
