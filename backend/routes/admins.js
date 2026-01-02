// routes/admins.js
const express = require('express');
const { authenticate, isAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.get('/stats', authenticate, isAdmin, adminController.getAdminStats);
router.get('/', authenticate, isAdmin, adminController.getAllAdmins);
router.post('/', authenticate, isAdmin, adminController.createAdmin);
router.put('/:id', authenticate, isAdmin, adminController.updateAdmin);
router.delete('/:id', authenticate, isAdmin, adminController.deleteAdmin);

module.exports = router;
