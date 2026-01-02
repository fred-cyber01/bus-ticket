const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function resetCompanyManagerPassword() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ticketbooking'
  });

  try {
    // Hash the new password
    const password = 'manager123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update company manager password
    await connection.execute(
      'UPDATE company_managers SET password = ? WHERE email = ?',
      [hashedPassword, 'manager@rwandaexpress.rw']
    );

    console.log('✅ Company manager password reset successfully!');
    console.log('Email: manager@rwandaexpress.rw');
    console.log('Password: manager123');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

resetCompanyManagerPassword();
