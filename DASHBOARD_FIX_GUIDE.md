# Dashboard Data Display Fix - Quick Guide

## ✅ Changes Deployed

### 1. **Schema Fix for Supabase** 
Run this SQL in Supabase SQL Editor to add missing `total_seats` column:
```sql
-- Add total_seats to cars table
ALTER TABLE cars ADD COLUMN IF NOT EXISTS total_seats integer DEFAULT 30;
UPDATE cars SET total_seats = capacity WHERE total_seats = 30 OR total_seats IS NULL;

-- Add available_seats to trips table
ALTER TABLE trips ADD COLUMN IF NOT EXISTS available_seats integer DEFAULT 0;
UPDATE trips SET available_seats = COALESCE(total_seats, 0) - COALESCE(occupied_seats, 0);
```

**Or run the complete script:**
- File: `database/fix_schema_complete.sql`
- Go to Supabase Dashboard → SQL Editor → New Query
- Copy entire content and click "Run"

### 2. **Dashboard Improvements**
✅ Added pagination (20 items per page)
✅ Fixed N/A values - now shows proper fallbacks
✅ Better stats calculation
✅ Fixed capacity display (handles both `total_seats` and `capacity`)
✅ Improved error handling for missing fields

### 3. **Database Status Check**
Run this to verify your data:
```bash
node backend/check-database.js
```

## 📊 Expected Dashboard Data

After logging in with `info@rwandaexpress.rw` / `manager123`:

**Overview Stats:**
- Total Buses: **7**
- Drivers: **7** 
- Routes: **4**
- Active Trips: **650+**
- Total Revenue: From all completed bookings

**Each Tab:**
- **Buses**: 7 buses (RAC001-007) with plate numbers and capacity
- **Drivers**: 7 drivers with emails and phone numbers
- **Routes**: 4 routes (North region: Musanze, Gakenke, Rulindo, Byumba)
- **Trips**: 650+ trips from Feb 17 to April 4, 2026
- **Bookings**: All confirmed bookings for your company

## 🔧 Troubleshooting

### If dashboard shows 0 for everything:
1. **Check schema**: Run the SQL fix in Supabase
2. **Verify data**: Run `node backend/check-database.js`
3. **Clear browser cache**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
4. **Wait for deployment**: Render takes 5-10 minutes to update

### If you see "Could not find column" error:
- The schema SQL hasn't been run yet
- Go to Supabase → SQL Editor → Run `database/fix_schema_complete.sql`

## 🚀 Deployment Status

✅ Code pushed to GitHub (commit 9f4603a)
⏳ Waiting for Render auto-deployment (5-10 minutes)
📝 Next: Run SQL schema fix in Supabase

## 📋 Company Logins

All use password: **manager123**

1. info@rwandaexpress.rw (7 buses, 4 routes - North)
2. info@virungacoaches.rw (6 buses, 5 routes - South)
3. info@huyetransport.rw (7 buses, 5 routes - South)
4. info@easternstar.rw (5 buses, 5 routes - East)
5. info@akageraexpress.rw (6 buses, 5 routes - East)
6. info@kivulake.rw (5 buses, 5 routes - West)
7. info@horizonbus.rw (5 buses, 4 routes - West)

Total System: **41 buses, 41 drivers, 33 routes, 4541 trips**
