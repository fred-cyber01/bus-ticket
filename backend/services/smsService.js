const { query } = require('../config/database');

class SMSService {
  async sendSMS(phone, message) {
    // Trim/normalize phone
    if (!phone) return { success: false, error: 'No phone' };
    const to = String(phone).trim();

    // If Twilio configured, use it
    const TW_ACCOUNT = process.env.TWILIO_ACCOUNT_SID;
    const TW_TOKEN = process.env.TWILIO_AUTH_TOKEN;
    const TW_FROM = process.env.TWILIO_FROM;

    if (TW_ACCOUNT && TW_TOKEN && TW_FROM) {
      try {
        const twilio = require('twilio')(TW_ACCOUNT, TW_TOKEN);
        const resp = await twilio.messages.create({ body: message, from: TW_FROM, to });
        return { success: true, provider: 'twilio', resp };
      } catch (e) {
        console.error('Twilio SMS error', e);
        return { success: false, error: e.message };
      }
    }

    // Fallback: log the message (or integrate other providers)
    console.log(`SMS to ${to}: ${message}`);
    return { success: true, provider: 'console' };
  }

  async notifyDriverForTrip(tripId) {
    if (!tripId) return { success: false, error: 'Missing tripId' };

    // Get trip and driver details
    const tripRows = await query(
      `SELECT t.id, t.driver_id, t.trip_date, t.departure_time, c.company_name, d.name as driver_name, d.phone as driver_phone
       FROM trips t
       LEFT JOIN cars c ON t.car_id = c.id
       LEFT JOIN drivers d ON t.driver_id = d.id
       WHERE t.id = ? LIMIT 1`,
      [tripId]
    );
    const trip = tripRows[0];
    if (!trip) return { success: false, error: 'Trip not found' };
    if (!trip.driver_phone) return { success: false, error: 'Driver phone not set' };

    // Get confirmed passengers for this trip
    const passengers = await query(
      `SELECT passenger_name, seat_number, passenger_phone
       FROM tickets
       WHERE trip_id = ? AND ticket_status IN ('booked', 'confirmed', 'on_board')
       ORDER BY seat_number ASC`,
      [tripId]
    );

    // Build message
    const lines = [];
    lines.push(`Trip ${tripId} - ${trip.company_name}`);
    lines.push(`Date: ${trip.trip_date} Time: ${trip.departure_time}`);
    lines.push('Passengers:');
    if (passengers.length === 0) lines.push('  (none)');
    else passengers.forEach((p, idx) => {
      const phonePart = p.passenger_phone ? ` (${p.passenger_phone})` : '';
      lines.push(`  ${p.seat_number}: ${p.passenger_name}${phonePart}`);
    });

    const message = lines.join('\n');

    return await this.sendSMS(trip.driver_phone, message);
  }
}

module.exports = new SMSService();
