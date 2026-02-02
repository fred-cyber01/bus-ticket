const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const moment = require('moment-timezone');

class CompanyManagerSupabase {
  static async create(managerData) {
    const { company_id, name, email, phone, password, role = 'manager' } = managerData;
    const password_hash = await bcrypt.hash(password, 10);

    const insert = {
      company_id,
      name,
      email,
      phone: phone || null,
      password: password_hash,
      role,
      status: 'active',
      created_at: moment().tz('Africa/Kigali').format('YYYY-MM-DD HH:mm:ss')
    };

    const { data, error } = await supabase.from('company_managers').insert([insert]).select('id').single();
    if (error) throw error;
    return data.id;
  }

  static async findByEmail(email) {
    const { data, error } = await supabase.from('company_managers').select('*, companies(*)').eq('email', email).eq('status', 'active').limit(1).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async findById(id) {
    const { data, error } = await supabase.from('company_managers').select('*, companies(*)').eq('id', id).limit(1).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async validatePassword(manager, password) {
    if (!manager || !manager.password) return false;
    return await bcrypt.compare(password, manager.password);
  }

  static async findByCompany(companyId) {
    const { data, error } = await supabase.from('company_managers').select('id, company_id, name as user_name, email, phone, role, status, created_at').eq('company_id', companyId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  static async update(id, updateData) {
    const updateObj = {
      name: updateData.name,
      email: updateData.email,
      phone: updateData.phone || null,
      status: updateData.status || 'active',
      updated_at: moment().tz('Africa/Kigali').format('YYYY-MM-DD HH:mm:ss')
    };
    const { error } = await supabase.from('company_managers').update(updateObj).eq('id', id);
    if (error) throw error;
    return true;
  }

  static async updatePassword(id, newPassword) {
    const password_hash = await bcrypt.hash(newPassword, 10);
    const { error } = await supabase.from('company_managers').update({ password: password_hash, updated_at: moment().tz('Africa/Kigali').format('YYYY-MM-DD HH:mm:ss') }).eq('id', id);
    if (error) throw error;
    return true;
  }

  static async delete(id) {
    const { error } = await supabase.from('company_managers').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}

module.exports = CompanyManagerSupabase;
