# 🚀 Quick Start Guide - Updated API Endpoints

## Authentication

### Sign Up (New User Registration)
```http
POST /api/auth/signup
Content-Type: application/json

{
  "username": "ben_kalisa",
  "email": "benkalisa@gmail.com",
  "password": "securePass123",
  "role": "user"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": "usr_123456789",
    "username": "ben_kalisa",
    "email": "benkalisa@gmail.com",
    "role": "user"
  }
}
```

---

### Sign In (Login)
```http
POST /api/auth/signin
Content-Type: application/json

{
  "email": "benkalisa@gmail.com",
  "password": "securePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": "usr_123456789",
      "username": "ben_kalisa",
      "email": "benkalisa@gmail.com",
      "role": "user"
    }
  }
}
```

---

## Trips

### Get All Trips (with filtering)
```http
GET /api/trips?origin=Kigali&destination=Butare&date=2025-07-15
Authorization: Bearer <your-token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "tripId": "trip_987654321",
      "origin": "Kigali",
      "destination": "Butare",
      "departureTime": "2025-07-15T08:00:00Z",
      "arrivalTime": "2025-07-15T10:30:00Z",
      "price": 3500,
      "totalSeats": 45,
      "availableSeats": 42,
      "busNumber": "RAC001B"
    }
  ]
}
```

---

### Get Specific Trip
```http
GET /api/trips/trip_987654321
Authorization: Bearer <your-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tripId": "trip_987654321",
    "origin": "Kigali",
    "destination": "Butare",
    "departureTime": "2025-07-15T08:00:00Z",
    "arrivalTime": "2025-07-15T10:30:00Z",
    "price": 3500,
    "totalSeats": 45,
    "availableSeats": 42,
    "busNumber": "RAC001B",
    "bookedSeats": ["1", "2", "5"]
  }
}
```

---

### Create Trip (Admin Only)
```http
POST /api/trips
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "origin": "Kigali",
  "destination": "Butare",
  "departureTime": "2025-07-15T08:00:00Z",
  "arrivalTime": "2025-07-15T10:30:00Z",
  "price": 3500,
  "totalSeats": 45,
  "busNumber": "RAC001B"
}
```

---

### Cancel Trip (Admin Only)
```http
DELETE /api/trips/trip_987654321
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Trip cancelled successfully"
}
```

---

## Bookings

### Create Booking
```http
POST /api/bookings
Authorization: Bearer <user-token>
Content-Type: application/json

{
  "tripId": "trip_987654321",
  "seatNumbers": ["10", "11"],
  "passengerDetails": [
    {
      "name": "Jean Kalisa",
      "age": 28,
      "gender": "male",
      "seatNumber": 10
    },
    {
      "name": "Marie Uwimana",
      "age": 25,
      "gender": "female",
      "seatNumber": 11
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "bookingId": "booking_456789123",
    "tripId": "trip_987654321",
    "userId": "usr_123456789",
    "seatNumbers": ["10", "11"],
    "totalPrice": 7000,
    "bookingStatus": "confirmed",
    "bookingDate": "2025-07-09T14:30:00Z",
    "passengerDetails": [
      {
        "name": "Jean Kalisa",
        "age": 28,
        "gender": "male",
        "seatNumber": 10
      },
      {
        "name": "Marie Uwimana",
        "age": 25,
        "gender": "female",
        "seatNumber": 11
      }
    ]
  }
}
```

---

### Get All Bookings
```http
GET /api/bookings
Authorization: Bearer <your-token>
```

**Admin Response (sees all bookings):**
```json
{
  "success": true,
  "data": [
    {
      "bookingId": "booking_456789123",
      "tripId": "trip_987654321",
      "userId": "usr_123456789",
      "seatNumbers": ["10", "11"],
      "totalPrice": 7000,
      "bookingStatus": "confirmed",
      "bookingDate": "2025-07-09T14:30:00Z",
      "tripDetails": {
        "origin": "Kigali",
        "destination": "Butare",
        "departureTime": "2025-07-15T08:00:00Z",
        "busNumber": "RAC001B"
      },
      "passengerDetails": [...]
    }
  ]
}
```

**User Response (sees only their bookings)**

---

### Get Specific Booking
```http
GET /api/bookings/booking_456789123
Authorization: Bearer <your-token>
```

---

### Cancel Booking
```http
DELETE /api/bookings/booking_456789123
Authorization: Bearer <your-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Booking cancelled successfully"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid input data"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "User cannot cancel this booking"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Trip not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "Seat 10 already booked"
}
```

---

## Key Changes from Previous Version

❌ **OLD** → ✅ **NEW**

### Endpoints
- ❌ `POST /api/auth/register` → ✅ `POST /api/auth/signup`
- ❌ `POST /api/auth/login` → ✅ `POST /api/auth/signin`
- ❌ `POST /api/tickets` → ✅ `POST /api/bookings`
- ❌ `GET /api/tickets` → ✅ `GET /api/bookings`
- ❌ `DELETE /api/tickets/:id` → ✅ `DELETE /api/bookings/:id`

### Request Fields
- ❌ `user_name` → ✅ `username`
- ❌ `seat_number` → ✅ `seatNumbers` (array)
- ❌ `schedule_id, trip_date` → ✅ `tripId`

### Response Fields
- ❌ `id` → ✅ `userId`, `tripId`, `bookingId`
- ❌ `user_name` → ✅ `username`
- All IDs now prefixed: `usr_`, `trip_`, `booking_`

---

## Testing with curl

### Signup
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Get Trips
```bash
curl -X GET "http://localhost:5000/api/trips?origin=Kigali" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Booking
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "tripId": "trip_1",
    "seatNumbers": ["10"],
    "passengerDetails": [{
      "name": "John Doe",
      "age": 30,
      "gender": "male",
      "seatNumber": 10
    }]
  }'
```

---

**Note:** Replace `YOUR_TOKEN` with the actual JWT token received from signin.
