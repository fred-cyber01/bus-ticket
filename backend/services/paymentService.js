// services/paymentService.js
const axios = require('axios');
const crypto = require('crypto');
const supabase = require('../config/supabase');
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

    const { data, error } = await supabase.from('payments').insert([{
      transaction_ref,
      payment_type,
      amount,
      payment_method,
      phone_number,
      company_id: company_id || null,
      user_id: user_id || null,
      status,
      payment_data: paymentDataJson,
      reference_id: referenceId,
      created_at: moment().tz('Africa/Kigali').format('YYYY-MM-DD HH:mm:ss')
    }]).select('id').single();

    if (error) throw error;
    return data.id;
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(paymentIdOrTransactionRef, status, transactionRef = null, metadata = {}) {
    try {
      const updateData = {
        status,
        updated_at: moment().tz('Africa/Kigali').format('YYYY-MM-DD HH:mm:ss')
      };

      if (metadata && Object.keys(metadata).length > 0) {
        updateData.payment_data = metadata;
      }

      if (transactionRef) {
        updateData.transaction_ref = transactionRef;
      }

      // Determine which field to query by
      let query = supabase.from('payments');
      
      if (transactionRef) {
        query = query.eq('transaction_ref', transactionRef);
      } else if (String(paymentIdOrTransactionRef || '').startsWith('TXN-') || String(paymentIdOrTransactionRef || '').startsWith('txn-')) {
        query = query.eq('transaction_ref', paymentIdOrTransactionRef);
      } else if (!isNaN(parseInt(paymentIdOrTransactionRef))) {
        query = query.eq('id', parseInt(paymentIdOrTransactionRef));
      } else {
        throw new Error('Unable to determine payment record to update');
      }

      const { error } = await query.update(updateData);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentIdOrTransactionRef) {
    if (!paymentIdOrTransactionRef) return null;
    
    try {
      // Try by transaction_ref first
      let { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('transaction_ref', paymentIdOrTransactionRef)
        .limit(1)
        .single();
      
      if (data) return data;
      
      // Try by numeric id if not found and it's a number
      if (!isNaN(parseInt(paymentIdOrTransactionRef))) {
        const result = await supabase
          .from('payments')
          .select('*')
          .eq('id', parseInt(paymentIdOrTransactionRef))
          .limit(1)
          .single();
        
        return result.data || null;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting payment:', error);
      return null;
    }
  }

  /**
   * Get payment by transaction reference
   */
  async getPaymentByTransactionRef(transactionRef) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('transaction_ref', transactionRef)
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Error getting payment by transaction ref:', error);
      return null;
    }
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
          await supabase
            .from('tickets')
            .update({
              payment_status: 'completed',
              ticket_status: 'confirmed',
              updated_at: moment().tz('Africa/Kigali').format('YYYY-MM-DD HH:mm:ss')
            })
            .eq('id', ticketId);
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
    try {
      let query = supabase.from('payments').select('*');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      query = query.order('created_at', { ascending: false }).limit(limit);

      const { data: payments, error } = await query;

      if (error) throw error;

      return (payments || []).map(payment => ({
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
    } catch (error) {
      console.error('Error fetching payment history:', error);
      return [];
    }
  }

  /**
   * Get all payments (Admin)
   */
  async getAllPayments(filters = {}, limit = 100) {
    try {
      let query = supabase.from('payments').select('*');

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.payment_method) {
        query = query.eq('payment_method', filters.payment_method);
      }

      if (filters.payment_type) {
        query = query.eq('payment_type', filters.payment_type);
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      query = query.order('created_at', { ascending: false }).limit(limit);

      const { data: payments, error } = await query;

      if (error) throw error;
      return payments || [];
    } catch (error) {
      console.error('Error fetching all payments:', error);
      return [];
    }
  }

  /**
   * Get system earnings (Admin)
   */
  async getSystemEarnings(period = 'month') {
    try {
      // Fetch completed payments
      const { data: completedPayments, error } = await supabase
        .from('payments')
        .select('amount, payment_type, payment_method, created_at')
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const payments = completedPayments || [];

      // Calculate totals
      const total_payments = payments.length;
      const total_amount = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      const average_amount = total_payments > 0 ? total_amount / total_payments : 0;

      // Group by type and method for breakdown
      const breakdown = {};
      payments.forEach(p => {
        const key = `${p.payment_type}-${p.payment_method}`;
        if (!breakdown[key]) {
          breakdown[key] = {
            payment_type: p.payment_type,
            payment_method: p.payment_method,
            total_payments: 0,
            total_amount: 0
          };
        }
        breakdown[key].total_payments++;
        breakdown[key].total_amount += parseFloat(p.amount || 0);
      });

      return {
        period: period,
        totals: {
          total_payments,
          total_amount,
          average_amount
        },
        breakdown: Object.values(breakdown)
      };
    } catch (error) {
      console.error('Error fetching system earnings:', error);
      return {
        period: period,
        totals: { total_payments: 0, total_amount: 0, average_amount: 0 },
        breakdown: []
      };
    }
  }

  /**
   * Process withdrawal (Admin)
   */
  async processWithdrawal(amount, bankDetails) {
    try {
      // In production, this would integrate with banking APIs
      // For demo, we'll just record the withdrawal

      const withdrawalId = `WD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const { error } = await supabase.from('withdrawals').insert([{
        withdrawal_id: withdrawalId,
        amount: amount,
        bank_details: bankDetails,
        status: 'pending',
        requested_at: moment().tz('Africa/Kigali').format('YYYY-MM-DD HH:mm:ss')
      }]);

      if (error) throw error;

      return {
        success: true,
        withdrawalId: withdrawalId,
        message: 'Withdrawal request submitted successfully'
      };
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      return {
        success: false,
        message: 'Failed to process withdrawal request'
      };
    }
  }
}

module.exports = new PaymentService();
