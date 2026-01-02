// models/Car.js
const { query, queryOne } = require('../config/database');

class Car {
  static async create(carData) {
    const { company_id, plate_number, name, type = null, park = null, capacity } = carData;
    
    const sql = `
      INSERT INTO cars (company_id, plate_number, name, type, park, capacity, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `;

    const result = await query(sql, [company_id, plate_number, name, type, park, capacity]);
    return result.insertId;
  }

  static async findById(id) {
    const sql = `
      SELECT c.*, co.company_name
      FROM cars c
      LEFT JOIN companies co ON c.company_id = co.id
      WHERE c.id = ?
    `;
    return await queryOne(sql, [id]);
  }

  static async findByPlateNumber(plateNumber) {
    const sql = `SELECT * FROM cars WHERE plate_number = ?`;
    return await queryOne(sql, [plateNumber]);
  }

  static async findByRoute(routeId) {
    const sql = `
      SELECT c.*, co.company_name
      FROM cars c
      LEFT JOIN companies co ON c.company_id = co.id
      JOIN trips t ON t.car_id = c.id
      WHERE t.route_id = ?
      ORDER BY c.plate_number ASC
    `;
    return await query(sql, [routeId]);
  }

  static async getAll(page = 1, limit = 20, search = '') {
    const offset = (page - 1) * limit;
    
    let sql = `
      SELECT c.*, co.company_name
      FROM cars c
      LEFT JOIN companies co ON c.company_id = co.id
    `;
    let countSql = `SELECT COUNT(*) as total FROM cars c`;
    const params = [];

    if (search) {
      sql += ` WHERE c.plate_number LIKE ? OR c.name LIKE ? OR co.company_name LIKE ?`;
      countSql += ` LEFT JOIN companies co ON c.company_id = co.id WHERE c.plate_number LIKE ? OR c.name LIKE ? OR co.company_name LIKE ?`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    sql += ` ORDER BY c.created_at DESC LIMIT ? OFFSET ?`;

    const cars = await query(sql, [...params, limit, offset]);
    const countResult = await queryOne(countSql, params);

    return {
      data: cars,
      total: countResult.total,
      page,
      limit,
      totalPages: Math.ceil(countResult.total / limit)
    };
  }

  static async findByCompany(companyId, includeInactive = false) {
    const sql = includeInactive
      ? `
          SELECT c.*, co.company_name
          FROM cars c
          LEFT JOIN companies co ON c.company_id = co.id
          WHERE c.company_id = ?
          ORDER BY c.plate_number
        `
      : `
          SELECT c.*, co.company_name
          FROM cars c
          LEFT JOIN companies co ON c.company_id = co.id
          WHERE c.company_id = ? AND c.is_active = 1
          ORDER BY c.plate_number
        `;

    return await query(sql, [companyId]);
  }

  static async update(id, carData) {
    const { company_id, plate_number, name, type = null, park = null, capacity, is_active } = carData;

    const sql = `
      UPDATE cars
      SET company_id = ?, plate_number = ?, name = ?, type = ?, park = ?, capacity = ?, is_active = COALESCE(?, is_active)
      WHERE id = ?
    `;

    await query(sql, [company_id, plate_number, name, type, park, capacity, is_active == null ? null : (is_active ? 1 : 0), id]);
    return this.findById(id);
  }

  static async delete(id) {
    const sql = `DELETE FROM cars WHERE id = ?`;
    await query(sql, [id]);
    return true;
  }

  static async toggleActive(id) {
    const sql = `UPDATE cars SET is_active = NOT is_active WHERE id = ?`;
    await query(sql, [id]);
    return this.findById(id);
  }

  static async findAll() {
    const sql = `
      SELECT c.*, co.company_name
      FROM cars c
      LEFT JOIN companies co ON c.company_id = co.id
      ORDER BY c.created_at DESC
    `;
    return await query(sql);
  }
}

module.exports = Car;
