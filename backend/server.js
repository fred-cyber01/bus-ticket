// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

const config = require('./config/config');
const { initDb, testConnection } = require('./config/database');
const { ensureSchema } = require('./scripts/ensureSchema');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/auth');
const companyAuthRoutes = require('./routes/companyAuth');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admins');
const driverRoutes = require('./routes/drivers');
const companyRoutes = require('./routes/companies');
const carRoutes = require('./routes/cars');
const stopRoutes = require('./routes/stops');
const routeRoutes = require('./routes/routes');
const tripRoutes = require('./routes/trips');
const bookingRoutes = require('./routes/tickets'); // Still using tickets file internally
const scheduleRoutes = require('./routes/schedules');
const dashboardRoutes = require('./routes/dashboard');
const paymentRoutes = require('./routes/payments');
const subscriptionRoutes = require('./routes/subscriptions');
const webhookRoutes = require('./routes/webhooks');
const flutterwaveRoutes = require('./routes/flutterwave');
const payTicketRoutes = require('./routes/payTicket');
const companyManagerRoutes = require('./routes/company');

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS middleware with full headers
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = config.corsOrigins;
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins in development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Compression middleware
app.use(compression());

// Logging middleware
if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting: apply only in production to avoid development 429s
if (config.env === 'production') {
  app.use('/api/', apiLimiter);
} else {
  console.log('Rate limiter is disabled in non-production environment');
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: config.env
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/company-auth', companyAuthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin/users', userRoutes); // Alias to match frontend admin user endpoints
app.use('/api/admins', adminRoutes);
app.use('/api/admin', adminRoutes); // Alias for admin routes
app.use('/api/drivers', driverRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/admin/companies', companyRoutes); // Admin can access via /api/admin/companies
app.use('/api/cars', carRoutes);
app.use('/api/stops', stopRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/tickets', bookingRoutes); // Alias for bookings
app.use('/api/schedules', scheduleRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin/payments', paymentRoutes); // Admin can access via /api/admin/payments
app.use('/api', payTicketRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/flutterwave', flutterwaveRoutes);
app.use('/api/company', companyManagerRoutes);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Initialize server
const PORT = config.port;

const startServer = async () => {
  try {
    // Initialize MySQL database connection
    await initDb();
    
    // Test database connection
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Ensure schema compatibility (supports older SQL dumps)
    try {
      await ensureSchema();
    } catch (schemaError) {
      console.error('Schema compatibility check failed:', schemaError.message);
      // Don't hard-fail; app can still run if DB is already correct.
    }

    // Start listening
    app.listen(PORT, () => {
      console.log('╔════════════════════════════════════════════════╗');
      console.log(`║  🚌 ${config.appName.padEnd(42)} ║`);
      console.log('╠════════════════════════════════════════════════╣');
      console.log(`║  Environment: ${config.env.padEnd(34)} ║`);
      console.log(`║  Port: ${PORT.toString().padEnd(41)} ║`);
      console.log(`║  Database: Connected ✓${' '.padEnd(26)} ║`);
      console.log(`║  Timezone: ${config.timezone.padEnd(34)} ║`);
      console.log('╚════════════════════════════════════════════════╝');
      console.log(`\n  Server running at: http://localhost:${PORT}`);
      console.log(`  API Documentation: http://localhost:${PORT}/api\n`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});

startServer();

module.exports = app;
