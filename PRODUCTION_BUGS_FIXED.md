# ��� BUGS FIXED - February 15, 2026

## Issues Reported

User reported on production (https://bus-ticket-c8ld.onrender.com):

1. ❌ `/api/payments/history` - 500 Internal Server Error
2. ❌ `/api/auth/company/signin` - 503 Service Unavailable  
3. ❌ No tickets available to display
4. ❌ "Database connection failed" errors

---

## Root Cause Analysis

**All errors caused by**: Backend still using **MySQL database queries** instead of **Supabase** in some controllers/services.

### Specific Issues:

1. **`paymentService.js`** - Using `const { query } = require('../config/database')` (MySQL)
   - `getPaymentHistory()` - MySQL queries
   - `recordPayment()` - MySQL INSERT
   - `updatePaymentStatus()` - MySQL UPDATE
   - `getPayment()` - MySQL SELECT
   - `getPaymentByTransactionRef()` - MySQL SELECT
   - `getAllPayments()` - MySQL queries with filters
   - `getSystemEarnings()` - MySQL aggregations
   - `processWithdrawal()` - MySQL INSERT
   - Ticket update in `simulatePaymentSuccess()`

2. **`authController.js` - `companyLogin()`** - Using MySQL:
   ```javascript
   const db = require('../config/database');
   const managers = await db.query('SELECT * FROM company_managers WHERE email = ?', [email]);
   ```

3. **No tickets showing** - Trips exist but **departure dates are in the past** (2026-02-02, current date is 2026-02-15)

---

## Fixes Applied

### 1. Fixed `authController.js` - Company Login

**Before:**
```javascript
const db = require('../config/database');
const managers = await db.query(
  'SELECT * FROM company_managers WHERE email = ?',
  [email]
);
const manager = managers[0];
const bcrypt = require('bcryptjs');
const isPasswordValid = await bcrypt.compare(password, manager.password);
```

**After:**
```javascript
const CompanyManager = require('../models/CompanyManager.supabase');
const manager = await CompanyManager.findByEmail(email);
const isPasswordValid = await CompanyManager.validatePassword(manager, password);
```

✅ Now uses Supabase model with built-in password validation

---

### 2. Fixed `paymentService.js` - All Methods

**Change 1: Import Supabase**
```javascript
// Before
const { query } = require('../config/database');

// After  
const supabase = require('../config/supabase');
```

**Change 2: recordPayment()**
```javascript
// Before
const sql = `INSERT INTO payments (...) VALUES (?, ?, ...)`;
const result = await query(sql, [transaction_ref, ...]);
return result.insertId;

// After
const { data, error } = await supabase.from('payments').insert([{
  transaction_ref,
  payment_type,
  amount,
  // ...
}]).select('id').single();
if (error) throw error;
return data.id;
```

**Change 3: getPaymentHistory()**
```javascript
// Before
let sql = 'SELECT * FROM payments WHERE 1=1';
if (userId) sql += ' AND user_id = ?';
const payments = await query(sql, params);

// After
let query = supabase.from('payments').select('*');
if (userId) query = query.eq('user_id', userId);
const { data: payments, error } = await query;
```

**Change 4: updatePaymentStatus()**
```javascript
// Before
const sql = `UPDATE payments SET status = ?, ... WHERE transaction_ref = ?`;
await query(sql, [status, ...params]);

// After
const updateData = { status, updated_at: moment()... };
const { error } = await supabase
  .from('payments')
  .eq('transaction_ref', transactionRef)
  .update(updateData);
```

**Change 5: getPayment() & getPaymentByTransactionRef()**
```javascript
// Before
const payments = await query('SELECT * FROM payments WHERE transaction_ref = ?', [ref]);
return payments[0] || null;

// After
const { data, error } = await supabase
  .from('payments')
  .select('*')
  .eq('transaction_ref', ref)
  .limit(1)
  .single();
return data || null;
```

**Change 6: getAllPayments()**
```javascript
// Before
let sql = 'SELECT * FROM payments WHERE 1=1';
if (filters.status) sql += ' AND status = ?';
const payments = await query(sql, params);

// After
let query = supabase.from('payments').select('*');
if (filters.status) query = query.eq('status', filters.status);
const { data: payments } = await query;
```

**Change 7: Ticket Update in simulatePaymentSuccess()**
```javascript
// Before
await query(
  'UPDATE tickets SET payment_status = "completed", ticket_status = "confirmed" WHERE id = ?',
  [ticketId]
);

// After
await supabase
  .from('tickets')
  .update({
    payment_status: 'completed',
    ticket_status: 'confirmed',
    updated_at: moment().tz('Africa/Kigali').format('YYYY-MM-DD HH:mm:ss')
  })
  .eq('id', ticketId);
```

✅ All payment service methods now use Supabase PostgreSQL

---

### 3. No Tickets Available - Root Cause Identified

**Database Check Results:**
```
Companies: 6 ✅
Routes: 2 ✅
Cars: 2 ✅
Drivers: 2 ✅
Trips: 2 ⚠️ (but in the past!)
Users: 5 ✅
```

**Existing Trips:**
- Trip 1: Departure 2026-02-02 08:38 (13 days ago)
- Trip 2: Departure 2026-02-02 10:38 (13 days ago)

**Current Date:** February 15, 2026

**Issue:** Trips are **13 days in the past**, so they won't show as "available trips"

---

## Solution for User

### Immediate Actions Required:

#### 1. Update Environment Variables on Render

Go to Render dashboard → Backend service → Environment tab:

```
CORS_ORIGINS=https://bus-ticket-theta.vercel.app,https://bus-ticket-c8ld.onrender.com
APP_URL=https://bus-ticket-c8ld.onrender.com
FRONTEND_URL=https://bus-ticket-theta.vercel.app
```

Save and wait for redeploy (1-2 minutes)

#### 2. Create New Trips with Future Dates

**Option A: Company Dashboard**
1. Login: https://bus-ticket-theta.vercel.app/company-login
   - Email: `manager@rwandaexpress.rw`
   - Password: `manager123`
2. Go to "Trips" section
3. Create trips with dates **after February 15, 2026**

**Option B: Admin Dashboard**
1. Login: https://bus-ticket-theta.vercel.app/admin-login
   - Email: `admin@ticketbus.rw`
   - Password: `admin123`
2. Manage trips → Create new trips

**Important:** Set departure dates to **future dates** (February 16-28, 2026)

---

## Testing After Fix

### 1. Test Company Login
```bash
curl -X POST https://bus-ticket-c8ld.onrender.com/api/auth/company/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@rwandaexpress.rw","password":"manager123"}'
```
**Expected:** ✅ 200 OK with token

### 2. Test Payment History
```bash
curl -X GET https://bus-ticket-c8ld.onrender.com/api/payments/history \
  -H "Authorization: Bearer YOUR_TOKEN"
```
**Expected:** ✅ 200 OK with payment array (may be empty)

### 3. Test Trips Listing
```bash
curl https://bus-ticket-c8ld.onrender.com/api/trips
```
**Expected:** ✅ Will show trips once future trips are created

---

## Files Modified

1. ✅ `backend/controllers/authController.js` - Fixed companyLogin to use Supabase
2. ✅ `backend/services/paymentService.js` - Converted all methods from MySQL to Supabase:
   - recordPayment()
   - updatePaymentStatus()
   - getPayment()
   - getPaymentByTransactionRef()
   - getPaymentHistory()
   - getAllPayments()
   - getSystemEarnings()
   - processWithdrawal()
   - simulatePaymentSuccess() - ticket update

3. ✅ `backend/scripts/check-database-data.js` - Created diagnostic tool

---

## Verification Checklist

- [x] Company signin now uses Supabase ✅
- [x] Payment service uses Supabase ✅
- [x] Database has companies, routes, cars, drivers ✅
- [x] Test accounts exist ✅
- [ ] **Trips with future dates need to be created** ⏳
- [ ] **Environment variables updated on Render** ⏳
- [ ] Frontend can see available trips ⏳

---

## Next Steps for User

1 **Update Render environment variables** (2 minutes)
2. **Redeploy backend on Render** (automatic after env update)
3. **Create new trips with future dates** (5 minutes)
4. **Test ticket booking flow** (2 minutes)

---

## Expected Behavior After All Fixes

1. ✅ Company login works → Returns JWT token
2. ✅ Payment history works → Returns payment array
3. ✅ Trips show in frontend → After creating future trips
4. ✅ Users can book tickets → Complete booking flow functional

---

**Status:** 🟢 **Code fixes complete! User needs to:**
- Update Render environment variables
- Create trips with future departure dates

**Last Updated:** February 15, 2026
