const adapter = require('../adapters/supabaseAdapter');

class StopSupabase {
  static async listAll() {
    return await adapter.listStops();
  }

  static async findById(id) {
    return await adapter.getStopById(id);
  }

  static async findByName(name) {
    const supabase = require('../config/supabase');
    const { data, error } = await supabase
      .from('stops')
      .select('*')
      .ilike('name', name.trim())
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async findByRoute(routeId) {
    const supabase = require('../config/supabase');
    // Get stops for a specific route through route_stops junction table
    const { data, error } = await supabase
      .from('route_stops')
      .select('stop:stops(*), position')
      .eq('route_id', routeId)
      .order('position', { ascending: true });
    
    if (error) throw error;
    return (data || []).map(rs => rs.stop).filter(Boolean);
  }

  static async findOrCreateByName(name) {
    if (!name || typeof name !== 'string') {
      throw new Error('Stop name must be a valid string');
    }
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('Stop name cannot be empty');
    }

    // Try to find existing stop
    let stop = await this.findByName(trimmedName);
    if (stop) return stop;

    // Create new stop
    const stopId = await this.create({ name: trimmedName });
    return await this.findById(stopId);
  }

  static async create(stopData) {
    const supabase = require('../config/supabase');
    const { data, error } = await supabase.from('stops').insert([stopData]).select('id').single();
    if (error) throw error;
    return data.id;
  }

  static async update(id, data) {
    const supabase = require('../config/supabase');
    const { error } = await supabase.from('stops').update(data).eq('id', id);
    if (error) throw error;
    return await this.findById(id);
  }

  static async delete(id) {
    const supabase = require('../config/supabase');
    const { error } = await supabase.from('stops').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}

module.exports = StopSupabase;
