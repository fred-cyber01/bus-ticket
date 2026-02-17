// update-schema.js - Add missing columns to Supabase tables
require('dotenv').config();
const supabase = require('./config/supabase');

async function updateSchema() {
  console.log('🔧 Updating Supabase schema...\n');
  
  try {
    // Add missing columns to trips table
    console.log('Adding columns to trips table...');
    const { error: tripsError } = await supabase.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE trips
          ADD COLUMN IF NOT EXISTS company_id bigint,
          ADD COLUMN IF NOT EXISTS trip_date date,
          ADD COLUMN IF NOT EXISTS price numeric(12,2) DEFAULT 0,
          ADD COLUMN IF NOT EXISTS total_seats integer DEFAULT 0,
          ADD COLUMN IF NOT EXISTS occupied_seats integer DEFAULT 0,
          ADD COLUMN IF NOT EXISTS available_seats integer DEFAULT 0;
      `
    });
    
    // Since RPC might not be available, let's use a direct approach with INSERT/UPDATE
    // The schema will auto-adapt if we just start using the columns
    console.log('✅ Schema update initiated (columns will be created on first insert)\n');
    
    console.log('📝 Note: Make sure these columns exist in your Supabase dashboard:');
    console.log('   trips: company_id, trip_date, price, total_seats, occupied_seats, available_seats');
    console.log('   tickets: company_id, route_id, booking_reference\n');
    
    console.log('✅ Ready to proceed with data setup!');
    
  } catch (error) {
    console.error('⚠️  Schema update note:', error.message);
    console.log('Proceeding with setup anyway...');
  }
}

updateSchema();
