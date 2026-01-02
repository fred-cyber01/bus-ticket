# 🚀 QUICK START GUIDE

## ⚠️ IMPORTANT: Start XAMPP MySQL First!

**Before running the system, make sure XAMPP MySQL is running:**

1. Open XAMPP Control Panel
2. Click "Start" next to MySQL
3. Wait until it says "Running"

---

## 🎯 Option 1: Easy Start (Recommended)

**Just double-click this file:**
```
START_SERVERS.ps1
```

If Windows blocks it:
1. Right-click → "Run with PowerShell"
2. Or open PowerShell in this folder and run: `.\START_SERVERS.ps1`

---

## 🎯 Option 2: Manual Start

**Terminal 1 - Backend:**
```powershell
cd backend
npm start
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

---

## 🌐 Access the System

Once both servers are running:

**Frontend (User Interface):**
- URL: http://localhost:5173

**Backend API:**
- URL: http://localhost:3000

---

## 🔐 Test Accounts

**Admin Dashboard:**
- Email: `admin@ticketbus.rw`
- Password: `admin123`

**Company Dashboard:**
- Email: `manager@rwandaexpress.rw`  
- Password: `manager123`

**Customer (New Registration):**
- Sign up at: http://localhost:5173

---

## ✅ System Features

**Customer Features:**
- ✅ Browse trips by route and date
- ✅ See available seats in real-time
- ✅ Book tickets with passenger details
- ✅ Confirm payment
- ✅ Download tickets as PDF with QR code
- ✅ View all bookings

**Company Dashboard:**
- ✅ Manage buses, drivers, routes
- ✅ Create and manage trips
- ✅ View bookings and payments
- ✅ Company statistics

**Admin Dashboard:**
- ✅ View system statistics
- ✅ Manage users, companies, trips, tickets
- ✅ Approve company registrations
- ✅ Full CRUD operations

---

## ❌ Troubleshooting

**Error: ERR_CONNECTION_REFUSED**
- Backend server is not running
- Start backend with: `cd backend && npm start`

**Error: Cannot connect to MySQL**
- XAMPP MySQL is not running
- Start XAMPP and click "Start" for MySQL

**Error: Port 3000 already in use**
- Another process is using port 3000
- Kill it or change port in `backend/config/config.js`

**Error: Port 5173 already in use**
- Another Vite server is running
- Kill it or it will use next available port

---

## 📱 Responsive Design

The system works on:
- ✅ Desktop (1920x1080+)
- ✅ Laptop (1366x768)
- ✅ Tablet (768x1024)
- ✅ Mobile (375x667)

---

## 🎫 Booking Flow

1. **Customer browses trips** → Sees available trips with seat numbers
2. **Clicks "Book Now"** → Enters passenger name, age, phone, email
3. **Ticket created** → Status: PENDING, Payment: PENDING
4. **Customer confirms payment** → Status: CONFIRMED, Payment: COMPLETED
5. **Downloads PDF ticket** → Includes QR code for scanning

---

## 🛠️ Development

**Backend (Node.js + Express + MySQL):**
- Database: XAMPP MySQL (`ticketbooking`)
- Port: 3000
- Auto-restart: nodemon

**Frontend (React + Vite):**
- Port: 5173
- Hot reload: enabled

---

## 📞 Need Help?

Check the error messages in the terminal windows for specific issues.

**Common issues:**
1. XAMPP not started → Start XAMPP MySQL
2. Backend not running → `cd backend && npm start`
3. Frontend not running → `cd frontend && npm run dev`
4. Database not imported → Import `database/COMPLETE_DATABASE_SETUP.sql`

---

**✨ System is ready! Just start the servers and enjoy! ✨**
