// GoArts AI - Booking Routes with Split Payments, Mutual Chat & Verified KYC
import express from 'express';
import { db, newId, now, saveItem, updateById } from '../db/inMemoryDb.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Valid status transitions
const VALID_TRANSITIONS = {
  requested: ['quoted', 'declined', 'cancelled'],
  quoted: ['confirmed', 'declined', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  declined: [],
};

const canTransition = (from, to) => VALID_TRANSITIONS[from]?.includes(to) || false;

// ── Helpers ────────────────────────────────────────────────
const enrichBooking = (b) => {
  const customer = db.users.find((u) => u.id === b.customerId);
  const artist = db.artists.find((a) => a.id === b.artistId);
  const artistUser = artist ? db.users.find((u) => u.id === artist.userId) : null;
  const hasReview = db.reviews.some((r) => r.bookingId === b.id);
  const bookingMessages = (db.messages || []).filter((m) => m.bookingId === b.id);
  const bookingPayments = (db.payments || []).filter((p) => p.bookingId === b.id);
  const totalAmount = b.quotedPrice || b.budget || 0;
  const advanceAmount = Math.round(totalAmount * 0.5);

  return {
    ...b,
    paymentStatus: b.paymentStatus || 'unpaid', // 'unpaid' | 'advance_paid' | 'fully_paid'
    paidAmount: b.paidAmount || 0,
    balanceAmount: b.balanceAmount !== undefined ? b.balanceAmount : totalAmount,
    advanceAmount,
    chatEnabled: Boolean(b.chatEnabled),
    chatRequestedBy: b.chatRequestedBy || null,
    messageCount: bookingMessages.length,
    payments: bookingPayments,
    customer: customer ? {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      city: customer.city,
      isVerified: customer.isVerified || false,
      aadhaarVerified: customer.aadhaarVerified || false,
      aadhaarData: customer.aadhaarData || null,
    } : null,
    artist: artist ? {
      id: artist.id,
      displayName: artist.displayName,
      category: artist.category,
      image: artist.image,
      city: artist.city,
      email: artistUser?.email,
      rating: artist.rating,
      verified: artist.verified || false,
      aadhaarVerified: artist.aadhaarVerified || false,
      startingPrice: artist.startingPrice,
    } : null,
    hasReview,
  };
};

// ── Customer endpoints ─────────────────────────────────────

// POST /api/bookings - Create booking request (any authenticated user)
router.post('/', authenticate, async (req, res) => {
  const { artistId, eventType, eventDate, eventLocation, budget, duration, audienceSize, languagePreference, specialRequirements } = req.body;

  if (!artistId || !eventType || !eventDate || !budget) {
    return res.status(400).json({ error: 'artistId, eventType, eventDate, and budget are required.' });
  }

  const artist = db.artists.find((a) => a.id === artistId);
  if (!artist) return res.status(404).json({ error: 'Artist not found or not available for booking.' });

  // Check for duplicate pending bookings
  const duplicate = db.bookings.find(
    (b) => b.customerId === req.user.id && b.artistId === artistId && b.eventDate === eventDate &&
      ['requested', 'quoted', 'confirmed'].includes(b.status)
  );
  if (duplicate) {
    return res.status(409).json({ error: 'You already have an active booking request with this artist for this date.' });
  }

  // Check artist availability
  if (artist.unavailableDates?.includes(eventDate)) {
    return res.status(409).json({ error: 'The artist is not available on this date. Please choose another date.' });
  }

  // Check for conflicting confirmed booking for artist
  const conflicting = db.bookings.find(
    (b) => b.artistId === artistId && b.eventDate === eventDate && b.status === 'confirmed'
  );
  if (conflicting) {
    return res.status(409).json({ error: 'The artist already has a confirmed booking on this date.' });
  }

  const bookingId = newId();
  const numBudget = Number(budget);
  const booking = {
    id: bookingId,
    customerId: req.user.id,
    artistId,
    status: 'requested',
    paymentStatus: 'unpaid',
    paidAmount: 0,
    balanceAmount: numBudget,
    chatEnabled: false,
    chatRequestedBy: null,
    eventType,
    eventDate,
    eventLocation: eventLocation || { city: '', venue: '', address: '' },
    budget: numBudget,
    quotedPrice: null,
    platformCommission: null,
    artistEarnings: null,
    duration: Number(duration) || 3,
    audienceSize: Number(audienceSize) || 0,
    languagePreference: languagePreference || '',
    specialRequirements: specialRequirements || '',
    artistNote: null,
    cancelReason: null,
    hasReview: false,
    createdAt: now(),
    updatedAt: now(),
  };

  await saveItem('bookings', booking);

  // Notify artist idempotently
  if (artist.userId) {
    await saveItem('notifications', {
      id: newId(),
      userId: artist.userId,
      type: 'new_booking',
      message: `New booking request from ${req.user.name} for ${eventType} on ${eventDate}. Budget: ₹${numBudget.toLocaleString()}`,
      isRead: false,
      createdAt: now(),
    });
  }

  res.status(201).json({ booking: enrichBooking(booking) });
});

// GET /api/bookings/my - User's own bookings (Customer or Artist)
router.get('/my', authenticate, (req, res) => {
  const { status, role, page = 1, limit = 50 } = req.query;

  // Strict lookup of artists belonging to the authenticated user
  const userArtistProfiles = db.artists.filter((a) => a.userId === req.user.id);
  const userArtistIds = userArtistProfiles.map((a) => a.id);

  let bookings = db.bookings.filter((b) => {
    // If explicit role requested:
    if (role === 'customer') {
      return b.customerId === req.user.id;
    }
    if (role === 'artist') {
      return userArtistIds.includes(b.artistId);
    }

    // Admin can see all bookings
    if (req.user.role === 'admin') return true;

    // If user's primary role is artist, include bookings where they are the artist
    if (req.user.role === 'artist') {
      if (userArtistIds.includes(b.artistId)) return true;
      return b.customerId === req.user.id;
    }

    // Default: customer sees bookings they placed
    return b.customerId === req.user.id;
  });

  if (status) bookings = bookings.filter((b) => b.status === status);
  bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const p = Number(page);
  const l = Number(limit);
  const total = bookings.length;
  const paginated = bookings.slice((p - 1) * l, p * l).map(enrichBooking);

  res.json({ bookings: paginated, pagination: { total, page: p, limit: l, pages: Math.ceil(total / l) } });
});

// GET /api/bookings/:id - Single booking
router.get('/:id', authenticate, (req, res) => {
  const booking = db.bookings.find((b) => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });

  const artist = db.artists.find((a) => a.id === booking.artistId);
  const isOwner = booking.customerId === req.user.id;
  const isArtist = artist && artist.userId === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isArtist && !isAdmin) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  res.json({ booking: enrichBooking(booking) });
});

// PUT /api/bookings/:id/status - Update status (artist, customer, or admin)
router.put('/:id/status', authenticate, async (req, res) => {
  const booking = db.bookings.find((b) => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });

  const artist = db.artists.find((a) => a.id === booking.artistId);
  const customer = db.users.find((u) => u.id === booking.customerId);
  const isArtist = artist && artist.userId === req.user.id;
  const isCustomer = booking.customerId === req.user.id;
  const isAdmin = req.user.role === 'admin';

  const { status, quotedPrice, artistNote, cancelReason } = req.body;

  if (!status) return res.status(400).json({ error: 'Status is required.' });
  if (!canTransition(booking.status, status)) {
    return res.status(400).json({ error: `Cannot transition from '${booking.status}' to '${status}'.` });
  }

  // Authorization check per status transition
  if (['quoted', 'declined'].includes(status) && !isArtist && !isAdmin) {
    return res.status(403).json({ error: 'Only the artist or admin can send quotes or decline requests.' });
  }
  if (status === 'confirmed' && !isCustomer && !isArtist && !isAdmin) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  if (status === 'completed' && !isArtist && !isAdmin) {
    return res.status(403).json({ error: 'Only the artist or admin can mark performance completed.' });
  }
  if (status === 'cancelled' && !isCustomer && !isArtist && !isAdmin) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  // Quotation validation
  if (status === 'quoted') {
    const numPrice = Number(quotedPrice || booking.budget);
    if (isNaN(numPrice) || numPrice <= 0) {
      return res.status(400).json({ error: 'Quotation price must be a valid positive amount.' });
    }
    booking.quotedPrice = numPrice;
    booking.platformCommission = Math.round(numPrice * 0.15);
    booking.artistEarnings = booking.quotedPrice - booking.platformCommission;
    booking.balanceAmount = numPrice - (booking.paidAmount || 0);
    booking.quotation = {
      amount: numPrice,
      currency: 'INR',
      note: artistNote || '',
      quotedAt: now(),
    };
  }

  booking.status = status;
  if (artistNote) booking.artistNote = artistNote;
  if (cancelReason) booking.cancelReason = cancelReason;
  booking.updatedAt = now();

  // If completed, increment artist counters
  if (status === 'completed' && artist) {
    artist.completedBookings = (artist.completedBookings || 0) + 1;
    await updateById('artists', artist.id, { completedBookings: artist.completedBookings });
  }

  await updateById('bookings', booking.id, booking);

  // Send notifications with idempotency checks
  if (status === 'cancelled') {
    if (isCustomer) {
      if (artist?.userId) {
        await saveItem('notifications', {
          id: newId(),
          userId: artist.userId,
          type: 'booking_cancelled',
          message: `Booking #${booking.id.slice(0, 8)} (${booking.eventType} on ${booking.eventDate}) was cancelled by customer ${customer?.name || ''}. Reason: ${cancelReason || 'Cancelled by client.'}`,
          isRead: false,
          createdAt: now(),
        });
      }
    } else {
      await saveItem('notifications', {
        id: newId(),
        userId: booking.customerId,
        type: 'booking_cancelled',
        message: `Your booking request with ${artist?.displayName || 'the artist'} was cancelled. Reason: ${cancelReason || 'Artist cancelled.'}`,
        isRead: false,
        createdAt: now(),
      });
    }
  } else if (status === 'quoted') {
    const existingQuoteNotif = db.notifications.find(
      (n) => n.userId === booking.customerId && n.type === 'booking_quoted' && !n.isRead && n.message.includes(`₹${booking.quotedPrice?.toLocaleString()}`)
    );
    if (!existingQuoteNotif) {
      await saveItem('notifications', {
        id: newId(),
        userId: booking.customerId,
        type: 'booking_quoted',
        message: `${artist?.displayName || 'The artist'} sent you a quotation of ₹${booking.quotedPrice?.toLocaleString()}! Accept & pay 50% advance to confirm.`,
        isRead: false,
        createdAt: now(),
      });
    }
  } else if (status === 'confirmed') {
    if (artist?.userId) {
      await saveItem('notifications', {
        id: newId(),
        userId: artist.userId,
        type: 'booking_confirmed',
        message: `Booking confirmed! ${customer?.name || 'Customer'} confirmed the date for ${booking.eventType} on ${booking.eventDate}.`,
        isRead: false,
        createdAt: now(),
      });
    }
    await saveItem('notifications', {
      id: newId(),
      userId: booking.customerId,
      type: 'booking_confirmed',
      message: `Your booking with ${artist?.displayName || 'the artist'} is confirmed!`,
      isRead: false,
      createdAt: now(),
    });
  } else if (status === 'declined') {
    await saveItem('notifications', {
      id: newId(),
      userId: booking.customerId,
      type: 'booking_declined',
      message: `Your booking request was declined by ${artist?.displayName || 'the artist'}.`,
      isRead: false,
      createdAt: now(),
    });
  } else if (status === 'completed') {
    await saveItem('notifications', {
      id: newId(),
      userId: booking.customerId,
      type: 'booking_completed',
      message: `Performance completed! Please pay the remaining 50% balance and leave a review for ${artist?.displayName || 'the artist'}.`,
      isRead: false,
      createdAt: now(),
    });
  }

  res.json({ booking: enrichBooking(booking) });
});

// POST /api/bookings/:id/pay - Milestone Payment (50% before, 50% after)
router.post('/:id/pay', authenticate, async (req, res) => {
  const booking = db.bookings.find((b) => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });
  if (booking.customerId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied.' });
  }

  if (['cancelled', 'declined'].includes(booking.status)) {
    return res.status(400).json({ error: 'Cannot pay for a cancelled or declined booking.' });
  }

  const { milestone, paymentMethod = 'UPI' } = req.body;
  if (!['advance', 'balance'].includes(milestone)) {
    return res.status(400).json({ error: "Milestone must be 'advance' (50% before) or 'balance' (50% after)." });
  }

  const artist = db.artists.find((a) => a.id === booking.artistId);
  const totalAmount = booking.quotedPrice || booking.budget;
  if (!totalAmount || totalAmount <= 0) {
    return res.status(400).json({ error: 'Invalid booking amount.' });
  }
  const halfAmount = Math.round(totalAmount * 0.5);

  if (milestone === 'advance') {
    if (booking.status === 'requested') {
      return res.status(400).json({
        error: 'The artist has not accepted or quoted this booking request yet. 50% advance payment is only enabled after the artist reviews and accepts your booking.',
      });
    }
    if (!['quoted', 'accepted'].includes(booking.status)) {
      return res.status(400).json({
        error: 'Advance payment is only enabled after the artist reviews and accepts or quotes the booking.',
      });
    }
    if (booking.paymentStatus === 'advance_paid' || booking.paymentStatus === 'fully_paid') {
      return res.status(400).json({ error: 'Advance payment has already been completed.' });
    }
  } else if (milestone === 'balance') {
    if (booking.paymentStatus !== 'advance_paid') {
      return res.status(400).json({ error: '50% advance must be paid before balance can be settled.' });
    }
    if (booking.paymentStatus === 'fully_paid') {
      return res.status(400).json({ error: 'Booking is already fully paid.' });
    }
    if (booking.status !== 'completed' && req.user.role !== 'admin') {
      return res.status(400).json({ error: 'Balance can only be paid after the performance is completed.' });
    }
  }

  const paymentRecord = {
    id: newId(),
    bookingId: booking.id,
    customerId: req.user.id,
    artistId: booking.artistId,
    milestone,
    paymentMethod,
    amount: halfAmount,
    transactionRef: `GA-TXN-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
    status: 'success',
    createdAt: now(),
  };

  await saveItem('payments', paymentRecord);

  if (milestone === 'advance') {
    booking.paymentStatus = 'advance_paid';
    booking.paidAmount = halfAmount;
    booking.balanceAmount = totalAmount - halfAmount;
    // Auto-confirm booking if quoted or accepted
    if (['quoted', 'accepted'].includes(booking.status)) {
      booking.status = 'confirmed';
    }
    booking.updatedAt = now();

    await updateById('bookings', booking.id, booking);

    // Notifications
    await saveItem('notifications', {
      id: newId(),
      userId: req.user.id,
      type: 'payment_success',
      message: `💳 50% Advance Payment Successful: ₹${halfAmount.toLocaleString()} paid via ${paymentMethod}. Booking confirmed! Ref: ${paymentRecord.transactionRef}`,
      isRead: false,
      createdAt: now(),
    });

    if (artist?.userId) {
      await saveItem('notifications', {
        id: newId(),
        userId: artist.userId,
        type: 'advance_received',
        message: `💰 Advance Received: 50% deposit of ₹${halfAmount.toLocaleString()} paid by ${req.user.name}. Date secured for ${booking.eventDate}!`,
        isRead: false,
        createdAt: now(),
      });
    }
  } else if (milestone === 'balance') {
    booking.paymentStatus = 'fully_paid';
    booking.paidAmount = totalAmount;
    booking.balanceAmount = 0;
    booking.updatedAt = now();

    await updateById('bookings', booking.id, booking);

    // Notifications
    await saveItem('notifications', {
      id: newId(),
      userId: req.user.id,
      type: 'payment_success',
      message: `🎉 Final 50% Balance Payment Successful: ₹${halfAmount.toLocaleString()} paid. Total ₹${totalAmount.toLocaleString()} settled. Ref: ${paymentRecord.transactionRef}`,
      isRead: false,
      createdAt: now(),
    });

    if (artist?.userId) {
      await saveItem('notifications', {
        id: newId(),
        userId: artist.userId,
        type: 'balance_received',
        message: `💵 Final Balance Payout Released: ₹${halfAmount.toLocaleString()} received. Performance completely settled!`,
        isRead: false,
        createdAt: now(),
      });
    }
  }

  res.json({
    success: true,
    message: `${milestone === 'advance' ? '50% Advance' : '50% Balance'} payment completed successfully.`,
    payment: paymentRecord,
    booking: enrichBooking(booking),
  });
});

// ── Mutual Agreement Direct Chat Endpoints ───────────────────

// POST /api/bookings/:id/chat/request - Request or agree to chat
router.post('/:id/chat/request', authenticate, async (req, res) => {
  const booking = db.bookings.find((b) => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });

  const artist = db.artists.find((a) => a.id === booking.artistId);
  const isOwner = booking.customerId === req.user.id;
  const isArtist = artist && artist.userId === req.user.id;

  if (!isOwner && !isArtist) return res.status(403).json({ error: 'Access denied.' });

  const participantRole = isOwner ? 'customer' : 'artist';
  const otherUserId = isOwner ? artist?.userId : booking.customerId;

  if (booking.chatEnabled) {
    return res.json({ success: true, chatEnabled: true, message: 'Chat is already active between both parties.' });
  }

  // If the counterpart already requested, auto-agree and unlock chat!
  if (booking.chatRequestedBy && booking.chatRequestedBy !== participantRole) {
    booking.chatEnabled = true;
    booking.chatRequestedBy = 'both';
    booking.updatedAt = now();

    await updateById('bookings', booking.id, booking);

    // Notify other party
    if (otherUserId) {
      await saveItem('notifications', {
        id: newId(),
        userId: otherUserId,
        type: 'chat_unlocked',
        message: `💬 Chat Connected! ${req.user.name} accepted your chat request. You can now chat directly!`,
        isRead: false,
        createdAt: now(),
      });
    }

    return res.json({
      success: true,
      chatEnabled: true,
      message: 'Both parties agreed! Chat has been unlocked.',
      booking: enrichBooking(booking),
    });
  }

  // First request by this party
  booking.chatRequestedBy = participantRole;
  booking.updatedAt = now();

  await updateById('bookings', booking.id, booking);

  if (otherUserId) {
    const existingNotif = db.notifications.find(
      (n) => n.userId === otherUserId && n.type === 'chat_request' && !n.isRead && n.message.includes(booking.id.slice(0, 8))
    );
    if (!existingNotif) {
      await saveItem('notifications', {
        id: newId(),
        userId: otherUserId,
        type: 'chat_request',
        message: `💬 Direct Chat Request: ${req.user.name} wants to connect with you for booking #${booking.id.slice(0, 8)}. Click to accept!`,
        isRead: false,
        createdAt: now(),
      });
    }
  }

  res.json({
    success: true,
    chatEnabled: false,
    message: 'Chat request sent! Waiting for counterpart to accept.',
    booking: enrichBooking(booking),
  });
});

// GET /api/bookings/:id/messages - Get booking chat messages
router.get('/:id/messages', authenticate, (req, res) => {
  const booking = db.bookings.find((b) => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });

  const artist = db.artists.find((a) => a.id === booking.artistId);
  const isOwner = booking.customerId === req.user.id;
  const isArtist = artist && artist.userId === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isArtist && !isAdmin) return res.status(403).json({ error: 'Access denied.' });

  const messages = (db.messages || []).filter((m) => m.bookingId === booking.id);
  res.json({ messages });
});

// POST /api/bookings/:id/messages - Send a chat message
router.post('/:id/messages', authenticate, async (req, res) => {
  const booking = db.bookings.find((b) => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });

  const artist = db.artists.find((a) => a.id === booking.artistId);
  const isOwner = booking.customerId === req.user.id;
  const isArtist = artist && artist.userId === req.user.id;

  if (!isOwner && !isArtist) return res.status(403).json({ error: 'Access denied.' });
  if (!booking.chatEnabled) {
    return res.status(403).json({ error: 'Chat is locked until both customer and artist agree to connect.' });
  }

  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Message text cannot be empty.' });
  }

  const message = {
    id: newId(),
    bookingId: booking.id,
    senderId: req.user.id,
    senderRole: isOwner ? 'customer' : 'artist',
    senderName: req.user.name,
    text: text.trim(),
    createdAt: now(),
  };

  await saveItem('messages', message);

  const recipientUserId = isOwner ? artist?.userId : booking.customerId;
  if (recipientUserId) {
    await saveItem('notifications', {
      id: newId(),
      userId: recipientUserId,
      type: 'new_chat_message',
      message: `💬 ${req.user.name}: "${text.trim().slice(0, 60)}${text.trim().length > 60 ? '...' : ''}"`,
      isRead: false,
      createdAt: now(),
    });
  }

  res.status(201).json({ message });
});

// POST /api/bookings/:id/review - Leave review
router.post('/:id/review', authenticate, async (req, res) => {
  const booking = db.bookings.find((b) => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });
  if (booking.customerId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Only the client who created this booking can leave a review.' });
  }

  // Reviews can only be left after the performance has been marked completed
  if (booking.status !== 'completed' && req.user.role !== 'admin') {
    return res.status(400).json({ error: 'Reviews can only be submitted after the performance is completed.' });
  }
  booking.hasReview = true;
  await updateById('bookings', booking.id, booking);

  const existing = db.reviews.find((r) => r.bookingId === booking.id);
  if (existing) return res.status(409).json({ error: 'You have already submitted a review for this booking.' });

  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5 stars.' });
  }

  const review = {
    id: newId(),
    bookingId: booking.id,
    customerId: req.user.id,
    customerName: req.user.name,
    customerAadhaarVerified: req.user.aadhaarVerified || false,
    artistId: booking.artistId,
    rating: Number(rating),
    comment: comment || 'Wonderful experience and outstanding performance!',
    isPublished: true,
    createdAt: now(),
    updatedAt: now(),
  };
  await saveItem('reviews', review);

  // Update artist rating
  const artist = db.artists.find((a) => a.id === booking.artistId);
  if (artist) {
    const artistReviews = db.reviews.filter((r) => r.artistId === artist.id && r.isPublished);
    artist.rating = +(artistReviews.reduce((s, r) => s + r.rating, 0) / artistReviews.length).toFixed(1);
    artist.reviewCount = artistReviews.length;
    await updateById('artists', artist.id, { rating: artist.rating, reviewCount: artist.reviewCount });
  }

  res.status(201).json({ review });
});

export default router;
