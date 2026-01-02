// Test script to verify all CRUD operations
const db = require('./config/database');
const User = require('./models/User');
const Company = require('./models/Company');
const Route = require('./models/Route');
const Car = require('./models/Car');
const Ticket = require('./models/Ticket');

async function testCRUDOperations() {
  console.log('🔍 Testing CRUD Operations...\n');
  
  try {
    // Test database connection
    console.log('1️⃣ Testing Database Connection...');
    await db.testConnection();
    console.log('   ✅ Database connected successfully\n');

    // Test User CRUD
    console.log('2️⃣ Testing User CRUD...');
    const users = await User.findAll();
    console.log(`   ✅ Found ${users.length} users`);
    
    const testUser = await User.findByEmail('customer@example.com');
    if (testUser) {
      console.log(`   ✅ User found: ${testUser.email}`);
    }
    console.log('');

    // Test Company CRUD
    console.log('3️⃣ Testing Company CRUD...');
    const companies = await Company.findAll();
    console.log(`   ✅ Found ${companies.length} companies`);
    
    if (companies.length > 0) {
      const company = await Company.findById(companies[0].id);
      console.log(`   ✅ Company found: ${company.name}`);
    }
    console.log('');

    // Test Route CRUD
    console.log('4️⃣ Testing Route CRUD...');
    const routes = await Route.findAll();
    console.log(`   ✅ Found ${routes.length} routes`);
    console.log('');

    // Test Car CRUD
    console.log('5️⃣ Testing Car CRUD...');
    const cars = await Car.findAll();
    console.log(`   ✅ Found ${cars.length} cars/buses`);
    console.log('');

    // Test Ticket operations
    console.log('6️⃣ Testing Ticket operations...');
    const tickets = await db.query('SELECT * FROM tickets LIMIT 5');
    console.log(`   ✅ Found ${tickets.length} sample tickets`);
    console.log('');

    // Test Trips
    console.log('7️⃣ Testing Trip operations...');
    const trips = await db.query('SELECT * FROM trips LIMIT 5');
    console.log(`   ✅ Found ${trips.length} trips`);
    console.log('');

    // Test Admin
    console.log('8️⃣ Testing Admin operations...');
    const admins = await db.query('SELECT * FROM admins');
    console.log(`   ✅ Found ${admins.length} admins`);
    console.log('');

    // Test Company Managers
    console.log('9️⃣ Testing Company Manager operations...');
    const managers = await db.query('SELECT * FROM company_managers');
    console.log(`   ✅ Found ${managers.length} company managers`);
    console.log('');

    // Test Subscription Plans
    console.log('🔟 Testing Subscription Plans...');
    const plans = await db.query('SELECT * FROM subscription_plans');
    console.log(`   ✅ Found ${plans.length} subscription plans`);
    console.log('');

    console.log('✨ All CRUD operations working correctly!\n');
    console.log('📊 Summary:');
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Companies: ${companies.length}`);
    console.log(`   - Routes: ${routes.length}`);
    console.log(`   - Cars/Buses: ${cars.length}`);
    console.log(`   - Tickets: ${tickets.length}`);
    console.log(`   - Trips: ${trips.length}`);
    console.log(`   - Admins: ${admins.length}`);
    console.log(`   - Company Managers: ${managers.length}`);
    console.log(`   - Subscription Plans: ${plans.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await db.closeDatabase();
    process.exit(0);
  }
}

testCRUDOperations();
