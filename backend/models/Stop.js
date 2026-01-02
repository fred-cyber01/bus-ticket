// models/Stop.js
const { query, queryOne } = require('../config/database');

class Stop {
  static normalizeName(name) {
    if (name == null) return '';
    return String(name).trim().replace(/\s+/g, ' ');
  }

  static async create(stopData) {
    const { name, location = null, latitude = null, longitude = null } = stopData;
    
    const sql = `
      INSERT INTO stops (name, location, latitude, longitude, is_active)
      VALUES (?, ?, ?, ?, 1)
    `;

    const result = await query(sql, [name, location, latitude, longitude]);
    return result.insertId;
  }

  static async findById(id) {
    const sql = `SELECT * FROM stops WHERE id = ?`;
    return await queryOne(sql, [id]);
  }

  static async findByName(name) {
    const sql = `SELECT * FROM stops WHERE name = ?`;
    return await queryOne(sql, [name]);
  }

  static async findByNameInsensitive(name) {
    const normalized = this.normalizeName(name);
    if (!normalized) return null;
    const sql = `SELECT * FROM stops WHERE LOWER(name) = LOWER(?) LIMIT 1`;
    return await queryOne(sql, [normalized]);
  }

  static async findOrCreateByName(name, { location = null, latitude = null, longitude = null } = {}) {
    const normalized = this.normalizeName(name);
    if (!normalized) {
      throw new Error('Stop name is required');
    }

    const existing = await this.findByNameInsensitive(normalized);
    if (existing) return existing;

    const id = await this.create({ name: normalized, location, latitude, longitude });
    return await this.findById(id);
  }

  static async getAll(page = 1, limit = 50, search = '') {
    const offset = (page - 1) * limit;
    
    let sql = `SELECT * FROM stops`;
    let countSql = `SELECT COUNT(*) as total FROM stops`;
    const params = [];

    if (search) {
      sql += ` WHERE name LIKE ? OR location LIKE ?`;
      countSql += ` WHERE name LIKE ? OR location LIKE ?`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
    }

    sql += ` ORDER BY name ASC LIMIT ? OFFSET ?`;

    const stops = await query(sql, [...params, limit, offset]);
    const countResult = await queryOne(countSql, params);

    return {
      data: stops,
      total: countResult.total,
      page,
      limit,
      totalPages: Math.ceil(countResult.total / limit)
    };
  }

  static async getAllActive() {
    const sql = `SELECT * FROM stops WHERE is_active = 1 ORDER BY name ASC`;
    return query(sql);
  }

  static async findAll() {
    const sql = `SELECT * FROM stops ORDER BY name ASC`;
    return query(sql);
  }

  static async update(id, stopData) {
    const { name, location, latitude, longitude } = stopData;

    const sql = `
      UPDATE stops
      SET name = ?, location = ?, latitude = ?, longitude = ?
      WHERE id = ?
    `;
    await query(sql, [name, location, latitude, longitude, id]);
    return await this.findById(id);
  }

  static async delete(id) {
    const sql = `DELETE FROM stops WHERE id = ?`;
    await query(sql, [id]);
    return true;
  }

  static async toggleActive(id) {
    const sql = `UPDATE stops SET is_active = NOT is_active WHERE id = ?`;
    await query(sql, [id]);
    return await this.findById(id);
  }
}

module.exports = Stop;
