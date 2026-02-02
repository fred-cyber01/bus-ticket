// backend/scripts/createManagersAndCustomers.js
require('dotenv').config({ path: './.env' });
const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');

async function run() {
  console.log('Creating company managers and sample customers...');

  const { data: companies, error: compErr } = await supabase.from('companies').select('*');
  if (compErr) throw new Error('Failed to list companies: ' + compErr.message);

  const managerPasswords = {};
  for (const c of companies) {
    const plain = 'Manager123!';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(plain, salt);

    // upsert manager by email
    const emailLocal = c.company_name.toLowerCase().replace(/[^a-z0-9]+/g, '.') + '@' + 'example.com';
    const manager = {
      company_id: c.id,
      name: `${c.company_name} Manager`,
      email: emailLocal,
      phone: c.phone || null,
      password: hash,
      role: 'manager',
      status: 'active'
    };

    // insert
    const { data: existing } = await supabase.from('company_managers').select('*').eq('email', manager.email).limit(1).single();
    if (existing) {
      await supabase.from('company_managers').update(manager).eq('email', manager.email);
    } else {
      await supabase.from('company_managers').insert(manager);
    }

    managerPasswords[c.company_name] = { email: manager.email, password: plain };
  }

  // Create a couple of customers
  const customers = [
    { user_name: 'alice', email: 'alice@example.com', phone: '+250788444444', password: await bcrypt.hash('Customer123!', await bcrypt.genSalt(10)), full_name: 'Alice Customer' },
    { user_name: 'bob', email: 'bob@example.com', phone: '+250788555555', password: await bcrypt.hash('Customer123!', await bcrypt.genSalt(10)), full_name: 'Bob Customer' }
  ];

  for (const cu of customers) {
    const { data: ex } = await supabase.from('users').select('*').eq('email', cu.email).limit(1).single();
    if (ex) {
      await supabase.from('users').update(cu).eq('email', cu.email);
    } else {
      await supabase.from('users').insert(cu);
    }
  }

  console.log('Managers created:');
  for (const k of Object.keys(managerPasswords)) {
    console.log(k + ':', managerPasswords[k].email, ' / ', managerPasswords[k].password);
  }
  console.log('Customers created: alice@example.com / Customer123!, bob@example.com / Customer123!');
}

run().then(() => console.log('Done')).catch(e => { console.error('Error:', e.message || e); process.exit(1); });
