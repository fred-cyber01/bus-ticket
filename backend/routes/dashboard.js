const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const {
  getDashboardStats,
  getRevenueStats,
} = require('../controllers/dashboardController');

router.get('/stats', authenticate, isAdmin, getDashboardStats);
router.get('/revenue', authenticate, isAdmin, getRevenueStats);

module.exports = router;
