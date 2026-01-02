// models/Admin.js
const { query, queryOne } = require('../config/database');
const bcrypt = require('bcryptjs');

class Admin {
  /**
   * Create a new admin
   */
  static async create(adminData) {
    const { name, email, password, role = 'admin' } = adminData;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO admins (name, email, password, role, is_active)
      VALUES (?, ?, ?, ?, 1)
    `;

    const result = await query(sql, [name, email, hashedPassword, role]);
    return result.insertId;
  }

  /**
   * Find admin by ID
   */
  static async findById(id) {
    const sql = `
      SELECT id, name, email, role, is_active, created_at, updated_at
      FROM admins
      WHERE id = ?
    `;

    const results = await query(sql, [id]);
    return results[0] || null;
  }

  /**
   * Find admin by email
   */
  static async findByEmail(email) {
    const sql = `
      SELECT *
      FROM admins
      WHERE email = ?
    `;

    const results = await query(sql, [email]);
    return results[0] || null;
  }

  /**
   * Update admin
   */
  static async update(id, adminData) {
    const { name, email, role } = adminData;

    const sql = `
      UPDATE admins
      SET name = ?, email = ?, role = ?
      WHERE id = ?
    `;

    await query(sql, [name, email, role, id]);
    return this.findById(id);
  }

  /**
   * Update password
   */
  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const sql = `
      UPDATE admins
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
   * Get all admins
   */
  static async getAll() {
    const sql = `
      SELECT id, name, email, role, is_active, created_at, updated_at
      FROM admins
      ORDER BY created_at DESC
    `;

    return await query(sql);
  }

  /**
   * Delete admin
   */
  static async delete(id) {
    const sql = `DELETE FROM admins WHERE id = ?`;
    await query(sql, [id]);
    return true;
  }

  /**
   * Toggle admin active status
   */
  static async toggleActive(id) {
    const sql = `
      UPDATE admins
      SET is_active = NOT is_active
      WHERE id = ?
    `;

    await query(sql, [id]);
    return this.findById(id);
  }

  /**
   * Check if admin exists
   */
  static async exists() {
    const sql = `SELECT COUNT(*) as count FROM admins`;
    const result = await query(sql);
    return result[0].count > 0;
  }
}

module.exports = Admin;
