import { useState, useEffect } from 'react';
import '../styles/add-trip.css';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Trips = () => {
  const { isAdmin } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [filters, setFilters] = useState({
    origin: '',
    destination: '',
    date: '',
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTrip, setNewTrip] = useState({
    origin: '',
    destination: '',
    departureTime: '',
    arrivalTime: '',
    price: '',
    totalSeats: '',
    busNumber: '',
  });

  // Helper: format Date -> value suitable for <input type="datetime-local">
  const toLocalInput = (d) => {
    const pad = (n) => String(n).padStart(2, '0');
    const YYYY = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const DD = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${YYYY}-${MM}-${DD}T${hh}:${mm}`;
  };

  // When opening create form, prefill sensible default date/time values
  useEffect(() => {
    if (showCreateForm) {
      setNewTrip(prev => {
        if (prev.departureTime) return prev; // don't overwrite if user already has values
        const now = new Date();
        const dep = new Date(now.getTime() + 60 * 60 * 1000); // +1 hour
        const arr = new Date(now.getTime() + 4 * 60 * 60 * 1000); // +4 hours
        return {
          ...prev,
          departureTime: toLocalInput(dep),
          arrivalTime: toLocalInput(arr),
        };
      });
    }
  }, [showCreateForm]);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async (filterParams = {}) => {
    try {
      setLoading(true);
      const response = await api.getTrips(filterParams);
      setTrips(response.data || []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const handleSearch = () => {
    const activeFilters = {};
    if (filters.origin) activeFilters.origin = filters.origin;
    if (filters.destination) activeFilters.destination = filters.destination;
    if (filters.date) activeFilters.date = filters.date;
    setCurrentPage(1); // Reset to first page on new search
    fetchTrips(activeFilters);
  };

  // Pagination calculations
  const totalPages = Math.ceil(trips.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTrips = trips.slice(startIndex, endIndex);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1); // Reset to first page
  };

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    try {
      // Validate and normalize datetime inputs to ISO strings (backend expects parseable dates)
      // For datetime-local inputs, browsers provide local time without timezone.
      // Construct Date objects by appending seconds if necessary.
      const dep = newTrip.departureTime ? new Date(newTrip.departureTime) : null;
      const arr = newTrip.arrivalTime ? new Date(newTrip.arrivalTime) : null;

      if (!dep || isNaN(dep.getTime())) {
        alert('Please provide a valid departure date/time');
        return;
      }

      if (newTrip.arrivalTime && isNaN(arr.getTime())) {
        alert('Please provide a valid arrival date/time');
        return;
      }

      const payload = {
        ...newTrip,
        departureTime: dep.toISOString(),
        arrivalTime: arr ? arr.toISOString() : undefined,
        price: Number(newTrip.price) || 0,
        totalSeats: Number(newTrip.totalSeats) || undefined,
      };

      await api.createTrip(payload);
      setShowCreateForm(false);
      setNewTrip({
        origin: '',
        destination: '',
        departureTime: '',
        arrivalTime: '',
        price: '',
        totalSeats: '',
        busNumber: '',
      });
      fetchTrips();
      alert('Trip created successfully!');
    } catch (err) {
      alert('Error creating trip: ' + err.message);
    }
  };

  const handleCancelTrip = async (tripId) => {
    if (!window.confirm('Are you sure you want to cancel this trip?')) return;
    
    try {
      await api.cancelTrip(tripId);
      fetchTrips();
      alert('Trip cancelled successfully!');
    } catch (err) {
      alert('Error cancelling trip: ' + err.message);
    }
  };

  const handleBookTrip = async (trip) => {
    if (!trip.tripId) {
      alert('Invalid trip data');
      return;
    }

    if (trip.availableSeats <= 0) {
      alert('No seats available for this trip');
      return;
    }

    // Collect passenger details
    const passengerName = prompt('Enter passenger name:');
    if (!passengerName) return;

    const passengerAge = prompt('Enter passenger age:');
    if (!passengerAge || isNaN(passengerAge) || parseInt(passengerAge) < 1) {
      alert('Please enter a valid age');
      return;
    }

    const passengerPhone = prompt('Enter phone number (optional):') || '';
    const passengerEmail = prompt('Enter email (optional):') || '';

    // For simplicity, auto-select first available seat returned by the API.
    // In a real app, you'd show a seat selection UI.
    const seatNumber = Array.isArray(trip.availableSeatNumbers) && trip.availableSeatNumbers.length > 0
      ? trip.availableSeatNumbers[0]
      : (trip.totalSeats - trip.availableSeats + 1);

    try {
      const bookingData = {
        tripId: trip.tripId.toString(),
        seatNumbers: [seatNumber.toString()],
        passengerDetails: [{
          name: passengerName,
          age: parseInt(passengerAge),
          phone: passengerPhone,
          email: passengerEmail,
          seatNumber: seatNumber
        }]
      };
      
      await api.createBooking(bookingData);
      
      alert(`Booking created successfully! 
      
Seat ${seatNumber} reserved for ${passengerName}

⚠️ IMPORTANT: Your ticket is PENDING until payment is completed.

Please complete payment to confirm your ticket.
After payment confirmation, you can download your ticket as PDF.`);
      
      fetchTrips(); // Refresh trips to update available seats
    } catch (err) {
      alert('Error creating booking: ' + err.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return <div className="loading">Loading trips...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-slate-800">Available Trips</h2>
        {isAdmin() && (
          <button onClick={() => setShowCreateForm(!showCreateForm)} className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2">{showCreateForm ? 'Cancel' : '+ Create Trip'}</button>
        )}
      </div>

      {showCreateForm && isAdmin() && (
        <div className="mb-6 bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-3">Create New Trip</h3>
          <form onSubmit={handleCreateTrip} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="border rounded-lg px-4 py-2" type="text" value={newTrip.origin} onChange={(e) => setNewTrip({ ...newTrip, origin: e.target.value })} required placeholder="Origin (e.g., Kigali)" />
            <input className="border rounded-lg px-4 py-2" type="text" value={newTrip.destination} onChange={(e) => setNewTrip({ ...newTrip, destination: e.target.value })} required placeholder="Destination (e.g., Butare)" />
            <input className="border rounded-lg px-4 py-2" type="datetime-local" value={newTrip.departureTime} onChange={(e) => setNewTrip({ ...newTrip, departureTime: e.target.value })} required />
            <input className="border rounded-lg px-4 py-2" type="datetime-local" value={newTrip.arrivalTime} onChange={(e) => setNewTrip({ ...newTrip, arrivalTime: e.target.value })} required />
            <input className="border rounded-lg px-4 py-2" type="number" value={newTrip.price} onChange={(e) => setNewTrip({ ...newTrip, price: e.target.value })} required min="0" placeholder="Price (RWF)" />
            <input className="border rounded-lg px-4 py-2" type="number" value={newTrip.totalSeats} onChange={(e) => setNewTrip({ ...newTrip, totalSeats: e.target.value })} required min="1" placeholder="Total Seats" />
            <input className="border rounded-lg px-4 py-2 md:col-span-2" type="text" value={newTrip.busNumber} onChange={(e) => setNewTrip({ ...newTrip, busNumber: e.target.value })} required placeholder="Bus Number (e.g., RAC001B)" />
            <div className="md:col-span-2 text-right">
              <button type="submit" className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-5 py-2">Create Trip</button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-6 bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="text-md font-medium mb-3">Filter Trips</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input className="border rounded-lg px-3 py-2" type="text" name="origin" value={filters.origin} onChange={handleFilterChange} placeholder="Origin" />
          <input className="border rounded-lg px-3 py-2" type="text" name="destination" value={filters.destination} onChange={handleFilterChange} placeholder="Destination" />
          <input className="border rounded-lg px-3 py-2" type="date" name="date" value={filters.date} onChange={handleFilterChange} />
          <div className="flex items-center">
            <button onClick={handleSearch} className="w-full rounded-lg bg-amber-500 hover:bg-amber-600 text-white px-4 py-2">Search</button>
          </div>
        </div>
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-red-700 text-sm">{error}</div>}

      {trips.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-slate-500">No trips found matching your criteria.</div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-slate-500">Showing {startIndex + 1}-{Math.min(endIndex, trips.length)} of {trips.length} trips</div>
            <select value={itemsPerPage} onChange={handleItemsPerPageChange} className="border rounded-lg px-3 py-2">
              <option value="3">3 per page</option>
              <option value="5">5 per page</option>
              <option value="10">10 per page</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentTrips.map((trip) => (
              <div key={trip.tripId} className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-slate-500">{trip.companyName}</div>
                    <div className="text-lg font-semibold text-slate-800">{trip.origin} → {trip.destination}</div>
                    <div className="text-sm text-slate-500">{formatDate(trip.departureTime)}{trip.arrivalTime ? ` • ${formatDate(trip.arrivalTime)}` : ''}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{trip.price ? `${trip.price} RWF` : '—'}</div>
                    <div className="text-sm text-slate-500">Seats: <span className="font-medium">{trip.availableSeats}/{trip.totalSeats}</span></div>
                  </div>
                </div>

                {trip.availableSeatNumbers && trip.availableSeatNumbers.length > 0 && (
                  <div className="mt-3 text-sm text-slate-600">Available seats: {trip.availableSeatNumbers.slice(0,10).join(', ')}{trip.availableSeatNumbers.length > 10 ? '...' : ''}</div>
                )}

                <div className="mt-4 flex gap-3">
                  <button onClick={() => handleBookTrip(trip)} disabled={trip.availableSeats <= 0} className={`flex-1 rounded-lg px-4 py-2 text-white ${trip.availableSeats > 0 ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-300 cursor-not-allowed'}`}>{trip.availableSeats > 0 ? 'Book Now' : 'Sold Out'}</button>
                  {isAdmin() && (<button onClick={() => handleCancelTrip(trip.tripId)} className="rounded-lg px-4 py-2 border border-red-300 text-red-600">Cancel</button>)}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-2 rounded-lg bg-white border">← Previous</button>
              <div className="flex gap-2">
                {[...Array(totalPages)].map((_, idx) => (
                  <button key={idx} onClick={() => handlePageChange(idx+1)} className={`px-3 py-2 rounded-lg ${currentPage === idx+1 ? 'bg-blue-600 text-white' : 'bg-white border'}`}>{idx+1}</button>
                ))}
              </div>
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-2 rounded-lg bg-white border">Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Trips;
