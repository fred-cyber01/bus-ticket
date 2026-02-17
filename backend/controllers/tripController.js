// controllers/tripController.js
const Trip = require('../models/Trip');

// @desc    Get available trips
// @route   GET /api/trips/available
// @access  Public
exports.getAvailableTrips = async (req, res, next) => {
  try {
    const { date } = req.query;
    const supabase = require('../config/supabase');
    
    // Build query with joins for complete trip information
    let query = supabase
      .from('trips')
      .select(`
        *,
        route:routes(
          id, name, distance_km,
          origin_stop:stops!routes_origin_stop_id_fkey(id, name, location),
          destination_stop:stops!routes_destination_stop_id_fkey(id, name, location)
        ),
        car:cars(id, plate_number, name, type, capacity, total_seats),
        driver:drivers(id, name, phone),
        company:companies(id, company_name, phone, email)
      `)
      .eq('is_active', true)
      .gt('available_seats', 0)
      .gte('trip_date', new Date().toISOString().split('T')[0])
      .order('trip_date', { ascending: true })
      .order('departure_time', { ascending: true });
    
    // Filter by date if provided
    if (date) {
      query = query.eq('trip_date', date);
    }
    
    const { data: trips, error } = await query;
    
    if (error) {
      console.error('Error fetching available trips:', error);
      throw error;
    }
    
    // Format the response with readable field names
    const formattedTrips = (trips || []).map(trip => {
      const departureTime = trip.departure_time || trip.trip_date;
      const timeOnly = departureTime ? new Date(departureTime).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      }) : 'N/A';
      
      return {
        ...trip,
        // Route information
        route_name: trip.route?.name || `${trip.route?.origin_stop?.name || 'Unknown'} to ${trip.route?.destination_stop?.name || 'Unknown'}`,
        origin: trip.route?.origin_stop?.name || 'Unknown',
        destination: trip.route?.destination_stop?.name || 'Unknown',
        origin_location: trip.route?.origin_stop?.location,
        destination_location: trip.route?.destination_stop?.location,
        distance: trip.route?.distance_km || 0,
        
        // Bus information
        plate_number: trip.car?.plate_number || 'N/A',
        bus_name: trip.car?.name,
        bus_type: trip.car?.type || 'Standard Bus',
        
        // Driver information
        driver_name: trip.driver?.name || 'TBA',
        driver_phone: trip.driver?.phone,
        
        // Company information
        company_name: trip.company?.company_name,
        company_phone: trip.company?.phone,
        company_email: trip.company?.email,
        
        // Time and pricing
        departure_time: timeOnly,
        departure_datetime: trip.departure_time || trip.trip_date,
        price: trip.price || 0,
        fare: trip.price || 0,
        
        // Seat information
        total_seats: trip.total_seats || trip.car?.total_seats || trip.car?.capacity || 30,
        available_seats: trip.available_seats || 0,
        occupied_seats: trip.occupied_seats || 0
      };
    });
    
    res.status(200).json({
      success: true,
      count: formattedTrips.length,
      data: formattedTrips,
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
    const supabase = require('../config/supabase');
    
    const userType = String(req.user?.type || req.user?.role || '').toLowerCase();
    const isCustomer = userType === 'customer' || userType === 'user' || userType === '';
    
    // Build query with comprehensive joins
    let query = supabase
      .from('trips')
      .select(`
        *,
        route:routes(
          id, name, distance_km,
          origin_stop:stops!routes_origin_stop_id_fkey(id, name, location),
          destination_stop:stops!routes_destination_stop_id_fkey(id, name, location)
        ),
        car:cars(id, plate_number, name, type, capacity, total_seats),
        driver:drivers(id, name, phone),
        company:companies(id, company_name, phone, email)
      `)
      .gte('trip_date', new Date().toISOString().split('T')[0])
      .order('trip_date', { ascending: true })
      .order('departure_time', { ascending: true });
    
    // customers only see active trips with available seats
    if (isCustomer) {
      query = query.eq('is_active', true).gt('available_seats', 0);
    }
    
    // Filter by date if provided
    if (date) {
      query = query.eq('trip_date', date);
    }
    
    const { data: trips, error } = await query;
    
    if (error) {
      console.error('Error fetching trips:', error);
      throw error;
    }
    
    // Apply origin/destination filters if provided
    let filteredTrips = trips || [];
    
    if (origin) {
      const originLower = origin.toLowerCase();
      filteredTrips = filteredTrips.filter(t => 
        t.route?.origin_stop?.name?.toLowerCase().includes(originLower)
      );
    }
    
    if (destination) {
      const destLower = destination.toLowerCase();
      filteredTrips = filteredTrips.filter(t => 
        t.route?.destination_stop?.name?.toLowerCase().includes(destLower)
      );
    }
    
    // Format the response
    const formattedTrips = filteredTrips.map(trip => {
      const departureTime = trip.departure_time || trip.trip_date;
      const timeOnly = departureTime ? new Date(departureTime).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      }) : 'N/A';
      
      return {
        ...trip,
        route_name: trip.route?.name || `${trip.route?.origin_stop?.name || 'Unknown'} to ${trip.route?.destination_stop?.name || 'Unknown'}`,
        origin: trip.route?.origin_stop?.name || 'Unknown',
        destination: trip.route?.destination_stop?.name || 'Unknown',
        origin_location: trip.route?.origin_stop?.location,
        destination_location: trip.route?.destination_stop?.location,
        distance: trip.route?.distance_km || 0,
        plate_number: trip.car?.plate_number || 'N/A',
        bus_name: trip.car?.name,
        bus_type: trip.car?.type || 'Standard Bus',
        driver_name: trip.driver?.name || 'TBA',
        driver_phone: trip.driver?.phone,
        company_name: trip.company?.company_name,
        company_phone: trip.company?.phone,
        company_email: trip.company?.email,
        departure_time: timeOnly,
        departure_datetime: trip.departure_time || trip.trip_date,
        price: trip.price || 0,
        fare: trip.price || 0,
        total_seats: trip.total_seats || trip.car?.total_seats || trip.car?.capacity || 30,
        available_seats: trip.available_seats || 0,
        occupied_seats: trip.occupied_seats || 0
      };
    });
    
    res.status(200).json({
      success: true,
      data: formattedTrips,
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
