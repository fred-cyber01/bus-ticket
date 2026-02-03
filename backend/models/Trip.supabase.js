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

  /**
   * Backwards-compatible method used by controllers.
   * Accepts simple filters: { origin, destination, date, route_id, company_id }
   * options: { approvedOnly: boolean }
   */
  static async findAllWithFilters(filters = {}, options = {}) {
    const supabase = require('../config/supabase');

    // Build query
    let q = supabase.from('trips').select('*').order('departure_time', { ascending: true });

    if (filters.route_id) q = q.eq('route_id', filters.route_id);
    if (filters.company_id) q = q.eq('company_id', filters.company_id);
    if (filters.date) {
      // match date part of departure_time or trip_date if present
      const dayStart = new Date(filters.date).toISOString().split('T')[0];
      q = q.ilike('trip_date', `${dayStart}%`).or(`departure_time.gte.${dayStart}T00:00:00`).or(`departure_time.lte.${dayStart}T23:59:59`);
    }

    // Fetch raw trips
    const { data, error } = await q;
    if (error) throw error;

    let trips = data || [];

    // Filter by origin/destination if provided (these may be stored as origin_id/destination_id)
    if (filters.origin) {
      trips = trips.filter(t => String(t.origin || t.origin_id || '').toLowerCase().includes(String(filters.origin).toLowerCase()));
    }
    if (filters.destination) {
      trips = trips.filter(t => String(t.destination || t.destination_id || '').toLowerCase().includes(String(filters.destination).toLowerCase()));
    }

    if (options.approvedOnly) {
      trips = trips.filter(t => t.status === 'approved' || t.is_active === 1 || t.is_active === true);
    }

    return trips;
  }

  static async getAvailableTrips(date = null) {
    const supabase = require('../config/supabase');
    let q = supabase.from('trips').select('*').eq('is_active', 1).order('departure_time', { ascending: true });
    if (date) {
      const day = new Date(date).toISOString().split('T')[0];
      q = q.ilike('trip_date', `${day}%`).or(`departure_time.gte.${day}T00:00:00`).or(`departure_time.lte.${day}T23:59:59`);
    }
    const { data, error } = await q;
    if (error) throw error;
    // Only return trips with available seats > 0
    return (data || []).filter(t => (t.available_seats || t.availableSeats || 0) > 0 && (t.status === 'scheduled' || t.status === 'approved'));
  }

  static async findByIdWithDetails(id) {
    const supabase = require('../config/supabase');
    const { data, error } = await supabase
      .from('trips')
      .select('*, routes(*), cars(*), drivers(*)')
      .eq('id', id)
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  static async updateStatus(id, status) {
    const supabase = require('../config/supabase');
    const { data, error } = await supabase.from('trips').update({ status }).eq('id', id).select().single();
    if (error) throw error;
    return data;
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
