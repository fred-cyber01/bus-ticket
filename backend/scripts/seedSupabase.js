// backend/scripts/seedSupabase.js
require('dotenv').config({ path: './.env' });
const supabase = require('../config/supabase');

async function upsert(table, rows, conflict = 'id') {
  // Try standard upsert first; if the table lacks a unique constraint for onConflict,
  // fall back to manual upsert per-row.
  try {
    const { data, error } = await supabase.from(table).upsert(rows, { onConflict: conflict }).select();
    if (error) throw error;
    return data;
  } catch (e) {
    // fallback: ensure each row exists by match key
    return ensureUpsert(table, conflict, rows);
  }
}

async function insert(table, rows) {
  const { data, error } = await supabase.from(table).insert(rows).select();
  if (error) throw new Error(`${table} insert error: ${error.message}`);
  return data;
}

async function seed() {
  console.log('Seeding Supabase...');

  // helper: ensure upsert by matchKey for tables without unique constraint
  async function ensureUpsert(table, matchKey, rows) {
    const results = [];
    for (const r of rows) {
      const matchVal = r[matchKey];
      if (matchVal === undefined) {
        // fallback to insert
        const inserted = await insert(table, [r]);
        results.push(inserted[0]);
        continue;
      }
      const { data: existing, error: selErr } = await supabase.from(table).select('*').eq(matchKey, matchVal).limit(1).single();
      if (selErr && selErr.code !== 'PGRST116') throw new Error(`${table} select error: ${selErr.message}`);
      if (existing) {
        const { data: upd, error: updErr } = await supabase.from(table).update(r).eq(matchKey, matchVal).select();
        if (updErr) throw new Error(`${table} update error: ${updErr.message}`);
        results.push(upd[0]);
      } else {
        const inserted = await insert(table, [r]);
        results.push(inserted[0]);
      }
    }
    return results;
  }

  // 1) Admin
  const admins = [
    { name: 'System Administrator', email: 'admin@ticketbus.rw', password: 'admin123', role: 'superadmin' }
  ];
  const adminRes = await upsert('admins', admins, 'email');
  console.log('Admins upserted:', adminRes.map(a => a.email));

  // 2) Companies (5 sample companies, include two provided)
  const companies = [
    {
      company_name: 'Yahoo Car Express LTD',
      tin: null,
      phone: '+250788357777',
      email: 'info@yahooexpress.rw',
      address: 'Kigali, Rwanda',
      status: 'active',
      subscription_status: 'trial',
      is_active: true,
      current_plan_id: null,
      bus_limit: 5
    },
    {
      company_name: 'Select Express LTD',
      tin: null,
      phone: '0789176905',
      email: 'info@selectexpress.rw',
      address: 'Kigali, Rwanda',
      status: 'active',
      subscription_status: 'trial',
      is_active: true,
      current_plan_id: null,
      bus_limit: 5
    },
    { company_name: 'Rwanda Transit Ltd', phone: '+250788000001', email: 'info@rwandatransit.rw', address: 'Kigali', status: 'active', subscription_status: 'trial', is_active: true, bus_limit: 3 },
    { company_name: 'Kigali Express Ltd', phone: '+250788000002', email: 'info@kigaliexpress.rw', address: 'Kigali', status: 'active', subscription_status: 'trial', is_active: true, bus_limit: 4 },
    { company_name: 'Eastern Lines Ltd', phone: '+250788000003', email: 'info@easternlines.rw', address: 'Eastern Province', status: 'active', subscription_status: 'trial', is_active: true, bus_limit: 2 }
  ];
  const compRes = await ensureUpsert('companies', 'company_name', companies);
  console.log('Companies upserted:', compRes.map(c => c.company_name));

  // map company names to ids
  const companyMap = {};
  compRes.forEach(c => { companyMap[c.company_name] = c.id; });

  // 3) Stops - create unique stops from provided lists (we'll pick a useful set)
  const stopsList = [
    'Nyabugogo','Munini','Kabeza','Buhabwa','Gakoma','Karubamba','Muhura','Gasange','Karambi','Gasarabwayi','Nyawera','Juru','Video','Kayange','Ngarama','Mugera','Rwamagana','Kayonza','Kiramuruzi','Rwagitima','Rukomo','Nyagatare','Kiziguro','Kabarore','Gabiro','Karangazi','Ryabega','Mimuri','Karama','Kigali','Rusumo','Nyakarambi','Kibungo','Kabarondo'
  ];
  const stopRows = stopsList.map(s => ({ name: s, location: s }));
  const stopsRes = await ensureUpsert('stops', 'name', stopRows);
  console.log('Stops upserted:', stopsRes.length);

  const stopMap = {};
  stopsRes.forEach(s => { stopMap[s.name] = s.id; });

  // 4) Routes for Yahoo and Select
  const yahooStops = ['Nyabugogo','Munini','Kabeza','Buhabwa','Gakoma','Karubamba','Muhura','Gasange','Karambi'];
  const selectStops = ['Kigali','Rusumo','Nyakarambi','Kibungo','Kabarondo','Kayonza','Rwamagana'];

  const routes = [
    { company_id: companyMap['Yahoo Car Express LTD'], name: 'Yahoo Eastern Route', origin_stop_id: stopMap[yahooStops[0]], destination_stop_id: stopMap[yahooStops[yahooStops.length-1]], description: 'Yahoo main eastern route' },
    { company_id: companyMap['Select Express LTD'], name: 'Select Kigali-Rusumo', origin_stop_id: stopMap[selectStops[0]], destination_stop_id: stopMap[selectStops[selectStops.length-1]], description: 'Select main route' }
  ];
  const routesRes = await ensureUpsert('routes', 'name', routes);
  console.log('Routes upserted:', routesRes.map(r => r.name));

  const routeMap = {};
  routesRes.forEach(r => { routeMap[r.name] = r.id; });

  // 5) route_stops - ordered
  for (const [routeName, stopsArr] of [['Yahoo Eastern Route', yahooStops], ['Select Kigali-Rusumo', selectStops]]) {
    const rId = routeMap[routeName];
    const rs = stopsArr.map((s, idx) => ({ route_id: rId, stop_id: stopMap[s], position: idx+1 }));
    // remove existing for that route to avoid duplicates: delete then insert
    await supabase.from('route_stops').delete().eq('route_id', rId);
    await insert('route_stops', rs);
    console.log(`route_stops for ${routeName} inserted: ${rs.length}`);
  }

  // 6) Cars
  const cars = [
    { company_id: companyMap['Yahoo Car Express LTD'], plate_number: 'YHOO-001', name: 'Yahoo Coach 1', type: 'Coach', capacity: 40 },
    { company_id: companyMap['Select Express LTD'], plate_number: 'SLCT-001', name: 'Select Coach 1', type: 'Coach', capacity: 40 }
  ];
  const carsRes = await ensureUpsert('cars', 'plate_number', cars);
  console.log('Cars upserted:', carsRes.map(c => c.plate_number));

  // 7) Drivers
  const drivers = [
    { company_id: companyMap['Yahoo Car Express LTD'], name: 'John Doe', phone: '+250788111111', license_number: 'DL-YH-001' },
    { company_id: companyMap['Select Express LTD'], name: 'Jane Smith', phone: '+250788222222', license_number: 'DL-SL-001' }
  ];
  const driversRes = await ensureUpsert('drivers', 'phone', drivers);
  console.log('Drivers upserted:', driversRes.map(d => d.name));

  // 8) Trips - create a trip for each route tomorrow
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24*60*60*1000);
  const trips = [
    { route_id: routeMap['Yahoo Eastern Route'], car_id: carsRes[0].id, car_name: carsRes[0].name, driver_id: driversRes[0].id, origin_id: stopMap[yahooStops[0]], destination_id: stopMap[yahooStops[yahooStops.length-1]], departure_time: tomorrow.toISOString(), status: 'scheduled' },
    { route_id: routeMap['Select Kigali-Rusumo'], car_id: carsRes[1].id, car_name: carsRes[1].name, driver_id: driversRes[1].id, origin_id: stopMap[selectStops[0]], destination_id: stopMap[selectStops[selectStops.length-1]], departure_time: new Date(tomorrow.getTime() + 2*60*60*1000).toISOString(), status: 'scheduled' }
  ];
  const tripsRes = await ensureUpsert('trips', 'id', trips);
  console.log('Trips upserted:', tripsRes.length);

  // 9) Create a demo user
  const users = [
    { user_name: 'demo_user', email: 'demo@example.com', phone: '+250788333333', password: 'password', full_name: 'Demo User' }
  ];
  const usersRes = await ensureUpsert('users', 'email', users);
  console.log('Users upserted:', usersRes.map(u => u.email));

  // 10) Create a ticket booking for the demo user on the first trip
  const ticket = {
    user_id: usersRes[0].id,
    trip_id: tripsRes[0].id,
    boarding_stop_id: stopMap[yahooStops[0]],
    dropoff_stop_id: stopMap[yahooStops[1]] || stopMap[yahooStops[yahooStops.length-1]],
    seat_number: '1A',
    price: 1000.00,
    passenger_name: 'Demo User',
    passenger_phone: '+250788333333',
    departure_time: tripsRes[0].departure_time,
    booking_date: new Date().toISOString().split('T')[0],
    ticket_status: 'booked',
    payment_status: 'paid',
    payment_method: 'card'
  };
  const ticketRes = await insert('tickets', [ticket]);
  console.log('Ticket created id:', ticketRes[0].id);

  console.log('Seeding complete.');
}

seed().catch(e => { console.error('Seeding failed:', e.message || e); process.exit(1); });
