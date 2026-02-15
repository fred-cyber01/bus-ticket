// Script to create test accounts for ticket booking system
require('dotenv').config();
const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');

async function createTestAccounts() {
  console.log('🔧 Creating/Updating Test Accounts...\n');

  try {
    // 1. Create Customer Account
    console.log('1️⃣  Creating Customer Account...');
    const customerPassword = await bcrypt.hash('customer123', 10);
    
    const { data: existingCustomer } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'customer@example.com')
      .single();

    if (existingCustomer) {
      console.log('   Customer exists, updating password...');
      await supabase
        .from('users')
        .update({ 
          password: customerPassword,
          is_active: true,
          user_name: 'customer'
        })
        .eq('email', 'customer@example.com');
      console.log('   ✅ Customer account updated');
    } else {
      console.log('   Creating new customer...');
      const { error } = await supabase
        .from('users')
        .insert({
          user_name: 'customer',
          email: 'customer@example.com',
          password: customerPassword,
          phone: '+250788123456',
          full_name: 'Test Customer',
          is_active: true
        });
      
      if (error) {
        console.log('   ❌ Error:', error.message);
      } else {
        console.log('   ✅ Customer account created');
      }
    }

    // 2. Create Admin Account
    console.log('\n2️⃣  Creating Admin Account...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    const { data: existingAdmin } = await supabase
      .from('admins')
      .select('*')
      .eq('email', 'admin@ticketbus.rw')
      .single();

    if (existingAdmin) {
      console.log('   Admin exists, updating password...');
      await supabase
        .from('admins')
        .update({ 
          password: adminPassword,
          is_active: true
        })
        .eq('email', 'admin@ticketbus.rw');
      console.log('   ✅ Admin account updated');
    } else {
      console.log('   Creating new admin...');
      const { error } = await supabase
        .from('admins')
        .insert({
          name: 'System Administrator',
          email: 'admin@ticketbus.rw',
          password: adminPassword,
          role: 'superadmin',
          is_active: true
        });
      
      if (error) {
        console.log('   ❌ Error:', error.message);
      } else {
        console.log('   ✅ Admin account created');
      }
    }

    // 3. Check/Create Company for Manager
    console.log('\n3️⃣  Checking Company...');
    let companyId;
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('*')
      .eq('email', 'info@rwandaexpress.rw')
      .single();

    if (existingCompany) {
      console.log('   ✅ Company exists:', existingCompany.company_name);
      companyId = existingCompany.id;
    } else {
      console.log('   Creating new company...');
      const { data: newCompany, error } = await supabase
        .from('companies')
        .insert({
          company_name: 'Rwanda Express LTD',
          email: 'info@rwandaexpress.rw',
          phone: '+250788000000',
          address: 'Kigali, Rwanda',
          status: 'active',
          subscription_status: 'active',
          is_active: true,
          bus_limit: 10
        })
        .select()
        .single();
      
      if (error) {
        console.log('   ❌ Error:', error.message);
      } else {
        console.log('   ✅ Company created');
        companyId = newCompany.id;
      }
    }

    // 4. Create Company Manager Account
    console.log('\n4️⃣  Creating Company Manager Account...');
    const managerPassword = await bcrypt.hash('manager123', 10);
    
    const { data: existingManager } = await supabase
      .from('company_managers')
      .select('*')
      .eq('email', 'manager@rwandaexpress.rw')
      .single();

    if (existingManager) {
      console.log('   Manager exists, updating password...');
      await supabase
        .from('company_managers')
        .update({ 
          password: managerPassword,
          status: 'active',
          company_id: companyId
        })
        .eq('email', 'manager@rwandaexpress.rw');
      console.log('   ✅ Manager account updated');
    } else {
      console.log('   Creating new manager...');
      const { error } = await supabase
        .from('company_managers')
        .insert({
          company_id: companyId,
          name: 'Rwanda Express Manager',
          email: 'manager@rwandaexpress.rw',
          password: managerPassword,
          phone: '+250788000000',
          role: 'manager',
          status: 'active'
        });
      
      if (error) {
        console.log('   ❌ Error:', error.message);
      } else {
        console.log('   ✅ Manager account created');
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST ACCOUNTS READY!\n');
    console.log('📋 LOGIN CREDENTIALS:\n');
    console.log('👤 CUSTOMER (For Buying Tickets):');
    console.log('   Email:    customer@example.com');
    console.log('   Password: customer123\n');
    console.log('🏢 COMPANY MANAGER:');
    console.log('   Email:    manager@rwandaexpress.rw');
    console.log('   Password: manager123\n');
    console.log('👨‍💼 ADMIN:');
    console.log('   Email:    admin@ticketbus.rw');
    console.log('   Password: admin123\n');
    console.log('='.repeat(60));
    console.log('\n✅ You can now login and buy tickets!');
    console.log('🌐 Go to: https://bus-ticket-c8ld.onrender.com\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message || error);
    process.exit(1);
  }
}

// Run the script
createTestAccounts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
