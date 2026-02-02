const adapter = require('../adapters/supabaseAdapter');

class StopSupabase {
  static async listAll() {
    return await adapter.listStops();
  }

  static async findById(id) {
    return await adapter.getStopById(id);
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
