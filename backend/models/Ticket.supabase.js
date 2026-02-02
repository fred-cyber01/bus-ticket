const adapter = require('../adapters/supabaseAdapter');

class TicketSupabase {
  static async create(ticketData) {
    return await adapter.createTicket(ticketData);
  }

  static async findById(id) {
    return await adapter.getTicketById(id);
  }

  static async delete(id) {
    const supabase = require('../config/supabase');
    const { error } = await supabase.from('tickets').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}

module.exports = TicketSupabase;
