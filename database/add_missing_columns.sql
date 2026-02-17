-- Add missing columns to trips table for complete booking functionality
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS company_id bigint REFERENCES companies(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS trip_date date,
  ADD COLUMN IF NOT EXISTS price numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_seats integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS occupied_seats integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS available_seats integer DEFAULT 0;

-- Add missing columns to tickets table
ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS company_id bigint REFERENCES companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS route_id bigint REFERENCES routes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS booking_reference varchar(100) UNIQUE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_trips_company ON trips(company_id);
CREATE INDEX IF NOT EXISTS idx_trips_date ON trips(trip_date);
CREATE INDEX IF NOT EXISTS idx_tickets_company ON tickets(company_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(ticket_status);

-- Update existing trips to have available_seats = total_seats
UPDATE trips SET available_seats = total_seats WHERE available_seats IS NULL;

COMMIT;
