const supabase = require('../config/supabase');

module.exports = {
  // Companies
  async getCompanyById(id) {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async findCompanyByName(name) {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .ilike('company_name', `%${name}%`)
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async upsertCompany(company) {
    // company: { company_name, tin, phone, email, status }
    const { data, error } = await supabase
      .from('companies')
      .upsert([company], { onConflict: 'id' })
      .select('id')
      .single();
    if (error) throw error;
    return data?.id;
  },

  async listCompanies() {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Users
  async getUserById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getUserByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getUserByPhone(phone) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async setUserResetOtp(id, otp, expiry) {
    const { data, error } = await supabase
      .from('users')
      .update({ reset_otp: otp, reset_otp_expiry: expiry })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getUserByResetOtp(otp) {
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('reset_otp', otp)
      .gt('reset_otp_expiry', nowIso)
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async clearUserResetOtp(id) {
    const { data, error } = await supabase
      .from('users')
      .update({ reset_otp: null, reset_otp_expiry: null })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateUserPassword(id, hashedPassword) {
    const { data, error } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async createUser(user) {
    // user: { user_name, email, phone, password }
    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .select('id')
      .single();
    if (error) throw error;
    return data?.id;
  },

  async upsertUser(user) {
    const { data, error } = await supabase
      .from('users')
      .upsert([user], { onConflict: 'id' })
      .select('id')
      .single();
    if (error) throw error;
    return data?.id;
  }
,

  // Cars
  async listCars(companyId) {
    const { data, error } = await supabase.from('cars').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getCarById(id) {
    const { data, error } = await supabase.from('cars').select('*').eq('id', id).limit(1).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async createCar(car) {
    const { data, error } = await supabase.from('cars').insert([car]).select('id').single();
    if (error) throw error;
    return data.id;
  },

  // Drivers
  async listDrivers(companyId) {
    const { data, error } = await supabase.from('drivers').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getDriverById(id) {
    const { data, error } = await supabase.from('drivers').select('*').eq('id', id).limit(1).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Stops
  async listStops() {
    const { data, error } = await supabase.from('stops').select('*').order('name', { ascending: true });
    if (error) throw error;
    return data;
  },

  async getStopById(id) {
    const { data, error } = await supabase.from('stops').select('*').eq('id', id).limit(1).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Routes
  async listRoutes(companyId) {
    const q = supabase.from('routes').select('*, route_stops(*)').order('created_at', { ascending: false });
    if (companyId) q.eq('company_id', companyId);
    const { data, error } = await q;
    if (error) throw error;
    return data;
  },

  async getRouteById(id) {
    const { data, error } = await supabase.from('routes').select('*, route_stops(*)').eq('id', id).limit(1).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async createRoute(route) {
    const { data, error } = await supabase.from('routes').insert([route]).select('id').single();
    if (error) throw error;
    return data.id;
  },

  // Trips
  async listTrips(filters = {}) {
    let q = supabase.from('trips').select('*').order('departure_time', { ascending: true });
    if (filters.route_id) q.eq('route_id', filters.route_id);
    if (filters.company_id) q.eq('company_id', filters.company_id);
    const { data, error } = await q;
    if (error) throw error;
    return data;
  },

  async getTripById(id) {
    const { data, error } = await supabase.from('trips').select('*').eq('id', id).limit(1).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async createTrip(trip) {
    const { data, error } = await supabase.from('trips').insert([trip]).select('id').single();
    if (error) throw error;
    return data.id;
  },

  // Tickets
  async createTicket(ticket) {
    const { data, error } = await supabase.from('tickets').insert([ticket]).select('id').single();
    if (error) throw error;
    return data.id;
  },

  async getTicketById(id) {
    const { data, error } = await supabase.from('tickets').select('*').eq('id', id).limit(1).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
};
