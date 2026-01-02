// controllers/stopController.js
const Stop = require('../models/Stop');

// @desc    Get all stops
// @route   GET /api/stops
// @access  Public
exports.getStops = async (req, res, next) => {
  try {
    const { route_id } = req.query;
    
    let stops;
    if (route_id) {
      stops = await Stop.findByRoute(route_id);
    } else {
      stops = await Stop.findAll();
    }
    
    res.status(200).json({
      success: true,
      count: stops.length,
      data: stops,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single stop
// @route   GET /api/stops/:id
// @access  Public
exports.getStop = async (req, res, next) => {
  try {
    const stop = await Stop.findById(req.params.id);
    
    if (!stop) {
      return res.status(404).json({
        success: false,
        message: 'Stop not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: stop,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create stop
// @route   POST /api/stops
// @access  Private/Admin
exports.createStop = async (req, res, next) => {
  try {
    const { stop_name, location } = req.body;
    
    const stopId = await Stop.create({
      name: stop_name,
      location,
    });
    
    const stop = await Stop.findById(stopId);
    
    res.status(201).json({
      success: true,
      message: 'Stop created successfully',
      data: stop,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update stop
// @route   PUT /api/stops/:id
// @access  Private/Admin
exports.updateStop = async (req, res, next) => {
  try {
    const stop = await Stop.findById(req.params.id);
    
    if (!stop) {
      return res.status(404).json({
        success: false,
        message: 'Stop not found',
      });
    }
    
    await Stop.update(req.params.id, req.body);
    const updatedStop = await Stop.findById(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Stop updated successfully',
      data: updatedStop,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete stop
// @route   DELETE /api/stops/:id
// @access  Private/Admin
exports.deleteStop = async (req, res, next) => {
  try {
    const stop = await Stop.findById(req.params.id);
    
    if (!stop) {
      return res.status(404).json({
        success: false,
        message: 'Stop not found',
      });
    }
    
    await Stop.delete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Stop deleted successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};
