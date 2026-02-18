// controllers/paymentController.js
const paymentService = require('../services/paymentService');
const subscriptionService = require('../services/subscriptionService');
const supabase = require('../config/supabase');
const Ticket = require('../models/Ticket');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @route   POST /api/payments/initiate
 * @desc    Initiate a payment
 * @access  Private
 */
exports.initiatePayment = asyncHandler(async (req, res) => {
  const { payment_type, amount, payment_method, phone_number, metadata } = req.body;
  const userId = req.user?.id;
  const companyId = req.user?.company_id;

  // Validate required fields
  if (!payment_type || !amount || !payment_method) {
    return res.status(400).json({
      success: false,
      message: 'Payment type, amount, and payment method are required'
    });
  }

  // Validate payment type
  if (!['subscription', 'ticket', 'topup'].includes(payment_type)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid payment type'
    });
  }

  // Validate payment method
  if (!['mtn_momo', 'airtel_money', 'momopay', 'bank_transfer', 'flutterwave'].includes(payment_method)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid payment method'
    });
  }

  // Validate mobile money payments require phone number
  if ((payment_method === 'mtn_momo' || payment_method === 'airtel_money' || payment_method === 'momopay')
      && !phone_number) {
    return res.status(400).json({
      success: false,
      message: 'Phone number is required for mobile money payments'
    });
  }

  const paymentData = {
    payment_type,
    amount: parseFloat(amount),
    payment_method,
    phone_number,
    company_id: companyId,
    user_id: userId,
    metadata: metadata || {}
  };

  let result;

  try {
    switch (payment_method) {
      case 'mtn_momo':
        result = await paymentService.initiateMTNPayment(paymentData);
        break;
      case 'airtel_money':
        result = await paymentService.initiateAirtelPayment(paymentData);
        break;
      case 'momopay':
        result = await paymentService.generateMomoPayCode(paymentData);
        break;
      case 'bank_transfer':
        result = await paymentService.generateBankTransferReference(paymentData);
        break;
      case 'flutterwave':
        // Prepare params for Flutterwave Rwanda Mobile Money
        // Use generated tx_ref to correlate webhook and transaction
        const txRef = paymentService.generateTransactionRef();
        result = await paymentService.initiateFlutterwaveTicketPayment({
          amount: paymentData.amount,
          phone: paymentData.phone_number || null,
          network: paymentData.metadata?.network || 'MTN',
          tx_ref: txRef,
          email: paymentData.metadata?.email || req.user?.email || 'customer@ticketbus.rw',
          fullname: paymentData.metadata?.fullname || req.user?.name || 'Ticket Customer',
          ticketId: paymentData.metadata?.ticket_id || null,
          userId: paymentData.user_id
        });
        // Ensure result contains tx_ref and paymentId if possible
        result = Object.assign({}, result, { transactionRef: txRef });
        break;
    }

    // Normalize response to include paymentId and transactionRef keys when available
    const responseData = Object.assign({}, result);
    if (!responseData.paymentId && responseData.data && responseData.data?.flw_ref) {
      responseData.paymentId = responseData.data.flw_ref;
    }

    res.status(200).json({
      success: true,
      message: 'Payment initiated successfully',
      data: responseData
    });

  } catch (error) {
    console.error('Payment initiation error:', error);
    // Surface gateway errors when possible to aid debugging
    const message = (error && error.message) ? error.message : 'Failed to initiate payment. Please try again.';
    res.status(500).json({
      success: false,
      message
    });
  }
});

/**
 * @route   GET /api/payments/status/:transactionRef
 * @desc    Check payment status
 * @access  Private
 */
exports.checkPaymentStatus = asyncHandler(async (req, res) => {
  const { transactionRef } = req.params;

  if (!transactionRef) {
    return res.status(400).json({
      success: false,
      message: 'Transaction reference is required'
    });
  }

  try {
    const paymentStatus = await paymentService.checkPaymentStatus(transactionRef);

    // Check if user/company owns this payment
    const userId = req.user?.id;
    const companyId = req.user?.company_id;

    if (paymentStatus.userId && paymentStatus.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (paymentStatus.companyId && paymentStatus.companyId !== companyId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: paymentStatus
    });

  } catch (error) {
    console.error('Payment status check error:', error);
    res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
  }
});

/**
 * @route   GET /api/payments/history
 * @desc    Get payment history
 * @access  Private
 */
exports.getPaymentHistory = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const companyId = req.user?.company_id;
  const limit = parseInt(req.query.limit) || 50;

  if (!userId && !companyId) {
    return res.status(400).json({
      success: false,
      message: 'User or company context required'
    });
  }

  try {
    const history = await paymentService.getPaymentHistory(userId, companyId, limit);

    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });

  } catch (error) {
    console.error('Payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment history'
    });
  }
});

/**
 * @route   GET /api/payments
 * @desc    Get all payments (Admin)
 * @access  Private/Admin
 */
exports.getAllPayments = asyncHandler(async (req, res) => {
  const {
    status,
    payment_method,
    payment_type,
    date_from,
    date_to,
    limit = 100
  } = req.query;

  const filters = {};
  if (status) filters.status = status;
  if (payment_method) filters.payment_method = payment_method;
  if (payment_type) filters.payment_type = payment_type;
  if (date_from) filters.date_from = date_from;
  if (date_to) filters.date_to = date_to;

  try {
    const payments = await paymentService.getAllPayments(filters, parseInt(limit));

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });

  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payments'
    });
  }
});

/**
 * @route   GET /api/payments/earnings
 * @desc    Get system earnings (Admin)
 * @access  Private/Admin
 */
exports.getSystemEarnings = asyncHandler(async (req, res) => {
  const { period = 'month' } = req.query;

  if (!['day', 'week', 'month'].includes(period)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid period. Must be day, week, or month'
    });
  }

  try {
    const earnings = await paymentService.getSystemEarnings(period);

    res.status(200).json({
      success: true,
      data: earnings
    });

  } catch (error) {
    console.error('System earnings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve earnings data'
    });
  }
});

/**
 * @route   POST /api/payments/withdraw
 * @desc    Process withdrawal (Admin)
 * @access  Private/Admin
 */
exports.withdrawEarnings = asyncHandler(async (req, res) => {
  const { amount, bank_details } = req.body;

  if (!amount || !bank_details) {
    return res.status(400).json({
      success: false,
      message: 'Amount and bank details are required'
    });
  }

  const withdrawalAmount = parseFloat(amount);
  if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid withdrawal amount'
    });
  }

  // Check if system has sufficient balance (simplified check)
  try {
    const earnings = await paymentService.getSystemEarnings('month');
    const totalEarnings = earnings.totals.total_amount || 0;

    if (withdrawalAmount > totalEarnings) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance for withdrawal'
      });
    }

    const result = await paymentService.processWithdrawal(withdrawalAmount, bank_details);

    res.status(200).json({
      success: true,
      message: 'Withdrawal request processed successfully',
      data: result
    });

  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process withdrawal'
    });
  }
});

/**
 * @route   POST /api/payments/confirm-ticket/:ticketId
 * @desc    Confirm ticket payment
 * @access  Private
 */
exports.confirmTicketPayment = asyncHandler(async (req, res) => {
  const { ticketId } = req.params;
  const { paymentMethod } = req.body;
  const userId = req.user?.id;

  if (!ticketId) {
    return res.status(400).json({
      success: false,
      message: 'Ticket ID is required'
    });
  }

  try {
    // Get ticket details using Supabase
    const ticketData = await Ticket.findById(ticketId);

    if (!ticketData) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Check ownership
    if (ticketData.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if already paid
    if (ticketData.payment_status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Ticket is already paid'
      });
    }

    // Create payment record
    const paymentData = {
      payment_type: 'ticket',
      amount: ticketData.price,
      payment_method: paymentMethod || 'mtn_momo',
      phone_number: ticketData.passenger_phone,
      user_id: userId,
      metadata: {
        ticket_id: ticketId,
        passenger_name: ticketData.passenger_name,
        trip_id: ticketData.trip_id
      }
    };

    // Initiate payment
    let paymentResult;
    switch (paymentData.payment_method) {
      case 'mtn_momo':
        paymentResult = await paymentService.initiateMTNPayment(paymentData);
        break;
      case 'airtel_money':
        paymentResult = await paymentService.initiateAirtelPayment(paymentData);
        break;
      case 'momopay':
        paymentResult = await paymentService.generateMomoPayCode(paymentData);
        break;
      default:
        paymentResult = await paymentService.initiateMTNPayment(paymentData);
    }

    res.status(200).json({
      success: true,
      message: 'Ticket payment initiated',
      data: {
        ticketId: ticketId,
        payment: paymentResult
      }
    });

  } catch (error) {
    console.error('Ticket payment confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm ticket payment'
    });
  }
});

/**
 * @route   POST /api/payments/webhook/mtn
 * @desc    Handle MTN payment webhook
 * @access  Public
 */
exports.handleMTNWebhook = asyncHandler(async (req, res) => {
  const { externalId, status, amount, transactionId } = req.body;

  console.log('MTN Webhook received:', req.body);

  try {
    if (status === 'SUCCESSFUL') {
      await paymentService.updatePaymentStatus(externalId, 'completed', transactionId, {
        webhook_received: true,
        completed_at: new Date().toISOString()
      });
    } else {
      await paymentService.updatePaymentStatus(externalId, 'failed', transactionId, {
        webhook_received: true,
        failure_reason: status
      });
    }

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('MTN Webhook error:', error);
    res.status(500).json({ success: false });
  }
});

/**
 * @route   POST /api/payments/webhook/airtel
 * @desc    Handle Airtel payment webhook
 * @access  Public
 */
exports.handleAirtelWebhook = asyncHandler(async (req, res) => {
  const { reference, status, amount, transaction_id } = req.body;

  console.log('Airtel Webhook received:', req.body);

  try {
    if (status === 'SUCCESS') {
      await paymentService.updatePaymentStatus(reference, 'completed', transaction_id, {
        webhook_received: true,
        completed_at: new Date().toISOString()
      });
    } else {
      await paymentService.updatePaymentStatus(reference, 'failed', transaction_id, {
        webhook_received: true,
        failure_reason: status
      });
    }

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Airtel Webhook error:', error);
    res.status(500).json({ success: false });
  }
});

/**
 * @route   POST /api/payments/webhook/momopay
 * @desc    Handle MoMoPay payment webhook
 * @access  Public
 */
exports.handleMoMoPayWebhook = asyncHandler(async (req, res) => {
  const { paymentCode, status, amount, transactionRef } = req.body;

  console.log('MoMoPay Webhook received:', req.body);

  try {
    // Find payment by payment code in payment_data JSON using Supabase
    const { data: payments, error } = await supabase
      .from('payments')
      .select('transaction_ref, payment_data')
      .contains('payment_data', { payment_code: paymentCode })
      .limit(1);

    if (error) throw error;

    if (payments && payments.length > 0) {
      const txRef = payments[0].transaction_ref;

      if (status === 'COMPLETED') {
        await paymentService.updatePaymentStatus(null, 'completed', txRef, {
          webhook_received: true,
          completed_at: new Date().toISOString()
        });
      } else {
        await paymentService.updatePaymentStatus(null, 'failed', txRef, {
          webhook_received: true,
          failure_reason: status
        });
      }
    }

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('MoMoPay Webhook error:', error);
    res.status(500).json({ success: false });
  }
});

module.exports = exports;
