// controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/config');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Driver = require('../models/Driver');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendResetEmail } = require('../services/brevoMailer');
const smsService = require('../services/smsService');

/**
 * Generate JWT token
 */
const generateToken = (user, type) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role || 'user',
      type: type // 'admin', 'driver', 'user'
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expire }
  );
};

/**
 * @route   POST /api/auth/signup
 * @desc    Register new user
 * @access  Public
 */
exports.register = asyncHandler(async (req, res) => {
  const { username, email, password, role = 'user' } = req.body;
  console.log('🔐 Register attempt:', { email, username });

  // Validate input
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  if (!username || username.trim().length < 3) {
    return res.status(400).json({
      success: false,
      message: 'Username must be at least 3 characters'
    });
  }

  try {
    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      console.log('❌ Signup failed: Email already exists -', email);
      return res.status(409).json({
        success: false,
        message: 'Email already registered. Please login or use a different email.'
      });
    }

    // Optional: some adapters might not implement findByUsername
    let existingUsername = null;
    if (typeof User.findByUsername === 'function') {
      existingUsername = await User.findByUsername(username);
    }
    if (existingUsername) {
      console.log('❌ Signup failed: Username already exists -', username);
      return res.status(409).json({
        success: false,
        message: 'Username already taken. Please choose a different username.'
      });
    }

    // Create user
    const userId = await User.create({
      user_name: username,
      email,
      password,
      role
    });

    const user = await User.findById(userId);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        userId: `usr_${user.id}`,
        username: user.user_name,
        email: user.email,
        role: role
      }
    });
  } catch (err) {
    console.error('❌ Signup error:', err && err.message ? err.message : err);
    
    // Handle duplicate key errors
    let msg = err && err.message ? err.message : 'Signup failed';
    if (msg.includes('duplicate key') || msg.includes('already exists')) {
      if (msg.includes('user_name') || msg.includes('username')) {
        msg = 'Username already taken. Please choose a different username.';
      } else if (msg.includes('email')) {
        msg = 'Email already registered. Please login or use a different email.';
      } else {
        msg = 'This account already exists. Please use different credentials.';
      }
      return res.status(409).json({ success: false, message: msg });
    }
    
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * @route   POST /api/auth/signin
 * @desc    Login user (automatically detects user type)
 * @access  Public
 */
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  console.log('🔐 Login attempt:', { email });

  // First, try to find regular user
  const user = await User.findByEmail(email);

  if (user) {
    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }

    // Verify password
    console.log('🔑 Verifying password for user:', email);
    const isPasswordValid = await User.verifyPassword(password, user.password);

    if (!isPasswordValid) {
      console.log('❌ Login failed: invalid password for', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please check your credentials and try again.'
      });
    }

    console.log('✅ User login successful for:', email);

    // Generate token
    const token = generateToken(user, 'user');

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          userId: `usr_${user.id}`,
          username: user.user_name,
          email: user.email,
          role: user.role || 'user'
        }
      }
    });
  }

  // If not found as regular user, check if it's a company manager
  console.log('🔍 User not found, checking company managers...');
  const CompanyManager = require('../models/CompanyManager.supabase');
  
  try {
    const manager = await CompanyManager.findByEmail(email);

    if (manager) {
      console.log('✓ Found as company manager:', manager.name);

      // Check if manager is active
      if (manager.status !== 'active') {
        console.log('❌ Manager inactive');
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated.'
        });
      }

      // Verify password
      const isPasswordValid = await CompanyManager.validatePassword(manager, password);
      console.log('🔑 Manager password valid:', isPasswordValid);

      if (!isPasswordValid) {
        console.log('❌ Invalid password for manager');
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      console.log('✅ Company manager login successful for:', email);

      // Generate token with company_manager role
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

      return res.json({
        success: true,
        message: 'Company manager login successful',
        data: {
          token,
          user: {
            id: manager.id,
            name: manager.name,
            email: manager.email,
            role: 'company_manager',
            company_id: manager.company_id,
            phone: manager.phone,
            type: 'company_manager'
          }
        }
      });
    }

    // Neither user nor company manager found
    console.log('❌ No account found with email:', email);
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    throw error;
  }
});

/**
 * @route   POST /api/auth/admin/login
 * @desc    Login admin
 * @access  Public
 */
exports.adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find admin
  const admin = await Admin.findByEmail(email);

  if (!admin) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Check if admin is active
  if (!admin.is_active) {
    return res.status(403).json({
      success: false,
      message: 'Your account has been deactivated.'
    });
  }

  // Verify password
  const isPasswordValid = await Admin.verifyPassword(password, admin.password);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Generate token
  const token = generateToken(admin, 'admin');

  res.json({
    success: true,
    message: 'Admin login successful',
    data: {
      token,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        type: 'admin'
      }
    }
  });
});

/**
 * @route   POST /api/auth/driver/login
 * @desc    Login driver
 * @access  Public
 */
exports.driverLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find driver
  const driver = await Driver.findByEmail(email);

  if (!driver) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Check if driver is active
  if (!driver.is_active) {
    return res.status(403).json({
      success: false,
      message: 'Your account has been deactivated.'
    });
  }

  // Verify password
  const isPasswordValid = await Driver.verifyPassword(password, driver.password);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Generate token
  const token = generateToken(driver, 'driver');

  res.json({
    success: true,
    message: 'Driver login successful',
    data: {
      token,
      user: {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        role: 'driver',
        license_number: driver.license_number,
        plate_number: driver.plate_number,
        type: 'driver'
      }
    }
  });
});

/**
 * @route   POST /api/auth/company/signin
 * @desc    Login company manager
 * @access  Public
 */
exports.companyLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  console.log('🔐 Company login attempt:', email);

  // Use Supabase CompanyManager model
  const CompanyManager = require('../models/CompanyManager.supabase');
  
  try {
    const manager = await CompanyManager.findByEmail(email);

    if (!manager) {
      console.log('❌ No manager found with email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('✓ Manager found:', manager.name, '- Status:', manager.status);

    // Check if manager is active
    if (manager.status !== 'active') {
      console.log('❌ Manager inactive');
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated.'
      });
    }

    // Verify password using model method
    const isPasswordValid = await CompanyManager.validatePassword(manager, password);

    console.log('🔑 Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('❌ Invalid password');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token with company_manager role
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

    res.json({
      success: true,
      message: 'Company manager login successful',
      data: {
        token,
        user: {
          id: manager.id,
          name: manager.name,
          email: manager.email,
          role: 'company_manager',
          company_id: manager.company_id,
          phone: manager.phone,
          type: 'company_manager'
        }
      }
    });
  } catch (error) {
    console.error('❌ Company login error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login. Please try again.'
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
exports.getMe = asyncHandler(async (req, res) => {
  let userData;

  if (req.user.type === 'admin') {
    userData = await Admin.findById(req.user.id);
  } else if (req.user.type === 'driver') {
    userData = await Driver.findById(req.user.id);
  } else {
    userData = await User.findById(req.user.id);
  }

  if (!userData) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: {
      user: userData,
      type: req.user.type
    }
  });
});

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change password
 * @access  Private
 */
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  let Model;
  if (req.user.type === 'admin') {
    Model = Admin;
  } else if (req.user.type === 'driver') {
    Model = Driver;
  } else {
    Model = User;
  }

  // Get user with password
  const userData = req.user.type === 'admin' 
    ? await Admin.findByEmail(req.user.email)
    : req.user.type === 'driver'
    ? await Driver.findByEmail(req.user.email)
    : await User.findByEmail(req.user.email);

  // Verify current password
  const isPasswordValid = await Model.verifyPassword(currentPassword, userData.password);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  await Model.updatePassword(req.user.id, newPassword);

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findByEmail(email);

  if (!user) {
    // Don't reveal if user exists
    return res.json({
      success: true,
      message: 'If your email is registered, you will receive a password reset link'
    });
  }

  // Generate reset token
  const resetToken = jwt.sign(
    { id: user.id, email: user.email },
    config.jwt.secret,
    { expiresIn: '1h' }
  );

  // Send reset email (do not reveal user existence)
  const resetLink = `${config.frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
  try {
    await sendResetEmail(user.email, user.user_name || user.full_name || '', resetLink);
  } catch (err) {
    // Log but don't reveal details to client
    console.error('Failed to send reset email:', err && err.message ? err.message : err);
  }

  // Also send SMS if phone is available
  try {
    const phone = user.phone || user.phone_number || user.mobile;
    if (phone) {
      const smsMsg = `Reset your password: ${resetLink} (expires in 1 hour)`;
      const smsResp = await smsService.sendSMS(phone, smsMsg);
      if (!smsResp || !smsResp.success) {
        console.warn('SMS send may have failed for', phone, smsResp && smsResp.error);
      }
    }
  } catch (err) {
    console.error('Failed to send reset SMS:', err && err.message ? err.message : err);
  }

  res.json({
    success: true,
    message: 'If your email is registered, you will receive a password reset link'
  });
});

/**
 * @route POST /api/auth/request-otp
 * @desc  Request password reset OTP via phone
 * @access Public
 */
exports.requestOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ success: false, message: 'Phone is required' });

  const user = await User.findByPhone(phone);
  if (!user) {
    // Do not reveal existence
    return res.json({ success: true, message: 'If the phone is registered you will receive an OTP' });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

  await User.setResetOtp(user.id, otp, expiry);

  // Send via SMS using smsService (will use Brevo if configured)
  try {
    const smsResp = await smsService.sendSMS(phone, `Your password reset code is: ${otp}. It expires in 10 minutes.`);
    if (!smsResp || !smsResp.success) console.warn('OTP SMS send warning', smsResp && smsResp.error);
  } catch (err) {
    console.error('Failed to send OTP SMS:', err && err.message ? err.message : err);
  }

  res.json({ success: true, message: 'If the phone is registered you will receive an OTP' });
});

/**
 * @route POST /api/auth/reset-password-otp
 * @desc  Reset password using phone + OTP
 * @access Public
 */
exports.resetPasswordWithOtp = asyncHandler(async (req, res) => {
  const { phone, otp, newPassword } = req.body;
  if (!phone || !otp || !newPassword) return res.status(400).json({ success: false, message: 'phone, otp and newPassword are required' });

  const user = await User.findByPhone(phone);
  if (!user) return res.status(400).json({ success: false, message: 'Invalid OTP or phone' });

  // Verify OTP and expiry
  if (!user.reset_otp || String(user.reset_otp) !== String(otp)) {
    return res.status(400).json({ success: false, message: 'Invalid OTP' });
  }
  const now = new Date();
  const expiry = user.reset_otp_expiry ? new Date(user.reset_otp_expiry) : null;
  if (!expiry || expiry < now) {
    return res.status(400).json({ success: false, message: 'OTP expired' });
  }

  // Update password and clear OTP
  await User.updatePassword(user.id, newPassword);
  await User.clearResetOtp(user.id);

  res.json({ success: true, message: 'Password updated successfully' });
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password
 * @access  Public
 */
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  // Verify token
  let decoded;
  try {
    decoded = jwt.verify(token, config.jwt.secret);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired reset token'
    });
  }

  // Token is valid; extract user id and update password
  const userRecord = await User.findById(decoded.id);
  if (!userRecord) {
    return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
  }

  // Use upsert/update to change password; User.upsert will hash password when provided
  await User.upsert({ id: userRecord.id, password: newPassword });

  res.json({
    success: true,
    message: 'Password reset successfully. You can now login with your new password.'
  });
});

module.exports = exports;
