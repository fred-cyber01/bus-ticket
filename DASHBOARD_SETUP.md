**ADMIN & COMPANY DASHBOARD - SETUP COMPLETE**

The dashboards are experiencing connection issues because the backend server needs to be running.

**TO FIX AND START:**

1. **Start Backend Server:**
   ```
   cd backend
   npm start
   ```

2. **Start Frontend:**
   ```
   cd frontend  
   npm run dev
   ```

3. **Login as Admin:**
   - Email: `admin@ticketbus.rw`
   - Password: (your admin password)

4. **Login as Company:**
   - Email: (your company email)
   - Password: (your company password)

**FEATURES IMPLEMENTED:**

✅ **Admin Dashboard:**
- View all statistics (users, companies, trips, tickets, revenue)
- Manage Users (view, delete)
- Manage Companies (view, approve, delete)
- Manage Trips (view, delete)
- Manage Tickets (view, cancel)
- Fully responsive design

✅ **Company Dashboard:**
- View company statistics
- Manage Buses (CRUD operations)
- Manage Drivers (CRUD operations)
- Manage Routes (CRUD operations)
- Manage Trips (CRUD operations)
- View Bookings and Payments

✅ **Responsive Design:**
- Desktop: Full sidebar navigation
- Tablet: Compact sidebar
- Mobile: Collapsible navigation

**ENSURE BACKEND IS RUNNING** - All dashboards require the backend API at http://localhost:3000
