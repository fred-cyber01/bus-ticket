// controllers/webhookController.js
const { query } = require('../config/database');
const paymentService = require('../services/paymentService');
const subscriptionService = require('../services/subscriptionService');
const smsService = require('../services/smsService');
const moment = require('moment-timezone');

/**
 * @route   POST /api/webhooks/mtn
 * @desc    MTN Mobile Money webhook callback
 * @access  Public (from MTN servers)
 */
exports.mtnWebhook = async (req, res) => {
  try {
    const webhookData = req.body;
    
    // Log webhook
    await query(`
      INSERT INTO payment_webhooks (transaction_id, payment_method, raw_data, created_at)
      VALUES (?, ?, ?, ?)
    `, [
      webhookData.referenceId || webhookData.externalId,
      'mtn_momo',
      JSON.stringify(webhookData),
      moment().tz('Africa/Kigali').format('YYYY-MM-DD HH:mm:ss')
    ]);

    // Find payment by reference
    const paymentRows = await query(`
      SELECT * FROM payments 
      WHERE transaction_ref = ?
      LIMIT 1
    `, [webhookData.externalId || webhookData.referenceId]);

    const payment = paymentRows[0];

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Update payment status based on MTN response
    const status = webhookData.status === 'SUCCESSFUL' ? 'completed' : 'failed';
    await paymentService.updatePaymentStatus(
      null,
      status,
      payment.transaction_ref,
      webhookData
    );

    // If completed, activate ticket or subscription
    if (status === 'completed') {
      await processSuccessfulPayment(payment);
    }

    res.status(200).json({ message: 'Webhook processed' });
  } catch (error) {
    console.error('MTN Webhook Error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

/**
 * @route   POST /api/webhooks/airtel
 * @desc    Airtel Money webhook callback
 * @access  Public (from Airtel servers)
 */
exports.airtelWebhook = async (req, res) => {
  try {
    const webhookData = req.body;
    
    // Log webhook
    await query(`
      INSERT INTO payment_webhooks (transaction_id, payment_method, raw_data, created_at)
      VALUES (?, ?, ?, ?)
    `, [
      webhookData.transaction?.id,
      'airtel_money',
      JSON.stringify(webhookData),
      moment().tz('Africa/Kigali').format('YYYY-MM-DD HH:mm:ss')
    ]);

    // Find payment
    const paymentRows = await query(`
      SELECT * FROM payments 
      WHERE transaction_ref = ?
      LIMIT 1
    `, [webhookData.transaction?.id || webhookData.reference]);

    const payment = paymentRows[0];

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Update payment status
    const status = webhookData.status === 'TS' ? 'completed' : 'failed';
    await paymentService.updatePaymentStatus(
      null,
      status,
      payment.transaction_ref,
      webhookData
    );

    // Process successful payment
    if (status === 'completed') {
      await processSuccessfulPayment(payment);
    }

    res.status(200).json({ message: 'Webhook processed' });
  } catch (error) {
    console.error('Airtel Webhook Error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

/**
 * @route   POST /api/webhooks/momopay
 * @desc    MoMoPay webhook callback
 * @access  Public
 */
exports.momoPayWebhook = async (req, res) => {
  try {
    const webhookData = req.body;
    
    // Log webhook
    await query(`
      INSERT INTO payment_webhooks (transaction_id, payment_method, raw_data, created_at)
      VALUES (?, ?, ?, ?)
    `, [
      webhookData.merchantReference,
      'momopay',
      JSON.stringify(webhookData),
      moment().tz('Africa/Kigali').format('YYYY-MM-DD HH:mm:ss')
    ]);

    // Find payment
    const paymentRows = await query(`
      SELECT * FROM payments 
      WHERE transaction_ref = ?
      LIMIT 1
    `, [webhookData.merchantReference || webhookData.transactionId]);

    const payment = paymentRows[0];

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Update payment status
    const status = webhookData.status === 'SUCCESS' ? 'completed' : 'failed';
    await paymentService.updatePaymentStatus(
      null,
      status,
      payment.transaction_ref,
      webhookData
    );

    // Process successful payment
    if (status === 'completed') {
      await processSuccessfulPayment(payment);
    }

    res.status(200).json({ message: 'Webhook processed' });
  } catch (error) {
    console.error('MoMoPay Webhook Error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

/**
 * @route   POST /api/webhooks/flutterwave
 * @route   POST /api/flutterwave/webhook
 * @desc    Flutterwave webhook callback
 * @access  Public (from Flutterwave servers)
 */
exports.flutterwaveWebhook = async (req, res) => {
  try {
    const verifHash = req.headers['verif-hash'];
    const expected = process.env.FLW_WEBHOOK_SECRET;

    if (!expected || !verifHash || String(verifHash) !== String(expected)) {
      return res.status(401).json({ message: 'Unauthorized webhook' });
    }

    const webhookData = req.body || {};
    const data = webhookData.data || {};

    // Log webhook
    await query(`
      INSERT INTO payment_webhooks (transaction_id, payment_method, raw_data, created_at)
      VALUES (?, ?, ?, ?)
    `, [
      data.tx_ref || data.id || webhookData.event || 'flutterwave',
      'flutterwave_momo',
      JSON.stringify(webhookData),
      moment().tz('Africa/Kigali').format('YYYY-MM-DD HH:mm:ss')
    ]);

    const txRef = data.tx_ref;
    const flwTransactionId = data.id;

    if (!txRef || !flwTransactionId) {
      return res.status(400).json({ message: 'Missing tx_ref or transaction id' });
    }

    // Find payment by tx_ref
    const paymentRows = await query(
      'SELECT * FROM payments WHERE transaction_ref = ? LIMIT 1',
      [txRef]
    );
    const payment = paymentRows[0];

    if (!payment) {
      // Idempotent: respond OK so Flutterwave stops retrying
      return res.status(200).json({ message: 'Payment not found (ignored)' });
    }

    if (payment.status === 'completed') {
      return res.status(200).json({ message: 'Already processed' });
    }

    // Verify transaction from Flutterwave before marking completed
    const verifyResp = await paymentService.verifyFlutterwaveTransaction({
      transactionId: flwTransactionId
    });

    const verifiedData = verifyResp?.data;
    const verifiedStatus = String(verifiedData?.status || '').toLowerCase();
    const verifiedCurrency = String(verifiedData?.currency || '').toUpperCase();
    const verifiedAmount = Number(verifiedData?.amount);
    const verifiedTxRef = verifiedData?.tx_ref;

    const amountMatches = Number(payment.amount) === verifiedAmount;
    const currencyMatches = verifiedCurrency === 'RWF';
    const txRefMatches = String(verifiedTxRef || '') === String(txRef);

    if (verifiedStatus === 'successful' && amountMatches && currencyMatches && txRefMatches) {
      await paymentService.updatePaymentStatus(
        null,
        'completed',
        txRef,
        {
          gateway: 'flutterwave',
          flw_transaction_id: flwTransactionId,
          verified_at: moment().tz('Africa/Kigali').format('YYYY-MM-DD HH:mm:ss'),
          verify: verifyResp
        }
      );

      // Reload payment (so metadata is fresh) then activate ticket/subscription
      const updated = (await query('SELECT * FROM payments WHERE transaction_ref = ? LIMIT 1', [payment.transaction_ref]))[0];
      await processSuccessfulPayment(updated || payment);

      return res.status(200).json({ message: 'Webhook processed' });
    }

    await paymentService.updatePaymentStatus(
      null,
      'failed',
      txRef,
      {
        gateway: 'flutterwave',
        flw_transaction_id: flwTransactionId,
        verified_at: moment().tz('Africa/Kigali').format('YYYY-MM-DD HH:mm:ss'),
        verify: verifyResp,
        reason: {
          verifiedStatus,
          amountMatches,
          currencyMatches,
          txRefMatches
        }
      }
    );

    return res.status(200).json({ message: 'Webhook processed (failed)' });
  } catch (error) {
    console.error('Flutterwave Webhook Error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
};

/**
 * @route   POST /api/payments/confirm-bank-transfer
 * @desc    Manually confirm bank transfer (Admin only)
 * @access  Private/Admin
 */
exports.confirmBankTransfer = async (req, res) => {
  try {
    const { transactionId, bankReferenceNumber } = req.body;

    const paymentRows = await query(
      'SELECT * FROM payments WHERE transaction_ref = ? LIMIT 1',
      [transactionId]
    );
    const payment = paymentRows[0];

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.payment_method !== 'bank_transfer') {
      return res.status(400).json({
        success: false,
        message: 'Not a bank transfer payment'
      });
    }

    // Update payment by transaction_ref
    await paymentService.updatePaymentStatus(
      null,
      'completed',
      payment.transaction_ref,
      { bankReferenceNumber }
    );

    // Process successful payment
    await processSuccessfulPayment(payment);

    res.json({
      success: true,
      message: 'Bank transfer confirmed successfully'
    });
  } catch (error) {
    console.error('Bank Transfer Confirmation Error:', error);
    res.status(500).json({
      success: false,
      error: 'Confirmation failed'
    });
  }
};

/**
 * Process successful payment (activate ticket or subscription)
 */
async function processSuccessfulPayment(payment) {
  const metadata = typeof payment.payment_data === 'string'
    ? (JSON.parse(payment.payment_data || '{}') || {})
    : (payment.payment_data || {});

  const ticketId = payment.reference_id || metadata.ticket_id || metadata.reference_id;

  if (payment.payment_type === 'ticket' && ticketId) {
    // Activate ticket(s)
    await query(`
      UPDATE tickets 
      SET ticket_status = 'confirmed', 
          payment_status = 'completed',
          payment_id = ?
      WHERE id = ?
    `, [payment.transaction_ref, ticketId]);

    // Track payment method on ticket for receipt/logging
    await query(
      'UPDATE tickets SET payment_method = ? WHERE id = ? AND (payment_method IS NULL OR payment_method = "")',
      [payment.payment_method, ticketId]
    );

    // Also update related tickets in the same booking
    await query(`
      UPDATE tickets 
      SET ticket_status = 'confirmed', 
          payment_status = 'completed',
          payment_id = ?
      WHERE user_id = ? 
      AND trip_id = (SELECT trip_id FROM tickets WHERE id = ?)
      AND booking_date = (SELECT booking_date FROM tickets WHERE id = ?)
      AND payment_id IS NULL
    `, [payment.transaction_ref, payment.user_id, ticketId, ticketId]);

    // Notify driver with passenger list for the trip if driver phone is available
    try {
      const tripRow = await query('SELECT trip_id FROM tickets WHERE id = ? LIMIT 1', [ticketId]);
      const tripIdReal = tripRow && tripRow[0] && tripRow[0].trip_id;
      if (tripIdReal) {
        await smsService.notifyDriverForTrip(tripIdReal);
      }
    } catch (e) {
      console.error('Driver notification failed:', e?.message || e);
    }

  } else if (payment.payment_type === 'subscription' && payment.company_id) {
    // Activate subscription
    const subscriptionRows = await query(
      'SELECT plan_id FROM company_subscriptions WHERE id = ?',
      [payment.subscription_id]
    );
    const subscription = subscriptionRows[0];

    if (subscription) {
      await subscriptionService.subscribeToPlan(
        payment.company_id,
        subscription.plan_id,
        payment.id
      );
    }
  }
}

module.exports = exports;
