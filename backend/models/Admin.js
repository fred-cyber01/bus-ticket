// models/Admin.js
// Use Supabase for admin operations (migrated from MySQL)
const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');

class Admin {
  static async create(adminData) {
    const { name, email, password, role = 'admin' } = adminData;
    const password_hash = await bcrypt.hash(password || 'changeme', 10);
    const insert = { name, email, password: password_hash, role, is_active: true };
    const { data, error } = await supabase.from('admins').insert([insert]).select().single();
    if (error) throw error;
    return data.id;
  }

  static async findById(id) {
    const { data, error } = await supabase.from('admins').select('id, name, email, role, is_active, created_at, updated_at, password').eq('id', id).limit(1).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  static async findByEmail(email) {
    const { data, error } = await supabase.from('admins').select('*').eq('email', email).limit(1).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  static async update(id, adminData) {
    const { name, email, role } = adminData;
    const { data, error } = await supabase.from('admins').update({ name, email, role }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  static async updatePassword(id, newPassword) {
    const password_hash = await bcrypt.hash(newPassword, 10);
    const { data, error } = await supabase.from('admins').update({ password: password_hash }).eq('id', id).select().single();
    if (error) throw error;
    return true;
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async getAll() {
    const { data, error } = await supabase.from('admins').select('id, name, email, role, is_active, created_at, updated_at').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  static async delete(id) {
    const { data, error } = await supabase.from('admins').delete().eq('id', id).select().single();
    if (error) throw error;
    return true;
  }

  static async toggleActive(id) {
    // get current
    const admin = await this.findById(id);
    if (!admin) return null;
    const { data, error } = await supabase.from('admins').update({ is_active: !admin.is_active }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  static async exists() {
    const { data, error } = await supabase.from('admins').select('id').limit(1).single();
    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  }
}

module.exports = Admin;
