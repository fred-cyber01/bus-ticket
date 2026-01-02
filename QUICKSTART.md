# 🚀 Quick Start Guide

## Get Your Bus Ticket Booking System Running in 15 Minutes!

---

## Step 1: Install Prerequisites (5 minutes)

### Required Software
1. **Node.js** - Download from https://nodejs.org/ (Choose LTS version)
2. **MySQL** - Download from https://dev.mysql.com/downloads/
3. **Git** (optional) - Download from https://git-scm.com/downloads

### Verify Installations
Open Command Prompt or PowerShell and run:
```bash
node --version    # Should show v18 or higher
npm --version     # Should show v9 or higher
mysql --version   # Should show 8.0 or higher
```

---

## Step 2: Database Setup (3 minutes)

### Create Database
1. Open Command Prompt
2. Login to MySQL:
   ```bash
   mysql -u root -p
   ```
   Enter your MySQL root password

3. Create database:
   ```sql
   CREATE DATABASE ticketbooking;
   exit;
   ```

### Import Schema
```bash
cd c:\Users\user\ticketbooking-system-master
mysql -u root -p ticketbooking < database/ticketbooking.sql
```
Enter your MySQL password when prompted.

---

## Step 3: Backend Setup (3 minutes)

### Install Dependencies
```bash
cd backend
npm install
```

### Configure Environment
1. Copy the example file:
   ```bash
   copy .env.example .env
   ```

2. Edit `.env` file (use Notepad):
   ```env
   DB_PASSWORD=your_mysql_password_here
   ```
   Replace `your_mysql_password_here` with your actual MySQL password

### Start Backend Server
```bash
npm run dev
```

**Success!** You should see:
```
✓ Database connected successfully
Server running on port 5000
```

Keep this terminal window open!

---

## Step 4: Mobile App Setup (4 minutes)

### Open New Terminal
Press `Windows + R`, type `powershell`, press Enter

### Install Dependencies
```bash
cd c:\Users\user\ticketbooking-system-master\mobile
npm install
```

### Configure API Connection
1. Find your computer's IP address:
   ```bash
   ipconfig
   ```
   Look for "IPv4 Address" (example: `192.168.1.100`)

2. Edit `mobile/src/config/api.js`:
   - Open file in Notepad
   - Change line 1 to: `const API_URL = 'http://YOUR_IP_HERE:5000/api';`
   - Replace `YOUR_IP_HERE` with your actual IP
   - Save file

### Run Mobile App

**For Android:**
```bash
npx react-native run-android
```

**For iOS (Mac only):**
```bash
cd ios
pod install
cd ..
npx react-native run-ios
```

---

## Step 5: Test the System! (immediate)

### Test Login

1. **Mobile app will open automatically**

2. **Test Admin Login:**
   - Tap "Admin" tab
   - Email: `admin@system.com`
   - Password: `admin123`
   - Tap "Login"
   
   ✅ You should see the Admin Dashboard!

3. **Test User Registration:**
   - Logout (if logged in)
   - Tap "Register"
   - Fill in details:
     - Username: testuser
     - Email: test@example.com
     - Phone: 0788123456
     - Password: test123
   - Tap "Register"
   
   ✅ You should be logged in and see available trips!

4. **Test Booking:**
   - Browse available trips
   - Tap "Book Now"
   - Select a seat
   - Tap "Confirm Booking"
   
   ✅ Booking confirmed!

---

## 🎉 Congratulations!

Your complete bus ticket booking system is now running!

### What's Working:
- ✅ Backend API (57+ endpoints)
- ✅ MySQL Database (14 tables with sample data)
- ✅ Mobile App (User/Admin/Driver interfaces)
- ✅ Authentication & Authorization
- ✅ Seat Selection & Booking
- ✅ Admin Dashboard
- ✅ Driver Trip Management

---

## 📱 App Features Overview

### As Regular User:
- Register & Login
- Browse available trips
- Select seats visually
- Book tickets
- View bookings
- Cancel tickets

### As Admin:
- View dashboard statistics
- Manage companies
- Manage vehicles
- Manage drivers
- Manage routes
- View all bookings
- Revenue analytics

### As Driver:
- View current trip
- See passenger list
- Update trip status
- View trip history

---

## 🆘 Troubleshooting

### "Cannot connect to database"
**Solution:** Check your `.env` file in backend folder. Make sure DB_PASSWORD matches your MySQL password.

### "Port 5000 already in use"
**Solution:** 
1. Stop the backend (Ctrl+C)
2. Edit `backend/.env`: change `PORT=5000` to `PORT=5001`
3. Edit `mobile/src/config/api.js`: change port to 5001
4. Restart backend

### "Mobile app can't connect"
**Solution:**
1. Make sure backend is running (Step 3)
2. Check IP address in `mobile/src/config/api.js`
3. Don't use `localhost` - use your actual IP address
4. Try opening `http://YOUR_IP:5000/health` in your phone's browser

### Android build fails
**Solution:**
```bash
cd mobile/android
./gradlew clean
cd ..
npx react-native run-android
```

---

## 📚 Additional Resources

- **Full Documentation:** `README.md`
- **Detailed Setup:** `INSTALLATION.md`
- **Project Status:** `PROJECT_STATUS.md`
- **API Endpoints:** See README.md section "API Documentation"

---

## 🔄 Daily Development Workflow

### Start Backend
```bash
cd backend
npm run dev
```

### Start Mobile App
```bash
cd mobile
npm start
# In another terminal:
npx react-native run-android  # or run-ios
```

---

## 🚀 Next Steps

1. **Customize the app:**
   - Change app name in `mobile/app.json`
   - Update colors in screen styles
   - Add your logo

2. **Add features:**
   - Payment integration
   - Push notifications
   - QR codes for tickets
   - Real-time updates

3. **Deploy to production:**
   - Follow deployment section in INSTALLATION.md
   - Set up production database
   - Deploy backend to cloud
   - Build APK/IPA for app stores

---

## 💡 Pro Tips

1. **Keep both terminals open** - One for backend, one for mobile
2. **Check backend terminal** - All API requests are logged there
3. **Use Postman** - Test API endpoints directly
4. **Enable USB debugging** - For testing on real Android device
5. **Read error messages** - They usually tell you exactly what's wrong!

---

**Questions?** Check the full documentation in README.md and INSTALLATION.md

**Happy Coding! 🎉**
