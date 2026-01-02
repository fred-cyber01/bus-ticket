// Setup Test Company Manager Account
const bcrypt = require('bcryptjs');
const db = require('./config/database');

console.log('🔧 Setting up Test Company Manager Account...\n');

(async () => {
  try {
    // Check if Rwanda Express Transport company exists
    console.log('1. Checking for Rwanda Express Transport company...');
    let company = await db.query(
      'SELECT * FROM companies WHERE email = ?',
      ['info@rwandaexpress.rw']
    );

    let companyId;

    if (company.length === 0) {
      console.log('   Creating Rwanda Express Transport company...');
      
      const companyResult = await db.query(`
        INSERT INTO companies (
          company_name, tin, email, phone, address, 
          status, subscription_status, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'Rwanda Express Transport',
        '123456789',
        'info@rwandaexpress.rw',
        '+250788000000',
        'Kigali, Rwanda',
        'approved',
        'active',
        1
      ]);
      
      companyId = companyResult.insertId;
      console.log(`   ✓ Company created with ID: ${companyId}`);
    } else {
      companyId = company[0].id;
      console.log(`   ✓ Company exists with ID: ${companyId}`);
      
      // Update status to approved and active
      await db.query(`
        UPDATE companies 
        SET status = 'approved', subscription_status = 'active', is_active = 1 
        WHERE id = ?
      `, [companyId]);
      console.log('   ✓ Company status updated to approved/active');
    }

    // Check company_managers table (this is what company login uses)
    console.log('\n2. Checking company_managers table...');
    const hashedPassword = await bcrypt.hash('manager123', 10);
    const companyManager = await db.query(
      'SELECT * FROM company_managers WHERE email = ?',
      ['manager@rwandaexpress.rw']
    );

    if (companyManager.length === 0) {
      console.log('   Creating company_managers record...');
      
      await db.query(`
        INSERT INTO company_managers (
          company_id, name, email, password, phone, role, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        companyId,
        'Rwanda Express Manager',
        'manager@rwandaexpress.rw',
        hashedPassword,
        '+250788000001',
        'manager',
        'active'
      ]);
      
      console.log('   ✓ Company manager record created');
    } else {
      console.log('   ✓ Company manager record exists');
      
      // Update password
      await db.query(`
        UPDATE company_managers 
        SET password = ?, company_id = ?, status = 'active', role = 'manager' 
        WHERE email = ?
      `, [hashedPassword, companyId, 'manager@rwandaexpress.rw']);
      
      console.log('   ✓ Company manager record updated');
    }

    // Verify the setup
    console.log('\n3. Verifying setup...');
    const verifyCompany = await db.query(
      'SELECT id, company_name, email, status, subscription_status FROM companies WHERE id = ?',
      [companyId]
    );
    
    const verifyManager = await db.query(
      'SELECT id, name, email, role, status, company_id FROM company_managers WHERE email = ?',
      ['manager@rwandaexpress.rw']
    );

    console.log('\n✅ Setup Complete!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 COMPANY DETAILS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Name: ${verifyCompany[0].company_name}`);
    console.log(`   Email: ${verifyCompany[0].email}`);
    console.log(`   Status: ${verifyCompany[0].status}`);
    console.log(`   Subscription: ${verifyCompany[0].subscription_status}`);
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 MANAGER LOGIN CREDENTIALS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Email: manager@rwandaexpress.rw`);
    console.log(`   Password: manager123`);
    console.log(`   Name: ${verifyManager[0].name}`);
    console.log(`   Role: ${verifyManager[0].role}`);
    console.log(`   Status: ${verifyManager[0].status}`);
    console.log('');
    console.log('🌐 LOGIN URL: http://localhost:5173');
    console.log('');
    console.log('✨ You can now login with these credentials!');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
})();
