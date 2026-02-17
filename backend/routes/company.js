// routes/company.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Company = require('../models/Company');
const Car = require('../models/Car');
const Driver = require('../models/Driver');
const Route = require('../models/Route');
const Trip = require('../models/Trip');
const Ticket = require('../models/Ticket');
const supabase = require('../config/supabase');

// Get company profile (authenticated company gets their own profile)
router.get('/profile', authenticate, async (req, res, next) => {
  try {
    const companyId = req.user.company_id || req.user.id;
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    res.json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
});

// Get company buses (authenticated company's own buses)
router.get('/buses', authenticate, async (req, res, next) => {
  try {
    const companyId = req.user.company_id || req.user.id;
    const buses = await Car.findByCompany(companyId);
    res.json({ success: true, data: buses });
  } catch (error) {
    next(error);
  }
});

// Get single bus by ID
router.get('/buses/:id', authenticate, async (req, res, next) => {
  try {
    const bus = await Car.findById(req.params.id);
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }
    const companyId = req.user.company_id || req.user.id;
    if (String(bus.company_id) !== String(companyId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    res.json({ success: true, data: bus });
  } catch (error) {
    next(error);
  }
});

// Create bus for company
router.post('/buses', authenticate, async (req, res, next) => {
  try {
    const companyId = req.user.company_id || req.user.id;
    const busData = {
      ...req.body,
      company_id: companyId
    };
    const busId = await Car.create(busData);
    const bus = await Car.findById(busId);
    res.status(201).json({ success: true, message: 'Bus created successfully', data: bus });
  } catch (error) {
    next(error);
  }
});

// Update bus
router.put('/buses/:id', authenticate, async (req, res, next) => {
  try {
    const bus = await Car.findById(req.params.id);
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }
    const companyId = req.user.company_id || req.user.id;
    if (String(bus.company_id) !== String(companyId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    await Car.update(req.params.id, req.body);
    const updatedBus = await Car.findById(req.params.id);
    res.json({ success: true, message: 'Bus updated successfully', data: updatedBus });
  } catch (error) {
    next(error);
  }
});

// Delete bus
router.delete('/buses/:id', authenticate, async (req, res, next) => {
  try {
    const bus = await Car.findById(req.params.id);
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }
    const companyId = req.user.company_id || req.user.id;
    if (String(bus.company_id) !== String(companyId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    await Car.delete(req.params.id);
    res.json({ success: true, message: 'Bus deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get company drivers (authenticated company's own drivers)
router.get('/drivers', authenticate, async (req, res, next) => {
  try {
    const companyId = req.user.company_id || req.user.id;
    const drivers = await Driver.findByCompany(companyId);
    res.json({ success: true, data: drivers });
  } catch (error) {
    next(error);
  }
});

// Get single driver by ID
router.get('/drivers/:id', authenticate, async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }
    const companyId = req.user.company_id || req.user.id;
    if (String(driver.company_id) !== String(companyId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    res.json({ success: true, data: driver });
  } catch (error) {
    next(error);
  }
});

// Create driver for company
router.post('/drivers', authenticate, async (req, res, next) => {
  try {
    const companyId = req.user.company_id || req.user.id;
    const driverData = {
      ...req.body,
      company_id: companyId
    };
    const driverId = await Driver.create(driverData);
    const driver = await Driver.findById(driverId);
    res.status(201).json({ success: true, message: 'Driver created successfully', data: driver });
  } catch (error) {
    next(error);
  }
});

// Update driver
router.put('/drivers/:id', authenticate, async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }
    const companyId = req.user.company_id || req.user.id;
    if (String(driver.company_id) !== String(companyId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    await Driver.update(req.params.id, req.body);
    const updatedDriver = await Driver.findById(req.params.id);
    res.json({ success: true, message: 'Driver updated successfully', data: updatedDriver });
  } catch (error) {
    next(error);
  }
});

// Delete driver
router.delete('/drivers/:id', authenticate, async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }
    const companyId = req.user.company_id || req.user.id;
    if (String(driver.company_id) !== String(companyId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    await Driver.delete(req.params.id);
    res.json({ success: true, message: 'Driver deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get company routes (authenticated company's own routes)
router.get('/routes', authenticate, async (req, res, next) => {
  try {
    const companyId = req.user.company_id || req.user.id;
    const routes = await Route.findByCompany(companyId);
    res.json({ success: true, data: routes });
  } catch (error) {
    next(error);
  }
});

// Get single route by ID
router.get('/routes/:id', authenticate, async (req, res, next) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }
    const companyId = req.user.company_id || req.user.id;
    if (String(route.company_id) !== String(companyId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    res.json({ success: true, data: route });
  } catch (error) {
    next(error);
  }
});

// Create route for company
router.post('/routes', authenticate, async (req, res, next) => {
  try {
    const companyId = req.user.company_id || req.user.id;
    const routeData = {
      ...req.body,
      company_id: companyId
    };
    const routeId = await Route.create(routeData);
    const route = await Route.findById(routeId);
    res.status(201).json({ success: true, message: 'Route created successfully', data: route });
  } catch (error) {
    next(error);
  }
});

// Update route
router.put('/routes/:id', authenticate, async (req, res, next) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }
    const companyId = req.user.company_id || req.user.id;
    if (String(route.company_id) !== String(companyId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    await Route.update(req.params.id, req.body);
    const updatedRoute = await Route.findById(req.params.id);
    res.json({ success: true, message: 'Route updated successfully', data: updatedRoute });
  } catch (error) {
    next(error);
  }
});

// Delete route
router.delete('/routes/:id', authenticate, async (req, res, next) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }
    const companyId = req.user.company_id || req.user.id;
    if (String(route.company_id) !== String(companyId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    await Route.delete(req.params.id);
    res.json({ success: true, message: 'Route deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get company trips (authenticated company's own trips)
router.get('/trips', authenticate, async (req, res, next) => {
  try {
    const companyId = req.user.company_id || req.user.id;
    const { status, date } = req.query;
    const trips = await (Trip.findByCompany ? Trip.findByCompany(companyId, { status, date }) : []);
    res.json({ success: true, data: trips });
  } catch (error) {
    next(error);
  }
});

// Get single trip by ID
router.get('/trips/:id', authenticate, async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    const companyId = req.user.company_id || req.user.id;
    if (String(trip.company_id) !== String(companyId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    res.json({ success: true, data: trip });
  } catch (error) {
    next(error);
  }
});

// Create trip for company
router.post('/trips', authenticate, async (req, res, next) => {
  try {
    const companyId = req.user.company_id || req.user.id;
    const tripData = {
      ...req.body,
      company_id: companyId
    };
    const tripId = await Trip.create(tripData);
    const trip = await Trip.findById(tripId);
    res.status(201).json({ success: true, message: 'Trip created successfully', data: trip });
  } catch (error) {
    next(error);
  }
});

// Update trip
router.put('/trips/:id', authenticate, async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    const companyId = req.user.company_id || req.user.id;
    if (String(trip.company_id) !== String(companyId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    await Trip.update(req.params.id, req.body);
    const updatedTrip = await Trip.findById(req.params.id);
    res.json({ success: true, message: 'Trip updated successfully', data: updatedTrip });
  } catch (error) {
    next(error);
  }
});

// Delete trip
router.delete('/trips/:id', authenticate, async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    const companyId = req.user.company_id || req.user.id;
    if (String(trip.company_id) !== String(companyId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    await Trip.delete(req.params.id);
    res.json({ success: true, message: 'Trip deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get company statistics (authenticated company gets their own stats)
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const companyId = req.user.company_id || req.user.id;
    const busCount = await Company.getBusCount(companyId);
    const driverCount = await Company.getDriverCount(companyId);
    const routeCount = await Company.getRouteCount(companyId);
    const companyStats = await Company.getCompanyStats(companyId);
    res.json({
      success: true,
      data: {
        buses: busCount,
        drivers: driverCount,
        routes: routeCount,
        ...companyStats
      }
    });
  } catch (error) {
    next(error);
  }
});

// Company bookings/tickets (authenticated company gets their own)
router.get('/bookings', authenticate, async (req, res, next) => {
  try {
    const companyId = req.user.company_id || req.user.id;
    const { status, startDate, endDate } = req.query;
    const tickets = await (Ticket.findByCompany ? Ticket.findByCompany(companyId, { status, startDate, endDate }) : []);
    res.json({ success: true, data: tickets });
  } catch (error) {
    next(error);
  }
});

// Company payments
router.get('/payments', authenticate, async (req, res, next) => {
  try {
    const companyId = req.user.company_id || req.user.id;
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*, tickets(booking_reference, passenger_name, ticket_status, payment_status)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json({ success: true, data: payments || [] });
  } catch (error) {
    next(error);
  }
});

// Public access to company profile by id (admin/company manager controls required elsewhere)
router.get('/profile/:companyId', authenticate, async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
});

// Public company trips by id
router.get('/trips/:companyId', authenticate, async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const { status, date } = req.query;
    const trips = await (Trip.findByCompany ? Trip.findByCompany(companyId, { status, date }) : []);
    res.json({ success: true, data: trips });
  } catch (error) {
    next(error);
  }
});

// Company bookings by id
router.get('/bookings/:companyId', authenticate, async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const { status, startDate, endDate } = req.query;
    const tickets = await (Ticket.findByCompany ? Ticket.findByCompany(companyId, { status, startDate, endDate }) : []);
    res.json({ success: true, data: tickets });
  } catch (error) {
    next(error);
  }
});

// Company payments by id
router.get('/payments/:companyId', authenticate, async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*, tickets(booking_reference, passenger_name, ticket_status, payment_status)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json({ success: true, data: payments || [] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
