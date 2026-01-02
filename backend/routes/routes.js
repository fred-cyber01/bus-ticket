const express = require('express');
const router = express.Router();
const { authenticate, isAdmin, isAdminOrCompany } = require('../middleware/auth');
const {
  getRoutes,
  getRoute,
  createRoute,
  updateRoute,
  deleteRoute,
  getRouteStops,
} = require('../controllers/routeController');

router.get('/', getRoutes);
router.get('/:id', getRoute);
router.get('/:id/stops', getRouteStops);
router.post('/', authenticate, isAdminOrCompany, createRoute);
router.put('/:id', authenticate, isAdminOrCompany, updateRoute);
router.delete('/:id', authenticate, isAdminOrCompany, deleteRoute);

module.exports = router;
