# 🎯 QUICK REFERENCE GUIDE

## YOUR SYSTEM URLS

- **🌐 Frontend (Customer Access):** https://bus-ticket-theta.vercel.app
- **🔧 Backend (API):** https://bus-ticket-c8ld.onrender.com
- **💾 Database:** Supabase PostgreSQL

---

## 🚀 START HERE: 5-MINUTE SETUP

### Step 1: Update Render Environment (2 minutes)

1. Go to https://dashboard.render.com
2. Select your backend service
3. Click **Environment** tab
4. Add/Update these values:

```
CORS_ORIGINS=https://bus-ticket-theta.vercel.app,https://bus-ticket-c8ld.onrender.com
APP_URL=https://bus-ticket-c8ld.onrender.com
FRONTEND_URL=https://bus-ticket-theta.vercel.app
```

5. Click **Save Changes**
6. Wait for automatic redeploy (1-2 minutes)

**📁 Complete list:** See `RENDER_ENV_VARIABLES.txt`

---

### Step 2: Verify Vercel (1 minute)

1. Go to https://vercel.com/dashboard
2. Select your frontend project
3. Click **Settings** → **Environment Variables**
4. Verify this is set:

```
VITE_API_BASE_URL=https://bus-ticket-c8ld.onrender.com/api
```

5. Should already be configured ✅

**📁 Complete list:** See `VERCEL_ENV_VARIABLES.txt`

---

### Step 3: Test System (2 minutes)

**Method 1: Interactive Test**
- Open `test-system-connection.html` in browser
- Click "Run Complete System Test"
- All 5 tests should pass ✅

**Method 2: Quick Login Test**
1. Go to https://bus-ticket-theta.vercel.app
2. Login: `customer@example.com` / `customer123`
3. If successful → System working! ✅

---

## 🔑 TEST ACCOUNTS

| Type | Email | Password |
|------|-------|----------|
| **Customer** | customer@example.com | customer123 |
| **Admin** | admin@ticketbus.rw | admin123 |
| **Company Manager** | manager@rwandaexpress.rw | manager123 |

✅ Accounts are **already created** in your Supabase database

---

## ✅ WHAT'S ALREADY DONE

- ✅ Backend connected to Supabase database
- ✅ Frontend configured to call backend API
- ✅ CORS settings updated locally
- ✅ Test accounts created
- ✅ Authentication system fixed
- ✅ Ticket booking system verified

---

## ⚠️ WHAT YOU NEED TO DO

**Only 1 thing left:**

Update CORS environment variables on Render (see Step 1 above)

**Why?** Your local `.env` file is updated, but Render uses its own environment variables from the dashboard.

---

## 🧪 TESTING CHECKLIST

After updating Render environment variables:

- [ ] Backend health check: https://bus-ticket-c8ld.onrender.com/health
- [ ] Login test: Use customer@example.com / customer123
- [ ] View available trips
- [ ] Book a ticket
- [ ] Company manager login
- [ ] Admin dashboard access

---

## 🎫 HOW TO BUY A TICKET

1. **Go to:** https://bus-ticket-theta.vercel.app
2. **Login:** customer@example.com / customer123
3. **Click:** "Trips" or "Book Ticket"
4. **Select:** A trip with available seats
5. **Choose:** Departure/destination stops
6. **Pick:** Your seat number
7. **Enter:** Passenger details
8. **Pay:** Using MTN Mobile Money or Flutterwave
9. **Receive:** QR code ticket via email

---

## 🏢 HOW TO ACCESS COMPANY DASHBOARD

1. **Go to:** https://bus-ticket-theta.vercel.app/company-login
2. **Login:** manager@rwandaexpress.rw / manager123
3. **View:**
   - Your company's trips
   - Bookings and revenue
   - Manage routes and schedules

---

## 🛠️ TROUBLESHOOTING

### Error: "CORS policy blocked"
**Fix:** Update `CORS_ORIGINS` on Render (see Step 1)

### Error: "401 Unauthorized" on login
**Fix:** Run `node scripts/create-test-accounts.js` on Render shell

### Error: "Cannot connect to backend"
**Fix:** Check Render deployment logs

### Error: "Database connection failed"
**Fix:** Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` on Render

---

## 📁 KEY FILES

| File | Purpose |
|------|---------|
| `DEPLOYMENT_STATUS_SUMMARY.txt` | Visual deployment status |
| `PRODUCTION_DEPLOYMENT_VERIFICATION.md` | Complete deployment guide |
| `RENDER_ENV_VARIABLES.txt` | All Render environment variables |
| `VERCEL_ENV_VARIABLES.txt` | All Vercel environment variables |
| `test-system-connection.html` | Interactive testing tool |

---

## 🎯 SUCCESS CRITERIA

Your system is **fully connected** when:

- ✅ All 5 tests pass in `test-system-connection.html`
- ✅ You can login as customer
- ✅ You can see available trips
- ✅ You can book a ticket
- ✅ Company dashboard accessible

---

## 💡 QUICK COMMANDS

**Test backend health:**
```bash
curl https://bus-ticket-c8ld.onrender.com/health
```

**Test login API:**
```bash
curl -X POST https://bus-ticket-c8ld.onrender.com/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@example.com","password":"customer123"}'
```

**View trips:**
```bash
curl https://bus-ticket-c8ld.onrender.com/api/trips
```

---

## 🆘 NEED HELP?

1. **First:** Check `test-system-connection.html` results
2. **Then:** Review `PRODUCTION_DEPLOYMENT_VERIFICATION.md`
3. **Finally:** Check Render deployment logs

---

## 🎉 NEXT STEPS

After system is connected:

1. Create real company accounts
2. Add real routes and trips
3. Configure payment gateways (production keys)
4. Train staff on company dashboard
5. Launch to customers!

---

**Last Updated:** Production deployment configured
**Status:** ✅ Ready to deploy (update Render env vars)
