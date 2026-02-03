// controllers/tripController.js
const Trip = require('../models/Trip');

// @desc    Get available trips
// @route   GET /api/trips/available
// @access  Public
exports.getAvailableTrips = async (req, res, next) => {
  try {
    const { date } = req.query;
    const trips = await Trip.getAvailableTrips(date);
    
    res.status(200).json({
      success: true,
      count: trips.length,
      data: trips,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all trips
// @route   GET /api/trips
// @access  Private (All authenticated users)
exports.getTrips = async (req, res, next) => {
  try {
    const { origin, destination, date } = req.query;
    
    const filters = {};
    if (origin) filters.origin = origin;
    if (destination) filters.destination = destination;
    if (date) filters.date = date;
    
    const userType = String(req.user?.type || req.user?.role || '').toLowerCase();
    const approvedOnly = userType === 'customer' || userType === '';

    let trips;
    if (typeof Trip.findAllWithFilters === 'function') {
      trips = await Trip.findAllWithFilters(filters, { approvedOnly });
    } else if (typeof Trip.findAll === 'function') {
      console.warn('Trip.findAllWithFilters missing, falling back to Trip.findAll');
      trips = await Trip.findAll(filters);
      if (approvedOnly) {
        trips = trips.filter(t => t.status === 'approved' || t.is_active === 1 || t.is_active === true);
      }
    } else {
      console.error('Trip model missing required finder methods');
      return res.status(500).json({ success: false, message: 'Server misconfiguration: trip search not available' });
    }
    
    res.status(200).json({
      success: true,
      data: trips,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single trip
// @route   GET /api/trips/:id
// @access  Private
exports.getTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findByIdWithDetails(req.params.id);
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: trip,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create trip
// @route   POST /api/trips
// @access  Private/Admin
exports.createTrip = async (req, res, next) => {
  try {
    // TEMP LOG: capture incoming payload for debugging (remove after verification)
    console.log('createTrip req.body:', JSON.stringify(req.body));
    // If client supplied route_id / trip_date / departure_time (admin-style), handle directly
    const { route_id, car_id, driver_id, trip_date, departure_time, arrival_time, price, total_seats, totalSeats } = req.body;
    if (route_id || trip_date) {
      // admin-style creation using existing route/car
      const { query } = require('../config/database');

      // Validate trip_date
      let tripDate = trip_date || req.body.tripDate || null;
      if (!tripDate) {
        return res.status(400).json({ success: false, message: 'trip_date is required for this request' });
      }
      // Normalize date to YYYY-MM-DD
      tripDate = String(tripDate).trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(tripDate)) {
        const parsed = new Date(tripDate);
        if (isNaN(parsed.getTime())) {
          return res.status(400).json({ success: false, message: 'Invalid trip_date format' });
        }
        tripDate = parsed.toISOString().split('T')[0];
      }

      // Normalize departure_time (allow HH:MM)
      let depTime = departure_time || req.body.departureTime || null;
      if (!depTime) {
        return res.status(400).json({ success: false, message: 'departure_time is required for this request' });
      }
      depTime = String(depTime).trim();
      if (/^\d{1,2}:\d{2}$/.test(depTime)) depTime = depTime + ':00';
      if (!/^\d{2}:\d{2}:\d{2}$/.test(depTime)) {
        return res.status(400).json({ success: false, message: 'Invalid departure_time format' });
      }

      // Normalize arrival_time if present
      let arrTime = arrival_time || req.body.arrivalTime || null;
      if (arrTime) {
        arrTime = String(arrTime).trim();
        if (/^\d{1,2}:\d{2}$/.test(arrTime)) arrTime = arrTime + ':00';
        if (!/^\d{2}:\d{2}:\d{2}$/.test(arrTime)) {
          return res.status(400).json({ success: false, message: 'Invalid arrival_time format' });
        }
      }

      // Resolve origin/destination from route if needed
      const routeRes = await query('SELECT origin_stop_id, destination_stop_id FROM routes WHERE id = ? LIMIT 1', [route_id]);
      if (!routeRes || routeRes.length === 0) {
        return res.status(404).json({ success: false, message: 'Route not found' });
      }

      // Determine total seats (prefer provided, otherwise car capacity)
      let seats = total_seats || totalSeats || req.body.totalSeats;
      if (!seats) {
        const carRes = await query('SELECT capacity FROM cars WHERE id = ? LIMIT 1', [car_id]);
        seats = carRes && carRes[0] ? carRes[0].capacity || 40 : 40;
      }

      const insertSql = `
        INSERT INTO trips (
          route_id, car_id, driver_id, trip_date, departure_time, arrival_time,
          origin_id, destination_id, available_seats, total_seats, price, status, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', 1)
      `;

      const result = await query(insertSql, [
        route_id,
        car_id || null,
        driver_id || null,
        tripDate,
        depTime,
        arrTime || null,
        routeRes[0].origin_stop_id,
        routeRes[0].destination_stop_id,
        seats,
        seats,
        Number(price) || 0
      ]);

      const tripId = result.insertId;
      const trip = await Trip.findByIdWithDetails(tripId);
      return res.status(201).json({ success: true, message: 'Trip created successfully', data: trip });
    }

    // Else fall back to createFromSpec flow using origin/destination names
    // Accept either camelCase or snake_case keys for compatibility with various clients
    // Note: `departure_time` and `arrival_time` may have been destructured above for admin-style requests,
    // so avoid redeclaring them here to prevent SyntaxError during startup.
    let { origin, destination, departureTime, arrivalTime, price: p2, totalSeats: t2, busNumber } = req.body;
    // prefer camelCase if present
    departureTime = departureTime || departure_time || null;
    arrivalTime = arrivalTime || arrival_time || null;

    // Normalize common browser-provided datetime-local values (e.g. "2026-01-04T12:30") and tolerate missing seconds
    const normalizeDateInput = (val) => {
      if (!val) return null;
      // If it's already an ISO-like string with T, try parsing directly
      let s = String(val).trim();
      // If space separator used (e.g. "2026-01-04 12:30"), replace with 'T'
      if (/\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(s)) s = s.replace(/\s+/, 'T');
      // If missing seconds, append :00 for safe parsing
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) s = s + ':00';
      // Return Date instance (or null if invalid)
      const d = new Date(s);
      return isNaN(d.getTime()) ? null : d;
    };

    const depDate = normalizeDateInput(departureTime);
    if (!depDate) {
      return res.status(400).json({ success: false, message: 'departureTime is required and must be a valid datetime' });
    }

    if (arrivalTime) {
      const arrDate = normalizeDateInput(arrivalTime);
      if (!arrDate) {
        return res.status(400).json({ success: false, message: 'arrivalTime format is invalid' });
      }
      // set arrivalTime to normalized ISO if provided
      arrivalTime = arrDate.toISOString();
    }
    // set departureTime to normalized ISO for storage
    departureTime = depDate.toISOString();

    let tripId;
    try {
      tripId = await Trip.createFromSpec({
        origin,
        destination,
        departureTime,
        arrivalTime,
        price: p2,
        totalSeats: t2,
        busNumber
      });
    } catch (e) {
      // If model raised validation errors, return 400
      if (String(e.message || '').toLowerCase().includes('invalid')) {
        return res.status(400).json({ success: false, message: e.message });
      }
      throw e;
    }
    
    const trip = await Trip.findByIdWithDetails(tripId);
    
    res.status(201).json({
      success: true,
      message: 'Trip created successfully',
      data: trip,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update trip
// @route   PUT /api/trips/:id
// @access  Private/Admin/Driver
exports.updateTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }
    
    await Trip.update(req.params.id, req.body);
    const updatedTrip = await Trip.findById(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Trip updated successfully',
      data: updatedTrip,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete trip (Cancel)
// @route   DELETE /api/trips/:id
// @access  Private/Admin
exports.deleteTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }
    
    await Trip.updateStatus(req.params.id, 'cancelled');
    
    res.status(200).json({
      success: true,
      message: 'Trip cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update trip status
// @route   PUT /api/trips/:id/status
// @access  Private/Admin/Driver
exports.updateTripStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!['scheduled', 'in-progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
      });
    }
    
    await Trip.updateStatus(req.params.id, status);
    const trip = await Trip.findById(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Trip status updated successfully',
      data: trip,
    });
  } catch (error) {
    next(error);
  }
};
