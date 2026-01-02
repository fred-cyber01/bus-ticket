-- Payment and Subscription System Schema
-- Run this to add new tables and update existing ones

-- Update companies table with subscription fields
ALTER TABLE companies ADD COLUMN tin VARCHAR(50);
ALTER TABLE companies ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE companies ADD COLUMN approved_by INTEGER;
ALTER TABLE companies ADD COLUMN approved_at DATETIME;
ALTER TABLE companies ADD COLUMN subscription_status VARCHAR(20) DEFAULT 'trial';
ALTER TABLE companies ADD COLUMN current_plan_id INTEGER;
ALTER TABLE companies ADD COLUMN trial_start_date DATETIME;
ALTER TABLE companies ADD COLUMN trial_end_date DATETIME;
ALTER TABLE companies ADD COLUMN bus_limit INTEGER DEFAULT 3;
ALTER TABLE companies ADD COLUMN subscription_expires_at DATETIME;

-- Subscription Plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  duration_days INTEGER NOT NULL,
  bus_limit INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default plans
INSERT INTO subscription_plans (name, description, price, duration_days, bus_limit) VALUES
('Free Trial', '30 days free trial with up to 3 buses', 0, 30, 3),
('Standard', 'Monthly plan with up to 10 buses', 50000, 30, 10),
('Premium', 'Monthly plan with up to 20 buses', 100000, 30, 20);

-- Company Subscriptions History
CREATE TABLE IF NOT EXISTS company_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  plan_id INTEGER NOT NULL,
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  amount_paid DECIMAL(10, 2) NOT NULL,
  payment_id INTEGER,
  status VARCHAR(20) DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id VARCHAR(100) UNIQUE NOT NULL,
  payment_type VARCHAR(20) NOT NULL,
  user_id INTEGER,
  company_id INTEGER,
  ticket_id INTEGER,
  subscription_id INTEGER,
  amount DECIMAL(10, 2) NOT NULL,
  system_fee DECIMAL(10, 2) DEFAULT 10,
  payment_method VARCHAR(50) NOT NULL,
  payer_phone VARCHAR(20),
  payer_name VARCHAR(100),
  reference_code VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending',
  callback_data TEXT,
  payment_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (ticket_id) REFERENCES tickets(id)
);

-- System Earnings table
CREATE TABLE IF NOT EXISTS system_earnings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_id INTEGER NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  source_type VARCHAR(20) NOT NULL,
  ticket_id INTEGER,
  subscription_id INTEGER,
  status VARCHAR(20) DEFAULT 'pending',
  withdrawn BOOLEAN DEFAULT 0,
  withdrawal_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(id)
);

-- System Withdrawals table
CREATE TABLE IF NOT EXISTS system_withdrawals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount DECIMAL(10, 2) NOT NULL,
  withdrawal_method VARCHAR(50) NOT NULL,
  account_number VARCHAR(100) NOT NULL,
  account_name VARCHAR(100),
  reference_code VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending',
  processed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Company Managers table
CREATE TABLE IF NOT EXISTS company_managers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  user_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'manager',
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Payment Webhooks Log
CREATE TABLE IF NOT EXISTS payment_webhooks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id VARCHAR(100),
  payment_method VARCHAR(50),
  raw_data TEXT,
  processed BOOLEAN DEFAULT 0,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Update tickets table to link with payments
ALTER TABLE tickets ADD COLUMN payment_id INTEGER;

-- Add indices for performance
CREATE INDEX IF NOT EXISTS idx_payments_transaction ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_ticket ON payments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_company_subscriptions_company ON company_subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_company_subscriptions_status ON company_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_system_earnings_withdrawn ON system_earnings(withdrawn);
