const express = require('express');
const router = express.Router();
const { authenticate, isAdmin, optionalAuth } = require('../middleware/auth');
const {
  getStops,
  getStop,
  createStop,
  updateStop,
  deleteStop,
} = require('../controllers/stopController');

router.get('/', optionalAuth, getStops);
router.get('/:id', optionalAuth, getStop);
router.post('/', authenticate, isAdmin, createStop);
router.put('/:id', authenticate, isAdmin, updateStop);
router.delete('/:id', authenticate, isAdmin, deleteStop);

module.exports = router;
