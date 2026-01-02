// controllers/driverController.js
const Driver = require('../models/Driver');

// @desc    Get all drivers
// @route   GET /api/drivers
// @access  Private (Admin gets all, Company gets their own)
exports.getDrivers = async (req, res, next) => {
  try {
    let drivers;
    
    // Company manager tokens carry company_id; scope to company.
    if (req.user.company_id) {
      drivers = await Driver.findByCompany(req.user.company_id);
    } else {
      drivers = await Driver.findAll();
    }
    
    res.status(200).json({
      success: true,
      count: drivers.length,
      data: drivers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single driver
// @route   GET /api/drivers/:id
// @access  Private/Admin
exports.getDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id);
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: driver,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create driver
// @route   POST /api/drivers
// @access  Private/Admin
exports.createDriver = async (req, res, next) => {
  try {
    const {
      name,
      driver_name,
      email,
      phone,
      password,
      license_number,
      category,
      plate_number,
      company_id
    } = req.body;

    const resolvedCompanyId = req.user.company_id || company_id;
    if (!resolvedCompanyId) {
      return res.status(400).json({
        success: false,
        message: 'company_id is required'
      });
    }
    
    const driverId = await Driver.create({
      company_id: resolvedCompanyId,
      name: name || driver_name,
      email,
      phone,
      password,
      license_number,
      category,
      plate_number
    });
    
    const driver = await Driver.findById(driverId);
    
    res.status(201).json({
      success: true,
      message: 'Driver created successfully',
      data: driver,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update driver
// @route   PUT /api/drivers/:id
// @access  Private/Admin
exports.updateDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id);
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found',
      });
    }
    
    // Don't allow password update through this endpoint
    const { password, ...updateData } = req.body;

    // Company managers can only update their own drivers
    if (req.user.company_id && driver.company_id !== req.user.company_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update drivers in your company.'
      });
    }
    
    await Driver.update(req.params.id, updateData);
    const updatedDriver = await Driver.findById(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Driver updated successfully',
      data: updatedDriver,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete driver
// @route   DELETE /api/drivers/:id
// @access  Private/Admin
exports.deleteDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id);
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found',
      });
    }

    // Company managers can only delete their own drivers
    if (req.user.company_id && driver.company_id !== req.user.company_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete drivers in your company.'
      });
    }
    
    await Driver.delete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Driver deleted successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get driver trip history
// @route   GET /api/drivers/:id/trips
// @access  Private/Admin/Driver
exports.getDriverTrips = async (req, res, next) => {
  try {
    const trips = await Driver.getTripHistory(req.params.id);
    
    res.status(200).json({
      success: true,
      count: trips.length,
      data: trips,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get driver's current trip
// @route   GET /api/drivers/:id/current-trip
// @access  Private/Driver
exports.getCurrentTrip = async (req, res, next) => {
  try {
    const trip = await Driver.getCurrentTrip(req.params.id);
    
    res.status(200).json({
      success: true,
      data: trip,
    });
  } catch (error) {
    next(error);
  }
};
