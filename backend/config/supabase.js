// backend/config/supabase.js
// Simple Supabase client for server-side use
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Supabase URL or service key not set. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

module.exports = supabase;

// Example helpers (exported for convenience)
module.exports.users = {
  async create({ user_name, email, phone = null, password_hash, full_name = null }) {
    const { data, error } = await supabase
      .from('users')
      .insert([{ user_name, email, phone, password: password_hash, full_name }])
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  },

  async findByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') throw error; // ignore no rows
    return data;
  },

  async findById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('id, user_name, email, phone, full_name, is_active, created_at, updated_at')
      .eq('id', id)
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
};
