const adapter = require('../adapters/supabaseAdapter');

class CompanySupabase {
  static async create(companyData) {
    // companyData: { company_name, tin, phone, email, status }
    const id = await adapter.upsertCompany(companyData);
    return id;
  }

  static async findById(id) {
    return await adapter.getCompanyById(id);
  }

  static async findByName(name) {
    return await adapter.findCompanyByName(name);
  }

  static async findByEmail(email) {
    const supabase = require('../config/supabase');
    const { data, error } = await supabase.from('companies').select('*').eq('email', email).limit(1).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  static async findByTin(tin) {
    const supabase = require('../config/supabase');
    const { data, error } = await supabase.from('companies').select('*').eq('tin', tin).limit(1).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  static async listAll() {
    return await adapter.listCompanies();
  }

  static async update(id, updateData) {
    const company = Object.assign({ id }, updateData);
    const idRes = await adapter.upsertCompany(company);
    return await this.findById(idRes || id);
  }

  static async delete(id) {
    const supabase = require('../config/supabase');
    const { error } = await supabase.from('companies').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  static async approve(id, adminId = null) {
    const supabase = require('../config/supabase');
    const update = { status: 'approved', approved_by: adminId, approved_at: new Date().toISOString() };
    const { data, error } = await supabase.from('companies').update(update).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  static async block(id) {
    const supabase = require('../config/supabase');
    const { data, error } = await supabase.from('companies').update({ status: 'suspended' }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  static async unblock(id) {
    const supabase = require('../config/supabase');
    const { data, error } = await supabase.from('companies').update({ status: 'active' }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  static async reject(id) {
    const supabase = require('../config/supabase');
    const { data, error } = await supabase.from('companies').update({ status: 'rejected' }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }
}

module.exports = CompanySupabase;
