// models/Route.js
const { query, queryOne } = require('../config/database');

class Route {
  static async create(routeData) {
    const {
      company_id = null,
      name,
      origin_stop_id,
      destination_stop_id,
      description = null,
      distance_km = null
    } = routeData;
    
    const sql = `
      INSERT INTO routes (company_id, name, origin_stop_id, destination_stop_id, description, distance_km, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `;

    const result = await query(sql, [company_id, name, origin_stop_id, destination_stop_id, description, distance_km]);
    return result.insertId;
  }

  static async findById(id) {
    const sql = `
      SELECT r.*, 
             comp.company_name as company_name,
             s1.name as origin_stop_name,
             s2.name as destination_stop_name,
             COALESCE((SELECT COUNT(*) FROM route_stops rs WHERE rs.route_id = r.id), 0) as stop_count
      FROM routes r
      LEFT JOIN companies comp ON r.company_id = comp.id
      LEFT JOIN stops s1 ON r.origin_stop_id = s1.id
      LEFT JOIN stops s2 ON r.destination_stop_id = s2.id
      WHERE r.id = ?
    `;
    return await queryOne(sql, [id]);
  }

  static async getAll(page = 1, limit = 20, search = '') {
    const offset = (page - 1) * limit;
    
    let sql = `
      SELECT r.*, 
             comp.company_name as company_name,
             s1.name as origin_stop_name,
             s2.name as destination_stop_name,
             COALESCE((SELECT COUNT(*) FROM route_stops rs WHERE rs.route_id = r.id), 0) as stop_count
      FROM routes r
      LEFT JOIN companies comp ON r.company_id = comp.id
      LEFT JOIN stops s1 ON r.origin_stop_id = s1.id
      LEFT JOIN stops s2 ON r.destination_stop_id = s2.id
    `;
    let countSql = `SELECT COUNT(*) as total FROM routes r`;
    const params = [];

    if (search) {
      sql += ` WHERE r.name LIKE ? OR s1.name LIKE ? OR s2.name LIKE ?`;
      countSql += ` LEFT JOIN stops s1 ON r.origin_stop_id = s1.id LEFT JOIN stops s2 ON r.destination_stop_id = s2.id WHERE r.name LIKE ? OR s1.name LIKE ? OR s2.name LIKE ?`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    sql += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;

    const routes = await query(sql, [...params, limit, offset]);
    const countResult = await queryOne(countSql, params);

    return {
      data: routes,
      total: countResult.total,
      page,
      limit,
      totalPages: Math.ceil(countResult.total / limit)
    };
  }

  static async getAllActive() {
    const sql = `
      SELECT r.*,
             comp.company_name as company_name,
             s1.name as origin_stop_name,
             s2.name as destination_stop_name,
             COALESCE((SELECT COUNT(*) FROM route_stops rs WHERE rs.route_id = r.id), 0) as stop_count
      FROM routes r
      LEFT JOIN companies comp ON r.company_id = comp.id
      LEFT JOIN stops s1 ON r.origin_stop_id = s1.id
      LEFT JOIN stops s2 ON r.destination_stop_id = s2.id
      WHERE r.is_active = 1
      ORDER BY r.name ASC
    `;
    return await query(sql);
  }

  static async findAll() {
    const sql = `
      SELECT r.*,
             comp.company_name as company_name,
             s1.name as origin_stop_name,
             s2.name as destination_stop_name,
             COALESCE((SELECT COUNT(*) FROM route_stops rs WHERE rs.route_id = r.id), 0) as stop_count
      FROM routes r
      LEFT JOIN companies comp ON r.company_id = comp.id
      LEFT JOIN stops s1 ON r.origin_stop_id = s1.id
      LEFT JOIN stops s2 ON r.destination_stop_id = s2.id
      ORDER BY r.created_at DESC
    `;
    return await query(sql);
  }

  static async getStops(routeId) {
    const sql = `
      SELECT rs.*, s.name as stop_name, s.location, s.latitude, s.longitude
      FROM route_stops rs
      JOIN stops s ON rs.stop_id = s.id
      WHERE rs.route_id = ?
      ORDER BY rs.stop_order ASC
    `;
    return query(sql, [routeId]);
  }

  static async update(id, routeData) {
    const { name, origin_stop_id, destination_stop_id, description = null, distance_km = null, is_active } = routeData;

    const sql = `
      UPDATE routes
      SET name = ?, origin_stop_id = ?, destination_stop_id = ?, description = ?, distance_km = ?, is_active = COALESCE(?, is_active)
      WHERE id = ?
    `;

    await query(sql, [name, origin_stop_id, destination_stop_id, description, distance_km, is_active, id]);
    return await this.findById(id);
  }

  static async delete(id) {
    const sql = `DELETE FROM routes WHERE id = ?`;
    await query(sql, [id]);
    return true;
  }

  static async toggleActive(id) {
    const sql = `UPDATE routes SET is_active = NOT is_active WHERE id = ?`;
    await query(sql, [id]);
    return await this.findById(id);
  }
}

module.exports = Route;
