// backend/scripts/verifyManagerCRUD.js
require('dotenv').config({ path: './.env' });
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const Route = require('../models/Route');
const Trip = require('../models/Trip');
const Ticket = require('../models/Ticket');

(async () => {
  try {
    console.log('Verifying manager CRUD operations...');

    // Find a manager (Yahoo)
    const managerEmail = 'yahoo.car.express.ltd@example.com';
    const manager = await db.queryOne('SELECT * FROM company_managers WHERE email = ?', [managerEmail]);
    if (!manager) throw new Error('Manager not found');
    const passwordOk = await bcrypt.compare('Manager123!', manager.password);
    console.log('Manager password valid:', passwordOk);

    // Create a route for that company
    const routeId = await Route.create({ company_id: manager.company_id, name: 'Verify Script Route', origin_stop_id: 1, destination_stop_id: 2, description: 'Created by verify script' });
    console.log('Route created id:', routeId);

    // Create a trip for that route
    // find a car for that company
    const car = await db.queryOne('SELECT * FROM cars WHERE company_id = ? LIMIT 1', [manager.company_id]);
    const driver = await db.queryOne('SELECT * FROM drivers WHERE company_id = ? LIMIT 1', [manager.company_id]);
    const departure = new Date(Date.now() + 24*60*60*1000).toISOString();
    const tripId = await Trip.create({ route_id: routeId, car_id: car ? car.id : null, car_name: car ? car.name : 'Test Car', driver_id: driver ? driver.id : null, origin_id: 1, destination_id: 2, departure_time: departure, status: 'scheduled' });
    console.log('Trip created id:', tripId);

    // Create a ticket for demo user
    const user = await db.queryOne('SELECT * FROM users WHERE email = ?', ['demo@example.com']);
    const ticketId = await Ticket.create({ user_id: user.id, trip_id: tripId, boarding_stop_id: 1, dropoff_stop_id: 2, seat_number: '99', price: 1000, passenger_name: 'Verify User', passenger_phone: user.phone, departure_time: departure, booking_date: new Date().toISOString().split('T')[0], payment_method: 'card' });
    console.log('Ticket created id:', ticketId);

    // Read back route/trip/ticket
    const route = await Route.findById(routeId);
    const trip = await Trip.findById(tripId);
    const ticket = await Ticket.findById(ticketId);

    console.log('Route name:', route.name);
    console.log('Trip departure_time:', trip.departure_time || trip.departure_time);
    console.log('Ticket passenger:', ticket.passenger_name, 'status:', ticket.ticket_status);

    console.log('\nCRUD verify completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Verify error:', err.message || err);
    process.exit(1);
  }
})();
