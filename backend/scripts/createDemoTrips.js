const { query } = require('../config/database');
const moment = require('moment');

(async () => {
  try {
    console.log('Scanning routes to create demo trips...');
    // Select active routes joined with a car from same company
    const routes = await query(`
      SELECT r.id as route_id, r.name as route_name, r.origin_stop_id, r.destination_stop_id, r.company_id
      FROM routes r
      WHERE r.is_active = 1
    `);

    if (!routes || routes.length === 0) {
      console.log('No active routes found. Exiting.');
      process.exit(0);
    }

    for (const r of routes) {
      // find any active car for the company
      const cars = await query('SELECT id, plate_number, capacity FROM cars WHERE company_id = ? AND is_active = 1 LIMIT 1', [r.company_id]);
      if (!cars || cars.length === 0) {
        console.log(`No car found for company ${r.company_id} — skipping route ${r.route_id}`);
        continue;
      }
      const car = cars[0];

      // build departure for tomorrow at 08:00 and arrival at 12:00
      const depDate = moment().add(1, 'day').format('YYYY-MM-DD');
      const departure_time = '08:00:00';
      const arrival_time = '12:00:00';

      // Check if a trip already exists for this route/car on the chosen date
      const existing = await query(
        `SELECT id FROM trips WHERE route_id = ? AND car_id = ? AND trip_date = ? AND is_active = 1 LIMIT 1`,
        [r.route_id, car.id, depDate]
      );

      if (existing && existing.length > 0) {
        console.log(`Trip already exists for route ${r.route_id} on ${depDate}, skipping.`);
        continue;
      }

      // Insert trip
      const totalSeats = car.capacity || 40;
      const price = 5000;

      const insertSql = `
        INSERT INTO trips (
          route_id, car_id, trip_date, departure_time, arrival_time, origin_id, destination_id,
          available_seats, total_seats, price, status, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', 1)
      `;

      const result = await query(insertSql, [
        r.route_id,
        car.id,
        depDate,
        departure_time,
        arrival_time,
        r.origin_stop_id,
        r.destination_stop_id,
        totalSeats,
        totalSeats,
        price
      ]);

      console.log(`Created trip id=${result.insertId} for route ${r.route_id} on ${depDate}`);
    }

    console.log('Demo trip creation complete.');
    process.exit(0);
  } catch (err) {
    console.error('Error creating demo trips:', err);
    process.exit(1);
  }
})();
