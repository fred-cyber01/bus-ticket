const Trip = require('../models/Trip');

async function testGetTrips() {
    try {
        console.log('START_TEST');

        // Create a dummy trip first
        const newTrip = {
            origin: 'Kigali',
            destination: 'Musanze',
            departureTime: '2025-12-30T10:00:00',
            arrivalTime: '2025-12-30T12:00:00',
            price: 5000,
            totalSeats: 40,
            busNumber: 'RAB123A'
        };

        console.log('Creating trip...');
        // We need to be authenticated/admin to create usually, but model methods are static.
        // createFromSpec is what we want.
        const tripId = await Trip.createFromSpec(newTrip);
        console.log('Created trip ID:', tripId);

        console.log('Fetching trips...');
        const result = await Trip.findAllWithFilters({});
        console.log('TYPE:', typeof result);
        if (Array.isArray(result)) {
            console.log('LENGTH:', result.length);
            if (result.length > 0) {
                console.log('FIRST_ITEM:', JSON.stringify(result[0], null, 2));
            }
        } else {
            console.log('RESULT:', result);
        }
        console.log('END_TEST');
    } catch (error) {
        console.error('ERROR_CAUGHT:', error);
        if (error.stack) console.error(error.stack);
    }
    process.exit();
}

testGetTrips();
