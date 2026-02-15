// scripts/check-database-data.js
// Check what data exists in the Supabase database
require('dotenv').config();
const supabase = require('../config/supabase');

async function checkDatabaseData() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔍 CHECKING DATABASE DATA');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Check companies
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, company_name, email, status')
      .limit(10);
    
    if (companiesError) throw companiesError;
    
    console.log('📊 COMPANIES:');
    console.log(`   Total: ${companies?.length || 0}`);
    if (companies && companies.length > 0) {
      companies.forEach(c => {
        console.log(`   - ${c.company_name} (${c.email}) [${c.status}]`);
      });
    } else {
      console.log('   ⚠️  No companies found');
    }
    console.log('');

    // Check routes
    const { data: routes, error: routesError } = await supabase
      .from('routes')
      .select('id, name, origin_stop_id, destination_stop_id, distance_km, company_id')
      .limit(10);
    
    if (routesError) throw routesError;
    
    console.log('📊 ROUTES:');
    console.log(`   Total: ${routes?.length || 0}`);
    if (routes && routes.length > 0) {
      routes.forEach(r => {
        console.log(`   - ${r.name} (Stop ${r.origin_stop_id} → Stop ${r.destination_stop_id}) [${r.distance_km || 0}km] [Company: ${r.company_id}]`);
      });
    } else {
      console.log('   ⚠️  No routes found');
    }
    console.log('');

    // Check cars
    const { data: cars, error: carsError } = await supabase
      .from('cars')
      .select('id, plate_number, name, capacity, company_id')
      .limit(10);
    
    if (carsError) throw carsError;
    
    console.log('📊 CARS:');
    console.log(`   Total: ${cars?.length || 0}`);
    if (cars && cars.length > 0) {
      cars.forEach(c => {
        console.log(`   - ${c.plate_number} (${c.name}) - ${c.capacity} seats [Company: ${c.company_id}]`);
      });
    } else {
      console.log('   ⚠️  No cars found');
    }
    console.log('');

    // Check drivers
    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select('id, name, phone, license_number, company_id')
      .limit(10);
    
    if (driversError) throw driversError;
    
    console.log('📊 DRIVERS:');
    console.log(`   Total: ${drivers?.length || 0}`);
    if (drivers && drivers.length > 0) {
      drivers.forEach(d => {
        console.log(`   - ${d.name} (${d.phone}) License: ${d.license_number} [Company: ${d.company_id}]`);
      });
    } else {
      console.log('   ⚠️  No drivers found');
    }
    console.log('');

    // Check trips
    const { data: trips, error: tripsError } = await supabase
      .from('trips')
      .select('id, route_id, car_id, driver_id, departure_time, status, is_active')
      .order('departure_time', { ascending: false })
      .limit(10);
    
    if (tripsError) throw tripsError;
    
    console.log('📊 TRIPS:');
    console.log(`   Total: ${trips?.length || 0}`);
    if (trips && trips.length > 0) {
      trips.forEach(t => {
        console.log(`   - ID: ${t.id}, Departure: ${t.departure_time}, Route: ${t.route_id}, Car: ${t.car_id} [${t.status}]`);
      });
    } else {
      console.log('   ⚠️  No trips found - THIS IS WHY NO TICKETS ARE AVAILABLE! ⚠️');
      console.log('   💡 Solution: Create trips using the company dashboard or admin panel');
    }
    console.log('');

    // Check users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, user_name, email, is_active')
      .limit(5);
    
    if (usersError) throw usersError;
    
    console.log('📊 USERS:');
    console.log(`   Total: ${users?.length || 0}`);
    if (users && users.length > 0) {
      users.forEach(u => {
        console.log(`   - ${u.user_name} (${u.email}) [${u.is_active ? 'Active' : 'Inactive'}]`);
      });
    }
    console.log('');

    // Summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('📋 SUMMARY');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Companies: ${companies?.length || 0}`);
    console.log(`Routes: ${routes?.length || 0}`);
    console.log(`Cars: ${cars?.length || 0}`);
    console.log(`Drivers: ${drivers?.length || 0}`);
    console.log(`Trips: ${trips?.length || 0}`);
    console.log(`Users: ${users?.length || 0}`);
    console.log('');

    if (!trips || trips.length === 0) {
      console.log('⚠️  NO TRIPS FOUND!');
      console.log('');
      console.log('To fix this:');
      console.log('1. Login to company dashboard: https://bus-ticket-theta.vercel.app/company-login');
      console.log('   Email: manager@rwandaexpress.rw');
      console.log('   Password: manager123');
      console.log('');
      console.log('2. Create a route (if none exist)');
      console.log('3. Add a car (if none exist)');
      console.log('4. Add a driver (if none exist)');
      console.log('5. Create trips with future dates');
      console.log('');
      console.log('OR run: node scripts/create-sample-trips.js (if you create this script)');
    }

    console.log('✅ Database check complete!');

  } catch (error) {
    console.error('❌ Error checking database:', error.message);
    process.exit(1);
  }
}

checkDatabaseData();
