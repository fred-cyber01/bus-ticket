// controllers/routeController.js
const Route = require('../models/Route');
const Stop = require('../models/Stop');

const normalizeRoute = (route) => {
  if (!route) return route;
  return {
    ...route,
    route_name: route.route_name ?? route.name,
    origin_name: route.origin_name ?? route.origin_stop_name,
    destination_name: route.destination_name ?? route.destination_stop_name,
    distance: route.distance ?? route.distance_km,
  };
};

// @desc    Get all routes
// @route   GET /api/routes
// @access  Public
exports.getRoutes = async (req, res, next) => {
  try {
    const routes = await Route.findAll();
    
    res.status(200).json({
      success: true,
      count: routes.length,
      data: routes.map(normalizeRoute),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single route
// @route   GET /api/routes/:id
// @access  Public
exports.getRoute = async (req, res, next) => {
  try {
    const route = await Route.findById(req.params.id);
    
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: normalizeRoute(route),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create route
// @route   POST /api/routes
// @access  Private/Admin
exports.createRoute = async (req, res, next) => {
  try {
    const name = req.body.name ?? req.body.route_name;
    const origin_stop_id = req.body.origin_stop_id ?? req.body.origin_id;
    const destination_stop_id = req.body.destination_stop_id ?? req.body.destination_id;
    const origin_stop_name = req.body.origin_stop_name ?? req.body.origin_name ?? req.body.origin ?? null;
    const destination_stop_name = req.body.destination_stop_name ?? req.body.destination_name ?? req.body.destination ?? null;
    const description = req.body.description ?? null;
    const distance_km = req.body.distance_km ?? req.body.distance ?? null;
    const isCompanyUser = req.user?.type === 'company_manager' || req.user?.type === 'company';
    const company_id = isCompanyUser ? req.user.company_id : (req.body.company_id ?? null);

    if (!isCompanyUser && !company_id) {
      return res.status(400).json({
        success: false,
        message: 'company_id is required when creating a route as admin'
      });
    }

    // Resolve typed stops to IDs (and auto-create if missing)
    const originStop = origin_stop_id
      ? await Stop.findById(origin_stop_id)
      : (origin_stop_name ? await Stop.findOrCreateByName(origin_stop_name) : null);
    const destinationStop = destination_stop_id
      ? await Stop.findById(destination_stop_id)
      : (destination_stop_name ? await Stop.findOrCreateByName(destination_stop_name) : null);

    const resolvedOriginId = originStop?.id ?? origin_stop_id;
    const resolvedDestinationId = destinationStop?.id ?? destination_stop_id;
    const resolvedName = name ?? ((originStop?.name || origin_stop_name) && (destinationStop?.name || destination_stop_name)
      ? `${originStop?.name || String(origin_stop_name).trim()} - ${destinationStop?.name || String(destination_stop_name).trim()}`
      : null);

    if (!resolvedName || !resolvedOriginId || !resolvedDestinationId) {
      return res.status(400).json({
        success: false,
        message: 'route_name (or name), and origin/destination (id or name) are required'
      });
    }
    
    const routeId = await Route.create({
      company_id,
      name: resolvedName,
      origin_stop_id: resolvedOriginId,
      destination_stop_id: resolvedDestinationId,
      description,
      distance_km,
    });
    
    const route = await Route.findById(routeId);
    
    res.status(201).json({
      success: true,
      message: 'Route created successfully',
      data: normalizeRoute(route),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update route
// @route   PUT /api/routes/:id
// @access  Private/Admin
exports.updateRoute = async (req, res, next) => {
  try {
    const route = await Route.findById(req.params.id);
    
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found',
      });
    }

    const isCompanyUser = req.user?.type === 'company_manager' || req.user?.type === 'company';
    if (isCompanyUser && String(route.company_id) !== String(req.user.company_id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only modify routes for your company.'
      });
    }
    
    const bodyName = req.body.name ?? req.body.route_name;
    const bodyOriginId = req.body.origin_stop_id ?? req.body.origin_id;
    const bodyDestinationId = req.body.destination_stop_id ?? req.body.destination_id;
    const bodyOriginName = req.body.origin_stop_name ?? req.body.origin_name ?? req.body.origin ?? null;
    const bodyDestinationName = req.body.destination_stop_name ?? req.body.destination_name ?? req.body.destination ?? null;

    const originStop = bodyOriginId
      ? await Stop.findById(bodyOriginId)
      : (bodyOriginName ? await Stop.findOrCreateByName(bodyOriginName) : null);
    const destinationStop = bodyDestinationId
      ? await Stop.findById(bodyDestinationId)
      : (bodyDestinationName ? await Stop.findOrCreateByName(bodyDestinationName) : null);

    const resolvedOriginId = originStop?.id ?? bodyOriginId ?? route.origin_stop_id;
    const resolvedDestinationId = destinationStop?.id ?? bodyDestinationId ?? route.destination_stop_id;
    const resolvedName = bodyName ?? route.name;

    const payload = {
      name: resolvedName,
      origin_stop_id: resolvedOriginId,
      destination_stop_id: resolvedDestinationId,
      description: (req.body.description !== undefined ? req.body.description : route.description) ?? null,
      distance_km: (req.body.distance_km ?? req.body.distance ?? route.distance_km) ?? null,
      is_active: req.body.is_active
    };

    await Route.update(req.params.id, payload);
    const updatedRoute = await Route.findById(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Route updated successfully',
      data: normalizeRoute(updatedRoute),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete route
// @route   DELETE /api/routes/:id
// @access  Private/Admin
exports.deleteRoute = async (req, res, next) => {
  try {
    const route = await Route.findById(req.params.id);
    
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found',
      });
    }

    const isCompanyUser = req.user?.type === 'company_manager' || req.user?.type === 'company';
    if (isCompanyUser && String(route.company_id) !== String(req.user.company_id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete routes for your company.'
      });
    }
    
    await Route.delete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Route deleted successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get route stops with details
// @route   GET /api/routes/:id/stops
// @access  Public
exports.getRouteStops = async (req, res, next) => {
  try {
    const stops = await Route.getStops(req.params.id);
    
    res.status(200).json({
      success: true,
      count: stops.length,
      data: stops,
    });
  } catch (error) {
    next(error);
  }
};
