// Fix ALL trips and tickets - Complete version
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const supabase = require('./config/supabase');

async function fixAllTripsAndTickets() {
  console.log('🔧 Fixing ALL trips and tickets in database...\n');
  
  try {
    // Get all stops
    const { data: stops } = await supabase.from('stops').select('id, name').order('id');
    if (!stops || stops.length < 2) {
      console.log('❌ Need at least 2 stops in database');
      return;
    }
    console.log(`✅ Found ${stops.length} stops`);
    
    // Get all companies
    const { data: companies } = await supabase.from('companies').select('id, company_name');
    if (!companies || companies.length === 0) {
      console.log('❌ No companies found');
      return;
    }
    console.log(`✅ Found ${companies.length} companies`);
    const defaultCompany = companies[0];
    
    // Fix all trips with NULL origin_id or destination_id
    console.log('\n🔧 Fixing trips...');
    const { data: brokenTrips } = await supabase
      .from('trips')
      .select('id, route_id, origin_id, destination_id, company_id')
      .or('origin_id.is.null,destination_id.is.null');
      
    if (!brokenTrips || brokenTrips.length === 0) {
      console.log('✅ All trips already have origin_id and destination_id!');
    } else {
      console.log(`Found ${brokenTrips.length} trips to fix...`);
      
      let fixed = 0;
      for (const trip of brokenTrips) {
        let originId = trip.origin_id;
        let destId = trip.destination_id;
        
        // Try to get from route_stops first
        if (trip.route_id && (!originId || !destId)) {
          const { data: routeStops } = await supabase
            .from('route_stops')
            .select('stop_id, stop_order')
            .eq('route_id', trip.route_id)
            .order('stop_order', { ascending: true });
            
          if (routeStops && routeStops.length >= 2) {
            originId = originId || routeStops[0].stop_id;
            destId = destId || routeStops[routeStops.length - 1].stop_id;
          }
        }
        
        // Fallback to first two stops
        if (!originId) originId = stops[0].id;
        if (!destId) destId = stops.length > 1 ? stops[1].id : stops[0].id;
        
        const { error } = await supabase
          .from('trips')
          .update({
            origin_id: originId,
            destination_id: destId,
            company_id: trip.company_id || defaultCompany.id
          })
          .eq('id', trip.id);
          
        if (!error) fixed++;
      }
      
      console.log(`✅ Fixed ${fixed} trips`);
    }
    
    // Fix all tickets with NULL boarding_stop_id or dropoff_stop_id
    console.log('\n🔧 Fixing tickets...');
    const { data: brokenTickets } = await supabase
      .from('tickets')
      .select('id, trip_id, boarding_stop_id, dropoff_stop_id, company_id')
      .not('trip_id', 'is', null)
      .or('boarding_stop_id.is.null,dropoff_stop_id.is.null,company_id.is.null');
      
    if (!brokenTickets || brokenTickets.length === 0) {
      console.log('✅ All tickets already have stop IDs!');
    } else {
      console.log(`Found ${brokenTickets.length} tickets to fix...`);
      
      let fixed = 0;
      for (const ticket of brokenTickets) {
        // Get trip data
        const { data: trip } = await supabase
          .from('trips')
          .select('origin_id, destination_id, company_id')
          .eq('id', ticket.trip_id)
          .single();
          
        if (trip && trip.origin_id && trip.destination_id) {
          const updates = {};
          if (!ticket.boarding_stop_id) updates.boarding_stop_id = trip.origin_id;
          if (!ticket.dropoff_stop_id) updates.dropoff_stop_id = trip.destination_id;
          if (!ticket.company_id) updates.company_id = trip.company_id;
          
          if (Object.keys(updates).length > 0) {
            const { error } = await supabase
              .from('tickets')
              .update(updates)
              .eq('id', ticket.id);
              
            if (!error) fixed++;
          }
        }
      }
      
      console.log(`✅ Fixed ${fixed} tickets`);
    }
    
    console.log('\n🎉 All done! Refresh your frontend to see the changes.');
    
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

fixAllTripsAndTickets();
