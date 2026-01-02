const express = require('express');
const router = express.Router();
const { authenticate, isAdminOrCompany } = require('../middleware/auth');
const {
  getCars,
  getCar,
  createCar,
  updateCar,
  deleteCar,
} = require('../controllers/carController');

router.get('/', getCars);
router.get('/:id', getCar);
router.post('/', authenticate, isAdminOrCompany, createCar);
router.put('/:id', authenticate, isAdminOrCompany, updateCar);
router.delete('/:id', authenticate, isAdminOrCompany, deleteCar);

module.exports = router;
