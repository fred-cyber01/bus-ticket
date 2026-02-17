// Check database and populate if empty
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const supabase = require('./config/supabase');

async function checkAndPopulate() {
  console.log('🔍 Checking database...');
  
  try {
    // Check if companies exist
    const { data: companies, error: compError } = await supabase
      .from('companies')
      .select('*')
      .limit(1);
    
    if (compError) {
      console.error('❌ Error checking companies:', compError);
      return;
    }
    
    if (!companies || companies.length === 0) {
      console.log('❌ No companies found! Run setup-complete-system.js first.');
      console.log('   Command: node backend/setup-complete-system.js');
      return;
    }
    
    console.log(`✅ Found ${companies.length}+ companies`);
    
    // Check cars
    const { data: cars } = await supabase.from('cars').select('count');
    console.log(`🚌 Buses: ${cars?.[0]?.count || 0}`);
    
    // Check drivers
    const { data: drivers } = await supabase.from('drivers').select('count');
    console.log(`👨‍✈️ Drivers: ${drivers?.[0]?.count || 0}`);
    
    // Check routes
    const { data: routes } = await supabase.from('routes').select('count');
    console.log(`🛣️ Routes: ${routes?.[0]?.count || 0}`);
    
    // Check trips
    const { data: trips } = await supabase.from('trips').select('count');
    console.log(`🎫 Trips: ${trips?.[0]?.count || 0}`);
    
    if (cars?.[0]?.count === 0 || drivers?.[0]?.count === 0) {
      console.log('\n❌ Database is empty! Please run:');
      console.log('   node backend/setup-complete-system.js');
      return;
    }
    
    console.log('\n✅ Database has data!');
    
    // Get a sample company to test
    const { data: allCompanies } = await supabase
      .from('companies')
      .select('id, company_name, email')
      .limit(7);
    
    console.log('\n📋 Available Companies:');
    allCompanies?.forEach((comp, idx) => {
      console.log(`   ${idx + 1}. ${comp.company_name}`);
      console.log(`      Email: ${comp.email}`);
      console.log(`      Password: manager123`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAndPopulate();
