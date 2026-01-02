// routes/payTicket.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const paymentController = require('../controllers/payTicketController');

// Create Flutterwave MoMo payment for a ticket
router.post('/pay-ticket', authenticate, paymentController.payTicket);

// Optional convenience polling endpoint
router.get('/pay-ticket/status/:txRef', authenticate, paymentController.payTicketStatus);

module.exports = router;
