import { useState, useEffect } from 'react';

const CompanyRegister = ({ onNavigate, onSuccess }) => {
  const API_URL = import.meta.env.VITE_API_BASE_URL || '/api';

  const [step, setStep] = useState(1); // 1: Plan Selection, 2: Company Info, 3: Payment
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    company_name: '',
    tin: '',
    contact_info: '',
    manager_name: '',
    manager_email: '',
    manager_phone: '',
    password: '',
    confirmPassword: '',
    plan_id: null,
    payment_method: '',
    phone_number: ''
  });

  // Fetch subscription plans on component mount
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch(`${API_URL}/subscriptions/plans`);
        const data = await response.json();
        if (data.success) {
          setPlans(data.data);
        }
      } catch {
        setError('Failed to load subscription plans');
      }
    };
    fetchPlans();
  }, [API_URL]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setFormData({ ...formData, plan_id: plan.id });
  };

  const handleNextStep = () => {
    if (step === 1 && !selectedPlan) {
      setError('Please select a subscription plan');
      return;
    }
    
    if (step === 2) {
      // Validate company info
      if (!formData.company_name || !formData.tin || !formData.contact_info || 
          !formData.manager_name || !formData.manager_email || !formData.manager_phone ||
          !formData.password || !formData.confirmPassword) {
        setError('Please fill in all required fields');
        return;
      }

      if (formData.tin.length !== 9) {
        setError('TIN must be exactly 9 digits');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }

      // If free trial, skip payment and register directly
      if (selectedPlan.name === 'Free Trial' || selectedPlan.price === 0) {
        handleSubmit();
        return;
      }
    }

    setStep(step + 1);
    setError('');
  };

  const handlePreviousStep = () => {
    setStep(step - 1);
    setError('');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // Validate payment method for paid plans
      if (selectedPlan.price > 0 && !formData.payment_method) {
        setError('Please select a payment method');
        setLoading(false);
        return;
      }

      if ((formData.payment_method === 'mtn_momo' || formData.payment_method === 'airtel_money' || formData.payment_method === 'momopay') 
          && !formData.phone_number) {
        setError('Phone number is required for mobile money payment');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/company-auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_name: formData.company_name,
          tin: formData.tin,
          contact_info: formData.contact_info,
          manager_name: formData.manager_name,
          manager_email: formData.manager_email,
          manager_phone: formData.manager_phone,
          password: formData.password,
          plan_id: formData.plan_id,
          payment_method: formData.payment_method || null,
          phone_number: formData.phone_number || null
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        
        // Store token
        if (data.data.token) {
          localStorage.setItem('token', data.data.token);
          localStorage.setItem('user', JSON.stringify(data.data.manager));
          localStorage.setItem('company', JSON.stringify(data.data.company));
        }

        // Show success message for a moment
        setTimeout(() => {
          if (onSuccess) {
            onSuccess(data.data);
          } else {
            onNavigate && onNavigate('company-dashboard');
          }
        }, 3000);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="lg:flex">
          {/* Left column: Steps / summary */}
          <div className="hidden lg:block lg:w-1/3 bg-gradient-to-b from-blue-600 to-indigo-600 text-white p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold">Register Your Transport Company</h2>
              <p className="text-sm mt-2 text-blue-100">Create your company account, choose a plan and start selling tickets.</p>
            </div>

            <div className="space-y-3 mt-6">
              <div className={`rounded-lg p-3 ${step === 1 ? 'bg-white/10' : ''}`}>
                <div className="text-sm font-medium">1. Choose Plan</div>
                <div className="text-xs text-blue-100">Select the subscription that fits your fleet</div>
              </div>
              <div className={`rounded-lg p-3 ${step === 2 ? 'bg-white/10' : ''}`}>
                <div className="text-sm font-medium">2. Company Info</div>
                <div className="text-xs text-blue-100">Tell us about your company and manager</div>
              </div>
              {selectedPlan && selectedPlan.price > 0 && (
                <div className={`rounded-lg p-3 ${step === 3 ? 'bg-white/10' : ''}`}>
                  <div className="text-sm font-medium">3. Payment</div>
                  <div className="text-xs text-blue-100">Complete the payment to activate</div>
                </div>
              )}
            </div>

            {selectedPlan && (
              <div className="mt-8 p-4 bg-white/10 rounded-lg">
                <div className="text-xs text-blue-100">Selected Plan</div>
                <div className="mt-2 font-semibold text-lg">{selectedPlan.name}</div>
                <div className="text-sm mt-1">{selectedPlan.price === 0 ? 'FREE' : formatPrice(selectedPlan.price)}</div>
              </div>
            )}
          </div>

          {/* Right column: Form content */}
          <div className="w-full lg:w-2/3 p-8 sm:p-10">
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => step > 1 ? handlePreviousStep() : onNavigate && onNavigate('home')} className="text-sm text-gray-600 hover:text-gray-800">← Back</button>
              <div className="text-sm text-gray-500">Step {step}{selectedPlan && selectedPlan.price > 0 ? ' of 3' : ' of 2'}</div>
            </div>

            {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-red-700 text-sm">{error}</div>}
            {success && <div className="mb-4 rounded-md bg-green-50 p-3 text-green-700 text-sm">{success}</div>}

            {/* STEP 1: Plan Selection */}
            {step === 1 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Choose Your Subscription Plan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {plans.map((plan) => (
                    <div key={plan.id} onClick={() => handlePlanSelect(plan)} className={`border rounded-2xl p-5 hover:scale-[1.01] transition ${selectedPlan?.id === plan.id ? 'border-blue-600 shadow-lg' : 'border-gray-100'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{plan.name}</h4>
                          <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-gray-900">{plan.price === 0 ? 'FREE' : formatPrice(plan.price)}</div>
                          {plan.price > 0 && <div className="text-sm text-gray-500">/month</div>}
                        </div>
                      </div>

                      <ul className="mt-4 text-sm text-gray-600 space-y-1">
                        <li>✓ Up to {plan.bus_limit} buses</li>
                        <li>✓ {plan.duration_days} days validity</li>
                        <li>✓ {plan.name === 'Free Trial' ? 'Email support' : plan.name === 'Standard' ? 'Email + Phone support' : '24/7 Priority support'}</li>
                        {plan.name === 'Premium' && <li>✓ Custom branding</li>}
                      </ul>

                      <div className="mt-4">
                        <button type="button" className={`px-4 py-2 rounded-lg ${selectedPlan?.id === plan.id ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>{selectedPlan?.id === plan.id ? 'Selected' : 'Select Plan'}</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <button disabled={!selectedPlan} onClick={handleNextStep} className={`px-6 py-3 rounded-lg text-white font-semibold ${selectedPlan ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-300 cursor-not-allowed'}`}>Continue</button>
                </div>
              </div>
            )}

            {/* STEP 2: Company Information */}
            {step === 2 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Company & Manager Information</h3>
                <p className="text-sm text-gray-500 mb-4">Provide details so we can set up your account.</p>

                <form>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Company Name</label>
                      <input name="company_name" value={formData.company_name} onChange={handleChange} required placeholder="Rwanda Express Transport" className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">TIN (9 digits)</label>
                      <input name="tin" value={formData.tin} onChange={handleChange} maxLength={9} pattern="[0-9]{9}" required placeholder="123456789" className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Contact Information</label>
                    <textarea name="contact_info" value={formData.contact_info} onChange={handleChange} rows={3} required placeholder="Address, phone numbers, email, etc." className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Manager Full Name</label>
                        <input name="manager_name" value={formData.manager_name} onChange={handleChange} required placeholder="John Doe" className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-mid" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Manager Email</label>
                        <input name="manager_email" type="email" value={formData.manager_email} onChange={handleChange} required placeholder="john@company.com" className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-mid" />
                      </div>
                    </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Manager Phone</label>
                      <input name="manager_phone" value={formData.manager_phone} onChange={handleChange} required placeholder="+250788123456" className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone (for payments)</label>
                      <input name="phone_number" value={formData.phone_number} onChange={handleChange} placeholder="+250788123456" className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Password</label>
                      <input name="password" type="password" value={formData.password} onChange={handleChange} minLength={6} required placeholder="At least 6 characters" className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                      <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} minLength={6} required placeholder="Re-enter password" className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-between">
                    <button type="button" onClick={handlePreviousStep} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700">Back</button>
                    <button type="button" onClick={handleNextStep} className="px-6 py-3 rounded-lg text-white font-semibold bg-gradient-to-r from-blue-600 to-purple-600">{selectedPlan?.price === 0 ? 'Complete Registration' : 'Continue to Payment'}</button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 3: Payment (only for paid plans) */}
            {step === 3 && selectedPlan && selectedPlan.price > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Information</h3>
                <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between text-sm text-gray-700"><span>Plan</span><strong>{selectedPlan.name}</strong></div>
                  <div className="flex justify-between text-sm text-gray-700 mt-2"><span>Duration</span><strong>{selectedPlan.duration_days} days</strong></div>
                  <div className="flex justify-between text-sm text-gray-700 mt-2"><span>Bus Limit</span><strong>{selectedPlan.bus_limit} buses</strong></div>
                  <div className="flex justify-between text-sm text-gray-900 font-semibold mt-4"><span>Total Amount</span><strong>{formatPrice(selectedPlan.price)}</strong></div>
                </div>

                <form className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: 'mtn_momo', label: 'MTN Mobile Money', img: '/assets/icon-smartphone.svg' },
                      { key: 'airtel_money', label: 'Airtel Money', img: '/assets/icon-smartphone.svg' },
                      { key: 'momopay', label: 'MoMoPay', img: '/assets/icon-card.svg' },
                      { key: 'bank_transfer', label: 'Bank Transfer', img: '/assets/icon-bank.svg' }
                    ].map(({key,label,img}) => (
                      <button key={key} type="button" onClick={() => setFormData({ ...formData, payment_method: key })} className={`text-left p-3 rounded-lg border ${formData.payment_method === key ? 'border-blue-600 bg-blue-50' : 'border-gray-100 bg-white'}`}>
                        <div className="flex items-center gap-3">
                          <img src={img} alt={label} className="h-6 w-6" />
                          <div>
                            <div className="text-sm font-medium">{label}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {(formData.payment_method === 'mtn_momo' || formData.payment_method === 'airtel_money' || formData.payment_method === 'momopay') && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">Phone Number for Payment</label>
                      <input name="phone_number" value={formData.phone_number} onChange={handleChange} required className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="+250788123456" />
                      <p className="text-xs text-gray-500 mt-2">You will receive a payment prompt on this number.</p>
                    </div>
                  )}

                  {formData.payment_method === 'bank_transfer' && (
                    <div className="mt-4 p-4 bg-yellow-50 rounded-lg text-sm text-yellow-800">Bank transfer instructions will be provided after registration.</div>
                  )}

                  <div className="mt-6 flex justify-between">
                    <button type="button" onClick={handlePreviousStep} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700">Back</button>
                    <button type="button" onClick={handleSubmit} disabled={loading} className="px-6 py-3 rounded-lg text-white font-semibold bg-gradient-to-r from-blue-600 to-purple-600">{loading ? 'Processing...' : `Complete & Pay ${formatPrice(selectedPlan.price)}`}</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyRegister;
