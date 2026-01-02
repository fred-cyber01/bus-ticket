const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await query(
      'SELECT id, email, role, created_at FROM admins ORDER BY created_at DESC'
    );
    res.json({ success: true, data: admins });
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admins' });
  }
};

exports.createAdmin = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    // Check if admin already exists
    const existing = await query('SELECT id FROM admins WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Admin with this email already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const result = await query(
      'INSERT INTO admins (email, password, role) VALUES (?, ?, ?)',
      [email, hashedPassword, role || 'admin']
    );

    res.status(201).json({ 
      success: true, 
      message: 'Admin created successfully',
      data: { id: result.insertId, email, role: role || 'admin' }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ success: false, message: 'Failed to create admin' });
  }
};

exports.updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, role } = req.body;

    const updates = [];
    const params = [];

    if (email) {
      updates.push('email = ?');
      params.push(email);
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push('password = ?');
      params.push(hashedPassword);
    }

    if (role) {
      updates.push('role = ?');
      params.push(role);
    }

    if (updates.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No fields to update' 
      });
    }

    params.push(id);
    await query(
      `UPDATE admins SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({ success: true, message: 'Admin updated successfully' });
  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({ success: false, message: 'Failed to update admin' });
  }
};

exports.deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting the super admin
    const admin = await query('SELECT role FROM admins WHERE id = ?', [id]);
    if (admin.length > 0 && admin[0].role === 'super_admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Cannot delete super admin' 
      });
    }

    await query('DELETE FROM admins WHERE id = ?', [id]);
    res.json({ success: true, message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete admin' });
  }
};

exports.getAdminStats = async (req, res) => {
  try {
    // Get total users count
    const totalUsers = await query('SELECT COUNT(*) as count FROM users');
    const activeUsers = await query('SELECT COUNT(*) as count FROM users WHERE is_active = 1');
    
    // Get total companies
    const totalCompanies = await query('SELECT COUNT(*) as count FROM companies');
    const activeCompanies = await query('SELECT COUNT(*) as count FROM companies WHERE is_active = 1');
    
    // Get subscription stats
    const activeSubscriptions = await query(
      'SELECT COUNT(*) as count FROM company_subscriptions WHERE status = "active" AND end_date > NOW()'
    );
    
    // Get total buses
    const totalBuses = await query('SELECT COUNT(*) as count FROM cars');
    
    // Get total routes
    const totalRoutes = await query('SELECT COUNT(*) as count FROM routes');
    
    // Get ticket stats
    const totalTickets = await query('SELECT COUNT(*) as count FROM tickets');
    const todayTickets = await query('SELECT COUNT(*) as count FROM tickets WHERE DATE(created_at) = CURDATE()');
    
    // Get revenue stats
    const totalRevenue = await query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = "completed"'
    );
    
    const todayRevenue = await query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = "completed" AND DATE(created_at) = CURDATE()'
    );
    
    // Get pro members (companies with active subscriptions)
    const proMembers = await query(
      `SELECT COUNT(DISTINCT cs.company_id) as count 
       FROM company_subscriptions cs 
       JOIN subscription_plans sp ON cs.plan_id = sp.id 
       WHERE cs.status = 'active' 
       AND cs.end_date > NOW() 
       AND sp.name IN ('Standard', 'Premium')`
    );
    
    // Get new customers (last 30 days)
    const newCustomers = await query(
      'SELECT COUNT(*) as count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
    );

    res.json({
      success: true,
      data: {
        totalCustomers: totalUsers[0].count,
        activeCustomers: activeUsers[0].count,
        proMembers: proMembers[0].count || 0,
        newCustomers: newCustomers[0].count,
        totalCompanies: totalCompanies[0].count,
        activeCompanies: activeCompanies[0].count,
        activeSubscriptions: activeSubscriptions[0].count,
        totalBuses: totalBuses[0].count,
        totalRoutes: totalRoutes[0].count,
        totalTickets: totalTickets[0].count,
        todayTickets: todayTickets[0].count,
        totalRevenue: parseFloat(totalRevenue[0].total) || 0,
        todayRevenue: parseFloat(todayRevenue[0].total) || 0
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
};
