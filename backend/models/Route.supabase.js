const adapter = require('../adapters/supabaseAdapter');

class RouteSupabase {
  static async create(routeData) {
    return await adapter.createRoute(routeData);
  }

  static async findById(id) {
    return await adapter.getRouteById(id);
  }

  static async findAll(options = {}) {
    return await adapter.listRoutes(options.company_id);
  }

  static async findByCompany(companyId) {
    return await adapter.listRoutes(companyId);
  }

  static async update(id, updateData) {
    const supabase = require('../config/supabase');
    const { data, error } = await supabase.from('routes').update(updateData).eq('id', id);
    if (error) throw error;
    return await this.findById(id);
  }

  static async delete(id) {
    const supabase = require('../config/supabase');
    const { error } = await supabase.from('routes').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}

module.exports = RouteSupabase;
