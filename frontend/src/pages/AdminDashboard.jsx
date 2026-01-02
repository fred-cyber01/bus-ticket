import { useState, useEffect } from 'react';

function AdminDashboard({ token, onNavigate }) {
  const API_URL = import.meta.env.VITE_API_BASE_URL || '/api';

  const [activeTab, setActiveTab] = useState('dashboard');
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [payments, setPayments] = useState([]);
  const [plans, setPlans] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    proMembers: 0,
    newCustomers: 0,
    totalCompanies: 0,
    totalBuses: 0,
    totalTickets: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(false);

  // Modals
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showBusModal, setShowBusModal] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editingTicket, setEditingTicket] = useState(null);
  const [editingCompany, setEditingCompany] = useState(null);
  const [editingBus, setEditingBus] = useState(null);
  const [editingRoute, setEditingRoute] = useState(null);
  const [newAdmin, setNewAdmin] = useState({ email: '', password: '', role: 'admin' });
  const [userForm, setUserForm] = useState({ user_name: '', full_name: '', email: '', phone: '', password: '' });
  const [ticketForm, setTicketForm] = useState({ ticket_status: '', payment_status: '' });
  const [companyForm, setCompanyForm] = useState({ company_name: '', tin: '', phone: '', email: '', address: '' });
  const [busForm, setBusForm] = useState({ company_id: '', plate_number: '', name: '', capacity: '', type: '', park: '', is_active: true });
  const [routeForm, setRouteForm] = useState({ company_id: '', route_name: '', origin_stop_name: '', destination_stop_name: '', distance: '', description: '' });

  const stopLabel = (stop) => stop?.name ?? stop?.stop_name ?? '';

  useEffect(() => {
    fetchDashboardData();
  }, [activeTab]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch stats
      const statsRes = await fetch(`${API_URL}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data || stats);
      }

      // Fetch based on active tab
      if (activeTab === 'users') await fetchUsers();
      if (activeTab === 'companies') await fetchCompanies();
      if (activeTab === 'buses') await fetchBuses();
      if (activeTab === 'routes') await fetchRoutes();
      if (activeTab === 'tickets') await fetchTickets();
      if (activeTab === 'payments') await fetchPayments();
      if (activeTab === 'plans') await fetchPlans();
      if (activeTab === 'settings') await fetchAdmins();
      if (activeTab === 'earnings') await fetchEarnings();
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    const res = await fetch(`${API_URL}/admin/companies`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setCompanies(data.data || []);
    }
  };

  const fetchUsers = async () => {
    const res = await fetch(`${API_URL}/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setUsers(data.data || []);
    }
  };

  const fetchBuses = async () => {
    const res = await fetch(`${API_URL}/cars`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setBuses(data.data || []);
    }
  };

  const fetchRoutes = async () => {
    const res = await fetch(`${API_URL}/routes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setRoutes(data.data || []);
    }
  };

  const fetchStops = async () => {
    const res = await fetch(`${API_URL}/stops`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setStops(data.data || []);
    }
  };

  const ensureStopsLoaded = async () => {
    if (stops.length > 0) return;
    await fetchStops();
  };

  const openCreateRouteModal = async () => {
    await ensureCompaniesLoaded();
    await ensureStopsLoaded();
    setEditingRoute(null);
    setRouteForm({ company_id: '', route_name: '', origin_stop_name: '', destination_stop_name: '', distance: '', description: '' });
    setShowRouteModal(true);
  };

  const handleSaveRoute = async () => {
    try {
      if (!routeForm.company_id || !routeForm.route_name || !routeForm.origin_stop_name || !routeForm.destination_stop_name) {
        alert('Company, route name, origin stop and destination stop are required.');
        return;
      }

      const payload = {
        company_id: Number(routeForm.company_id),
        route_name: routeForm.route_name,
        origin_stop_name: routeForm.origin_stop_name,
        destination_stop_name: routeForm.destination_stop_name,
        distance: routeForm.distance ? Number(routeForm.distance) : undefined,
        description: routeForm.description || undefined
      };

      const res = await fetch(`${API_URL}/routes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Failed to create route');
        return;
      }

      setShowRouteModal(false);
      await fetchRoutes();
    } catch (error) {
      console.error('Error saving route:', error);
      alert('Error saving route');
    }
  };

  const fetchTickets = async () => {
    const res = await fetch(`${API_URL}/tickets`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setTickets(data.data || []);
    }
  };

  const fetchPayments = async () => {
    const res = await fetch(`${API_URL}/admin/payments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setPayments(data.data || []);
    }
  };

  const fetchPlans = async () => {
    // Admin should see both active and inactive plans
    const res = await fetch(`${API_URL}/subscriptions/plans/all`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setPlans(data.data || []);
    }
  };

  const fetchEarnings = async () => {
    const res = await fetch(`${API_URL}/payments/earnings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setEarnings(data.data);
    }
  };

  const fetchAdmins = async () => {
    const res = await fetch(`${API_URL}/admins`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setAdmins(data.data || []);
    }
  };

  const handleCreateAdmin = async () => {
    try {
      const res = await fetch(`${API_URL}/admins`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newAdmin)
      });
      const data = await res.json();
      if (data.success) {
        setShowAdminModal(false);
        setNewAdmin({ email: '', password: '', role: 'admin' });
        fetchAdmins();
        alert('Admin created successfully!');
      } else {
        alert(data.message || 'Failed to create admin');
      }
    } catch {
      alert('Failed to create admin');
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (!confirm('Are you sure you want to delete this admin?')) return;
    
    try {
      await fetch(`${API_URL}/admins/${adminId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchAdmins();
      alert('Admin deleted successfully!');
    } catch {
      alert('Failed to delete admin');
    }
  };

  const handleApproveCompany = async (companyId) => {
    try {
      await fetch(`${API_URL}/admin/companies/${companyId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchCompanies();
      alert('Company approved successfully!');
    } catch {
      alert('Failed to approve company');
    }
  };

  const handleSuspendCompany = async (companyId) => {
    if (!confirm('Are you sure you want to suspend this company?')) return;
    try {
      await fetch(`${API_URL}/admin/companies/${companyId}/suspend`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchCompanies();
      alert('Company suspended successfully!');
    } catch {
      alert('Failed to suspend company');
    }
  };

  const handleUnblockCompany = async (companyId) => {
    try {
      await fetch(`${API_URL}/admin/companies/${companyId}/unblock`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchCompanies();
      alert('Company unblocked successfully!');
    } catch {
      alert('Failed to unblock company');
    }
  };

  const handleRejectCompany = async (companyId) => {
    try {
      await fetch(`${API_URL}/admin/companies/${companyId}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchCompanies();
      alert('Company rejected successfully!');
    } catch {
      alert('Failed to reject company');
    }
  };

  const openCreateCompanyModal = () => {
    setEditingCompany(null);
    setCompanyForm({ company_name: '', tin: '', phone: '', email: '', address: '' });
    setShowCompanyModal(true);
  };

  const openEditCompanyModal = (company) => {
    setEditingCompany(company);
    setCompanyForm({
      company_name: company.company_name || company.name || '',
      tin: company.tin || '',
      phone: company.phone || '',
      email: company.email || '',
      address: company.address || ''
    });
    setShowCompanyModal(true);
  };

  const handleSaveCompany = async () => {
    try {
      const url = editingCompany
        ? `${API_URL}/admin/companies/${editingCompany.id}`
        : `${API_URL}/admin/companies`;

      const method = editingCompany ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company_name: companyForm.company_name,
          tin: companyForm.tin,
          phone: companyForm.phone,
          email: companyForm.email,
          address: companyForm.address
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to save company');
      }

      setShowCompanyModal(false);
      setEditingCompany(null);
      fetchCompanies();
      alert('Company saved successfully!');
    } catch (error) {
      alert(error.message || 'Failed to save company');
    }
  };

  const ensureCompaniesLoaded = async () => {
    if (companies.length > 0) return;
    await fetchCompanies();
  };

  const openCreateBusModal = async () => {
    await ensureCompaniesLoaded();
    setEditingBus(null);
    setBusForm({ company_id: '', plate_number: '', name: '', capacity: '', type: '', park: '', is_active: true });
    setShowBusModal(true);
  };

  const openEditBusModal = async (bus) => {
    await ensureCompaniesLoaded();
    setEditingBus(bus);
    setBusForm({
      company_id: String(bus.company_id ?? ''),
      plate_number: bus.plate_number || '',
      name: bus.name || '',
      capacity: String(bus.capacity ?? bus.total_seats ?? ''),
      type: bus.type ?? bus.bus_type ?? '',
      park: bus.park ?? '',
      is_active: !!bus.is_active
    });
    setShowBusModal(true);
  };

  const handleSaveBus = async () => {
    try {
      const url = editingBus
        ? `${API_URL}/cars/${editingBus.id}`
        : `${API_URL}/cars`;

      const method = editingBus ? 'PUT' : 'POST';

      const payload = {
        company_id: busForm.company_id ? Number(busForm.company_id) : undefined,
        plate_number: busForm.plate_number,
        name: busForm.name || undefined,
        capacity: busForm.capacity === '' ? undefined : Number(busForm.capacity),
        type: busForm.type || undefined,
        park: busForm.park || undefined,
        is_active: busForm.is_active
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to save bus');
      }

      setShowBusModal(false);
      setEditingBus(null);
      fetchBuses();
      alert('Bus saved successfully!');
    } catch (error) {
      alert(error.message || 'Failed to save bus');
    }
  };

  const handleDeleteBus = async (busId) => {
    if (!confirm('Delete this bus? This cannot be undone.')) return;

    try {
      const res = await fetch(`${API_URL}/cars/${busId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to delete bus');
      }

      fetchBuses();
      alert('Bus deleted successfully!');
    } catch (error) {
      alert(error.message || 'Failed to delete bus');
    }
  };

  const handleDeleteCompany = async (companyId) => {
    if (!confirm('Are you sure you want to delete this company? This action cannot be undone.')) return;
    try {
      await fetch(`${API_URL}/admin/companies/${companyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchCompanies();
      alert('Company deleted successfully!');
    } catch {
      alert('Failed to delete company');
    }
  };

  const handleBlockUser = async (userId) => {
    try {
      await fetch(`${API_URL}/admin/users/${userId}/block`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchUsers();
      alert('User blocked successfully!');
    } catch {
      alert('Failed to block user');
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      await fetch(`${API_URL}/admin/users/${userId}/unblock`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchUsers();
      alert('User unblocked successfully!');
    } catch {
      alert('Failed to unblock user');
    }
  };

  const openCreateUserModal = () => {
    setEditingUser(null);
    setUserForm({ user_name: '', full_name: '', email: '', phone: '', password: '' });
    setShowUserModal(true);
  };

  const openEditUserModal = (user) => {
    setEditingUser(user);
    setUserForm({
      user_name: user.user_name || '',
      full_name: user.full_name || '',
      email: user.email || '',
      phone: user.phone || '',
      password: ''
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    try {
      if (editingUser) {
        const res = await fetch(`${API_URL}/users/${editingUser.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_name: userForm.user_name,
            full_name: userForm.full_name,
            email: userForm.email,
            phone: userForm.phone
          })
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to update user');
        }
      } else {
        const res = await fetch(`${API_URL}/users`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_name: userForm.user_name,
            full_name: userForm.full_name,
            email: userForm.email,
            phone: userForm.phone,
            password: userForm.password
          })
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to create user');
        }
      }

      setShowUserModal(false);
      setEditingUser(null);
      fetchUsers();
      alert('User saved successfully!');
    } catch (error) {
      alert(error.message || 'Failed to save user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;

    try {
      const res = await fetch(`${API_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to delete user');
      }

      fetchUsers();
      alert('User deleted successfully!');
    } catch (error) {
      alert(error.message || 'Failed to delete user');
    }
  };

  const openEditTicketModal = (ticket) => {
    setEditingTicket(ticket);
    setTicketForm({
      ticket_status: ticket.ticket_status || '',
      payment_status: ticket.payment_status || ''
    });
    setShowTicketModal(true);
  };

  const handleSaveTicket = async () => {
    if (!editingTicket) return;

    try {
      const res = await fetch(`${API_URL}/tickets/${editingTicket.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: ticketForm.ticket_status,
          payment_status: ticketForm.payment_status
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update ticket');
      }

      setShowTicketModal(false);
      setEditingTicket(null);
      fetchTickets();
      alert('Ticket updated successfully!');
    } catch (error) {
      alert(error.message || 'Failed to update ticket');
    }
  };

  const handleCancelTicket = async (ticketId) => {
    if (!confirm('Cancel this ticket/booking?')) return;

    try {
      const res = await fetch(`${API_URL}/tickets/${ticketId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to cancel ticket');
      }

      fetchTickets();
      alert('Ticket cancelled successfully!');
    } catch (error) {
      alert(error.message || 'Failed to cancel ticket');
    }
  };

  const handleSavePlan = async (planData) => {
    try {
      const url = editingPlan
        ? `${API_URL}/subscriptions/plans/${editingPlan.id}`
        : `${API_URL}/subscriptions/plans`;
      
      const res = await fetch(url, {
        method: editingPlan ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(planData)
      });

      if (res.ok) {
        setShowPlanModal(false);
        setEditingPlan(null);
        fetchPlans();
        alert('Plan saved successfully!');
      }
    } catch {
      alert('Failed to save plan');
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!confirm('Deactivate this plan? Companies will no longer be able to subscribe to it.')) return;

    try {
      const res = await fetch(`${API_URL}/subscriptions/plans/${planId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to deactivate plan');
      }

      fetchPlans();
      alert('Plan deactivated successfully');
    } catch (error) {
      alert(error.message || 'Failed to deactivate plan');
    }
  };

  const handleActivatePlan = async (planId) => {
    if (!confirm('Activate this plan? Companies will be able to subscribe to it again.')) return;

    try {
      const res = await fetch(`${API_URL}/subscriptions/plans/${planId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: true })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to activate plan');
      }

      fetchPlans();
      alert('Plan activated successfully');
    } catch (error) {
      alert(error.message || 'Failed to activate plan');
    }
  };

  const renderDashboard = () => (
    <div className="overview-section">
      <div className="overview-header">
        <div className="overview-title">System Overview</div>
        <div className="overview-subtitle">Monitor your bus booking system's key metrics and performance</div>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-card-buses">
          <div className="stat-card-inner">
            <div className="stat-icon">
              <span className="icon-emoji">🚌</span>
            </div>
            <div className="stat-info">
              <h3>Total Buses</h3>
              <div className="stat-number">{stats.totalBuses || buses.length || 0}</div>
              <div className="stat-meta">Active fleet</div>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-drivers">
          <div className="stat-card-inner">
            <div className="stat-icon">
              <span className="icon-emoji">👨‍🚗</span>
            </div>
            <div className="stat-info">
              <h3>Companies</h3>
              <div className="stat-number">{stats.totalCompanies || companies.length || 0}</div>
              <div className="stat-meta">Active operators</div>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-routes">
          <div className="stat-card-inner">
            <div className="stat-icon">
              <span className="icon-emoji">🛣️</span>
            </div>
            <div className="stat-info">
              <h3>Routes</h3>
              <div className="stat-number">{routes.length || 0}</div>
              <div className="stat-meta">Available routes</div>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-trips">
          <div className="stat-card-inner">
            <div className="stat-icon">
              <span className="icon-emoji">🚐</span>
            </div>
            <div className="stat-info">
              <h3>Trips</h3>
              <div className="stat-number">{stats.totalTickets || tickets.length || 0}</div>
              <div className="stat-meta">Scheduled trips</div>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-bookings">
          <div className="stat-card-inner">
            <div className="stat-icon">
              <span className="icon-emoji">🎫</span>
            </div>
            <div className="stat-info">
              <h3>Bookings</h3>
              <div className="stat-number">{stats.totalTickets || tickets.length || 0}</div>
              <div className="stat-meta">Total bookings</div>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-revenue">
          <div className="stat-card-inner">
            <div className="stat-icon">
              <span className="icon-emoji">💰</span>
            </div>
            <div className="stat-info">
              <h3>Revenue</h3>
              <div className="stat-number">{(stats.totalRevenue || 0).toLocaleString()}</div>
              <div className="stat-meta">Total earnings (RWF)</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mt-8">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Recent Customers</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Joined Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.slice(0, 5).map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {(user.full_name || user.user_name || user.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">{user.full_name || user.user_name || user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.phone || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(user.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-2">User Management</h1>
        <p className="text-indigo-100">Manage all customers and their accounts</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">All Users ({users.length})</h2>
          <button 
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold text-sm hover:shadow-lg transition-all"
            onClick={openCreateUserModal}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add User
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">#{user.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {(user.full_name || user.user_name || user.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">{user.full_name || user.user_name || user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.phone || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.is_active ? 'Active' : 'Blocked'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button 
                        className="text-indigo-600 hover:text-indigo-900 font-semibold"
                        onClick={() => openEditUserModal(user)}
                      >
                        Edit
                      </button>
                      {user.is_active ? (
                        <button 
                          className="text-orange-600 hover:text-orange-900 font-semibold"
                          onClick={() => handleBlockUser(user.id)}
                        >
                          Block
                        </button>
                      ) : (
                        <button 
                          className="text-green-600 hover:text-green-900 font-semibold"
                          onClick={() => handleUnblockUser(user.id)}
                        >
                          Unblock
                        </button>
                      )}
                      <button 
                        className="text-red-600 hover:text-red-900 font-semibold"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowUserModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{editingUser ? 'Edit User' : 'Create User'}</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  value={userForm.user_name}
                  onChange={(e) => setUserForm({ ...userForm, user_name: e.target.value })}
                  placeholder="e.g. john_doe"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  value={userForm.full_name}
                  onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="e.g. john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  placeholder="e.g. +2507..."
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder="Create a password"
                  />
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button 
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  onClick={() => setShowUserModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                  onClick={handleSaveUser}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCompanies = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-2">Company Management</h1>
        <p className="text-indigo-100">Manage bus companies and their subscriptions</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">All Companies ({companies.length})</h2>
          <button 
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold text-sm hover:shadow-lg transition-all"
            onClick={openCreateCompanyModal}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Company
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Company Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">TIN</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Subscription</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {companies.map(company => (
                <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center text-white font-bold">
                        {(company.company_name || company.name).charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">{company.company_name || company.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{company.tin}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{company.phone}</div>
                    <div className="text-xs text-gray-500">{company.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${company.plan_name === 'Premium' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {company.plan_name || 'Free'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      company.is_active === 0 ? 'bg-red-100 text-red-800' : 
                      company.status === 'approved' ? 'bg-green-100 text-green-800' : 
                      company.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {company.is_active === 0 ? 'blocked' : (company.status || 'N/A')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${company.subscription_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {company.subscription_status || 'inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {company.status === 'pending' && (
                        <>
                          <button className="text-green-600 hover:text-green-900 font-semibold" onClick={() => handleApproveCompany(company.id)}>
                            Approve
                          </button>
                          <button className="text-red-600 hover:text-red-900 font-semibold" onClick={() => handleRejectCompany(company.id)}>
                            Reject
                          </button>
                        </>
                      )}
                      {company.is_active === 0 ? (
                        <button className="text-green-600 hover:text-green-900 font-semibold" onClick={() => handleUnblockCompany(company.id)}>
                          Unblock
                        </button>
                      ) : (
                        <button className="text-orange-600 hover:text-orange-900 font-semibold" onClick={() => handleSuspendCompany(company.id)}>
                          Suspend
                        </button>
                      )}
                      <button className="text-indigo-600 hover:text-indigo-900 font-semibold" onClick={() => openEditCompanyModal(company)}>
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-900 font-semibold" onClick={() => handleDeleteCompany(company.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCompanyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowCompanyModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{editingCompany ? 'Edit Company' : 'Create Company'}</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  value={companyForm.company_name}
                  onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
                  placeholder="e.g. Kigali Express"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">TIN</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  value={companyForm.tin}
                  onChange={(e) => setCompanyForm({ ...companyForm, tin: e.target.value })}
                  placeholder="9-digit TIN"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  value={companyForm.phone}
                  onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                  placeholder="e.g. +2507..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  value={companyForm.email}
                  onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                  placeholder="e.g. info@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  value={companyForm.address}
                  onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                  placeholder="e.g. Kigali, Rwanda"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button 
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  onClick={() => setShowCompanyModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                  onClick={handleSaveCompany}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderBuses = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-2">Bus Management</h1>
        <p className="text-indigo-100">View and manage all buses in the system</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">All Buses ({buses.length})</h2>
          <button 
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold text-sm hover:shadow-lg transition-all"
            onClick={openCreateBusModal}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Bus
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Bus ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Plate Number</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Capacity</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Added Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {buses.map(bus => (
                <tr key={bus.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">#{bus.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">{bus.plate_number}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{bus.company_name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{bus.total_seats} seats</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{bus.bus_type || 'Standard'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${bus.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {bus.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(bus.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-indigo-600 hover:text-indigo-900 font-semibold" onClick={() => openEditBusModal(bus)}>
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-900 font-semibold" onClick={() => handleDeleteBus(bus.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showBusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowBusModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{editingBus ? 'Edit Bus' : 'Create Bus'}</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Company</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  value={busForm.company_id}
                  onChange={(e) => setBusForm({ ...busForm, company_id: e.target.value })}
                >
                  <option value="">Select company</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name || c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Plate Number</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  value={busForm.plate_number}
                  onChange={(e) => setBusForm({ ...busForm, plate_number: e.target.value })}
                  placeholder="e.g. RAB 123 C"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  value={busForm.name}
                  onChange={(e) => setBusForm({ ...busForm, name: e.target.value })}
                  placeholder="e.g. Premium Coach"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Capacity</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  value={busForm.capacity}
                  onChange={(e) => setBusForm({ ...busForm, capacity: e.target.value })}
                  placeholder="e.g. 45"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  value={busForm.type}
                  onChange={(e) => setBusForm({ ...busForm, type: e.target.value })}
                  placeholder="e.g. Standard"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Park</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  value={busForm.park}
                  onChange={(e) => setBusForm({ ...busForm, park: e.target.value })}
                  placeholder="e.g. Nyabugogo"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  value={busForm.is_active ? '1' : '0'}
                  onChange={(e) => setBusForm({ ...busForm, is_active: e.target.value === '1' })}
                >
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button 
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  onClick={() => setShowBusModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                  onClick={handleSaveBus}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderRoutes = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-2">Route Management</h1>
        <p className="text-indigo-100">View and manage all routes</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">All Routes ({routes.length})</h2>
          <button 
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold text-sm hover:shadow-lg transition-all"
            onClick={openCreateRouteModal}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Route
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Route ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Route Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Stops</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {routes.map(route => (
                <tr key={route.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">#{route.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-green-400 to-teal-500 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">{route.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{route.company_name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{route.stop_count || 0} stops</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${route.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {route.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(route.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showRouteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowRouteModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{editingRoute ? 'Edit Route' : 'Add Route'}</h2>

            <datalist id="admin-stops-list">
              {stops
                .map(stopLabel)
                .filter(Boolean)
                .map((label) => (
                  <option key={label} value={label} />
                ))}
            </datalist>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Company *</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  value={routeForm.company_id}
                  onChange={(e) => setRouteForm({ ...routeForm, company_id: e.target.value })}
                >
                  <option value="">Select company</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.company_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Route Name *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  value={routeForm.route_name}
                  onChange={(e) => setRouteForm({ ...routeForm, route_name: e.target.value })}
                  placeholder="Kigali - Huye"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Origin Stop *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  list="admin-stops-list"
                  value={routeForm.origin_stop_name}
                  onChange={(e) => setRouteForm({ ...routeForm, origin_stop_name: e.target.value })}
                  placeholder="Type or choose a stop"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Destination Stop *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  list="admin-stops-list"
                  value={routeForm.destination_stop_name}
                  onChange={(e) => setRouteForm({ ...routeForm, destination_stop_name: e.target.value })}
                  placeholder="Type or choose a stop"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Distance (km)</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  value={routeForm.distance}
                  onChange={(e) => setRouteForm({ ...routeForm, distance: e.target.value })}
                  min="0"
                  step="0.1"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  value={routeForm.description}
                  onChange={(e) => setRouteForm({ ...routeForm, description: e.target.value })}
                  placeholder="Optional"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button 
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  onClick={() => setShowRouteModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                  onClick={handleSaveRoute}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderTickets = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-2">Ticket Management</h1>
        <p className="text-indigo-100">View and manage all ticket bookings and transactions</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">All Tickets ({tickets.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ticket ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Passenger</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Route</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Bus</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Seat</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Booked Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tickets.map(ticket => (
                <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">#{ticket.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{ticket.passenger_name || ticket.user_email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{ticket.route_name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{ticket.bus_plate || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{ticket.seat_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-700">{ticket.price} RWF</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      ['confirmed', 'booked', 'on_board'].includes(String(ticket.ticket_status).toLowerCase()) ? 'bg-green-100 text-green-800' :
                      ['pending', 'pending_payment'].includes(String(ticket.ticket_status).toLowerCase()) ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {ticket.ticket_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(ticket.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        className="text-indigo-600 hover:text-indigo-900 font-semibold"
                        onClick={() => openEditTicketModal(ticket)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900 font-semibold"
                        onClick={() => handleCancelTicket(ticket.id)}
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showTicketModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowTicketModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Ticket</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ticket Status</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  value={ticketForm.ticket_status}
                  onChange={(e) => setTicketForm({ ...ticketForm, ticket_status: e.target.value })}
                >
                  <option value="">Select status</option>
                  <option value="booked">Booked</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="on_board">On Board</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Status</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  value={ticketForm.payment_status}
                  onChange={(e) => setTicketForm({ ...ticketForm, payment_status: e.target.value })}
                >
                  <option value="">Select payment status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  onClick={() => setShowTicketModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                  onClick={handleSaveTicket}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderPayments = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-2">Payment Management</h1>
        <p className="text-indigo-100">View all payment transactions</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">All Payments ({payments.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Transaction ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Method</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map(payment => (
                <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{payment.transaction_ref}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{payment.user_email || payment.user_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-700 font-bold">{payment.amount} RWF</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{payment.payment_method || 'MTN MoMo'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{payment.payment_type || 'Ticket'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${payment.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : payment.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>{payment.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(payment.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPlans = () => (
    <div>
      <div className="admin-content-header">
        <h1>Subscription Plans</h1>
        <p>Manage subscription plans for bus companies</p>
      </div>

      <div className="section-header">
        <h2>All Plans ({plans.length})</h2>
        <button className="btn-primary" onClick={() => {
          setEditingPlan(null);
          setShowPlanModal(true);
        }}>
          + Add Plan
        </button>
      </div>

      <div className="stats-grid" style={{ marginTop: '24px' }}>
        {plans.map(plan => (
          <div key={plan.id} className="stat-card plan-card">
            <div className="stat-header">
              <div className="plan-card-title">
                <span className="plan-name">{plan.name}</span>
                <span className={`badge ${plan.is_active ? 'active' : 'suspended'}`}>
                  {plan.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="plan-price">{Number(plan.price || 0).toLocaleString()} RWF</div>

            <div className="plan-meta">
              <div className="plan-meta-row"><span>Bus limit</span><strong>{plan.bus_limit}</strong></div>
              <div className="plan-meta-row"><span>Validity</span><strong>{plan.duration_days} days</strong></div>
            </div>

            <div className="plan-description">
              {plan.description || '—'}
            </div>

            <div className="plan-actions">
              <button
                className="btn-primary"
                onClick={() => {
                  setEditingPlan(plan);
                  setShowPlanModal(true);
                }}
              >
                Edit
              </button>

              {plan.is_active ? (
                <button
                  className="btn-danger"
                  onClick={() => handleDeletePlan(plan.id)}
                >
                  Deactivate
                </button>
              ) : (
                <button
                  className="btn-secondary"
                  onClick={() => handleActivatePlan(plan.id)}
                >
                  Activate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showPlanModal && (
        <PlanModal
          plan={editingPlan}
          onSave={handleSavePlan}
          onClose={() => {
            setShowPlanModal(false);
            setEditingPlan(null);
          }} />
      )}
    </div>
  );

  const renderEarnings = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-2">System Earnings</h1>
        <p className="text-indigo-100">View system revenue and manage withdrawals</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-purple-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Total Earnings</span>
            <div className="bg-purple-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-800">{(earnings?.total || 0).toLocaleString()} RWF</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-green-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Available Balance</span>
            <div className="bg-green-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-800">{(earnings?.available || 0).toLocaleString()} RWF</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-orange-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Withdrawn</span>
            <div className="bg-orange-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-800">{(earnings?.withdrawn || 0).toLocaleString()} RWF</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Earning History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Transaction ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Source</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Method</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(earnings?.recentEarnings || []).slice(0, 10).map((row, index) => (
                <tr key={row.id ?? row.payment_id ?? index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{row.transaction_ref}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{row.payment_type || 'Ticket Sale'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{row.amount} RWF</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{row.payment_method}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(row.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Completed
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-2">Admin Settings</h1>
        <p className="text-indigo-100">Manage admin accounts and system settings</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Admin Management ({admins.length})</h2>
          <button 
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold text-sm hover:shadow-lg transition-all"
            onClick={() => setShowAdminModal(true)}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Admin
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created At</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {admins.map(admin => (
                <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">#{admin.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                        {admin.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">{admin.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${admin.role === 'super_admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {admin.role === 'super_admin' ? (
                        <><svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg> Super Admin</>
                      ) : (
                        'Admin'
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(admin.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {admin.role !== 'super_admin' && (
                      <button 
                        className="text-red-600 hover:text-red-900 font-semibold"
                        onClick={() => handleDeleteAdmin(admin.id)}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowAdminModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Add New Admin</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  placeholder="admin@ticketbus.rw"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  placeholder="Enter password"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  value={newAdmin.role}
                  onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button 
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  onClick={() => setShowAdminModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                  onClick={handleCreateAdmin}
                >
                  Create Admin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Modern Sidebar */}
      <div className="w-64 bg-white shadow-xl border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Admin Panel</h2>
              <p className="text-xs text-gray-500">Manage your system</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          <button
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('dashboard')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Dashboard</span>
          </button>

          <button
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('users')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>Users</span>
          </button>

          <button
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'companies'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('companies')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span>Companies</span>
          </button>

          <button
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'buses'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('buses')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
            <span>Buses</span>
          </button>

          <button
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'routes'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('routes')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span>Routes</span>
          </button>

          <button
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'tickets'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('tickets')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            <span>Tickets</span>
          </button>

          <button
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'payments'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('payments')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span>Payments</span>
          </button>

          <button
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'plans'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('plans')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>Plans</span>
          </button>

          <button
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'earnings'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('earnings')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Earnings</span>
          </button>

          <button
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('settings')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Settings</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button 
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg font-medium text-sm hover:bg-red-100 transition-colors"
            onClick={() => onNavigate('home')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Loading...</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && renderDashboard()}
              {activeTab === 'users' && renderUsers()}
              {activeTab === 'companies' && renderCompanies()}
              {activeTab === 'buses' && renderBuses()}
              {activeTab === 'routes' && renderRoutes()}
              {activeTab === 'tickets' && renderTickets()}
              {activeTab === 'payments' && renderPayments()}
              {activeTab === 'plans' && renderPlans()}
              {activeTab === 'earnings' && renderEarnings()}
              {activeTab === 'settings' && renderSettings()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PlanModal({ plan, onSave, onClose }) {
  const [formData, setFormData] = useState(plan || {
    name: '',
    description: '',
    price: 0,
    duration_days: 30,
    bus_limit: 3,
    is_active: true
  });

  // ...implement modal form fields and handlers here...
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4">{formData.name ? 'Edit Plan' : 'Add Plan'}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
            <input className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (RWF)</label>
              <input type="number" className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
              <input type="number" className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" value={formData.duration_days} onChange={e => setFormData({ ...formData, duration_days: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Bus Limit</label>
              <input type="number" className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" value={formData.bus_limit} onChange={e => setFormData({ ...formData, bus_limit: e.target.value })} />
            </div>
            <div className="flex-1 flex items-center gap-2 mt-6">
              <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} />
              <span className="text-sm text-gray-700">Active</span>
            </div>
          </div>
        </div>
        <div className="flex space-x-3 pt-6">
          <button className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors" onClick={onClose}>Cancel</button>
          <button className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all" onClick={() => onSave(formData)}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
