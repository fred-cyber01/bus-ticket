# ✅ FINAL DEPLOYMENT CHECKLIST

## Current Status: February 15, 2026

### ✅ Code Fixes Complete

All bugs have been fixed in the codebase:

1. ✅ **Payment History 500 Error** - Fixed (MySQL → Supabase)
2. ✅ **Company Signin 503 Error** - Fixed (MySQL → Supabase)
3. ✅ **Database Connection Issues** - Fixed (all services use Supabase)
4. ✅ **Test Accounts Created** - customer, admin, manager accounts ready

### ⚠️ Action Required

You need to complete these steps to make your production system work:

---

## STEP 1: Push Code to Git (If Using Git)

If you're using Git and GitHub/GitLab for deployment:

```bash
git add .
git commit -m "Fix: Convert payment service and auth to Supabase, fix database queries"
git push origin main
```

This will trigger automatic deployment on Render (if auto-deploy is enabled)

---

## STEP 2: Update Render Environment Variables

### Go to Render Dashboard

1. Open: https://dashboard.render.com
2. Select your backend service (bus-ticket...)
3. Click **"Environment"** tab

### Add/Update These Variables:

```bash
# CORS Configuration (CRITICAL!)
CORS_ORIGINS=https://bus-ticket-theta.vercel.app,https://bus-ticket-c8ld.onrender.com,http://localhost:3000

# App URLs
APP_URL=https://bus-ticket-c8ld.onrender.com
FRONTEND_URL=https://bus-ticket-theta.vercel.app

# Supabase (Verify these are set)
SUPABASE_URL=https://gbeoqupuwleygrtjkiss.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdiZW9xdXB1d2xleWdydGpraXNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTkxMzgwNiwiZXhwIjoyMDUxNDg5ODA2fQ.qsqY3sTt3H9WE5KgfZzhiTR6NqTZKvhYC9X3gITznBk

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Payment Callbacks (Update to production URL)
MTN_CALLBACK_URL=https://bus-ticket-c8ld.onrender.com/api/webhooks/mtn
AIRTEL_CALLBACK_URL=https://bus-ticket-c8ld.onrender.com/api/webhooks/airtel
MOMOPAY_CALLBACK_URL=https://bus-ticket-c8ld.onrender.com/api/webhooks/momopay
FLUTTERWAVE_REDIRECT_URL=https://bus-ticket-theta.vercel.app/payment/success
```

### Save Changes

4. Click **"Save Changes"**  
5. Render will automatically redeploy (wait 1-2 minutes)

**⚠️ CRITICAL:** The `CORS_ORIGINS` variable MUST include your Vercel frontend URL!

---

## STEP 3: Verify Backend Deployment

### Test 1: Health Check

```bash
curl https://bus-ticket-c8ld.onrender.com/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-02-15T...",
  "environment": "production"
}
```

### Test 2: Company Login

```bash
curl -X POST https://bus-ticket-c8ld.onrender.com/api/auth/company/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@rwandaexpress.rw","password":"manager123"}'
```

**Expected:** Status 200 with token

**If you get 401:** Test accounts may not exist on Supabase. You can create them through Supabase dashboard or contact support.

### Test 3: Trips API

```bash
curl https://bus-ticket-c8ld.onrender.com/api/trips
```

**Expected:** JSON array (may be empty if no future trips)

---

## STEP 4: Create Future Trips

Your database has trips scheduled for **February 2, 2026** (13 days ago!)

You need to create trips with **future dates** (after February 15, 2026)

### Option A: Quick - Use Company Dashboard

1. Go to: https://bus-ticket-theta.vercel.app/company-login
2. Login:
   - Email: `manager@rwandaexpress.rw`
   - Password: `manager123`
3. Navigate to **"Trips"** or **"Create Trip"**
4. Create trip:
   - Route: Yahoo Eastern Route
   - Car: YHOO-001
   - Driver: John Doe
   - **Date: February 16, 2026** (tomorrow!)
   - Time: 08:00
   - Price: 5000
   - Status: Approved
5. Click "Create" or "Save"

Repeat for multiple trips (different dates/times)

### Option B: Use Admin Dashboard

1. Go to: https://bus-ticket-theta.vercel.app/admin-login
2. Login:
   - Email: `admin@ticketbus.rw`
   - Password: `admin123`
3. Create trips for any company

**💡 TIP:** Create at least 5-10 trips for the next week to have good availability

---

## STEP 5: Verify Frontend

### Test Customer Flow

1. Open: https://bus-ticket-theta.vercel.app
2. Click "Register" and create account OR login:
   - Email: `customer@example.com`
   - Password: `customer123`
3. Click "Book Ticket" or "Trips"
4. **Should see trips you created** ✅
5. Select a trip
6. Choose seats
7. Enter passenger details
8. Proceed to payment

**If no trips showing:**
- Check that trips have future departure dates
- Check that trip status is "approved"
- Check browser console for errors (F12)

---

## STEP 6: Monitor Logs

### Render Logs

1. Go to Render dashboard
2. Select your service
3. Click **"Logs"** tab
4. Watch for:
   - "✓ Supabase connected successfully" ✅
   - Any database errors ❌
   - Any CORS errors ❌

### Browser Console

1. Open https://bus-ticket-theta.vercel.app
2. Press F12 → Console tab
3. Watch for:
   - "CORS policy" errors ❌
   - "401 Unauthorized" errors ❌
   - "500 Internal Server" errors ❌

---

## STEP 7: Final Verification

Run all tests from [test-system-connection.html](test-system-connection.html):

1. Open file in browser
2. Click "Run Complete System Test"
3. All 5 tests should pass:
   - ✅ Backend Health Check
   - ✅ Database Connection
   - ✅ CORS Configuration
   - ✅ Authentication System
   - ✅ API Endpoints

---

## Troubleshooting

### Issue: CORS Errors in Browser

**Symptom:** "blocked by CORS policy" in console

**Fix:** 
1. Verify `CORS_ORIGINS` on Render includes: `https://bus-ticket-theta.vercel.app`
2. Redeploy backend
3. Hard refresh frontend (Ctrl+Shift+R)

### Issue: 401 Unauthorized on Login

**Symptom:** Cannot login with test accounts

**Fix:**
1. Test accounts created: Run `node scripts/create-test-accounts.js` on Render
2. OR login to Supabase dashboard and verify users exist
3. Password hashing: Passwords are hashed with bcrypt

### Issue: 503 Service Unavailable

**Symptom:** Company login fails with 503

**Fix:**
1. Verify code pushed to Render
2. Check Render deployment logs for errors
3. Verify `SUPABASE_SERVICE_ROLE_KEY` is set

### Issue: No Trips Showing

**Symptom:** "No tickets available"

**Fix:**
1. Create trips with **future dates** (after Feb 15, 2026)
2. Check trip status = "approved"
3. Check `is_active` = true
4. Run `node scripts/check-database-data.js` to verify

---

## Success Criteria

Your system is **fully working** when:

- ✅ Backend responds at: https://bus-ticket-c8ld.onrender.com/health
- ✅ Frontend loads at: https://bus-ticket-theta.vercel.app
- ✅ Customer can register/login
- ✅ Trips are visible in frontend
- ✅ Customer can book a ticket
- ✅ Company manager can login
- ✅ Admin can login
- ✅ No CORS errors in browser console
- ✅ No 500/503 errors in API calls

---

## Quick Command Reference

### Check Database
```bash
cd backend
node scripts/check-database-data.js
```

### Create Test Accounts (if needed on Render)
```bash
node scripts/create-test-accounts.js
```

### Test Backend API
```bash
# Health
curl https://bus-ticket-c8ld.onrender.com/health

# Trips
curl https://bus-ticket-c8ld.onrender.com/api/trips

# Company Login
curl -X POST https://bus-ticket-c8ld.onrender.com/api/auth/company/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@rwandaexpress.rw","password":"manager123"}'
```

---

## Estimated Time

- **Render Environment Setup:** 5 minutes
- **Code Deployment:** 2 minutes (automatic)
- **Create Trips:** 5-10 minutes
- **Testing:** 5 minutes
- **Total:** ~20 minutes

---

## Need Help?

1. **Check Logs:**
   - Render: Dashboard → Logs tab
   - Browser: F12 → Console tab

2. **Run Diagnostics:**
   - `node scripts/check-database-data.js`
   - Open `test-system-connection.html`

3. **Review Documentation:**
   - [PRODUCTION_BUGS_FIXED.md](PRODUCTION_BUGS_FIXED.md)
   - [HOW_TO_CREATE_TRIPS.md](HOW_TO_CREATE_TRIPS.md)
   - [PRODUCTION_DEPLOYMENT_VERIFICATION.md](PRODUCTION_DEPLOYMENT_VERIFICATION.md)

---

**Last Updated:** February 15, 2026
**Status:** 🟢 Code fixes complete, deployment pending
