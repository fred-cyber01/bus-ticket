// models/Trip.js
const { query, queryOne } = require('../config/database');
const moment = require('moment-timezone');

class Trip {
  static async create(tripData) {
    const {
      route_id,
      car_id,
      car_name,
      driver_id,
      departure_time,
      status = 'scheduled'
    } = tripData;
    
    const sql = `
      INSERT INTO trips (
        route_id, car_id, car_name, driver_id, departure_time, status, is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `;

    const result = await query(sql, [
      route_id, car_id, car_name, driver_id, departure_time, status
    ]);

    return result.insertId;
  }

  static async findById(id) {
    const sql = `
      SELECT t.*,
             r.name as route_name,
             s1.name as origin_stop_name,
             s1.name as origin,
             s2.name as destination_stop_name,
             s2.name as destination,
             c.plate_number, c.capacity, c.name as car_name,
             comp.company_name as company_name,
             comp.phone as company_phone,
             d.name as driver_name, d.phone as driver_phone
      FROM trips t
      JOIN stops s1 ON t.origin_id = s1.id
      JOIN stops s2 ON t.destination_id = s2.id
      JOIN routes r ON t.route_id = r.id
      JOIN cars c ON t.car_id = c.id
      JOIN companies comp ON c.company_id = comp.id
      LEFT JOIN drivers d ON t.driver_id = d.id
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
             r.name as route_name,
             c.plate_number, c.name as car_name, c.capacity,
             d.name as driver_name
      FROM trips t
      JOIN routes r ON t.route_id = r.id
      JOIN cars c ON t.car_id = c.id
      LEFT JOIN drivers d ON t.driver_id = d.id
      WHERE 1=1
    `;

    let countSql = `
      SELECT COUNT(*) as total
      FROM trips t
      WHERE 1=1
    `;

    if (filters.route_id) {
      sql += ` AND t.route_id = ?`;
      countSql += ` AND t.route_id = ?`;
      params.push(filters.route_id);
    }

    if (filters.car_id) {
      sql += ` AND t.car_id = ?`;
      countSql += ` AND t.car_id = ?`;
      params.push(filters.car_id);
    }

    if (filters.driver_id) {
      sql += ` AND t.driver_id = ?`;
      countSql += ` AND t.driver_id = ?`;
      params.push(filters.driver_id);
    }

    if (filters.status) {
      sql += ` AND t.status = ?`;
      countSql += ` AND t.status = ?`;
      params.push(filters.status);
    }

    if (filters.is_active !== undefined) {
      sql += ` AND t.is_active = ?`;
      countSql += ` AND t.is_active = ?`;
      params.push(filters.is_active);
    }

    if (filters.date) {
      sql += ` AND DATE(t.departure_time) = ?`;
      countSql += ` AND DATE(t.departure_time) = ?`;
      params.push(filters.date);
    }

    sql += ` ORDER BY t.departure_time DESC LIMIT ? OFFSET ?`;

    const trips = await query(sql, [...params, limit, offset]);
    const countResult = await queryOne(countSql, params);

    return {
      data: trips,
      total: countResult.total,
      page,
      limit,
      totalPages: Math.ceil(countResult.total / limit)
    };
  }

  static async getAvailableTrips(date = null) {
    const currentDate = date || moment().tz('Africa/Kigali').format('YYYY-MM-DD');
    // Use ISO-like datetime with 'T' separator for safe JS parsing
    const currentDateTime = moment().tz('Africa/Kigali').format('YYYY-MM-DDTHH:mm:ss');

    const sql = `
      SELECT 
        ds.id AS schedule_id,
        c.id AS car_id,
        c.plate_number,
        c.name AS car_name,
        c.capacity,
        r.name AS route_name,
        r.id AS route_id,
        r.origin_stop_id as origin_id,
        s_origin.name AS origin_stop_name,
        r.destination_stop_id as destination_id,
        s_dest.name AS destination_stop_name,
        ds.departure_time,
        CONCAT(?, 'T', ds.departure_time) as full_departure_time,
        t.id as trip_id,
        t.status as trip_status
      FROM daily_schedules ds
      JOIN cars c ON ds.car_id = c.id
      JOIN companies comp ON c.company_id = comp.id
      JOIN routes r ON ds.route_id = r.id
      JOIN stops s_origin ON r.origin_stop_id = s_origin.id
      JOIN stops s_dest ON r.destination_stop_id = s_dest.id
      LEFT JOIN trips t ON t.route_id = ds.route_id 
        AND t.car_id = ds.car_id 
        AND DATE(t.departure_time) = ?
        AND t.is_active = 1
      WHERE ds.is_active = 1
        AND c.is_active = 1
        AND comp.is_active = 1
        -- tolerate schemas where companies.status may be named differently or missing;
        AND (comp.status = 'approved' OR comp.status IS NULL OR comp.status = "")
        AND CONCAT(?, 'T', ds.departure_time) > ?
      ORDER BY ds.departure_time ASC
    `;

    const trips = await query(sql, [currentDate, currentDate, currentDate, currentDateTime]);

    // Get booked seats for each trip
    for (let trip of trips) {
      if (trip.trip_id) {
        const seatsSql = `
          SELECT COUNT(*) as booked_seats
          FROM tickets
          WHERE trip_id = ?
            AND ticket_status IN ('booked', 'confirmed', 'on_board')
        `;
        const seatResult = await query(seatsSql, [trip.trip_id]);
        trip.booked_seats = seatResult[0]?.booked_seats || 0;
        trip.available_seats = trip.capacity - (seatResult[0]?.booked_seats || 0);
      } else {
        trip.booked_seats = 0;
        trip.available_seats = trip.capacity;
      }
    }

    return trips;
  }

  static async update(id, tripData) {
    const fields = [];
    const params = [];

    Object.keys(tripData).forEach(key => {
      if (tripData[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(tripData[key]);
      }
    });

    if (fields.length === 0) return null;

    params.push(id);
    const sql = `UPDATE trips SET ${fields.join(', ')} WHERE id = ?`;

    await query(sql, params);
    return this.findById(id);
  }

  static async updateStatus(id, status) {
    const sql = `UPDATE trips SET status = ?, trip_status = ? WHERE id = ?`;
    await query(sql, [status, status, id]);
    return this.findById(id);
  }

  static async updateLastStop(id, stopId, stopTime) {
    const sql = `
      UPDATE trips
      SET last_stop_id = ?, last_stop_time = ?
      WHERE id = ?
    `;
    await query(sql, [stopId, stopTime, id]);
    return this.findById(id);
  }

  static async delete(id) {
    const sql = `DELETE FROM trips WHERE id = ?`;
    await query(sql, [id]);
    return true;
  }

  static async getOrCreate(routeId, carId, departureTime) {
    // Check if trip exists
    const findSql = `
      SELECT * FROM trips
      WHERE route_id = ? AND car_id = ? AND DATE(departure_time) = DATE(?)
        AND is_active = 1
      LIMIT 1
    `;

    const existing = await query(findSql, [routeId, carId, departureTime]);

    if (existing.length > 0) {
      return existing[0].id;
    }

    // Create new trip
    const car = await query('SELECT name FROM cars WHERE id = ?', [carId]);
    const driver = await query(
      'SELECT id FROM drivers WHERE plate_number = (SELECT plate_number FROM cars WHERE id = ?)',
      [carId]
    );

    const createSql = `
      INSERT INTO trips (route_id, car_id, car_name, driver_id, departure_time, status, is_active)
      VALUES (?, ?, ?, ?, ?, 'scheduled', 1)
    `;

    const result = await query(createSql, [
      routeId,
      carId,
      car[0]?.name || null,
      driver[0]?.id || null,
      departureTime
    ]);

    return result.insertId;
  }

  // New methods for API spec compliance
  static async findAllWithFilters(filters = {}, options = {}) {
    let sql = `
      SELECT t.id,
             t.trip_date,
             t.departure_time,
             t.arrival_time,
             s1.name as origin,
             s2.name as destination,
             t.total_seats as totalSeats,
             c.capacity,
             c.plate_number as busNumber,
             c.name as car_name,
             comp.company_name as company_name,
             comp.id as company_id,
             r.id as route_id,
             t.price,
             t.status,
             (SELECT COUNT(*) FROM tickets 
              WHERE trip_id = t.id 
              AND ticket_status IN ('booked', 'confirmed', 'on_board')) as booked_count
      FROM trips t
      JOIN stops s1 ON t.origin_id = s1.id
      JOIN stops s2 ON t.destination_id = s2.id
      JOIN routes r ON t.route_id = r.id
      JOIN cars c ON t.car_id = c.id
      JOIN companies comp ON c.company_id = comp.id
      WHERE comp.is_active = 1 AND c.is_active = 1 AND t.is_active = 1
    `;

    const params = [];

    if (filters.origin) {
      sql += ` AND s1.name LIKE ?`;
      params.push(`%${filters.origin}%`);
    }

    if (filters.destination) {
      sql += ` AND s2.name LIKE ?`;
      params.push(`%${filters.destination}%`);
    }

    if (filters.date) {
      sql += ` AND t.trip_date = ?`;
      params.push(filters.date);
    } else {
      // Only show future trips if no date filter
      sql += ` AND t.trip_date >= CURDATE()`;
    }

    const approvedOnly = options.approvedOnly !== false;
    if (approvedOnly) {
      // tolerate schemas without companies.status by allowing NULL/empty as approved
      sql += ` AND (comp.status = 'approved' OR comp.status IS NULL OR comp.status = '')`;
    }

    sql += ` ORDER BY t.trip_date ASC, t.departure_time ASC`;

    const trips = await query(sql, params);

    // Transform to match spec format and calculate real-time available seats
    const transformedTrips = await Promise.all(trips.map(async (trip) => {
      // Safely combine trip_date and departure_time into a single datetime string
      // trip.trip_date may be a Date object, a string, or null. Guard against invalid dates.
      let departureDateTime = null;
      let arrivalDateTime = null;

      if (trip.trip_date && trip.departure_time) {
        const dateObj = trip.trip_date instanceof Date ? trip.trip_date : new Date(trip.trip_date);
        if (!isNaN(dateObj.getTime())) {
          // Use 'T' separator for ISO-like datetime
          departureDateTime = `${dateObj.toISOString().split('T')[0]}T${trip.departure_time}`;
        } else {
          // Fallback: use raw trip_date string with T separator
          departureDateTime = `${trip.trip_date}T${trip.departure_time}`;
        }
      }

      if (trip.trip_date && trip.arrival_time) {
        const dateObj2 = trip.trip_date instanceof Date ? trip.trip_date : new Date(trip.trip_date);
        if (!isNaN(dateObj2.getTime())) {
          arrivalDateTime = `${dateObj2.toISOString().split('T')[0]}T${trip.arrival_time}`;
        } else {
          arrivalDateTime = `${trip.trip_date}T${trip.arrival_time}`;
        }
      }
      
      // Calculate available seats from total capacity minus booked
      const totalSeats = trip.capacity || trip.totalSeats || 40;
      const availableSeats = totalSeats - (trip.booked_count || 0);
      
      // Get list of booked seat numbers
      const bookedSeatsQuery = await query(
        `SELECT seat_number FROM tickets 
         WHERE trip_id = ? AND ticket_status IN ('booked', 'confirmed', 'on_board')
         ORDER BY CAST(seat_number AS UNSIGNED)`,
        [trip.id]
      );
      const bookedSeatNumbers = bookedSeatsQuery.map(s => parseInt(s.seat_number));
      
      // Generate list of available seat numbers
      const allSeats = Array.from({ length: totalSeats }, (_, i) => i + 1);
      const availableSeatNumbers = allSeats.filter(seat => !bookedSeatNumbers.includes(seat));
      
      // Provide both legacy snake_case keys and newer camelCase keys for frontend compatibility
      return {
        id: trip.id,
        tripId: trip.id,
        origin: trip.origin,
        destination: trip.destination,
        departure_time: departureDateTime, // legacy key used by older frontend components
        arrival_time: arrivalDateTime,
        departureTime: departureDateTime,
        arrivalTime: arrivalDateTime,
        price: Number(trip.price) || 5000,
        totalSeats: totalSeats,
        total_seats: totalSeats,
        availableSeats: availableSeats,
        available_seats: availableSeats,
        availableSeatNumbers: availableSeatNumbers,
        bookedSeats: bookedSeatNumbers,
        booked_seats: bookedSeatNumbers,
        busNumber: trip.busNumber,
        plate_number: trip.busNumber,
        companyName: trip.company_name,
        companyId: trip.company_id,
        status: trip.status
      };
    }));

    return transformedTrips;
  }

  static async findByIdWithDetails(id) {
    const sql = `
      SELECT t.*,
             r.name as route_name,
             r.origin_stop_id as origin_id,
             r.destination_stop_id as destination_id,
             s1.name as origin,
             s2.name as destination,
             c.plate_number as busNumber, 
             c.capacity as totalSeats, 
             c.name as car_name,
             d.name as driver_name, 
             d.phone as driver_phone
      FROM trips t
      JOIN routes r ON t.route_id = r.id
      JOIN stops s1 ON r.origin_stop_id = s1.id
      JOIN stops s2 ON r.destination_stop_id = s2.id
      JOIN cars c ON t.car_id = c.id
      LEFT JOIN drivers d ON t.driver_id = d.id
      WHERE t.id = ?
    `;

    const results = await query(sql, [id]);
    if (!results[0]) return null;

    const trip = results[0];

    // Get booked seats
    const seatsSql = `
      SELECT seat_number 
      FROM tickets 
      WHERE trip_id = ? AND status IN ('Pending', 'Accepted', 'On Board')
      ORDER BY seat_number
    `;
    const bookedSeatsResult = await query(seatsSql, [id]);
    const bookedSeats = bookedSeatsResult.map(s => s.seat_number.toString());

    return {
      tripId: `trip_${trip.id}`,
      origin: trip.origin,
      destination: trip.destination,
      departureTime: trip.departure_time,
      arrivalTime: trip.actual_arrival_time,
      price: 0, // Dynamic pricing
      totalSeats: trip.totalSeats,
      availableSeats: trip.totalSeats - bookedSeats.length,
      busNumber: trip.busNumber,
      bookedSeats: bookedSeats
    };
  }

  static async createFromSpec(tripData) {
    const { origin, destination, departureTime, arrivalTime, price, totalSeats, busNumber } = tripData;

    // Parse datetime into date and time
    const depDate = new Date(departureTime);
    if (isNaN(depDate.getTime())) {
      throw new Error('Invalid departureTime format');
    }
    const tripDate = depDate.toISOString().split('T')[0];
    const depTime = depDate.toTimeString().split(' ')[0];
    let arrTime = null;
    if (arrivalTime) {
      const arrDate = new Date(arrivalTime);
      if (isNaN(arrDate.getTime())) {
        throw new Error('Invalid arrivalTime format');
      }
      arrTime = arrDate.toTimeString().split(' ')[0];
    }

    // Find or create stops
    let originStop = await query('SELECT id FROM stops WHERE name = ?', [origin]);
    if (originStop.length === 0) {
      const result = await query('INSERT INTO stops (name) VALUES (?)', [origin]);
      originStop = [{ id: result.insertId }];
    }

    let destStop = await query('SELECT id FROM stops WHERE name = ?', [destination]);
    if (destStop.length === 0) {
      const result = await query('INSERT INTO stops (name) VALUES (?)', [destination]);
      destStop = [{ id: result.insertId }];
    }

    // Get first company or create one
    let company = await query('SELECT id FROM companies WHERE is_active = 1 LIMIT 1');
    if (company.length === 0) {
      const result = await query(
        'INSERT INTO companies (company_name, tin, phone, email, status, subscription_status, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
        ['Default Company', '000000000', '+250788000000', 'default@company.com', 'approved', 'active']
      );
      company = [{ id: result.insertId }];
    }

    // Find or create route
    let route = await query(
      'SELECT id FROM routes WHERE origin_stop_id = ? AND destination_stop_id = ? AND company_id = ?',
      [originStop[0].id, destStop[0].id, company[0].id]
    );
    
    if (route.length === 0) {
      const routeName = `${origin} - ${destination}`;
      const result = await query(
        'INSERT INTO routes (company_id, name, origin_stop_id, destination_stop_id, is_active) VALUES (?, ?, ?, ?, 1)',
        [company[0].id, routeName, originStop[0].id, destStop[0].id]
      );
      route = [{ id: result.insertId }];
    }

    // Find or create car
    let car = await query('SELECT id FROM cars WHERE plate_number = ?', [busNumber]);
    if (car.length === 0) {
      const result = await query(
        'INSERT INTO cars (company_id, plate_number, name, capacity, is_active) VALUES (?, ?, ?, ?, 1)',
        [company[0].id, busNumber, busNumber, totalSeats]
      );
      car = [{ id: result.insertId }];
    }

    // Create trip with the actual schema
    const tripSql = `
      INSERT INTO trips (
        route_id, car_id, driver_id, trip_date, departure_time, arrival_time,
        origin_id, destination_id, available_seats, total_seats, price, status, is_active
      )
      VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', 1)
    `;

    const result = await query(tripSql, [
      route[0].id,
      car[0].id,
      tripDate,
      depTime,
      arrTime,
      originStop[0].id,
      destStop[0].id,
      totalSeats,
      totalSeats,
      price || 5000
    ]);

    return result.insertId;
  }
}

module.exports = Trip;

// Backwards-compatible helper: find trips belonging to a company (via car -> company_id)
Trip.findByCompany = async function(companyId, filters = {}) {
  const params = [companyId];

  let sql = `
    SELECT t.*,
           r.name as route_name,
           c.plate_number, c.name as car_name, c.capacity,
           d.name as driver_name
    FROM trips t
    JOIN routes r ON t.route_id = r.id
    JOIN cars c ON t.car_id = c.id
    LEFT JOIN drivers d ON t.driver_id = d.id
    WHERE c.company_id = ?
  `;

  if (filters.status) {
    sql += ` AND t.status = ?`;
    params.push(filters.status);
  }

  if (filters.date) {
    sql += ` AND DATE(t.departure_time) = ?`;
    params.push(filters.date);
  }

  sql += ` ORDER BY t.departure_time DESC`;

  return await query(sql, params);
};
