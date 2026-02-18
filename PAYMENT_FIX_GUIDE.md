# Payment System Fix - Critical: Payments Table Missing

## Issue
Payment initiation is failing with error: "Failed to initiate MTN payment" - HTTP 500

## Root Cause
The `payments` table does not exist in your Supabase database. The payment service is trying to record payments in a non-existent table, causing all payment initiations to fail.

## Immediate Fix Required

### Step 1: Create Payments Table in Supabase

1. **Go to Supabase SQL Editor**
   - Visit: https://supabase.com/dashboard
   - Select your project
   - Click **SQL Editor** → **New Query**

2. **Run this SQL** (copy and paste):

```sql
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

-- Create indexes  
CREATE INDEX IF NOT EXISTS idx_payments_transaction_ref ON payments(transaction_ref);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_company ON payments(company_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Add trigger for updated_at
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
```

3. **Click "Run"** - You should see "Success. No rows returned"

4. **Verify** the table was created:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position;
```

### Step 2: Push Backend Code Updates

The backend code has been updated to use Supabase instead of MySQL. Push changes to trigger Render deployment:

```bash
git add .
git commit -m "Fix: Add payments table and migrate payment controller to Supabase"
git push origin main
```

## What Was Fixed in Backend Code

### 1. Payment Controller (`backend/controllers/paymentController.js`)
- ✅ Removed MySQL `query` import
- ✅ Added Supabase import
- ✅ Replaced ticket query with Supabase (line 345)
- ✅ Replaced payment lookup query with Supabase (line 495)

### 2. Schema Updates (`supabase_schema.sql`)
- ✅ Added payments table definition
- ✅ Added payment indexes
- ✅ Added updated_at trigger for payments

### 3. Migration Script (`database/add_payments_table.sql`)
- ✅ Created standalone migration for payments table

## Testing Payment Flow

After running the SQL and deploying code:

1. **Test Booking Creation**
   - Go to: https://bus-ticket-theta.vercel.app
   - Select a trip and seats
   - Fill passenger details
   - Click "Confirm & Continue to Payment"
   - ✅ Booking should be created

2. **Test Payment Initiation**
   - Enter phone number (format: 2507XXXXXXXX)
   - Click "Pay Now"
   - ✅ Should see "Payment initiated" message
   - ✅ Status changes to "pending"

3. **Check Payments in Database**
```sql
SELECT id, transaction_ref, payment_type, amount, status, created_at 
FROM payments 
ORDER BY created_at DESC 
LIMIT 10;
```

## Expected Behavior After Fix

### Before:
- ❌ 500 Error: "Failed to initiate MTN payment"
- ❌ Payment never recorded
- ❌ User stuck at payment screen

### After:
- ✅ Payment initiates successfully
- ✅ Payment record created in database
- ✅ User sees "Check your phone for payment prompt"
- ✅ Ticket preview with QR code appears

## Additional Error Fixed

### The 409 Conflict Error
The 409 error from `/api/bookings` means a seat is already booked. This is normal validation - not a bug. The system correctly prevents double-booking of seats.

## Files Updated
- ✅ `backend/controllers/paymentController.js` - MySQL → Supabase
- ✅ `supabase_schema.sql` - Added payments table
- ✅ `database/add_payments_table.sql` - Migration script
- ✅ `PAYMENT_FIX_GUIDE.md` - This guide

## Deployment Timeline
1. Run SQL in Supabase: **2-3 minutes**
2. Push code to GitHub: **Immediate**
3. Render auto-deploy: **2-5 minutes**
4. **Total: ~10 minutes** until fully operational

## Rollback Plan
If issues occur:
```bash
# In Supabase SQL Editor
DROP TABLE IF EXISTS payments CASCADE;

# In terminal
git revert HEAD
git push origin main
```

## Status
🔴 **CRITICAL - REQUIRES IMMEDIATE ACTION**

The payments table MUST be created in Supabase before payments will work.
