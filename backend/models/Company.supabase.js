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
}

module.exports = CompanySupabase;
