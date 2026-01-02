const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const {
  getStops,
  getStop,
  createStop,
  updateStop,
  deleteStop,
} = require('../controllers/stopController');

router.get('/', getStops);
router.get('/:id', getStop);
router.post('/', authenticate, isAdmin, createStop);
router.put('/:id', authenticate, isAdmin, updateStop);
router.delete('/:id', authenticate, isAdmin, deleteStop);

module.exports = router;
