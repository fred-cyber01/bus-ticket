const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('../config/database');

const schemaPath = path.join(__dirname, '../../database/ticketbooking.mysql.sql');
const paymentSchemaPath = path.join(__dirname, '../../database/payment_subscription_schema.mysql.sql');

async function executeSqlFile(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  const statements = sql.split(/;\s*$/m);
  for (const statement of statements) {
    if (statement.trim()) {
      await db.query(statement);
    }
  }
}

async function initializeDatabase() {
  console.log('🔄 Initializing database...\n');

  try {
    console.log('📄 Reading main schema...');
    await executeSqlFile(schemaPath);
    console.log('✓ Main schema executed');

    console.log('📄 Reading payment/subscription schema...');
    await executeSqlFile(paymentSchemaPath);
    console.log('✓ Payment/subscription schema executed');

    console.log('\n👤 Creating admin user...');
    const adminPassword = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    await db.query(
      `INSERT INTO admins (id, email, password, name, created_at) VALUES (1, 'admin@ticketbus.rw', ?, 'System Administrator', NOW()) ON DUPLICATE KEY UPDATE email=email`,
      [hashedPassword]
    );

    console.log('✓ Admin user created');
    console.log('   Email: admin@ticketbus.rw');
    console.log('   Password: admin123');

    console.log('\n🏢 Creating sample company...');
    await db.query(`
      INSERT IGNORE INTO companies (id, name, tin, phone, email, address, status, subscription_status, is_active, created_at)
      VALUES (1, 'Elite Express Rwanda', '123456789', '+250788000001', 'info@eliteexpress.rw', 'KN 23 Ave, Kigali', 'approved', 'active', 1, NOW())
    `);

    const managerPassword = 'manager123';
    const managerHash = await bcrypt.hash(managerPassword, salt);

    await db.query(`
      INSERT IGNORE INTO company_managers (id, company_id, user_name, email, phone, password_hash, role, created_at)
      VALUES (1, 1, 'Company Manager', 'manager@eliteexpress.rw', '+250788000002', ?, 'manager', NOW())
    `, [managerHash]);

    console.log('✓ Sample company created');
    console.log('   Manager Email: manager@eliteexpress.rw');
    console.log('   Manager Password: manager123');

    console.log('\n👥 Creating sample customer...');
    const customerPassword = 'customer123';
    const customerHash = await bcrypt.hash(customerPassword, salt);

    await db.query(`
      INSERT IGNORE INTO users (id, user_name, email, phone, password_hash, created_at)
      VALUES (1, 'John Doe', 'customer@example.com', '+250788000003', ?, NOW())
    `, [customerHash]);

    console.log('✓ Sample customer created');
    console.log('   Email: customer@example.com');
    console.log('   Password: customer123');

    console.log('\n✅ Database initialization complete!\n');
  } catch (error) {
    console.error('\n❌ Error initializing database:', error);
    return false;
  } finally {
    await db.closeDatabase();
  }
}

initializeDatabase();