const express = require('express');
const router = express.Router();
const { authenticate, isAdmin, isAdminOrCompany } = require('../middleware/auth');
const Ticket = require('../models/Ticket');
const {
  getAvailableTrips,
  getTrips,
  getTrip,
  createTrip,
  updateTrip,
  deleteTrip,
  updateTripStatus,
} = require('../controllers/tripController');

router.get('/available', getAvailableTrips);
router.get('/', authenticate, getTrips);
router.get('/:id', authenticate, getTrip);
// Return tickets for a trip (occupied seats)
router.get('/:id/tickets', authenticate, async (req, res) => {
  try {
    const tripId = req.params.id;
    const tickets = await Ticket.getTripTickets(tripId);
    return res.json({ success: true, data: tickets });
  } catch (err) {
    console.error('Error fetching trip tickets', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch trip tickets' });
  }
});
router.post('/', authenticate, isAdminOrCompany, createTrip);
router.put('/:id', authenticate, updateTrip);
router.put('/:id/status', authenticate, updateTripStatus);
router.delete('/:id', authenticate, isAdminOrCompany, deleteTrip);

module.exports = router;
