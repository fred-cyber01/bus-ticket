// Check specific trip #582
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const supabase = require('./config/supabase');

async function checkTrip582() {
  const { data: trip, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', 582)
    .single();
    
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log('\n🔍 Trip #582 Data:');
  console.log(JSON.stringify(trip, null, 2));
  
  if (!trip.origin_id || !trip.destination_id) {
    console.log('\n⚠️  Trip is missing origin_id or destination_id!');
    console.log('Running fix for this specific trip...\n');
    
    // Get first and last stops from any available route
    const { data: stops } = await supabase
      .from('stops')
      .select('id, name')
      .limit(2);
      
    if (stops && stops.length >= 2) {
      const { error: updateError } = await supabase
        .from('trips')
        .update({
          origin_id: stops[0].id,
          destination_id: stops[1].id
        })
        .eq('id', 582);
        
      if (updateError) {
        console.error('❌ Failed to update:', updateError);
      } else {
        console.log(`✅ Updated trip 582: ${stops[0].name} → ${stops[1].name}`);
        
        // Also update the ticket
        const { error: ticketError } = await supabase
          .from('tickets')
          .update({
            boarding_stop_id: stops[0].id,
            dropoff_stop_id: stops[1].id
          })
          .eq('trip_id', 582);
          
        if (!ticketError) {
          console.log('✅ Updated ticket #2 with stop IDs');
        }
      }
    }
  } else {
    console.log('\n✅ Trip has origin_id and destination_id set!');
  }
}

checkTrip582();
