import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, signout, isAuthenticated, isAdmin, isCompanyManager } = useAuth();

  return (
    <nav className="bg-white/70 backdrop-blur sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img src="https://images.unsplash.com/photo-1542367597-9f6a0b5ca1b0?auto=format&fit=crop&w=80&q=80" alt="Bus logo" className="h-10 w-10 object-cover rounded" />
            <div>
              <div className="text-lg font-semibold text-blue-700">Bus Booking</div>
              <div className="text-xs text-gray-500">Fast · Secure · Reliable</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-700">Welcome, <strong>{user?.username}</strong></div>
                {isAdmin && isAdmin() && (
                  <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">Admin</span>
                )}
                <button
                  onClick={signout}
                  className="ml-2 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition"
                >
                  <img src="https://img.icons8.com/color/48/exit.png" alt="logout" className="h-4 w-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => (window.location.hash = '#/auth')}
                  className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-semibold rounded-lg shadow-sm transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => (window.location.hash = '#/company-register')}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition"
                >
                  Register Company
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
