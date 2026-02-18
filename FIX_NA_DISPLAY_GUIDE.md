# How to Fix "N/A" in Trip Details (From/To)

## Problem
Tickets showing **"From: N/A"** and **"To: N/A"** instead of actual city names.

## Why This Happens
When trips are created without `origin_id` and `destination_id` in the database, the system can't display stop names.

## Quick Fix (Run Once)

Open PowerShell in your project folder and run:

```powershell
node backend/fix-all-data.js
```

This will:
- ✅ Update all trips to have origin and destination stops
- ✅ Update all tickets to inherit stop IDs from their trips  
- ✅ Fix company associations for cars
- ⏱️ Takes ~2-5 minutes for large databases

## Verify the Fix

After running the fix script:

```powershell
node backend/quick-check-ticket.js
```

You should see:
```
📋 Ticket #2 Status:
✅ From: Kigali
✅ To: Musanze
✅ Company: Virunga Coaches
✅ Bus Plate: VC006
✅ Seat: 1

🎉 SUCCESS! All fields are now populated!
```

## Refresh Your Frontend

After the fix completes:

1. **Open your website** (refresh browser page)
2. **Go to My Bookings** or Customer Dashboard
3. **Check your tickets** - Should now show:
   - ✅ **From:** Kigali (or actual origin)
   - ✅ **To:** Musanze (or actual destination)
   - ✅ **Company:** Virunga Coaches (or actual company)

## If New Tickets Still Show N/A

When creating **NEW trips** in the future, make sure to:

1. Set **origin_id** and **destination_id** when creating the trip
2. Or run the fix script again: `node backend/fix-all-data.js`

## Prevention (For Developers)

When creating trips programmatically, always include:

```javascript
const newTrip = {
  route_id: routeId,
  car_id: carId,
  origin_id: firstStopId,      // ← Required!
  destination_id: lastStopId,   // ← Required!
  company_id: companyId,        // ← Required!
  trip_date: '2026-02-19',
  departure_time: '10:00:00',
  // ... other fields
};
```

## Troubleshooting

### Script Errors?
```powershell
# Check if Node.js is installed
node --version

# Make sure you're in the project root
cd C:\Users\user\ticketbooking-system-master

# Check .env file exists with database credentials
Get-Content backend\.env
```

### Still Showing N/A After Fix?
```powershell
# Check specific trip
node backend/check-trip-582.js

# Debug all ticket data
node backend/debug-ticket-data.js
```

### Frontend Not Updating?
1. Hard refresh: **Ctrl + Shift + R** (or Cmd + Shift + R on Mac)
2. Clear browser cache
3. Deploy frontend again to Vercel
4. Wait 2-3 minutes for backend Render deployment

## Current Status

✅ Backend code updated with proper joins
✅ Database fix script created
✅ Frontend enhanced to display company names
✅ Download feature with PDF and Image options

---

**Last Updated:** February 18, 2026  
**Fix Script:** `backend/fix-all-data.js`  
**Status:** ✅ READY TO USE
