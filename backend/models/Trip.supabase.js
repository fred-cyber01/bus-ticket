const adapter = require('../adapters/supabaseAdapter');

class TripSupabase {
  static async create(tripData) {
    return await adapter.createTrip(tripData);
  }

  static async findById(id) {
    return await adapter.getTripById(id);
  }

  static async findAll(filters = {}) {
    return await adapter.listTrips(filters);
  }

  static async update(id, updateData) {
    const supabase = require('../config/supabase');
    const { data, error } = await supabase.from('trips').update(updateData).eq('id', id);
    if (error) throw error;
    return await this.findById(id);
  }

  static async delete(id) {
    const supabase = require('../config/supabase');
    const { error } = await supabase.from('trips').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}

module.exports = TripSupabase;
