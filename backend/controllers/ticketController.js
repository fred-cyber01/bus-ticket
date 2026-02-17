// controllers/ticketController.js
const Ticket = require('../models/Ticket');
const Trip = require('../models/Trip');
const Route = require('../models/Route');
const { query } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const moment = require('moment-timezone');
const QRCode = require('qrcode');
const crypto = require('crypto');
const smsService = require('../services/smsService');

/**
 * @route   POST /api/bookings
 * @desc    Create new booking
 * @access  Private (User)
 */
exports.createBooking = asyncHandler(async (req, res) => {
  const { tripId, seatNumbers, passengerDetails } = req.body;
  const userId = req.user.id;

  // Extract numeric trip ID from tripId string (e.g., "trip_123" -> 123)
  // Also handle if tripId is already numeric
  let numericTripId;
  if (typeof tripId === 'string' && tripId.startsWith('trip_')) {
    numericTripId = parseInt(tripId.replace(/^trip_/, ''));
  } else {
    numericTripId = parseInt(tripId);
  }

  if (isNaN(numericTripId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid trip ID'
    });
  }

  // Get trip details with car info for total_seats
  const supabase = require('../config/supabase');
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select(`
      *,
      car:cars(total_seats, capacity)
    `)
    .eq('id', numericTripId)
    .single();
  
  if (tripError || !trip) {
    return res.status(404).json({
      success: false,
      message: 'Trip not found'
    });
  }

  // Basic validation: passenger details must be provided and include required fields
  if (!Array.isArray(passengerDetails) || passengerDetails.length === 0) {
    return res.status(400).json({ success: false, message: 'passengerDetails are required' });
  }

  for (const p of passengerDetails) {
    if (!p || !p.name || p.name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Each passenger must have a name' });
    }
    if (p.seatNumber === undefined || p.seatNumber === null) {
      return res.status(400).json({ success: false, message: 'Each passenger must have a seatNumber' });
    }
  }

  // Validate all seat numbers
  for (const seatNum of seatNumbers) {
    const seat = parseInt(seatNum);
    const maxSeats = trip.total_seats || trip.car?.total_seats || trip.car?.capacity || 50; // Fallback chain
    if (seat < 1 || seat > maxSeats) {
      return res.status(400).json({
        success: false,
        message: `Invalid seat number: ${seatNum}. Must be between 1 and ${maxSeats}`
      });
    }

    // Check if seat is already booked
    const { data: seatCheck } = await supabase
      .from('tickets')
      .select('id')
      .eq('trip_id', numericTripId)
      .eq('seat_number', seat)
      .in('ticket_status', ['booked', 'confirmed', 'on_board']);

    if (seatCheck && seatCheck.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Seat ${seatNum} already booked`
      });
    }
  }

  // Validate passenger details match seat numbers
  if (passengerDetails.length !== seatNumbers.length) {
    return res.status(400).json({
      success: false,
      message: 'Passenger details must match number of seats'
    });
  }

  // Create tickets for each passenger
  const bookingIds = [];
  let totalPrice = 0;
  const createdPassengers = [];
  const ticketsWithQR = [];

  // Get user details for ticket
  const { data: userDetails } = await supabase
    .from('users')
    .select('user_name, email, phone')
    .eq('id', userId)
    .single();

  for (const passenger of passengerDetails) {
    // Determine ticket pricing
    const ticketPrice = Number(trip.price || 5000);
    const serviceFee = Math.round(ticketPrice * 0.05); // 5% service fee
    const totalAmount = Number(ticketPrice + serviceFee);

    // Normalize travel date/time for ticket storage and display
    // trip.trip_date may be null; trip.departure_time may be 'HH:mm:ss' or an ISO datetime
    let travelDate = trip.trip_date || null;
    let depTimeRaw = trip.departure_time || trip.departureTime || null;
    let departureTimeDisplay = depTimeRaw;
    // If departure_time contains 'T', split into date and time
    if (depTimeRaw && String(depTimeRaw).includes('T')) {
      const parts = String(depTimeRaw).split('T');
      if (!travelDate) travelDate = parts[0];
      departureTimeDisplay = parts[1];
    }
    // As fallback, if trip.trip_date missing but trip has full datetime in other fields, try to extract
    if (!travelDate && trip.departure_datetime) {
      const dt = String(trip.departure_datetime);
      if (dt.includes('T')) travelDate = dt.split('T')[0];
    }
    // Final combined departure time for DB: prefer full 'YYYY-MM-DD HH:mm:ss' when possible
    const departureForDb = travelDate && departureTimeDisplay ? `${travelDate} ${departureTimeDisplay}` : (trip.departure_time || null);

    const ticketId = await Ticket.createBooking({
      user_id: userId,
      trip_id: numericTripId,
      seat_number: passenger.seatNumber,
      passenger_name: passenger.name,
      passenger_age: passenger.age,
      passenger_phone: passenger.phone || userDetails.phone || 'N/A',
      passenger_email: passenger.email || userDetails.email,
      boarding_stop_id: trip.origin_id || trip.origin_id || null,
      dropoff_stop_id: trip.destination_id || trip.destination_id || null,
      price: totalAmount,
      departure_time: departureForDb,
      booking_date: moment().format('YYYY-MM-DD')
    });

    // DO NOT auto-confirm - wait for payment
    // Ticket status remains 'booked', payment_status remains 'pending'

    const issueDateTime = moment().tz('Africa/Kigali');
    
    // Generate QR code data with receipt info
    const qrData = {
      receiptNo: `RT-${String(ticketId).padStart(8, '0')}`,
      transactionId: `TXN-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
      ticketId: ticketId,
      passenger: passenger.name,
      from: trip.origin,
      to: trip.destination,
      travelDate: travelDate || 'TBD',
      departureTime: departureTimeDisplay || 'TBD',
      seat: passenger.seatNumber,
      busPlate: trip.plate_number,
      company: trip.company_name,
      amount: totalAmount,
      issued: issueDateTime.format('YYYY-MM-DD HH:mm:ss'),
      hash: crypto.createHash('sha256')
        .update(`${ticketId}-${userId}-${numericTripId}-${passenger.seatNumber}`)
        .digest('hex')
        .substring(0, 16)
    };

    // Generate QR code as base64 data URL
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'H',
      width: 300,
      margin: 1
    });

    // Save QR code to database
    await query(
      'UPDATE tickets SET qr_code = ? WHERE id = ?',
      [qrCodeDataURL, ticketId]
    );

    bookingIds.push(ticketId);
    totalPrice += totalAmount;
    
    // Create formatted receipt matching template
    const passengerPhone = passenger.phone || userDetails.phone || 'N/A';
    const passengerEmail = passenger.email || userDetails.email || 'N/A';
    const companyPhone = trip.company_phone || '+250788000000';
    const ticketPriceFmt = `${Number(ticketPrice).toFixed(0)} RWF`;
    const serviceFeeFmt = `${Number(serviceFee).toFixed(0)} RWF`;
    const totalAmountFmt = `${Number(totalAmount).toFixed(0)} RWF`;
    
    const receipt = `
╔════════════════════════════════════════════════╗
║           BUS TICKET RECEIPT                   ║
╚════════════════════════════════════════════════╝

Receipt No: ${qrData.receiptNo}
Transaction ID: ${qrData.transactionId}
Date Issued: ${issueDateTime.format('YYYY-MM-DD')}
Time: ${issueDateTime.format('HH:mm:ss')}

📍 Trip Details
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
From: ${trip.origin || trip.origin_stop_name || 'N/A'}
To: ${trip.destination || trip.destination_stop_name || 'N/A'}
Travel Date: ${travelDate || 'TBD'}
Departure Time: ${departureTimeDisplay || 'TBD'}
Bus Name / Company: ${trip.company_name}
Bus Plate Number: ${trip.plate_number}
Seat Number: ${passenger.seatNumber}

👤 Passenger Information
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Full Name: ${passenger.name}
Phone: ${passengerPhone}
Email: ${passengerEmail}

💳 Payment Details
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Payment Method: Mobile Money
Ticket Price: ${ticketPriceFmt}
Service Fee: ${serviceFeeFmt}
Total Paid: ${totalAmountFmt}
Status: PAID ✔

🔐 Security
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QR Code: (See Below)
Verified By: ${trip.company_name} Booking System
Scan at boarding gate for validation

📘 Terms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Ticket is valid only for the date and time shown.
• Non-refundable after bus departure.
• Passenger must arrive at least 15 minutes before boarding.

✔ Thank you for traveling with us!

${trip.company_name}
Customer Support: ${companyPhone}
    `;
    
    createdPassengers.push({
      ticketId: ticketId,
      receiptNo: qrData.receiptNo,
      transactionId: qrData.transactionId,
      name: passenger.name,
      age: passenger.age,
      seatNumber: passenger.seatNumber,
      ticketPrice: ticketPrice,
      serviceFee: serviceFee,
      totalAmount: totalAmount,
      ticketPriceFormatted: ticketPriceFmt,
      serviceFeeFormatted: serviceFeeFmt,
      totalAmountFormatted: totalAmountFmt,
      qrCode: qrCodeDataURL,
      receipt: receipt,
      qrData: qrData
    });

    ticketsWithQR.push({
      id: ticketId,
      receiptNo: qrData.receiptNo,
      seatNumber: passenger.seatNumber,
      passengerName: passenger.name,
      qrCode: qrCodeDataURL,
      receipt: receipt
    });
  }

  // Notify driver immediately about booked passengers for this trip (include 'booked' status)
  try {
    await smsService.notifyDriverForTrip(numericTripId);
  } catch (e) {
    console.error('Driver notification failed after booking:', e?.message || e);
  }

  res.status(201).json({
    success: true,
    message: 'Booking created successfully - Please complete payment to confirm tickets',
    data: {
      bookingId: `booking_${bookingIds[0]}`,
      tripId: numericTripId,
      userId: `usr_${userId}`,
      seatNumbers: seatNumbers,
      totalPrice: totalPrice,
      bookingStatus: 'pending_payment',
      paymentStatus: 'pending',
      bookingDate: moment().tz('Africa/Kigali').format(),
      passengerDetails: createdPassengers,
      tickets: ticketsWithQR,
      tripDetails: {
        departure_time: trip.departure_time,
        route_name: trip.route_name,
        origin: trip.origin,
        destination: trip.destination,
        plate_number: trip.plate_number,
        company_name: trip.company_name
      }
    }
  });
});

/**
 * @route   GET /api/bookings
 * @desc    Get all bookings (Admin) or user bookings
 * @access  Private
 */
exports.getBookings = asyncHandler(async (req, res) => {
  const filters = {};

  // Admin sees everything.
  // Company manager sees tickets for their company.
  // Customer sees only their own tickets.
  if (req.user.type === 'admin') {
    // no filter
  } else if (req.user.company_id) {
    filters.company_id = req.user.company_id;
  } else {
    filters.user_id = req.user.id;
  }

  const bookings = await Ticket.getAllBookings(filters);

  res.json({
    success: true,
    data: bookings
  });
});

/**
 * @route   GET /api/bookings/:id
 * @desc    Get booking by ID
 * @access  Private
 */
exports.getBooking = asyncHandler(async (req, res) => {
  const booking = await Ticket.getBookingById(req.params.id);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Check ownership
  if (req.user.type !== 'admin') {
    if (req.user.company_id) {
      // Company managers can only view tickets belonging to their company.
      if (String(booking.company_id ?? '') !== String(req.user.company_id ?? '')) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    } else if (booking.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'User cannot view this booking'
      });
    }
  }

  res.json({
    success: true,
    data: booking
  });
});

/**
 * @route   GET /api/tickets/:id
 * @desc    Get ticket by ID
 * @access  Private
 */
exports.getTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Ticket not found'
    });
  }

  // Check ownership
  if (req.user.type !== 'admin' && ticket.user_id !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  res.json({
    success: true,
    data: ticket
  });
});

/**
 * @route   PUT /api/tickets/:id
 * @desc    Update ticket
 * @access  Private (Admin)
 */
exports.updateTicket = asyncHandler(async (req, res) => {
  const { status, payment_status } = req.body;

  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Ticket not found'
    });
  }

  const updateData = {};
  if (status) updateData.ticket_status = status;
  if (payment_status) updateData.payment_status = payment_status;

  const updatedTicket = await Ticket.update(req.params.id, updateData);

  res.json({
    success: true,
    message: 'Ticket updated successfully',
    data: updatedTicket
  });
});

/**
 * @route   DELETE /api/bookings/:id
 * @desc    Cancel booking
 * @access  Private
 */
exports.cancelBooking = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Check ownership
  if (req.user.type !== 'admin' && ticket.user_id !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'User cannot cancel this booking'
    });
  }

  // Check if booking can be cancelled
  const departureTime = moment(ticket.departure_time);
  const now = moment().tz('Africa/Kigali');

  if (departureTime.isBefore(now)) {
    return res.status(400).json({
      success: false,
      message: 'Cannot cancel booking for past trip'
    });
  }

  // Update status to cancelled
  await Ticket.updateStatus(req.params.id, 'Cancelled');

  res.json({
    success: true,
    message: 'Booking cancelled successfully'
  });
});

/**
 * @route   GET /api/tickets/trip/:tripId
 * @desc    Get all tickets for a trip
 * @access  Private (Admin/Driver)
 */
exports.getTripTickets = asyncHandler(async (req, res) => {
  const tickets = await Ticket.getTripTickets(req.params.tripId);

  res.json({
    success: true,
    data: tickets,
    total: tickets.length
  });
});

/**
 * @route   POST /api/tickets/check-availability
 * @desc    Check seat availability
 * @access  Public
 */
exports.checkAvailability = asyncHandler(async (req, res) => {
  const {
    schedule_id,
    trip_date,
    boarding_stop_id,
    dropoff_stop_id
  } = req.body;

  // Get schedule
  const scheduleSql = `
    SELECT ds.*, r.id as route_id, c.capacity
    FROM daily_schedules ds
    JOIN routes r ON ds.route_id = r.id
    JOIN cars c ON ds.car_id = c.id
    WHERE ds.id = ?
  `;
  const [schedule] = await query(scheduleSql, [schedule_id]);

  if (!schedule) {
    return res.status(404).json({
      success: false,
      message: 'Schedule not found'
    });
  }

  // Get stop orders
  const stopOrderSql = `
    SELECT stop_id, stop_order
    FROM route_stops
    WHERE route_id = ? AND stop_id IN (?, ?)
  `;
  const stopOrders = await query(stopOrderSql, [schedule.route_id, boarding_stop_id, dropoff_stop_id]);

  const boardingOrder = stopOrders.find(s => s.stop_id === parseInt(boarding_stop_id))?.stop_order;
  const dropoffOrder = stopOrders.find(s => s.stop_id === parseInt(dropoff_stop_id))?.stop_order;

  // Get or create trip
  const departureDateTime = `${trip_date} ${schedule.departure_time}`;
  const tripId = await Trip.getOrCreate(schedule.route_id, schedule.car_id, departureDateTime);

  // Get occupied seats
  const occupiedSeats = await Ticket.getOccupiedSeats(tripId, boardingOrder, dropoffOrder);

  // Get price
  const priceSql = `
    SELECT price
    FROM destination_prices
    WHERE route_id = ? AND start_stop_id = ? AND end_stop_id = ?
  `;
  const [priceData] = await query(priceSql, [schedule.route_id, boarding_stop_id, dropoff_stop_id]);

  res.json({
    success: true,
    data: {
      capacity: schedule.capacity,
      occupied_seats: occupiedSeats,
      available_seats: schedule.capacity - occupiedSeats.length,
      price: priceData?.price || 0,
      trip_id: tripId
    }
  });
});

/**
 * @route   POST /api/tickets/:id/confirm-payment
 * @desc    Confirm payment and update ticket status
 * @access  Private
 */
exports.confirmPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { paymentMethod } = req.body;

  // Update ticket status to confirmed and payment to completed
  await query(
    'UPDATE tickets SET ticket_status = "confirmed", payment_status = "completed" WHERE id = ?',
    [id]
  );

  const ticket = await Ticket.findById(id);

  res.json({
    success: true,
    message: 'Payment confirmed successfully',
    data: ticket
  });
});

/**
 * @route   GET /api/tickets/:id/download
 * @desc    Download ticket as PDF
 * @access  Private
 */
exports.downloadTicketPDF = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const PDFDocument = require('pdfkit');

  // Get ticket details with all related info
  const ticketSql = `
    SELECT t.*,
           u.user_name, u.email as user_email, u.phone as user_phone,
           tr.trip_date, tr.departure_time,
           s1.name as origin,
           s2.name as destination,
           c.plate_number,
           comp.company_name,
           comp.phone as company_phone
    FROM tickets t
    JOIN users u ON t.user_id = u.id
    JOIN trips tr ON t.trip_id = tr.id
    JOIN stops s1 ON tr.origin_id = s1.id
    JOIN stops s2 ON tr.destination_id = s2.id
    JOIN cars c ON tr.car_id = c.id
    JOIN companies comp ON c.company_id = comp.id
    WHERE t.id = ?
  `;

  const ticketResult = await query(ticketSql, [id]);
  if (!ticketResult || ticketResult.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Ticket not found'
    });
  }

  const ticket = ticketResult[0];

  // Create PDF document
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  // Set response headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=ticket-${ticket.booking_reference}.pdf`);

  // Pipe PDF to response
  doc.pipe(res);

  // Add content
  doc.fontSize(20).text('BUS TICKET RECEIPT', { align: 'center' });
  doc.moveDown();

  // Receipt details
  doc.fontSize(12);
  doc.text(`Receipt No: RT-${String(ticket.id).padStart(8, '0')}`);
  doc.text(`Booking Reference: ${ticket.booking_reference}`);
  doc.text(`Date Issued: ${moment(ticket.booked_at).tz('Africa/Kigali').format('YYYY-MM-DD')}`);
  doc.text(`Time: ${moment(ticket.booked_at).tz('Africa/Kigali').format('HH:mm:ss')}`);
  doc.moveDown();

  // Trip Details
  doc.fontSize(14).text('📍 Trip Details', { underline: true });
  doc.fontSize(11);
  doc.text(`From: ${ticket.origin}`);
  doc.text(`To: ${ticket.destination}`);
  doc.text(`Travel Date: ${moment(ticket.trip_date).format('YYYY-MM-DD')}`);
  doc.text(`Departure Time: ${ticket.departure_time}`);
  doc.text(`Bus Name / Company: ${ticket.company_name}`);
  doc.text(`Bus Plate Number: ${ticket.plate_number}`);
  doc.text(`Seat Number: ${ticket.seat_number}`);
  doc.moveDown();

  // Passenger Information
  doc.fontSize(14).text('👤 Passenger Information', { underline: true });
  doc.fontSize(11);
  doc.text(`Full Name: ${ticket.passenger_name}`);
  doc.text(`Phone: ${ticket.passenger_phone}`);
  doc.text(`Email: ${ticket.passenger_email || 'N/A'}`);
  doc.moveDown();

  // Payment Details
  const ticketPrice = Math.round(parseFloat(ticket.price) / 1.05);
  const serviceFee = parseFloat(ticket.price) - ticketPrice;
  
  doc.fontSize(14).text('💳 Payment Details', { underline: true });
  doc.fontSize(11);
  doc.text('Payment Method: Mobile Money');
  doc.text(`Ticket Price: ${ticketPrice} RWF`);
  doc.text(`Service Fee: ${serviceFee.toFixed(0)} RWF`);
  doc.text(`Total Paid: ${ticket.price} RWF`);
  doc.text(`Status: ${ticket.payment_status === 'completed' ? 'PAID ✔' : 'PENDING'}`);
  doc.moveDown();

  // QR Code
  if (ticket.qr_code) {
    doc.fontSize(14).text('🔐 Security', { underline: true });
    doc.fontSize(11);
    doc.text('Scan QR code at boarding gate for validation');
    doc.moveDown();
    
    // Add QR code image
    const qrImage = ticket.qr_code.replace(/^data:image\/png;base64,/, '');
    doc.image(Buffer.from(qrImage, 'base64'), { width: 150, align: 'center' });
    doc.moveDown();
  }

  // Terms
  doc.fontSize(14).text('📘 Terms', { underline: true });
  doc.fontSize(10);
  doc.text('• Ticket is valid only for the date and time shown.');
  doc.text('• Non-refundable after bus departure.');
  doc.text('• Passenger must arrive at least 15 minutes before boarding.');
  doc.moveDown();

  // Footer
  doc.fontSize(12).text('✔ Thank you for traveling with us!', { align: 'center' });
  doc.moveDown();
  doc.fontSize(10);
  doc.text(`${ticket.company_name}`, { align: 'center' });
  doc.text(`Customer Support: ${ticket.company_phone || '+250788000000'}`, { align: 'center' });

  // Finalize PDF
  doc.end();
});

module.exports = exports;
