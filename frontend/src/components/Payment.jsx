import { useState } from 'react';
import api from '../services/api';

const Payment = ({ bookingId, amount, onSuccess }) => {
  const [phone, setPhone] = useState('');
  const [method, setMethod] = useState('mtn_momo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [transactionRef, setTransactionRef] = useState(null);
  const [paymentId, setPaymentId] = useState(null);

  const requiresPhone = (m) => ['mtn_momo', 'airtel_money', 'momopay'].includes(m);

  const handlePay = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    setTransactionRef(null);
    try {
      if (requiresPhone(method) && !phone) {
        setError('Phone number is required for selected payment method');
        setLoading(false);
        return;
      }

      const payload = {
        payment_type: 'ticket',
        amount,
        payment_method: method,
        phone_number: phone || null,
        metadata: { bookingId }
      };

      const res = await api.post('/payments/initiate', payload);

      const data = res.data || res;
      setSuccess('Payment initiated. Follow the provider instructions.');
      setTransactionRef(data.transactionRef || data.tx_ref || data.transaction_ref || null);
      setPaymentId(data.paymentId || data.payment_id || null);

      if (onSuccess) onSuccess(data);
    } catch (err) {
      setError(err.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!transactionRef) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/payments/status/${transactionRef}`);
      const status = res.data?.status || res.status || 'unknown';
      setSuccess(`Status: ${status}`);
      if (status === 'completed' && onSuccess) onSuccess(res.data);
    } catch (err) {
      setError(err.message || 'Failed to check status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-3">Complete payment</h3>

      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
        <div className="text-xl font-bold">{amount} RWF</div>
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Payment method</label>
        <select
          value={method}
          onChange={e => setMethod(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="mtn_momo">MTN Mobile Money</option>
          <option value="airtel_money">Airtel Money</option>
          <option value="momopay">MoMoPay (payment code)</option>
          <option value="bank_transfer">Bank Transfer</option>
        </select>
      </div>

      {requiresPhone(method) && (
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
          <input
            type="tel"
            placeholder="e.g. 250780000000"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={handlePay}
          disabled={loading || (requiresPhone(method) && !phone)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? 'Processing...' : `Pay ${amount} RWF`}
        </button>

        <button
          onClick={checkStatus}
          disabled={!transactionRef || loading}
          className="border px-3 py-2 rounded hover:bg-gray-50 disabled:opacity-60"
        >
          Check status
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {error && <div className="text-sm text-red-600">{error}</div>}
        {success && <div className="text-sm text-green-700">{success}</div>}
        {transactionRef && (
          <div className="text-xs text-gray-600">Transaction ref: <span className="font-mono">{transactionRef}</span></div>
        )}
        {paymentId && (
          <div className="text-xs text-gray-600">Payment id: <span className="font-mono">{paymentId}</span></div>
        )}
      </div>
    </div>
  );
};

export default Payment;
