const express = require('express');
const router = express.Router();
const { authenticate, isAdmin, isAdminOrCompany } = require('../middleware/auth');
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
router.post('/', authenticate, isAdminOrCompany, createTrip);
router.put('/:id', authenticate, updateTrip);
router.put('/:id/status', authenticate, updateTripStatus);
router.delete('/:id', authenticate, isAdminOrCompany, deleteTrip);

module.exports = router;
