// API configuration
// In dev, prefer relative '/api' so Vite can proxy to the backend.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  
  return data;
};

// API Service
const api = {
  request: async (method, path, body) => {
    const url = path.startsWith('http')
      ? path
      : `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;

    const headers = {
      'Authorization': `Bearer ${getAuthToken()}`
    };

    const options = {
      method,
      headers
    };

    if (body !== undefined) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    return handleResponse(response);
  },

  get: (path) => api.request('GET', path),
  post: (path, body) => api.request('POST', path, body),
  put: (path, body) => api.request('PUT', path, body),
  delete: (path) => api.request('DELETE', path),

  // Payments
  initiatePayment: async (payload) => {
    return api.post('/payments/initiate', payload);
  },

  getPaymentStatus: async (transactionRef) => {
    return api.get(`/payments/status/${transactionRef}`);
  },

  getPaymentHistory: async () => {
    return api.get('/payments/history');
  },

  // Authentication
  signup: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  signin: async (credentials) => {
    // Check if it's an admin email and use appropriate endpoint
    const isAdmin = credentials.email && (
      credentials.email.includes('@ticketbus.rw') || 
      credentials.email.toLowerCase().includes('admin')
    );
    
    // Check if it's a company manager email (assuming company emails have certain patterns)
    const isCompanyManager = credentials.email && (
      credentials.email.toLowerCase().includes('company') ||
      credentials.email.toLowerCase().includes('manager')
    );
    
    let endpoint = '/auth/signin'; // default for customers
    if (isAdmin) {
      endpoint = '/auth/admin/signin';
    } else if (isCompanyManager) {
      endpoint = '/auth/company/signin';
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    return handleResponse(response);
  },

  // Trips
  getTrips: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.origin) queryParams.append('origin', filters.origin);
    if (filters.destination) queryParams.append('destination', filters.destination);
    if (filters.date) queryParams.append('date', filters.date);

    const url = `${API_BASE_URL}/trips${queryParams.toString() ? `?${queryParams}` : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });
    return handleResponse(response);
  },

  getAvailableTrips: async (date = null) => {
    const url = `${API_BASE_URL}/trips/available${date ? `?date=${encodeURIComponent(date)}` : ''}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });
    return handleResponse(response);
  },

  // Routes
  getRoutes: async () => {
    const response = await fetch(`${API_BASE_URL}/routes`);
    return handleResponse(response);
  },

  getTrip: async (tripId) => {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });
    return handleResponse(response);
  },

  createTrip: async (tripData) => {
    const response = await fetch(`${API_BASE_URL}/trips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(tripData),
    });
    return handleResponse(response);
  },

  cancelTrip: async (tripId) => {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });
    return handleResponse(response);
  },

  // Bookings
  createBooking: async (bookingData) => {
    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(bookingData),
    });
    return handleResponse(response);
  },

  getBookings: async () => {
    const response = await fetch(`${API_BASE_URL}/bookings`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });
    return handleResponse(response);
  },

  getBooking: async (bookingId) => {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });
    return handleResponse(response);
  },

  cancelBooking: async (bookingId) => {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });
    return handleResponse(response);
  },
};

export default api;
