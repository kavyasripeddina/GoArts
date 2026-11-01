// GoArts AI - AI Matching & Event Planning Routes (Azure Cloud + Gemini Powered)
import express from 'express';
import { db } from '../db/inMemoryDb.js';
import { isMongoConnected } from '../db/mongo.js';
import { planEventWithGemini, chatWithGemini } from '../services/geminiService.js';
import {
  planEventWithAzureOpenAI,
  callAzureOpenAI,
  analyzeImageWithAzureVision,
  geocodeVenueWithAzureMaps,
  calculateArtistTravelLogistics,
  processPerformanceReel,
  getAzureServicesHealth,
} from '../services/azureServices.js';

const router = express.Router();

// ── Cloud Status Check (Azure Services + MongoDB Atlas + Gemini) ──
router.get('/cloud-status', (req, res) => {
  const azure = getAzureServicesHealth();
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY);
  const mongoAtlas = isMongoConnected();

  res.json({
    status: 'operational',
    cloudProvider: 'Microsoft Azure & MongoDB Atlas',
    database: {
      provider: 'MongoDB Atlas',
      connected: mongoAtlas,
      mode: mongoAtlas ? 'Cloud Persistent (Atlas / MONGODB_URI)' : 'In-Memory Fallback',
    },
    services: {
      ...azure,
      geminiAPI: {
        name: 'Google Gemini AI (Fallback / Alternative LLM Engine)',
        configured: geminiConfigured,
      },
    },
    activeDeployment: {
      frontend: 'Vercel Ready',
      backend: 'Render Ready',
      database: 'MongoDB Atlas Ready',
      cloudAI: 'Azure OpenAI & Azure Cognitive Services Ready',
    },
  });
});

// ── Azure AI Vision: Image Analysis & Performer Photo Verification ──
router.post('/vision/analyze', async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) {
    return res.status(400).json({ error: 'Image URL or base64 data required.' });
  }
  try {
    const analysis = await analyzeImageWithAzureVision(imageUrl);
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: 'Vision analysis failed.', message: err.message });
  }
});

// ── Azure Maps: Venue Geocoding & Search ──
router.get('/maps/search', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'Query parameter required.' });
  try {
    const geocode = await geocodeVenueWithAzureMaps(query);
    res.json(geocode);
  } catch (err) {
    res.status(500).json({ error: 'Azure Maps geocoding failed.', message: err.message });
  }
});

// ── Azure Maps: Travel Logistics & Outstation Calculation ──
router.get('/maps/logistics', async (req, res) => {
  const { artistCity, venueCity } = req.query;
  try {
    const logistics = await calculateArtistTravelLogistics(artistCity, venueCity);
    res.json(logistics);
  } catch (err) {
    res.status(500).json({ error: 'Logistics calculation failed.', message: err.message });
  }
});

// ── Azure Media Services: Performance Reel Processing ──
router.post('/media/reel-info', async (req, res) => {
  const { reelUrl, artistInfo } = req.body;
  if (!reelUrl) return res.status(400).json({ error: 'reelUrl is required.' });
  try {
    const mediaProfile = await processPerformanceReel(reelUrl, artistInfo || {});
    res.json(mediaProfile);
  } catch (err) {
    res.status(500).json({ error: 'Media processing failed.', message: err.message });
  }
});

// ── AI Artist Matching Engine (Rule-based with Gemini fallback) ──────
const scoreArtist = (artist, requirements) => {
  let score = 0;
  const reasons = [];
  const gaps = [];

  // Category compatibility (30 pts)
  if (requirements.category && artist.category.toLowerCase() === requirements.category.toLowerCase()) {
    score += 30;
    reasons.push(`Perfect category match: ${artist.category}`);
  } else if (requirements.category) {
    gaps.push(`Requested ${requirements.category}, artist is ${artist.category}`);
    return null; // Hard filter: category mismatch
  }

  // Budget fit (25 pts)
  if (requirements.budget) {
    const budget = Number(requirements.budget);
    if (artist.startingPrice <= budget) {
      const ratio = artist.startingPrice / budget;
      if (ratio <= 0.7) { score += 25; reasons.push('Excellent budget fit'); }
      else if (ratio <= 0.9) { score += 18; reasons.push('Good budget fit'); }
      else { score += 10; reasons.push('Within budget'); }
    } else {
      gaps.push(`Starting price ₹${artist.startingPrice.toLocaleString('en-IN')} exceeds your budget`);
      return null; // Hard filter: over budget
    }
  }

  // Location (15 pts)
  if (requirements.city && artist.city.toLowerCase() === requirements.city.toLowerCase()) {
    score += 15;
    reasons.push('Based in your city');
  } else if (requirements.city) {
    score += 5;
    reasons.push('Willing to travel');
  }

  // Language (15 pts)
  if (requirements.language) {
    const langs = (artist.languages || []).map((l) => l.toLowerCase());
    if (langs.includes(requirements.language.toLowerCase())) {
      score += 15;
      reasons.push(`Performs in ${requirements.language}`);
    } else {
      score += 0;
      gaps.push(`Does not perform in ${requirements.language}`);
    }
  }

  // Event type compatibility (10 pts)
  if (requirements.eventType) {
    const et = (artist.eventTypes || []).map((e) => e.toLowerCase());
    if (et.some((e) => e.includes(requirements.eventType.toLowerCase()) || requirements.eventType.toLowerCase().includes(e))) {
      score += 10;
      reasons.push(`Experienced with ${requirements.eventType}`);
    }
  }

  // Rating bonus (5 pts)
  if (artist.rating >= 4.7) { score += 5; reasons.push('Highly rated'); }
  else if (artist.rating >= 4.3) { score += 3; }

  return { score, reasons, gaps };
};

// POST /api/ai/match - Artist matching
router.post('/match', (req, res) => {
  const { eventType, city, budget, date, language, audienceSize, category, duration } = req.body;

  if (!eventType && !category) {
    return res.status(400).json({ error: 'Please provide at least an event type or performer category.' });
  }

  const requirements = { eventType, city, budget, date, language, audienceSize, category, duration };

  // Check date availability
  const availableArtists = db.artists.filter((a) => {
    if (a.status !== 'approved') return false;
    if (date && a.unavailableDates?.includes(date)) return false;
    // Check no confirmed booking on this date
    const hasConflict = db.bookings.some((b) => b.artistId === a.id && b.eventDate === date && b.status === 'confirmed');
    return !hasConflict;
  });

  const scored = availableArtists
    .map((artist) => {
      const result = scoreArtist(artist, requirements);
      if (!result) return null;
      return { artist, score: result.score, reasons: result.reasons, gaps: result.gaps };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  // Generate summary
  const summary = {
    totalMatched: scored.length,
    eventType,
    city,
    budget: budget ? `₹${Number(budget).toLocaleString('en-IN')}` : 'Not specified',
    date,
    language,
    category,
  };

  res.json({ matches: scored, summary, source: 'rule-based-engine' });
});

// Helper to attach real matching artists from db to any plan
const attachArtistRecommendations = (suggestedCategories, budget) => {
  const artistRecommendations = [];
  const cats = (suggestedCategories && suggestedCategories.length > 0) ? suggestedCategories : ['Singer'];
  for (const cat of cats.slice(0, 3)) {
    const matches = (db.artists || []).filter((a) => {
      if (a.status !== 'approved') return false;
      const artistCat = (a.category || '').toLowerCase();
      const targetCat = cat.toLowerCase();
      if (!artistCat.includes(targetCat) && !targetCat.includes(artistCat)) return false;
      if (budget && a.startingPrice > Number(budget) / Math.max(cats.length, 1)) return false;
      return true;
    }).sort((a, b) => b.rating - a.rating).slice(0, 2);

    artistRecommendations.push({ category: cat, artists: matches });
  }
  return artistRecommendations;
};

// POST /api/ai/plan - AI Event Planner (Azure OpenAI + Gemini + Rule-based Fallback)
router.post('/plan', async (req, res) => {
  const { description, eventType, city, budget, date, audienceSize, language } = req.body;

  if (!description && !eventType) {
    return res.status(400).json({ error: 'Please describe your event or provide event type.' });
  }

  // 1. Try Azure OpenAI Planner First (GPT-4o / GPT-3.5)
  try {
    const azurePlan = await planEventWithAzureOpenAI({
      description,
      eventType,
      city,
      budget,
      date,
      audienceSize,
      language,
    });
    if (azurePlan && (azurePlan.theme || azurePlan.recommendedArtists)) {
      const categories = (azurePlan.recommendedArtists || []).map((a) => a.category).filter(Boolean);
      const suggestedCategories = categories.length ? categories : ['Singer', 'DJ'];
      const plan = {
        interpretedRequirements: {
          eventType: eventType || 'Celebration',
          city: city || 'Hyderabad',
          budget: budget ? `₹${Number(budget).toLocaleString('en-IN')}` : '₹1,50,000',
          audienceSize: audienceSize || 200,
          date: date || 'Upcoming',
        },
        suggestedCategories,
        artistRecommendations: attachArtistRecommendations(suggestedCategories, budget || 150000),
        budgetAllocation: Object.entries(azurePlan.budgetAllocation || {}).map(([category, allocated]) => ({
          category,
          allocated,
          note: 'Optimized via Azure OpenAI',
        })),
        timeline: (azurePlan.runOfShowTimeline || []).map((t) => ({
          time: t.time || 'TBD',
          task: `${t.segment || ''}: ${t.activity || ''}`,
        })),
        technicalRequirements: [
          'Professional PA system and stage lighting',
          'Direct input boxes and microphones per performer rider',
          'Artist green room hospitality and staging',
        ],
        assumptions: azurePlan.curatorTips || ['Curated via Azure OpenAI GPT engine'],
        source: 'azure-openai',
      };
      return res.json({ plan });
    }
  } catch {
    // Continue to Gemini
  }

  // 2. Try Gemini AI Planner Second
  try {
    const geminiResult = await planEventWithGemini({
      description,
      eventType,
      city,
      budget,
      date,
      audienceSize,
      language,
      availableArtists: db.artists,
    });

    if (geminiResult && geminiResult.plan) {
      const plan = geminiResult.plan;
      // Ensure real database artists are attached
      plan.artistRecommendations = attachArtistRecommendations(plan.suggestedCategories, budget);
      return res.json({ plan });
    }
  } catch {
    // Silently fall through to rule-based fallback without leaking errors
  }

  // 2. Rule-Based Planner Fallback
  const desc = (description || '').toLowerCase();

  // Detect event type
  let detectedEventType = eventType;
  if (!detectedEventType || detectedEventType === '__custom__') {
    if (desc.includes('wedding') || desc.includes('marriage') || desc.includes('reception')) detectedEventType = 'Wedding';
    else if (desc.includes('college') || desc.includes('university') || desc.includes('fest')) detectedEventType = 'College Festival';
    else if (desc.includes('corporate') || desc.includes('company') || desc.includes('office')) detectedEventType = 'Corporate Event';
    else if (desc.includes('birthday') || desc.includes('party')) detectedEventType = 'Birthday Party';
    else if (desc.includes('concert') || desc.includes('music festival')) detectedEventType = 'Concert';
    else if (desc.includes('government') || desc.includes('cultural')) detectedEventType = 'Cultural Event';
    else if (desc.includes('brand') || desc.includes('launch') || desc.includes('product')) detectedEventType = 'Brand Launch';
    else detectedEventType = 'Celebration';
  }

  // Detect city
  const cities = ['hyderabad', 'bengaluru', 'bangalore', 'chennai', 'mumbai', 'delhi', 'pune', 'kolkata'];
  let detectedCity = city;
  if (!detectedCity || detectedCity === '__custom__') {
    detectedCity = cities.find((c) => desc.includes(c));
    if (detectedCity === 'bangalore') detectedCity = 'bengaluru';
    if (detectedCity) detectedCity = detectedCity.charAt(0).toUpperCase() + detectedCity.slice(1);
  }

  // Detect audience size
  let detectedAudience = audienceSize;
  if (!detectedAudience) {
    const numMatch = desc.match(/(\d[\d,]*)\s*(people|students|guests|audience|attendees)/);
    if (numMatch) detectedAudience = parseInt(numMatch[1].replace(',', ''), 10);
  }

  // Detect budget
  let detectedBudget = budget;
  if (!detectedBudget) {
    const budgetMatch = desc.match(/(?:₹|rs\.?|inr)?\s*(\d[\d,]*)\s*(?:lakh|lakhs|k|thousand)?/i);
    if (budgetMatch) {
      let b = parseInt(budgetMatch[1].replace(',', ''), 10);
      if (desc.includes('lakh')) b *= 100000;
      else if (desc.includes('k') || desc.includes('thousand')) b *= 1000;
      detectedBudget = b;
    }
  }

  // Detect language
  const langMap = { telugu: 'Telugu', hindi: 'Hindi', tamil: 'Tamil', kannada: 'Kannada', english: 'English', gujarati: 'Gujarati' };
  let detectedLanguage = language;
  if (!detectedLanguage) {
    for (const [k, v] of Object.entries(langMap)) {
      if (desc.includes(k)) { detectedLanguage = v; break; }
    }
  }

  // Detect performer categories needed
  const suggestedCategories = [];
  if (desc.includes('singer') || desc.includes('vocalist') || desc.includes('singing') || desc.includes('music')) suggestedCategories.push('Singer');
  if (desc.includes('band') || desc.includes('live music')) suggestedCategories.push('Band');
  if (desc.includes('dj') || desc.includes('disc jockey') || desc.includes('electronic')) suggestedCategories.push('DJ');
  if (desc.includes('dance') || desc.includes('dancer')) suggestedCategories.push('Dancer');
  if (desc.includes('comedy') || desc.includes('comedian') || desc.includes('stand-up')) suggestedCategories.push('Comedian');
  if (desc.includes('magic') || desc.includes('illusionist')) suggestedCategories.push('Magician');
  if (desc.includes('classical') || desc.includes('sitar') || desc.includes('instrument')) suggestedCategories.push('Instrumentalist');
  if (desc.includes('cultural') || desc.includes('folk') || desc.includes('troupe')) suggestedCategories.push('Cultural Troupe');

  if (suggestedCategories.length === 0) {
    if (detectedEventType === 'Wedding') suggestedCategories.push('Singer', 'DJ');
    else if (detectedEventType === 'College Festival') suggestedCategories.push('Band', 'DJ', 'Comedian');
    else if (detectedEventType === 'Corporate Event') suggestedCategories.push('Singer', 'Comedian');
    else suggestedCategories.push('Singer');
  }

  // Budget allocation
  const totalBudget = Number(detectedBudget) || 100000;
  const budgetAllocation = [];
  const perCat = Math.round(totalBudget * 0.7 / Math.max(suggestedCategories.length, 1));
  suggestedCategories.forEach((cat) => {
    budgetAllocation.push({ category: cat, allocated: perCat, note: 'Artist performance honorarium' });
  });
  budgetAllocation.push({ category: 'Sound & Lighting', allocated: Math.round(totalBudget * 0.15), note: 'Technical rider setup' });
  budgetAllocation.push({ category: 'Stage Management & Contingency', allocated: Math.round(totalBudget * 0.15), note: 'Logistics and coordination' });

  // Event timeline
  const timeline = [
    { time: 'T-8 weeks', task: 'Confirm event date and venue. Book headliner artist on GoArts.' },
    { time: 'T-6 weeks', task: 'Book supporting performers and confirm stage technical requirements.' },
    { time: 'T-4 weeks', task: 'Finalize guest list and coordinate setlist with artists.' },
    { time: 'T-2 weeks', task: 'Sound check schedules and travel logistics finalized.' },
    { time: 'T-1 week', task: 'Final confirmations and runsheet shared with stage crew.' },
    { time: 'Event Day', task: 'Artist arrival, sound check, stage performance, and milestone release.' },
  ];

  const plan = {
    interpretedRequirements: {
      eventType: detectedEventType || 'Celebration',
      city: detectedCity || 'Not specified',
      budget: detectedBudget ? `₹${Number(detectedBudget).toLocaleString('en-IN')}` : 'Not specified',
      audienceSize: detectedAudience || 'Not specified',
      language: detectedLanguage || 'Not specified',
      date: date || 'Not specified',
    },
    suggestedCategories,
    artistRecommendations: attachArtistRecommendations(suggestedCategories, totalBudget),
    budgetAllocation,
    timeline,
    technicalRequirements: [
      'Professional PA system (appropriate for audience size)',
      'Stage lighting and follow-spots',
      'Artist green room / hospitality rider',
      'Backup power supply and generator backup',
      suggestedCategories.includes('DJ') ? 'DJ console with pioneer mixer and CDJs' : null,
      'Microphones and direct input boxes per artist spec',
    ].filter(Boolean),
    assumptions: [
      'Budget allocations are estimates subject to final artist quote.',
      'All price estimates are before platform commission (15%).',
    ],
    source: 'rule-based-planner (fallback)',
  };

  res.json({ plan });
});

// POST /api/ai/chat - AI Chat Assistant (Azure OpenAI + Gemini + Rule-based Fallback)
router.post('/chat', async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  // 1. Try Azure OpenAI Assistant First
  try {
    const azureRes = await callAzureOpenAI([
      {
        role: 'system',
        content:
          'You are the chief AI entertainment curator for GoArts (goarts.ai). You help clients book verified Indian singers, bands, dancers, DJs, and comedians. Provide crisp, engaging, and knowledgeable responses with Indian Rupee (₹) pricing, escrow protections, and artist suggestions.',
      },
      { role: 'user', content: message.trim() },
    ]);
    if (azureRes?.content) {
      return res.json({
        response: azureRes.content,
        provider: 'azure-openai',
        model: azureRes.model,
        suggestions: ['Find verified singers', 'Plan event with AI', 'Explore open gigs'],
      });
    }
  } catch {
    // Continue to Gemini
  }

  // 2. Try Gemini AI Chat Assistant Second
  try {
    const geminiChat = await chatWithGemini({ message: message.trim() });
    if (geminiChat && geminiChat.response) {
      return res.json(geminiChat);
    }
  } catch {
    // Silently fall through to rule-based fallback
  }

  // 2. Rule-Based Chat Assistant Fallback
  const q = message.toLowerCase();
  let response = '';
  let suggestions = [];

  if (q.includes('price') || q.includes('cost') || q.includes('budget') || q.includes('₹') || q.includes('rs')) {
    const cats = db.artists.filter((a) => a.status === 'approved');
    const priceRange = {};
    cats.forEach((a) => {
      if (!priceRange[a.category]) priceRange[a.category] = { min: a.startingPrice, max: a.startingPrice };
      priceRange[a.category].min = Math.min(priceRange[a.category].min, a.startingPrice);
      priceRange[a.category].max = Math.max(priceRange[a.category].max, a.startingPrice);
    });
    const priceLines = Object.entries(priceRange).map(([cat, r]) => `• ${cat}: ₹${r.min.toLocaleString('en-IN')} – ₹${r.max.toLocaleString('en-IN')}`).join('\n');
    response = `Here are our typical artist price ranges on GoArts AI:\n\n${priceLines}\n\n*Note: Starting rates depend on duration, venue, and date demand. Advance payment is held securely in platform escrow until performance.*`;
    suggestions = ['Find artists within my budget', 'Get a full event plan', 'Book a singer for my wedding'];
  } else if (q.includes('wedding') || q.includes('shaadi') || q.includes('sangeet')) {
    response = 'For weddings and sangeets, we recommend pairing a **live singer or band** for the core ceremony with a **commercial DJ** for the late-night dance floor. Most families allocate ₹1–3 lakhs for musical talent. Would you like me to match top performers for your city?';
    suggestions = ['Find wedding singers', 'Find wedding DJs', 'Plan my full wedding entertainment'];
  } else if (q.includes('college') || q.includes('fest') || q.includes('festival')) {
    response = 'College fests excel with a **headline rock/fusion band or DJ** alongside a **stand-up comedian** opener. Budgets usually range from ₹50,000 for local college fests to ₹5+ lakhs for arena fests. What is your preferred budget and city?';
    suggestions = ['Find bands for college fest', 'Find comedians', 'Use AI Event Planner'];
  } else if (q.includes('corporate') || q.includes('office') || q.includes('gala')) {
    response = 'Corporate galas and annual days shine with polished performers — **classical instrumentalists**, **playback vocalists**, or **clean corporate comedians**. All GoArts artists can be verified with government credentials and stage riders.';
    suggestions = ['Find corporate performers', 'Find clean comedians', 'Browse all artists'];
  } else if (q.includes('how') && (q.includes('book') || q.includes('booking'))) {
    response = '**Booking on GoArts AI is seamless and secure:**\n1. Browse verified artist profiles or post an open event gig\n2. Submit your booking specs or review artist pitches\n3. Agree on the quotation\n4. Pay 50% advance into protected escrow, and 50% balance after the performance!\n\nBoth client and artist identities are verified for total peace of mind.';
    suggestions = ['Browse verified artists', 'Post an event gig', 'How does pricing work?'];
  } else if (q.includes('cancel') || q.includes('refund')) {
    response = 'You can cancel a booking request anytime before the artist confirms without charges. For confirmed bookings, our milestone escrow policy ensures fair protection for both clients and performers.';
    suggestions = ['View my bookings', 'Contact support'];
  } else if (q.includes('singer') || q.includes('vocalist')) {
    const singers = db.artists.filter((a) => a.category === 'Singer' && a.status === 'approved');
    response = `We have ${singers.length} verified singers on GoArts AI, from Bollywood headliners like Sid Sriram and Anirudh Band to classical vocalists. Starting prices from ₹${Math.min(...singers.map((s) => s.startingPrice)).toLocaleString('en-IN')}.`;
    suggestions = ['Browse all singers', 'Find Bollywood singers', 'Find classical singers'];
  } else if (q.includes('dj')) {
    const djs = db.artists.filter((a) => a.category === 'DJ' && a.status === 'approved');
    response = `We feature ${djs.length} verified DJs specializing in EDM, Bollywood, Club, and Punjabi sets. Ideal for weddings, corporate after-parties, and festivals!`;
    suggestions = ['Browse DJs', 'Find wedding DJs', 'Find EDM DJs'];
  } else {
    response = 'Welcome to **GoArts AI Entertainment Advisor**! I can assist you with:\n- Matching headline and emerging artists to your budget\n- Crafting tailored event blueprints (lineup, timeline, budget split)\n- Explaining verified booking guarantees and milestone escrow\n\nWhat kind of celebration are you organizing?';
    suggestions = ['Find artists for my event', 'How much does it cost?', 'How do I book an artist?', 'Plan my event with AI'];
  }

  res.json({
    response,
    suggestions,
    source: 'rule-based-assistant (fallback)',
    timestamp: new Date().toISOString(),
  });
});

// GET /api/ai/talent-score/:artistId - Talent Score
router.get('/talent-score/:artistId', (req, res) => {
  const artist = db.artists.find((a) => a.id === req.params.artistId);
  if (!artist) return res.status(404).json({ error: 'Artist not found.' });

  const reviews = db.reviews.filter((r) => r.artistId === artist.id && r.isPublished);
  const bookings = db.bookings.filter((b) => b.artistId === artist.id);
  const completed = bookings.filter((b) => b.status === 'completed');

  const factors = [];
  let totalScore = 0;
  let maxScore = 0;

  // Profile completeness (20 pts)
  maxScore += 20;
  const profileScore = Math.min(artist.profileScore, 100) * 0.2;
  factors.push({ name: 'Profile Completeness', score: Math.round(profileScore), max: 20, note: `${artist.profileScore}% complete` });
  totalScore += profileScore;

  // Review quality (30 pts)
  maxScore += 30;
  if (reviews.length >= 5) {
    const ratingScore = (artist.rating / 5) * 30;
    factors.push({ name: 'Customer Ratings', score: Math.round(ratingScore), max: 30, note: `${artist.rating}/5 from ${reviews.length} reviews` });
    totalScore += ratingScore;
  } else {
    factors.push({ name: 'Customer Ratings', score: null, max: 30, note: reviews.length > 0 ? `${reviews.length} reviews (need 5+ for full score)` : 'No reviews yet' });
  }

  // Booking completion rate (25 pts)
  maxScore += 25;
  if (bookings.length >= 3) {
    const completionRate = completed.length / bookings.length;
    const compScore = completionRate * 25;
    factors.push({ name: 'Booking Completion Rate', score: Math.round(compScore), max: 25, note: `${completed.length}/${bookings.length} bookings completed` });
    totalScore += compScore;
  } else {
    factors.push({ name: 'Booking Completion Rate', score: null, max: 25, note: 'Need 3+ bookings for this score' });
  }

  // Responsiveness (15 pts)
  maxScore += 15;
  const responseScore = (artist.responseRate / 100) * 15;
  factors.push({ name: 'Response Rate', score: Math.round(responseScore), max: 15, note: `${artist.responseRate}% response rate` });
  totalScore += responseScore;

  // Verification bonus (10 pts)
  maxScore += 10;
  if (artist.verified) {
    factors.push({ name: 'Verified Profile', score: 10, max: 10, note: 'Identity verified by GoArts AI' });
    totalScore += 10;
  } else {
    factors.push({ name: 'Verified Profile', score: 0, max: 10, note: 'Not yet verified' });
  }

  const validFactors = factors.filter((f) => f.score !== null);
  const scoredMax = validFactors.reduce((s, f) => s + f.max, 0);
  const finalScore = scoredMax > 0 ? Math.round((totalScore / scoredMax) * 100) : null;

  res.json({
    artistId: artist.id,
    talentScore: finalScore,
    label: finalScore === null ? 'Insufficient data' : finalScore >= 80 ? 'Excellent' : finalScore >= 65 ? 'Good' : 'Building',
    factors,
    disclaimer: 'This score is based on platform activity data only. It is an indicative metric, not a guarantee of performance quality.',
  });
});

export default router;
