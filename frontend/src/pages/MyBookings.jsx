import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [payingTicket, setPayingTicket] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bookings');
      setBookings(response.data || []);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (ticketId) => {
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
      const response = await fetch(`${apiBase}/tickets/${ticketId}/download`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to download ticket');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-${ticketId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Error downloading ticket: ' + (err?.message || err));
    }
  };

  const openPayModal = (booking) => {
    setPayingTicket(booking);
    setShowPayModal(true);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">My Bookings</h2>
          <p className="text-sm text-slate-500">Manage your upcoming and past trips</p>
        </div>
        <div className="text-sm text-slate-500">{loading ? 'Loading…' : `${bookings.length} bookings`}</div>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-red-700 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <svg className="w-8 h-8 animate-spin text-slate-600" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
          </svg>
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-slate-500">You haven't made any bookings yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.map((booking, index) => (
            <article key={booking.id ?? booking.booking_reference ?? index} className="bg-white rounded-2xl shadow-sm p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-slate-400">Ref</div>
                    <div className="text-lg font-semibold text-slate-800">#{booking.booking_reference || booking.id}</div>
                  </div>

                  <StatusBadge status={booking.ticket_status} />
                </div>

                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <div className="flex justify-between"><span className="font-medium">Passenger</span><span>{booking.passenger_name}</span></div>
                  <div className="flex justify-between"><span className="font-medium">Route</span><span>{booking.origin} → {booking.destination}</span></div>
                  <div className="flex justify-between"><span className="font-medium">Travel Date</span><span>{new Date(booking.departure_time).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="font-medium">Seat</span><span className="font-mono text-sm">{booking.seat_number || '—'}</span></div>
                  <div className="flex justify-between"><span className="font-medium">Price</span><span className="font-semibold">{booking.price} RWF</span></div>
                  <div className="flex justify-between"><span className="font-medium">Payment</span><span className={`text-sm font-medium ${booking.payment_status === 'completed' ? 'text-green-600' : booking.payment_status === 'pending' ? 'text-yellow-600' : 'text-red-600'}`}>{booking.payment_status?.toUpperCase()}</span></div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                {booking.payment_status === 'pending' && (
                  <button onClick={() => openPayModal(booking)} className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white px-4 py-2">Pay Now</button>
                )}

                {booking.payment_status === 'completed' && (
                  <button onClick={() => handleDownloadPDF(booking.id)} className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2">📄 Download PDF</button>
                )}

                <button onClick={() => { navigator.clipboard?.writeText(booking.booking_reference || booking.id); }} className="text-sm text-slate-500 px-3 py-2">Copy Ref</button>
              </div>
            </article>
          ))}
        </div>
      )}

      {showPayModal && (
        <PayTicketModal
          ticket={payingTicket}
          onClose={() => {
            setShowPayModal(false);
            setPayingTicket(null);
          }}
          onPaid={async () => {
            await fetchBookings();
            setShowPayModal(false);
            setPayingTicket(null);
          }}
        />
      )}
    </div>
  );
};

function StatusBadge({ status }) {
  const s = (status || '').toLowerCase();
  const bg = s === 'cancelled' ? 'bg-red-500' : s === 'completed' ? 'bg-emerald-500' : 'bg-amber-500';
  return (
    <div className={`text-sm font-medium px-3 py-1 rounded-full text-white ${bg}`}>{(status || 'unknown').toUpperCase()}</div>
  );
}

function PayTicketModal({ ticket, onClose, onPaid }) {
  const [phone, setPhone] = useState(ticket?.passenger_phone || '');
  const [network, setNetwork] = useState('MTN');
  const [txRef, setTxRef] = useState('');
  const [status, setStatus] = useState('idle'); // idle | initiating | pending | completed | failed
  const [message, setMessage] = useState('');
  const pollingRef = useRef(null);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const startPolling = (reference) => {
    let attempts = 0;
    const maxAttempts = 30;

    pollingRef.current = setInterval(async () => {
      attempts += 1;
      try {
        const resp = await api.get(`/pay-ticket/status/${encodeURIComponent(reference)}`);
        const paymentStatus = String(resp?.data?.payment?.status || '').toLowerCase();

        if (paymentStatus === 'completed') {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          setStatus('completed');
          setMessage('Payment successful. Ticket confirmed.');
          await onPaid();
          return;
        }

        if (paymentStatus === 'failed') {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          setStatus('failed');
          setMessage('Payment failed. Please try again.');
          return;
        }

        if (attempts >= maxAttempts) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          setStatus('pending');
          setMessage('Still pending. If you paid, wait a bit and refresh.');
        }
      } catch (e) {
        if (attempts >= maxAttempts) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          setMessage('Unable to confirm status. Please refresh later.');
        }
      }
    }, 3000);
  };

  const handlePay = async () => {
    if (!ticket?.id) return;
    if (!phone || phone.replace(/\D/g, '').length < 9) {
      setMessage('Enter a valid phone number.');
      return;
    }

    setStatus('initiating');
    setMessage('');

    try {
      const resp = await api.post('/pay-ticket', {
        ticketId: ticket.id,
        phone,
        network,
      });

      const ref = resp?.data?.tx_ref;
      setTxRef(ref);
      setStatus('pending');
      setMessage('Confirm payment on your phone. Waiting for confirmation…');
      if (ref) startPolling(ref);
    } catch (e) {
      setStatus('failed');
      setMessage(e?.response?.data?.message || e.message || 'Failed to initiate payment');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-lg w-full max-w-lg mx-4 p-6 z-10">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">Pay Ticket</h3>
            <p className="text-sm text-slate-500 mt-1">Ticket #{ticket?.booking_reference || ticket?.id} • {ticket?.price} RWF</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <div className="mt-4 space-y-4">
          <label className="block text-sm text-slate-700">Phone Number</label>
          <input
            className="w-full rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 078xxxxxxx"
            disabled={status === 'initiating' || status === 'pending'}
          />

          <label className="block text-sm text-slate-700">Network</label>
          <select
            className="w-full rounded-md border border-slate-200 px-3 py-2"
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            disabled={status === 'initiating' || status === 'pending'}
          >
            <option value="MTN">MTN MoMo</option>
            <option value="AIRTEL">Airtel Money</option>
          </select>

          {txRef && (
            <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
              <div><strong>Reference:</strong> {txRef}</div>
              <div className="mt-1">Status: <strong className="uppercase">{status}</strong></div>
            </div>
          )}

          {message && <div className="text-sm text-slate-600">{message}</div>}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} disabled={status === 'initiating'} className="px-4 py-2 rounded-md border border-slate-200 text-sm text-slate-600">Close</button>
          <button onClick={handlePay} disabled={status === 'initiating' || status === 'pending'} className="px-4 py-2 rounded-md bg-amber-500 hover:bg-amber-600 text-white font-medium">{status === 'initiating' ? 'Starting…' : status === 'pending' ? 'Waiting…' : 'Pay Now'}</button>
        </div>
      </div>
    </div>
  );
}

export default MyBookings;
