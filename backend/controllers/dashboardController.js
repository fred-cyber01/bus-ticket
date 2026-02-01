// controllers/dashboardController.js
const db = require('../config/database');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res, next) => {
  try {
    // Get total counts
    const [totalUsers] = await db.execute('SELECT COUNT(*) as count FROM users');
    const [totalDrivers] = await db.execute('SELECT COUNT(*) as count FROM drivers');
    const [totalCompanies] = await db.execute('SELECT COUNT(*) as count FROM companies');
    const [totalCars] = await db.execute('SELECT COUNT(*) as count FROM cars');
    const [totalRoutes] = await db.execute('SELECT COUNT(*) as count FROM routes');
    
    // Get ticket statistics
    const [todayTickets] = await db.execute(
      // tolerate both booking_time and created_at depending on schema
      `SELECT COUNT(*) as count FROM tickets WHERE DATE(COALESCE(booking_time, created_at)) = CURDATE()`
    );

    const [totalTickets] = await db.execute('SELECT COUNT(*) as count FROM tickets');

    const [totalRevenue] = await db.execute(
      // accept either 'paid' or 'completed' values
      `SELECT SUM(price) as total FROM tickets WHERE payment_status IN ('paid','completed')`
    );
    
    // Get active trips
    const [activeTrips] = await db.execute(
      "SELECT COUNT(*) as count FROM trips WHERE (status IN ('scheduled', 'in-progress') OR trip_status IN ('scheduled','in-progress')) AND trip_date = CURDATE()"
    );
    
    // Get recent bookings
    const [recentBookings] = await db.execute(
      `SELECT t.*, u.user_name, r.name as route_name, tr.departure_time, tr.trip_date
       FROM tickets t
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN trips tr ON t.trip_id = tr.id
       LEFT JOIN routes r ON tr.route_id = r.id
       ORDER BY COALESCE(t.booking_time, t.created_at) DESC
       LIMIT 10`
    );
    
    res.status(200).json({
      success: true,
      data: {
        totalUsers: totalUsers[0].count,
        totalDrivers: totalDrivers[0].count,
        totalCompanies: totalCompanies[0].count,
        totalCars: totalCars[0].count,
        totalRoutes: totalRoutes[0].count,
        todayTickets: todayTickets[0].count,
        totalTickets: totalTickets[0].count,
        totalRevenue: totalRevenue[0].total || 0,
        activeTrips: activeTrips[0].count,
        recentBookings,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get revenue statistics
// @route   GET /api/dashboard/revenue
// @access  Private/Admin
exports.getRevenueStats = async (req, res, next) => {
  try {
    const [dailyRevenue] = await db.execute(
      `SELECT DATE(booking_time) as date, SUM(price) as revenue, COUNT(*) as tickets
       FROM tickets
       WHERE payment_status = 'paid' AND booking_time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY DATE(booking_time)
       ORDER BY date DESC`
    );
    
    const [monthlyRevenue] = await db.execute(
      `SELECT DATE_FORMAT(booking_time, '%Y-%m') as month, SUM(price) as revenue, COUNT(*) as tickets
       FROM tickets
       WHERE payment_status = 'paid'
       GROUP BY DATE_FORMAT(booking_time, '%Y-%m')
       ORDER BY month DESC
       LIMIT 12`
    );
    
    res.status(200).json({
      success: true,
      data: {
        daily: dailyRevenue,
        monthly: monthlyRevenue,
      },
    });
  } catch (error) {
    next(error);
  }
};
