const adapter = require('../adapters/supabaseAdapter');

class TicketSupabase {
  static async create(ticketData) {
    return await adapter.createTicket(ticketData);
  }

  // For compatibility with controllers
  static async createBooking(bookingData) {
    return await this.create(bookingData);
  }

  static async findById(id) {
    return await adapter.getTicketById(id);
  }

  static async getBookingById(id) {
    return await this.findById(id);
  }

  static async getAllBookings(filters = {}) {
    const supabase = require('../config/supabase');
    let q = supabase.from('tickets').select('*').order('created_at', { ascending: false });
    if (filters.company_id) q = q.eq('company_id', filters.company_id);
    if (filters.user_id) q = q.eq('user_id', filters.user_id);
    if (filters.trip_id) q = q.eq('trip_id', filters.trip_id);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  }

  static async getTripTickets(tripId) {
    const supabase = require('../config/supabase');
    const { data, error } = await supabase.from('tickets').select('*').eq('trip_id', tripId).order('seat_number', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  static async getOccupiedSeats(tripId /*, boardingOrder, dropoffOrder */) {
    // For now, return seat_numbers of tickets that are booked/confirmed/on_board for the trip.
    const supabase = require('../config/supabase');
    const { data, error } = await supabase
      .from('tickets')
      .select('seat_number')
      .eq('trip_id', tripId)
      .in('ticket_status', ['booked', 'confirmed', 'on_board'])
      .order('seat_number', { ascending: true });
    if (error) throw error;
    return (data || []).map(d => d.seat_number);
  }

  static async update(id, updateData) {
    const supabase = require('../config/supabase');
    const { data, error } = await supabase.from('tickets').update(updateData).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  static async updateStatus(id, status) {
    return await this.update(id, { ticket_status: status });
  }

  static async delete(id) {
    const supabase = require('../config/supabase');
    const { error } = await supabase.from('tickets').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}

module.exports = TicketSupabase;
