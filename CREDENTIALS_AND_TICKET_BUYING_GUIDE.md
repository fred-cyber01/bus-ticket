# 🎫 Complete Credentials & Ticket Buying Guide

## 🔐 ALL AVAILABLE LOGIN CREDENTIALS

### ✅ **Option 1: Customer Account (Recommended for Buying Tickets)**

**Email:** `customer@example.com`  
**Password:** `customer123`

- ✅ Can search and browse trips
- ✅ Can book tickets
- ✅ Can make payments
- ✅ Can view booking history
- ✅ Can download tickets with QR codes

---

### 🏢 **Option 2: Company Manager Account**

**Email:** `manager@rwandaexpress.rw`  
**Password:** `manager123`

- ✅ Manages company operations
- ✅ Creates trips and routes
- ✅ Views bookings
- Can also buy tickets as a customer

---

### 👨‍💼 **Option 3: Admin Account**

**Email:** `admin@ticketbus.rw`  
**Password:** `admin123`

- ✅ Full system access
- ✅ Manages all users and companies
- ✅ Views all transactions
- Can also buy tickets as a customer

---

## 🚨 FIXING THE SIGNUP ERROR

**Error:** `duplicate key value violates unique constraint "users_user_name_key"`

**What it means:** The username you're trying to use already exists in the database.

### Solutions:

#### **Solution 1: Use Existing Account (Easiest)**
Just login with one of the credentials above - they're already created and ready to use!

#### **Solution 2: Create New Account with Different Username**
When signing up, use a **unique username** like:
- `john_doe_2026`
- `traveler_feb15`
- `user_` + random numbers
- Your name + numbers (e.g., `michael_789`)

**Important:** Both email AND username must be unique!

#### **Solution 3: Clear Database and Start Fresh**
If you want to reset everything:
```sql
-- Run this in your database
DELETE FROM users WHERE email = 'youremail@example.com';
```

---

## 🎫 STEP-BY-STEP GUIDE TO BUY TICKETS

### **Step 1: Access the Website**

1. Open your browser
2. Go to: **https://bus-ticket-c8ld.onrender.com**
   - Or locally: **http://localhost:5173**

---

### **Step 2: Login**

1. Click **"Sign In"** or **"Login"** button
2. Enter credentials:
   - **Email:** `customer@example.com`
   - **Password:** `customer123`
3. Click **"Sign In"**
4. You'll be redirected to your dashboard

---

### **Step 3: Search for Trips**

**Option A: From Dashboard**
1. Look for "Available Trips" section
2. You'll see all trips with available seats

**Option B: From Navigation**
1. Click **"Book Ticket"** or **"Trips"** in menu
2. Browse all available trips

**Option C: Use Filters**
1. Select **Origin** (e.g., "Kigali")
2. Select **Destination** (e.g., "Musanze")
3. Select **Date**
4. Click **"Search"**

---

### **Step 4: Choose Your Trip**

You'll see trip details:
- 🚌 **Bus Company** (e.g., Rwanda Express)
- 📍 **Route** (Kigali → Musanze)
- ⏰ **Departure Time** (e.g., 08:00 AM)
- ⏰ **Arrival Time** (e.g., 10:30 AM)
- 💰 **Price** (e.g., 5,000 RWF)
- 💺 **Available Seats** (e.g., 35 seats available)

Click **"Book Now"** or **"Select Seats"** on the trip you want

---

### **Step 5: Select Seats**

1. **View Seat Layout**
   - 🔴 **Red seats** = Occupied (unavailable)
   - 🔵 **Blue seats** = Available (click to select)
   - 🟢 **Green seats** = Your selection

2. **Click on available seats** to select them
   - You can select multiple seats for group bookings
   - Each seat will turn **green** when selected

3. **Click "Proceed to Booking"** when done

---

### **Step 6: Enter Passenger Details**

For each seat selected, provide:

1. **Full Name** (required) - e.g., "John Doe"
2. **Age** (required) - e.g., 25
3. **Phone Number** (optional) - e.g., "+250788123456"
4. **Email** (optional) - e.g., "john@example.com"

**For Multiple Passengers:**
- Fill details for passenger 1
- Click **"Next"**
- Fill details for passenger 2
- Continue until all passengers are added
- Click **"Confirm & Continue to Payment"**

---

### **Step 7: Review Booking**

Check your booking summary:
- ✅ Trip details
- ✅ Seats selected
- ✅ Passenger names
- ✅ Total price (includes 5% service fee)

Click **"Confirm Booking"** to create the booking

---

### **Step 8: Make Payment**

1. **Choose Payment Method:**
   - 💳 **MTN Mobile Money** (Recommended)
   - 💳 **Other payment options** (if available)

2. **For MTN MoMo:**
   - Enter your **phone number** (e.g., 0788123456)
   - Click **"Pay Now"**
   - Check your phone for the MoMo prompt
   - Enter your **MoMo PIN** to confirm
   - Wait for payment confirmation

3. **Payment Status:**
   - ✅ **Success** - Your ticket is confirmed!
   - ⏳ **Pending** - Check your phone for MoMo prompt
   - ❌ **Failed** - Try again or use different payment method

---

### **Step 9: Get Your Ticket**

After successful payment:

1. **View Ticket Details:**
   - Booking reference number
   - QR code (for scanning at bus station)
   - Passenger details
   - Departure time and location
   - Seat numbers

2. **Download Ticket:**
   - Click **"Download PDF"** button
   - Save the PDF to your device
   - Print or show on phone when boarding

3. **Access Later:**
   - Go to **"My Tickets"** or **"My Bookings"** in dashboard
   - All your tickets are saved there
   - You can download them anytime

---

## 🎯 QUICK TICKET BUYING (Summary)

```
1. Login → customer@example.com / customer123
2. Click "Trips" or "Book Ticket"
3. Search for your route (Origin → Destination)
4. Click "Book Now" on desired trip
5. Select seats (click blue seats)
6. Click "Proceed to Booking"
7. Enter passenger details (Name, Age)
8. Click "Confirm & Continue to Payment"
9. Enter phone number
10. Click "Pay Now"
11. Confirm payment on your phone
12. Download your ticket PDF
```

---

## 💡 TIPS FOR SUCCESSFUL BOOKING

### ✅ **Before Booking:**
- Check available seats before selecting
- Compare departure times
- Note the bus company and plate number
- Ensure you have payment method ready (MTN MoMo)

### ✅ **During Booking:**
- Use unique seat numbers
- Enter correct passenger names (as on ID)
- Provide valid phone number for updates
- Double-check all details before confirming

### ✅ **After Booking:**
- Save/download your ticket immediately
- Note your booking reference number
- Arrive at departure point 15-30 minutes early
- Have your QR code ready for scanning

---

## 🆘 TROUBLESHOOTING

### ❌ **Cannot Login**
**Solution:**
- Clear browser cache (Ctrl+Shift+Delete)
- Use exact credentials (copy-paste)
- Try different browser
- Clear localStorage:
  ```javascript
  // Press F12, go to Console, paste:
  localStorage.clear()
  // Then refresh page
  ```

### ❌ **No Trips Available**
**Solution:**
- Check if any trips exist in the system
- Try different date or route
- Contact company manager to create trips
- Login as admin to verify system data

### ❌ **Seats Unavailable**
**Solution:**
- Refresh the page to see current availability
- Choose different seats
- Try different trip/time

### ❌ **Payment Failed**
**Solution:**
- Check phone number is correct (MTN number)
- Ensure sufficient balance
- Check for MoMo prompt on phone
- Try again in a few minutes
- Contact support if persistent

### ❌ **Cannot Download Ticket**
**Solution:**
- Check if payment was successful
- Go to "My Bookings" to find the ticket
- Refresh the page
- Try different browser
- Contact support with booking reference

---

## 📱 PAYMENT METHODS SUPPORTED

### 1. **MTN Mobile Money (MoMo)** ✅
- Most common and recommended
- Instant payment
- Get phone prompt to confirm
- Widely used in Rwanda

### 2. **Other Methods** (if configured)
- Bank transfer
- Credit/Debit card
- Cash payment (at office)

---

## 🎫 YOUR TICKET INCLUDES

✅ **QR Code** - For quick scanning at bus station  
✅ **Booking Reference** - Unique ID for your ticket  
✅ **Passenger Details** - Names and seat numbers  
✅ **Trip Details** - Route, time, bus info  
✅ **Company Info** - Bus company name and contact  
✅ **Receipt** - Payment confirmation  
✅ **Terms** - Cancellation and refund policy  

---

## 📞 SUPPORT

If you encounter any issues:

1. **Check this guide** first
2. **Clear browser cache** and try again
3. **Use provided test credentials** to verify system works
4. **Check backend logs** for error details (if you have access)
5. **Contact system administrator**

---

## ✅ VERIFICATION CHECKLIST

Before buying tickets, ensure:

- [ ] Backend server is running (port 3000 or on Render)
- [ ] Frontend is accessible (port 5173 or on Render)
- [ ] You have valid login credentials
- [ ] Trips are available in the system
- [ ] Payment method is set up (MTN MoMo)
- [ ] Your phone number is valid

---

## 🚀 READY TO BUY TICKETS?

**Start Here:**

1. **Go to:** https://bus-ticket-c8ld.onrender.com
2. **Login with:** customer@example.com / customer123
3. **Click:** "Book Ticket" or "Trips"
4. **Follow:** Steps 1-9 above

**Happy Traveling! 🚌**

---

**Last Updated:** February 15, 2026  
**System:** Elite Bus Ticketing System  
**Version:** 1.0
