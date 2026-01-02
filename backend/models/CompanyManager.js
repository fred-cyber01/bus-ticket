// models/CompanyManager.js
const { query, queryOne } = require('../config/database');
const bcrypt = require('bcryptjs');
const moment = require('moment-timezone');

class CompanyManager {
  static async create(managerData) {
    const { company_id, user_name, email, phone, password, role = 'manager' } = managerData;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const sql = `
      INSERT INTO company_managers (
        company_id, user_name, email, phone, password_hash, role, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const result = query(sql, [
      company_id,
      user_name,
      email,
      phone || null,
      password_hash,
      role,
      moment().tz('Africa/Kigali').format('YYYY-MM-DD HH:mm:ss')
    ]);

    return result.lastInsertRowid;
  }

  static findByEmail(email) {
    const sql = `
      SELECT cm.*, c.name as company_name, c.subscription_status, c.bus_limit
      FROM company_managers cm
      JOIN companies c ON cm.company_id = c.id
      WHERE cm.email = ? AND cm.is_active = 1
    `;

    return queryOne(sql, [email]);
  }

  static findById(id) {
    const sql = `
      SELECT cm.*, c.name as company_name, c.subscription_status, c.bus_limit
      FROM company_managers cm
      JOIN companies c ON cm.company_id = c.id
      WHERE cm.id = ?
    `;

    return queryOne(sql, [id]);
  }

  static async validatePassword(manager, password) {
    return await bcrypt.compare(password, manager.password_hash);
  }

  static findByCompany(companyId) {
    const sql = `
      SELECT id, company_id, user_name, email, phone, role, is_active, created_at
      FROM company_managers
      WHERE company_id = ?
      ORDER BY created_at DESC
    `;

    return query(sql, [companyId]);
  }

  static update(id, updateData) {
    const { user_name, email, phone, is_active } = updateData;

    const sql = `
      UPDATE company_managers 
      SET user_name = ?,
          email = ?,
          phone = ?,
          is_active = ?,
          updated_at = ?
      WHERE id = ?
    `;

    query(sql, [
      user_name,
      email,
      phone || null,
      is_active ? 1 : 0,
      moment().tz('Africa/Kigali').format('YYYY-MM-DD HH:mm:ss'),
      id
    ]);

    return true;
  }

  static async updatePassword(id, newPassword) {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    query(
      'UPDATE company_managers SET password_hash = ?, updated_at = ? WHERE id = ?',
      [password_hash, moment().tz('Africa/Kigali').format('YYYY-MM-DD HH:mm:ss'), id]
    );

    return true;
  }

  static delete(id) {
    query('DELETE FROM company_managers WHERE id = ?', [id]);
    return true;
  }
}

module.exports = CompanyManager;
