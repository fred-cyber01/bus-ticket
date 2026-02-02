// During the Supabase migration the MySQL-backed model is replaced by the
// Supabase implementation. Re-export the Supabase model so existing imports
// continue to work.
module.exports = require('./Driver.supabase');
