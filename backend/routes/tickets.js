// routes/tickets.js
const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validator');
const { authenticate, isAdmin, isAdminOrDriver } = require('../middleware/auth');
const { bookingLimiter } = require('../middleware/rateLimiter');
const ticketController = require('../controllers/ticketController');

const router = express.Router();

// Validation rules for bookings
const createBookingValidation = [
  body('tripId').notEmpty().withMessage('Trip ID is required'),
  body('seatNumbers').isArray({ min: 1 }).withMessage('Seat numbers must be a non-empty array'),
  body('seatNumbers.*').isString().withMessage('Each seat number must be a string'),
  body('passengerDetails').isArray({ min: 1 }).withMessage('Passenger details must be a non-empty array'),
  body('passengerDetails.*.name').notEmpty().withMessage('Passenger name is required'),
  body('passengerDetails.*.age').isInt({ min: 1 }).withMessage('Passenger age must be a positive integer'),
  body('passengerDetails.*.seatNumber').isInt({ min: 1 }).withMessage('Seat number must be a positive integer')
];

const checkAvailabilityValidation = [
  body('schedule_id').isInt().withMessage('Invalid schedule ID'),
  body('trip_date').isDate().withMessage('Invalid trip date'),
  body('boarding_stop_id').isInt().withMessage('Invalid boarding stop ID'),
  body('dropoff_stop_id').isInt().withMessage('Invalid dropoff stop ID')
];

// Routes
router.post(
  '/',
  authenticate,
  bookingLimiter,
  createBookingValidation,
  validate,
  ticketController.createBooking
);

router.post(
  '/check-availability',
  checkAvailabilityValidation,
  validate,
  ticketController.checkAvailability
);

router.get('/', authenticate, ticketController.getBookings);
router.get('/:id', authenticate, ticketController.getBooking);
router.get('/:id/download', authenticate, ticketController.downloadTicketPDF);
router.post('/:id/confirm-payment', authenticate, ticketController.confirmPayment);
// Driver/Admin can fetch tickets for a trip
router.get('/trip/:tripId', authenticate, isAdminOrDriver, ticketController.getTripTickets);
router.put('/:id', authenticate, isAdmin, ticketController.updateTicket);
router.delete('/:id', authenticate, ticketController.cancelBooking);

module.exports = router;
