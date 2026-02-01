const axios = require('axios');

(async () => {
  try {
    const res = await axios.post('http://localhost:3000/api/company-auth/register', {
      company_name: 'MTNTestCo2',
      tin: '123123123',
      contact_info: 'Rwanda',
      manager_name: 'MTN Admin',
      manager_email: `mtnadmin${Date.now()}@example.com`,
      manager_phone: '+250788333444',
      password: 'secret123',
      plan_id: 1,
      payment_method: 'mtn_momo',
      phone_number: '+250788333444'
    }, { timeout: 30000 });

    console.log('STATUS', res.status);
    console.log('DATA', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('FULL ERROR:');
    if (err && err.stack) console.error(err.stack);
    else if (err && err.message) console.error(err.message);
    else console.error(JSON.stringify(err));
    process.exit(1);
  }
})();
