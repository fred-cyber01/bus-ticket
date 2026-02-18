// Fix trips to have proper origin_id, destination_id, and company_id
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const supabase = require('./config/supabase');

async function fixTripData() {
  console.log('🔧 Fixing trip data...\n');
  
  try {
    // Step 1: Get all stops to work with
    const { data: stops, error: stopsError } = await supabase
      .from('stops')
      .select('id, name');
      
    if (stopsError) {
      console.error('❌ Error fetching stops:', stopsError);
      return;
    }
    
    if (!stops || stops.length === 0) {
      console.log('❌ No stops found! You need to create stops first.');
      return;
    }
    
    console.log(`✅ Found ${stops.length} stops`);
    
    // Step 2: Get all companies
    const { data: companies, error: compError } = await supabase
      .from('companies')
      .select('id, company_name');
      
    if (compError) {
      console.error('❌ Error fetching companies:', compError);
      return;
    }
    
    if (!companies || companies.length === 0) {
      console.log('❌ No companies found!');
      return;
    }
    
    console.log(`✅ Found ${companies.length} companies`);
    const firstCompany = companies[0];
    
    // Step 3: Update all cars to have company_id if they don't
    const { data: carsWithoutCompany } = await supabase
      .from('cars')
      .select('id, plate_number, company_id')
      .is('company_id', null);
      
    if (carsWithoutCompany && carsWithoutCompany.length > 0) {
      console.log(`\n🔧 Updating ${carsWithoutCompany.length} cars with company_id...`);
      
      for (const car of carsWithoutCompany) {
        const { error } = await supabase
          .from('cars')
          .update({ company_id: firstCompany.id })
          .eq('id', car.id);
          
        if (error) {
          console.error(`  ❌ Failed to update car ${car.plate_number}:`, error);
        } else {
          console.log(`  ✅ Updated car ${car.plate_number} with company ${firstCompany.company_name}`);
        }
      }
    }
    
    // Step 4: Get all trips with NULL origin_id or destination_id
    const { data: tripsToFix, error: tripsError } = await supabase
      .from('trips')
      .select('id, origin_id, destination_id, route_id, car_id')
      .or('origin_id.is.null,destination_id.is.null');
      
    if (tripsError) {
      console.error('❌ Error fetching trips:', tripsError);
      return;
    }
    
    if (!tripsToFix || tripsToFix.length === 0) {
      console.log('\n✅ All trips already have origin_id and destination_id set!');
      return;
    }
    
    console.log(`\n🔧 Found ${tripsToFix.length} trips to fix...`);
    
    // Step 5: For each trip, try to get stops from the route, or assign default stops
    for (const trip of tripsToFix) {
      let originId = trip.origin_id;
      let destId = trip.destination_id;
      
      // If trip has a route, get stops from route_stops
      if (trip.route_id) {
        const { data: routeStops } = await supabase
          .from('route_stops')
          .select('stop_id, stop_order')
          .eq('route_id', trip.route_id)
          .order('stop_order', { ascending: true });
          
        if (routeStops && routeStops.length >= 2) {
          // First stop is origin, last stop is destination
          originId = originId || routeStops[0].stop_id;
          destId = destId || routeStops[routeStops.length - 1].stop_id;
        }
      }
      
      // If still no stops, assign first two stops as defaults
      if (!originId && stops.length > 0) originId = stops[0].id;
      if (!destId && stops.length > 1) destId = stops[1].id;
      if (!destId && stops.length > 0) destId = stops[0].id;
      
      // Update the trip
      const { error: updateError } = await supabase
        .from('trips')
        .update({
          origin_id: originId,
          destination_id: destId,
          company_id: trip.company_id || firstCompany.id
        })
        .eq('id', trip.id);
        
      if (updateError) {
        console.error(`  ❌ Failed to update trip ${trip.id}:`, updateError);
      } else {
        const origin = stops.find(s => s.id === originId);
        const dest = stops.find(s => s.id === destId);
        console.log(`  ✅ Updated trip ${trip.id}: ${origin?.name || originId} → ${dest?.name || destId}`);
      }
    }
    
    // Step 6: Update all tickets to have the correct stops from their trips
    console.log('\n🔧 Updating tickets with trip information...');
    
    const { data: ticketsToFix } = await supabase
      .from('tickets')
      .select('id, trip_id, boarding_stop_id, dropoff_stop_id, company_id')
      .not('trip_id', 'is', null);
      
    if (ticketsToFix && ticketsToFix.length > 0) {
      for (const ticket of ticketsToFix) {
        // Get the trip data
        const { data: tripData } = await supabase
          .from('trips')
          .select('origin_id, destination_id, company_id')
          .eq('id', ticket.trip_id)
          .single();
          
        if (tripData) {
          const updates = {};
          if (!ticket.boarding_stop_id && tripData.origin_id) {
            updates.boarding_stop_id = tripData.origin_id;
          }
          if (!ticket.dropoff_stop_id && tripData.destination_id) {
            updates.dropoff_stop_id = tripData.destination_id;
          }
          if (!ticket.company_id && tripData.company_id) {
            updates.company_id = tripData.company_id;
          }
          
          if (Object.keys(updates).length > 0) {
            const { error } = await supabase
              .from('tickets')
              .update(updates)
              .eq('id', ticket.id);
              
            if (error) {
              console.error(`  ❌ Failed to update ticket ${ticket.id}:`, error);
            } else {
              console.log(`  ✅ Updated ticket ${ticket.id} with trip stops`);
            }
          }
        }
      }
    }
    
    console.log('\n✅ All done! Run the debug script again to verify:');
    console.log('   node backend/debug-ticket-data.js');
    
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

fixTripData();
