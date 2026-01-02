// middleware/auth.js
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { query } = require('../config/database');

/**
 * Verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Attach user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      type: decoded.type, // 'admin', 'driver', 'user', 'company_manager'
      company_id: decoded.company_id
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token. Authentication failed.'
    });
  }
};

/**
 * Check if user is admin
 */
const isAdmin = (req, res, next) => {
  if (req.user.type !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

/**
 * Check if user is driver
 */
const isDriver = (req, res, next) => {
  if (req.user.type !== 'driver') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Driver privileges required.'
    });
  }
  next();
};

/**
 * Check if user is regular user
 */
const isUser = (req, res, next) => {
  if (req.user.type !== 'user') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. User privileges required.'
    });
  }
  next();
};

/**
 * Allow admin or driver
 */
const isAdminOrDriver = (req, res, next) => {
  if (req.user.type !== 'admin' && req.user.type !== 'driver') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin or Driver privileges required.'
    });
  }
  next();
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret);
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        type: decoded.type,
        company_id: decoded.company_id
      };
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

/**
 * Check if user is company manager
 */
const isCompany = (req, res, next) => {
  if (req.user.type !== 'company' && req.user.type !== 'company_manager') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Company privileges required.'
    });
  }
  next();
};

/**
 * Allow admin or company manager
 */
const isAdminOrCompany = (req, res, next) => {
  if (req.user.type !== 'admin' && req.user.type !== 'company_manager' && req.user.type !== 'company') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin or Company privileges required.'
    });
  }
  next();
};

module.exports = {
  authenticate,
  isAdmin,
  isDriver,
  isUser,
  isAdminOrDriver,
  optionalAuth,
  isCompany,
  isAdminOrCompany
};
