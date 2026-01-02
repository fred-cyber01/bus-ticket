// controllers/payTicketController.js
const { query } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const paymentService = require('../services/paymentService');

function normalizeNetwork(network) {
  const n = String(network || '').trim().toUpperCase();
  if (n === 'MTN' || n === 'MTN_MOMO' || n === 'MOMO') return 'MTN';
  if (n === 'AIRTEL' || n === 'AIRTEL_MONEY') return 'AIRTEL';
  return null;
}

function generateTxRef(ticketId) {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `TKT-${ticketId}-${Date.now()}-${rand}`;
}

/**
 * POST /api/pay-ticket
 * body: { ticketId, phone, network }
 */
exports.payTicket = asyncHandler(async (req, res) => {
  const { ticketId, phone, network } = req.body || {};
  const userId = req.user?.id;

  const normalizedNetwork = normalizeNetwork(network);
  if (!ticketId || !phone || !normalizedNetwork) {
    return res.status(400).json({
      success: false,
      message: 'ticketId, phone, and network (MTN or AIRTEL) are required'
    });
  }

  // Load ticket
  const tickets = await query('SELECT * FROM tickets WHERE id = ? LIMIT 1', [ticketId]);
  const ticket = tickets[0];

  if (!ticket) {
    return res.status(404).json({ success: false, message: 'Ticket not found' });
  }

  if (ticket.user_id !== userId) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  if (String(ticket.payment_status).toLowerCase() === 'completed' || String(ticket.payment_status).toLowerCase() === 'paid') {
    return res.status(400).json({ success: false, message: 'Ticket is already paid' });
  }

  // Prevent duplicate payment attempts: return existing pending payment if present
  const pending = await query(
    `
    SELECT * FROM payments
    WHERE payment_type = 'ticket'
      AND status = 'pending'
      AND JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.ticket_id')) = ?
    ORDER BY created_at DESC
    LIMIT 1
  `,
    [String(ticketId)]
  );

  if (pending[0]) {
    return res.json({
      success: true,
      message: 'Payment already initiated. Please confirm on your phone.',
      data: {
        tx_ref: pending[0].transaction_ref,
        paymentId: pending[0].payment_id,
        status: pending[0].status
      }
    });
  }

  const amount = Number(ticket.price || 0);
  if (!amount || Number.isNaN(amount) || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid ticket price' });
  }

  // Fetch user email/full name if available for Flutterwave
  const users = await query('SELECT email, full_name, user_name FROM users WHERE id = ? LIMIT 1', [userId]);
  const user = users[0] || {};

  const paymentId = paymentService.generatePaymentId();
  const tx_ref = generateTxRef(ticketId);

  // Initiate Flutterwave charge
  const flwResp = await paymentService.initiateFlutterwaveTicketPayment({
    amount,
    phone,
    network: normalizedNetwork,
    tx_ref,
    email: user.email,
    fullname: user.full_name || user.user_name,
    ticketId,
    userId
  });

  // Save payment as PENDING
  await paymentService.recordPayment({
    payment_id: paymentId,
    transaction_ref: tx_ref,
    payment_type: 'ticket',
    amount,
    payment_method: 'flutterwave_momo',
    phone_number: phone,
    user_id: userId,
    status: 'pending',
    metadata: {
      gateway: 'flutterwave',
      ticket_id: String(ticketId),
      network: normalizedNetwork,
      flw: flwResp
    }
  });

  // Track selected payment method on ticket (status stays pending until webhook)
  await query(
    'UPDATE tickets SET payment_method = ? WHERE id = ? AND (payment_method IS NULL OR payment_method = "")',
    ['flutterwave_momo', ticketId]
  );

  return res.status(200).json({
    success: true,
    message: 'Payment initiated. Confirm payment on your phone.',
    data: {
      tx_ref,
      paymentId,
      status: 'pending'
    }
  });
});

/**
 * GET /api/pay-ticket/status/:txRef
 */
exports.payTicketStatus = asyncHandler(async (req, res) => {
  const { txRef } = req.params;
  if (!txRef) {
    return res.status(400).json({ success: false, message: 'txRef is required' });
  }

  const status = await paymentService.checkPaymentStatus(txRef);

  // Ownership check
  const userId = req.user?.id;
  const companyId = req.user?.company_id;
  if (status.userId && status.userId !== userId) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  if (status.companyId && companyId && status.companyId !== companyId) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  // If this is a ticket payment, return ticket too
  const ticketId = status?.metadata?.ticket_id;
  let ticket = null;
  if (ticketId) {
    const tickets = await query('SELECT * FROM tickets WHERE id = ? LIMIT 1', [ticketId]);
    ticket = tickets[0] || null;
  }

  return res.json({ success: true, data: { payment: status, ticket } });
});
