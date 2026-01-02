const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function resetPasswords() {
  let connection;
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'ticketbooking'
    });

    console.log('✓ Database connected');

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const customerPassword = await bcrypt.hash('customer123', 10);
    const managerPassword = await bcrypt.hash('manager123', 10);
    const driverPassword = await bcrypt.hash('driver123', 10);

    // Update admin password
    await connection.execute('UPDATE admins SET password = ? WHERE email = ?', 
      [adminPassword, 'admin@ticketbus.rw']);
    console.log('✅ Admin password reset: admin@ticketbus.rw / admin123');

    // Update customer password
    await connection.execute('UPDATE users SET password = ? WHERE email = ?', 
      [customerPassword, 'customer@example.com']);
    console.log('✅ Customer password reset: customer@example.com / customer123');

    console.log('\n✅ All passwords reset successfully!');
    console.log('\n📋 LOGIN CREDENTIALS:');
    console.log('   Admin: admin@ticketbus.rw / admin123');
    console.log('   Customer: customer@example.com / customer123');
    
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

resetPasswords();
