# 💳 Payment Integration Setup Guide

## Overview

This ticketing system supports **multiple payment methods** for Rwanda:
- ✅ Flutterwave (Rwanda Mobile Money - MTN & Airtel)
- ✅ MTN Mobile Money (Direct Integration)
- ✅ Airtel Money
- ✅ MoMoPay
- ✅ Bank Transfer

## Quick Start (Using Flutterwave - Recommended)

### Step 1: Get Flutterwave Account

1. **Sign up** at [Flutterwave](https://dashboard.flutterwave.com/signup)
2. **Verify your account** (Business verification)
3. Navigate to **Settings > API Keys**

### Step 2: Get Your API Keys

You'll find three important keys:
- **Public Key**: `FLWPUBK_TEST-xxxxx` (for test) or `FLWPUBK-xxxxx` (for live)
- **Secret Key**: `FLWSECK_TEST-xxxxx` (for test) or `FLWSECK-xxxxx` (for live)
- **Webhook Hash**: A secret string for webhook verification

### Step 3: Configure Backend

Edit `backend/.env`:

```env
# Flutterwave Configuration
FLW_PUBLIC_KEY=FLWPUBK_TEST-your-public-key-here
FLW_SECRET_KEY=FLWSECK_TEST-your-secret-key-here
FLW_WEBHOOK_SECRET=your-webhook-secret-here
FLW_BASE_URL=https://api.flutterwave.com/v3
```

### Step 4: Setup Webhook URL

In Flutterwave Dashboard:
1. Go to **Settings > Webhooks**
2. Add webhook URL: `https://yourdomain.com/api/webhooks/flutterwave`
3. Or for testing: `https://your-ngrok-url.ngrok.io/api/webhooks/flutterwave`

**Note**: For local testing, use [ngrok](https://ngrok.com/) to expose your local server:
```bash
ngrok http 3000
```

### Step 5: Test Payment Flow

1. **Start your backend server**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Test a payment** (use Flutterwave test numbers):
   - MTN Rwanda Test: `250780000001`
   - OTP: `123456`

## Payment Flow

### For Customers

```
1. Customer selects trip & seats
   ↓
2. System creates ticket (status: pending payment)
   ↓
3. Customer initiates payment via Flutterwave
   ↓
4. Customer receives MTN/Airtel prompt on phone
   ↓
5. Customer enters PIN to approve
   ↓
6. Flutterwave webhook notifies our system
   ↓
7. Ticket status updated to "paid" & "confirmed"
   ↓
8. Customer receives ticket with QR code
```

### Backend Implementation

The system handles payments through these endpoints:

#### 1. Initiate Payment
```javascript
POST /api/pay-ticket
Headers: {
  Authorization: Bearer <user-token>
}
Body: {
  ticketId: 123,
  phone: "250780000001",
  network: "MTN" // or "AIRTEL"
}

Response: {
  success: true,
  message: "Payment initiated",
  data: {
    tx_ref: "TXN-1234567890-ABCDEF",
    status: "pending"
  }
}
```

#### 2. Check Payment Status
```javascript
GET /api/pay-ticket/status/:txRef
Headers: {
  Authorization: Bearer <user-token>
}

Response: {
  success: true,
  data: {
    payment: {
      status: "completed", // or "pending", "failed"
      amount: 5500,
      ...
    },
    ticket: {
      ticket_status: "confirmed",
      payment_status: "completed",
      ...
    }
  }
}
```

#### 3. Webhook (Flutterwave Callback)
```javascript
POST /api/webhooks/flutterwave
Headers: {
  verif-hash: <webhook-secret>
}
Body: {
  event: "charge.completed",
  data: {
    tx_ref: "TXN-1234567890-ABCDEF",
    status: "successful",
    amount: 5500,
    ...
  }
}
```

## Database Tables

### payments table
```sql
CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payment_id VARCHAR(100) UNIQUE,
  transaction_ref VARCHAR(100) UNIQUE,
  payment_type ENUM('ticket', 'subscription'),
  amount DECIMAL(10,2),
  payment_method VARCHAR(50),
  phone_number VARCHAR(20),
  user_id INT,
  company_id INT,
  status ENUM('pending', 'completed', 'failed'),
  metadata JSON,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### tickets table (payment fields)
```sql
ALTER TABLE tickets ADD COLUMN payment_status 
  ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending';
ALTER TABLE tickets ADD COLUMN payment_method VARCHAR(50);
ALTER TABLE tickets ADD COLUMN qr_code TEXT;
```

## Frontend Integration

### Pay Ticket Component

```javascript
// Example from MyBookings.jsx
const handlePay = async () => {
  try {
    const response = await api.post('/pay-ticket', {
      ticketId: ticket.id,
      phone: '250780000001',
      network: 'MTN'
    });
    
    const txRef = response.data.tx_ref;
    
    // Poll for payment status
    const checkStatus = setInterval(async () => {
      const status = await api.get(`/pay-ticket/status/${txRef}`);
      if (status.data.payment.status === 'completed') {
        clearInterval(checkStatus);
        alert('Payment successful!');
        // Refresh tickets
      }
    }, 3000);
  } catch (error) {
    console.error('Payment failed:', error);
  }
};
```

## Testing

### Test Cards (Flutterwave Sandbox)

For Rwanda Mobile Money:
- **MTN Rwanda**: `250780000001` (OTP: `123456`)
- **Airtel Rwanda**: `250730000001` (OTP: `123456`)

### Test Flow

1. Create a ticket/booking
2. Initiate payment with test phone number
3. Check backend logs for payment initiation
4. Simulate successful webhook (or use Flutterwave test dashboard)
5. Verify ticket status changes to "confirmed"
6. Verify payment record in database

### Manual Webhook Testing

Use Postman or curl:

```bash
curl -X POST http://localhost:3000/api/webhooks/flutterwave \
  -H "Content-Type: application/json" \
  -H "verif-hash: your-webhook-secret" \
  -d '{
    "event": "charge.completed",
    "data": {
      "id": 12345,
      "tx_ref": "TXN-1234567890-ABCDEF",
      "flw_ref": "FLW-MOCK-123",
      "status": "successful",
      "amount": 5500,
      "currency": "RWF",
      "customer": {
        "email": "customer@example.com",
        "phone_number": "250780000001"
      }
    }
  }'
```

## Production Checklist

- [ ] Switch from TEST to LIVE API keys
- [ ] Update webhook URL to production domain
- [ ] Configure proper SSL certificate
- [ ] Test with real phone numbers (small amounts)
- [ ] Setup monitoring for failed payments
- [ ] Configure email notifications
- [ ] Add payment retry logic
- [ ] Implement refund functionality
- [ ] Setup reconciliation reports

## Security Best Practices

1. **Never expose secret keys** in frontend code
2. **Validate webhook signatures** (verif-hash)
3. **Verify transaction amounts** before confirming
4. **Store payment logs** for auditing
5. **Use HTTPS** in production
6. **Implement rate limiting** on payment endpoints
7. **Sanitize user inputs** (phone numbers)

## Troubleshooting

### Payment not initiating?
- Check Flutterwave API keys in `.env`
- Verify phone number format: `250XXXXXXXXX`
- Check backend logs for errors
- Ensure Flutterwave account is active

### Webhook not received?
- Verify webhook URL is publicly accessible
- Check `verif-hash` matches your webhook secret
- Look at Flutterwave webhook logs in dashboard
- Test with ngrok for local development

### Payment stuck in pending?
- Check Flutterwave transaction in dashboard
- Verify webhook was received
- Manually check transaction status via API
- Check `payment_webhooks` table for logs

## Support

- **Flutterwave Docs**: https://developer.flutterwave.com/docs
- **Flutterwave Support**: support@flutterwavego.com
- **Integration Issues**: Check backend logs in `backend/` directory

## Additional Payment Methods

### MTN Mobile Money (Direct)
Requires MTN MoMo API credentials from https://momodeveloper.mtn.com/

### Airtel Money
Requires Airtel Money API access

### MoMoPay
Rwanda-specific payment aggregator

---

**Ready to accept payments!** 🎉

Configure your Flutterwave keys and start testing immediately!
