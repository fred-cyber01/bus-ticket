// routes/auth.js
const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validator');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const authController = require('../controllers/authController');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Role must be user or admin')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required')
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
];

const forgotPasswordValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address')
];

const requestOtpValidation = [
  body('phone').notEmpty().withMessage('Phone is required')
];

const resetOtpValidation = [
  body('phone').notEmpty().withMessage('Phone is required'),
  body('otp').notEmpty().withMessage('OTP is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
];

// Routes
router.post('/signup', authLimiter, registerValidation, validate, authController.register);
router.post('/signin', authLimiter, loginValidation, validate, authController.login);
router.post('/admin/signin', authLimiter, loginValidation, validate, authController.adminLogin);
router.post('/company/signin', authLimiter, loginValidation, validate, authController.companyLogin);
router.post('/driver/signin', authLimiter, loginValidation, validate, authController.driverLogin);

router.get('/me', authenticate, authController.getMe);
router.put('/change-password', authenticate, changePasswordValidation, validate, authController.changePassword);

router.post('/forgot-password', authLimiter, forgotPasswordValidation, validate, authController.forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordValidation, validate, authController.resetPassword);

// Phone OTP password reset
router.post('/request-otp', authLimiter, requestOtpValidation, validate, authController.requestOtp);
router.post('/reset-password-otp', authLimiter, resetOtpValidation, validate, authController.resetPasswordWithOtp);

module.exports = router;
