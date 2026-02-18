-- Supabase (Postgres) schema for ticketbooking system
-- Run this in Supabase SQL editor (SQL Editor → New Query → Run)

-- Users
CREATE TABLE IF NOT EXISTS users (
  id bigserial PRIMARY KEY,
  user_name varchar(150) UNIQUE NOT NULL,
  email varchar(255) UNIQUE NOT NULL,
  phone varchar(50),
  password varchar(255) NOT NULL,
  full_name varchar(255),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Admins
CREATE TABLE IF NOT EXISTS admins (
  id bigserial PRIMARY KEY,
  name varchar(255) NOT NULL,
  email varchar(255) UNIQUE NOT NULL,
  password varchar(255) NOT NULL,
  role varchar(50) DEFAULT 'admin',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Companies
CREATE TABLE IF NOT EXISTS companies (
  id bigserial PRIMARY KEY,
  company_name varchar(255) NOT NULL,
  tin varchar(100),
  phone varchar(50),
  email varchar(255),
  address text,
  status varchar(50) DEFAULT 'pending',
  subscription_status varchar(50) DEFAULT 'expired',
  is_active boolean DEFAULT true,
  current_plan_id bigint,
  bus_limit integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Subscription plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id bigserial PRIMARY KEY,
  name varchar(255) NOT NULL,
  price numeric(12,2) DEFAULT 0,
  bus_limit integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE companies
  ADD CONSTRAINT fk_companies_plan FOREIGN KEY (current_plan_id)
  REFERENCES subscription_plans(id) ON DELETE SET NULL;

-- Company managers
CREATE TABLE IF NOT EXISTS company_managers (
  id bigserial PRIMARY KEY,
  company_id bigint REFERENCES companies(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  email varchar(255) UNIQUE NOT NULL,
  phone varchar(50),
  password varchar(255) NOT NULL,
  role varchar(50) DEFAULT 'manager',
  status varchar(50) DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Drivers
CREATE TABLE IF NOT EXISTS drivers (
  id bigserial PRIMARY KEY,
  company_id bigint REFERENCES companies(id) ON DELETE SET NULL,
  name varchar(255) NOT NULL,
  license_number varchar(255),
  category varchar(100),
  plate_number varchar(50),
  phone varchar(50),
  email varchar(255),
  password varchar(255),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Cars
CREATE TABLE IF NOT EXISTS cars (
  id bigserial PRIMARY KEY,
  company_id bigint REFERENCES companies(id) ON DELETE SET NULL,
  plate_number varchar(50) UNIQUE NOT NULL,
  name varchar(255) NOT NULL,
  type varchar(100),
  park varchar(255),
  capacity integer DEFAULT 0,
  total_seats integer DEFAULT 50,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Stops
CREATE TABLE IF NOT EXISTS stops (
  id bigserial PRIMARY KEY,
  name varchar(255) NOT NULL,
  location text,
  latitude double precision,
  longitude double precision,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Routes
CREATE TABLE IF NOT EXISTS routes (
  id bigserial PRIMARY KEY,
  company_id bigint REFERENCES companies(id) ON DELETE SET NULL,
  name varchar(255) NOT NULL,
  origin_stop_id bigint REFERENCES stops(id) ON DELETE SET NULL,
  destination_stop_id bigint REFERENCES stops(id) ON DELETE SET NULL,
  description text,
  distance_km numeric(8,2),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- route_stops (ordered stops per route)
CREATE TABLE IF NOT EXISTS route_stops (
  id bigserial PRIMARY KEY,
  route_id bigint REFERENCES routes(id) ON DELETE CASCADE,
  stop_id bigint REFERENCES stops(id) ON DELETE CASCADE,
  position integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Trips
CREATE TABLE IF NOT EXISTS trips (
  id bigserial PRIMARY KEY,
  route_id bigint REFERENCES routes(id) ON DELETE SET NULL,
  car_id bigint REFERENCES cars(id) ON DELETE SET NULL,
  car_name varchar(255),
  driver_id bigint REFERENCES drivers(id) ON DELETE SET NULL,
  origin_id bigint REFERENCES stops(id) ON DELETE SET NULL,
  destination_id bigint REFERENCES stops(id) ON DELETE SET NULL,
  departure_time timestamptz NOT NULL,
  status varchar(50) DEFAULT 'scheduled',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tickets
CREATE TABLE IF NOT EXISTS tickets (
  id bigserial PRIMARY KEY,
  user_id bigint REFERENCES users(id) ON DELETE SET NULL,
  trip_id bigint REFERENCES trips(id) ON DELETE CASCADE,
  boarding_stop_id bigint REFERENCES stops(id) ON DELETE SET NULL,
  dropoff_stop_id bigint REFERENCES stops(id) ON DELETE SET NULL,
  seat_number varchar(50),
  price numeric(12,2) DEFAULT 0,
  passenger_name varchar(255),
  passenger_age integer,
  passenger_phone varchar(50),
  passenger_email varchar(255),
  departure_time timestamptz,
  booking_date date DEFAULT CURRENT_DATE,
  booking_reference varchar(100),
  qr_code text,
  ticket_status varchar(50) DEFAULT 'booked',
  payment_status varchar(50) DEFAULT 'pending',
  payment_method varchar(100),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Useful indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_trips_departure ON trips(departure_time);
CREATE INDEX IF NOT EXISTS idx_tickets_trip ON tickets(trip_id);
CREATE INDEX IF NOT EXISTS idx_tickets_booking_reference ON tickets(booking_reference);

-- Trigger to keep updated_at current
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to tables that have updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_users'
  ) THEN
    CREATE TRIGGER set_timestamp_users
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_trips'
  ) THEN
    CREATE TRIGGER set_timestamp_trips
    BEFORE UPDATE ON trips
    FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_tickets'
  ) THEN
    CREATE TRIGGER set_timestamp_tickets
    BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
  END IF;
END;
$$;

-- End of schema
