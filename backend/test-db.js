// Test database connection and basic queries
const db = require('./config/database');

console.log('🔍 Testing Database Connection...\n');

(async () => {
  try {
    // Test connection
    console.log('1. Testing MySQL connection...');
    await db.testConnection();
    console.log('   ✓ MySQL connected\n');

    // Test tables exist
    console.log('2. Checking tables...');
    const tables = await db.query('SHOW TABLES');
    console.log(`   ✓ Found ${tables.length} tables`);
    
    // List all tables
    console.log('   Tables:');
    tables.forEach((table, index) => {
      const tableName = Object.values(table)[0];
      console.log(`   ${index + 1}. ${tableName}`);
    });
    console.log('');

    // Test data exists
    console.log('3. Checking data...');
    
    const users = await db.query('SELECT COUNT(*) as count FROM users');
    console.log(`   Users: ${users[0].count}`);
    
    const companies = await db.query('SELECT COUNT(*) as count FROM companies');
    console.log(`   Companies: ${companies[0].count}`);
    
    const trips = await db.query('SELECT COUNT(*) as count FROM trips');
    console.log(`   Trips: ${trips[0].count}`);
    
    const tickets = await db.query('SELECT COUNT(*) as count FROM tickets');
    console.log(`   Tickets: ${tickets[0].count}`);
    
    console.log('\n✅ Database is ready!\n');
    
    // Sample data check
    console.log('4. Sample company:');
    const sampleCompany = await db.query('SELECT company_name, email, status FROM companies LIMIT 1');
    if (sampleCompany.length > 0) {
      console.log(`   Name: ${sampleCompany[0].company_name}`);
      console.log(`   Email: ${sampleCompany[0].email}`);
      console.log(`   Status: ${sampleCompany[0].status}`);
    }
    
    console.log('\n✅ All tests passed! You can start the server now.\n');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n⚠️  Make sure:');
    console.error('   1. XAMPP MySQL is running');
    console.error('   2. Database "ticketbooking" exists');
    console.error('   3. Tables are created (import COMPLETE_DATABASE_SETUP.sql)\n');
    process.exit(1);
  }
})();
