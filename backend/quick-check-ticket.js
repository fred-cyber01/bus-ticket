// Quick check on ticket #2 after fix
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const supabase = require('./config/supabase');

async function quickCheck() {
  const { data: ticket } = await supabase
    .from('tickets')
    .select(`
      *,
      trip:trips(
        *,
        car:cars(
          *,
          company:companies(company_name, phone)
        ),
        origin_stop:stops!trips_origin_id_fkey(name),
        destination_stop:stops!trips_destination_id_fkey(name)
      )
    `)
    .eq('id', 2)
    .single();
    
  if (!ticket || !ticket.trip) {
    console.log('❌ Ticket or trip not found');
    return;
  }
  
  const trip = ticket.trip || {};
  const car = trip.car || {};
  const company = car.company || {};
  const origin = trip.origin_stop || {};
  const dest = trip.destination_stop || {};
  
  console.log('\n📋 Ticket #2 Status:');
  console.log(`✅ From: ${origin.name || 'N/A'}`);
  console.log(`✅ To: ${dest.name || 'N/A'}`);
  console.log(`✅ Company: ${company.company_name || 'N/A'}`);
  console.log(`✅ Bus Plate: ${car.plate_number || 'N/A'}`);
  console.log(`✅ Seat: ${ticket.seat_number || 'N/A'}`);
  
  if (origin.name && dest.name && company.company_name) {
    console.log('\n🎉 SUCCESS! All fields are now populated!');
  } else {
    console.log('\n⚠️  Some fields still missing. Wait for fix script to complete.');
  }
}

quickCheck();
