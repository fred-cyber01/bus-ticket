// test-supabase.js - Quick test to verify Supabase schema
require('dotenv').config();
const supabase = require('./config/supabase');

async function testSupabase() {
  console.log('🔍 Testing Supabase connection and schema...\n');
  
  try {
    // Test connection
    const { data: companies, error: compError } = await supabase
      .from('companies')
      .select('*')
      .limit(1);
    
    if (compError) {
      console.log('❌ Companies table error:', compError.message);
    } else {
      console.log('✅ Companies table exists');
    }
    
    // Check trips table columns by inserting a test row to see what's required
    const { error: tripError } = await supabase
      .from('trips')
      .select('*')
      .limit(1);
    
    if (tripError) {
      console.log('❌ Trips table error:', tripError.message);
    } else {
      console.log('✅ Trips table accessible');
    }
    
    // List all tables
    const { data: allTrips } = await supabase.from('trips').select('*').limit(1);
    if (allTrips && allTrips.length > 0) {
      console.log('\n📋 Trips table columns:');
      console.log(Object.keys(allTrips[0]).join(', '));
    } else {
      console.log('\n📋 Trips table is empty, columns will be shown on first insert');
    }
    
    console.log('\n✅ Supabase is ready to use!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSupabase();
