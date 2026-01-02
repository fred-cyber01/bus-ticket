import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, signout, isAuthenticated, isAdmin, isCompanyManager } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <h2>🚌 Bus Booking System</h2>
        </div>
        
        <div className="navbar-menu">
          {isAuthenticated ? (
            <>
              <span className="navbar-user">
                Welcome, <strong>{user?.username}</strong>
                {isAdmin() && <span className="admin-badge">Admin</span>}
              </span>
              {(isAdmin() || isCompanyManager()) && (
                <button onClick={signout} className="btn btn-primary font-bold flex items-center gap-2 px-5 py-2 text-base shadow-lg hover:bg-blue-700 transition">
                  <span role="img" aria-label="logout">🚪</span>
                  <span>Logout</span>
                </button>
              )}
            </>
          ) : (
            <span className="navbar-text">Please sign in to continue</span>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
