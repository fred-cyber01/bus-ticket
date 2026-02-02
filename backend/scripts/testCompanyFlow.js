// backend/scripts/testCompanyFlow.js
const axios = require('axios');

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

async function run() {
  try {
    console.log('Checking server health...');
    const h = await axios.get(`${API_BASE}/health`);
    console.log('Health:', h.data);

    // Login as Yahoo manager
    const managerEmail = 'yahoo.car.express.ltd@example.com';
    const managerPassword = 'Manager123!';
    console.log('\nLogging in as manager:', managerEmail);
    const login = await axios.post(`${API_BASE}/api/company-auth/login`, { email: managerEmail, password: managerPassword });
    console.log('Login response:', login.data.success);
    const token = login.data.data.token;

    // Get company profile
    console.log('\nFetching company profile...');
    const profile = await axios.get(`${API_BASE}/api/company/profile`, { headers: { Authorization: `Bearer ${token}` } });
    console.log('Company:', profile.data.data.company_name || profile.data.data.name || profile.data.data);

    // Create a new route
    console.log('\nCreating a test route via manager token...');
    const routePayload = {
      name: 'Manager Test Route',
      company_id: profile.data.data.id,
      origin_stop_id: 1,
      destination_stop_id: 2,
      description: 'Route created by test script'
    };
    const createRoute = await axios.post(`${API_BASE}/api/routes`, routePayload, { headers: { Authorization: `Bearer ${token}` } });
    console.log('Created route:', createRoute.data.success ? createRoute.data.data.name : createRoute.data);

    // Fetch company routes
    const companyRoutes = await axios.get(`${API_BASE}/api/company/routes`, { headers: { Authorization: `Bearer ${token}` } });
    console.log('\nCompany routes count:', companyRoutes.data.data.length);

    console.log('\nAll manager CRUD checks passed.');

  } catch (err) {
    if (err.response) {
      console.error('API error:', err.response.status, err.response.data);
    } else {
      console.error('Error:', err.message);
    }
    process.exit(1);
  }
}

run();
