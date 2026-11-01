// GoArts AI - Open Events & Gig Board Routes (Customers post events; Emerging artists apply)
import express from 'express';
import { db, newId, now, saveItem, updateById } from '../db/inMemoryDb.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Helper to enrich event
const enrichEvent = (event) => {
  const customer = (db.users || []).find((u) => u.id === event.customerId);
  const proposals = (db.proposals || []).filter((p) => p.eventId === event.id).map((p) => {
    const artist = (db.artists || []).find((a) => a.id === p.artistId);
    return {
      ...p,
      artist: artist ? {
        id: artist.id,
        displayName: artist.displayName,
        category: artist.category,
        image: artist.image,
        city: artist.city,
        rating: artist.rating,
        reviewCount: artist.reviewCount,
        verified: artist.verified,
        aadhaarVerified: artist.aadhaarVerified,
      } : null,
    };
  });

  return {
    ...event,
    proposalCount: proposals.length,
    proposals,
    customer: customer ? {
      id: customer.id,
      name: customer.name,
      city: customer.city,
      isVerified: customer.isVerified,
      aadhaarVerified: customer.aadhaarVerified,
    } : null,
  };
};

// GET /api/events - Browse open event gig listings
router.get('/', (req, res) => {
  const { category, city, minBudget, maxBudget, search } = req.query;
  let list = (db.events || []).filter((e) => e.status === 'open');

  if (category && category !== 'All') {
    list = list.filter((e) => e.category.toLowerCase() === category.toLowerCase());
  }
  if (city) {
    list = list.filter((e) => (e.city || '').toLowerCase().includes(city.toLowerCase()));
  }
  if (minBudget) {
    list = list.filter((e) => e.budget >= Number(minBudget));
  }
  if (maxBudget) {
    list = list.filter((e) => e.budget <= Number(maxBudget));
  }
  if (search) {
    const q = search.toLowerCase();
    list = list.filter((e) =>
      (e.title || '').toLowerCase().includes(q) ||
      (e.description || '').toLowerCase().includes(q) ||
      (e.category || '').toLowerCase().includes(q)
    );
  }

  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ events: list.map(enrichEvent) });
});

// GET /api/events/my - User's own posted events
router.get('/my', authenticate, (req, res) => {
  const myEvents = (db.events || []).filter((e) => e.customerId === req.user.id);
  myEvents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ events: myEvents.map(enrichEvent) });
});

// POST /api/events - Create an open event gig posting
router.post('/', authenticate, async (req, res) => {
  const { title, category, eventDate, city, venue, budget, description, audienceSize, duration } = req.body;

  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: 'Event title / requirement is required.' });
  }
  if (!category || !String(category).trim() || category === '__custom__') {
    return res.status(400).json({ error: 'Performer category is required.' });
  }
  if (!eventDate || !String(eventDate).trim()) {
    return res.status(400).json({ error: 'Event date is required.' });
  }

  const rawBudget = String(budget || '').replace(/[^0-9.]/g, '');
  const parsedBudget = Number(rawBudget);
  if (!rawBudget || isNaN(parsedBudget) || parsedBudget <= 0) {
    return res.status(400).json({ error: 'Please provide a valid numeric budget in ₹.' });
  }

  const resolvedCity = String(city || req.user.city || 'Hyderabad').trim();
  const eventId = newId();
  const event = {
    id: eventId,
    customerId: req.user.id,
    title: String(title).trim(),
    category: String(category).trim(),
    eventDate: String(eventDate).trim(),
    city: resolvedCity === '__custom__' ? 'Custom City' : resolvedCity,
    venue: String(venue || 'To be decided').trim(),
    budget: parsedBudget,
    description: String(description || '').trim(),
    audienceSize: parseInt(String(audienceSize || '100').replace(/[^0-9]/g, ''), 10) || 100,
    duration: parseInt(String(duration || '3').replace(/[^0-9]/g, ''), 10) || 3,
    status: 'open', // 'open' | 'booked' | 'cancelled'
    acceptedProposalId: null,
    createdAt: now(),
    updatedAt: now(),
  };

  await saveItem('events', event);

  // Notify relevant artists in that category safely
  const matchingArtists = (db.artists || []).filter((a) => {
    if (!a.category) return false;
    const catA = a.category.toLowerCase();
    const catReq = event.category.toLowerCase();
    return catA.includes(catReq) || catReq.includes(catA);
  });

  for (const a of matchingArtists.slice(0, 5)) {
    if (a.userId) {
      await saveItem('notifications', {
        id: newId(),
        userId: a.userId,
        type: 'new_open_gig',
        message: `📢 New Event Gig Alert: "${event.title}" in ${event.city} for ${event.category}. Budget: ₹${event.budget.toLocaleString('en-IN')}. Apply now!`,
        isRead: false,
        createdAt: now(),
      });
    }
  }

  res.status(201).json({ event: enrichEvent(event) });
});

// GET /api/events/:id - Get specific event details
router.get('/:id', (req, res) => {
  const event = (db.events || []).find((e) => e.id === req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found.' });
  res.json({ event: enrichEvent(event) });
});

// POST /api/events/:id/proposals - Artist applies/pitches to perform at the event
router.post('/:id/proposals', authenticate, requireRole('artist'), async (req, res) => {
  const event = (db.events || []).find((e) => e.id === req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found.' });
  if (event.status !== 'open') return res.status(400).json({ error: 'This event gig is no longer accepting proposals.' });

  const artist = (db.artists || []).find((a) => a.userId === req.user.id);
  if (!artist) return res.status(404).json({ error: 'Artist profile not found.' });

  // Check if artist already applied
  const existing = (db.proposals || []).find((p) => p.eventId === event.id && p.artistId === artist.id);
  if (existing) {
    return res.status(409).json({ error: 'You have already submitted a proposal for this event.' });
  }

  const { quoteAmount, pitchMessage, artistLocation } = req.body;
  if (!quoteAmount) return res.status(400).json({ error: 'Quote amount is required.' });

  const proposal = {
    id: newId(),
    eventId: event.id,
    artistId: artist.id,
    quoteAmount: Number(quoteAmount),
    pitchMessage: pitchMessage || `Hi, I am thrilled to perform at your event! You can check my profile and ratings.`,
    artistLocation: artistLocation ? artistLocation.trim() : (artist.city || ''),
    status: 'pending', // 'pending' | 'accepted' | 'declined'
    createdAt: now(),
  };

  await saveItem('proposals', proposal);

  // Notify customer
  await saveItem('notifications', {
    id: newId(),
    userId: event.customerId,
    type: 'new_gig_proposal',
    message: `🎤 New Artist Pitch: ${artist.displayName} applied to perform at "${event.title}" for ₹${Number(quoteAmount).toLocaleString()}!`,
    isRead: false,
    createdAt: now(),
  });

  res.status(201).json({ proposal, message: 'Proposal submitted successfully!' });
});

// PUT /api/events/:id/proposals/:proposalId/accept - Customer/Creator accepts artist proposal
router.put('/:id/proposals/:proposalId/accept', authenticate, async (req, res) => {
  const event = (db.events || []).find((e) => e.id === req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found.' });
  if (event.customerId !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied.' });

  const proposal = (db.proposals || []).find((p) => p.id === req.params.proposalId && p.eventId === event.id);
  if (!proposal) return res.status(404).json({ error: 'Proposal not found.' });

  await updateById('proposals', proposal.id, { status: 'accepted' });
  await updateById('events', event.id, { status: 'booked', acceptedProposalId: proposal.id });

  // Create confirmed booking automatically
  const artist = (db.artists || []).find((a) => a.id === proposal.artistId);
  const bookingId = newId();
  const numPrice = Number(proposal.quoteAmount);
  const comm = Math.round(numPrice * 0.15);

  const newBooking = {
    id: bookingId,
    customerId: req.user.id,
    artistId: proposal.artistId,
    status: 'quoted', // Client can immediately pay 50% advance to confirm!
    paymentStatus: 'unpaid',
    paidAmount: 0,
    balanceAmount: numPrice,
    chatEnabled: true, // Auto-enable chat since mutual proposal was accepted!
    chatRequestedBy: 'both',
    eventType: event.title,
    eventDate: event.eventDate,
    eventLocation: { city: event.city, venue: event.venue, address: event.venue },
    budget: event.budget,
    quotedPrice: numPrice,
    platformCommission: comm,
    artistEarnings: numPrice - comm,
    duration: event.duration || 3,
    audienceSize: event.audienceSize || 100,
    languagePreference: '',
    specialRequirements: event.description,
    artistNote: proposal.pitchMessage,
    cancelReason: null,
    createdAt: now(),
    updatedAt: now(),
  };

  await saveItem('bookings', newBooking);

  // Notify artist
  if (artist && artist.userId) {
    await saveItem('notifications', {
      id: newId(),
      userId: artist.userId,
      type: 'gig_accepted',
      message: `🎉 Proposal Accepted! Your pitch for "${event.title}" was accepted by ${req.user.name}. Booking created!`,
      isRead: false,
      createdAt: now(),
    });
  }

  res.json({
    success: true,
    message: 'Proposal accepted and booking created!',
    event: enrichEvent(event),
    bookingId,
  });
});

export default router;
