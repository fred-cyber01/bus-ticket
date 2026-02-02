const adapter = require('../adapters/supabaseAdapter');

class CarSupabase {
  static async listByCompany(companyId) {
    return await adapter.listCars(companyId);
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
