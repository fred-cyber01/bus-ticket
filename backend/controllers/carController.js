// controllers/carController.js
const Car = require('../models/Car');

const normalizeCar = (car) => {
  if (!car) return car;
  return {
    ...car,
    total_seats: car.total_seats ?? car.capacity,
    bus_type: car.bus_type ?? car.type,
  };
};

// @desc    Get all cars
// @route   GET /api/cars
// @access  Public
exports.getCars = async (req, res, next) => {
  try {
    const { company_id, route_id } = req.query;
    
    let cars;
    // If authenticated as company manager and no filter provided, default to own company.
    if (!company_id && req.user && req.user.company_id) {
      cars = await Car.findByCompany(req.user.company_id, true);
    } else if (company_id) {
      cars = await Car.findByCompany(company_id);
    } else if (route_id) {
      cars = await Car.findByRoute(route_id);
    } else {
      cars = await Car.findAll();
    }
    
    res.status(200).json({
      success: true,
      count: cars.length,
      data: cars.map(normalizeCar),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single car
// @route   GET /api/cars/:id
// @access  Public
exports.getCar = async (req, res, next) => {
  try {
    const car = await Car.findById(req.params.id);
    
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: normalizeCar(car),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create car
// @route   POST /api/cars
// @access  Private/Admin
exports.createCar = async (req, res, next) => {
  try {
    const plate_number = req.body.plate_number;
    const capacity = req.body.capacity ?? req.body.total_seats;
    const type = req.body.type ?? req.body.bus_type ?? null;
    const park = req.body.park ?? null;
    const name = req.body.name ?? `${type || 'Bus'} ${plate_number}`;

    const company_id = req.user?.company_id ?? req.body.company_id;

    if (!company_id) {
      return res.status(400).json({
        success: false,
        message: 'company_id is required'
      });
    }

    if (!plate_number || capacity == null) {
      return res.status(400).json({
        success: false,
        message: 'plate_number and total_seats (or capacity) are required'
      });
    }
    
    const carId = await Car.create({
      plate_number,
      company_id,
      name,
      type,
      park,
      capacity,
    });
    
    const car = await Car.findById(carId);
    
    res.status(201).json({
      success: true,
      message: 'Car created successfully',
      data: normalizeCar(car),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update car
// @route   PUT /api/cars/:id
// @access  Private/Admin
exports.updateCar = async (req, res, next) => {
  try {
    const car = await Car.findById(req.params.id);
    
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found',
      });
    }
    
    if (req.user?.company_id && car.company_id !== req.user.company_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update buses in your company.'
      });
    }

    const payload = {
      company_id: req.user?.company_id ?? req.body.company_id ?? car.company_id,
      plate_number: req.body.plate_number ?? car.plate_number,
      name: req.body.name ?? car.name,
      type: req.body.type ?? req.body.bus_type ?? car.type,
      park: req.body.park ?? car.park,
      capacity: req.body.capacity ?? req.body.total_seats ?? car.capacity,
      is_active: req.body.is_active
    };

    await Car.update(req.params.id, payload);
    const updatedCar = await Car.findById(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Car updated successfully',
      data: normalizeCar(updatedCar),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete car
// @route   DELETE /api/cars/:id
// @access  Private/Admin
exports.deleteCar = async (req, res, next) => {
  try {
    const car = await Car.findById(req.params.id);
    
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found',
      });
    }
    
    if (req.user?.company_id && car.company_id !== req.user.company_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete buses in your company.'
      });
    }

    await Car.delete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Car deleted successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};
