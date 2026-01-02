// routes/payments.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Customer/Company payment routes
router.post('/initiate', authenticate, paymentController.initiatePayment);
router.get('/status/:transactionRef', authenticate, paymentController.checkPaymentStatus);
router.get('/history', authenticate, paymentController.getPaymentHistory);

// Admin list payments
router.get('/', authenticate, isAdmin, paymentController.getAllPayments);

// Admin routes - system earnings and withdrawals
router.get('/earnings', authenticate, isAdmin, paymentController.getSystemEarnings);
router.post('/withdraw', authenticate, isAdmin, paymentController.withdrawEarnings);

module.exports = router;
