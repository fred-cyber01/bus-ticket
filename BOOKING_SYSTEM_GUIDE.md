# Booking System - Complete Guide

## 🎉 What Was Fixed

### 1. **Critical Bug Fixed: Missing Trip ID Error**
   - **Problem**: `Error creating booking: Invalid trip data - missing trip ID`
   - **Root Cause**: The trip object was using `tripId` property but the SeatSelection component expected `id`
   - **Solution**: Updated the trip mapping to include both `id` and `tripId` properties, and enhanced error handling

### 2. **Enhanced Dashboard UI**
   - **Company Branding**: Changed from "RideRwanda" to "Rwanda ICT Solution" with tagline "ICT Solutions · Bus Booking"
   - **Date/Time Selection**: Added date picker to search for trips on specific dates
   - **Available Trips Display**: Shows search results prominently with clear visual cards
   - **Better Trip Information**: Each trip card shows:
     - Available seats count
     - Departure date and time
     - Origin and destination
     - Price
     - Company name
     - Direct "Select Seats" button

### 3. **Improved Booking Flow**
   The booking process now clearly shows:
   1. **Search for Trips**: Enter origin, destination, and optional date
   2. **View Available Trips**: See all matching trips with availability
   3. **Select Seats**: Visual bus layout with real-time seat availability
   4. **Enter Passenger Details**: Form for each passenger
   5. **Complete Payment**: MTN Mobile Money integration
   6. **Get Ticket**: QR code and downloadable ticket

## 🚀 How to Use the Booking System

### For Customers:

#### Step 1: Login
- Username: `customer`
- Password: `password`
- Or use: `customer@example.com`

#### Step 2: Search for Trips
1. In the top search bar, you'll see 4 fields:
   - **📍 From**: e.g., "Kigali"
   - **📍 To**: e.g., "Rubavu"
   - **📅 Date**: Select your travel date (or leave empty for all dates)
   - **🕐 Time**: Choose time of day:
     - All Times (default)
     - 🌅 Morning (5AM-12PM)
     - ☀️ Afternoon (12PM-5PM)
     - 🌆 Evening (5PM-9PM)
     - 🌙 Night (9PM-5AM)
2. Click **"🔍 Search Trips"**

**Pro Tip**: The time filter helps you find trips at your preferred time. Morning trips have orange cards, evening trips have purple cards!

#### Step 3: View Available Trips
- After searching, you'll see a section titled **"🚌 Available Trips"**
- Shows trip count and selected date (e.g., "Found 8 trips • Saturday, February 22")
- Sort options available: ⏰ Time, 💰 Price, 💺 Seats
- Each trip card shows:
  - **Time Badge** (top right): 🌅 Morning, ☀️ Afternoon, 🌆 Evening, or 🌙 Night
  - **Color-coded cards** based on departure time
  - Company name and bus number
  - Origin → Destination
  - **Large departure time** (e.g., "08:30 AM") in bold
  - Available seats count (green badge)
  - Price per seat
  - Direct "Select Seats" button

**Pro Tip**: Cards are color-coded by time:
- 🟠 Orange = Morning trips
- 🟡 Yellow = Afternoon trips
- 🟣 Purple = Evening trips
- 🔵 Blue = Night trips

#### Step 4: Select Your Trip
- Click on any trip card or click the **"Select Seats"** button
- A seat selection modal will open

#### Step 5: Choose Your Seats
1. View the bus layout (front to back)
2. **Color Legend**:
   - 🔵 Blue = Available
   - 🟢 Green = Your Selection
   - 🔴 Red = Already Occupied
3. Click on available seats to select them
4. Selected seats show at the top with total price
5. Click **"Proceed to Booking"**

#### Step 6: Enter Passenger Details
- For each selected seat, enter:
  - Full Name (required)
  - Age (required)
  - Phone number
  - Email
- Click **"Next"** or **"Confirm Booking"**

#### Step 7: Complete Payment
1. Booking is created automatically
2. Enter your MTN Mobile Money phone number
3. Click **"Pay Now"**
4. Check your phone for the payment prompt
5. Complete payment on your phone

#### Step 8: Get Your Ticket
- View ticket preview with QR code
- Download/Print ticket for boarding
- Ticket saved in "My Bookings" section

### For Managers/Admins:

#### Creating Trips
1. Login as manager or admin
2. Click **"New Trip"** button (top right)
3. Fill in trip details:
   - Origin
   - Destination
   - Departure date/time
   - Arrival date/time
   - Price (RWF)
   - Number of seats
   - Bus/Plate number
4. Click **"Create Trip"**

## 📱 Dashboard Features

### My Bookings Tab
- View all your booked tickets
- Each ticket shows:
  - Ticket number
  - Origin → Destination
  - Departure date/time
  - Seat number
  - Price
  - Status (confirmed/pending)
- Actions:
  **Trip count and date** displayed prominently
- **Sort by**: Time (earliest first), Price (cheapest first), or Seats (most available)
- **Filter by time of day**: Morning, Afternoon, Evening, Night
- Real-time seat availability
- **Color-coded cards** for easy time identification
- Click any trip to start booking
- Clear button to reset search andicket

### Payment History Tab
- View all payment transactions
- Filter by date, method, status
- Download receipts

### Available Trips Section
- Shows after searching for trips
- Real-time seat availability
- Click any trip to start booking
- Clear button to hide results
Color-Coded Time Cards**: Morning trips = orange, afternoon = yellow, evening = purple, night = blue
2. **Time Badges**: Each trip shows a visual badge indicating time of day (🌅🌆☀️🌙)
3. **Large Time Display**: Departure time shown in large, bold numbers (e.g., "08:30 AM")
4. **Status Badges**: Green for available seats, color-coded status
5. **Modern Layout**: Clean, professional design with gradients
6. **Responsive**: Works on desktop and mobile
7. **Icons**: Clear visual indicators for all actions (📍🕐📅🚌)
8. **Animations**: Smooth transitions and hover effects
9. **Sort Controls**: Easy dropdown to sort by time, price, or sear-coded status
3. **Modern Layout**: Clean, professional design
4. **Responsive**: Works on desktop and mobile
5. **Icons**: Clear visual indicators for all actions
6. **Animations**: Smooth transitions and hover effects

### Accessibility:
- Clear labels and instructions
- Color-coded seat selection
- Error messages with helpful context
- Loading states for all async operations

## 🔧 Technical Details

### Trip Object Structure (Fixed):
```javascript
{
  id: "trip-id",                    // Primary ID (FIXED)
  tripId: "trip-id",                // Backup ID
  origin: "Kigali",
  destination: "Rubavu",
  boarding_stop_name: "Kigali",     // Alternative property
  dropoff_stop_name: "Rubavu",      // Alternative property
  departureTime: "2026-02-20T08:00:00Z",
  departure_time: "2026-02-20T08:00:00Z",
  price: 15000,
  total_seats: 50,
  totalSeats: 50,
  availableSeats: 35,
  busNumber: "RAB 123A",
  bus_number: "RAB 123A",
  plate_number: "RAB 123A",
  companyName: "Rwanda ICT Solution",
  company_name: "Rwanda ICT Solution"
}
```

### Error Handling:
- Trip ID validation with multiple fallbacks
- Clear error messages for users
- Console logging for debugging
- Graceful fallbacks for missing data

## 🐛 Troubleshooting

### "Invalid trip data - missing trip ID"
✅ **FIXED**: The system now checks multiple properties for trip ID and provides better error messages.

### No trips showing after search
- Ensure the backend is running
- Check that trips exist for the selected route
- Try searching without a date first
- Check browser console for errors

### Seats not loading
- Refresh the page
- Check internet connection
- Ensure trip ID is valid
- Contact support if issue persists

### Payment not initiating
- Verify phone number format: 2507XXXXXXXX
- Check MTN Mobile Money is enabled
- Ensure sufficient balance
- Try again after a few seconds

## 📞 Support

If you encounter any issues:
1. Check browser console for errors (F12 → Console)
2. Try refreshing the page
3. Verify login credentials
4. Check backend server is running
5. Review error messages carefully

## ✅ Testing Checklist

- [x] Login as customer
- [x] Search for trips (with and without date)
- [x] View available trips
- [x] Select seats from bus layout
- [x] Enter passenger details
- [x] Create booking
- [x] View booking in "My Tickets"
- [x] Download ticket
- [x] View payment history

---

**Last Updated**: February 18, 2026
**Version**: 2.0 (Booking Fix Release)
**Company**: Rwanda ICT Solution
