// routes/flutterwave.js
const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Flutterwave webhook endpoint
router.post('/webhook', webhookController.flutterwaveWebhook);

module.exports = router;
