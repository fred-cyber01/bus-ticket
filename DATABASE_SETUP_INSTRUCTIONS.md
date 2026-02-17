# 🔧 Database Setup Instructions

## Step 1: Add Missing Columns to Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Click **"New Query"**
4. Copy and paste the following SQL:

```sql
-- Add missing columns to trips table
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS company_id bigint REFERENCES companies(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS trip_date date,
  ADD COLUMN IF NOT EXISTS price numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_seats integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS occupied_seats integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS available_seats integer DEFAULT 0;

-- Add missing columns to tickets table
ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS company_id bigint REFERENCES companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS route_id bigint REFERENCES routes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS booking_reference varchar(100) UNIQUE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trips_company ON trips(company_id);
CREATE INDEX IF NOT EXISTS idx_trips_date ON trips(trip_date);
CREATE INDEX IF NOT EXISTS idx_tickets_company ON tickets(company_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(ticket_status);
CREATE INDEX IF NOT EXISTS idx_trips_route ON trips(route_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
```

5. Click **"Run"** (or press Ctrl+Enter)
6. Wait for "Success. No rows returned"

## Step 2: Run the Setup Script

After adding the columns, run this command in your terminal:

```bash
cd backend
node setup-complete-system.js
```

This will create:
- ✅ 7 Bus Companies (Rwanda Express, Virunga Coaches, Huye Transport, etc.)
- ✅ 35-49 Buses total
- ✅ 35-49 Drivers total  
- ✅ Multiple Routes covering North, South, East, West Rwanda
- ✅ Thousands of trips from TODAY to April 4, 2026
- ✅ All trips ready for booking

## Step 3: Login and Test

**Company Manager Credentials (any of the 7):**
```
Email: info@rwandaexpress.rw (or any company email)
Password: manager123
```

**Features to Test:**
- View all buses, drivers, routes
- See trips in dashboard
- Customers can search and book tickets
- Seat selection works correctly
- Booking management

## 🗺️ Routes Created

**North (2 companies):**
- Kigali → Musanze (116 km)
- Kigali → Gakenke (95 km)
- Kigali → Rulindo (45 km)

**South (1 company):**
- Kigali → Huye (136 km)
- Kigali → Nyanza (88 km)
- Kigali → Gisagara (145 km)
- Kigali → Nyamagabe (165 km)

**East (2 companies):**
- Kigali → Rwamagana (55 km)
- Kigali → Kayonza (82 km)
- Kigali → Nyagatare (168 km)
- Kigali → Kirehe (125 km)

**West (2 companies):**
- Kigali → Rubavu (156 km)
- Kigali → Karongi (135 km)
- Kigali → Rusizi (235 km)
- Kigali → Rutsiro (110 km)

---

**Need Help?** Check the console output after running the script for detailed company information!
