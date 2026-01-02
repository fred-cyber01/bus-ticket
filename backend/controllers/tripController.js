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

    const trips = await Trip.findAllWithFilters(filters, { approvedOnly });
    
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

    const { origin, destination, departureTime, arrivalTime, price, totalSeats, busNumber } = req.body;
    // Validate date formats before calling model to return 4xx for bad input
    if (!departureTime) {
      return res.status(400).json({ success: false, message: 'departureTime is required' });
    }
    const depDate = new Date(departureTime);
    if (isNaN(depDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid departureTime format' });
    }
    if (arrivalTime) {
      const arrDate = new Date(arrivalTime);
      if (isNaN(arrDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid arrivalTime format' });
      }
    }

    let tripId;
    try {
      tripId = await Trip.createFromSpec({
        origin,
        destination,
        departureTime,
        arrivalTime,
        price,
        totalSeats,
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
