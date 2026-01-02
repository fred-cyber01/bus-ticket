// models/Driver.js
const { query, queryOne } = require('../config/database');
const bcrypt = require('bcryptjs');

class Driver {
  /**
   * Create a new driver
   */
  static async create(driverData) {
    const { company_id, name, license_number, category, plate_number, phone, email, password } = driverData;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO drivers (company_id, name, license_number, category, plate_number, phone, email, password, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `;

    const result = await query(sql, [
      company_id,
      name,
      license_number,
      category ?? null,
      plate_number ?? null,
      phone ?? null,
      email,
      hashedPassword,
    ]);
    return result.insertId;
  }

  /**
   * Find driver by ID
   */
  static async findById(id) {
    const sql = `
      SELECT id, company_id, name, license_number, category, plate_number, phone, email, is_active, created_at, updated_at
      FROM drivers
      WHERE id = ?
    `;

    const results = await query(sql, [id]);
    return results[0] || null;
  }

  /**
   * Find driver by email
   */
  static async findByEmail(email) {
    const sql = `
      SELECT *
      FROM drivers
      WHERE email = ?
    `;

    const results = await query(sql, [email]);
    return results[0] || null;
  }

  /**
   * Find driver by license number
   */
  static async findByLicenseNumber(licenseNumber) {
    const sql = `
      SELECT *
      FROM drivers
      WHERE license_number = ?
    `;

    const results = await query(sql, [licenseNumber]);
    return results[0] || null;
  }

  /**
   * Update driver
   */
  static async update(id, driverData) {
    const { name, license_number, category, plate_number, phone, email } = driverData;

    const sql = `
      UPDATE drivers
      SET name = ?, license_number = ?, category = ?, plate_number = ?, phone = ?, email = ?
      WHERE id = ?
    `;

    await query(sql, [
      name,
      license_number,
      category ?? null,
      plate_number ?? null,
      phone ?? null,
      email,
      id,
    ]);
    return this.findById(id);
  }

  /**
   * Update password
   */
  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const sql = `
      UPDATE drivers
      SET password = ?
      WHERE id = ?
    `;

    await query(sql, [hashedPassword, id]);
    return true;
  }

  /**
   * Verify password
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Get all drivers with pagination
   */
  static async getAll(page = 1, limit = 20, search = '') {
    const offset = (page - 1) * limit;
    
    let sql = `
      SELECT id, name, license_number, category, plate_number, phone, email, is_active, created_at, updated_at
      FROM drivers
    `;

    let countSql = `SELECT COUNT(*) as total FROM drivers`;
    const params = [];

    if (search) {
      sql += ` WHERE name LIKE ? OR license_number LIKE ? OR email LIKE ? OR phone LIKE ?`;
      countSql += ` WHERE name LIKE ? OR license_number LIKE ? OR email LIKE ? OR phone LIKE ?`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;

    const drivers = await query(sql, [...params, limit, offset]);
    const countResult = await queryOne(countSql, params);

    return {
      data: drivers,
      total: countResult.total,
      page,
      limit,
      totalPages: Math.ceil(countResult.total / limit)
    };
  }

  /**
   * Get all drivers (no pagination)
   */
  static async findAll() {
    const sql = `
      SELECT id, name, license_number, category, plate_number, phone, email, company_id, is_active, created_at, updated_at
      FROM drivers
      ORDER BY created_at DESC
    `;
    return await query(sql);
  }

  /**
   * Find drivers by company
   */
  static async findByCompany(companyId) {
    const sql = `
      SELECT id, name, license_number, category, plate_number, phone, email, is_active, created_at, updated_at
      FROM drivers
      WHERE company_id = ?
      ORDER BY created_at DESC
    `;
    return await query(sql, [companyId]);
  }

  /**
   * Get driver's current trip
   */
  static async getCurrentTrip(driverId) {
    const sql = `
      SELECT t.*, r.name as route_name, c.name as car_name, c.plate_number
      FROM trips t
      JOIN routes r ON t.route_id = r.id
      JOIN cars c ON t.car_id = c.id
      WHERE t.driver_id = ? 
        AND t.status IN ('scheduled', 'in_transit')
        AND t.is_active = 1
      ORDER BY t.departure_time DESC
      LIMIT 1
    `;

    const results = await query(sql, [driverId]);
    return results[0] || null;
  }

  /**
   * Get driver's trip history
   */
  static async getTripHistory(driverId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const sql = `
      SELECT t.*, r.name as route_name, c.name as car_name, c.plate_number
      FROM trips t
      JOIN routes r ON t.route_id = r.id
      JOIN cars c ON t.car_id = c.id
      WHERE t.driver_id = ?
      ORDER BY t.departure_time DESC
      LIMIT ? OFFSET ?
    `;

    const countSql = `
      SELECT COUNT(*) as total
      FROM trips
      WHERE driver_id = ?
    `;

    const trips = await query(sql, [driverId, limit, offset]);
    const countResult = await queryOne(countSql, [driverId]);

    return {
      data: trips,
      total: countResult.total,
      page,
      limit,
      totalPages: Math.ceil(countResult.total / limit)
    };
  }

  /**
   * Delete driver
   */
  static async delete(id) {
    const sql = `DELETE FROM drivers WHERE id = ?`;
    await query(sql, [id]);
    return true;
  }

  /**
   * Toggle driver active status
   */
  static async toggleActive(id) {
    const sql = `
      UPDATE drivers
      SET is_active = NOT is_active
      WHERE id = ?
    `;

    await query(sql, [id]);
    return this.findById(id);
  }
}

module.exports = Driver;
