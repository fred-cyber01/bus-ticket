# Quick Test Guide - Booking System

## ✅ Fixed Issues

1. **"Error creating booking: Invalid trip data - missing trip ID"** ✅ FIXED
2. **Missing date/time selection** ✅ ADDED
3. **No available trips display** ✅ ADDED
4. **Company logo/branding** ✅ UPDATED to "Rwanda ICT Solution"

## 🧪 Quick Test Steps

### Test 1: Search for Trips ⏱️ (2 minutes)

1. Start servers:
   ```powershell
   .\START_SYSTEM.ps1
   ```

2. Open browser: `http://localhost:5173`

3. Login:
   - Username: `customer`
   - Password: `password`

4. Search for trips:
   - Origin: `Kigali`
   - Destination: `Rubavu`
   - Date: Select any future date
   - Click **"Search Trips"**

5. **Expected Result**: 
   - See "Available Trips" section
   - Trip cards with green "X seats" badge
   - Each card shows departure time, price, and "Select Seats" button

### Test 2: Book a Ticket ⏱️ (5 minutes)

1. From available trips, click **"Select Seats"** on any trip

2. **Expected Result**: Modal opens with bus seat layout

3. Select 1-2 seats (click blue seats)
   - They turn green when selected
   - Total shows at the top

4. Click **"Proceed to Booking"**

5. Enter passenger details:
   - Full Name: `Test Passenger`
   - Age: `25`
   - Phone: `250788123456`
   - Email: `test@example.com`

6. Click **"Confirm Booking"**

7. **Expected Result**: 
   - Booking created successfully
   - Payment modal appears
   - Booking ID shown

8. (Optional) Enter phone number and click "Pay Now"

### Test 3: View Booked Tickets ⏱️ (1 minute)

1. After booking, close the modal or click "Done"

2. Check "My Bookings" section

3. **Expected Result**:
   - Your ticket appears in the list
   - Shows seat number, origin, destination
   - Status shows "confirmed" or "pending"
   - Can download ticket

### Test 4: Date Filter ⏱️ (1 minute)

1. In the search bar, change the date

2. Click **"Search Trips"**

3. **Expected Result**:
   - Results update based on selected date
   - Only trips for that date appear

## 🎯 What to Check

### Visual Elements:
- ✅ Company name shows "Rwanda ICT Solution"
- ✅ Tagline shows "ICT Solutions · Bus Booking"
- ✅ Date picker visible in search bar
- ✅ Available trips show in gradient cards
- ✅ Seat selection shows bus layout
- ✅ Colors: Blue (available), Green (selected), Red (occupied)

### Functionality:
- ✅ Search works with origin, destination, date
- ✅ Trip cards are clickable
- ✅ Seat selection modal opens
- ✅ Can select multiple seats
- ✅ Total price calculates correctly
- ✅ Passenger form validates required fields
- ✅ Booking creates successfully (NO ERROR!)
- ✅ Ticket appears in "My Bookings"

## ❌ Error Scenarios to Test

### Test: No Trip Selected
1. Somehow try to book without selecting a trip
2. **Expected**: Clear error message (not crash)

### Test: No Seats Selected
1. Open seat selection
2. Click "Proceed to Booking" without selecting seats
3. **Expected**: Alert "Please select at least one seat"

### Test: Missing Passenger Info
1. Select seats
2. Try to confirm without filling name/age
3. **Expected**: Alert "Please enter name and age"

## 🚨 If You See Errors

### "Invalid trip data - missing trip ID"
- **Status**: This should be FIXED
- If you still see this, check browser console (F12)
- Take a screenshot and note the exact steps

### "Cannot read property 'id' of undefined"
- Ensure you searched for trips first
- Try refreshing the page
- Check backend is running

### No trips appear
- Run: `node backend/check-trips-availability.js`
- Check if trips exist in database
- Verify backend is running: `http://localhost:5000/api/health`

## 📊 Expected Backend Endpoints

These should work:
- `GET /api/trips` - Get all trips
- `GET /api/trips?origin=Kigali&destination=Rubavu` - Filter trips
- `GET /api/trips/:id/tickets` - Get occupied seats
- `POST /api/bookings` - Create booking

## 🔍 Debugging Tips

Open browser console (F12) and look for:
```
✅ Good: "Booking created successfully"
✅ Good: "Trip selected: {id: '...', origin: '...', ...}"
❌ Bad: "Invalid trip data"
❌ Bad: "Cannot read property 'id'"
```

## 📝 Test Report Template

After testing, report:

```
Date: _______________
Tester: _______________

Test 1 (Search): ☐ PASS ☐ FAIL
Test 2 (Booking): ☐ PASS ☐ FAIL  
Test 3 (View Tickets): ☐ PASS ☐ FAIL
Test 4 (Date Filter): ☐ PASS ☐ FAIL

Issues Found:
- 
- 

Screenshots: (attach if any errors)
```

## ✅ Success Criteria

All tests PASS when:
1. ✅ Can search for trips with date
2. ✅ Available trips show clearly
3. ✅ Can select seats from bus layout
4. ✅ Can create booking WITHOUT error
5. ✅ Booking appears in "My Tickets"
6. ✅ Can download ticket
7. ✅ Branding shows "Rwanda ICT Solution"

---

**If all tests pass**: System is working correctly! 🎉

**If any test fails**: Check [BOOKING_SYSTEM_GUIDE.md](./BOOKING_SYSTEM_GUIDE.md) for troubleshooting.
