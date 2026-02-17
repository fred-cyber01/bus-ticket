// Quick script to check trips status
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const supabase = require('./config/supabase');

async function checkTrips() {
  console.log('🔍 Checking trips for customer booking...\n');
  
  try {
    // Check total trips
    const { data: allTrips, error: err1 } = await supabase
      .from('trips')
      .select('id, trip_date, status, is_active, available_seats, total_seats, occupied_seats')
      .order('trip_date', { ascending: true })
      .limit(10);
    
    if (err1) {
      console.error('Error:', err1);
      return;
    }
    
    console.log(`📊 Sample of first 10 trips:\n`);
    allTrips?.forEach(trip => {
      console.log(`Trip ${trip.id}:`);
      console.log(`  Date: ${trip.trip_date || 'N/A'}`);
      console.log(`  Status: ${trip.status || 'N/A'}`);
      console.log(`  is_active: ${trip.is_active}`);
      console.log(`  Available seats: ${trip.available_seats || 0}`);
      console.log(`  Total seats: ${trip.total_seats || 0}`);
      console.log(`  Occupied seats: ${trip.occupied_seats || 0}`);
      console.log('');
    });
    
    // Check how many have available_seats > 0
    const { data: availableTrips } = await supabase
      .from('trips')
      .select('count')
      .gt('available_seats', 0);
    
    console.log(`✅ Trips with available_seats > 0: ${availableTrips?.[0]?.count || 0}`);
    
    // Check how many are active
    const { data: activeTrips } = await supabase
      .from('trips')
      .select('count')
      .eq('is_active', true);
    
    console.log(`✅ Trips with is_active = true: ${activeTrips?.[0]?.count || 0}`);
    
    // Check trips for today
    const today = new Date().toISOString().split('T')[0];
    const { data: todayTrips } = await supabase
      .from('trips')
      .select('count')
      .eq('trip_date', today);
    
    console.log(`✅ Trips for today (${today}): ${todayTrips?.[0]?.count || 0}`);
    
    // Check if any trip meets customer criteria
    const { data: bookableTrips } = await supabase
      .from('trips')
      .select('count')
      .eq('is_active', true)
      .gt('available_seats', 0);
    
    console.log(`\n🎫 BOOKABLE TRIPS (is_active=true AND available_seats>0): ${bookableTrips?.[0]?.count || 0}`);
    
    if ((bookableTrips?.[0]?.count || 0) === 0) {
      console.log('\n❌ PROBLEM FOUND: No trips are bookable!');
      console.log('   Need to update trips to have:');
      console.log('   - is_active = true');
      console.log('   - available_seats > 0');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTrips();
