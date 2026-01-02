// controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/config');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Driver = require('../models/Driver');
const { asyncHandler } = require('../middleware/errorHandler');

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

  // Check if user exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'Email already exists'
    });
  }

  const existingUsername = await User.findByUsername(username);
  if (existingUsername) {
    return res.status(409).json({
      success: false,
      message: 'Username already taken'
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
});

/**
 * @route   POST /api/auth/signin
 * @desc    Login user
 * @access  Public
 */
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user
  const user = await User.findByEmail(email);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if user is active
  if (!user.is_active) {
    return res.status(401).json({
      success: false,
      message: 'Your account has been deactivated'
    });
  }

  // Verify password
  const isPasswordValid = await User.verifyPassword(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Generate token
  const token = generateToken(user, 'user');

  res.json({
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

  // Query company_managers table directly
  const db = require('../config/database');
  const managers = await db.query(
    'SELECT * FROM company_managers WHERE email = ?',
    [email]
  );

  console.log('📊 Query result:', managers.length, 'records found');

  if (!managers || managers.length === 0) {
    console.log('❌ No manager found with email:', email);
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  const manager = managers[0];
  console.log('✓ Manager found:', manager.name, '- Status:', manager.status);

  // Check if manager is active
  if (manager.status !== 'active') {
    console.log('❌ Manager inactive');
    return res.status(403).json({
      success: false,
      message: 'Your account has been deactivated.'
    });
  }

  // Verify password
  const bcrypt = require('bcryptjs');
  const isPasswordValid = await bcrypt.compare(password, manager.password);

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

  // Save token to database
  const expiry = new Date(Date.now() + 3600000); // 1 hour
  await User.setResetToken(email, resetToken, expiry);

  // TODO: Send email with reset link
  // For now, return the token (remove in production)
  
  res.json({
    success: true,
    message: 'Password reset instructions have been sent to your email',
    // Remove in production:
    resetToken: resetToken,
    resetLink: `${config.frontendUrl}/reset-password?token=${resetToken}`
  });
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

  // Find user by reset token
  const user = await User.findByResetToken(token);

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired reset token'
    });
  }

  // Update password
  await User.updatePassword(user.id, newPassword);

  // Clear reset token
  await User.clearResetToken(user.id);

  res.json({
    success: true,
    message: 'Password reset successfully. You can now login with your new password.'
  });
});

module.exports = exports;
