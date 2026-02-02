// models/CompanyManager.js
// During Supabase migration we use the Supabase-backed implementation.
if (process.env.USE_SUPABASE === 'true') {
  // Proxy to the Supabase-backed implementation during migration
  module.exports = require('./CompanyManager.supabase');
} else {
  // Fallback to original MySQL implementation is intentionally removed during full migration.
  module.exports = require('./CompanyManager.supabase');
}
