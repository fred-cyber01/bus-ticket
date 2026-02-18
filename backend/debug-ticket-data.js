// Debug ticket data to see what's being returned
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const supabase = require('./config/supabase');

async function debugTicketData() {
  console.log('🔍 Debugging ticket data...\n');
  
  try {
    // Get a sample ticket with all joins
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select(`
        *,
        trip:trips(
          *,
          car:cars(
            *,
            company:companies(*)
          ),
          origin_stop:stops!trips_origin_id_fkey(id, name),
          destination_stop:stops!trips_destination_id_fkey(id, name)
        )
      `)
      .limit(1);
      
    if (error) {
      console.error('❌ Error fetching tickets:', error);
      return;
    }
    
    if (!tickets || tickets.length === 0) {
      console.log('❌ No tickets found in database');
      return;
    }
    
    const ticket = tickets[0];
    console.log('📋 Raw Ticket Data:');
    console.log(JSON.stringify(ticket, null, 2));
    
    console.log('\n🔍 Extracted Fields:');
    const trip = ticket.trip || {};
    const car = trip.car || {};
    const company = car.company || {};
    const originStop = trip.origin_stop || {};
    const destStop = trip.destination_stop || {};
    
    console.log(`- Ticket ID: ${ticket.id}`);
    console.log(`- Trip ID: ${ticket.trip_id}`);
    console.log(`- Has trip data: ${!!trip.id}`);
    console.log(`- Origin ID in trip: ${trip.origin_id}`);
    console.log(`- Origin Stop Name: ${originStop.name || 'N/A'}`);
    console.log(`- Destination ID in trip: ${trip.destination_id}`);
    console.log(`- Destination Stop Name: ${destStop.name || 'N/A'}`);
    console.log(`- Car ID: ${trip.car_id}`);
    console.log(`- Has car data: ${!!car.id}`);
    console.log(`- Plate Number: ${car.plate_number || 'N/A'}`);
    console.log(`- Company ID in car: ${car.company_id}`);
    console.log(`- Has company data: ${!!company.id}`);
    console.log(`- Company Name: ${company.company_name || 'N/A'}`);
    
    // Check if the trip has NULL origin_id or destination_id
    if (!trip.origin_id || !trip.destination_id) {
      console.log('\n⚠️  WARNING: Trip is missing origin_id or destination_id!');
      console.log('   This is why From/To shows N/A');
      
      // Check if car has company_id
      if (!car.company_id) {
        console.log('\n⚠️  WARNING: Car is missing company_id!');
        console.log('   This is why Company shows N/A');
      }
      
      console.log('\n🔧 Fix Required:');
      console.log('   1. Update trips to have origin_id and destination_id');
      console.log('   2. Update cars to have company_id');
      console.log('   3. Run: node backend/fix-trip-stops.js');
    }
    
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

debugTicketData();
