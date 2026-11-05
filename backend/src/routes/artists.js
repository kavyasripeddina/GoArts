// GoArts AI - Artist Routes
import express from 'express';
import { db, newId, now, findById, updateById, saveItem } from '../db/inMemoryDb.js';
import { findDocInMongo, isMongoConnected } from '../db/mongo.js';
import { authenticate, requireArtist } from '../middleware/auth.js';

const router = express.Router();

const HEADLINE_ESTABLISHED_NAMES = [
  'The Anirudh Band - Rockstar Live Experience',
  'Poorna Dance Troupe - Cinematic & Classical Fusion',
  'Sid Sriram - Soul & Carnatic Live',
  'DSP Live Arena Band - Rockstar Devi Sri Prasad',
];

// ── Helpers ────────────────────────────────────────────────
const enrichArtist = (artist) => {
  const user = db.users.find((u) => u.id === artist.userId);
  const reviews = db.reviews.filter((r) => r.artistId === artist.id && r.isPublished);
  const reviewCount = reviews.length > 0 ? reviews.length : (artist.reviewCount || 0);
  const avgRating = reviews.length > 0
    ? +(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : (reviewCount > 0 ? (artist.rating || 0) : 0);

  // Check if artist is newly created with no verified bookings
  const isNewlyRegistered = (artist.completedBookings || 0) === 0 && (artist.totalBookings || 0) === 0 && reviews.length === 0;

  // Prioritize explicit artistTier set by Admin governance. Fallback to baseline default only if unset.
  const tier = artist.artistTier ? artist.artistTier : (HEADLINE_ESTABLISHED_NAMES.includes(artist.displayName) ? 'established' : 'emerging');
  const isEstablished = tier === 'established';

  // Lookup latest verification dossier for this artist/user
  const latestVerif = (db.verifications || []).find((v) => v.artistId === artist.id || v.userId === artist.userId);
  const adminNotes = artist.adminVerificationNotes || latestVerif?.adminNotes || '';

  // Determine authoritative verification status
  let verifStatus = artist.verificationStatus || latestVerif?.status || 'unverified';
  let isVerif = Boolean(artist.verified || artist.aadhaarVerified || user?.aadhaarVerified);

  if (verifStatus === 'rejected' || latestVerif?.status === 'rejected') {
    verifStatus = 'rejected';
    isVerif = false;
  } else if (verifStatus === 'needs_info' || latestVerif?.status === 'needs_info') {
    verifStatus = 'needs_info';
  } else if (verifStatus === 'under_review' || verifStatus === 'pending_review' || latestVerif?.status === 'under_review' || latestVerif?.status === 'pending_review') {
    verifStatus = 'under_review';
  } else if (tier === 'established' && (verifStatus === 'celebrity_verified' || isVerif)) {
    verifStatus = 'celebrity_verified';
    isVerif = true;
  } else if (verifStatus === 'verified' || isVerif) {
    verifStatus = 'verified';
    isVerif = true;
  } else {
    verifStatus = 'unverified';
  }

  // Separate evaluation metrics for Established vs Emerging artists
  const defaultEvaluationMetrics = isEstablished
    ? {
        identityScore: isVerif ? 100 : 40,
        recognition: 'National & Film Industry Recognized / Top Chart Performer',
        officialPresence: {
          verifiedSocial: isVerif,
          instagram: artist.socialLinks?.instagram || '@official_' + (artist.displayName?.split(' ')[0] || '').toLowerCase(),
          spotify: 'Verified Official Artist (5M+ Monthly Listeners)',
          streamsCount: '50M+ Verified Plays',
        },
        performanceScale: 'Arena Concerts & Stadium Tours (1,000 - 50,000 capacity)',
        pastPerformances: '500+ Headline Shows & Mega Festivals Worldwide',
        popularityIndex: 98,
      }
    : {
        talentScore: isNewlyRegistered ? 80 : (artist.evaluationMetrics?.talentScore || Math.min(96, Math.max(82, Math.round(76 + (artist.experience || 3) * 3 + (avgRating > 0 ? avgRating * 3 : 6))))),
        audienceEngagement: isNewlyRegistered ? 0 : (artist.evaluationMetrics?.audienceEngagement || (reviewCount > 0 ? 96 : 91)),
        repertoireBreadth: 'Multi-genre Repertoire (Live Vocals, Acoustic, Covers & Fusion)',
        skillLevel: 'Advanced Conservatoire & Stage Performer',
        liveGigsCount: isNewlyRegistered ? 0 : (artist.completedBookings || artist.totalBookings || (reviewCount > 0 ? reviewCount + 12 : 0)),
        reviewScore: isNewlyRegistered ? 0 : avgRating,
        portfolioReels: artist.evaluationMetrics?.portfolioReels || ['Live Stage Performance Reel', 'Acoustic Studio Session'],
      };

  return {
    ...artist,
    rating: isNewlyRegistered ? 0 : avgRating,
    reviewCount: isNewlyRegistered ? 0 : reviewCount,
    totalBookings: artist.totalBookings || 0,
    completedBookings: artist.completedBookings || 0,
    artistTier: tier,
    verificationStatus: verifStatus,
    adminVerificationNotes: adminNotes,
    verificationRecord: latestVerif ? {
      id: latestVerif.id,
      status: latestVerif.status,
      tierRequested: latestVerif.tierRequested,
      verificationTrack: latestVerif.verificationTrack,
      adminNotes: latestVerif.adminNotes,
      legalName: latestVerif.legalName || user?.name || '',
      idProofType: latestVerif.idProofType || 'Aadhaar (UIDAI)',
      idProofNumber: latestVerif.idProofNumber || '',
      taxOrUtilityProof: latestVerif.taxOrUtilityProof || '',
      managementContact: latestVerif.managementContact || '',
      officialLinks: latestVerif.officialLinks || artist.socialLinks || {},
      pressArticles: latestVerif.pressArticles || [],
      achievements: latestVerif.achievements || artist.bio || '',
      performanceReels: latestVerif.performanceReels || [],
      statementOfAuthenticity: latestVerif.statementOfAuthenticity || '',
      reviewedAt: latestVerif.reviewedAt,
      createdAt: latestVerif.createdAt,
    } : null,
    evaluationMetrics: artist.evaluationMetrics || defaultEvaluationMetrics,
    celebrityClaim: artist.celebrityClaim || false,
    rating: isNewlyRegistered ? 0 : avgRating,
    reviewCount: isNewlyRegistered ? 0 : reviewCount,
    email: user?.email,
    userAvatar: user?.avatar || '',
    verified: isVerif,
    aadhaarVerified: isVerif,
    reviews,
    avgRating,
  };
};

const buildFilter = (query) => {
  const { search, category, city, language, eventType, minPrice, maxPrice, minRating, verified, tier } = query;
  return (a) => {
    if (a.status !== 'approved') return false;
    if (tier && tier !== 'all') {
      const aTier = a.artistTier || (HEADLINE_ESTABLISHED_NAMES.includes(a.displayName) ? 'established' : 'emerging');
      if (aTier !== tier) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      if (!a.displayName.toLowerCase().includes(q) &&
          !a.category.toLowerCase().includes(q) &&
          !(a.genres || []).some((g) => g.toLowerCase().includes(q)) &&
          !a.city.toLowerCase().includes(q)) return false;
    }
    if (category && category !== 'All' && a.category.toLowerCase() !== category.toLowerCase()) return false;
    if (city && !a.city.toLowerCase().includes(city.toLowerCase())) return false;
    if (language) {
      const langs = (a.languages || []).map((l) => l.toLowerCase());
      if (!langs.includes(language.toLowerCase())) return false;
    }
    if (eventType) {
      const et = (a.eventTypes || []).map((e) => e.toLowerCase());
      const target = eventType.toLowerCase();
      if (!et.some((e) => e.includes(target) || target.includes(e))) return false;
    }
    if (minPrice && a.startingPrice < Number(minPrice)) return false;
    if (maxPrice && a.startingPrice > Number(maxPrice)) return false;
    if (minRating && a.rating < Number(minRating)) return false;
    if (verified === 'true' && !a.verified && !a.aadhaarVerified) return false;
    return true;
  };
};

// GET /api/artists - List artists (public)
router.get('/', (req, res) => {
  const { sort = 'rating', page = 1, limit = 12, featured } = req.query;
  let artists = db.artists.filter(buildFilter(req.query));

  if (featured === 'true') {
    artists = artists.filter((a) => a.featured);
  }

  // Sort
  if (sort === 'price_asc') artists.sort((a, b) => a.startingPrice - b.startingPrice);
  else if (sort === 'price_desc') artists.sort((a, b) => b.startingPrice - a.startingPrice);
  else if (sort === 'rating') artists.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
  else if (sort === 'popularity') artists.sort((a, b) => b.totalBookings - a.totalBookings);
  else if (sort === 'newest') artists.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const p = Number(page);
  const l = Math.min(Number(limit), 50);
  const total = artists.length;
  const paginated = artists.slice((p - 1) * l, p * l).map(enrichArtist);

  const allApproved = db.artists.filter((a) => a.status === 'approved');
  const establishedCount = allApproved.filter((a) => (a.artistTier ? a.artistTier === 'established' : HEADLINE_ESTABLISHED_NAMES.includes(a.displayName))).length;
  const emergingCount = allApproved.length - establishedCount;

  res.json({
    artists: paginated,
    tierCounts: {
      all: allApproved.length,
      established: establishedCount,
      emerging: emergingCount,
    },
    pagination: { total, page: p, limit: l, pages: Math.ceil(total / l) },
  });
});

// GET /api/artists/leaderboard - Top artists ranking by reviews & ratings (public)
router.get('/leaderboard', (req, res) => {
  const { category, minPrice, maxPrice, limit = 20 } = req.query;
  let list = db.artists.filter((a) => a.status === 'approved');

  if (category && category !== 'All') {
    list = list.filter((a) => a.category.toLowerCase() === category.toLowerCase());
  }
  if (minPrice) list = list.filter((a) => a.startingPrice >= Number(minPrice));
  if (maxPrice) list = list.filter((a) => a.startingPrice <= Number(maxPrice));

  // Rank formula: rating * 100 + reviewCount * 2 + completedBookings
  list.sort((a, b) => {
    const scoreA = (a.rating || 0) * 100 + (a.reviewCount || 0) * 1.5 + (a.completedBookings || 0);
    const scoreB = (b.rating || 0) * 100 + (b.reviewCount || 0) * 1.5 + (b.completedBookings || 0);
    return scoreB - scoreA;
  });

  const ranked = list.slice(0, Number(limit)).map((artist, idx) => ({
    ...enrichArtist(artist),
    rank: idx + 1,
    leaderboardScore: Math.round((artist.rating || 0) * 100 + (artist.reviewCount || 0) * 1.5),
  }));

  res.json({
    category: category || 'All',
    total: ranked.length,
    leaderboard: ranked,
  });
});

// GET /api/artists/categories - Category stats (public)
router.get('/categories', (req, res) => {
  const approved = db.artists.filter((a) => a.status === 'approved');
  const cats = {};
  approved.forEach((a) => {
    cats[a.category] = (cats[a.category] || 0) + 1;
  });
  res.json({ categories: cats });
});

// GET /api/artists/featured - Featured artists (public)
router.get('/featured', (req, res) => {
  const featured = db.artists.filter((a) => a.featured && a.status === 'approved').map(enrichArtist);
  res.json({ artists: featured });
});

// GET /api/artists/my - Current artist's own profile
router.get('/my', authenticate, requireArtist, async (req, res) => {
  let artist = db.artists.find((a) => a.userId === req.user.id);
  
  if (!artist && isMongoConnected()) {
    artist = await findDocInMongo('artists', { userId: req.user.id });
    if (artist) {
      const idx = db.artists.findIndex((a) => a.id === artist.id);
      if (idx === -1) db.artists.push(artist);
      else db.artists[idx] = artist;
    }
  }

  // If still not found and user has artist role, create a verified default artist profile for this specific user
  if (!artist && req.user.role === 'artist') {
    const alreadyExists = db.artists.find((a) => a.userId === req.user.id);
    if (!alreadyExists) {
      artist = {
        id: newId(),
        userId: req.user.id,
        displayName: req.user.name || 'Verified Artist',
        bio: `Professional artist based in ${req.user.city || 'Hyderabad'}. Available for live performances, weddings, and corporate events.`,
        category: 'Singer',
        artistTier: 'emerging',
        verificationStatus: req.user.aadhaarVerified ? 'verified' : 'unverified',
        genres: ['Live Music', 'Acoustic', 'Fusion'],
        languages: ['Telugu', 'Hindi', 'English'],
        city: req.user.city || 'Hyderabad',
        startingPrice: 35000,
        rating: 0,
        reviewCount: 0,
        image: req.user.avatar || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&q=80',
        images: [req.user.avatar || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&q=80'],
        verified: !!req.user.aadhaarVerified,
        aadhaarVerified: !!req.user.aadhaarVerified,
        featured: false,
        status: 'approved',
        eventTypes: ['Wedding', 'Corporate Event', 'Private Party', 'Concert'],
        audienceSize: '50-1000',
        experience: 5,
        tags: ['Live Performer', 'Stage Artist', 'Emerging Talent'],
        profileScore: 85,
        totalBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        responseRate: 100,
        socialLinks: { instagram: '', youtube: '', facebook: '' },
        technicalRequirements: 'PA system, sound monitor, 2 microphones.',
        packages: [
          { name: 'Standard Performance', price: 35000, duration: '2 hours', description: '2-hour energetic live set with sound check.' },
          { name: 'Headline Concert Package', price: 60000, duration: '4 hours', description: 'Full event live show with band/ensemble.' },
        ],
        createdAt: now(),
        updatedAt: now(),
        unavailableDates: [],
      };
      await saveItem('artists', artist);
    } else {
      artist = alreadyExists;
    }
  }

  if (!artist) {
    return res.status(404).json({ error: 'Artist profile not found.' });
  }

  res.json({ artist: enrichArtist(artist) });
});

// POST /api/artists/verify-request - Submit artist verification / established tier credentials
router.post('/verify-request', authenticate, requireArtist, async (req, res) => {
  const {
    verificationTrack = 'regular', // 'regular' (Standard KYC) or 'popular_celebrity' (Instagram-style Authenticity)
    tierRequested = 'emerging',
    officialLinks = {},
    pressArticles = [],
    taxOrUtilityProof = '',
    achievements = '',
    portfolioDocs = [],
    performanceReels = [],
    idProofType = 'Aadhaar (UIDAI)',
    idProofNumber = '',
    idProofDoc = '',
    legalName = '',
    managementContact = '',
    statementOfAuthenticity = '',
  } = req.body;

  let artist = db.artists.find((a) => a.userId === req.user.id);
  if (!artist && isMongoConnected()) {
    artist = await findDocInMongo('artists', { userId: req.user.id });
  }
  if (!artist) {
    return res.status(404).json({ error: 'Artist profile not found.' });
  }

  // Check if there is an existing verification application
  let verifRecord = (db.verifications || []).find((v) => v.artistId === artist.id || v.userId === req.user.id);

  if (verifRecord) {
    // Update existing record
    verifRecord.verificationTrack = verificationTrack;
    verifRecord.tierRequested = tierRequested;
    verifRecord.officialLinks = { ...(verifRecord.officialLinks || {}), ...officialLinks };
    verifRecord.pressArticles = pressArticles.length > 0 ? pressArticles : (verifRecord.pressArticles || []);
    verifRecord.taxOrUtilityProof = taxOrUtilityProof || verifRecord.taxOrUtilityProof || '';
    verifRecord.achievements = achievements || verifRecord.achievements || '';
    verifRecord.portfolioDocs = portfolioDocs.length > 0 ? portfolioDocs : (verifRecord.portfolioDocs || []);
    verifRecord.performanceReels = performanceReels.length > 0 ? performanceReels : (verifRecord.performanceReels || []);
    verifRecord.idProofType = idProofType || verifRecord.idProofType;
    verifRecord.idProofNumber = idProofNumber || verifRecord.idProofNumber || '';
    verifRecord.idProofDoc = idProofDoc || verifRecord.idProofDoc || '';
    verifRecord.legalName = legalName || verifRecord.legalName || req.user.name;
    verifRecord.managementContact = managementContact || verifRecord.managementContact || '';
    verifRecord.statementOfAuthenticity = statementOfAuthenticity || verifRecord.statementOfAuthenticity || '';
    verifRecord.status = 'under_review';
    verifRecord.updatedAt = now();
    verifRecord.auditTrail = verifRecord.auditTrail || [];
    verifRecord.auditTrail.push({
      action: 'resubmitted',
      by: artist.displayName,
      notes: 'Artist updated and resubmitted verification documentation.',
      timestamp: now(),
    });
    await updateById('verifications', verifRecord.id, verifRecord);
  } else {
    // Create fresh record
    verifRecord = {
      id: newId(),
      userId: req.user.id,
      artistId: artist.id,
      artistName: artist.displayName,
      verificationTrack,
      tierRequested,
      officialLinks,
      pressArticles,
      taxOrUtilityProof,
      achievements,
      portfolioDocs,
      performanceReels,
      idProofType,
      idProofNumber,
      idProofDoc,
      legalName: legalName || req.user.name,
      managementContact,
      statementOfAuthenticity,
      status: 'under_review',
      auditTrail: [
        {
          action: 'submitted',
          by: artist.displayName,
          notes: `Submitted ${verificationTrack === 'popular_celebrity' ? 'Popular Celebrity Authenticity' : 'Regular Talent KYC'} application.`,
          timestamp: now(),
        },
      ],
      createdAt: now(),
      updatedAt: now(),
    };
    await saveItem('verifications', verifRecord);
  }

  // Update artist status to under_review
  const updates = {
    verificationStatus: 'under_review',
    artistTier: tierRequested,
    celebrityClaim: tierRequested === 'established' || verificationTrack === 'popular_celebrity',
    socialLinks: {
      ...artist.socialLinks,
      ...officialLinks,
    },
    updatedAt: now(),
  };

  await updateById('artists', artist.id, updates);

  // Notify admin
  const admins = db.users.filter((u) => u.role === 'admin');
  for (const admin of admins) {
    await saveItem('notifications', {
      id: newId(),
      userId: admin.id,
      type: 'verification_request',
      message: `📋 Verification Queue Alert: "${artist.displayName}" submitted ${tierRequested === 'established' ? '👑 Famous & Established Celebrity' : '🚀 Emerging Talent'} verification dossier for manual audit.`,
      isRead: false,
      createdAt: now(),
    });
  }

  res.status(201).json({
    message: 'Verification application submitted successfully. Our Trust & Safety team will review your authenticity dossier.',
    artist: enrichArtist({ ...artist, ...updates }),
    verification: verifRecord,
  });
});

// GET /api/artists/:id - Single artist (public)
router.get('/:id', (req, res) => {
  const artist = db.artists.find((a) => a.id === req.params.id && a.status === 'approved');
  if (!artist) return res.status(404).json({ error: 'Artist not found.' });
  // Increment views (ephemeral in-memory count)
  artist.profileViews = (artist.profileViews || 0) + 1;
  res.json({ artist: enrichArtist(artist) });
});

// PUT /api/artists/my - Update own profile
router.put('/my', authenticate, requireArtist, async (req, res) => {
  let artist = db.artists.find((a) => a.userId === req.user.id);
  if (!artist && isMongoConnected()) {
    artist = await findDocInMongo('artists', { userId: req.user.id });
    if (artist) {
      const idx = db.artists.findIndex((a) => a.id === artist.id);
      if (idx === -1) db.artists.push(artist);
      else db.artists[idx] = artist;
    }
  }

  if (!artist) {
    artist = {
      id: newId(),
      userId: req.user.id,
      displayName: req.user.name || 'Verified Artist',
      bio: '',
      category: 'Singer',
      genres: ['Live Music'],
      languages: ['Telugu', 'Hindi', 'English'],
      city: req.user.city || 'Hyderabad',
      startingPrice: 35000,
      rating: 5.0,
      reviewCount: 0,
      image: '',
      images: [],
      verified: !!req.user.aadhaarVerified,
      aadhaarVerified: !!req.user.aadhaarVerified,
      status: 'approved',
      createdAt: now(),
      updatedAt: now(),
      unavailableDates: [],
    };
  }

  const allowedFields = ['displayName', 'bio', 'category', 'genres', 'languages', 'city',
    'startingPrice', 'image', 'images', 'eventTypes', 'audienceSize', 'experience',
    'tags', 'socialLinks', 'technicalRequirements', 'packages', 'unavailableDates'];

  allowedFields.forEach((f) => {
    if (req.body[f] !== undefined) artist[f] = req.body[f];
  });

  // Recalculate profile score
  let score = 0;
  if (artist.displayName) score += 10;
  if (artist.bio && artist.bio.length > 50) score += 15;
  if (artist.category) score += 10;
  if (artist.genres && artist.genres.length > 0) score += 10;
  if (artist.languages && artist.languages.length > 0) score += 10;
  if (artist.city) score += 5;
  if (artist.startingPrice > 0) score += 10;
  if (artist.image) score += 15;
  if (artist.packages && artist.packages.length > 0) score += 10;
  if (artist.socialLinks && (artist.socialLinks.instagram || artist.socialLinks.youtube)) score += 5;
  artist.profileScore = score;
  artist.updatedAt = now();

  await saveItem('artists', artist);

  res.json({ artist: enrichArtist(artist) });
});

// POST /api/artists/my/availability - Update availability
router.post('/my/availability', authenticate, requireArtist, async (req, res) => {
  let artist = db.artists.find((a) => a.userId === req.user.id);
  if (!artist && isMongoConnected()) {
    artist = await findDocInMongo('artists', { userId: req.user.id });
    if (artist) {
      const idx = db.artists.findIndex((a) => a.id === artist.id);
      if (idx === -1) db.artists.push(artist);
      else db.artists[idx] = artist;
    }
  }

  if (!artist) {
    return res.status(404).json({ error: 'Artist profile not found.' });
  }

  const { unavailableDates } = req.body;
  if (!Array.isArray(unavailableDates)) {
    return res.status(400).json({ error: 'unavailableDates must be an array of date strings.' });
  }
  artist.unavailableDates = unavailableDates;
  artist.updatedAt = now();
  await saveItem('artists', artist);
  res.json({ unavailableDates: artist.unavailableDates });
});

// GET /api/artists/:id/reviews - Artist reviews (public)
router.get('/:id/reviews', (req, res) => {
  const reviews = db.reviews.filter((r) => r.artistId === req.params.id && r.isPublished);
  const enriched = reviews.map((r) => {
    const customer = db.users.find((u) => u.id === r.customerId);
    return { 
      ...r, 
      customerName: r.customerName || customer?.name || 'Verified Customer',
      customerAadhaarVerified: r.customerAadhaarVerified ?? (customer?.aadhaarVerified || false),
    };
  });
  res.json({ reviews: enriched });
});

// POST /api/artists/:id/reviews - Submit review directly for an artist (Requires verified completed booking)
router.post('/:id/reviews', authenticate, async (req, res) => {
  const artist = db.artists.find((a) => a.id === req.params.id);
  if (!artist) return res.status(404).json({ error: 'Artist not found.' });

  // Genuine Review Policy: verify that the user has booked and completed an event with this artist
  const userBookings = db.bookings.filter(
    (b) => b.artistId === artist.id && b.customerId === req.user.id && b.status === 'completed'
  );

  if (userBookings.length === 0 && req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Authentic Review Policy: You can only review an artist after you have completed a verified event booking with them.'
    });
  }

  // Find a completed booking without an existing review if possible
  const eligibleBooking = userBookings.find((b) => !db.reviews.some((r) => r.bookingId === b.id));

  const { rating, comment, eventType } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5 stars.' });
  }

  const review = {
    id: newId(),
    bookingId: eligibleBooking ? eligibleBooking.id : null,
    customerId: req.user.id,
    customerName: req.user.name,
    customerAadhaarVerified: req.user.aadhaarVerified || false,
    artistId: artist.id,
    rating: Number(rating),
    comment: comment || 'Outstanding live performance, very professional and talented artist!',
    eventType: eventType || eligibleBooking?.eventType || 'Live Performance',
    isPublished: true,
    createdAt: now(),
    updatedAt: now(),
  };

  if (eligibleBooking) {
    eligibleBooking.hasReview = true;
    await updateById('bookings', eligibleBooking.id, eligibleBooking);
  }

  await saveItem('reviews', review);

  // Recalculate artist rating & review count
  const artistReviews = db.reviews.filter((r) => r.artistId === artist.id && r.isPublished);
  artist.rating = +(artistReviews.reduce((s, r) => s + r.rating, 0) / artistReviews.length).toFixed(1);
  artist.reviewCount = artistReviews.length;
  await updateById('artists', artist.id, { rating: artist.rating, reviewCount: artist.reviewCount });

  res.status(201).json({ 
    review, 
    artistRating: artist.rating, 
    reviewCount: artist.reviewCount 
  });
});

export default router;
