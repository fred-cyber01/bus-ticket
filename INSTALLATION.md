# Bus Ticket Booking System - Complete Installation Guide

## Prerequisites

### Required Software
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MySQL** (v8.0 or higher) - [Download](https://dev.mysql.com/downloads/)
- **Git** - [Download](https://git-scm.com/downloads)
- **React Native Development Environment**:
  - For Android: Android Studio, JDK 11+
  - For iOS: Xcode (Mac only)

### Verify Installations
```bash
node --version    # Should show v18.x.x or higher
npm --version     # Should show 9.x.x or higher
mysql --version   # Should show 8.0.x or higher
```

---

## Part 1: Database Setup

### Step 1: Create MySQL Database

1. **Start MySQL Server**
   - Windows: Open MySQL Workbench or run `net start MySQL80`
   - Mac/Linux: `sudo systemctl start mysql`

2. **Login to MySQL**
   ```bash
   mysql -u root -p
   ```

3. **Create Database**
   ```sql
   CREATE DATABASE ticketbooking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   USE ticketbooking;
   ```

4. **Import Schema**
   Exit MySQL shell and run:
   ```bash
   mysql -u root -p ticketbooking < database/ticketbooking.sql
   ```

5. **Verify Tables Created**
   ```bash
   mysql -u root -p ticketbooking -e "SHOW TABLES;"
   ```
   You should see 14 tables: admins, users, drivers, companies, cars, stops, routes, route_stops, destination_prices, daily_schedules, trips, trip_stop_times, tickets, tickets2

---

## Part 2: Backend Setup

### Step 1: Navigate to Backend Directory
```bash
cd backend
```

### Step 2: Install Dependencies
```bash
npm install
```

This will install:
- express (web framework)
- mysql2 (database driver)
- jsonwebtoken (authentication)
- bcryptjs (password hashing)
- express-validator (input validation)
- dotenv (environment variables)
- helmet, cors, compression (security & optimization)
- morgan (logging)
- moment-timezone (date handling)

### Step 3: Configure Environment Variables

1. **Copy the example environment file**
   ```bash
   copy .env.example .env
   ```

2. **Edit `.env` file** with your database credentials:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database Configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password_here
   DB_NAME=ticketbooking
   DB_PORT=3306

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   JWT_EXPIRE=7d

   # API Configuration
   API_PREFIX=/api
   
   # Timezone
   TZ=Africa/Kigali
   ```

   **Important**: Replace `your_mysql_password_here` with your actual MySQL root password!

### Step 4: Test Database Connection
```bash
npm run dev
```

You should see:
```
✓ Database connected successfully
Server running on port 5000 in development mode
```

### Step 5: Test API Endpoints

Open a browser or use Postman to test:
- Health check: `http://localhost:5000/health`
- Should return: `{"status":"ok","timestamp":"..."}`

---

## Part 3: Mobile App Setup

### Step 1: Navigate to Mobile Directory
```bash
cd mobile
```

### Step 2: Install Dependencies
```bash
npm install
```

This will install:
- react-native (framework)
- react-navigation (navigation)
- axios (API calls)
- react-native-vector-icons (icons)
- react-native-toast-message (notifications)
- @react-native-async-storage/async-storage (local storage)

### Step 3: Configure API URL

1. **Find your computer's local IP address**
   - Windows: Open Command Prompt and run `ipconfig`
   - Look for "IPv4 Address" under your active network adapter
   - Example: `192.168.1.100`

2. **Update API configuration**
   
   Edit `mobile/src/config/api.js`:
   ```javascript
   const API_URL = 'http://192.168.1.100:5000/api'; // Replace with YOUR IP
   ```

   **Important**: Don't use `localhost` or `127.0.0.1` for mobile apps!

### Step 4: Install iOS Pods (Mac only)
```bash
cd ios
pod install
cd ..
```

### Step 5: Link Vector Icons

**For Android:**
1. File is already configured in `android/app/build.gradle`

**For iOS:**
```bash
cd ios
pod install
cd ..
```

---

## Part 4: Running the Application

### Start Backend Server

In the `backend` directory:
```bash
npm run dev
```

Server should be running on `http://localhost:5000`

### Start Mobile App

In the `mobile` directory:

**For Android:**
```bash
npx react-native run-android
```

**For iOS (Mac only):**
```bash
npx react-native run-ios
```

**Alternative: Use Metro Bundler**
```bash
# Terminal 1: Start Metro
npm start

# Terminal 2: Run on device
# For Android
npx react-native run-android
# For iOS
npx react-native run-ios
```

---

## Part 5: Testing the System

### Test User Registration & Login

1. **Open the mobile app**
2. **Click "Register" from login screen**
3. **Fill in registration form**:
   - Username: testuser
   - Full Name: Test User
   - Email: test@example.com
   - Phone: 0788123456
   - Password: test123

4. **Click Register** - You should be logged in automatically

### Test Admin Login

From login screen:
1. **Select "Admin" tab**
2. **Use demo credentials**:
   - Email: admin@system.com
   - Password: admin123

### Test Driver Login

From login screen:
1. **Select "Driver" tab**
2. **Use demo credentials**:
   - Email: driver1@company.com
   - Password: driver123

### Test Ticket Booking

1. **Login as regular user**
2. **Go to Home tab**
3. **You should see available trips**
4. **Click "Book Now" on any trip**

---

## Common Issues & Solutions

### Issue 1: "Cannot connect to database"
**Solution:**
- Verify MySQL is running: `net start MySQL80` (Windows) or `sudo systemctl status mysql` (Linux)
- Check database credentials in `backend/.env`
- Test connection: `mysql -u root -p` and enter your password

### Issue 2: "Port 5000 already in use"
**Solution:**
- Change port in `backend/.env`: `PORT=5001`
- Update mobile app config: `src/config/api.js` with new port

### Issue 3: Mobile app can't connect to backend
**Solution:**
- Ensure backend is running: `npm run dev` in backend directory
- Use correct IP address in `mobile/src/config/api.js` (not localhost!)
- Check firewall settings allow connections on port 5000
- Test API: Open `http://YOUR_IP:5000/health` in phone browser

### Issue 4: "react-native command not found"
**Solution:**
```bash
npm install -g react-native-cli
```

### Issue 5: Android build fails
**Solution:**
```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### Issue 6: iOS build fails (Mac)
**Solution:**
```bash
cd ios
pod deintegrate
pod install
cd ..
npx react-native run-ios
```

---

## Project Structure Overview

```
ticketbooking-system/
├── backend/                 # Node.js REST API
│   ├── config/             # Database & app config
│   ├── middleware/         # Auth, validation, error handling
│   ├── models/             # Database models
│   ├── controllers/        # Business logic
│   ├── routes/             # API endpoints
│   ├── .env                # Environment variables (create this)
│   └── server.js           # Entry point
│
├── mobile/                 # React Native app
│   ├── src/
│   │   ├── config/         # API configuration
│   │   ├── context/        # Global state (AuthContext)
│   │   ├── navigation/     # Screen navigation
│   │   ├── screens/        # UI screens
│   │   │   ├── Auth/       # Login, Register
│   │   │   ├── User/       # User screens
│   │   │   ├── Admin/      # Admin screens
│   │   │   └── Driver/     # Driver screens
│   │   └── services/       # API calls
│   ├── App.js              # Root component
│   └── index.js            # Entry point
│
└── database/               # MySQL schema
    └── ticketbooking.sql   # Database structure & sample data
```

---

## API Endpoints Reference

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/driver/login` - Driver login
- `GET /api/auth/me` - Get current user

### Tickets
- `POST /api/tickets` - Book ticket
- `POST /api/tickets/check-availability` - Check seat availability
- `GET /api/tickets` - Get user's tickets
- `DELETE /api/tickets/:id` - Cancel ticket

### Trips
- `GET /api/trips/available` - Get available trips
- `GET /api/trips` - Get all trips
- `GET /api/trips/:id` - Get trip details

### Admin (Authentication Required)
- `GET /api/companies` - List companies
- `POST /api/companies` - Create company
- `GET /api/cars` - List cars
- `POST /api/drivers` - Create driver
- `GET /api/routes` - List routes

Full API documentation in `README.md`

---

## Next Steps

1. **Implement remaining screens**:
   - BookTicketScreen (seat selection)
   - MyTicketsScreen (ticket list)
   - Admin CRUD screens
   - Driver trip management

2. **Add features**:
   - Payment integration
   - Real-time seat updates
   - Push notifications
   - Ticket QR codes

3. **Deploy to production**:
   - Backend: Deploy to AWS, DigitalOcean, or Heroku
   - Database: Use managed MySQL (AWS RDS, DigitalOcean Managed DB)
   - Mobile: Build APK/IPA and publish to Play Store/App Store

---

## Support & Resources

- **Node.js Documentation**: https://nodejs.org/docs
- **React Native Documentation**: https://reactnative.dev/docs
- **MySQL Documentation**: https://dev.mysql.com/doc/
- **React Navigation**: https://reactnavigation.org/docs

---

## License

This project is for educational purposes.
