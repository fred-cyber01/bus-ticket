import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Navbar = () => {
  const { user, signout, isAuthenticated, isAdmin, isCompanyManager } = useAuth();
  const { t } = useLanguage();

  return (
    <nav className="bg-white/70 backdrop-blur sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img src="/assets/rwanda-ict-logo.png" alt="Rwanda Ict solution logo" className="h-16 w-16 object-contain" />
            <div>
              <div className="text-lg font-semibold text-blue-700">Rwanda Ict solution</div>
              <div className="text-xs text-gray-500">ICT Solutions · Bus Booking</div>
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
                  <img src="/assets/icon-generic.svg" alt="logout" className="h-4 w-4" />
                  {t('logout')}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <a
                  href="#/auth"
                  className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-semibold rounded-lg shadow-sm transition inline-block text-center"
                >
                  {t('sign_in')}
                </a>
                <a
                  href="#/company-register"
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition inline-block text-center"
                >
                  {t('register_company')}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
