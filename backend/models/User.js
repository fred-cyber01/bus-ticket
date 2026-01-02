// models/User.js
const { query, queryOne } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  /**
   * Create a new user
   */
  static async create(userData) {
    const { user_name, email, phone, password, full_name, role } = userData;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO users (user_name, email, phone, password, full_name)
      VALUES (?, ?, ?, ?, ?)
    `;

    const result = await query(sql, [user_name, email, phone || null, hashedPassword, full_name || null]);
    return result.insertId;
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const sql = `
      SELECT id, user_name, email, phone, full_name, is_active, created_at, updated_at
      FROM users
      WHERE id = ?
    `;

    return await queryOne(sql, [id]);
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const sql = `
      SELECT *
      FROM users
      WHERE email = ?
    `;

    return await queryOne(sql, [email]);
  }

  /**
   * Find user by username
   */
  static async findByUsername(username) {
    const sql = `
      SELECT *
      FROM users
      WHERE user_name = ?
    `;

    return await queryOne(sql, [username]);
  }

  /**
   * Find user by phone
   */
  static async findByPhone(phone) {
    const sql = `
      SELECT *
      FROM users
      WHERE phone = ?
    `;

    return await queryOne(sql, [phone]);
  }

  /**
   * Update user
   */
  static async update(id, userData) {
    const { user_name, email, phone, full_name } = userData;

    const sql = `
      UPDATE users
      SET user_name = ?, email = ?, phone = ?, full_name = ?
      WHERE id = ?
    `;

    await query(sql, [user_name, email, phone, full_name, id]);
    return this.findById(id);
  }

  /**
   * Update password
   */
  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const sql = `
      UPDATE users
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
   * Set reset token
   */
  static async setResetToken(email, token, expiry) {
    const sql = `
      UPDATE users
      SET reset_token = ?, reset_token_expiry = ?
      WHERE email = ?
    `;

    await query(sql, [token, expiry, email]);
  }

  /**
   * Find by reset token
   */
  static async findByResetToken(token) {
    const sql = `
      SELECT *
      FROM users
      WHERE reset_token = ? AND reset_token_expiry > NOW()
    `;

    return await queryOne(sql, [token]);
  }

  /**
   * Clear reset token
   */
  static async clearResetToken(id) {
    const sql = `
      UPDATE users
      SET reset_token = NULL, reset_token_expiry = NULL
      WHERE id = ?
    `;

    await query(sql, [id]);
  }

  /**
   * Get all users with pagination
   */
  static async getAll(page = 1, limit = 20, search = '') {
    const offset = (page - 1) * limit;
    
    let sql = `
      SELECT id, user_name, email, phone, full_name, status, created_at, updated_at
      FROM users
    `;

    let countSql = `SELECT COUNT(*) as total FROM users`;
    const params = [];

    if (search) {
      sql += ` WHERE user_name LIKE ? OR email LIKE ? OR phone LIKE ? OR full_name LIKE ?`;
      countSql += ` WHERE user_name LIKE ? OR email LIKE ? OR phone LIKE ? OR full_name LIKE ?`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;

    const users = await query(sql, [...params, limit, offset]);
    const countResult = await queryOne(countSql, params);

    return {
      data: users,
      total: countResult.total,
      page,
      limit,
      totalPages: Math.ceil(countResult.total / limit)
    };
  }

  /**
   * Delete user
   */
  static async delete(id) {
    const sql = `DELETE FROM users WHERE id = ?`;
    await query(sql, [id]);
    return true;
  }

  /**
   * Toggle user active status
   */
  static async toggleActive(id) {
    const sql = `
      UPDATE users
      SET is_active = NOT is_active
      WHERE id = ?
    `;

    await query(sql, [id]);
    return this.findById(id);
  }

  static async setActive(id, isActive) {
    const sql = `UPDATE users SET is_active = ? WHERE id = ?`;
    await query(sql, [isActive ? 1 : 0, id]);
    return this.findById(id);
  }

  static async block(id) {
    return this.setActive(id, false);
  }

  static async unblock(id) {
    return this.setActive(id, true);
  }

  /**
   * Get all users without pagination
   */
  static async findAll() {
    const sql = `
      SELECT id, user_name, email, phone, full_name, is_active, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `;

    return await query(sql);
  }
}

module.exports = User;
