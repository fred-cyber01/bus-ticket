// routes/company.js
const express = require('express');
const router = express.Router();
const { authenticate, isCompany } = require('../middleware/auth');
const Company = require('../models/Company');
const Car = require('../models/Car');
const Driver = require('../models/Driver');
const Route = require('../models/Route');
const Trip = require('../models/Trip');
const Ticket = require('../models/Ticket');
const { query } = require('../config/database');

// Get company profile (authenticated company gets their own profile)
router.get('/profile', authenticate, async (req, res, next) => {
  try {
    // Get company_id from authenticated user's token
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

// Get company bookings/tickets (authenticated company gets their own)
router.get('/bookings', authenticate, async (req, res, next) => {
  try {
    const companyId = req.user.company_id || req.user.id;
    const { status, startDate, endDate } = req.query;

    const tickets = await (Ticket.findByCompany
      ? Ticket.findByCompany(companyId, { status, startDate, endDate })
      : []);

    res.json({ success: true, data: tickets });
  } catch (error) {
    next(error);
  }
});

// Get company payments (authenticated company gets their own)
router.get('/payments', authenticate, async (req, res, next) => {
  try {
    const companyId = req.user.company_id || req.user.id;

    const payments = await query(
      `
      SELECT p.*,
             t.booking_reference,
             t.passenger_name,
             t.ticket_status,
             t.payment_status
      FROM payments p
      LEFT JOIN tickets t
        ON p.payment_type = 'ticket' AND p.reference_id = t.id
      WHERE p.company_id = ?
      ORDER BY p.created_at DESC
      `,
      [companyId]
    );

    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
});

// Get company profile with subscription info (with companyId parameter)
router.get('/profile/:companyId', authenticate, async (req, res, next) => {
  try {
    const { companyId } = req.params;
    
    // TODO: Add authorization check - only company manager can access their own company
    
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    
    res.json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
});

// Get company statistics
router.get('/stats/:companyId', authenticate, async (req, res, next) => {
  try {
    const { companyId } = req.params;
    
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

// Get company buses
router.get('/buses/:companyId', authenticate, async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const buses = await Car.findByCompany(companyId);
    res.json({ success: true, data: buses });
  } catch (error) {
    next(error);
  }
});

// Get company drivers
router.get('/drivers/:companyId', authenticate, async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const drivers = await Driver.findByCompany(companyId);
    res.json({ success: true, data: drivers });
  } catch (error) {
    next(error);
  }
});

// Get company routes
router.get('/routes/:companyId', authenticate, async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const routes = await Route.findByCompany(companyId);
    res.json({ success: true, data: routes });
  } catch (error) {
    next(error);
  }
});

// Get company trips
router.get('/trips/:companyId', authenticate, async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const { status, date } = req.query;
    
    // TODO: Implement Trip.findByCompany with filters
    const trips = await Trip.findByCompany ? 
      await Trip.findByCompany(companyId, { status, date }) : 
      [];
    
    res.json({ success: true, data: trips });
  } catch (error) {
    next(error);
  }
});

// Get company bookings/tickets
router.get('/bookings/:companyId', authenticate, async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const { status, startDate, endDate } = req.query;
    
    // TODO: Implement Ticket.findByCompany with filters
    const tickets = await Ticket.findByCompany ? 
      await Ticket.findByCompany(companyId, { status, startDate, endDate }) : 
      [];
    
    res.json({ success: true, data: tickets });
  } catch (error) {
    next(error);
  }
});

// Get company payments
router.get('/payments/:companyId', authenticate, async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const payments = await query(
      `
      SELECT p.*,
             t.booking_reference,
             t.passenger_name,
             t.ticket_status,
             t.payment_status
      FROM payments p
      LEFT JOIN tickets t
        ON p.payment_type = 'ticket' AND p.reference_id = t.id
      WHERE p.company_id = ?
      ORDER BY p.created_at DESC
      `,
      [companyId]
    );
    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
