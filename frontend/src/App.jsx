import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Auth from './pages/Auth';
import CompanyRegister from './pages/CompanyRegister';
import Trips from './pages/Trips';
import Bookings from './pages/Bookings';
import MyBookings from './pages/MyBookings';
import CustomerDashboard from './pages/CustomerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CompanyDashboard from './pages/CompanyDashboard_NEW';

function AppContent() {
  const { isAuthenticated, token, user } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const [searchFilters, setSearchFilters] = useState({});

  const handleNavigation = (page, filters = {}) => {
    setCurrentPage(page);
    if (filters) {
      setSearchFilters(filters);
    }
  };

  // Determine user role
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isCompanyManager = user?.role === 'company_manager' || user?.company_id;

  // If authenticated and on home page, redirect to appropriate dashboard
  if (isAuthenticated && currentPage === 'home') {
    if (isAdmin) {
      setCurrentPage('dashboard');
    } else if (isCompanyManager) {
      setCurrentPage('dashboard');
    } else {
      setCurrentPage('trips');
    }
  }

  return (
    <>
      <Navbar />
      {!isAuthenticated && currentPage === 'home' ? (
        <Home onNavigate={handleNavigation} />
      ) : !isAuthenticated && currentPage === 'company-register' ? (
        <CompanyRegister onNavigate={handleNavigation} />
      ) : !isAuthenticated ? (
        <Auth onNavigate={handleNavigation} />
      ) : isAdmin ? (
        // Admin Dashboard - full screen, no sidebar
        <AdminDashboard token={token} onNavigate={handleNavigation} />
      ) : isCompanyManager ? (
        // Company Manager Dashboard - full screen, no sidebar
        <CompanyDashboard token={token} onNavigate={handleNavigation} />
      ) : (
        // Customer - render dashboard directly (sidebar removed)
        <CustomerDashboard token={token} onNavigate={handleNavigation} />
      )}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
