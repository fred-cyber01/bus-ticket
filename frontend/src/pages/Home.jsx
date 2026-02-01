import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function Home({ onNavigate }) {
  const { user } = useAuth();
  const [searchData, setSearchData] = useState({
    origin: '',
    destination: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate('trips', searchData);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 font-sans" style={{fontFamily: 'Inter, Poppins, ui-sans-serif, system-ui'}}>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 opacity-90"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-20"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="text-white space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
                  <span className="block text-white">Book your next</span>
                  <span className="block bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-white">Bus trip in seconds</span>
                </h1>
                <div className="w-24 h-1 bg-yellow-300 rounded-full"></div>
              </div>

              <p className="text-lg sm:text-xl text-blue-100 leading-relaxed max-w-2xl">
                Instant seat reservations, secure payments, and real-time updates — all in one place. Fast, simple, and reliable travel across Rwanda.
              </p>

                <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => onNavigate && onNavigate('trips')}
                  aria-label="Book your trip"
                  className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-300 hover:to-orange-300 text-blue-900 font-bold py-3 px-7 rounded-2xl text-lg transition-all duration-300 transform hover:-translate-y-0.5 shadow-xl flex items-center justify-center gap-2"
                >
                  <img src="https://images.unsplash.com/photo-1542367597-9f6a0b5ca1b0?auto=format&fit=crop&w=64&q=80" alt="Bus" className="h-5 w-5 object-cover rounded" />
                  <span>Book Your Trip</span>
                <button
                onClick={() => onNavigate && onNavigate('trips')}
                className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-300 hover:to-orange-300 text-blue-900 font-bold py-3 px-7 rounded-2xl text-lg transition-all duration-300 transform hover:-translate-y-0.5 shadow-xl flex items-center justify-center gap-2"
              >
                <img src="https://images.unsplash.com/photo-1542367597-9f6a0b5ca1b0?auto=format&fit=crop&w=64&q=80" alt="Bus" className="h-5 w-5 object-cover rounded" />
                <span>Book Your Trip</span>
              </button>
                  <span>Contact Us</span>
                </button>
              </div>
            </div>

            {/* Hero Illustration */}
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-2xl border border-white/20">
                <div className="relative">
                  <div className="bg-white rounded-2xl p-5 md:p-6 shadow-lg">
                    <div className="flex items-center justify-center mb-4 md:mb-6">
                      <img src="https://images.unsplash.com/photo-1542367597-9f6a0b5ca1b0?auto=format&fit=crop&w=400&q=80" alt="Bus illustration" className="h-24 w-24 object-cover rounded-lg" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <img src="https://img.icons8.com/color/48/ticket.png" alt="Ticket" className="h-8 mx-auto mb-1" />
                        <div className="text-sm font-semibold text-blue-800">E-Tickets</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <img src="https://img.icons8.com/color/48/bank-card-back-side.png" alt="Card" className="h-8 mx-auto mb-1" />
                        <div className="text-sm font-semibold text-green-800">Secure Pay</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3">
                        <img src="https://img.icons8.com/color/48/smartphone.png" alt="Mobile" className="h-8 mx-auto mb-1" />
                        <div className="text-sm font-semibold text-purple-800">Mobile Friendly</div>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-3">
                        <img src="https://img.icons8.com/color/48/clock.png" alt="Support" className="h-8 mx-auto mb-1" />
                        <div className="text-sm font-semibold text-orange-800">24/7 Support</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="relative -mt-32 z-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-1">Find Your Journey</h2>
                <p className="text-gray-600">Search and book bus tickets in seconds</p>
              </div>

              <form onSubmit={handleSearch} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-600">From</label>
                    <input
                      type="text"
                      aria-label="Origin city"
                      placeholder="Origin city"
                      value={searchData.origin}
                      onChange={(e) => setSearchData({...searchData, origin: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-600">To</label>
                    <input
                      type="text"
                      aria-label="Destination city"
                      placeholder="Destination city"
                      value={searchData.destination}
                      onChange={(e) => setSearchData({...searchData, destination: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-600">Date</label>
                    <input
                      type="date"
                      aria-label="Travel date"
                      value={searchData.date}
                      onChange={(e) => setSearchData({...searchData, date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      aria-label="Search trips"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-xl transition transform hover:-translate-y-0.5 shadow-md flex items-center justify-center gap-2"
                    >
                      <img src="https://img.icons8.com/color/48/search--v1.png" alt="Search" className="h-5 w-5" />
                      <span>Search Trips</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Why Choose Us?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the best in bus booking with our comprehensive features designed for your comfort
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <img src="https://images.unsplash.com/photo-1542367597-9f6a0b5ca1b0?auto=format&fit=crop&w=64&q=80" alt="bus" className="h-10 mx-auto" />, title: 'Easy Booking', desc: 'Book your bus tickets in just a few clicks with our intuitive interface' },
              { icon: <img src="https://img.icons8.com/color/48/bank-card-back-side.png" alt="secure" className="h-10 mx-auto" />, title: 'Secure Payment', desc: 'Multiple payment options with bank-grade security and encryption' },
              { icon: <img src="https://img.icons8.com/color/48/smartphone.png" alt="mobile" className="h-10 mx-auto" />, title: 'Mobile Friendly', desc: 'Book tickets on the go with our fully responsive mobile design' },
              { icon: <img src="https://img.icons8.com/color/48/ticket.png" alt="tickets" className="h-10 mx-auto" />, title: 'E-Tickets', desc: 'Get instant e-tickets sent directly to your email and phone' },
              { icon: <img src="https://img.icons8.com/color/48/clock.png" alt="support" className="h-10 mx-auto" />, title: '24/7 Support', desc: 'Round-the-clock customer support for all your travel needs' },
              { icon: <img src="https://img.icons8.com/color/48/refresh--v1.png" alt="cancel" className="h-10 mx-auto" />, title: 'Easy Cancellation', desc: 'Hassle-free ticket cancellation and quick refund process' }
            ].map((feature, index) => (
              <div key={index} className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: '10,000+', label: 'Happy Customers', icon: <img src="https://img.icons8.com/color/48/groups.png" alt="customers" className="h-10 mx-auto" /> },
              { number: '50+', label: 'Routes Available', icon: <img src="https://img.icons8.com/color/48/route.png" alt="routes" className="h-10 mx-auto" /> },
              { number: '100+', label: 'Buses', icon: <img src="https://images.unsplash.com/photo-1542367597-9f6a0b5ca1b0?auto=format&fit=crop&w=64&q=80" alt="buses" className="h-10 mx-auto" /> },
              { number: '24/7', label: 'Customer Support', icon: <img src="https://img.icons8.com/color/48/chat--v1.png" alt="support" className="h-10 mx-auto" /> }
            ].map((stat, index) => (
              <div key={index} className="text-center text-white">
                <div className="text-4xl mb-2">{stat.icon}</div>
                <div className="text-4xl font-bold mb-2">{stat.number}</div>
                <div className="text-blue-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Start Your Journey?</h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Book your bus ticket now and travel with comfort, safety, and ease across Rwanda
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button
              onClick={() => onNavigate && onNavigate(user ? 'trips' : 'auth')}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-gray-900 font-bold py-4 px-8 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              🚀 {user ? 'Browse Trips' : 'Get Started'}
            </button>
            <button
              onClick={() => onNavigate && onNavigate('company-register')}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-3 justify-center"
            >
              <img src="https://images.unsplash.com/photo-1542367597-9f6a0b5ca1b0?auto=format&fit=crop&w=64&q=80" alt="bus" className="h-6 w-6 object-cover" />
              <span>Register Your Bus Company</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
