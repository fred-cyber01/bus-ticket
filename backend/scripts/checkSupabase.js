// backend/scripts/checkSupabase.js
require('dotenv').config({ path: './.env' });
const supabase = require('../config/supabase');

async function checkTableCount(table) {
  try {
    const { data, error, count } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: false });
    if (error) {
      console.error(`${table}: ERROR ->`, error.message || error);
      return { table, error: error.message || error };
    }
    console.log(`${table}: ${Array.isArray(data) ? data.length : 0} rows (count reported: ${count})`);
    return { table, count: count ?? (Array.isArray(data) ? data.length : 0) };
  } catch (err) {
    console.error(`${table}: EXCEPTION ->`, err.message || err);
    return { table, error: err.message || err };
  }
}

async function runChecks() {
  console.log('Supabase URL:', process.env.SUPABASE_URL ? process.env.SUPABASE_URL.replace(/(https?:\/\/)[^@/]+@?/, '$1') : 'NOT SET');
  const tables = ['users','trips','routes','tickets','companies','stops'];
  const results = [];
  for (const t of tables) {
    // eslint-disable-next-line no-await-in-loop
    results.push(await checkTableCount(t));
  }
  console.log('\nSummary:');
  results.forEach(r => console.log(r.table, '-', r.count ?? r.error));
}

runChecks().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
