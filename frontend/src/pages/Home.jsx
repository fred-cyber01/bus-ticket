import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

function Home({ onNavigate }) {
    const { user } = useAuth();
    const { lang, setLang, t } = useLanguage();
    const [searchData, setSearchData] = useState({ origin: '', destination: '', date: new Date().toISOString().split('T')[0] });

    const navigateTo = (route, data) => {
        try {
            if (onNavigate) return onNavigate(route, data);
        } catch (e) {
            // fall back to hash navigation
        }
        // ensure route maps to hash paths used by the app
        const routeMap = {
            trips: '#/trips',
            auth: '#/auth',
            'company-register': '#/company-register',
            contact: '#/contact',
            home: '#/'
        };
        const hash = routeMap[route] || `#/${route}`;
        window.location.hash = hash;
        // pass search data via history state if provided
        if (data) history.replaceState(data, '', hash);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (onNavigate) onNavigate('trips', searchData);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 font-sans" style={{ fontFamily: 'Inter, Poppins, ui-sans-serif, system-ui' }}>
            <section className="relative min-h-[88vh] flex items-center">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 opacity-90" />
                <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-20">
                        <div className="absolute right-8 top-6 z-20">
                            <label className="sr-only">Language</label>
                            <select value={lang} onChange={(e) => setLang(e.target.value)} className="rounded-md px-3 py-2 bg-white/90">
                                <option value="en">English</option>
                                <option value="rw">Kinyarwanda</option>
                                <option value="fr">Français</option>
                            </select>
                        </div>
                        <div className="text-white space-y-6">
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
                                <span className="block">{t('book_your_trip')}</span>
                            </h1>
                            <p className="text-lg sm:text-xl text-blue-100 max-w-2xl">{t('choose_desc')}</p>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button onClick={() => navigateTo('trips')} aria-label="Book your trip" className="w-full sm:w-auto bg-gradient-to-r from-yellow-400 to-orange-400 text-blue-900 font-bold py-3 px-4 sm:px-6 rounded-2xl text-base sm:text-lg shadow-xl flex items-center justify-center gap-3">
                                    <img src="/assets/rwanda-ict-logo.png" alt="Bus" className="h-6 w-6 sm:h-9 sm:w-9 object-contain" />
                                    <span>{t('book_your_trip')}</span>
                                </button>
                                <button onClick={() => navigateTo('contact')} aria-label="Contact us" className="w-full sm:w-auto bg-white/10 text-white font-semibold py-3 px-4 sm:px-6 rounded-2xl text-base sm:text-lg shadow-md flex items-center justify-center gap-3">
                                    <img src="/assets/icon-generic.svg" alt="Contact" className="h-5 w-5 object-contain" />
                                    <span>{t('contact_us')}</span>
                                </button>
                            </div>
                        </div>

                        <div className="relative flex items-center justify-center">
                            <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/20 w-full relative">
                                <img src="/assets/bus%20image.jpg" alt="Bus" className="w-full h-56 sm:h-72 md:h-96 object-cover block" />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent mix-blend-multiply" />
                                <div className="absolute top-4 left-4 sm:top-6 sm:left-6 bg-red-600 text-white rounded-full px-3 py-1.5 sm:px-4 sm:py-2 font-semibold shadow-lg text-xs sm:text-sm">{t('online_booking')}</div>
                            </div>
                        </div>
                    </div>

                    {/* Search card overlapping hero bottom */}
                    <div className="relative">
                        <div className="-mt-12 mx-auto max-w-4xl px-4 sm:px-0">
                            <form onSubmit={(e) => { handleSearch(e); navigateTo('trips', searchData); }} className="bg-white rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 items-end">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600">From</label>
                                    <input type="text" placeholder="Origin city" value={searchData.origin} onChange={(e) => setSearchData({ ...searchData, origin: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600">To</label>
                                    <input type="text" placeholder="Destination city" value={searchData.destination} onChange={(e) => setSearchData({ ...searchData, destination: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600">Date</label>
                                    <input type="date" value={searchData.date} onChange={(e) => setSearchData({ ...searchData, date: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                                <div className="md:col-span-1">
                                    <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2">
                                        <img src="/assets/icon-generic.svg" alt="Search" className="h-5 w-5" />
                                        <span>{t('search_trips')}</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-800">{t('why_choose_us')}</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto mt-3">{t('choose_desc')}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        {[{ icon: '/assets/icon-ticket.svg', title: 'E-Tickets' }, { icon: '/assets/icon-card.svg', title: 'Secure Pay' }, { icon: '/assets/icon-mobile.svg', title: 'Mobile Friendly' }, { icon: '/assets/icon-support.svg', title: '24/7 Support' }, { icon: '/assets/rwanda-ict-logo.png', title: 'Wide Fleet' }, { icon: '/assets/icon-generic.svg', title: 'Easy Cancellation' }].map((f, i) => (
                            <div key={i} className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl shadow hover:shadow-xl text-center">
                                <img src={f.icon} alt={f.title} className="h-12 mx-auto mb-4" />
                                <h3 className="font-semibold text-gray-800">{f.title}</h3>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
                    <section className="py-16 bg-gray-900">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold text-white">{t('ready_cta')}</h2>
                    <p className="text-gray-300 mt-3 mb-8">{t('choose_desc')}</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button onClick={() => navigateTo(user ? 'trips' : 'auth')} className="bg-yellow-400 text-gray-900 font-bold py-3 px-6 rounded-xl">{user ? t('browse_trips') : t('get_started')}</button>
                        <button onClick={() => navigateTo('company-register')} className="bg-purple-600 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-3">
                            <img src="/assets/rwanda-ict-logo.png" alt="bus" className="h-7 w-7 sm:h-9 sm:w-9" />
                            {t('register_bus_company')}
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Home;

