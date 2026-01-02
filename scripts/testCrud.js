const base = 'http://localhost:3000';
(async () => {
  try {
    console.log('Signing in as admin...');
    let res = await fetch(`${base}/api/auth/admin/signin`, {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({email: 'admin@ticketbus.rw', password: 'admin123'})
    });
    const j1 = await res.json();
    console.log('signin status', res.status, j1.message || j1);
    if (!j1.success) return process.exit(1);
    const token = j1.data.token;

    // Create trip
    const dep = new Date(Date.now() + 24*60*60*1000);
    const arr = new Date(dep.getTime() + 4*60*60*1000);
    const payload = {
      origin: 'DemoOrigin',
      destination: 'DemoDestination',
      departureTime: dep.toISOString(),
      arrivalTime: arr.toISOString(),
      price: 2000,
      totalSeats: 30,
      busNumber: 'DEMO-CRUD'
    };
    console.log('Creating trip...');
    res = await fetch(`${base}/api/trips`, { method: 'POST', headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload)});
    const created = await res.json();
    console.log('create status', res.status, created.message || created);
    if (!created.success) return process.exit(1);
    const tripId = created.data?.tripId || created.data?.tripId || created.data?.id || created.data?.trip_id || created.data?.id;
    console.log('Created trip id (raw):', tripId);

    // Attempt update
    const updatePayload = { price: 2500 };
    console.log('Updating trip...');
    res = await fetch(`${base}/api/trips/${tripId}`, { method: 'PUT', headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(updatePayload)});
    const updated = await res.json();
    console.log('update status', res.status, updated.message || updated);

    // Cancel trip
    console.log('Cancelling trip...');
    res = await fetch(`${base}/api/trips/${tripId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    const deleted = await res.json();
    console.log('delete status', res.status, deleted.message || deleted);

    process.exit(0);
  } catch (err) {
    console.error('Error in testCrud', err);
    process.exit(1);
  }
})();
