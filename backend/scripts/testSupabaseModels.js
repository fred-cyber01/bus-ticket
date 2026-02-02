require('dotenv').config({ path: './.env' });
const Company = require('../models/Company.supabase');
const User = require('../models/User.supabase');
const supabase = require('../config/supabase');

(async () => {
  try {
    console.log('Testing Supabase models...');

    // List existing companies
    const companies = await Company.listAll();
    console.log('Companies count:', companies.length || 0);

    // Create a test company
    const name = `TestCo-${Date.now()}`;
    const companyId = await Company.create({ company_name: name, tin: 'T123', phone: '+250788000000', email: `${name.toLowerCase()}@example.com`, status: 'approved' });
    console.log('Created company id:', companyId);

    // Read back
    const found = await Company.findById(companyId);
    console.log('Found company:', found && found.company_name);

    // Create a test user
    const userEmail = `supatest+${Date.now()}@example.com`;
    const userId = await User.create({ user_name: 'supatest', email: userEmail, password: 'TestPass123!' });
    console.log('Created user id:', userId);

    const fetchedUser = await User.findByEmail(userEmail);
    console.log('Fetched user email:', fetchedUser && fetchedUser.email);

    const ok = await User.verifyPassword(userEmail, 'TestPass123!');
    console.log('Password verification result:', ok);

    // Cleanup created rows
    await supabase.from('users').delete().eq('id', userId);
    await supabase.from('companies').delete().eq('id', companyId);

    console.log('Cleanup done. Supabase models test completed.');
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err.message || err);
    process.exit(1);
  }
})();
