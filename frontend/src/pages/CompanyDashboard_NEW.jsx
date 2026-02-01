import { useState, useEffect } from 'react';
// Removed external CSS to use global Tailwind styles

function CompanyDashboard({ token, onNavigate }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [company, setCompany] = useState(null);
  const [stats, setStats] = useState({});
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [trips, setTrips] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const API_URL = import.meta.env.VITE_API_BASE_URL || '/api';

  const stopLabel = (stop) => stop?.name ?? stop?.stop_name ?? '';

  useEffect(() => {
    fetchCompanyInfo();
    fetchAllData();
  }, []);

  useEffect(() => {
    if (activeTab !== 'overview') {
      fetchTabData();
    }
  }, [activeTab]);

  const fetchCompanyInfo = async () => {
    try {
      const response = await fetch(`${API_URL}/company/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setCompany(data.data);
      return data.data || null;
    } catch (error) {
      console.error('Error fetching company:', error);
      return null;
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Ensure company info is loaded before fetching company-scoped data
      if (!company) await fetchCompanyInfo();
      await Promise.all([
        fetchBuses(),
        fetchDrivers(),
        fetchRoutes(),
        fetchTrips(),
        fetchBookings(),
        fetchStops()
      ]);
      calculateStats();
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTabData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'buses': await fetchBuses(); break;
        case 'drivers': await fetchDrivers(); break;
        case 'routes': await fetchRoutes(); break;
        case 'trips': await fetchTrips(); break;
        case 'bookings': await fetchBookings(); break;
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch helpers
  const fetchData = async (url, setter) => {
    try {
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setter(data.data || []);
    } catch (e) { console.error(e) }
  }

  const fetchBuses = () => fetchData(`${API_URL}/company/buses/${company?.id || ''}`, setBuses);
  const fetchDrivers = () => fetchData(`${API_URL}/company/drivers/${company?.id || ''}`, setDrivers);
  const fetchRoutes = () => fetchData(`${API_URL}/company/routes/${company?.id || ''}`, setRoutes);
  const fetchStops = () => fetchData(`${API_URL}/stops`, setStops); // stops are global
  const fetchTrips = () => fetchData(`${API_URL}/company/trips/${company?.id || ''}`, setTrips);
  const fetchBookings = () => fetchData(`${API_URL}/company/bookings/${company?.id || ''}`, setBookings);

  const calculateStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const activeTrips = trips.filter(t => t.trip_date >= today);
    const todayBookings = bookings.filter(b => b.trip_date === today);
    const totalRevenue = bookings
      .filter(b => b.payment_status === 'completed')
      .reduce((sum, b) => sum + parseFloat(b.price || 0), 0);

    setStats({
      totalBuses: buses.length,
      activeBuses: buses.filter(b => b.is_active).length,
      totalDrivers: drivers.length,
      activeDrivers: drivers.filter(d => d.is_active).length,
      totalRoutes: routes.length,
      activeTrips: activeTrips.length,
      todayBookings: todayBookings.length,
      totalBookings: bookings.length,
      totalRevenue: totalRevenue
    });
  };

  // CRUD Operations
  const handleAdd = (type) => {
    setModalType(type);
    setEditingItem(null);
    setFormData({});
    setShowModal(true);
    setError('');
  };

  const handleEdit = (type, item) => {
    setModalType(type);
    setEditingItem(item);
    setFormData(item);
    setShowModal(true);
    setError('');
  };

  const handleDelete = async (type, id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const endpointMap = { bus: 'cars', driver: 'drivers', route: 'routes', trip: 'trips' };
      const res = await fetch(`${API_URL}/${endpointMap[type]}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setSuccess('Deleted successfully!');
        fetchTabData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to delete');
      }
    } catch (error) {
      setError('Error deleting: ' + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const endpointMap = { bus: 'cars', driver: 'drivers', route: 'routes', trip: 'trips' };
      const endpoint = endpointMap[modalType];
      const method = editingItem ? 'PUT' : 'POST';
      const url = editingItem
        ? `${API_URL}/${endpoint}/${editingItem.id}`
        : `${API_URL}/${endpoint}`;

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(editingItem ? 'Updated successfully!' : 'Created successfully!');
        setShowModal(false);
        fetchTabData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Operation failed');
      }
    } catch (error) {
      setError('Error: ' + error.message);
    }
  };

  // Renders
  const renderOverview = () => (
    <div className="space-y-8 fade-in">
      <div className="rounded-2xl bg-gradient-to-r from-brand-blue to-purple-700 p-8 text-white shadow-lg">
        <h1 className="heading-1 text-white mb-2">Dashboard Overview</h1>
        <p className="opacity-90">Monitor your company's performance and operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { icon: <img src="https://images.unsplash.com/photo-1542367597-9f6a0b5ca1b0?auto=format&fit=crop&w=64&q=80" alt="buses" className="h-8 w-8 object-cover" />, title: 'Total Buses', value: stats.totalBuses, sub: `${stats.activeBuses || 0} active`, color: 'blue' },
          { icon: <img src="https://img.icons8.com/color/48/user--v1.png" alt="drivers" className="h-8 w-8" />, title: 'Drivers', value: stats.totalDrivers, sub: `${stats.activeDrivers || 0} active`, color: 'emerald' },
          { icon: <img src="https://img.icons8.com/color/48/route.png" alt="routes" className="h-8 w-8" />, title: 'Routes', value: stats.totalRoutes, sub: 'Available routes', color: 'orange' },
          { icon: <img src="https://img.icons8.com/color/48/traffic-jam.png" alt="trips" className="h-8 w-8" />, title: 'Active Trips', value: stats.activeTrips, sub: 'Upcoming trips', color: 'purple' },
          { icon: <img src="https://img.icons8.com/color/48/ticket.png" alt="bookings" className="h-8 w-8" />, title: 'Bookings', value: stats.todayBookings, sub: `Total: ${stats.totalBookings || 0}`, color: 'amber' },
          { icon: <img src="https://img.icons8.com/color/48/money-bag.png" alt="revenue" className="h-8 w-8" />, title: 'Revenue', value: `${(stats.totalRevenue || 0).toLocaleString()} RWF`, sub: 'Total earnings', color: 'cyan' },
        ].map((stat, i) => (
          <div key={i} className="card card-hover p-6 flex items-center shadow-sm hover:shadow-md transition-all">
            <div className={`flex-shrink-0 h-14 w-14 rounded-full bg-${stat.color}-100 flex items-center justify-center text-2xl mr-4`}>
              {stat.icon}
            </div>
            <div>
              <h3 className="text-gray-500 font-medium text-sm uppercase tracking-wide">{stat.title}</h3>
              <p className="text-3xl font-bold text-slate-800">{stat.value || 0}</p>
              <p className="text-sm text-gray-400">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const TableHeader = ({ title, onAdd, count }) => (
    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
      <h2 className="heading-2">
        {title} <span className="text-slate-400 text-lg font-normal ml-2">({count})</span>
      </h2>
      {onAdd && (
        <button className="btn btn-primary" onClick={onAdd}>
          <span className="mr-2">+</span> Add New
        </button>
      )}
    </div>
  );

  const renderTable = (columns, data, type) => (
    <div className="table-container bg-white shadow-sm border border-slate-200 fade-in">
      <table className="table">
        <thead>
          <tr>
            {columns.map((col, i) => <th key={i}>{col}</th>)}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={columns.length + 1} className="py-8 text-center text-slate-500">No data found</td></tr>
          ) : (
            data.map((item) => (
              <tr key={item.id}>
                {columns.map((col, i) => {
                  // Custom cell rendering logic based on column header
                  let content = 'N/A';
                  if (col === 'Plate Number' && type === 'bus') {
                    content = (
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                          <img src="https://images.unsplash.com/photo-1542367597-9f6a0b5ca1b0?auto=format&fit=crop&w=80&q=80" alt="bus" className="h-8 w-8 object-cover rounded" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{item.plate_number}</div>
                          <div className="text-xs text-slate-500">{item.model}</div>
                        </div>
                      </div>
                    );
                  } else if (col === 'Name' && type === 'driver') {
                    content = (
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center mr-3 font-bold text-slate-600">
                          {item.name?.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-900">{item.name}</span>
                      </div>
                    );
                  } else if (col === 'Status') {
                    const isActive = item.is_active || item.payment_status === 'completed' || item.ticket_status === 'confirmed';
                    content = <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`}>{isActive ? 'Active' : 'Inactive'}</span>;
                    if (type === 'booking') content = <span className={`badge ${item.payment_status === 'completed' ? 'badge-success' : 'badge-warning'}`}>{item.payment_status}</span>
                  } else if (col === 'Price') {
                    content = <span className="font-mono text-slate-700 font-semibold">{parseFloat(item.price || item.base_price || 0).toLocaleString()} RWF</span>;
                  } else {
                    // Generic Accessors
                    if (col === 'Email') content = item.email;
                    if (col === 'Phone') content = item.phone;
                    if (col === 'Type') content = item.type;
                    if (col === 'Capacity') content = `${item.total_seats} Seats`;
                    if (col === 'License') content = item.license_number;
                    if (col === 'Route Name') content = item.route_name;
                    if (col === 'Origin') content = item.origin_stop_name || item.origin_name;
                    if (col === 'Destination') content = item.destination_stop_name || item.destination_name;
                    if (col === 'Distance') content = `${item.distance || 0} km`;
                    if (col === 'Date') content = new Date(item.trip_date).toLocaleDateString();
                    if (col === 'Time') content = item.departure_time;
                    if (col === 'Driver') content = item.driver_name;
                    if (col === 'Bus') content = item.plate_number;
                    if (col === 'Ref') content = item.booking_reference;
                    if (col === 'Passenger') content = item.passenger_name;
                    if (col === 'Seat') content = item.seat_number;
                  }
                  return <td key={i}>{typeof content === 'string' ? content : content || 'N/A'}</td>
                })}
                <td>
                  <div className="flex gap-2">
                    {type !== 'booking' && (
                      <>
                        <button className="text-brand-blue hover:text-blue-700 font-medium text-sm" onClick={() => handleEdit(type, item)}>Edit</button>
                        <button className="text-red-600 hover:text-red-700 font-medium text-sm" onClick={() => handleDelete(type, item.id)}>Delete</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderBuses = () => (
    <div className="space-y-6">
      <TableHeader title="Fleet Management" count={buses.length} onAdd={() => handleAdd('bus')} />
      {renderTable(['Plate Number', 'Type', 'Capacity', 'Status'], buses, 'bus')}
    </div>
  );

  const renderDrivers = () => (
    <div className="space-y-6">
      <TableHeader title="Driver Management" count={drivers.length} onAdd={() => handleAdd('driver')} />
      {renderTable(['Name', 'Email', 'Phone', 'License', 'Status'], drivers, 'driver')}
    </div>
  );

  const renderRoutes = () => (
    <div className="space-y-6">
      <TableHeader title="Route Management" count={routes.length} onAdd={() => handleAdd('route')} />
      {renderTable(['Route Name', 'Origin', 'Destination', 'Distance', 'Price'], routes, 'route')}
    </div>
  );

  const renderTrips = () => (
    <div className="space-y-6">
      <TableHeader title="Trip Management" count={trips.length} onAdd={() => handleAdd('trip')} />
      {renderTable(['Date', 'Time', 'Route Name', 'Bus', 'Driver', 'Price'], trips, 'trip')}
    </div>
  );

  const renderBookings = () => (
    <div className="space-y-6">
      <TableHeader title="Booking Management" count={bookings.length} onAdd={null} />
      {renderTable(['Ref', 'Passenger', 'Route Name', 'Date', 'Seat', 'Price', 'Status'], bookings, 'booking')}
    </div>
  );

  const renderModal = () => {
    if (!showModal) return null;
    const title = `${editingItem ? 'Edit' : 'Add'} ${modalType.charAt(0).toUpperCase() + modalType.slice(1)}`;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0">
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {modalType === 'bus' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Plate Number</label>
                      <input className="form-input" required value={formData.plate_number || ''} onChange={e => setFormData({ ...formData, plate_number: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Type</label>
                      <select className="form-select" value={formData.type || 'Bus'} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                        <option value="Bus">Bus</option>
                        <option value="Coaster">Coaster</option>
                        <option value="Minibus">Minibus</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Total Seats</label>
                      <input type="number" className="form-input" required value={formData.total_seats || ''} onChange={e => setFormData({ ...formData, total_seats: e.target.value })} />
                    </div>
                  </>
                )}

                {modalType === 'driver' && (
                  <>
                    <div className="form-group"><label className="form-label">Name</label><input className="form-input" required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                    <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-input" required value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
                    <div className="form-group"><label className="form-label">Phone</label><input className="form-input" required value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
                    <div className="form-group"><label className="form-label">License</label><input className="form-input" required value={formData.license_number || ''} onChange={e => setFormData({ ...formData, license_number: e.target.value })} /></div>
                    {!editingItem && <div className="form-group"><label className="form-label">Password</label><input type="password" className="form-input" required minLength="6" value={formData.password || ''} onChange={e => setFormData({ ...formData, password: e.target.value })} /></div>}
                  </>
                )}

                {modalType === 'route' && (
                  <>
                    <div className="form-group md:col-span-2"><label className="form-label">Route Name</label><input className="form-input" required value={formData.route_name || ''} onChange={e => setFormData({ ...formData, route_name: e.target.value })} placeholder="Kigali - Musanze" /></div>
                    <div className="form-group"><label className="form-label">Origin</label><input className="form-input" required value={formData.origin_stop_name || ''} onChange={e => setFormData({ ...formData, origin_stop_name: e.target.value })} list="stops" /></div>
                    <div className="form-group"><label className="form-label">Destination</label><input className="form-input" required value={formData.destination_stop_name || ''} onChange={e => setFormData({ ...formData, destination_stop_name: e.target.value })} list="stops" /></div>
                    <div className="form-group"><label className="form-label">Price (RWF)</label><input type="number" className="form-input" required value={formData.base_price || ''} onChange={e => setFormData({ ...formData, base_price: e.target.value })} /></div>
                    <div className="form-group"><label className="form-label">Distance (km)</label><input type="number" className="form-input" value={formData.distance || ''} onChange={e => setFormData({ ...formData, distance: e.target.value })} step="0.1" /></div>
                  </>
                )}

                {modalType === 'trip' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Route</label>
                      <select className="form-select" required value={formData.route_id || ''} onChange={e => setFormData({ ...formData, route_id: e.target.value })}>
                        <option value="">Select Route</option>
                        {routes.map(r => <option key={r.id} value={r.id}>{r.route_name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Bus</label>
                      <select className="form-select" required value={formData.car_id || ''} onChange={e => setFormData({ ...formData, car_id: e.target.value })}>
                        <option value="">Select Bus</option>
                        {buses.filter(b => b.is_active).map(b => <option key={b.id} value={b.id}>{b.plate_number}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Driver</label>
                      <select className="form-select" required value={formData.driver_id || ''} onChange={e => setFormData({ ...formData, driver_id: e.target.value })}>
                        <option value="">Select Driver</option>
                        {drivers.filter(d => d.is_active).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-input" required value={formData.trip_date || ''} onChange={e => setFormData({ ...formData, trip_date: e.target.value })} min={new Date().toISOString().split('T')[0]} /></div>
                    <div className="form-group"><label className="form-label">Time</label><input type="time" className="form-input" required value={formData.departure_time || ''} onChange={e => setFormData({ ...formData, departure_time: e.target.value })} /></div>
                    <div className="form-group"><label className="form-label">Price</label><input type="number" className="form-input" required value={formData.price || ''} onChange={e => setFormData({ ...formData, price: e.target.value })} /></div>
                  </>
                )}
              </div>

              <div className="form-group flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingItem ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
        <datalist id="stops">{stops.map(stopLabel).map(s => <option key={s} value={s} />)}</datalist>
      </div>
    );
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <span>{company?.company_name || 'Panel'}</span>
        </div>
        <nav className="sidebar-nav">
          {[
            { id: 'overview', icon: <img src="https://img.icons8.com/color/48/combo-chart.png" alt="overview" className="h-5 w-5" />, label: 'Overview' },
            { id: 'buses', icon: <img src="https://images.unsplash.com/photo-1542367597-9f6a0b5ca1b0?auto=format&fit=crop&w=64&q=80" alt="buses" className="h-5 w-5 object-cover" />, label: 'Fleet' },
            { id: 'drivers', icon: <img src="https://img.icons8.com/color/48/user--v1.png" alt="drivers" className="h-5 w-5" />, label: 'Drivers' },
            { id: 'routes', icon: <img src="https://img.icons8.com/color/48/route.png" alt="routes" className="h-5 w-5" />, label: 'Routes' },
            { id: 'trips', icon: <img src="https://img.icons8.com/color/48/traffic-jam.png" alt="trips" className="h-5 w-5" />, label: 'Trips' },
            { id: 'bookings', icon: <img src="https://img.icons8.com/color/48/ticket.png" alt="bookings" className="h-5 w-5" />, label: 'Bookings' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`nav-item w-full ${activeTab === item.id ? 'active' : ''}`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800">
          <button onClick={() => { localStorage.removeItem('token'); onNavigate('home'); }} className="nav-item w-full text-red-400 hover:bg-red-900/20 hover:text-red-300 flex items-center">
            <img src="https://img.icons8.com/color/48/exit.png" alt="logout" className="h-4 w-4 mr-3" /> Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="bg-white shadow-sm py-4 px-6 md:hidden flex justify-between items-center">
          <span className="font-bold text-gray-800">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
          <div className="text-sm text-gray-500">Menu handled by layout on mobile usually</div>
        </header>

        <div className="container-fluid h-full overflow-y-auto">
          {success && <div className="mb-4 p-4 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center shadow-sm">
            <span className="text-xl mr-2">✓</span> {success}
          </div>}

          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
              <span className="ml-3 text-slate-500 font-medium">Loading data...</span>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'buses' && renderBuses()}
              {activeTab === 'drivers' && renderDrivers()}
              {activeTab === 'routes' && renderRoutes()}
              {activeTab === 'trips' && renderTrips()}
              {activeTab === 'bookings' && renderBookings()}
            </>
          )}
        </div>
      </main>
      {renderModal()}
    </div>
  );
}

export default CompanyDashboard;
