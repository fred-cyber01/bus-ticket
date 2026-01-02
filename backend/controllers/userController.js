// controllers/userController.js
const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const users = await User.findAll();
    const offset = (pageNum - 1) * limitNum;
    const pagedUsers = users.slice(offset, offset + limitNum);
    const totalPages = Math.max(1, Math.ceil(users.length / limitNum));
    
    res.status(200).json({
      success: true,
      count: pagedUsers.length,
      totalPages,
      currentPage: pageNum,
      data: pagedUsers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create user
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res, next) => {
  try {
    const { user_name, email, phone, password, full_name } = req.body;

    if (!user_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'user_name, email, and password are required',
      });
    }

    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Email is already in use',
      });
    }

    const userId = await User.create({ user_name, email, phone, password, full_name });
    const created = await User.findById(userId);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: created,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    // Don't allow password update through this endpoint
    const { password, ...updateData } = req.body;
    
    await User.update(req.params.id, updateData);
    const updatedUser = await User.findById(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    await User.delete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Block user (disable account)
// @route   POST /api/admin/users/:id/block
// @access  Private/Admin
exports.blockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const updated = await User.block(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User blocked successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unblock user (enable account)
// @route   POST /api/admin/users/:id/unblock
// @access  Private/Admin
exports.unblockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const updated = await User.unblock(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User unblocked successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};
