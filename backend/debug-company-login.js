// Debug Company Login Issue
const bcrypt = require('bcryptjs');
const db = require('./config/database');

console.log('🔍 Debugging Company Manager Login Issue...\n');

(async () => {
  try {
    // Check company_managers table
    console.log('1. Checking company_managers table for manager@rwandaexpress.rw...');
    const managers = await db.query(
      'SELECT id, company_id, name, email, phone, role, status, password FROM company_managers WHERE email = ?',
      ['manager@rwandaexpress.rw']
    );

    if (managers.length === 0) {
      console.log('   ❌ NO MANAGER FOUND in company_managers table!');
      console.log('   Need to run: node setup-test-manager.js\n');
      
      // Check if it exists in users table instead
      console.log('2. Checking users table...');
      const users = await db.query(
        'SELECT id, user_name, email, role, company_id, is_active FROM users WHERE email = ?',
        ['manager@rwandaexpress.rw']
      );
      
      if (users.length > 0) {
        console.log('   ⚠️ Found in users table but NOT in company_managers!');
        console.log('   User details:', users[0]);
        console.log('\n   SOLUTION: Run node setup-test-manager.js to create company_managers record\n');
      } else {
        console.log('   ❌ Not found in users table either\n');
        console.log('   SOLUTION: Run node setup-test-manager.js to create account\n');
      }
    } else {
      const manager = managers[0];
      console.log('   ✓ Manager found!');
      console.log('   Details:', {
        id: manager.id,
        company_id: manager.company_id,
        name: manager.name,
        email: manager.email,
        role: manager.role,
        status: manager.status
      });

      // Test password
      console.log('\n2. Testing password "manager123"...');
      const testPassword = 'manager123';
      const isValid = await bcrypt.compare(testPassword, manager.password);
      
      if (isValid) {
        console.log('   ✓ Password is CORRECT!');
      } else {
        console.log('   ❌ Password is WRONG!');
        console.log('   The hashed password in database does not match "manager123"');
        console.log('\n   SOLUTION: Run node setup-test-manager.js to reset password\n');
      }

      // Check status
      console.log('\n3. Checking account status...');
      if (manager.status === 'active') {
        console.log('   ✓ status = active');
      } else {
        console.log('   ❌ status =', manager.status, '(Should be "active")');
      }

      // Check company
      if (manager.company_id) {
        console.log('\n4. Checking linked company...');
        const companies = await db.query(
          'SELECT id, company_name, email, status, subscription_status, is_active FROM companies WHERE id = ?',
          [manager.company_id]
        );
        
        if (companies.length > 0) {
          const company = companies[0];
          console.log('   ✓ Company found:');
          console.log('   ', {
            name: company.company_name,
            email: company.email,
            status: company.status,
            subscription_status: company.subscription_status,
            is_active: company.is_active
          });
        } else {
          console.log('   ❌ Company not found with ID:', manager.company_id);
        }
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 RECOMMENDED ACTION:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Run this command to fix the account:');
    console.log('   node setup-test-manager.js\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
})();
