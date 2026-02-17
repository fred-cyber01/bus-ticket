// setup-complete-system.js - Complete system setup with 7 companies and Rwanda routes
require('dotenv').config();
const supabase = require('./config/supabase');
const bcrypt = require('bcryptjs');
const moment = require('moment-timezone');

// Rwanda Routes - Kigali to various regions
const RWANDA_ROUTES = {
  north: [
    { from: 'Kigali', to: 'Musanze', distance: 116, duration: '2h 30m' },
    { from: 'Kigali', to: 'Gakenke', distance: 95, duration: '2h 15m' },
    { from: 'Kigali', to: 'Rulindo', distance: 45, duration: '1h 15m' },
    { from: 'Musanze', to: 'Gakenke', distance: 35, duration: '1h' },
  ],
  south: [
    { from: 'Kigali', to: 'Huye', distance: 136, duration: '3h' },
    { from: 'Kigali', to: 'Nyanza', distance: 88, duration: '2h' },
    { from: 'Kigali', to: 'Gisagara', distance: 145, duration: '3h 15m' },
    { from: 'Kigali', to: 'Nyamagabe', distance: 165, duration: '3h 30m' },
    { from: 'Huye', to: 'Nyanza', distance: 48, duration: '1h' },
  ],
  east: [
    { from: 'Kigali', to: 'Rwamagana', distance: 55, duration: '1h 15m' },
    { from: 'Kigali', to: 'Kayonza', distance: 82, duration: '1h 45m' },
    { from: 'Kigali', to: 'Nyagatare', distance: 168, duration: '3h 30m' },
    { from: 'Kigali', to: 'Kirehe', distance: 125, duration: '2h 45m' },
    { from: 'Rwamagana', to: 'Kayonza', distance: 27, duration: '30m' },
  ],
  west: [
    { from: 'Kigali', to: 'Rubavu', distance: 156, duration: '3h 15m' },
    { from: 'Kigali', to: 'Karongi', distance: 135, duration: '2h 45m' },
    { from: 'Kigali', to: 'Rusizi', distance: 235, duration: '4h 30m' },
    { from: 'Kigali', to: 'Rutsiro', distance: 110, duration: '2h 30m' },
    { from: 'Rubavu', to: 'Karongi', distance: 92, duration: '2h' },
  ]
};

// 7 Bus Companies in Rwanda
const COMPANIES = [
  { 
    name: 'Rwanda Express', 
    tin: '100123456', 
    phone: '+250788111111', 
    email: 'info@rwandaexpress.rw',
    region: 'north',
    busPrefix: 'RE',
    color: '#FF6B35'
  },
  { 
    name: 'Virunga Coaches', 
    tin: '100123457', 
    phone: '+250788222222', 
    email: 'info@virungacoaches.rw',
    region: 'north',
    busPrefix: 'VC',
    color: '#4ECDC4'
  },
  { 
    name: 'Huye Transport', 
    tin: '100123458', 
    phone: '+250788333333', 
    email: 'info@huyetransport.rw',
    region: 'south',
    busPrefix: 'HT',
    color: '#FFD93D'
  },
  { 
    name: 'Eastern Star Bus', 
    tin: '100123459', 
    phone: '+250788444444', 
    email: 'info@easternstar.rw',
    region: 'east',
    busPrefix: 'ES',
    color: '#6BCB77'
  },
  { 
    name: 'Akagera Express', 
    tin: '100123460', 
    phone: '+250788555555', 
    email: 'info@akageraexpress.rw',
    region: 'east',
    busPrefix: 'AE',
    color: '#95E1D3'
  },
  { 
    name: 'Kivu Lake Transport', 
    tin: '100123461', 
    phone: '+250788666666', 
    email: 'info@kivulake.rw',
    region: 'west',
    busPrefix: 'KL',
    color: '#F38181'
  },
  { 
    name: 'Horizon Bus Services', 
    tin: '100123462', 
    phone: '+250788777777', 
    email: 'info@horizonbus.rw',
    region: 'west',
    busPrefix: 'HB',
    color: '#AA96DA'
  }
];

// Driver names
const DRIVER_NAMES = [
  'Jean Claude Mugabo', 'Eric Niyonzima', 'Patrick Hategekimana', 'Innocent Kamanzi',
  'Fabrice Ndayisaba', 'Emmanuel Bizimana', 'Claude Habimana', 'Alphonse Nshimiyimana',
  'Robert Tuyishime', 'David Nsengiyumva', 'Jacques Uwimana', 'Samuel Hakizimana',
  'Paul Irakoze', 'Francis Munyankindi', 'Joseph Nkurunziza', 'Martin Sibomana',
  'Gilbert Nsabimana', 'Vincent Kayitare', 'Pierre Ntirenganya', 'Andre Mukeshimana',
  'Leonard Bizumuremyi', 'Bernard Habyarimana', 'Celestin Ntawukuriryayo', 'Daniel Rugege',
  'Albert Niyonkuru', 'Victor Rwabukamba', 'Thomas Ntaganzwa', 'Felix Mutabazi'
];

// Bus types
const BUS_TYPES = ['Express Coach', 'Standard Bus', 'VIP Bus', 'Mini Bus'];

// Time slots for trips
const DEPARTURE_TIMES = [
  '06:00', '07:00', '08:00', '09:00', '10:00', 
  '11:00', '12:00', '13:00', '14:00', '15:00', 
  '16:00', '17:00', '18:00'
];

async function clearExistingData() {
  console.log('🗑️  Clearing existing test data...');
  
  // Delete in order to respect foreign key constraints
  await supabase.from('tickets').delete().neq('id', 0);
  await supabase.from('trips').delete().neq('id', 0);
  await supabase.from('route_stops').delete().neq('id', 0);
  await supabase.from('routes').delete().neq('id', 0);
  await supabase.from('drivers').delete().neq('id', 0);
  await supabase.from('cars').delete().neq('id', 0);
  await supabase.from('company_managers').delete().neq('id', 0);
  await supabase.from('companies').delete().neq('id', 0);
  await supabase.from('stops').delete().neq('id', 0);
  
  console.log('✅ Cleared existing data');
}

async function createStops() {
  console.log('📍 Creating bus stops...');
  
  const allCities = new Set();
  Object.values(RWANDA_ROUTES).flat().forEach(route => {
    allCities.add(route.from);
    allCities.add(route.to);
  });
  
  const stops = Array.from(allCities).map(city => ({
    name: city,
    location: `${city}, Rwanda`,
    created_at: new Date().toISOString()
  }));
  
  const { data, error } = await supabase.from('stops').insert(stops).select();
  if (error) throw error;
  
  console.log(`✅ Created ${data.length} stops`);
  return data;
}

async function setupCompanies(stops) {
  console.log('🏢 Setting up 7 companies...');
  
  const companyIds = [];
  
  for (const company of COMPANIES) {
    // Create company
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .insert([{
        company_name: company.name,
        tin: company.tin,
        phone: company.phone,
        email: company.email,
        status: 'approved',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (companyError) throw companyError;
    console.log(`✅ Created company: ${company.name}`);
    
    // Create manager for company
    const password = await bcrypt.hash('manager123', 10);
    const { error: managerError } = await supabase
      .from('company_managers')
      .insert([{
        company_id: companyData.id,
        name: `${company.name} Manager`,
        email: company.email,
        phone: company.phone,
        password: password,
        role: 'manager',
        status: 'active',
        created_at: new Date().toISOString()
      }]);
    
    if (managerError) throw managerError;
    
    // Create buses (5-7 buses per company)
    const busCount = 5 + Math.floor(Math.random() * 3);
    const buses = [];
    for (let i = 1; i <= busCount; i++) {
      const busType = BUS_TYPES[Math.floor(Math.random() * BUS_TYPES.length)];
      const capacity = busType === 'Mini Bus' ? 20 : busType === 'VIP Bus' ? 30 : 45;
      
      buses.push({
        company_id: companyData.id,
        plate_number: `${company.busPrefix}${String(i).padStart(3, '0')}`,
        name: `${company.name} Bus ${i}`,
        type: busType,
        capacity: capacity,
        is_active: true,
        created_at: new Date().toISOString()
      });
    }
    
    const { data: busData, error: busError } = await supabase
      .from('cars')
      .insert(buses)
      .select();
    
    if (busError) throw busError;
    console.log(`✅ Created ${busData.length} buses for ${company.name}`);
    
    // Create drivers (same as bus count)
    const drivers = [];
    for (let i = 0; i < busCount; i++) {
      const driverName = DRIVER_NAMES[Math.floor(Math.random() * DRIVER_NAMES.length)];
      const licenseNum = `DL${Math.random().toString().slice(2, 9)}`;
      
      drivers.push({
        company_id: companyData.id,
        name: driverName,
        email: `${driverName.toLowerCase().replace(/\s+/g, '.')}@${company.email.split('@')[1]}`,
        phone: `+25078${Math.floor(1000000 + Math.random() * 9000000)}`,
        license_number: licenseNum,
        is_active: true,
        created_at: new Date().toISOString()
      });
    }
    
    const { data: driverData, error: driverError } = await supabase
      .from('drivers')
      .insert(drivers)
      .select();
    
    if (driverError) throw driverError;
    console.log(`✅ Created ${driverData.length} drivers for ${company.name}`);
    
    // Create routes for this company's region
    const regionRoutes = RWANDA_ROUTES[company.region];
    const routes = [];
    
    for (const route of regionRoutes) {
      const originStop = stops.find(s => s.name === route.from);
      const destStop = stops.find(s => s.name === route.to);
      
      if (originStop && destStop) {
        routes.push({
          company_id: companyData.id,
          name: `${route.from} to ${route.to}`,
          origin_stop_id: originStop.id,
          destination_stop_id: destStop.id,
          distance_km: route.distance,
          description: `${route.duration} journey from ${route.from} to ${route.to}`,
          is_active: true,
          created_at: new Date().toISOString()
        });
      }
    }
    
    const { data: routeData, error: routeError } = await supabase
      .from('routes')
      .insert(routes)
      .select();
    
    if (routeError) throw routeError;
    console.log(`✅ Created ${routeData.length} routes for ${company.name}`);
    
    // Create trips from today to April 4, 2026
    const startDate = new moment().tz('Africa/Kigali');
    const endDate = moment('2026-04-04').tz('Africa/Kigali');
    const trips = [];
    
    let currentDate = startDate.clone();
    while (currentDate.isSameOrBefore(endDate)) {
      // For each route, create 2-4 trips per day
      for (const route of routeData) {
        const tripsPerDay = 2 + Math.floor(Math.random() * 3); // 2-4 trips
        const usedTimes = [];
        
        for (let t = 0; t < tripsPerDay; t++) {
          // Pick a random time that hasn't been used
          let departureTime;
          do {
            departureTime = DEPARTURE_TIMES[Math.floor(Math.random() * DEPARTURE_TIMES.length)];
          } while (usedTimes.includes(departureTime));
          usedTimes.push(departureTime);
          
          const bus = busData[Math.floor(Math.random() * busData.length)];
          const driver = driverData[Math.floor(Math.random() * driverData.length)];
          
          // Calculate price based on distance (500 RWF per km base + 2000 RWF)
          const basePrice = 2000 + (route.distance_km * 500);
          const price = Math.round(basePrice / 500) * 500; // Round to nearest 500
          
          const departureDateTime = `${currentDate.format('YYYY-MM-DD')} ${departureTime}:00`;
          
          trips.push({
            company_id: companyData.id,
            route_id: route.id,
            car_id: bus.id,
            car_name: bus.name,
            driver_id: driver.id,
            departure_time: departureDateTime,
            trip_date: currentDate.format('YYYY-MM-DD'),
            price: price,
            total_seats: bus.capacity,
            occupied_seats: 0,
            status: 'scheduled',
            is_active: true,
            created_at: new Date().toISOString()
          });
        }
      }
      
      currentDate.add(1, 'day');
    }
    
    // Insert trips in batches of 100
    let tripCount = 0;
    for (let i = 0; i < trips.length; i += 100) {
      const batch = trips.slice(i, i + 100);
      const { error: tripError } = await supabase.from('trips').insert(batch);
      if (tripError) {
        console.error('Trip insert error:', tripError);
        throw tripError;
      }
      tripCount += batch.length;
    }
    
    console.log(`✅ Created ${tripCount} trips for ${company.name} (Today to April 4)`);
    
    companyIds.push({
      id: companyData.id,
      name: company.name,
      email: company.email,
      buses: busData.length,
      drivers: driverData.length,
      routes: routeData.length,
      trips: tripCount
    });
  }
  
  return companyIds;
}

async function main() {
  console.log('🚀 Starting complete system setup...\n');
  
  try {
    // Clear existing data
    await clearExistingData();
    
    // Create stops
    const stops = await createStops();
    
    // Setup all companies with buses, drivers, routes, trips
    const companies = await setupCompanies(stops);
    
    console.log('\n✅ SETUP COMPLETE!\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('                    COMPANY SUMMARY');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    companies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name}`);
      console.log(`   Email: ${company.email}`);
      console.log(`   Password: manager123`);
      console.log(`   Buses: ${company.buses} | Drivers: ${company.drivers} | Routes: ${company.routes} | Trips: ${company.trips}`);
      console.log('');
    });
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📅 Trips created from: ${moment().tz('Africa/Kigali').format('YYYY-MM-DD')} to 2026-04-04`);
    console.log('🎫 All trips available for booking');
    console.log('💺 Seat selection enabled');
    console.log('🗺️  Routes cover North, South, East, and West Rwanda');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during setup:', error);
    process.exit(1);
  }
}

main();
