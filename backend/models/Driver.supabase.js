const adapter = require('../adapters/supabaseAdapter');

class DriverSupabase {
  static async listByCompany(companyId) {
    return await adapter.listDrivers(companyId);
  }

  static async findById(id) {
    return await adapter.getDriverById(id);
  }

  static async create(driverData) {
    const supabase = require('../config/supabase');
    const { data, error } = await supabase.from('drivers').insert([driverData]).select('id').single();
    if (error) throw error;
    return data.id;
  }

  static async update(id, data) {
    const supabase = require('../config/supabase');
    const { error } = await supabase.from('drivers').update(data).eq('id', id);
    if (error) throw error;
    return await this.findById(id);
  }

  static async delete(id) {
    const supabase = require('../config/supabase');
    const { error } = await supabase.from('drivers').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}

module.exports = DriverSupabase;
