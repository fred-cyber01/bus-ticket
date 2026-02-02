// backend/scripts/syncSupabaseToMySQL.js
require('dotenv').config({ path: './.env' });
const supabase = require('../config/supabase');
const db = require('../config/database');

async function upsertCompany(c) {
  const existing = await db.queryOne('SELECT * FROM companies WHERE company_name = ? OR email = ?', [c.company_name, c.email]);
  if (existing) {
    await db.query(`UPDATE companies SET tin = ?, phone = ?, address = ?, status = ?, subscription_status = ?, is_active = ? WHERE id = ?`, [c.tin || null, c.phone || null, c.address || null, c.status || 'active', c.subscription_status || 'trial', c.is_active ? 1 : 0, existing.id]);
    return existing.id;
  }
  const res = await db.query(`INSERT INTO companies (company_name, tin, phone, email, address, status, subscription_status, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`, [c.company_name, c.tin || null, c.phone || null, c.email || null, c.address || null, c.status || 'active', c.subscription_status || 'trial', c.is_active ? 1 : 0]);
  return res.insertId;
}

async function upsertManager(m, companyId) {
  const existing = await db.queryOne('SELECT * FROM company_managers WHERE email = ?', [m.email]);
  if (existing) {
    await db.query('UPDATE company_managers SET company_id = ?, name = ?, phone = ?, password = ?, role = ?, status = ? WHERE id = ?', [companyId, m.name || existing.name, m.phone || existing.phone, m.password || existing.password, m.role || existing.role, m.status || existing.status, existing.id]);
    return existing.id;
  }
  const res = await db.query('INSERT INTO company_managers (company_id, name, email, phone, password, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())', [companyId, m.name || null, m.email, m.phone || null, m.password || null, m.role || 'manager', m.status || 'active']);
  return res.insertId;
}

async function upsertUser(u) {
  const existing = await db.queryOne('SELECT * FROM users WHERE email = ?', [u.email]);
  if (existing) {
    await db.query('UPDATE users SET user_name = ?, phone = ?, password = ?, full_name = ? WHERE id = ?', [u.user_name || existing.user_name, u.phone || existing.phone, u.password || existing.password, u.full_name || existing.full_name, existing.id]);
    return existing.id;
  }
  const res = await db.query('INSERT INTO users (user_name, email, phone, password, full_name, created_at) VALUES (?, ?, ?, ?, ?, NOW())', [u.user_name || null, u.email, u.phone || null, u.password || null, u.full_name || null]);
  return res.insertId;
}

async function run() {
  console.log('Syncing companies from Supabase to MySQL...');
  const { data: companies, error: compErr } = await supabase.from('companies').select('*');
  if (compErr) throw new Error('Failed to fetch companies: ' + compErr.message);
  const companyMap = {};
  for (const c of companies) {
    const id = await upsertCompany(c);
    companyMap[c.id] = id; // map supabase id -> mysql id
    console.log(`Company synced: ${c.company_name} -> ${id}`);
  }

  console.log('\nSyncing company managers...');
  const { data: managers, error: manErr } = await supabase.from('company_managers').select('*');
  if (manErr) throw new Error('Failed to fetch managers: ' + manErr.message);
  for (const m of managers) {
    // m.company_id refers to supabase company id; map to mysql id
    const mysqlCompanyId = companyMap[m.company_id] || null;
    const manId = await upsertManager(m, mysqlCompanyId);
    console.log(`Manager synced: ${m.email} -> ${manId}`);
  }

  console.log('\nSyncing users...');
  const { data: users, error: userErr } = await supabase.from('users').select('*');
  if (userErr) throw new Error('Failed to fetch users: ' + userErr.message);
  for (const u of users) {
    const userId = await upsertUser(u);
    console.log(`User synced: ${u.email} -> ${userId}`);
  }

  console.log('\nSync complete.');
}

run().then(() => process.exit(0)).catch(e => { console.error('Error during sync:', e.message || e); process.exit(1); });
