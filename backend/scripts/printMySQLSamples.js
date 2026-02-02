// backend/scripts/printMySQLSamples.js
require('dotenv').config({ path: './.env' });
const db = require('../config/database');

(async () => {
  try {
    console.log('MySQL sample data:');
    const companies = await db.query('SELECT id, company_name, email, phone, status, subscription_status FROM companies ORDER BY id DESC LIMIT 5');
    console.log('\nCompanies:');
    console.table(companies);

    const managers = await db.query('SELECT id, company_id, name, email, phone, role, status FROM company_managers ORDER BY id DESC LIMIT 10');
    console.log('\nCompany Managers:');
    console.table(managers);

    const users = await db.query('SELECT id, user_name, email, phone, full_name FROM users ORDER BY id DESC LIMIT 10');
    console.log('\nUsers:');
    console.table(users);

    const tickets = await db.query('SELECT id, user_id, trip_id, seat_number, price, ticket_status, payment_status FROM tickets ORDER BY id DESC LIMIT 10');
    console.log('\nTickets:');
    console.table(tickets);

    process.exit(0);
  } catch (err) {
    console.error('Error querying MySQL:', err.message || err);
    process.exit(1);
  }
})();
