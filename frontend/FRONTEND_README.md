# Bus Booking System - Frontend

React-based frontend for the Bus Booking System with authentication, trip browsing, and booking management.

## Tech Stack

- **React** 19.2.0 - UI library
- **Vite** - Build tool and dev server
- **React Router** 7.1.4 - Client-side routing
- **Context API** - State management

## Project Structure

```
src/
├── assets/          # Static assets
├── components/      # Reusable components
│   ├── Navbar.jsx
│   └── Navbar.css
├── context/         # React Context providers
│   └── AuthContext.jsx
├── pages/           # Page components
│   ├── Auth.jsx
│   ├── Auth.css
│   ├── Trips.jsx
│   ├── Trips.css
│   ├── Bookings.jsx
│   └── Bookings.css
├── services/        # API services
│   └── api.js
├── App.jsx          # Main app component
├── App.css
├── main.jsx         # Entry point
└── index.css        # Global styles
```

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   
   Create a `.env` file in the frontend directory:
   ```
   VITE_API_BASE_URL=http://localhost:3000/api
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   The app will run at `http://localhost:5173`

## Features

### User Features
- **Authentication**: Sign up and sign in with username/email
- **Browse Trips**: View available trips with filtering by:
  - Origin city
  - Destination city
  - Travel date
- **Book Tickets**: Select trips and book for multiple passengers
- **Manage Bookings**: View and cancel bookings

### Admin Features
- **Create Trips**: Add new trips with route, schedule, and pricing
- **Cancel Trips**: Remove trips from the system
- **View All Bookings**: Monitor all system bookings

## API Integration

The frontend communicates with the backend API via the centralized API service (`services/api.js`).

### Key Endpoints Used:
- `POST /auth/signup` - User registration
- `POST /auth/signin` - User login
- `GET /trips` - List trips (with optional filters)
- `POST /trips` - Create trip (admin)
- `DELETE /trips/:id` - Cancel trip (admin)
- `POST /bookings` - Create booking
- `GET /bookings` - Get user bookings
- `DELETE /bookings/:id` - Cancel booking

## Authentication

Authentication is managed via JWT tokens stored in localStorage. The `AuthContext` provides:
- `user` - Current user object
- `token` - JWT token
- `signin(credentials)` - Login function
- `signup(userData)` - Registration function
- `signout()` - Logout function
- `isAdmin()` - Check admin status

## Usage

### For Regular Users:
1. Sign up or sign in
2. Navigate to "Trips" page
3. Filter trips by origin, destination, or date
4. Click "Book" on a trip
5. Enter passenger details
6. View bookings in "My Bookings" page
7. Cancel bookings if needed

### For Admins:
1. Sign in with admin account
2. Create new trips from the Trips page
3. Cancel trips as needed
4. View all system bookings

## Build for Production

```bash
npm run build
```

Outputs to `dist/` directory.

## Preview Production Build

```bash
npm run preview
```

## Development

- Hot Module Replacement (HMR) enabled
- ESLint configured for code quality
- Component-based architecture
- CSS modules for styling

## Troubleshooting

**Issue**: API calls fail with CORS error
- **Solution**: Ensure backend CORS is configured to allow `http://localhost:5173`

**Issue**: 401 Unauthorized errors
- **Solution**: Check that JWT token is valid and not expired. Try logging out and back in.

**Issue**: Routes not working after page refresh
- **Solution**: This is a SPA. Ensure your production server is configured to serve `index.html` for all routes.
