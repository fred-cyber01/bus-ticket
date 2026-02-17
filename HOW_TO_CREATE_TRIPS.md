# 🚀 HOW TO CREATE TRIPS - QUICK GUIDE

## Problem: "No Tickets Available"

**Cause:** No trips scheduled for future dates

**Solution:** Create trips using company dashboard or admin panel

---

## Method 1: Company Dashboard (Recommended)

### Step 1: Login

1. Go to: https://bus-ticket-theta.vercel.app/company-login
2. Email: `manager@rwandaexpress.rw`
3. Password: `manager123`

### Step 2: Navigate to Trips

- Click "Trips" or "Manage Trips" in the dashboard menu

### Step 3: Create New Trip

Fill in the form:

**Required Fields:**
- **Route:** Select from dropdown (Yahoo Eastern Route or Select Kigali-Rusumo)
- **Car:** Select from dropdown (YHOO-001 or SLCT-001)
- **Driver:** Select from dropdown (John Doe or Jane Smith)
- **Departure Date:** **February 16, 2026** or later (MUST be future date!)
- **Departure Time:** Example: 08:00
- **Price:** Example: 5000 RWF
- **Total Seats:** Will be auto-filled from car capacity (40 seats)

**Example Trip:**
```
Route: Yahoo Eastern Route
Car: YHOO-001 (Yahoo Coach 1)
Driver: John Doe
Date: 2026-02-16 (tomorrow)
Time: 08:00
Price: 5000
Status: Approved
```

### Step 4: Set Status to "Approved"

Make sure the trip status is "approved" or "scheduled" so customers can see it

### Step 5: Save

Click "Create Trip" or "Save"

---

## Method 2: Admin Dashboard

### Step 1: Login

1. Go to: https://bus-ticket-theta.vercel.app/admin-login
2. Email: `admin@ticketbus.rw`
3. Password: `admin123`

### Step 2: Create Multiple Trips

Admin can create trips for any company:

**Company 1 Trips (Yahoo Car Express):**
- Route: Yahoo Eastern Route
- Car: YHOO-001
- Driver: John Doe
- Dates: Feb 16-20, 2026
- Times: 08:00, 14:00, 18:00

**Company 2 Trips (Select Express):**
- Route: Select Kigali-Rusumo
- Car: SLCT-001
- Driver: Jane Smith
- Dates: Feb 16-20, 2026
- Times: 09:00, 15:00

---

## Method 3: Create Sample Trips via Script (Advanced)

If you want to quickly populate with test data:

### Create this file: `backend/scripts/create-sample-trips.js`

```javascript
require('dotenv').config();
const supabase = require('../config/supabase');
const moment = require('moment-timezone');

async function createSampleTrips() {
  console.log('Creating sample trips...\n');

  // Get companies, routes, cars, drivers
  const { data: companies } = await supabase.from('companies').select('id, company_name').limit(2);
  const { data: routes } = await supabase.from('routes').select('id, name, company_id').limit(2);
  const { data: cars } = await supabase.from('cars').select('id, plate_number, capacity, company_id').limit(2);
  const { data: drivers } = await supabase.from('drivers').select('id, name, company_id').limit(2);

  // Create trips for next 7 days
  const trips = [];
  for (let day = 0; day < 7; day++) {
    const tripDate = moment().tz('Africa/Kigali').add(day, 'days');
    
    // Morning trip
    trips.push({
      route_id: routes[0].id,
      car_id: cars[0].id,
      driver_id: drivers[0].id,
      company_id: companies[0].id,
      departure_time: tripDate.clone().hour(8).minute(0).format('YYYY-MM-DD HH:mm:ss'),
      status: 'approved',
      is_active: true,
      price: 5000,
      total_seats: cars[0].capacity,
      available_seats: cars[0].capacity
    });

    // Afternoon trip
    trips.push({
      route_id: routes[0].id,
      car_id: cars[0].id,
      driver_id: drivers[0].id,
      company_id: companies[0].id,
      departure_time: tripDate.clone().hour(14).minute(0).format('YYYY-MM-DD HH:mm:ss'),
      status: 'approved',
      is_active: true,
      price: 5000,
      total_seats: cars[0].capacity,
      available_seats: cars[0].capacity
    });

    // If second company exists
    if (routes[1] && cars[1] && drivers[1]) {
      trips.push({
        route_id: routes[1].id,
        car_id: cars[1].id,
        driver_id: drivers[1].id,
        company_id: companies[1].id,
        departure_time: tripDate.clone().hour(9).minute(0).format('YYYY-MM-DD HH:mm:ss'),
        status: 'approved',
        is_active: true,
        price: 6000,
        total_seats: cars[1].capacity,
        available_seats: cars[1].capacity
      });
    }
  }

  // Insert trips
  const { data, error } = await supabase.from('trips').insert(trips);
  
  if (error) {
    console.error('❌ Error creating trips:', error);
    process.exit(1);
  }

  console.log(`✅ Created ${trips.length} trips!`);
  console.log('\nTrips scheduled for:');
  for (let day = 0; day < 7; day++) {
    console.log(`  - ${moment().add(day, 'days').format('YYYY-MM-DD')}: 2-3 trips`);
  }
}

createSampleTrips();
```

### Run the script:
```bash
cd backend
node scripts/create-sample-trips.js
```

---

## Important Notes

### ⚠️ Date Requirements

- **Departure date MUST be in the future** (after February 15, 2026)
- Trips with past dates won't show as "available"
- Frontend filters trips to show only upcoming departures

### ✅ Required Data

Before creating trips, ensure you have:
- [ ] At least 1 active company
- [ ] At least 1 route
- [ ] At least 1 car
- [ ] At least 1 driver

**Check with:** `node scripts/check-database-data.js`

### 📊 Trip Status

For trips to be visible to customers:
- Status must be: `approved` or `scheduled`
- is_active must be: `true` or `1`
- available_seats must be: > 0

---

## Verify Trips Are Showing

### 1. Check API:
```bash
curl https://bus-ticket-c8ld.onrender.com/api/trips
```

Should return array of trips with future departure dates

### 2. Check Frontend:
1. Go to https://bus-ticket-theta.vercel.app
2. Click "Book Ticket" or "Trips"
3. Should see list of available trips

### 3. Test Booking:
1. Login as customer: `customer@example.com` / `customer123`
2. Select a trip
3. Choose seats
4. Complete booking

---

## Troubleshooting

### "Still no trips showing"

**Check:**
1. Are trips set to future dates? ✓
2. Is status = 'approved'? ✓
3. Is is_active = true? ✓
4. Are available_seats > 0? ✓

**Debug:**
```bash
cd backend
node scripts/check-database-data.js
```

### "Cannot create trip"

**Check:**
1. Route exists? Run check script
2. Car exists? Run check script
3. Driver exists? Run check script
4. Company manager logged in correctly?

---

## Quick Summary

**Fastest Way:**
1. Login to company dashboard
2. Create trip for **tomorrow's date**
3. Set all required fields
4. Set status to "approved"
5. Save
6. Refresh frontend → Trip appears! ✅

**Time Required:** 2-3 minutes per trip

---

**Last Updated:** February 15, 2026
