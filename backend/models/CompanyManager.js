// models/CompanyManager.js
const { query, queryOne } = require('../config/database');
const bcrypt = require('bcryptjs');
const moment = require('moment-timezone');

class CompanyManager {
  static async create(managerData) {
    const { company_id, name, email, phone, password, role = 'manager' } = managerData;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const sql = `
      INSERT INTO company_managers (
        company_id, name, email, phone, password, role, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await query(sql, [
      company_id,
      name,
      email,
      phone || null,
      password_hash,
      role,
      moment().tz('Africa/Kigali').format('YYYY-MM-DD HH:mm:ss')
    ]);

    return result.insertId;
  }

  static findByEmail(email) {
    const sql = `
      SELECT cm.*, c.company_name as company_name, c.subscription_status, c.bus_limit
      FROM company_managers cm
      LEFT JOIN companies c ON cm.company_id = c.id
      WHERE cm.email = ? AND cm.status = 'active'
    `;

    return queryOne(sql, [email]);
  }

  static findById(id) {
    const sql = `
      SELECT cm.*, c.company_name as company_name, c.subscription_status, c.bus_limit
      FROM company_managers cm
      LEFT JOIN companies c ON cm.company_id = c.id
      WHERE cm.id = ?
    `;

    return queryOne(sql, [id]);
  }

  static async validatePassword(manager, password) {
    return await bcrypt.compare(password, manager.password);
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
    const { name, email, phone, status } = updateData;

    const sql = `
      UPDATE company_managers 
      SET name = ?,
          email = ?,
          phone = ?,
          status = ?,
          updated_at = ?
      WHERE id = ?
    `;

    query(sql, [
      name,
      email,
      phone || null,
      status || 'active',
      moment().tz('Africa/Kigali').format('YYYY-MM-DD HH:mm:ss'),
      id
    ]);

    return true;
  }

  static async updatePassword(id, newPassword) {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    await query(
      'UPDATE company_managers SET password = ?, updated_at = ? WHERE id = ?',
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
