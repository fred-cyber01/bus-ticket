import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import SeatSelection from './SeatSelection';

// Local lightweight icon components (fallbacks) to avoid dev dependency on lucide-react
const Icon = ({ children, className = '' }) => (
  <span aria-hidden className={`inline-block ${className}`}>{children}</span>
);
const Ticket = (p) => <Icon {...p}><img src="/assets/icon-ticket.svg" alt="ticket" className="h-5 w-5"/></Icon>;
const CreditCard = (p) => <Icon {...p}><img src="/assets/icon-card.svg" alt="card" className="h-5 w-5"/></Icon>;
const ArrowRight = (p) => <Icon {...p}><img src="/assets/icon-generic.svg" alt="arrow" className="h-5 w-5"/></Icon>;
const MapPin = (p) => <Icon {...p}><img src="/assets/icon-generic.svg" alt="pin" className="h-5 w-5"/></Icon>;
const Calendar = (p) => <Icon {...p}><img src="/assets/icon-generic.svg" alt="calendar" className="h-5 w-5"/></Icon>;
const Bus = (p) => <Icon {...p}><img src="/assets/rwanda-ict-logo.png" alt="bus" className="h-6 w-6 object-cover"/></Icon>;
const QrCode = (p) => <Icon {...p}><img src="/assets/icon-generic.svg" alt="qr" className="h-5 w-5"/></Icon>;
const Download = (p) => <Icon {...p}><img src="/assets/icon-generic.svg" alt="download" className="h-5 w-5"/></Icon>;
const X = (p) => <Icon {...p}><img src="/assets/icon-generic.svg" alt="close" className="h-5 w-5"/></Icon>;
const Search = (p) => <Icon {...p}><img src="/assets/icon-generic.svg" alt="search" className="h-5 w-5"/></Icon>;
const LogOut = (p) => <Icon {...p}><img src="/assets/icon-generic.svg" alt="logout" className="h-5 w-5"/></Icon>;
const LayoutDashboard = (p) => <Icon {...p}><img src="/assets/icon-generic.svg" alt="layout" className="h-5 w-5"/></Icon>;
const User = (p) => <Icon {...p}><img src="/assets/icon-generic.svg" alt="user" className="h-5 w-5"/></Icon>;
const Settings = (p) => <Icon {...p}><img src="/assets/icon-generic.svg" alt="settings" className="h-5 w-5"/></Icon>;
const HelpCircle = (p) => <Icon {...p}><img src="/assets/icon-support.svg" alt="help" className="h-5 w-5"/></Icon>;
const Menu = (p) => <Icon {...p}><img src="/assets/icon-generic.svg" alt="menu" className="h-5 w-5"/></Icon>;
const Bell = (p) => <Icon {...p}><img src="/assets/icon-generic.svg" alt="bell" className="h-5 w-5"/></Icon>;
const ChevronRight = (p) => <Icon {...p}><img src="/assets/icon-generic.svg" alt="chevron" className="h-5 w-5"/></Icon>;

// --- Note ---
// This dashboard now fetches real data from the backend using `api` helper.

// --- COMPONENTS ---

export default function CustomerDashboard() {
  const { user, signout, isAdmin, isCompanyManager } = useAuth();
  const [activeTab, setActiveTab] = useState('tickets');
  const [tickets, setTickets] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOrigin, setSearchOrigin] = useState('');
  const [searchDestination, setSearchDestination] = useState('');
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [uniqueOrigins, setUniqueOrigins] = useState([]);
  const [uniqueDestinations, setUniqueDestinations] = useState([]);
  const [buyingTicket, setBuyingTicket] = useState(null);
  const [seatTrip, setSeatTrip] = useState(null);
  const [payPhone, setPayPhone] = useState('');
  const [payStatus, setPayStatus] = useState(null);
  const [showCreateTrip, setShowCreateTrip] = useState(false);
  const [newTrip, setNewTrip] = useState({
    origin: '',
    destination: '',
    departureTime: '',
    arrivalTime: '',
    price: '',
    totalSeats: '',
    busNumber: '',
  });
  const [searchDate, setSearchDate] = useState('');
  const [searchTimeOfDay, setSearchTimeOfDay] = useState('all'); // all, morning, afternoon, evening, night
  const [availableTrips, setAvailableTrips] = useState([]);
  const [showAvailableTrips, setShowAvailableTrips] = useState(false);
  const [sortBy, setSortBy] = useState('time'); // time, price, seats
  // removed mobile overlay to match provided mockup (desktop-first)

  // Re-sort trips when sort option changes
  useEffect(() => {
    if (availableTrips.length === 0) return;
    
    const sorted = [...availableTrips];
    if (sortBy === 'time') {
      sorted.sort((a, b) => new Date(a.departure_time) - new Date(b.departure_time));
    } else if (sortBy === 'price') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'seats') {
      sorted.sort((a, b) => (b.availableSeats || 0) - (a.availableSeats || 0));
    }
    setAvailableTrips(sorted);
  }, [sortBy]);

  useEffect(() => {
    let mounted = true;

    async function loadTrips() {
      try {
        setLoading(true);
        const tripsRes = await api.getTrips();
        const paymentsRes = await api.getPaymentHistory().catch(() => ({ data: [] }));

        // If this is a regular customer (not admin/company manager), prefer showing their bookings as "My Tickets"
        const showBookingsForCustomer = !(isAdmin?.() || isCompanyManager?.());
        if (showBookingsForCustomer) {
          try {
            const bookingsRes = await api.getBookings().catch(() => ({ data: [] }));
            const rawBookings = bookingsRes.data || [];
            const normalizeDeparture = (item) => {
              const candidates = [item.departure_time, item.departureTime, item.trip_date && item.departure_time ? `${item.trip_date}T${item.departure_time}` : null];
              for (const c of candidates) {
                if (!c) continue;
                try {
                  const s = String(c).trim();
                  const fixed = s.includes(' ') && s.includes('-') ? s.replace(' ', 'T') : s;
                  const withSeconds = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(fixed) ? fixed + ':00' : fixed;
                  const d = new Date(withSeconds);
                  if (!isNaN(d.getTime())) return d.toISOString();
                } catch (e) {}
              }
              return null;
            };

            const bookings = rawBookings.map(b => ({
              id: b.id,
              boarding_stop_name: b.boarding_stop_name || b.boarding || '',
              dropoff_stop_name: b.dropoff_stop_name || b.dropoff || '',
              origin: b.boarding_stop_name || b.boarding || b.origin || '',
              destination: b.dropoff_stop_name || b.dropoff || b.destination || '',
              departure_time: normalizeDeparture(b),
              price: Number(b.price || b.totalAmount || b.total_price || 0),
              seat_number: b.seat_number || b.seat || null,
              route_name: b.route_name || '',
              plate_number: b.plate_number || b.bus_plate || '' ,
              company_name: b.company_name || '' ,
              status: b.ticket_status || b.status || '',
              passenger_name: b.passenger_name || '',
              passenger_phone: b.passenger_phone || '',
              passenger_email: b.passenger_email || '',
              passenger_age: b.passenger_age || null,
              payment_status: b.payment_status || 'pending',
              payment_method: b.payment_method || 'MTN Mobile Money',
              booking_reference: b.booking_reference || `BK${String(b.id || '').padStart(6, '0')}`,
              qr_code: b.qr_code || null,
              transaction_ref: b.transaction_ref || null
            }));

            setTickets(bookings);
          } catch (e) {
            console.warn('Failed to load bookings for customer view', e);
          }
        }

        if (!mounted) return;

        let trips = tripsRes.data || [];
        // Normalize trips to ensure departure_time (ISO) and price are present
        const normalizeDeparture = (item) => {
          const candidates = [item.departure_time, item.departureTime, item.full_departure_time, item.trip_date && item.departure_time ? `${item.trip_date}T${item.departure_time}` : null, item.trip_date && item.departureTime ? `${item.trip_date}T${item.departureTime}` : null];
          for (const c of candidates) {
            if (!c) continue;
            try {
              const s = String(c).trim();
              // tolerate 'YYYY-MM-DD HH:MM' => 'T'
              const fixed = s.includes(' ') && s.includes('-') ? s.replace(' ', 'T') : s;
              const withSeconds = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(fixed) ? fixed + ':00' : fixed;
              const d = new Date(withSeconds);
              if (!isNaN(d.getTime())) return d.toISOString();
            } catch (e) { /* ignore */ }
          }
          return null;
        };

        const normalizePrice = (item) => {
          const p = item.price ?? item.fare ?? item.totalAmount ?? item.total_price ?? item.amount ?? 0;
          const n = Number(p || 0);
          return Number.isFinite(n) ? n : 0;
        };

        trips = trips.map(s => ({
          id: s.id || s.tripId || s.schedule_id || Math.random(),
          route_name: s.route_name || s.name || s.routeName || '',
          boarding_stop_name: s.origin_stop_name || s.origin || s.boarding_stop_name || s.originName || '',
          dropoff_stop_name: s.destination_stop_name || s.destination || s.dropoff_stop_name || s.destinationName || '',
          departure_time: normalizeDeparture(s),
          price: normalizePrice(s),
          seat_number: s.seat_number || null,
          availableSeats: s.available_seats ?? s.availableSeats ?? s.totalSeats ?? 0,
          bus_number: s.plate_number || s.busNumber || s.bus_number || '',
          company_name: s.company_name || s.companyName || ''
        }));
        // If no trips returned for customers, fall back to available schedules (public)
        if ((!trips || trips.length === 0) && mounted) {
          try {
            // check session cache first
            const cacheRaw = sessionStorage.getItem('available_trips_cache');
            let avail = null;
            if (cacheRaw) {
              try {
                const parsed = JSON.parse(cacheRaw);
                if (parsed._cachedAt && (Date.now() - parsed._cachedAt) < 2 * 60 * 1000) {
                  avail = parsed.data;
                } else {
                  sessionStorage.removeItem('available_trips_cache');
                }
              } catch (err) {
                sessionStorage.removeItem('available_trips_cache');
              }
            }

            if (!avail) {
              const availRes = await api.getAvailableTrips().catch(() => null);
              avail = availRes && availRes.data ? availRes.data : null;
              if (avail) {
                try { sessionStorage.setItem('available_trips_cache', JSON.stringify({ _cachedAt: Date.now(), data: avail })); } catch(e){}
              }
            }

            if (avail && Array.isArray(avail) && avail.length > 0) {
              trips = avail.map(s => ({
                id: s.trip_id || s.schedule_id || Math.random(),
                route_name: s.route_name,
                boarding_stop_name: s.origin_stop_name || s.origin,
                dropoff_stop_name: s.destination_stop_name || s.destination,
                departure_time: s.departure_time || s.full_departure_time,
                price: s.price || 0,
                seat_number: null,
                availableSeats: s.available_seats,
                bus_number: s.plate_number || s.busNumber,
              }));
            }
          } catch (e) {
            console.warn('available trips fallback failed', e);
          }
        }

        if (!(isAdmin?.() || isCompanyManager?.())) {
          // customers already had bookings loaded above; avoid overwriting
        } else {
          setTickets(trips);
        }
        setPayments(paymentsRes.data || []);

        // derive unique origins/destinations for autocomplete
        const originsSet = new Set();
        const destSet = new Set();
        for (const t of trips) {
          const o = t.origin || t.origin_stop_name || t.boarding_stop_name || t.originName || t.from || '';
          const d = t.destination || t.destination_stop_name || t.dropoff_stop_name || t.destinationName || t.to || '';
          if (o) originsSet.add(String(o).trim());
          if (d) destSet.add(String(d).trim());
        }
        let origins = Array.from(originsSet);
        let dests = Array.from(destSet);

        // If still empty, fetch routes and derive unique stops from routes (use session cache)
        if ((origins.length === 0 || dests.length === 0) && mounted) {
          try {
            let routes = null;
            const rcache = sessionStorage.getItem('routes_cache');
            if (rcache) {
              try {
                const parsed = JSON.parse(rcache);
                if (parsed._cachedAt && (Date.now() - parsed._cachedAt) < 10 * 60 * 1000) {
                  routes = parsed.data;
                } else {
                  sessionStorage.removeItem('routes_cache');
                }
              } catch (err) { sessionStorage.removeItem('routes_cache'); }
            }

            if (!routes) {
              const routesRes = await api.getRoutes();
              routes = routesRes.data || [];
              try { sessionStorage.setItem('routes_cache', JSON.stringify({ _cachedAt: Date.now(), data: routes })); } catch(e){}
            }

            for (const r of (routes || [])) {
              const on = r.origin_name || r.origin_stop_name || (r.name ? r.name.split('-')[0]?.trim() : null);
              const dn = r.destination_name || r.destination_stop_name || (r.name ? r.name.split('-')[1]?.trim() : null);
              if (on) origins.push(on);
              if (dn) dests.push(dn);
            }

            // dedupe
            origins = Array.from(new Set(origins));
            dests = Array.from(new Set(dests));
          } catch (e) {
            console.warn('routes fetch failed', e);
          }
        }

        setUniqueOrigins(origins);
        setUniqueDestinations(dests);
      } catch (err) {
        console.error('Error fetching dashboard data', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadTrips();

    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadBookings() {
      setLoadingBookings(true);
      try {
        const res = await api.getBookings();
        if (!mounted) return;
        if (res && res.data) setBookings(res.data);
      } catch (err) {
        console.error('Failed to load bookings', err);
      } finally {
        if (mounted) setLoadingBookings(false);
      }
    }

    loadBookings();
    return () => { mounted = false; };
  }, []);

  const handleSearch = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (searchOrigin) filters.origin = searchOrigin;
      if (searchDestination) filters.destination = searchDestination;
      if (searchDate) filters.date = searchDate;

      const res = await api.getTrips(filters);
      const raw = res.data || [];
      const normalizeDeparture = (item) => {
        const candidates = [item.departure_time, item.departureTime, item.full_departure_time, item.trip_date && item.departure_time ? `${item.trip_date}T${item.departure_time}` : null, item.trip_date && item.departureTime ? `${item.trip_date}T${item.departureTime}` : null];
        for (const c of candidates) {
          if (!c) continue;
          try {
            const s = String(c).trim();
            const fixed = s.includes(' ') && s.includes('-') ? s.replace(' ', 'T') : s;
            const withSeconds = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(fixed) ? fixed + ':00' : fixed;
            const d = new Date(withSeconds);
            if (!isNaN(d.getTime())) return d.toISOString();
          } catch (e) { }
        }
        return null;
      };
      const normalizePrice = (item) => {
        const p = item.price ?? item.fare ?? item.totalAmount ?? item.total_price ?? item.amount ?? 0;
        const n = Number(p || 0);
        return Number.isFinite(n) ? n : 0;
      };

      let mapped = raw.map(s => ({
        id: s.id || s.tripId || s.schedule_id || Math.random(),
        route_name: s.route_name || s.name || s.routeName || '',
        boarding_stop_name: s.origin_stop_name || s.origin || s.boarding_stop_name || s.originName || '',
        dropoff_stop_name: s.destination_stop_name || s.destination || s.dropoff_stop_name || s.destinationName || '',
        departure_time: normalizeDeparture(s),
        price: normalizePrice(s),
        seat_number: s.seat_number || null,
        availableSeats: s.available_seats ?? s.availableSeats ?? s.totalSeats ?? 0,
        total_seats: s.total_seats ?? s.available_seats ?? s.availableSeats ?? s.totalSeats ?? 50,
        bus_number: s.plate_number || s.busNumber || s.bus_number || '',
        company_name: s.company_name || s.companyName || ''
      }));

      // Filter by time of day
      if (searchTimeOfDay !== 'all') {
        mapped = mapped.filter(trip => {
          if (!trip.departure_time) return true;
          const hour = new Date(trip.departure_time).getHours();
          if (searchTimeOfDay === 'morning' && hour >= 5 && hour < 12) return true;
          if (searchTimeOfDay === 'afternoon' && hour >= 12 && hour < 17) return true;
          if (searchTimeOfDay === 'evening' && hour >= 17 && hour < 21) return true;
          if (searchTimeOfDay === 'night' && (hour >= 21 || hour < 5)) return true;
          return false;
        });
      }

      // Sort trips
      if (sortBy === 'time') {
        mapped.sort((a, b) => new Date(a.departure_time) - new Date(b.departure_time));
      } else if (sortBy === 'price') {
        mapped.sort((a, b) => a.price - b.price);
      } else if (sortBy === 'seats') {
        mapped.sort((a, b) => (b.availableSeats || 0) - (a.availableSeats || 0));
      }

      setAvailableTrips(mapped);
      setShowAvailableTrips(true);
      setTickets(mapped);
    } catch (err) {
      console.error('Search error', err);
      alert('Error searching trips: ' + (err.message || 'Unknown'));
    } finally {
      setLoading(false);
    }
  };

  const onOriginChange = (val) => {
    setSearchOrigin(val);
    if (!val) {
      setOriginSuggestions([]);
      return;
    }
    const q = val.toLowerCase();
    setOriginSuggestions(uniqueOrigins.filter(o => o.toLowerCase().includes(q)).slice(0,6));
  };

  const onDestinationChange = (val) => {
    setSearchDestination(val);
    if (!val) {
      setDestinationSuggestions([]);
      return;
    }
    const q = val.toLowerCase();
    setDestinationSuggestions(uniqueDestinations.filter(d => d.toLowerCase().includes(q)).slice(0,6));
  };

  const pickOrigin = (val) => {
    setSearchOrigin(val);
    setOriginSuggestions([]);
  };

  const pickDestination = (val) => {
    setSearchDestination(val);
    setDestinationSuggestions([]);
  };

  const handleDownload = (e, ticketData) => {
    e.stopPropagation();
    (async () => {
      try {
        let booking = null;
        if (ticketData && typeof ticketData === 'object') {
          booking = ticketData;
        } else if (ticketData) {
          const res = await api.getBooking(ticketData).catch(() => null);
          booking = res && res.data ? res.data : null;
          // Map fields for display
          if (booking) {
            booking.origin = booking.origin || booking.boarding_stop_name || '';
            booking.destination = booking.destination || booking.dropoff_stop_name || '';
            booking.booking_reference = booking.booking_reference || `BK${String(booking.id || '').padStart(6, '0')}`;
          }
        }
        if (!booking) return alert('Unable to fetch ticket details for download');

        const ticketNum = booking.booking_reference || booking.id || '000000';
        const qrCodeUrl = booking.qr_code || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify({id: booking.id, ref: ticketNum}))}`;
        
        const html = `<!doctype html><html><head><meta charset="utf-8"><title>Ticket #${ticketNum}</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#333;background:#f5f5f5;padding:20px}.container{max-width:800px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1)}.header{background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);color:white;text-align:center;padding:24px}.header h1{font-size:24px;margin-bottom:8px}.header p{font-size:14px;opacity:0.9}.ticket-num{background:#f97316;color:white;text-align:center;padding:8px;font-weight:600;font-size:14px}.content{padding:32px}.section{margin-bottom:24px}.section-title{background:#f1f5f9;padding:8px 12px;font-size:13px;font-weight:600;color:#475569;margin-bottom:12px;border-left:4px solid #3b82f6}.info-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}.info-item{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px}.info-item .label{color:#64748b;font-weight:500}.info-item .value{color:#1e293b;font-weight:600}.pricing{background:#f8fafc;padding:16px;border-radius:8px;margin-top:16px}.pricing .total{border-top:2px solid #cbd5e1;margin-top:12px;padding-top:12px;font-size:18px;font-weight:700;color:#f97316}.qr-section{text-align:center;margin:24px 0}.qr-section img{width:180px;height:180px;border:2px solid #e2e8f0;border-radius:8px;padding:8px;background:white}.footer{background:#f8fafc;padding:16px;border-top:2px solid #e2e8f0;font-size:12px;color:#64748b}.footer ul{list-style:none;padding-left:0}.footer li{margin:4px 0;padding-left:16px;position:relative}.footer li:before{content:'•';position:absolute;left:0;color:#3b82f6}@media print{body{background:white;padding:0}.container{box-shadow:none}}@media (max-width:768px){.info-grid{grid-template-columns:1fr}}</style></head><body><div class="container"><div class="header"><h1>🚌 BUS COMPANY</h1><p>E-Ticket - Rwanda Bus Service</p></div><div class="ticket-num">TICKET #${ticketNum}</div><div class="content"><div class="info-grid"><div><div class="section-title">PASSENGER INFORMATION</div><div class="info-item"><span class="label">Full Name:</span><span class="value">${booking.passenger_name || 'N/A'}</span></div><div class="info-item"><span class="label">Phone:</span><span class="value">${booking.passenger_phone || booking.user_phone || 'N/A'}</span></div><div class="info-item"><span class="label">Email:</span><span class="value">${booking.passenger_email || booking.user_email || 'N/A'}</span></div></div><div><div class="section-title">TRIP DETAILS</div><div class="info-item"><span class="label">From:</span><span class="value">${booking.origin || 'N/A'}</span></div><div class="info-item"><span class="label">To:</span><span class="value">${booking.destination || 'N/A'}</span></div><div class="info-item"><span class="label">Date:</span><span class="value">${booking.departure_time ? new Date(booking.departure_time).toLocaleDateString() : 'N/A'}</span></div><div class="info-item"><span class="label">Time:</span><span class="value">${booking.departure_time ? new Date(booking.departure_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'N/A'}</span></div><div class="info-item"><span class="label">Bus Plate:</span><span class="value">${booking.plate_number || 'N/A'}</span></div><div class="info-item"><span class="label">Company:</span><span class="value">${booking.company_name || 'Bus Service'}</span></div><div class="info-item"><span class="label">Seat Number:</span><span class="value" style="color:#f97316;font-size:16px">${booking.seat_number || 'N/A'}</span></div></div></div><div class="pricing"><div class="section-title">PRICING DETAILS</div><div class="info-item"><span class="label">Ticket Fare:</span><span class="value">${(booking.price || 0).toLocaleString()} RWF</span></div><div class="info-item"><span class="label">Service Fee:</span><span class="value">${(booking.service_fee || 500).toLocaleString()} RWF</span></div><div class="info-item total"><span class="label">TOTAL PAID:</span><span class="value">${((booking.price || 0) + (booking.service_fee || 500)).toLocaleString()} RWF</span></div></div><div class="qr-section"><div class="section-title">SCAN TO VERIFY</div><img src="${qrCodeUrl}" alt="QR Code" /></div></div><div class="footer"><strong>Terms & Conditions:</strong><ul><li>Please arrive 15 minutes before departure time</li><li>This ticket is non-refundable and non-transferable</li><li>Valid ID required for boarding</li><li>Present this ticket and ID at boarding gate</li></ul></div></div><script>setTimeout(() => window.print(), 500);</script></body></html>`;

        const w = window.open('', '_blank');
        if (!w) return alert('Please allow popups to download ticket. Enable popups for this site and try again.');
        w.document.write(html);
        w.document.close();
      } catch (err) {
        console.error('Download failed', err);
        alert('Download failed: ' + (err.message || 'Unknown'));
      }
    })();
  };

  const handleLogout = () => {
    signout();
  };

  const filteredTickets = tickets.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (t.boarding_stop_name || '').toLowerCase().includes(q) ||
      (t.dropoff_stop_name || '').toLowerCase().includes(q) ||
      (t.company_name || '').toLowerCase().includes(q) ||
      (t.route_name || '').toLowerCase().includes(q)
    );
  });

  const openBuy = (trip) => {
    // Keep for backward compatibility (not used for seat flow)
    setBuyingTicket(trip);
    setPayPhone('');
    setPayStatus(null);
  };

  const openSeatSelector = (ticket) => {
    // map ticket to SeatSelection expected trip shape
    const tripForSeats = {
      id: ticket.id || ticket.trip_id || ticket.tripId,  // Fix: use 'id' instead of 'tripId'
      tripId: ticket.id || ticket.trip_id || ticket.tripId,
      origin: ticket.boarding_stop_name || ticket.origin || ticket.origin_stop_name,
      destination: ticket.dropoff_stop_name || ticket.destination || ticket.destination_stop_name,
      departureTime: ticket.departure_time || ticket.departureTime || ticket.full_departure_time,
      totalSeats: ticket.totalSeats || ticket.availableSeats || ticket.total_seats || 50,
      total_seats: ticket.totalSeats || ticket.availableSeats || ticket.total_seats || 50,  // Add both formats
      price: ticket.price || 0,
      busNumber: ticket.bus_number || ticket.plate_number || ticket.busNumber,
      companyName: ticket.company_name || ticket.companyName || ''
    };
    setSeatTrip(tripForSeats);
  };

  const initiatePayment = async () => {
    if (!buyingTicket) return;
    if (!payPhone) return alert('Please enter phone number for MTN Mobile Money');

    try {
      setPayStatus('initiating');
      const payload = {
        amount: buyingTicket.price || 0,
        phone_number: payPhone,
          payment_type: 'ticket',
          payment_method: 'mtn_momo',
        user_id: user?.id,
        metadata: { trip_id: buyingTicket.id }
      };

      const res = await api.initiatePayment(payload);
      setPayStatus('pending');
      alert(res.message || 'Payment initiated. Check your phone.');
    } catch (err) {
      console.error('Payment error', err);
      setPayStatus('error');
      alert('Payment failed: ' + (err.message || 'Unknown'));
    }
  };

  const canManage = () => isAdmin?.() || isCompanyManager?.();

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    try {
      if (!canManage()) return alert('Not authorized');

      const dep = newTrip.departureTime ? new Date(newTrip.departureTime) : null;
      const arr = newTrip.arrivalTime ? new Date(newTrip.arrivalTime) : null;

      if (!dep || isNaN(dep.getTime())) return alert('Please provide a valid departure date/time');

      const payload = {
        origin: newTrip.origin,
        destination: newTrip.destination,
        departureTime: dep.toISOString(),
        arrivalTime: arr ? arr.toISOString() : undefined,
        price: Number(newTrip.price) || 0,
        totalSeats: Number(newTrip.totalSeats) || undefined,
        busNumber: newTrip.busNumber || undefined,
      };

      await api.createTrip(payload);
      setShowCreateTrip(false);
      setNewTrip({ origin: '', destination: '', departureTime: '', arrivalTime: '', price: '', totalSeats: '', busNumber: '' });
      // refresh trips
      const res = await api.getTrips();
      setTickets(res.data || []);
      alert('Trip created successfully');
    } catch (err) {
      console.error('Create trip error', err);
      alert('Error creating trip: ' + (err.message || 'Unknown'));
    }
  };

  const NavItem = ({ id, label, icon: Icon, active }) => (
    <button
      onClick={() => {
        setActiveTab(id);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
        active 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
          : 'text-slate-500 hover:bg-white hover:text-indigo-600 hover:shadow-sm'
      }`}
    >
          <span className={active ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'} style={{width:20, display:'inline-block'}}>{Icon()}</span>
      <span className="font-semibold text-sm">{label}</span>
      {active && <ChevronRight size={16} className="ml-auto opacity-50" />}
    </button>
  );

  const TicketCard = ({ ticket }) => {
    const isConfirmed = ['confirmed', 'paid', 'active', 'completed'].includes((ticket.status || '').toLowerCase());
    const statusColor = isConfirmed 
      ? 'bg-emerald-100 text-emerald-700 ring-emerald-600/20' 
      : 'bg-amber-100 text-amber-700 ring-amber-600/20';

    return (
      <div 
        onClick={() => setSelectedTicket(ticket)}
        className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 overflow-hidden flex flex-col h-full cursor-pointer"
      >
        <div className={`h-1.5 w-full bg-gradient-to-r ${isConfirmed ? 'from-indigo-500 to-purple-600' : 'from-amber-400 to-orange-500'}`}></div>

        <div className="p-5 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-5">
            <div>
              <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-0.5">Ticket No.</p>
              <p className="font-mono text-slate-700 font-bold text-lg">#{String(ticket.id).padStart(6, '0')}</p>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${statusColor}`}>
              {ticket.status}
            </span>
          </div>

          <div className="relative mb-6">
                    <div className="flex items-center justify-between relative z-10">
              <div className="flex flex-col items-start w-1/3">
                <span className="text-xl font-black text-slate-900 leading-none mb-1">
                  {ticket.boarding_stop_name?.split(' ')[0].substring(0, 3).toUpperCase()}
                </span>
                <span className="text-[10px] text-slate-500 font-medium truncate w-full">
                  {ticket.boarding_stop_name}
                </span>
              </div>
              
              <div className="flex flex-col items-center justify-center flex-1 px-2">
                <div className="text-slate-300 mb-1">
                   <Bus size={18} className={isConfirmed ? "text-indigo-400" : "text-amber-400"} />
                </div>
                    <div className="w-full h-px bg-slate-200 border-t border-dashed border-slate-300 relative">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-1.5">
                    <span className="text-[9px] text-slate-400 font-bold tracking-tight">
                      {ticket.departure_time ? new Date(ticket.departure_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end w-1/3">
                <span className="text-xl font-black text-slate-900 leading-none mb-1">
                  {ticket.dropoff_stop_name?.split(' ')[0].substring(0, 3).toUpperCase()}
                </span>
                <span className="text-[10px] text-slate-500 font-medium truncate w-full text-right">
                  {ticket.dropoff_stop_name}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-slate-50/80 rounded-xl p-3 mb-5 border border-slate-100">
            <div>
              <p className="flex items-center gap-1 text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-0.5">
                <Calendar size={10} /> Date
              </p>
              <p className="text-xs font-semibold text-slate-700">{ticket.departure_time ? new Date(ticket.departure_time).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div className="text-right">
              <p className="flex items-center justify-end gap-1 text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-0.5">
                <MapPin size={10} /> Seat
              </p>
              <p className="text-xs font-semibold text-slate-700">{ticket.seat_number}</p>
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between gap-3 pt-4 border-t border-dashed border-slate-200 relative">
            <div className="absolute -left-7 -top-[1px] w-4 h-4 bg-[#F3F4F6] rounded-full"></div>
            <div className="absolute -right-7 -top-[1px] w-4 h-4 bg-[#F3F4F6] rounded-full"></div>

            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-medium">Price</span>
              <span className="text-sm font-bold text-indigo-600">{Number(ticket.price || 0).toLocaleString()} RWF</span>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => handleDownload(e, ticket.id)}
                className="flex items-center gap-1.5 py-2 px-4 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/10 active:scale-95"
              >
                <Download size={14} /> Ticket
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); openSeatSelector(ticket); }}
                className="flex items-center gap-1.5 py-2 px-4 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors border border-indigo-100"
              >
                Buy
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans text-slate-800 overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideRight { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
        .animate-slide-right { animation: slideRight 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
      
      {/* --- Sidebar (Desktop) --- */}
      <aside className="hidden lg:flex w-80 flex-col bg-[#F3F4F6] border-r border-slate-200/50 p-6 z-50">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-600/20">
            <Bus className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-none">Rwanda ICT Solution</h1>
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">ICT Solutions · Bus Booking</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Main Menu</p>
          <NavItem id="tickets" label="My Tickets" icon={Ticket} active={activeTab === 'tickets'} />
          <NavItem id="payments" label="Payment History" icon={CreditCard} active={activeTab === 'payments'} />
          
          <div className="pt-6 pb-2">
             <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Account</p>
             <NavItem id="profile" label="Profile Settings" icon={User} active={activeTab === 'profile'} />
             <NavItem id="support" label="Help & Support" icon={HelpCircle} active={activeTab === 'support'} />
          </div>
        </nav>

        {/* User Info Card (Sidebar Bottom) */}
        <div className="mt-auto pt-6">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 transition-transform hover:-translate-y-1 duration-300">
               <div className="flex items-center gap-3 mb-3">
                 <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center">
                   <User size={20} className="text-slate-400" />
                 </div>
                 <div className="flex-1 overflow-hidden">
                   <p className="text-sm font-bold text-slate-900 truncate">{user?.name || user?.username || 'Customer'}</p>
                   <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                 </div>
                 <button onClick={handleLogout} className="text-white bg-indigo-600 px-3 py-2 rounded-lg font-bold shadow hover:bg-indigo-700 transition">Logout</button>
               </div>

               <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">My Tickets</p>
                 <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-hide">
                  {payments && payments.length > 0 ? (
                    payments.slice(0,6).map(p => (
                      <div key={p.id} className="flex items-center justify-between bg-slate-50 p-2 rounded">
                        <div>
                          <div className="text-xs font-medium text-slate-700">{p.description || p.metadata?.trip_id || p.transactionRef}</div>
                          <div className="text-[10px] text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={async () => {
                              try {
                                // Try to fetch a booking linked to this payment
                                let booking = null;
                                // common metadata keys
                                const bookingId = p.metadata?.booking_id || p.metadata?.bookingId || p.metadata?.trip_id || null;
                                if (bookingId) {
                                  const res = await api.getBooking(bookingId).catch(() => null);
                                  booking = res && res.data ? res.data : null;
                                }

                                if (!booking) {
                                  // fallback: try fetch by payment id or transactionRef
                                  const all = await api.getBookings().catch(() => ({ data: [] }));
                                  const list = all.data || [];
                                  booking = list.find(b => String(b.payment_id) === String(p.id) || String(b.transactionRef) === String(p.transactionRef) || (b.payment && String(b.payment.id) === String(p.id)));
                                }

                                if (booking) {
                                  setSelectedTicket(booking);
                                  setSidebarOpen(false);
                                } else {
                                  alert('Unable to locate ticket for this payment.');
                                }
                              } catch (err) {
                                console.error('View ticket error', err);
                                alert('Failed to view ticket');
                              }
                            }}
                            className="text-xs text-indigo-600"
                          >
                            View
                          </button>
                          <button onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                let booking = null;
                                const bookingId = p.metadata?.booking_id || p.metadata?.bookingId || p.metadata?.trip_id || null;
                                if (bookingId) {
                                  const res = await api.getBooking(bookingId).catch(() => null);
                                  booking = res && res.data ? res.data : null;
                                }
                                if (!booking) {
                                  const all = await api.getBookings().catch(() => ({ data: [] }));
                                  const list = all.data || [];
                                  booking = list.find(b => String(b.payment_id) === String(p.id) || String(b.transactionRef) === String(p.transactionRef) || (b.payment && String(b.payment.id) === String(p.id)));
                                }
                                if (booking) {
                                  handleDownload(e, booking);
                                } else {
                                  alert('Unable to locate ticket for download.');
                                }
                              } catch (err) {
                                console.error('Download lookup failed', err);
                                alert('Download failed');
                              }
                            }} className="text-xs text-slate-600">Download</button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-[12px] text-slate-400">No tickets yet</div>
                  )}
                 </div>
               </div>
             </div>
        </div>
      </aside>

      {/* Mobile overlay removed to match desktop mockup */}

      {/* --- Main Content Area --- */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-white lg:rounded-l-[3rem] shadow-2xl shadow-slate-200/50">
        
        {/* Top Header */}
        <header className="flex items-center justify-between px-6 py-5 lg:px-10 lg:py-8 bg-white/80 backdrop-blur-xl sticky top-0 z-30">
           <div className="flex items-center gap-4">
             <div>
               <p className="text-sm text-slate-500">Welcome, <span className="font-bold text-slate-900">{user?.name || user?.username || 'customer'}</span></p>
               <h2 className="text-3xl font-bold text-slate-900 mt-1">
                {activeTab === 'tickets' ? 'My Tickets' : activeTab === 'payments' ? 'Payment History' : 'Settings'}
               </h2>
               <p className="text-slate-400 text-sm hidden sm:block">Manage your travel details securely.</p>
             </div>
           </div>

          <div className="flex items-center gap-3">
             <div className="hidden sm:flex items-center gap-2 w-full">
               <div className="flex-1 relative">
                 <label className="text-xs text-slate-500 font-semibold mb-1 block">📍 From</label>
                 <input value={searchOrigin} onChange={(e) => onOriginChange(e.target.value)} type="text" placeholder="Origin (e.g., Kigali)" className="w-full bg-white border-2 border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none" />
                 {originSuggestions.length > 0 && (
                   <div className="absolute left-0 right-0 mt-1 bg-white rounded-lg shadow-lg z-40 p-2 border border-slate-200">
                     <ul className="flex flex-col gap-1">
                       {originSuggestions.map((o) => (
                         <li key={o} onClick={() => pickOrigin(o)} className="px-3 py-2 rounded hover:bg-indigo-50 cursor-pointer text-sm font-medium">{o}</li>
                       ))}
                     </ul>
                   </div>
                 )}
               </div>

               <div className="flex-1 relative">
                 <label className="text-xs text-slate-500 font-semibold mb-1 block">📍 To</label>
                 <input value={searchDestination} onChange={(e) => onDestinationChange(e.target.value)} type="text" placeholder="Destination (e.g., Rubavu)" className="w-full bg-white border-2 border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none" />
                 {destinationSuggestions.length > 0 && (
                   <div className="absolute left-0 right-0 mt-1 bg-white rounded-lg shadow-lg z-40 p-2 border border-slate-200">
                     <ul className="flex flex-col gap-1">
                       {destinationSuggestions.map((d) => (
                         <li key={d} onClick={() => pickDestination(d)} className="px-3 py-2 rounded hover:bg-indigo-50 cursor-pointer text-sm font-medium">{d}</li>
                       ))}
                     </ul>
                   </div>
                 )}
               </div>

               <div className="flex-1 relative">
                 <label className="text-xs text-slate-500 font-semibold mb-1 block">📅 Date</label>
                 <input value={searchDate} onChange={(e) => setSearchDate(e.target.value)} type="date" min={new Date().toISOString().split('T')[0]} className="w-full bg-white border-2 border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none" />
               </div>

               <div className="flex-1 relative">
                 <label className="text-xs text-slate-500 font-semibold mb-1 block">🕐 Time</label>
                 <select value={searchTimeOfDay} onChange={(e) => setSearchTimeOfDay(e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none">
                   <option value="all">All Times</option>
                   <option value="morning">🌅 Morning (5AM-12PM)</option>
                   <option value="afternoon">☀️ Afternoon (12PM-5PM)</option>
                   <option value="evening">🌆 Evening (5PM-9PM)</option>
                   <option value="night">🌙 Night (9PM-5AM)</option>
                 </select>
               </div>

               <div className="flex-shrink-0 mt-5">
                 <button onClick={handleSearch} className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95">🔍 Search Trips</button>
               </div>
             </div>
             <button className="p-2.5 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50 transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
             </button>
             <button onClick={() => setSidebarOpen(true)} className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-semibold hidden sm:inline">My Tickets</button>
             {activeTab === 'tickets' && canManage() && (
               <button onClick={() => setShowCreateTrip(true)} className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-bold rounded-full shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95">
                  New Trip <ArrowRight size={16} />
               </button>
             )}
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 lg:px-12 pb-20">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center h-96 animate-fade-in">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-100 border-t-indigo-600 mb-4"></div>
              <p className="text-sm font-medium text-slate-400">Syncing your data...</p>
            </div>
          ) : (
            <div className="animate-fade-in">
              {activeTab === 'tickets' ? (
                <div>
                  {/* Show Available Trips Section */}
                  {showAvailableTrips && availableTrips.length > 0 && (
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-slate-900">🚌 Available Trips</h3>
                          <p className="text-sm text-slate-500 mt-1">Found {availableTrips.length} trip{availableTrips.length !== 1 ? 's' : ''} • {searchDate ? new Date(searchDate).toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'}) : 'All dates'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2">
                            <option value="time">⏰ Sort by Time</option>
                            <option value="price">💰 Sort by Price</option>
                            <option value="seats">💺 Sort by Seats</option>
                          </select>
                          <button onClick={() => setShowAvailableTrips(false)} className="text-sm text-slate-500 hover:text-slate-700 px-3 py-2 border border-slate-200 rounded-lg">✕ Clear</button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {availableTrips.map((trip) => {
                          const depTime = trip.departure_time ? new Date(trip.departure_time) : null;
                          const hour = depTime ? depTime.getHours() : 0;
                          let timeIcon = '🕐';
                          let timeLabel = 'Time';
                          let gradientClass = 'from-indigo-50 to-purple-50 border-indigo-200';
                          
                          if (hour >= 5 && hour < 12) { timeIcon = '🌅'; timeLabel = 'Morning'; gradientClass = 'from-amber-50 to-orange-50 border-orange-200'; }
                          else if (hour >= 12 && hour < 17) { timeIcon = '☀️'; timeLabel = 'Afternoon'; gradientClass = 'from-yellow-50 to-amber-50 border-yellow-200'; }
                          else if (hour >= 17 && hour < 21) { timeIcon = '🌆'; timeLabel = 'Evening'; gradientClass = 'from-purple-50 to-pink-50 border-purple-200'; }
                          else { timeIcon = '🌙'; timeLabel = 'Night'; gradientClass = 'from-indigo-50 to-blue-50 border-indigo-200'; }
                          
                          return (
                          <div key={trip.id} className={`bg-gradient-to-br ${gradientClass} border-2 rounded-2xl p-5 hover:shadow-2xl hover:scale-[1.02] transition-all cursor-pointer relative overflow-hidden`} onClick={() => openSeatSelector(trip)}>
                            {/* Time badge */}
                            <div className="absolute top-0 right-0 bg-white/90 backdrop-blur px-3 py-1 rounded-bl-xl border-l border-b border-slate-200">
                              <span className="text-xs font-bold text-slate-700">{timeIcon} {timeLabel}</span>
                            </div>
                            
                            <div className="flex justify-between items-start mb-4 pt-6">
                              <div>
                                <p className="text-xs text-indigo-600 font-bold uppercase tracking-wide">Available Now</p>
                                <p className="text-sm text-slate-600 mt-1 font-medium">{trip.company_name || 'Bus Service'}</p>
                                <p className="text-xs text-slate-500 mt-1">Bus: {trip.bus_number || 'N/A'}</p>
                              </div>
                              <span className="bg-green-500 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                                💺 {trip.availableSeats || trip.total_seats || 0}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between mb-4 bg-white/60 backdrop-blur rounded-xl p-3">
                              <div className="flex-1">
                                <p className="text-xl font-black text-slate-900 truncate">{trip.boarding_stop_name?.substring(0, 15)}</p>
                                <p className="text-xs text-slate-500 truncate">{trip.boarding_stop_name}</p>
                              </div>
                              <div className="mx-3">
                                <Bus size={24} className="text-indigo-500" />
                              </div>
                              <div className="flex-1 text-right">
                                <p className="text-xl font-black text-slate-900 truncate">{trip.dropoff_stop_name?.substring(0, 15)}</p>
                                <p className="text-xs text-slate-500 truncate">{trip.dropoff_stop_name}</p>
                              </div>
                            </div>
                            
                            {/* Prominent time display */}
                            <div className="mb-3 bg-white/80 backdrop-blur rounded-xl p-3 border border-slate-200">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">📅 Date</p>
                                  <p className="text-sm font-bold text-slate-900 mt-0.5">{depTime ? depTime.toLocaleDateString('en-US', {month: 'short', day: 'numeric'}) : 'N/A'}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">🕐 Time</p>
                                  <p className="text-2xl font-black text-indigo-600 mt-0.5 tabular-nums">{depTime ? depTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12: true}) : 'N/A'}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between pt-3 border-t-2 border-dashed border-slate-300">
                              <div>
                                <p className="text-xs text-slate-500 font-medium">Price per seat</p>
                                <p className="text-2xl font-black text-green-600">{trip.price?.toLocaleString()} <span className="text-sm">RWF</span></p>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); openSeatSelector(trip); }} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-2.5 px-5 rounded-lg shadow-lg transition-all hover:scale-105 active:scale-95">
                                Select Seats →
                              </button>
                            </div>
                          </div>
                        )})}
                      </div>
                    </div>
                  )}
                  
                  {/* My Tickets Section */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4">My Bookings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {tickets.filter(t => t.seat_number).map((ticket) => (
                        <TicketCard key={ticket.id} ticket={ticket} />
                      ))}
                      {/* Add a "Book New" card placeholder */}
                      <div onClick={() => setShowAvailableTrips(true)} className="group border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-8 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all cursor-pointer">
                         <div className="w-14 h-14 rounded-full bg-slate-50 group-hover:bg-white group-hover:scale-110 transition-transform flex items-center justify-center mb-4 shadow-sm">
                            <ArrowRight size={24} className="text-slate-300 group-hover:text-indigo-600" />
                         </div>
                         <p className="font-bold text-slate-400 group-hover:text-indigo-600">Book Next Trip</p>
                         <p className="text-xs text-slate-400 mt-1">Search for available trips</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'payments' ? (
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm animate-slide-right">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Ref ID</th>
                          <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Method</th>
                          <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {payments.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-6 py-4 text-sm font-medium text-slate-700">
                              {new Date(p.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                {p.transactionRef}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">
                              <div className="flex items-center gap-2">
                                {p.paymentMethod.includes('Mobile') ? <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]"></div> : <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]"></div>}
                                {p.paymentMethod}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-slate-900">
                              {p.amount.toLocaleString()} RWF
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                p.status === 'successful' 
                                  ? 'bg-green-50 text-green-700 ring-1 ring-green-600/10' 
                                  : 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/10'
                              }`}>
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                   <Settings size={48} className="mb-4 opacity-20" />
                   <p>Settings & Profile content would go here.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {sidebarOpen && (
        <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-bold">My Tickets</h3>
            <div className="flex items-center gap-2">
              <button onClick={() => setSidebarOpen(false)} className="text-slate-500 hover:text-slate-800"><X /></button>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {loadingBookings ? (
              <div className="text-sm text-slate-500">Loading your tickets...</div>
            ) : bookings && bookings.length > 0 ? (
              bookings.map((b) => (
                <div key={b.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs text-slate-400">#{String(b.id).padStart(6,'0')}</div>
                      <div className="font-bold text-slate-800">{b.route_name || b.origin + ' → ' + b.destination}</div>
                      <div className="text-[12px] text-slate-500">{b.seat_number ? `Seat ${b.seat_number}` : ''}</div>
                    </div>
                    <div className="text-right text-xs text-slate-400">
                      {b.departure_time ? new Date(b.departure_time).toLocaleDateString() : ''}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button onClick={() => { setSelectedTicket(b); setSidebarOpen(false); }} className="px-3 py-1 text-sm bg-white border rounded">View</button>
                    <button onClick={(e) => { e.stopPropagation(); handleDownload(e, b); }} className="px-3 py-1 text-sm bg-indigo-600 text-white rounded">Download</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-400">No tickets found.</div>
            )}
          </div>
        </div>
      )}

      {/* Seat selection modal */}
      {seatTrip && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setSeatTrip(null)}></div>
          <div className="relative w-full max-w-5xl h-[90vh] bg-transparent overflow-hidden">
            <div className="bg-white rounded-2xl shadow-2xl h-full overflow-auto">
              <SeatSelection
                trip={seatTrip}
                onBack={() => setSeatTrip(null)}
                onBookingComplete={async () => {
                  // refresh bookings (do not automatically close modal; SeatSelection will call onBack)
                  try {
                    setLoadingBookings(true);
                    const res = await api.getBookings().catch(() => ({ data: [] }));
                    setBookings(res.data || []);
                  } catch (err) {
                    console.error('Failed to refresh bookings', err);
                  } finally {
                    setLoadingBookings(false);
                    // switch to tickets tab to show new booking
                    setActiveTab('tickets');
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
      {/* --- Ticket Modal (Same as before) --- */}
      {/* --- Buy Modal --- */}
      {buyingTicket && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setBuyingTicket(null)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-30">
            <h3 className="text-lg font-bold mb-3">Buy Ticket</h3>
            <p className="text-sm text-slate-600 mb-4">{buyingTicket.route_name || buyingTicket.routeName || `${buyingTicket.origin} → ${buyingTicket.destination}`}</p>
            <div className="mb-3">
              <label className="block text-xs text-slate-500 mb-1">Phone (MTN Mobile Money)</label>
              <input value={payPhone} onChange={(e) => setPayPhone(e.target.value)} placeholder="2507XXXXXXXX" className="w-full border px-3 py-2 rounded" />
            </div>
            <div className="flex items-center gap-3">
              <button onClick={initiatePayment} className="px-4 py-2 bg-indigo-600 text-white rounded">Pay {buyingTicket.price ? `${buyingTicket.price} RWF` : ''}</button>
              <button onClick={() => setBuyingTicket(null)} className="px-4 py-2 border rounded">Cancel</button>
            </div>
            {payStatus === 'initiating' && <p className="text-sm text-slate-500 mt-3">Initiating payment...</p>}
            {payStatus === 'pending' && <p className="text-sm text-amber-600 mt-3">Payment pending — check your phone.</p>}
            {payStatus === 'error' && <p className="text-sm text-red-600 mt-3">Payment failed. Try again.</p>}
          </div>
        </div>
      )}
      {/* --- Create Trip Modal (for managers) --- */}
      {showCreateTrip && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setShowCreateTrip(false)}></div>
          <form onSubmit={handleCreateTrip} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 z-30">
            <h3 className="text-lg font-bold mb-3">Create Trip</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500">Origin</label>
                <input value={newTrip.origin} onChange={(e) => setNewTrip({...newTrip, origin: e.target.value})} className="w-full border px-3 py-2 rounded mt-1" />
              </div>
              <div>
                <label className="text-xs text-slate-500">Destination</label>
                <input value={newTrip.destination} onChange={(e) => setNewTrip({...newTrip, destination: e.target.value})} className="w-full border px-3 py-2 rounded mt-1" />
              </div>
              <div>
                <label className="text-xs text-slate-500">Departure</label>
                <input type="datetime-local" value={newTrip.departureTime} onChange={(e) => setNewTrip({...newTrip, departureTime: e.target.value})} className="w-full border px-3 py-2 rounded mt-1" />
              </div>
              <div>
                <label className="text-xs text-slate-500">Arrival</label>
                <input type="datetime-local" value={newTrip.arrivalTime} onChange={(e) => setNewTrip({...newTrip, arrivalTime: e.target.value})} className="w-full border px-3 py-2 rounded mt-1" />
              </div>
              <div>
                <label className="text-xs text-slate-500">Price (RWF)</label>
                <input value={newTrip.price} onChange={(e) => setNewTrip({...newTrip, price: e.target.value})} className="w-full border px-3 py-2 rounded mt-1" />
              </div>
              <div>
                <label className="text-xs text-slate-500">Seats</label>
                <input value={newTrip.totalSeats} onChange={(e) => setNewTrip({...newTrip, totalSeats: e.target.value})} className="w-full border px-3 py-2 rounded mt-1" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-slate-500">Bus / Plate</label>
                <input value={newTrip.busNumber} onChange={(e) => setNewTrip({...newTrip, busNumber: e.target.value})} className="w-full border px-3 py-2 rounded mt-1" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-4">
              <button type="button" onClick={() => setShowCreateTrip(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Create Trip</button>
            </div>
          </form>
        </div>
      )}
      {selectedTicket && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedTicket(null)}
          ></div>

          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="bg-blue-600 text-white text-center py-4 px-4">
              <h1 className="text-xl font-bold">BUS COMPANY</h1>
              <p className="text-xs mt-1">E-Ticket - Rwanda Bus Service</p>
            </div>

            {/* Orange ticket number bar */}
            <div className="bg-orange-500 text-white text-center py-1 text-sm font-semibold">TICKET #{selectedTicket.booking_reference || selectedTicket.bookingId || selectedTicket.id || 'undefined'}</div>

            <div className="p-4 max-h-[70vh] overflow-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Passenger Information */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2 bg-slate-100 p-2">PASSENGER INFORMATION</h4>
                  <div className="text-sm">
                    <div className="flex justify-between py-1"><span className="text-slate-600">Full Name:</span><span className="font-semibold">{selectedTicket.passenger_name || 'N/A'}</span></div>
                    <div className="flex justify-between py-1"><span className="text-slate-600">Phone:</span><span className="font-semibold">{selectedTicket.passenger_phone || selectedTicket.user_phone || 'N/A'}</span></div>
                    <div className="flex justify-between py-1"><span className="text-slate-600">Email:</span><span className="font-semibold">{selectedTicket.passenger_email || selectedTicket.user_email || 'N/A'}</span></div>
                    <div className="flex justify-between py-1"><span className="text-slate-600">ID Number:</span><span className="font-semibold">{selectedTicket.id_number || '1234567890123456'}</span></div>
                  </div>
                </div>

                {/* Trip Details */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3 bg-slate-100 p-2">TRIP DETAILS</h4>
                  <div className="text-sm">
                    <div className="flex justify-between py-1"><span className="text-slate-600">From:</span><span className="font-semibold">{selectedTicket.origin || selectedTicket.from || 'N/A'}</span></div>
                    <div className="flex justify-between py-1"><span className="text-slate-600">To:</span><span className="font-semibold">{selectedTicket.destination || selectedTicket.to || 'N/A'}</span></div>
                    <div className="flex justify-between py-1"><span className="text-slate-600">Date:</span><span className="font-semibold">{selectedTicket.departure_time ? new Date(selectedTicket.departure_time).toLocaleDateString() : 'Invalid Date'}</span></div>
                    <div className="flex justify-between py-1"><span className="text-slate-600">Time:</span><span className="font-semibold">{selectedTicket.departure_time ? new Date(selectedTicket.departure_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'Invalid Date'}</span></div>
                    <div className="flex justify-between py-1"><span className="text-slate-600">Bus Plate:</span><span className="font-semibold">{selectedTicket.plate_number || 'N/A'}</span></div>
                    <div className="flex justify-between py-1"><span className="text-slate-600">Company:</span><span className="font-semibold">{selectedTicket.company_name || 'N/A'}</span></div>
                    <div className="flex justify-between py-1"><span className="text-slate-600">Seat Number:</span><span className="font-semibold text-orange-600">{selectedTicket.seat_number || 'undefined'}</span></div>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="mt-6 bg-slate-50 p-4 rounded">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">PRICING DETAILS</h4>
                <div className="flex justify-between py-1"><span className="text-slate-600">Ticket Fare:</span><span className="font-semibold">{(selectedTicket.price || selectedTicket.fare || 0).toLocaleString()} RWF</span></div>
                <div className="flex justify-between py-1"><span className="text-slate-600">Service Fee:</span><span className="font-semibold">{(selectedTicket.service_fee || 500).toLocaleString()} RWF</span></div>
                <div className="border-t mt-3 pt-3 flex justify-between items-center"><span className="font-bold">TOTAL PAID:</span><span className="text-orange-600 font-extrabold">{((selectedTicket.price || selectedTicket.fare || 0) + (selectedTicket.service_fee || 500)).toLocaleString()} RWF</span></div>
              </div>

              {/* Payment Details & QR */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3 bg-slate-100 p-2">PAYMENT DETAILS</h4>
                  <div className="text-sm">
                    <div className="flex justify-between py-1"><span className="text-slate-600">Payment Method:</span><span className="font-semibold">{selectedTicket.payment_method || 'MTN Mobile Money'}</span></div>
                    <div className="flex justify-between py-1"><span className="text-slate-600">Transaction ID:</span><span className="font-semibold">{selectedTicket.transaction_id || selectedTicket.txn || ('TXN' + (selectedTicket.id || '000') + (selectedTicket.booking_reference || 'undefined'))}</span></div>
                    <div className="flex justify-between py-1"><span className="text-slate-600">Payment Status:</span><span className="font-semibold text-green-600">{(selectedTicket.payment_status || selectedTicket.status || 'PENDING').toUpperCase()}</span></div>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">SCAN TO VERIFY</h4>
                  <div className="bg-white p-2 rounded shadow-sm">
                    <img alt="QR" src={selectedTicket.qr_code || selectedTicket.qr || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify(selectedTicket))}`} className="w-32 h-32 object-contain" />
                  </div>
                </div>
              </div>

              {/* Save button */}
              <div className="mt-4">
                <button onClick={(e) => handleDownload(e, selectedTicket.id)} className="w-full py-2 bg-slate-900 text-white text-sm font-semibold rounded">Save / Download Ticket</button>
              </div>

              {/* Footer terms */}
              <div className="mt-6 text-xs text-slate-500 border-t pt-3">
                <div className="mb-2">Terms & Conditions:</div>
                <ul className="list-disc pl-5">
                  <li>Please arrive 15 minutes before departure time</li>
                  <li>This ticket is non-refundable and non-transferable</li>
                  <li>Valid ID required for boarding</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
