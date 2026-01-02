 (async () => {
  try {
    const base = 'http://localhost:3000';
    const endpoints = ['/api/trips', '/api/trips/available', '/api/routes', '/api/payments/history'];
    for (const ep of endpoints) {
      try {
        const res = await fetch(base + ep);
        const txt = await res.text();
        console.log(`\n[${ep}] status=${res.status}`);
        try { console.log(JSON.parse(txt)); } catch (e) { console.log(txt.slice(0,1000)); }
      } catch (err) {
        console.error(`Error fetching ${ep}:`, err.message);
      }
    }
  } catch (e) {
    console.error(e);
  }
})();
