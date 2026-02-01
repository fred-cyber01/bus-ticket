const express = require('express');
const router = express.Router();
const { authenticate, isAdmin, isAdminOrCompany, optionalAuth } = require('../middleware/auth');
const {
  getRoutes,
  getRoute,
  createRoute,
  updateRoute,
  deleteRoute,
  getRouteStops,
} = require('../controllers/routeController');

router.get('/', optionalAuth, getRoutes);
router.get('/:id', optionalAuth, getRoute);
router.get('/:id/stops', getRouteStops);
router.post('/', authenticate, isAdminOrCompany, createRoute);
router.put('/:id', authenticate, isAdminOrCompany, updateRoute);
router.delete('/:id', authenticate, isAdminOrCompany, deleteRoute);

module.exports = router;
