import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const SeatSelection = ({ trip, onBack, onBookingComplete }) => {
  const { user } = useAuth();
  const [occupiedSeats, setOccupiedSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [passengerDetails, setPassengerDetails] = useState([]);
  const [showPassengerForm, setShowPassengerForm] = useState(false);
  const [currentPassengerIndex, setCurrentPassengerIndex] = useState(0);
  const [createdBooking, setCreatedBooking] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentPhone, setPaymentPhone] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentResponse, setPaymentResponse] = useState(null);
  const [ticketPreview, setTicketPreview] = useState(null);

  useEffect(() => {
    fetchOccupiedSeats();
  }, [trip]);

  const fetchOccupiedSeats = async () => {
    try {
      setLoading(true);
      // Get occupied seats for this trip
      const response = await api.getTripTickets(trip.id);
      // response expected to be { success: true, data: [bookings...] }
      const bookings = (response && response.data) || [];
      // Each booking may include tickets array or a seat_number property
      const occupied = [];
      bookings.forEach((b) => {
        if (b.trip_id == trip.id || b.tripId == trip.id || (b.tickets && b.tickets.some)) {
          if (Array.isArray(b.tickets)) {
            b.tickets.forEach((t) => {
              if (t.seat_number) occupied.push(t.seat_number);
            });
          } else if (b.seat_number) {
            occupied.push(b.seat_number);
          }
        }
      });
      setOccupiedSeats(occupied);
    } catch (error) {
      console.error('Error fetching occupied seats:', error);
      // Fallback: assume no seats occupied if API fails
      setOccupiedSeats([]);
    } finally {
      setLoading(false);
    }
  };

  const totalSeats = trip.total_seats || 50; // Default to 50 if not specified
  const availableSeats = Array.from({ length: totalSeats }, (_, i) => i + 1)
    .filter(seat => !occupiedSeats.includes(seat));

  const handleSeatClick = (seatNumber) => {
    if (occupiedSeats.includes(seatNumber)) return;

    setSelectedSeats(prev => {
      if (prev.includes(seatNumber)) {
        return prev.filter(seat => seat !== seatNumber);
      } else {
        return [...prev, seatNumber];
      }
    });
  };

  const handleProceedToBooking = () => {
    if (selectedSeats.length === 0) {
      alert('Please select at least one seat');
      return;
    }

    // Initialize passenger details form
    const initialDetails = selectedSeats.map(seatNumber => ({
      seatNumber,
      name: '',
      age: '',
      phone: user?.phone || '',
      email: user?.email || '',
      gender: ''
    }));

    setPassengerDetails(initialDetails);
    setCurrentPassengerIndex(0);
    setShowPassengerForm(true);
  };

  const handlePassengerDetailChange = (index, field, value) => {
    const updatedDetails = [...passengerDetails];
    updatedDetails[index][field] = value;
    setPassengerDetails(updatedDetails);
  };

  const handleConfirmBooking = async () => {
    // Validate all passenger details
    for (const passenger of passengerDetails) {
      if (!passenger.name || !passenger.name.trim()) {
        alert('Please enter name for all passengers');
        return;
      }
      if (!passenger.age || passenger.age < 1 || passenger.age > 120) {
        alert('Please enter valid age for all passengers');
        return;
      }
    }

    try {
      setBookingLoading(true);

      if (!trip || !trip.id) {
        throw new Error('Invalid trip data - missing trip ID');
      }

      const bookingData = {
        tripId: String(trip.id),
        seatNumbers: selectedSeats.map(seat => seat.toString()),
        passengerDetails: passengerDetails
      };

      const res = await api.createBooking(bookingData);
      const booking = res && res.data ? res.data : res;
      setCreatedBooking(booking);
      // open payment modal so user can continue to pay
      setShowPassengerForm(false);
      setShowPaymentModal(true);
    } catch (error) {
      alert('Error creating booking: ' + (error.message || 'Unknown error'));
    } finally {
      setBookingLoading(false);
    }
  };

  const initiatePaymentForBooking = async () => {
    if (!createdBooking) return alert('No booking available');
    if (!paymentPhone) return alert('Please enter phone number for payment');

    try {
      setPaymentStatus('initiating');
      const amount = (selectedSeats.length * (trip.price || 0)) || createdBooking.price || 0;
      if (!amount || amount <= 0) {
        setPaymentStatus('error');
        alert('Invalid amount for payment');
        return null;
      }

      const payload = {
        payment_type: 'ticket',
        amount,
        payment_method: 'mtn_momo',
        phone_number: paymentPhone,
        user_id: user?.id,
        metadata: { booking_id: createdBooking.id || createdBooking.booking_id || createdBooking._id },
      };

      // debug log to help trace 400 issues
      // eslint-disable-next-line no-console
      console.log('Initiating payment payload:', payload);

      const resp = await api.initiatePayment(payload);
      setPaymentResponse(resp);
      setPaymentStatus('pending');

      // fetch booking full details if available
      try {
        const full = await api.getBooking(createdBooking.id || createdBooking.booking_id || createdBooking._id).catch(() => null);
        const bookingFull = full && full.data ? full.data : createdBooking;

        const qrData = JSON.stringify({
          booking: bookingFull,
          transaction: resp || null
        });

        setTicketPreview({ booking: bookingFull, transaction: resp, qrData });
      } catch (e) {
        setTicketPreview({ booking: createdBooking, transaction: resp, qrData: JSON.stringify({ booking: createdBooking, transaction: resp }) });
      }

    } catch (err) {
      console.error('Payment initiation error', err);
      setPaymentStatus('error');
      alert('Payment initiation failed: ' + (err.message || 'Unknown'));
    }
  };

  const renderSeat = (seatNumber) => {
    const isOccupied = occupiedSeats.includes(seatNumber);
    const isSelected = selectedSeats.includes(seatNumber);

    let seatClass = 'w-10 h-10 m-1 rounded border-2 cursor-pointer flex items-center justify-center text-xs font-bold transition-all ';

    if (isOccupied) {
      seatClass += 'bg-red-500 border-red-600 text-white cursor-not-allowed';
    } else if (isSelected) {
      seatClass += 'bg-green-500 border-green-600 text-white';
    } else {
      seatClass += 'bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200';
    }

    return (
      <div
        key={seatNumber}
        className={seatClass}
        onClick={() => handleSeatClick(seatNumber)}
        title={isOccupied ? 'Occupied' : `Seat ${seatNumber}`}
      >
        {seatNumber}
      </div>
    );
  };

  const renderBusLayout = () => {
    const seatsPerRow = 4; // 2-2 configuration (driver side, aisle, passenger side)
    const rows = Math.ceil(totalSeats / seatsPerRow);

    return (
      <div className="bg-gray-100 p-6 rounded-lg border-2 border-gray-300">
        <div className="text-center mb-4">
          <div className="inline-block bg-blue-600 text-white px-4 py-2 rounded font-bold">
            FRONT OF BUS
          </div>
        </div>

        <div className="space-y-2">
          {Array.from({ length: rows }, (_, rowIndex) => (
            <div key={rowIndex} className="flex justify-center items-center">
              {/* Left side seats */}
              <div className="flex">
                {Array.from({ length: 2 }, (_, seatIndex) => {
                  const seatNumber = rowIndex * seatsPerRow + seatIndex + 1;
                  return seatNumber <= totalSeats ? renderSeat(seatNumber) : <div className="w-10 h-10 m-1"></div>;
                })}
              </div>

              {/* Aisle */}
              <div className="w-8 h-10 bg-gray-300 mx-2 rounded flex items-center justify-center text-xs text-gray-600">
                {rowIndex === 0 ? <img src="https://img.icons8.com/color/48/door.png" alt="door" className="h-6 w-6" /> : ''}
              </div>

              {/* Right side seats */}
              <div className="flex">
                {Array.from({ length: 2 }, (_, seatIndex) => {
                  const seatNumber = rowIndex * seatsPerRow + seatIndex + 3;
                  return seatNumber <= totalSeats ? renderSeat(seatNumber) : <div className="w-10 h-10 m-1"></div>;
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-4">
          <div className="inline-block bg-red-600 text-white px-4 py-2 rounded font-bold">
            BACK OF BUS
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading seat layout...</p>
        </div>
      </div>
    );
  }

  if (showPassengerForm) {
    const passenger = passengerDetails[currentPassengerIndex] || {};

    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-auto p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 max-h-[90vh] overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Passenger {currentPassengerIndex + 1} of {passengerDetails.length}</h3>
            <button onClick={() => { setShowPassengerForm(false); setPassengerDetails([]); }} className="text-gray-500">✕</button>
          </div>

          <p className="text-sm text-slate-600 mb-3">Seat: <strong>{passenger.seatNumber}</strong></p>

          <div className="space-y-3">
            <input type="text" placeholder="Full Name *" value={passenger.name || ''} onChange={(e) => handlePassengerDetailChange(currentPassengerIndex, 'name', e.target.value)} className="w-full border rounded px-3 py-2" />
            <input type="number" placeholder="Age *" value={passenger.age || ''} onChange={(e) => handlePassengerDetailChange(currentPassengerIndex, 'age', e.target.value)} className="w-full border rounded px-3 py-2" min="1" max="120" />
            <input type="tel" placeholder="Phone" value={passenger.phone || ''} onChange={(e) => handlePassengerDetailChange(currentPassengerIndex, 'phone', e.target.value)} className="w-full border rounded px-3 py-2" />
            <input type="email" placeholder="Email" value={passenger.email || ''} onChange={(e) => handlePassengerDetailChange(currentPassengerIndex, 'email', e.target.value)} className="w-full border rounded px-3 py-2" />
          </div>

          <div className="flex justify-between gap-3 mt-4">
            <button disabled={currentPassengerIndex === 0} onClick={() => setCurrentPassengerIndex(i => Math.max(0, i - 1))} className="px-4 py-2 border rounded disabled:opacity-50">Back</button>
            {currentPassengerIndex < passengerDetails.length - 1 ? (
              <button onClick={() => {
                // quick validation for this step
                const p = passengerDetails[currentPassengerIndex];
                if (!p.name || !p.age) return alert('Please enter name and age');
                setCurrentPassengerIndex(i => i + 1);
              }} className="px-4 py-2 bg-blue-600 text-white rounded">Next</button>
            ) : (
              <button onClick={handleConfirmBooking} disabled={bookingLoading} className="px-4 py-2 bg-green-600 text-white rounded">{bookingLoading ? 'Creating...' : 'Confirm & Continue to Payment'}</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              ← Back to Trips
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Select Seats</h1>
            <div></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-2">{trip.origin} → {trip.destination}</h2>
              <p className="text-gray-600 mb-1">{new Date(trip.departureTime).toLocaleString()}</p>
              <p className="text-gray-600 mb-1">Bus: {trip.busNumber || trip.plate_number || 'N/A'}</p>
              <p className="text-gray-600 mb-1">Company: {trip.companyName || trip.company_name || 'N/A'}</p>
              <p className="text-lg font-bold text-green-600">{trip.price ? `${trip.price} RWF per seat` : 'Price not available'}</p>
            </div>

            <div className="text-right">
              <div className="mb-4">
                <div className="flex items-center justify-end gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-100 border-2 border-blue-300 rounded"></div>
                    <span className="text-sm">Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 border-2 border-green-600 rounded"></div>
                    <span className="text-sm">Selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 border-2 border-red-600 rounded"></div>
                    <span className="text-sm">Occupied</span>
                  </div>
                </div>
              </div>

              {selectedSeats.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="font-semibold text-green-800">Selected Seats: {selectedSeats.join(', ')}</p>
                  <p className="text-green-700">Total: {selectedSeats.length * (trip.price || 5000)} RWF</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-center">Bus Seat Layout</h3>
          {renderBusLayout()}
        </div>

        {/* Payment / Ticket preview modal inside seat selection */}
        {showPaymentModal && createdBooking && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-3">Complete Payment</h3>
            <p className="text-sm text-slate-600 mb-3">Booking ID: {createdBooking.id || createdBooking.booking_id || createdBooking._id}</p>
            <p className="text-sm text-slate-600 mb-3">Seats: {selectedSeats.join(', ')}</p>
            <p className="text-sm font-bold text-slate-800 mb-3">Total: {(selectedSeats.length * (trip.price || 0)).toLocaleString()} RWF</p>

            {paymentStatus !== 'pending' && (
              <div className="mb-4">
                <label className="block text-xs text-slate-500 mb-1">Phone (MTN Mobile Money)</label>
                <input value={paymentPhone} onChange={(e) => setPaymentPhone(e.target.value)} placeholder="2507XXXXXXXX" className="w-full border px-3 py-2 rounded mb-2" />
                <div className="flex gap-3">
                  <button onClick={initiatePaymentForBooking} className="px-4 py-2 bg-indigo-600 text-white rounded">Pay Now</button>
                  <button onClick={() => { setShowPaymentModal(false); setCreatedBooking(null); }} className="px-4 py-2 border rounded">Cancel</button>
                </div>
              </div>
            )}

            {paymentStatus === 'initiating' && <p className="text-sm text-slate-500">Initiating payment...</p>}
            {paymentStatus === 'error' && <p className="text-sm text-red-600">Payment failed. Try again.</p>}

            {paymentStatus === 'pending' && ticketPreview && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Ticket Preview</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 border rounded">
                    <p className="text-sm"><strong>Passenger(s):</strong></p>
                    {ticketPreview.booking.passengers || ticketPreview.booking.passengerDetails || passengerDetails.map(p => (<div key={p.seatNumber} className="text-sm">{p.seatNumber} — {p.name || '—'}</div>))}
                    <p className="text-sm mt-2"><strong>Route:</strong> {trip.origin} → {trip.destination}</p>
                    <p className="text-sm"><strong>Departure:</strong> {new Date(trip.departureTime).toLocaleString()}</p>
                    <p className="text-sm"><strong>Seats:</strong> {selectedSeats.join(', ')}</p>
                    <p className="text-sm"><strong>Amount:</strong> {(selectedSeats.length * (trip.price || 0)).toLocaleString()} RWF</p>
                    <p className="text-sm"><strong>Transaction:</strong> {paymentResponse && (paymentResponse.transactionRef || paymentResponse.ref || paymentResponse.id || 'pending')}</p>
                  </div>
                  <div className="flex flex-col items-center justify-center p-3 border rounded">
                    <p className="text-sm font-semibold mb-2">QR Code</p>
                    <img alt="QR code" src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(ticketPreview.qrData)}`} className="w-48 h-48" />
                    <p className="text-xs text-slate-500 mt-2">Scan at boarding to verify ticket</p>
                  </div>
                </div>

                <div className="flex gap-3 mt-4 justify-end">
                  <button onClick={() => {
                    // allow user to keep modal open or download via dashboard later
                    if (onBookingComplete) onBookingComplete();
                    if (onBack) onBack();
                  }} className="px-4 py-2 bg-green-600 text-white rounded">Done</button>
                  <button onClick={() => { setShowPaymentModal(false); setCreatedBooking(null); }} className="px-4 py-2 border rounded">Close</button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center">
            <div className="text-gray-600">
              {availableSeats.length} seats available out of {totalSeats}
            </div>
            <button
              onClick={handleProceedToBooking}
              disabled={selectedSeats.length === 0}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Proceed to Booking ({selectedSeats.length} seats)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatSelection;
