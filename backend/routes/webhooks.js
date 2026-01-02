// routes/webhooks.js
const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Payment provider webhooks (no authentication - providers will send requests)
router.post('/mtn', webhookController.mtnWebhook);
router.post('/airtel', webhookController.airtelWebhook);
router.post('/momopay', webhookController.momoPayWebhook);
router.post('/flutterwave', webhookController.flutterwaveWebhook);

// Bank transfer confirmation (admin only - requires authentication)
const { authenticate, isAdmin } = require('../middleware/auth');
router.post('/bank-confirm', authenticate, isAdmin, webhookController.confirmBankTransfer);

module.exports = router;
