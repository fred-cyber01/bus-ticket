// routes/companyAuth.js
const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validator');
const { authLimiter } = require('../middleware/rateLimiter');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const db = require('../config/database');
const subscriptionService = require('../services/subscriptionService');
const paymentService = require('../services/paymentService');
const DEFAULT_FREE_BUS_LIMIT = 30;

// Validation rules
const companyRegisterValidation = [
  body('company_name').trim().isLength({ min: 3 }).withMessage('Company name must be at least 3 characters'),
  body('tin').trim().matches(/^\d{9}$/).withMessage('TIN must be exactly 9 digits'),
  body('contact_info').trim().notEmpty().withMessage('Contact information is required'),
  body('manager_name').trim().isLength({ min: 3 }).withMessage('Manager name must be at least 3 characters'),
  body('manager_email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('manager_phone').trim().notEmpty().withMessage('Phone number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('plan_id').optional({ nullable: true, checkFalsy: true }).isInt({ min: 1 }).withMessage('Please select a subscription plan'),
  body('payment_method').optional({ nullable: true, checkFalsy: true }).isIn(['mtn_momo', 'airtel_money', 'momopay', 'bank_transfer']).withMessage('Invalid payment method'),
  body('phone_number').optional({ nullable: true, checkFalsy: true }).trim().notEmpty().withMessage('Phone number is required for mobile payment')
];

const companyLoginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required')
];

// @desc    Register new company with subscription plan
// @route   POST /api/company-auth/register
// @access  Public
router.post('/register', authLimiter, companyRegisterValidation, validate, async (req, res, next) => {
  try {
    const {
      company_name,
      tin,
      contact_info,
      manager_name,
      manager_email,
      manager_phone,
      password,
      plan_id,
      payment_method,
      phone_number
    } = req.body;

    // Check if TIN already exists
    const existingCompany = await db.queryOne('SELECT id FROM companies WHERE tin = ?', [tin]);
    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: 'A company with this TIN is already registered'
      });
    }

    // Check if email already exists
    const existingManager = await db.queryOne('SELECT id FROM company_managers WHERE email = ?', [manager_email]);
    if (existingManager) {
      return res.status(400).json({
        success: false,
        message: 'This email is already registered'
      });
    }

    // Get subscription plan details (plan_id is optional)
    let plan = null;
    if (plan_id) {
      plan = await subscriptionService.getPlanById(plan_id);
      if (!plan) {
        return res.status(404).json({
          success: false,
          message: 'Subscription plan not found'
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const retryableMysqlCodes = new Set(['ER_LOCK_DEADLOCK', 'ER_LOCK_WAIT_TIMEOUT']);
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const connection = await db.getConnection();
      await connection.beginTransaction();

      try {
        // Create company (pending approval status)
        const initialBusLimit = plan ? plan.bus_limit : DEFAULT_FREE_BUS_LIMIT;
        const [companyResult] = await connection.query(
          `INSERT INTO companies (company_name, tin, contact_info, status, subscription_status, current_plan_id, bus_limit) 
           VALUES (?, ?, ?, 'pending', 'expired', ?, ?)`,
          [company_name, tin, contact_info, plan_id || null, initialBusLimit]
        );
        const companyId = companyResult.insertId;

        // Create company manager
        const [managerResult] = await connection.query(
          `INSERT INTO company_managers (company_id, name, email, phone, password, role, status) 
           VALUES (?, ?, ?, ?, ?, 'owner', 'active')`,
          [companyId, manager_name, manager_email, manager_phone, hashedPassword]
        );
        const managerId = managerResult.insertId;

        let subscriptionId = null;
        let paymentId = null;
        let responseMessage = '';

        // Handle FREE TRIAL (no plan_id provided or plan is free)
        if (!plan || plan.name === 'Free Trial' || plan.price === 0) {
          const trialResult = await subscriptionService.startFreeTrial(companyId, plan_id, connection);
          subscriptionId = trialResult.subscriptionId;
          plan = trialResult.plan || plan;

          responseMessage = `Company registered successfully with ${plan.duration_days}-day free trial! Your account is pending admin approval.`;
        }
        // Handle PAID PLANS (Standard/Premium)
        else {
          if (!payment_method) {
            await connection.rollback();
            return res.status(400).json({
              success: false,
              message: 'Payment method is required for paid plans'
            });
          }

          if ((payment_method === 'mtn_momo' || payment_method === 'airtel_money' || payment_method === 'momopay') && !phone_number) {
            await connection.rollback();
            return res.status(400).json({
              success: false,
              message: 'Phone number is required for mobile money payment'
            });
          }

          // Initiate payment
          let paymentResult;
          const paymentData = {
            company_id: companyId,
            payment_type: 'subscription',
            amount: plan.price,
            payment_method,
            phone_number: phone_number || manager_phone,
            metadata: {
              plan_id,
              plan_name: plan.name,
              company_name,
              manager_email
            }
          };

          switch (payment_method) {
            case 'mtn_momo':
              paymentResult = await paymentService.initiateMTNPayment(paymentData);
              break;
            case 'airtel_money':
              paymentResult = await paymentService.initiateAirtelPayment(paymentData);
              break;
            case 'momopay':
              paymentResult = await paymentService.generateMomoPayCode(paymentData);
              break;
            case 'bank_transfer':
              paymentResult = await paymentService.generateBankTransferReference(paymentData);
              break;
          }

          paymentId = paymentResult.dbId || null;

          // Create subscription in pending state (will activate on payment confirmation)
          const [subscriptionResult] = await connection.query(
            `INSERT INTO company_subscriptions (company_id, plan_id, payment_id, start_date, end_date, amount_paid, status, auto_renew) 
             VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL ? DAY), ?, 'expired', 0)`,
            [companyId, plan_id, paymentId, plan.duration_days, plan.price]
          );
          subscriptionId = subscriptionResult.insertId;

          responseMessage = `Company registered successfully! Please complete payment to activate your ${plan.name} subscription. Your account is pending admin approval.`;
        }

        await connection.commit();

        // Generate JWT token for manager
        const token = jwt.sign(
          { id: managerId, email: manager_email, role: 'company_manager', company_id: companyId, type: 'company_manager' },
          config.jwt.secret,
          { expiresIn: config.jwt.expire }
        );

        return res.status(201).json({
          success: true,
          message: responseMessage,
          data: {
            company_id: companyId,
            manager_id: managerId,
            subscription_id: subscriptionId,
            payment_id: paymentId,
            plan: {
              name: plan.name,
              price: plan.price,
              bus_limit: plan.bus_limit,
              duration_days: plan.duration_days
            },
            token,
            manager: {
              name: manager_name,
              email: manager_email,
              phone: manager_phone
            }
          }
        });
      } catch (error) {
        await connection.rollback();

        const shouldRetry = retryableMysqlCodes.has(error?.code) && attempt < maxAttempts;
        if (!shouldRetry) {
          throw error;
        }

        const delayMs = 150 * attempt;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } finally {
        connection.release();
      }
    }

  } catch (error) {
    next(error);
  }
});

// @desc    Login company manager
// @route   POST /api/company-auth/login
// @access  Public
router.post('/login', authLimiter, companyLoginValidation, validate, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find manager
    const manager = await db.queryOne(
      'SELECT * FROM company_managers WHERE email = ?',
      [email]
    );

    if (!manager) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if manager is active
    if (manager.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, manager.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Get company details
    const company = await db.queryOne(
      'SELECT * FROM companies WHERE id = ?',
      [manager.company_id]
    );

    // Check company status
    if (company.status === 'blocked') {
      return res.status(403).json({
        success: false,
        message: 'Your company has been blocked. Please contact admin.'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: manager.id, 
        email: manager.email, 
        role: 'company_manager', 
        company_id: manager.company_id,
        type: 'company_manager'
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expire }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        manager: {
          id: manager.id,
          name: manager.name,
          email: manager.email,
          phone: manager.phone,
          role: manager.role
        },
        company: {
          id: company.id,
          name: company.company_name,
          status: company.status,
          subscription_status: company.subscription_status,
          plan_id: company.current_plan_id,
          bus_limit: company.bus_limit,
          subscription_expires_at: company.subscription_expires_at
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
