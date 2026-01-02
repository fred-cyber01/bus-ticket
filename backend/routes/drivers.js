const express = require('express');
const router = express.Router();
const { authenticate, isAdmin, isAdminOrCompany, isAdminOrDriver } = require('../middleware/auth');
const {
  getDrivers,
  getDriver,
  createDriver,
  updateDriver,
  deleteDriver,
  getDriverTrips,
  getCurrentTrip,
} = require('../controllers/driverController');

router.get('/', authenticate, isAdminOrCompany, getDrivers);
router.get('/:id', authenticate, isAdminOrCompany, getDriver);
router.get('/:id/trips', authenticate, getDriverTrips);
router.get('/:id/current-trip', authenticate, getCurrentTrip);
router.post('/', authenticate, isAdminOrCompany, createDriver);
router.put('/:id', authenticate, isAdminOrCompany, updateDriver);
router.delete('/:id', authenticate, isAdminOrCompany, deleteDriver);

module.exports = router;
