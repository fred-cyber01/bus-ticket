// models/Company.js
const { query, queryOne } = require('../config/database');
const moment = require('moment-timezone');

class Company {
  static async create(companyData) {
    const { company_name, tin, phone, email, address = null } = companyData;
    
    const sql = `
      INSERT INTO companies (
        company_name, tin, phone, email, address, status, subscription_status, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, 'pending', 'expired', 1, ?)
    `;

    const result = await query(sql, [
      company_name,
      tin,
      phone,
      email,
      address,
      moment().tz('Africa/Kigali').format('YYYY-MM-DD HH:mm:ss')
    ]);
    return result.insertId;
  }

  static async findById(id) {
    const sql = `
      SELECT c.*, sp.name as plan_name, sp.bus_limit as plan_bus_limit
      FROM companies c
      LEFT JOIN subscription_plans sp ON c.current_plan_id = sp.id
      WHERE c.id = ?
    `;
    return await queryOne(sql, [id]);
  }

  static async findByEmail(email) {
    const sql = `SELECT * FROM companies WHERE email = ?`;
    return await queryOne(sql, [email]);
  }

  static async findByTin(tin) {
    const sql = `SELECT * FROM companies WHERE tin = ?`;
    return await queryOne(sql, [tin]);
  }

  static async getAll(page = 1, limit = 20, search = '', filters = {}) {
    const offset = (page - 1) * limit;
    
    let sql = `
      SELECT c.*, sp.name as plan_name, sp.price as plan_price
      FROM companies c
      LEFT JOIN subscription_plans sp ON c.current_plan_id = sp.id
      WHERE 1=1
    `;
    let countSql = `SELECT COUNT(*) as total FROM companies WHERE 1=1`;
    const params = [];

    if (search) {
      sql += ` AND (c.company_name LIKE ? OR c.phone LIKE ? OR c.email LIKE ? OR c.tin LIKE ?)`;
      countSql += ` AND (company_name LIKE ? OR phone LIKE ? OR email LIKE ? OR tin LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    if (filters.status) {
      sql += ` AND c.status = ?`;
      countSql += ` AND c.status = ?`;
      params.push(filters.status);
    }

    if (filters.subscription_status) {
      sql += ` AND c.subscription_status = ?`;
      countSql += ` AND subscription_status = ?`;
      params.push(filters.subscription_status);
    }

    sql += ` ORDER BY c.created_at DESC LIMIT ? OFFSET ?`;

    const companies = await query(sql, [...params, limit, offset]);
    const countParams = params.slice(0, params.length);
    const countResult = await queryOne(countSql, countParams);

    return {
      data: companies,
      total: countResult.total,
      page,
      limit,
      totalPages: Math.ceil(countResult.total / limit)
    };
  }

  static async update(id, companyData) {
    const { company_name, tin, phone, email, address } = companyData;

    const sql = `
      UPDATE companies
      SET company_name = ?, tin = ?, phone = ?, email = ?, address = ?
      WHERE id = ?
    `;

    await query(sql, [company_name, tin, phone, email, address, id]);
    return this.findById(id);
  }

  static async approve(id, adminId) {
    const sql = `
      UPDATE companies
      SET status = 'approved',
          approved_by = ?,
          approved_at = ?
      WHERE id = ?
    `;

    await query(sql, [
      adminId,
      moment().tz('Africa/Kigali').format('YYYY-MM-DD HH:mm:ss'),
      id
    ]);
    return this.findById(id);
  }

  static async reject(id) {
    await query('UPDATE companies SET status = "rejected" WHERE id = ?', [id]);
    return this.findById(id);
  }

  static async block(id) {
    await query('UPDATE companies SET is_active = 0 WHERE id = ?', [id]);
    return this.findById(id);
  }

  static async unblock(id) {
    await query('UPDATE companies SET is_active = 1 WHERE id = ?', [id]);
    return this.findById(id);
  }

  static async delete(id) {
    const sql = `DELETE FROM companies WHERE id = ?`;
    await query(sql, [id]);
    return true;
  }

  static async toggleActive(id) {
    const sql = `UPDATE companies SET is_active = NOT is_active WHERE id = ?`;
    await query(sql, [id]);
    return this.findById(id);
  }

  static async getBusCount(companyId) {
    const result = await queryOne(
      'SELECT COUNT(*) as count FROM cars WHERE company_id = ?',
      [companyId]
    );
    return result.count;
  }

  static async getDriverCount(companyId) {
    const result = await queryOne(
      'SELECT COUNT(*) as count FROM drivers WHERE company_id = ?',
      [companyId]
    );
    return result.count;
  }

  static async getRouteCount(companyId) {
    const result = await queryOne(
      'SELECT COUNT(*) as count FROM routes WHERE company_id = ?',
      [companyId]
    );
    return result.count;
  }

  static async getCompanyStats(companyId) {
    const busCount = await this.getBusCount(companyId);
    const driverCount = await this.getDriverCount(companyId);
    const routeCount = await this.getRouteCount(companyId);

    const ticketStats = await queryOne(
      `
      SELECT 
        COUNT(*) as total_tickets,
        SUM(CASE WHEN t.ticket_status <> 'cancelled' THEN 1 ELSE 0 END) as active_tickets,
        SUM(CASE WHEN t.payment_status = 'completed' THEN t.price ELSE 0 END) as total_revenue
      FROM tickets t
      JOIN trips tr ON t.trip_id = tr.id
      JOIN cars c ON tr.car_id = c.id
      WHERE c.company_id = ?
      `,
      [companyId]
    );

    return {
      buses: busCount,
      drivers: driverCount,
      routes: routeCount,
      totalTickets: ticketStats.total_tickets || 0,
      activeTickets: ticketStats.active_tickets || 0,
      totalRevenue: ticketStats.total_revenue || 0
    };
  }

  static async findAll() {
    const sql = `
      SELECT 
        c.*, 
        sp.name as plan_name, 
        sp.price as plan_price,
        cs.status as subscription_status,
        cs.end_date as subscription_end_date
      FROM companies c
      LEFT JOIN company_subscriptions cs ON c.id = cs.company_id AND cs.status = 'active'
      LEFT JOIN subscription_plans sp ON cs.plan_id = sp.id
      ORDER BY c.created_at DESC
    `;
    return query(sql);
  }
}

module.exports = Company;
