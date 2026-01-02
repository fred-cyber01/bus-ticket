// models/Ticket.js
const { query, queryOne, transaction } = require('../config/database');

class Ticket {
  static async create(ticketData) {
    const {
      user_id,
      trip_id,
      boarding_stop_id,
      dropoff_stop_id,
      seat_number,
      price,
      passenger_name,
      passenger_phone,
      departure_time,
      booking_date,
      payment_method = null
    } = ticketData;
    
    const sql = `
      INSERT INTO tickets (
        user_id, trip_id, boarding_stop_id, dropoff_stop_id, seat_number,
        price, passenger_name, passenger_phone, departure_time, booking_date,
        ticket_status, payment_status, payment_method
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'booked', 'pending', ?)
    `;

    const result = await query(sql, [
      user_id, trip_id, boarding_stop_id, dropoff_stop_id, seat_number,
      price, passenger_name, passenger_phone, departure_time, booking_date,
      payment_method
    ]);

    return result.insertId;
  }

  static async findById(id) {
    const sql = `
      SELECT t.*,
             u.user_name, u.email as user_email, u.phone as user_phone,
             tr.departure_time as trip_departure,
             r.name as route_name,
             s1.name as boarding_stop_name,
             s2.name as dropoff_stop_name,
             c.company_id as company_id,
             comp.company_name as company_name,
             c.plate_number, c.name as car_name,
             d.name as driver_name
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      JOIN trips tr ON t.trip_id = tr.id
      JOIN routes r ON tr.route_id = r.id
      JOIN stops s1 ON t.boarding_stop_id = s1.id
      JOIN stops s2 ON t.dropoff_stop_id = s2.id
      JOIN cars c ON tr.car_id = c.id
      JOIN companies comp ON c.company_id = comp.id
      LEFT JOIN drivers d ON tr.driver_id = d.id
      WHERE t.id = ?
    `;

    const results = await query(sql, [id]);
    return results[0] || null;
  }

  static async getAll(filters = {}, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const params = [];
    
    let sql = `
      SELECT t.*,
             u.user_name,
             r.name as route_name,
             s1.name as boarding_stop_name,
             s2.name as dropoff_stop_name,
             c.plate_number
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      JOIN trips tr ON t.trip_id = tr.id
      JOIN routes r ON tr.route_id = r.id
      JOIN stops s1 ON t.boarding_stop_id = s1.id
      JOIN stops s2 ON t.dropoff_stop_id = s2.id
      JOIN cars c ON tr.car_id = c.id
      WHERE 1=1
    `;

    let countSql = `
      SELECT COUNT(*) as total
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      JOIN trips tr ON t.trip_id = tr.id
      WHERE 1=1
    `;

    if (filters.user_id) {
      sql += ` AND t.user_id = ?`;
      countSql += ` AND t.user_id = ?`;
      params.push(filters.user_id);
    }

    if (filters.trip_id) {
      sql += ` AND t.trip_id = ?`;
      countSql += ` AND t.trip_id = ?`;
      params.push(filters.trip_id);
    }

    if (filters.status) {
      sql += ` AND t.ticket_status = ?`;
      countSql += ` AND t.ticket_status = ?`;
      params.push(filters.status);
    }

    if (filters.payment_status) {
      sql += ` AND t.payment_status = ?`;
      countSql += ` AND t.payment_status = ?`;
      params.push(filters.payment_status);
    }

    if (filters.search) {
      const searchParam = `%${filters.search}%`;
      sql += ` AND (u.user_name LIKE ? OR t.passenger_name LIKE ? OR t.passenger_phone LIKE ?)`;
      countSql += ` AND (u.user_name LIKE ? OR t.passenger_name LIKE ? OR t.passenger_phone LIKE ?)`;
      params.push(searchParam, searchParam, searchParam);
    }

    sql += ` ORDER BY t.created_at DESC LIMIT ? OFFSET ?`;

    const tickets = await query(sql, [...params, limit, offset]);
    const countResult = await queryOne(countSql, params);

    return {
      data: tickets,
      total: countResult.total,
      page,
      limit,
      totalPages: Math.ceil(countResult.total / limit)
    };
  }

  static async getUserTickets(userId, page = 1, limit = 20) {
    return this.getAll({ user_id: userId }, page, limit);
  }

  static async getTripTickets(tripId) {
    const sql = `
      SELECT t.*,
             u.user_name, u.phone as user_phone,
             s1.name as boarding_stop_name,
             s2.name as dropoff_stop_name
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      JOIN stops s1 ON t.boarding_stop_id = s1.id
      JOIN stops s2 ON t.dropoff_stop_id = s2.id
      WHERE t.trip_id = ? AND t.ticket_status IN ('booked', 'confirmed', 'on_board')
      ORDER BY t.seat_number ASC
    `;

    return query(sql, [tripId]);
  }

  static async update(id, ticketData) {
    const fields = [];
    const params = [];

    Object.keys(ticketData).forEach(key => {
      if (ticketData[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(ticketData[key]);
      }
    });

    if (fields.length === 0) return null;

    params.push(id);
    const sql = `UPDATE tickets SET ${fields.join(', ')} WHERE id = ?`;

    await query(sql, params);
    return this.findById(id);
  }

  static async updateStatus(id, status) {
    const sql = `UPDATE tickets SET ticket_status = ? WHERE id = ?`;
    await query(sql, [status, id]);
    return this.findById(id);
  }

  static async updatePaymentStatus(id, paymentStatus) {
    const sql = `UPDATE tickets SET payment_status = ? WHERE id = ?`;
    await query(sql, [paymentStatus, id]);
    return this.findById(id);
  }

  static async delete(id) {
    const sql = `DELETE FROM tickets WHERE id = ?`;
    await query(sql, [id]);
    return true;
  }

  static async moveToArchive(id) {
    return await transaction(async (connection) => {
      // Get ticket details
      const [tickets] = await connection.execute(
        'SELECT * FROM tickets WHERE id = ?',
        [id]
      );

      if (tickets.length === 0) {
        throw new Error('Ticket not found');
      }

      const ticket = tickets[0];

      // Insert into tickets2 (archive)
      await connection.execute(`
        INSERT INTO tickets2 (
          original_ticket_id, user_id, trip_id, boarding_stop_id, dropoff_stop_id,
          seat_number, price, passenger_name, passenger_phone, departure_time,
          booking_date, ticket_status, payment_status, payment_method, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        ticket.id, ticket.user_id, ticket.trip_id, ticket.boarding_stop_id,
        ticket.dropoff_stop_id, ticket.seat_number, ticket.price,
        ticket.passenger_name, ticket.passenger_phone, ticket.departure_time,
        ticket.booking_date, ticket.ticket_status, ticket.payment_status,
        ticket.payment_method, ticket.created_at, ticket.updated_at
      ]);

      // Delete from tickets
      await connection.execute('DELETE FROM tickets WHERE id = ?', [id]);

      return true;
    });
  }

  static async checkSeatAvailability(tripId, seatNumber, boardingStopOrder, dropoffStopOrder) {
    const sql = `
      SELECT t.id
      FROM tickets t
      JOIN trips tr ON t.trip_id = tr.id
      JOIN route_stops rs_boarding ON tr.route_id = rs_boarding.route_id AND t.boarding_stop_id = rs_boarding.stop_id
      JOIN route_stops rs_dropoff ON tr.route_id = rs_dropoff.route_id AND t.dropoff_stop_id = rs_dropoff.stop_id
      WHERE t.trip_id = ?
        AND t.seat_number = ?
        AND t.ticket_status IN ('confirmed', 'on_board', 'booked')
        AND (? < rs_dropoff.stop_order AND ? > rs_boarding.stop_order)
      LIMIT 1
    `;

    const results = await query(sql, [tripId, seatNumber, boardingStopOrder, dropoffStopOrder]);
    return results.length === 0; // true if available
  }

  static async getOccupiedSeats(tripId, boardingStopOrder, dropoffStopOrder) {
    const sql = `
      SELECT DISTINCT t.seat_number
      FROM tickets t
      JOIN trips tr ON t.trip_id = tr.id
      JOIN route_stops rs_boarding ON tr.route_id = rs_boarding.route_id AND t.boarding_stop_id = rs_boarding.stop_id
      JOIN route_stops rs_dropoff ON tr.route_id = rs_dropoff.route_id AND t.dropoff_stop_id = rs_dropoff.stop_id
      WHERE t.trip_id = ?
        AND t.ticket_status IN ('confirmed', 'on_board', 'booked')
        AND (? < rs_dropoff.stop_order AND ? > rs_boarding.stop_order)
      ORDER BY t.seat_number
    `;

    const results = await query(sql, [tripId, boardingStopOrder, dropoffStopOrder]);
    return results.map(r => r.seat_number);
  }

  // New methods for booking API spec compliance
  static async createBooking(bookingData) {
    const {
      user_id,
      trip_id,
      seat_number,
      passenger_name,
      passenger_age,
      passenger_phone,
      passenger_email,
      boarding_stop_id,
      dropoff_stop_id,
      price,
      departure_time,
      booking_date
    } = bookingData;
    
    // Generate unique booking reference
    const bookingRef = `BK${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    
    const sql = `
      INSERT INTO tickets (
        user_id, trip_id, seat_number, price, passenger_name, 
        passenger_age, passenger_phone, passenger_email,
        boarding_stop_id, dropoff_stop_id, booking_reference,
        departure_time, booking_date, ticket_status, payment_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'booked', 'pending')
    `;

    const result = await query(sql, [
      user_id, trip_id, seat_number, price, passenger_name,
      passenger_age || null, passenger_phone || null, passenger_email || null,
      boarding_stop_id, dropoff_stop_id, bookingRef,
      departure_time, booking_date
    ]);

    return result.insertId;
  }

  static async getAllBookings(filters = {}) {
    // Returns a flat list of tickets/bookings with rich joined info.
    let sql = `
      SELECT
        t.id,
        t.user_id,
        t.trip_id,
        t.booking_reference,
        t.seat_number,
        t.price,
        t.passenger_name,
        t.passenger_phone,
        t.passenger_email,
        t.departure_time,
        DATE(t.departure_time) AS trip_date,
        t.ticket_status,
        t.payment_status,
        t.payment_method,
        t.qr_code,
        t.created_at,
        u.user_name,
        u.email AS user_email,
        u.phone AS user_phone,
        r.name AS route_name,
        s_board.name AS boarding_stop_name,
        s_drop.name AS dropoff_stop_name,
        c.company_id AS company_id,
        c.plate_number AS plate_number,
        c.plate_number AS bus_plate,
        c.name AS car_name,
        d.name AS driver_name,
        comp.company_name AS company_name
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      JOIN trips tr ON t.trip_id = tr.id
      JOIN routes r ON tr.route_id = r.id
      LEFT JOIN stops s_board ON t.boarding_stop_id = s_board.id
      LEFT JOIN stops s_drop ON t.dropoff_stop_id = s_drop.id
      JOIN cars c ON tr.car_id = c.id
      JOIN companies comp ON c.company_id = comp.id
      LEFT JOIN drivers d ON tr.driver_id = d.id
      WHERE 1=1
    `;

    const params = [];

    if (filters.user_id) {
      sql += ` AND t.user_id = ?`;
      params.push(filters.user_id);
    }

    if (filters.company_id) {
      sql += ` AND c.company_id = ?`;
      params.push(filters.company_id);
    }

    sql += ` ORDER BY t.created_at DESC`;

    return await query(sql, params);
  }

  static async getBookingById(id) {
    const results = await this.getAllBookings({});
    return results.find(r => String(r.id) === String(id)) || null;
  }

  static async findByCompany(companyId, filters = {}) {
    const params = [companyId];

    let sql = `
      SELECT
        t.id,
        t.user_id,
        t.trip_id,
        t.booking_reference,
        t.seat_number,
        t.price,
        t.passenger_name,
        t.passenger_phone,
        t.passenger_email,
        t.departure_time,
        DATE(t.departure_time) AS trip_date,
        t.ticket_status,
        t.payment_status,
        t.payment_method,
        t.qr_code,
        t.created_at,
        u.user_name,
        u.email AS user_email,
        u.phone AS user_phone,
        r.name AS route_name,
        s_board.name AS boarding_stop_name,
        s_drop.name AS dropoff_stop_name,
        c.company_id AS company_id,
        c.plate_number AS plate_number,
        c.plate_number AS bus_plate,
        c.name AS car_name,
        d.name AS driver_name,
        comp.company_name AS company_name
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      JOIN trips tr ON t.trip_id = tr.id
      JOIN routes r ON tr.route_id = r.id
      LEFT JOIN stops s_board ON t.boarding_stop_id = s_board.id
      LEFT JOIN stops s_drop ON t.dropoff_stop_id = s_drop.id
      JOIN cars c ON tr.car_id = c.id
      JOIN companies comp ON c.company_id = comp.id
      LEFT JOIN drivers d ON tr.driver_id = d.id
      WHERE c.company_id = ?
    `;

    if (filters.status) {
      sql += ` AND t.ticket_status = ?`;
      params.push(filters.status);
    }

    if (filters.startDate) {
      sql += ` AND DATE(t.created_at) >= ?`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      sql += ` AND DATE(t.created_at) <= ?`;
      params.push(filters.endDate);
    }

    sql += ` ORDER BY t.created_at DESC`;

    return await query(sql, params);
  }
}

module.exports = Ticket;
