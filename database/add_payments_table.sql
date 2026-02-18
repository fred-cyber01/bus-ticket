-- Add payments table to Supabase
-- Run this in Supabase SQL Editor

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id bigserial PRIMARY KEY,
  transaction_ref varchar(255) UNIQUE NOT NULL,
  payment_type varchar(50) NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  payment_method varchar(100) NOT NULL,
  phone_number varchar(50),
  company_id bigint REFERENCES companies(id) ON DELETE SET NULL,
  user_id bigint REFERENCES users(id) ON DELETE SET NULL,
  status varchar(50) DEFAULT 'pending',
  payment_data jsonb,
  reference_id bigint,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for payments table
CREATE INDEX IF NOT EXISTS idx_payments_transaction_ref ON payments(transaction_ref);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_company ON payments(company_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Add trigger for updated_at on payments table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_payments'
  ) THEN
    CREATE TRIGGER set_timestamp_payments
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
  END IF;
END;
$$;

-- Verify the table was created
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position;
