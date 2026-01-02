import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// Local lightweight icon components (fallbacks) to avoid dev dependency on lucide-react
const Icon = ({ children, className = '' }) => (
  <span aria-hidden className={`inline-block ${className}`}>{children}</span>
);
const Ticket = (p) => <Icon {...p}>🎫</Icon>;
const CreditCard = (p) => <Icon {...p}>💳</Icon>;
const ArrowRight = (p) => <Icon {...p}>➡️</Icon>;
const MapPin = (p) => <Icon {...p}>📍</Icon>;
const Calendar = (p) => <Icon {...p}>📅</Icon>;
const Bus = (p) => <Icon {...p}>🚌</Icon>;
const QrCode = (p) => <Icon {...p}>▦</Icon>;
const Download = (p) => <Icon {...p}>⬇️</Icon>;
const X = (p) => <Icon {...p}>✕</Icon>;
const Search = (p) => <Icon {...p}>🔍</Icon>;
const LogOut = (p) => <Icon {...p}>⎋</Icon>;
const LayoutDashboard = (p) => <Icon {...p}>▥</Icon>;
const User = (p) => <Icon {...p}>👤</Icon>;
const Settings = (p) => <Icon {...p}>⚙️</Icon>;
const HelpCircle = (p) => <Icon {...p}>❓</Icon>;
const Menu = (p) => <Icon {...p}>☰</Icon>;
const Bell = (p) => <Icon {...p}>🔔</Icon>;
const ChevronRight = (p) => <Icon {...p}>›</Icon>;

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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOrigin, setSearchOrigin] = useState('');
  const [searchDestination, setSearchDestination] = useState('');
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [uniqueOrigins, setUniqueOrigins] = useState([]);
  const [uniqueDestinations, setUniqueDestinations] = useState([]);
  const [buyingTicket, setBuyingTicket] = useState(null);
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
  // removed mobile overlay to match provided mockup (desktop-first)

  useEffect(() => {
    let mounted = true;

    async function loadTrips() {
      try {
        setLoading(true);
        const tripsRes = await api.getTrips();
        const paymentsRes = await api.getPaymentHistory().catch(() => ({ data: [] }));

        if (!mounted) return;

        let trips = tripsRes.data || [];
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

        setTickets(trips);
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

  const handleSearch = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (searchOrigin) filters.origin = searchOrigin;
      if (searchDestination) filters.destination = searchDestination;

      const res = await api.getTrips(filters);
      setTickets(res.data || []);
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

  const handleDownload = (e, id) => {
    e.stopPropagation();
    alert(`Downloading PDF for Ticket #${id}...\n(This is a preview, so no actual file is generated)`);
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
    setBuyingTicket(trip);
    setPayPhone('');
    setPayStatus(null);
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
                      {new Date(ticket.departure_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
              <p className="text-xs font-semibold text-slate-700">{new Date(ticket.departure_time).toLocaleDateString()}</p>
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
              <span className="text-sm font-bold text-indigo-600">{(ticket.price).toLocaleString()} RWF</span>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => handleDownload(e, ticket.id)}
                className="flex items-center gap-1.5 py-2 px-4 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/10 active:scale-95"
              >
                <Download size={14} /> Ticket
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); openBuy(ticket); }}
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
            <h1 className="text-xl font-bold text-slate-900 leading-none">RideRwanda</h1>
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Travel Portal</span>
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
                           <button onClick={() => alert('View ticket not implemented in sidebar')} className="text-xs text-indigo-600">View</button>
                           <button onClick={() => alert('Download ticket placeholder')} className="text-xs text-slate-600">Download</button>
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
             <div className="hidden sm:flex items-center gap-3 w-full">
               <div className="flex-1 relative">
                 <input value={searchOrigin} onChange={(e) => onOriginChange(e.target.value)} type="text" placeholder="Origin (e.g., Kigali)" className="w-full bg-white border border-slate-200 rounded-full px-4 py-2 text-sm text-slate-700" />
                 {originSuggestions.length > 0 && (
                   <div className="absolute left-0 right-0 mt-1 bg-white rounded shadow z-40 p-2">
                     <ul className="flex flex-col gap-1">
                       {originSuggestions.map((o) => (
                         <li key={o} onClick={() => pickOrigin(o)} className="px-3 py-1 rounded hover:bg-slate-100 cursor-pointer text-sm">{o}</li>
                       ))}
                     </ul>
                   </div>
                 )}
               </div>

               <div className="flex-1 relative">
                 <input value={searchDestination} onChange={(e) => onDestinationChange(e.target.value)} type="text" placeholder="Destination (e.g., Rubavu)" className="w-full bg-white border border-slate-200 rounded-full px-4 py-2 text-sm text-slate-700" />
                 {destinationSuggestions.length > 0 && (
                   <div className="absolute left-0 right-0 mt-1 bg-white rounded shadow z-40 p-2">
                     <ul className="flex flex-col gap-1">
                       {destinationSuggestions.map((d) => (
                         <li key={d} onClick={() => pickDestination(d)} className="px-3 py-1 rounded hover:bg-slate-100 cursor-pointer text-sm">{d}</li>
                       ))}
                     </ul>
                   </div>
                 )}
               </div>

               <div className="flex-shrink-0">
                 <button onClick={handleSearch} className="px-4 py-2 bg-indigo-600 text-white rounded-full text-sm">Search</button>
               </div>
             </div>
             <button className="p-2.5 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50 transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
             </button>
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
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-4">
                   {tickets.map((ticket) => (
                     <TicketCard key={ticket.id} ticket={ticket} />
                   ))}
                   {/* Add a "Book New" card placeholder */}
                   <div className="group border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-8 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all cursor-pointer">
                      <div className="w-14 h-14 rounded-full bg-slate-50 group-hover:bg-white group-hover:scale-110 transition-transform flex items-center justify-center mb-4 shadow-sm">
                         <ArrowRight size={24} className="text-slate-300 group-hover:text-indigo-600" />
                      </div>
                      <p className="font-bold text-slate-400 group-hover:text-indigo-600">Book Next Trip</p>
                      <p className="text-xs text-slate-400 mt-1">Explore new destinations</p>
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
          
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-right">
            <div className="bg-[#1e1b4b] px-6 py-8 text-white text-center relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-400 to-transparent"></div>
               <div className="absolute top-0 right-0 w-full h-full opacity-10" style={{backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
               
               <h3 className="text-2xl font-bold relative z-10 tracking-tight">Boarding Pass</h3>
               <p className="text-indigo-200 text-xs font-medium uppercase tracking-widest relative z-10 mt-1">Bus Service Rwanda</p>
               
               <button 
                onClick={() => setSelectedTicket(null)}
                className="absolute top-4 right-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full p-1.5 transition-all"
               >
                 <X size={20} />
               </button>
            </div>

            <div className="px-6 pb-6 bg-white relative">
              <div className="flex justify-center -mt-10 mb-6 relative z-20">
                <div className="bg-white p-3 rounded-2xl shadow-xl shadow-slate-200/50">
                  <div className="w-40 h-40 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                    <QrCode size={80} />
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center border-b border-dashed border-slate-100 pb-3">
                   <div className="text-left">
                     <span className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-1">Passenger</span>
                     <span className="block font-bold text-slate-900">{selectedTicket.passenger_name}</span>
                   </div>
                   <div className="text-right">
                     <span className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-1">Bus Plate</span>
                     <span className="block font-bold text-slate-900">{selectedTicket.plate_number}</span>
                   </div>
                </div>
                
                <div className="flex justify-between items-center border-b border-dashed border-slate-100 pb-3">
                   <div className="text-left">
                     <span className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-1">Departure</span>
                     <span className="block font-bold text-slate-900">
                        {new Date(selectedTicket.departure_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                     </span>
                     <span className="block text-xs text-slate-500">{new Date(selectedTicket.departure_time).toLocaleDateString()}</span>
                   </div>
                   <div className="text-right">
                     <span className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-1">Seat</span>
                     <span className="block text-3xl font-black text-indigo-600">{selectedTicket.seat_number}</span>
                   </div>
                </div>
              </div>
              
              <button
                onClick={(e) => handleDownload(e, selectedTicket.id)}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl shadow-lg shadow-slate-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Download size={18} /> Save to Phone
              </button>
            </div>
            
            <div className="h-4 bg-slate-900 w-full relative" style={{background: 'radial-gradient(circle, transparent 50%, #1e1b4b 50%) -8px -8px / 16px 16px repeat-x'}}></div>
          </div>
        </div>
      )}
    </div>
  );
}
