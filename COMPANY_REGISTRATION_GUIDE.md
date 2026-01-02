# Company Registration with Subscription Plans - Implementation Guide

## Overview
The system now supports company registration with subscription plan selection and integrated payment processing. Admins CANNOT register through normal signup - only users (customers) can. Companies must use the dedicated company registration flow.

## Features Implemented

### 1. **User Registration** (No Admin Option)
- **Endpoint**: `POST /api/auth/signup`
- **Access**: Public (anyone can register as a customer)
- **Features**: 
  - Simple email/password signup
  - Only "Customer" role available (admin option removed from UI)
  - No subscription requirements
  - Instant activation
- **UI**: [Auth.jsx](frontend/src/pages/Auth.jsx) - Updated to remove admin role option

### 2. **Company Registration with Subscription Plans**
- **Endpoint**: `POST /api/company-auth/register`
- **Access**: Public (companies can self-register)
- **File**: [backend/routes/companyAuth.js](backend/routes/companyAuth.js)

#### Registration Flow:
```
Step 1: Plan Selection
├── Free Trial (0 RWF, 30 days, 3 buses)
├── Standard (50,000 RWF/month, 10 buses)
└── Premium (100,000 RWF/month, 20 buses)

Step 2: Company & Manager Information
├── Company Name
├── TIN (9 digits)
├── Contact Info
├── Manager Name, Email, Phone
└── Password

Step 3: Payment (only for paid plans)
├── MTN Mobile Money
├── Airtel Money
├── MoMoPay (USSD codes)
└── Bank Transfer
```

#### Backend Logic:
- **Free Trial**: 
  - Company registered immediately
  - Subscription activated for 30 days
  - Status: `pending` (awaits admin approval)
  - Bus limit: 3 buses
  
- **Paid Plans (Standard/Premium)**:
  - Company registered
  - Payment initiated via selected method
  - Subscription status: `expired` (until payment confirmed)
  - Status: `pending` (awaits admin approval)
  - Webhook confirms payment → activates subscription

### 3. **Company Login**
- **Endpoint**: `POST /api/company-auth/login`
- **Access**: Company managers only
- **Returns**: JWT token + company + subscription details

### 4. **Frontend Components**

#### CompanyRegister.jsx
- **Location**: [frontend/src/pages/CompanyRegister.jsx](frontend/src/pages/CompanyRegister.jsx)
- **Features**:
  - 3-step registration wizard
  - Plan comparison cards
  - Form validation
  - Payment method selection
  - Mobile money integration
  - Responsive design

#### CompanyRegister.css
- **Location**: [frontend/src/pages/CompanyRegister.css](frontend/src/pages/CompanyRegister.css)
- **Styling**: Modern purple gradient theme matching dashboard

### 5. **Database Tables Used**

```sql
-- Company storage
companies (id, company_name, tin, status, current_plan_id, bus_limit)

-- Manager accounts
company_managers (id, company_id, name, email, password, role)

-- Subscription tracking
company_subscriptions (id, company_id, plan_id, payment_id, start_date, end_date, status)

-- Available plans
subscription_plans (id, name, price, duration_days, bus_limit, features)

-- Payment records
payments (id, company_id, amount, payment_method, transaction_ref, status)
```

## API Endpoints

### Company Registration & Authentication
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/company-auth/register` | Register new company with subscription | Public |
| POST | `/api/company-auth/login` | Company manager login | Public |

### Subscription Plans
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/subscriptions/plans` | Get all subscription plans | Public |
| GET | `/api/subscriptions/plans/:id` | Get specific plan details | Public |

### User Authentication
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/signup` | Register as customer (no admin) | Public |
| POST | `/api/auth/signin` | Customer login | Public |
| POST | `/api/auth/admin/signin` | Admin login (separate) | Public |

## Request/Response Examples

### Company Registration (Free Trial)
```json
POST /api/company-auth/register
{
  "company_name": "Rwanda Express Transport",
  "tin": "123456789",
  "contact_info": "KN 5 Ave, Kigali",
  "manager_name": "John Doe",
  "manager_email": "john@rwandaexpress.rw",
  "manager_phone": "+250788123456",
  "password": "secure123",
  "plan_id": 1
}

Response:
{
  "success": true,
  "message": "Company registered successfully with 30-day free trial! Your account is pending admin approval.",
  "data": {
    "company_id": 5,
    "manager_id": 3,
    "subscription_id": 7,
    "plan": {
      "name": "Free Trial",
      "price": 0,
      "bus_limit": 3,
      "duration_days": 30
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "manager": {
      "name": "John Doe",
      "email": "john@rwandaexpress.rw",
      "phone": "+250788123456"
    }
  }
}
```

### Company Registration (Paid Plan)
```json
POST /api/company-auth/register
{
  "company_name": "Premium Bus Services",
  "tin": "987654321",
  "contact_info": "KG 15 St, Kigali",
  "manager_name": "Jane Smith",
  "manager_email": "jane@premiumbus.rw",
  "manager_phone": "+250788654321",
  "password": "secure456",
  "plan_id": 2,
  "payment_method": "mtn_momo",
  "phone_number": "+250788654321"
}

Response:
{
  "success": true,
  "message": "Company registered successfully! Please complete payment to activate your Standard subscription. Your account is pending admin approval.",
  "data": {
    "company_id": 6,
    "manager_id": 4,
    "subscription_id": 8,
    "payment_id": 15,
    "plan": {
      "name": "Standard",
      "price": 50000,
      "bus_limit": 10,
      "duration_days": 30
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "manager": {
      "name": "Jane Smith",
      "email": "jane@premiumbus.rw",
      "phone": "+250788654321"
    }
  }
}
```

## Navigation Flow

### User Journey
1. **Home Page** → "Get Started" button → Customer signup
2. **Home Page** → "Register Your Bus Company" button → Company registration
3. **Customer Signup** → Link to company registration in role selector

### Company Registration Steps
1. Select subscription plan (Free Trial / Standard / Premium)
2. Enter company and manager details
3. Choose payment method (if paid plan)
4. Complete registration
5. Receive JWT token
6. Redirect to company dashboard (pending approval)

## Security Features

1. **No Admin Self-Registration**: Admins must be created by existing admins
2. **Company Approval**: All companies start with `pending` status
3. **TIN Validation**: Unique 9-digit TIN required
4. **Email Uniqueness**: Manager email must be unique
5. **Password Hashing**: bcrypt with 10 salt rounds
6. **JWT Authentication**: Tokens expire in 7 days
7. **Status Checks**: Inactive/blocked accounts cannot login

## Business Rules

1. **Free Trial**:
   - 30 days duration
   - Maximum 3 buses
   - No payment required
   - Auto-activated on registration

2. **Standard Plan**:
   - 50,000 RWF per month
   - Maximum 10 buses
   - Requires payment to activate

3. **Premium Plan**:
   - 100,000 RWF per month
   - Maximum 20 buses
   - Requires payment to activate
   - Priority support and features

4. **Admin Approval**:
   - All companies require admin approval regardless of plan
   - Companies can login and setup but cannot operate until approved

5. **Bus Limit Enforcement**:
   - System checks `bus_limit` before allowing new bus addition
   - Enforced in company subscription service

## Files Modified/Created

### Backend
- ✅ `backend/routes/companyAuth.js` (NEW)
- ✅ `backend/server.js` (UPDATED - added company-auth route)
- ✅ `backend/services/subscriptionService.js` (EXISTS)
- ✅ `backend/services/paymentService.js` (EXISTS)
- ✅ `database/mysql_setup.sql` (UPDATED - added all tables)

### Frontend
- ✅ `frontend/src/pages/CompanyRegister.jsx` (NEW)
- ✅ `frontend/src/pages/CompanyRegister.css` (NEW)
- ✅ `frontend/src/App.jsx` (UPDATED - added company-register route)
- ✅ `frontend/src/pages/Auth.jsx` (UPDATED - removed admin option)
- ✅ `frontend/src/pages/Home.jsx` (UPDATED - added company registration button)

## Next Steps

### 1. Run SQL Setup (REQUIRED)
```bash
# Open phpMyAdmin → ticketbooking database → SQL tab
# Copy and paste content from database/mysql_setup.sql
# Click "Go" to execute
```

### 2. Restart Backend Server
```bash
cd backend
npm start
```

### 3. Test Company Registration
1. Open frontend (http://localhost:5173)
2. Click "Register Your Bus Company"
3. Select Free Trial plan
4. Fill in company details
5. Complete registration
6. Verify in database

### 4. Admin Panel Features (TODO)
- [ ] Company approval interface
- [ ] View pending companies
- [ ] Approve/reject companies with reasons
- [ ] View company subscription status
- [ ] Manually activate/deactivate subscriptions

## Testing Checklist

- [ ] Customer signup works (no admin option visible)
- [ ] Company registration with Free Trial
- [ ] Company registration with Standard plan + MTN payment
- [ ] Company registration with Premium plan + Airtel payment
- [ ] Company login after registration
- [ ] Duplicate TIN validation
- [ ] Duplicate email validation
- [ ] Password mismatch validation
- [ ] SQL tables created successfully
- [ ] Subscription plans seeded (3 plans)

## Support

For issues or questions:
1. Check database tables exist (`SHOW TABLES`)
2. Verify subscription_plans has 3 rows
3. Check backend console for errors
4. Verify JWT_SECRET in .env file
5. Ensure XAMPP MySQL is running

---

**Status**: ✅ Ready for Testing
**Date**: December 12, 2025
