import { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useLanguage } from '../context/LanguageContext';

const Auth = ({ onNavigate }) => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  // Forgot password handler
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMsg('');
    try {
      const resp = await api.post('/auth/forgot-password', { email: forgotEmail });
      setForgotMsg(resp.message || 'If your email is registered, you will receive a password reset link.');
    } catch (err) {
      setForgotMsg(err.message || 'Failed to send reset email.');
    } finally {
      setForgotLoading(false);
    }
  };

  const { signin, signup } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
  const { t } = useLanguage();

    try {
      if (isSignIn) {
        const result = await signin(formData.email, formData.password);
        if (!result.success) setError(result.error || 'Sign in failed');
      } else {
        const result = await signup(
          formData.username,
          formData.email,
          formData.password,
          formData.role
        );
        if (result.success) {
          setSuccess('Account created successfully! Please sign in.');
          setIsSignIn(true);
          setFormData({ username: '', email: '', password: '', role: 'user' });
              <h1 className="text-2xl font-semibold text-gray-900">{isSignIn ? t('welcome_back') : t('create_account')}</h1>
              <p className="text-sm text-gray-500 mt-1">{isSignIn ? t('sign_in_to_continue') : t('create_account_to_start')}</p>
        }
      }
    } catch (err) {
      setError(err?.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl ring-1 ring-black/5 overflow-hidden">
        <div className="p-8 sm:p-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{isSignIn ? 'Welcome Back' : 'Create an Account'}</h1>
              <p className="text-sm text-gray-500 mt-1">{isSignIn ? 'Sign in to continue to your dashboard' : 'Create your account to start booking'}</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('home')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Home
            </button>
          </div>

              <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t('email')}</label>
            <div className="mb-4 rounded-md bg-red-50 p-3 text-red-700 text-sm">{error}</div>
          )}
          {success && (
            <div className="mb-4 rounded-md bg-green-50 p-3 text-green-700 text-sm">{success}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isSignIn && (
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                <input
                  id="username"
                  name="username"
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">{t('password')}</label>
                  onChange={handleChange}
                  required={!isSignIn}
                  placeholder="Your display name"
                  className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div>
                  placeholder={t('password_placeholder')}
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
                className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
              {isSignIn && (
                <div className="text-right mt-1">
                  <button
                    type="button"
                    className="text-xs text-indigo-600 hover:underline focus:outline-none"
                    onClick={() => { setShowForgot(true); setForgotEmail(formData.email); setForgotMsg(''); }}
                  >
                    {t('forgot_password')}
                  </button>
                </div>
              )}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter a strong password"
                  className="block w-full rounded-lg border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  <h2 className="text-lg font-semibold mb-2">{t('forgot_password')}</h2>
                  onClick={() => setShowPassword(!showPassword)}
                    <input
                      type="email"
                      className="block w-full rounded-lg border border-gray-200 px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t('email')}
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      required
                    />
                  <button
                    type="button"
                    className="text-xs text-indigo-600 hover:underline focus:outline-none"
                    onClick={() => { setShowForgot(true); setForgotEmail(formData.email); setForgotMsg(''); }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>
      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => setShowForgot(false)}>&times;</button>
            <h2 className="text-lg font-semibold mb-2">Forgot Password</h2>
            <form onSubmit={handleForgotPassword} className="space-y-3">
              <input
                type="email"
                className="block w-full rounded-lg border border-gray-200 px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white rounded-lg py-2 font-semibold hover:bg-indigo-700 transition"
                disabled={forgotLoading}
              >
                {forgotLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
            {forgotMsg && <div className="mt-2 text-sm text-gray-600">{forgotMsg}</div>}
          </div>
        </div>
      )}

            {!isSignIn && (
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">I am a</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">Customer (Book Tickets)</option>
                </select>
                <p className="text-xs text-gray-500 mt-2">For bus companies please use <button type="button" onClick={() => onNavigate && onNavigate('company-register')} className="text-indigo-600 hover:underline">Company Registration</button></p>
              </div>
            )}

            <div>
              <Button type="submit" disabled={loading} className="w-full justify-center">
                {loading && (
                  <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                )}
                <span>{isSignIn ? (loading ? 'Signing in...' : 'Sign In') : (loading ? 'Creating...' : 'Create Account')}</span>
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <span>{isSignIn ? "Don't have an account?" : 'Already have an account?'}</span>
            <button
              type="button"
              onClick={() => { setIsSignIn(!isSignIn); setError(''); setSuccess(''); }}
              className="ml-2 text-indigo-600 font-medium hover:underline"
            >
              {isSignIn ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
