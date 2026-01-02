-- SQLite Database Schema for Bus Ticketing System

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL,
  tin VARCHAR(50),
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  approved_by INTEGER,
  approved_at DATETIME,
  subscription_status VARCHAR(20) DEFAULT 'inactive',
  current_plan_id INTEGER,
  trial_start_date DATETIME,
  trial_end_date DATETIME,
  bus_limit INTEGER DEFAULT 3,
  subscription_expires_at DATETIME,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Cars (Buses) table
CREATE TABLE IF NOT EXISTS cars (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  plate_number VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100),
  type VARCHAR(50),
  capacity INTEGER NOT NULL DEFAULT 30,
  park VARCHAR(100),
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Drivers table
CREATE TABLE IF NOT EXISTS drivers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  license_number VARCHAR(50),
  password_hash VARCHAR(255),
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Stops table
CREATE TABLE IF NOT EXISTS stops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL,
  district VARCHAR(50),
  province VARCHAR(50),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Routes table
CREATE TABLE IF NOT EXISTS routes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
);

-- Route Stops table
CREATE TABLE IF NOT EXISTS route_stops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_id INTEGER NOT NULL,
  stop_id INTEGER NOT NULL,
  stop_order INTEGER NOT NULL,
  distance_km DECIMAL(10, 2),
  duration_minutes INTEGER,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
  FOREIGN KEY (stop_id) REFERENCES stops(id) ON DELETE CASCADE
);

-- Destination Prices table
CREATE TABLE IF NOT EXISTS destination_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_id INTEGER NOT NULL,
  origin_stop_id INTEGER NOT NULL,
  destination_stop_id INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
  FOREIGN KEY (origin_stop_id) REFERENCES stops(id),
  FOREIGN KEY (destination_stop_id) REFERENCES stops(id)
);

-- Daily Schedules table
CREATE TABLE IF NOT EXISTS daily_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_id INTEGER NOT NULL,
  car_id INTEGER NOT NULL,
  driver_id INTEGER,
  departure_time TIME NOT NULL,
  arrival_time TIME,
  days_of_week VARCHAR(50),
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
  FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL
);

-- Trips table
CREATE TABLE IF NOT EXISTS trips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_id INTEGER NOT NULL,
  car_id INTEGER NOT NULL,
  driver_id INTEGER,
  origin_id INTEGER NOT NULL,
  destination_id INTEGER NOT NULL,
  departure_time DATETIME NOT NULL,
  arrival_time DATETIME,
  price DECIMAL(10, 2) NOT NULL,
  available_seats INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled',
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (route_id) REFERENCES routes(id),
  FOREIGN KEY (car_id) REFERENCES cars(id),
  FOREIGN KEY (driver_id) REFERENCES drivers(id),
  FOREIGN KEY (origin_id) REFERENCES stops(id),
  FOREIGN KEY (destination_id) REFERENCES stops(id)
);

-- Trip Stop Times table
CREATE TABLE IF NOT EXISTS trip_stop_times (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id INTEGER NOT NULL,
  stop_id INTEGER NOT NULL,
  arrival_time DATETIME,
  departure_time DATETIME,
  stop_order INTEGER NOT NULL,
  is_final_stop BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (stop_id) REFERENCES stops(id)
);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  trip_id INTEGER NOT NULL,
  boarding_stop_id INTEGER,
  dropoff_stop_id INTEGER,
  seat_number INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  passenger_name VARCHAR(100) NOT NULL,
  passenger_age INTEGER,
  passenger_gender VARCHAR(10),
  passenger_phone VARCHAR(20),
  departure_time DATETIME,
  booking_date DATE,
  status VARCHAR(20) DEFAULT 'Pending',
  payment_status VARCHAR(20) DEFAULT 'pending',
  payment_method VARCHAR(50),
  payment_id INTEGER,
  qr_code TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (trip_id) REFERENCES trips(id),
  FOREIGN KEY (boarding_stop_id) REFERENCES stops(id),
  FOREIGN KEY (dropoff_stop_id) REFERENCES stops(id)
);

-- Sample data
INSERT OR IGNORE INTO stops (id, name, district, province) VALUES
(1, 'Nyabugogo', 'Nyarugenge', 'Kigali City'),
(2, 'Musanze', 'Musanze', 'Northern Province'),
(3, 'Rubavu', 'Rubavu', 'Western Province');
