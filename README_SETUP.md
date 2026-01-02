# Rwanda Bus Ticketing System - Setup Guide

## 🚀 Status: IN DEVELOPMENT

This system is currently under active development. Some features are implemented, and others are being built.

---

## ✅ Completed Features

### Backend
- ✅ MySQL database integration with XAMPP
- ✅ Payment services (MTN MoMo, Airtel Money, MoMoPay, Bank Transfer)
- ✅ Subscription management system (Free Trial, Standard, Premium)
- ✅ Company manager authentication
- ✅ System earnings tracking (10 RWF per ticket)
- ✅ Webhook handlers for payment callbacks
- ✅ JWT authentication with proper middleware

### Frontend
- ✅ Modern dashboard UI design (purple gradient theme)
- ✅ Customer dashboard with stats cards
- ✅ Profile sidebar with booking history
- ✅ Customer list table with actions
- ✅ Responsive design

---

## 🔧 In Development

- ⏳ Payment integration UI
- ⏳ Company management interface
- ⏳ Admin approval workflow UI
- ⏳ QR code conductor scanning
- ⏳ Complete API routes integration
- ⏳ Backend authentication fixes (401 errors)

---

## 📦 Prerequisites

1. **XAMPP** - For MySQL database
   - Download: https://www.apachefriends.org/download.html
   - Install and start MySQL service

2. **Node.js** (v18+)
   - Download: https://nodejs.org/

3. **npm** or **yarn**

---

## 🗄️ Database Setup (MySQL - XAMPP)

### Step 1: Start XAMPP
1. Open XAMPP Control Panel
2. Start **Apache** and **MySQL** modules
3. Click "Admin" button next to MySQL (opens phpMyAdmin)

### Step 2: Create Database
1. In phpMyAdmin, click "SQL" tab
2. Copy and paste the contents of `database/mysql_setup.sql`
3. Click "Go" to execute
4. You should see: **"Database setup completed successfully!"**

### Step 3: Verify Database
Check that these tables were created:
- admins
- users
- companies
- company_managers
- subscription_plans
- payments
- system_earnings
- cars
- drivers
- routes
- stops
- tickets
- (and more...)

---

## ⚙️ Backend Setup

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Configure Environment
The `.env` file is already configured for XAMPP MySQL:

```env
# MySQL Database Configuration (XAMPP)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=ticketbooking

# JWT Secret
JWT_SECRET=83c1c7e4d9b17d3f607a829f4bf918a946c7d4c8590f3ed21baf0d86f732abf1
```

**Note:** If you set a MySQL password in XAMPP, update `DB_PASSWORD` in `.env`

### Step 3: Start Backend Server
```bash
npm run dev
```

Expected output:
```
✓ MySQL database connected successfully
Server running on port 3000
```

---

## 🎨 Frontend Setup

### Step 1: Install Dependencies
```bash
cd frontend
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```

The frontend will run on: http://localhost:5173

---

## 🔐 Default Login Credentials

### Admin Account
- **Email:** admin@ticketbus.rw
- **Password:** admin123

### Test Company Manager
- **Email:** manager@eliteexpress.rw
- **Password:** manager123

### Test Customer
- **Email:** customer@example.com
- **Password:** customer123

---

## 🚌 Subscription Plans

| Plan | Price | Duration | Bus Limit | Features |
|------|-------|----------|-----------|----------|
| Free Trial | RWF 0 | 30 days | 3 buses | Email support |
| Standard | RWF 50,000 | 30 days | 10 buses | Email + Phone support, Analytics |
| Premium | RWF 100,000 | 30 days | 20 buses | 24/7 support, Priority listing, Custom branding |

---

## 💰 Payment Methods

1. **MTN Mobile Money** (Rwanda)
2. **Airtel Money** (Rwanda)
3. **MoMoPay** (USSD Code)
4. **Bank Transfer** (Bank of Kigali)

### System Fee
- **10 RWF** deducted automatically from each ticket transaction
- Stored in `system_earnings` table
- Admin can withdraw earnings to MTN MoMo or Bank

---

## 📱 API Endpoints (Implemented)

### Authentication
- POST `/api/auth/signin` - User/Admin/Manager login
- POST `/api/auth/signup` - Customer registration
- POST `/api/auth/refresh` - Refresh JWT token

### Users
- GET `/api/users/profile` - Get user profile
- GET `/api/users` - Get all users (admin only)

### Tickets
- GET `/api/tickets/my-tickets` - Get user's tickets
- POST `/api/tickets/book` - Book a ticket

### Companies (In Development)
- GET `/api/company/profile` - Get company profile
- GET `/api/company/stats` - Get company statistics
- POST `/api/company/buses` - Add bus
- GET `/api/company/buses` - List buses

### Payments (In Development)
- POST `/api/payments/initiate` - Initiate payment
- GET `/api/payments/status/:ref` - Check payment status
- POST `/api/webhooks/mtn` - MTN MoMo webhook
- POST `/api/webhooks/airtel` - Airtel Money webhook

---

## 🐛 Known Issues

### 401 Unauthorized Errors
**Status:** Being fixed

**Cause:** Authentication middleware needs updates

**Temporary Workaround:**
- Ensure you're sending JWT token in Authorization header
- Format: `Authorization: Bearer <your-token>`

### Missing API Routes
**Status:** Being implemented

Some routes are defined but not yet integrated in `server.js`. Current work is focusing on:
- Payment endpoints integration
- Subscription management routes
- Admin approval workflow
- Company management endpoints

---

## 📂 Project Structure

```
ticketbooking-system-master/
├── backend/
│   ├── config/
│   │   ├── database.js         # MySQL connection
│   │   └── config.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── paymentController.js
│   │   ├── webhookController.js
│   │   └── ...
│   ├── models/
│   │   ├── User.js
│   │   ├── Company.js
│   │   ├── CompanyManager.js
│   │   └── ...
│   ├── routes/
│   │   ├── auth.js
│   │   ├── payments.js
│   │   ├── subscriptions.js
│   │   └── ...
│   ├── services/
│   │   ├── paymentService.js
│   │   └── subscriptionService.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── ModernCustomerDashboard.jsx  # New modern UI
│   │   │   ├── CustomerDashboard.jsx
│   │   │   ├── CompanyDashboard.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── styles/
│   │   │   └── ModernDashboard.css          # Modern purple theme
│   │   └── App.jsx
│   └── package.json
└── database/
    └── mysql_setup.sql                       # MySQL database schema
```

---

## 🎯 Next Development Steps

1. ✅ ~~Fix MySQL database connection~~
2. ✅ ~~Create modern dashboard UI~~
3. ⏳ Fix 401 authentication errors
4. ⏳ Integrate payment API routes
5. ⏳ Build company approval workflow UI
6. ⏳ Create payment method selection UI
7. ⏳ Implement QR code scanning for conductors
8. ⏳ Add real-time notifications
9. ⏳ Implement email notifications
10. ⏳ Create mobile app (React Native)

---

## 🆘 Troubleshooting

### MySQL Connection Failed
```bash
Error: connect ECONNREFUSED 127.0.0.1:3306
```
**Solution:**
1. Open XAMPP Control Panel
2. Start MySQL service
3. Verify port 3306 is not blocked

### Database Not Found
```bash
Error: Unknown database 'ticketbooking'
```
**Solution:**
1. Open phpMyAdmin
2. Run `database/mysql_setup.sql` script
3. Refresh database list

### 401 Unauthorized
**Status:** Being fixed in current development
**Temporary:** Check JWT token format and expiry

---

## 📞 Support

For development questions or issues:
- Check the TODO list in code comments
- Review recent commits for ongoing changes
- Test features marked as "IN DEVELOPMENT"

---

## 📄 License

MIT License - See LICENSE file for details

---

**Last Updated:** December 11, 2025

**Development Status:** Active Development 🚧

**Version:** 2.0.0-beta
