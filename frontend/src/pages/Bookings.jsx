import { useState, useEffect } from 'react';
import api from '../services/api';
import Payment from '../components/Payment';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await api.getBookings();
      setBookings(response.data || []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await api.cancelBooking(bookingId);
      fetchBookings();
      alert('Booking cancelled successfully!');
    } catch (err) {
      alert('Error cancelling booking: ' + err.message);
    }
  };

  if (loading) {
    return <div className="loading">Loading bookings...</div>;
  }

  return (
    <div className="bookings-container">
      <h2>My Bookings</h2>

      {error && <div className="alert alert-error">{error}</div>}

      {bookings.length === 0 ? (
        <div className="no-bookings card">
          <p>You don't have any bookings yet.</p>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map((booking) => (
            <div key={booking.bookingId} className="booking-card card">
              <div className="booking-header">
                <span className="booking-id">Booking #{booking.bookingId}</span>
                <span className={`status status-${booking.bookingStatus?.toLowerCase()}`}>
                  {booking.bookingStatus}
                </span>
              </div>

              <div className="booking-trip-info">
                <div className="route">
                  <span className="location">{booking.tripDetails?.origin}</span>
                  <span className="arrow">→</span>
                  <span className="location">{booking.tripDetails?.destination}</span>
                </div>
                <div className="trip-date">
                  {new Date(booking.tripDetails?.departureTime).toLocaleString()}
                </div>
                <div className="bus-info">Bus: {booking.tripDetails?.busNumber}</div>
              </div>

              <div className="booking-details">
                <div className="detail-row">
                  <span className="label">Seats:</span>
                  <span className="value">{booking.seatNumbers?.join(', ')}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Total Price:</span>
                  <span className="value price">{booking.totalPrice} RWF</span>
                </div>
                <div className="detail-row">
                  <span className="label">Booking Date:</span>
                  <span className="value">
                    {new Date(booking.bookingDate).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payment section for unpaid bookings */}
              {booking.paymentStatus !== 'completed' && (
                <Payment bookingId={booking.bookingId} amount={booking.totalPrice} onSuccess={fetchBookings} />
              )}

              {booking.passengerDetails && booking.passengerDetails.length > 0 && (
                <div className="passengers">
                  <h4>Passengers:</h4>
                  {booking.passengerDetails.map((passenger, index) => (
                    <div key={index} className="passenger-item">
                      <span>{passenger.name}</span>
                      <span className="passenger-meta">
                        Seat {passenger.seatNumber} • {passenger.age} yrs • {passenger.gender}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="booking-actions">
                <button
                  onClick={() => handleCancelBooking(booking.bookingId)}
                  className="btn btn-danger btn-small"
                  disabled={booking.bookingStatus === 'cancelled'}
                >
                  Cancel Booking
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Bookings;
