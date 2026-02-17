const adapter = require('../adapters/supabaseAdapter');

class CarSupabase {
  static async listByCompany(companyId) {
    return await adapter.listCars(companyId);
  }

  static async findByCompany(companyId) {
    return await adapter.listCars(companyId);
  }

  static async findAll() {
    const supabase = require('../config/supabase');
    const { data, error } = await supabase.from('cars').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async findByRoute(routeId) {
    const supabase = require('../config/supabase');
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('route_id', routeId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async findById(id) {
    return await adapter.getCarById(id);
  }

  static async create(carData) {
    return await adapter.createCar(carData);
  }

  static async update(id, data) {
    const supabase = require('../config/supabase');
    const { error } = await supabase.from('cars').update(data).eq('id', id);
    if (error) throw error;
    return await this.findById(id);
  }

  static async delete(id) {
    const supabase = require('../config/supabase');
    const { error } = await supabase.from('cars').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}

module.exports = CarSupabase;
