// services/paymentService.js
const axios = require('axios');
const crypto = require('crypto');
const { query } = require('../config/database');
const moment = require('moment-timezone');

class PaymentService {
  constructor() {
    // Payment gateway configurations (in production, these would come from environment variables)
    this.mtnConfig = {
      apiKey: process.env.MTN_API_KEY || 'your_mtn_api_key_here',
      apiSecret: process.env.MTN_API_SECRET || 'your_mtn_api_secret_here',
      baseUrl: process.env.MTN_BASE_URL || 'https://api.mtn.com/v2',
      subscriptionKey: process.env.MTN_SUBSCRIPTION_KEY || 'your_subscription_key_here',
      targetEnvironment: process.env.MTN_TARGET_ENVIRONMENT || 'sandbox',
      callbackUrl: process.env.MTN_CALLBACK_URL || 'http://localhost:3000/api/webhooks/mtn',
      accessToken: null,
      tokenExpiry: null
    };

    this.airtelConfig = {
      apiKey: process.env.AIRTEL_API_KEY || 'test_airtel_api_key',
      apiSecret: process.env.AIRTEL_API_SECRET || 'test_airtel_api_secret',
      baseUrl: process.env.AIRTEL_BASE_URL || 'https://api.airtel.com/v1',
      callbackUrl: process.env.AIRTEL_CALLBACK_URL || 'http://localhost:3000/api/webhooks/airtel'
    };

    this.momopayConfig = {
      merchantId: process.env.MOMOPAY_MERCHANT_ID || 'test_merchant_id',
      apiKey: process.env.MOMOPAY_API_KEY || 'test_momopay_api_key',
      baseUrl: process.env.MOMOPAY_BASE_URL || 'https://api.momopay.rw/v1',
      callbackUrl: process.env.MOMOPAY_CALLBACK_URL || 'http://localhost:3000/api/webhooks/momopay'
    };

    this.bankTransferConfig = {
      bankCode: process.env.BANK_CODE || 'BK001',
      accountNumber: process.env.BANK_ACCOUNT || '1234567890',
      accountName: process.env.BANK_ACCOUNT_NAME || 'TicketBooking System'
    };

    this.flutterwaveConfig = {
      publicKey: process.env.FLW_PUBLIC_KEY,
      secretKey: process.env.FLW_SECRET_KEY,
      webhookSecret: process.env.FLW_WEBHOOK_SECRET,
      baseUrl: process.env.FLW_BASE_URL || 'https://api.flutterwave.com/v3'
    };
  }

  /**
   * Generate unique transaction reference
   */
  generateTransactionRef() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TXN-${timestamp}-${random}`;
  }

  /**
   * Generate payment ID
   */
  generatePaymentId() {
    return `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  /**
   * Record payment in database
   */
  async recordPayment(paymentData) {
    const {
      payment_id,
      transaction_ref,
      payment_type,
      amount,
      payment_method,
      phone_number,
      company_id,
      user_id,
      status = 'pending',
      metadata = {}
    } = paymentData;
    // Map to repository schema: payments table uses `transaction_ref`, `payment_type`, `amount`, `payment_method`, `phone_number`, `company_id`, `user_id`, `status`, `payment_data` (JSON), and optional `reference_id`.
    const paymentDataJson = Object.assign({}, metadata, { payment_id, transaction_ref });
    const referenceId = metadata && metadata.ticket_id ? metadata.ticket_id : (metadata.subscription_id || null);

    const sql = `
      INSERT INTO payments (
        transaction_ref, payment_type, amount, payment_method,
        phone_number, company_id, user_id, status, payment_data, reference_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const result = await query(sql, [
      transaction_ref,
      payment_type,
      amount,
      payment_method,
      phone_number,
      company_id || null,
      user_id || null,
      status,
      JSON.stringify(paymentDataJson),
      referenceId
    ]);

    return result.insertId;
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(paymentIdOrTransactionRef, status, transactionRef = null, metadata = {}) {
    // Prefer updating by transactionRef when provided; otherwise accept transaction_ref as identifier
    const params = [];
    let whereClause = '';

    if (transactionRef) {
      whereClause = 'WHERE transaction_ref = ?';
      params.push(transactionRef);
    } else if (String(paymentIdOrTransactionRef || '').startsWith('TXN-') || String(paymentIdOrTransactionRef || '').startsWith('txn-')) {
      // treat first arg as transaction ref
      whereClause = 'WHERE transaction_ref = ?';
      params.push(paymentIdOrTransactionRef);
    } else if (!isNaN(parseInt(paymentIdOrTransactionRef))) {
      // treat as internal id
      whereClause = 'WHERE id = ?';
      params.push(parseInt(paymentIdOrTransactionRef));
    } else {
      // fallback: cannot determine target
      throw new Error('Unable to determine payment record to update');
    }

    const updates = ['status = ?'];
    const updateParams = [status];

    if (metadata && Object.keys(metadata).length > 0) {
      updates.push('payment_data = ?');
      updateParams.push(JSON.stringify(metadata));
    }

    // Do not overwrite transaction_ref unless explicitly provided
    if (transactionRef) {
      updates.push('transaction_ref = ?');
      updateParams.push(transactionRef);
    }

    const sql = `UPDATE payments SET ${updates.join(', ')}, updated_at = NOW() ${whereClause}`;
    await query(sql, [...updateParams, ...params]);
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentIdOrTransactionRef) {
    if (!paymentIdOrTransactionRef) return null;
    // Try by transaction_ref first
    const byTx = await query('SELECT * FROM payments WHERE transaction_ref = ? LIMIT 1', [paymentIdOrTransactionRef]);
    if (byTx && byTx.length > 0) return byTx[0];
    // Try by numeric id
    if (!isNaN(parseInt(paymentIdOrTransactionRef))) {
      const byId = await query('SELECT * FROM payments WHERE id = ? LIMIT 1', [parseInt(paymentIdOrTransactionRef)]);
      return byId[0] || null;
    }
    // Otherwise null
    return null;
  }

  /**
   * Get payment by transaction reference
   */
  async getPaymentByTransactionRef(transactionRef) {
    const payments = await query('SELECT * FROM payments WHERE transaction_ref = ? LIMIT 1', [transactionRef]);
    return payments[0] || null;
  }

  /**
   * Initiate MTN Mobile Money payment
   */
  async initiateMTNPayment(paymentData) {
    const { amount, phone_number, metadata } = paymentData;
    const paymentId = this.generatePaymentId();
    const transactionRef = this.generateTransactionRef();

    try {
      // In production, this would make actual API call to MTN
      // For demo purposes, we'll simulate the payment initiation

      const mtnPayload = {
        amount: amount,
        currency: 'RWF',
        externalId: paymentId,
        payer: {
          partyIdType: 'MSISDN',
          partyId: phone_number
        },
        payerMessage: `Payment for ${metadata.plan_name || 'Service'}`,
        payeeNote: 'TicketBooking System Payment'
      };

      // Simulate API call
      console.log('MTN Payment Request:', mtnPayload);

      // Record payment and capture DB id
      const insertedId = await this.recordPayment({
        payment_id: paymentId,
        transaction_ref: transactionRef,
        payment_type: paymentData.payment_type,
        amount: amount,
        payment_method: 'mtn_momo',
        phone_number: phone_number,
        company_id: paymentData.company_id,
        user_id: paymentData.user_id,
        status: 'pending',
        metadata: {
          ...metadata,
          gateway: 'mtn',
          request_payload: mtnPayload
        }
      });

      // In production, MTN would return a transaction ID
      // For demo, we'll simulate success
      setTimeout(async () => {
        await this.simulatePaymentSuccess(paymentId, transactionRef);
      }, 5000); // Simulate 5 second processing

      return {
        success: true,
        paymentId: paymentId,
        transactionRef: transactionRef,
        dbId: insertedId,
        message: 'Payment initiated. Please check your phone for payment prompt.',
        status: 'pending'
      };

    } catch (error) {
      console.error('MTN Payment Error:', error);
      throw new Error('Failed to initiate MTN payment');
    }
  }

  /**
   * Initiate Airtel Money payment
   */
  async initiateAirtelPayment(paymentData) {
    const { amount, phone_number, metadata } = paymentData;
    const paymentId = this.generatePaymentId();
    const transactionRef = this.generateTransactionRef();

    try {
      const airtelPayload = {
        amount: amount,
        currency: 'RWF',
        reference: paymentId,
        subscriber_msisdn: phone_number,
        description: `Payment for ${metadata.plan_name || 'Service'}`
      };

      console.log('Airtel Payment Request:', airtelPayload);

      // Record payment and capture DB id
      const insertedId = await this.recordPayment({
        payment_id: paymentId,
        transaction_ref: transactionRef,
        payment_type: paymentData.payment_type,
        amount: amount,
        payment_method: 'airtel_money',
        phone_number: phone_number,
        company_id: paymentData.company_id,
        user_id: paymentData.user_id,
        status: 'pending',
        metadata: {
          ...metadata,
          gateway: 'airtel',
          request_payload: airtelPayload
        }
      });

      // Simulate payment success
      setTimeout(async () => {
        await this.simulatePaymentSuccess(paymentId, transactionRef);
      }, 3000);

      return {
        success: true,
        paymentId: paymentId,
        transactionRef: transactionRef,
        dbId: insertedId,
        message: 'Payment initiated. Please check your phone for payment prompt.',
        status: 'pending'
      };

    } catch (error) {
      console.error('Airtel Payment Error:', error);
      throw new Error('Failed to initiate Airtel payment');
    }
  }

  /**
   * Generate MoMoPay payment code
   */
  async generateMomoPayCode(paymentData) {
    const { amount, phone_number, metadata } = paymentData;
    const paymentId = this.generatePaymentId();
    const transactionRef = this.generateTransactionRef();

    try {
      // Generate a payment code for MoMoPay
      const paymentCode = `MP${Date.now().toString().slice(-8)}`;

      const momopayPayload = {
        merchantId: this.momopayConfig.merchantId,
        amount: amount,
        currency: 'RWF',
        paymentCode: paymentCode,
        phoneNumber: phone_number,
        description: `Payment for ${metadata.plan_name || 'Service'}`,
        callbackUrl: this.momopayConfig.callbackUrl
      };

      console.log('MoMoPay Payment Request:', momopayPayload);

      // Record payment and capture DB id
      const insertedId = await this.recordPayment({
        payment_id: paymentId,
        transaction_ref: transactionRef,
        payment_type: paymentData.payment_type,
        amount: amount,
        payment_method: 'momopay',
        phone_number: phone_number,
        company_id: paymentData.company_id,
        user_id: paymentData.user_id,
        status: 'pending',
        metadata: {
          ...metadata,
          gateway: 'momopay',
          payment_code: paymentCode,
          request_payload: momopayPayload
        }
      });

      // Simulate payment success
      setTimeout(async () => {
        await this.simulatePaymentSuccess(paymentId, transactionRef);
      }, 4000);

      return {
        success: true,
        paymentId: paymentId,
        transactionRef: transactionRef,
        dbId: insertedId,
        paymentCode: paymentCode,
        message: `Payment code generated: ${paymentCode}. Use this code to complete payment.`,
        status: 'pending'
      };

    } catch (error) {
      console.error('MoMoPay Payment Error:', error);
      throw new Error('Failed to generate MoMoPay payment code');
    }
  }

  /**
   * Generate Bank Transfer reference
   */
  async generateBankTransferReference(paymentData) {
    const { amount, metadata } = paymentData;
    const paymentId = this.generatePaymentId();
    const transactionRef = this.generateTransactionRef();

    try {
      const bankReference = `BT${Date.now().toString().slice(-10)}`;

      const bankTransferData = {
        reference: bankReference,
        amount: amount,
        currency: 'RWF',
        bankCode: this.bankTransferConfig.bankCode,
        accountNumber: this.bankTransferConfig.accountNumber,
        accountName: this.bankTransferConfig.accountName,
        description: `Payment for ${metadata.plan_name || 'Service'} - Ref: ${bankReference}`
      };

      console.log('Bank Transfer Details:', bankTransferData);

      // Record payment and capture DB id
      const insertedId = await this.recordPayment({
        payment_id: paymentId,
        transaction_ref: transactionRef,
        payment_type: paymentData.payment_type,
        amount: amount,
        payment_method: 'bank_transfer',
        phone_number: null,
        company_id: paymentData.company_id,
        user_id: paymentData.user_id,
        status: 'pending',
        metadata: {
          ...metadata,
          gateway: 'bank_transfer',
          bank_reference: bankReference,
          bank_details: bankTransferData
        }
      });

      return {
        success: true,
        paymentId: paymentId,
        transactionRef: transactionRef,
        dbId: insertedId,
        bankReference: bankReference,
        bankDetails: bankTransferData,
        message: 'Bank transfer reference generated. Please transfer funds to the provided account.',
        status: 'pending'
      };

    } catch (error) {
      console.error('Bank Transfer Error:', error);
      throw new Error('Failed to generate bank transfer reference');
    }
  }

  /**
   * Simulate payment success (for demo purposes)
   */
  async simulatePaymentSuccess(paymentId, transactionRef) {
    try {
      // Update payment status to completed
      await this.updatePaymentStatus(paymentId, 'completed', transactionRef, {
        completed_at: moment().tz('Africa/Kigali').format('YYYY-MM-DD HH:mm:ss'),
        simulation: true
      });

      // Get payment details by transaction reference
      const payment = await this.getPaymentByTransactionRef(transactionRef);
      if (!payment) return;

      // Handle different payment types
      if (payment.payment_type === 'subscription') {
        // Activate company subscription
        const subscriptionService = require('./subscriptionService');
        const meta = typeof payment.payment_data === 'string' ? (JSON.parse(payment.payment_data || '{}') || {}) : (payment.payment_data || {});
        await subscriptionService.subscribeToPlan(
          payment.company_id,
          meta.plan_id,
          paymentId
        );
      } else if (payment.payment_type === 'ticket') {
        // Confirm ticket payment
        const meta2 = typeof payment.payment_data === 'string' ? (JSON.parse(payment.payment_data || '{}') || {}) : (payment.payment_data || {});
        const ticketId = meta2 && (meta2.ticket_id || meta2.ticketId || meta2.reference_id || meta2.referenceId) ? (meta2.ticket_id || meta2.ticketId || meta2.reference_id || meta2.referenceId) : null;
        if (!ticketId) {
          console.warn('simulatePaymentSuccess: no ticket id found in payment metadata, skipping ticket update', { paymentId, transactionRef, metadata: meta2 });
        } else {
          await query(
            'UPDATE tickets SET payment_status = "completed", ticket_status = "confirmed" WHERE id = ?',
            [ticketId]
          );
        }
      }

      console.log(`Payment ${paymentId} marked as completed`);

    } catch (error) {
      console.error('Error simulating payment success:', error);
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(transactionRef) {
    const payment = await this.getPaymentByTransactionRef(transactionRef);

    if (!payment) {
      throw new Error('Payment not found');
    }

    return {
      paymentId: payment.transaction_ref || payment.id,
      transactionRef: payment.transaction_ref,
      status: payment.status,
      amount: payment.amount,
      paymentMethod: payment.payment_method,
      createdAt: payment.created_at,
      updatedAt: payment.updated_at,
      userId: payment.user_id,
      companyId: payment.company_id,
      metadata: typeof payment.payment_data === 'string'
        ? (JSON.parse(payment.payment_data || '{}') || {})
        : (payment.payment_data || {})
    };
  }

  /**
   * Flutterwave - Create Rwanda Mobile Money charge for ticket
   */
  async initiateFlutterwaveTicketPayment({
    amount,
    phone,
    network,
    tx_ref,
    email,
    fullname,
    ticketId,
    userId
  }) {
    if (!this.flutterwaveConfig.secretKey) {
      throw new Error('Flutterwave secret key not configured');
    }

    const payload = {
      tx_ref,
      amount,
      currency: 'RWF',
      email: email || 'customer@ticketbus.rw',
      phone_number: phone,
      fullname: fullname || 'Ticket Customer',
      // Flutterwave Rwanda MoMo requires network: MTN or AIRTEL
      network,
      // Optional: redirect_url for web flows (we use webhook + polling)
      redirect_url: process.env.FLW_REDIRECT_URL || undefined
    };

    const response = await axios.post(
      `${this.flutterwaveConfig.baseUrl}/charges?type=mobile_money_rwanda`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${this.flutterwaveConfig.secretKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    return response.data;
  }

  /**
   * Flutterwave - Verify transaction before marking paid
   */
  async verifyFlutterwaveTransaction({ transactionId }) {
    if (!this.flutterwaveConfig.secretKey) {
      throw new Error('Flutterwave secret key not configured');
    }

    const response = await axios.get(
      `${this.flutterwaveConfig.baseUrl}/transactions/${transactionId}/verify`,
      {
        headers: {
          Authorization: `Bearer ${this.flutterwaveConfig.secretKey}`
        },
        timeout: 30000
      }
    );

    return response.data;
  }

  /**
   * Get payment history for user/company
   */
  async getPaymentHistory(userId = null, companyId = null, limit = 50) {
    let sql = 'SELECT * FROM payments WHERE 1=1';
    const params = [];

    if (userId) {
      sql += ' AND user_id = ?';
      params.push(userId);
    }

    if (companyId) {
      sql += ' AND company_id = ?';
      params.push(companyId);
    }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const payments = await query(sql, params);

    return payments.map(payment => ({
      paymentId: payment.transaction_ref || payment.id,
      transactionRef: payment.transaction_ref,
      paymentType: payment.payment_type,
      amount: payment.amount,
      paymentMethod: payment.payment_method,
      status: payment.status,
      createdAt: payment.created_at,
      updatedAt: payment.updated_at,
      metadata: typeof payment.payment_data === 'string' ? (JSON.parse(payment.payment_data || '{}') || {}) : (payment.payment_data || {})
    }));
  }

  /**
   * Get all payments (Admin)
   */
  async getAllPayments(filters = {}, limit = 100) {
    let sql = 'SELECT * FROM payments WHERE 1=1';
    const params = [];

    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.payment_method) {
      sql += ' AND payment_method = ?';
      params.push(filters.payment_method);
    }

    if (filters.payment_type) {
      sql += ' AND payment_type = ?';
      params.push(filters.payment_type);
    }

    if (filters.date_from) {
      sql += ' AND created_at >= ?';
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      sql += ' AND created_at <= ?';
      params.push(filters.date_to);
    }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const payments = await query(sql, params);
    return payments;
  }

  /**
   * Get system earnings (Admin)
   */
  async getSystemEarnings(period = 'month') {
    let dateFormat;
    let groupBy;

    switch (period) {
      case 'day':
        dateFormat = '%Y-%m-%d';
        groupBy = 'DATE(created_at)';
        break;
      case 'week':
        dateFormat = '%Y-%u';
        groupBy = 'YEARWEEK(created_at)';
        break;
      case 'month':
      default:
        dateFormat = '%Y-%m';
        groupBy = 'DATE_FORMAT(created_at, "%Y-%m")';
        break;
    }

    const sql = `
      SELECT
        ${groupBy} as period,
        COUNT(*) as total_payments,
        SUM(amount) as total_amount,
        payment_type,
        payment_method
      FROM payments
      WHERE status = 'completed'
      GROUP BY ${groupBy}, payment_type, payment_method
      ORDER BY period DESC
    `;

    const earnings = await query(sql);

    // Calculate totals
    const totals = await query(`
      SELECT
        COUNT(*) as total_payments,
        SUM(amount) as total_amount,
        AVG(amount) as average_amount
      FROM payments
      WHERE status = 'completed'
    `);

    return {
      period: period,
      totals: totals[0],
      breakdown: earnings
    };
  }

  /**
   * Process withdrawal (Admin)
   */
  async processWithdrawal(amount, bankDetails) {
    // In production, this would integrate with banking APIs
    // For demo, we'll just record the withdrawal

    const withdrawalId = `WD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    await query(`
      INSERT INTO withdrawals (
        withdrawal_id, amount, bank_details, status, requested_at
      ) VALUES (?, ?, ?, 'pending', NOW())
    `, [withdrawalId, amount, JSON.stringify(bankDetails)]);

    return {
      success: true,
      withdrawalId: withdrawalId,
      message: 'Withdrawal request submitted successfully'
    };
  }
}

module.exports = new PaymentService();
