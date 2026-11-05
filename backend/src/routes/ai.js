// GoArts AI - AI Matching & Event Planning Routes (Azure Cloud + Gemini Powered)
import express from 'express';
import { db, newId, now, saveItem, updateById } from '../db/inMemoryDb.js';
import { isMongoConnected } from '../db/mongo.js';
import { authenticate } from '../middleware/auth.js';
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

    const enrichedMatches = matches.map((a) => {
      const name = a.displayName || a.name || 'Verified Performer';
      const img = a.image || a.images?.[0] || a.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4285F4&color=fff&size=300`;
      return {
        ...a,
        displayName: name,
        stageName: name,
        image: img,
        profileImage: img,
      };
    });

    artistRecommendations.push({ category: cat, artists: enrichedMatches });
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


// POST /api/ai/talent-rating - Compute AI talent rating from artist data
router.post('/talent-rating', async (req, res) => {
  const { artistId, reviews: reqReviews, bookingCount, completedCount, rating: reqRating, responseRate, socialFollowers } = req.body;
  
  // Try to get artist from db if artistId provided
  let artist = null;
  if (artistId) {
    artist = db.artists.find(a => a.id === artistId);
  }

  const realReviews = db.reviews.filter(r => r.artistId === artistId && r.isPublished);
  const realRating = (artist?.reviewCount > 0 && artist?.rating > 0)
    ? Number(artist.rating)
    : (realReviews.length > 0 ? (realReviews.reduce((s, r) => s + r.rating, 0) / realReviews.length) : (Number(reqRating) || 0));

  const totalB = bookingCount !== undefined ? Number(bookingCount) : (artist?.totalBookings || db.bookings.filter(b => b.artistId === artistId).length);
  const compB = completedCount !== undefined ? Number(completedCount) : (artist?.completedBookings || db.bookings.filter(b => b.artistId === artistId && b.status === 'completed').length);

  // Compute honest score components - zero if no activity yet
  const ratingScore = realRating > 0 ? Math.round((realRating / 5) * 30) : 0;
  const completionRate = totalB > 0 ? (compB / totalB) : 0;
  const completionScore = compB > 0 ? Math.round(completionRate * 25) : 0;
  const responseScore = Math.round(((responseRate || artist?.responseRate || 100) / 100) * 15);
  const profileScore = Math.round(((artist?.profileScore || (artist?.bio ? 75 : 40)) / 100) * 20);
  const verificationBonus = (artist?.verified || artist?.aadhaarVerified || artist?.celebrity_verified) ? 10 : 0;
  const socialBonus = socialFollowers > 100000 ? 5 : socialFollowers > 10000 ? 3 : (artist?.socialLinks?.instagram ? 2 : 0);

  const totalScore = Math.min(100, ratingScore + completionScore + responseScore + profileScore + verificationBonus + socialBonus);

  const label = totalScore >= 85 ? 'Exceptional' : totalScore >= 70 ? 'Excellent' : totalScore >= 55 ? 'Good' : totalScore >= 35 ? 'Building' : 'New Talent';

  res.json({
    artistId,
    talentScore: totalScore,
    label,
    isNewAccount: totalB === 0 && realRating === 0,
    breakdown: {
      audienceRating: { 
        score: ratingScore, 
        max: 30, 
        label: realRating > 0 ? `Client Rating (${realRating.toFixed(1)} ⭐)` : 'Client Rating (No reviews yet)', 
        realRating 
      },
      bookingCompletion: { 
        score: completionScore, 
        max: 25, 
        label: compB > 0 ? `Completed Gigs (${compB}/${totalB})` : 'Completed Gigs (0 shows)', 
        completedGigs: compB 
      },
      responsiveness: { score: responseScore, max: 15, label: 'Responsiveness (Active)' },
      profileQuality: { score: profileScore, max: 20, label: 'Profile Quality & Media' },
      verificationBonus: { score: verificationBonus, max: 10, label: verificationBonus > 0 ? 'Verified Identity (Govt / Aadhaar)' : 'Identity Verification Pending' },
      socialPresence: { score: socialBonus, max: 5, label: 'Social Presence & Handles' },
    },
    recommendations: totalScore < 50
      ? ['Complete your artist bio and stage packages', 'Pitch for open gigs to complete your first booking', 'Verify your government identity with Aadhaar to earn 10 bonus points']
      : totalScore < 75
      ? ['Deliver confirmed gigs to accumulate 5-star customer reviews', 'Keep response time under 1 hour to maintain full response score', 'Link verified official social media profiles']
      : ['Congratulations! Your talent score ranks in the top tier on GoArts AI', 'Maintain high booking completion and prompt customer chat replies'],
    source: 'goarts-authentic-ai-rating-engine',
  });
});

// GET /api/ai/audience-analytics/:artistId - Audience analytics for artist
router.get('/audience-analytics/:artistId', (req, res) => {
  const artist = db.artists.find(a => a.id === req.params.artistId);
  if (!artist) return res.status(404).json({ error: 'Artist not found.' });

  const artistName = artist.displayName || artist.name || 'Verified Artist';
  const bookings = db.bookings.filter(b => b.artistId === artist.id);
  const reviews = db.reviews.filter(r => r.artistId === artist.id && r.isPublished);
  const completed = bookings.filter(b => b.status === 'completed');

  // Check if this artist has genuine booking or historical performance data
  const realCompletedCount = completed.length > 0 ? completed.length : (artist.completedBookings || 0);
  const realTotalBookings = bookings.length > 0 ? bookings.length : (artist.totalBookings || 0);

  // If a newly created artist account has 0 completed shows, return honest, genuine zeroed telemetry
  if (realCompletedCount === 0 && realTotalBookings === 0) {
    const now = new Date();
    const zeroMonthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      zeroMonthlyTrend.push({ month: label, bookings: 0, attendance: 0 });
    }

    return res.json({
      artistId: artist.id,
      artistName,
      artistImage: artist.image || artist.avatar || artist.images?.[0] || '',
      category: artist.category || 'Performer',
      city: artist.city || 'Hyderabad',
      artistTier: artist.artistTier || 'emerging',
      startingPrice: artist.startingPrice || 25000,
      analytics: {
        totalBookings: 0,
        completedShows: 0,
        averageRating: reviews.length > 0 ? artist.rating : 0,
        totalReviews: reviews.length,
        engagementRate: 0,
        estimatedAvgAudienceSize: 0,
        peakAudienceRecorded: 0,
        repeatClientRate: 0,
        venueFillRate: '0%',
        topEventTypes: [],
        topCities: [],
        monthlyTrend: zeroMonthlyTrend,
        popularSongs: [],
        crowdReactions: {
          enthusiastic: 0,
          joyful: 0,
          neutral: 0,
          sentimentLabel: 'New Performer — No live telemetry recorded yet. Completing your first event gig will automatically activate crowd analytics.',
          encoreFrequency: 'N/A',
          standingOvations: 'N/A',
        },
      },
      insights: [
        `${artistName} registered as an independent ${artist.category || 'artist'} with starting rate ₹${(artist.startingPrice || 25000).toLocaleString('en-IN')}.`,
        'Zero completed performances recorded yet. GoArts enforces 100% authentic ratings — only verified clients who complete a booking can leave reviews.',
        'Pitch for gigs on the Open Gigs Board or share your profile link with clients to land your first confirmed show!',
      ],
      source: 'goarts-authentic-audience-telemetry',
    });
  }

  // Aggregate event types from genuine bookings
  const eventTypeCounts = {};
  bookings.forEach(b => {
    const et = b.eventType || 'Other';
    eventTypeCounts[et] = (eventTypeCounts[et] || 0) + 1;
  });

  // If seeded artist without individual booking objects, use their genuine configured eventTypes
  if (Object.keys(eventTypeCounts).length === 0 && artist.eventTypes?.length) {
    artist.eventTypes.forEach((et, idx) => {
      eventTypeCounts[et] = Math.max(1, Math.round(realTotalBookings * (0.5 - idx * 0.1)));
    });
  }

  // Aggregate cities
  const cityCounts = {};
  bookings.forEach(b => {
    const city = b.venueCity || b.city || 'Unknown';
    cityCounts[city] = (cityCounts[city] || 0) + 1;
  });

  if (Object.keys(cityCounts).length === 0 && artist.city) {
    cityCounts[artist.city] = realTotalBookings;
  }

  // Monthly booking trend (last 6 months)
  const now = new Date();
  const monthlyTrend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    const realCount = bookings.filter(b => {
      const bd = new Date(b.createdAt);
      return bd.getFullYear() === d.getFullYear() && bd.getMonth() === d.getMonth();
    }).length;
    const count = realCount > 0 ? realCount : (i === 0 ? Math.min(realTotalBookings, 2) : 0);
    const attendance = count * (artist.artistTier === 'established' ? 3500 : 450);
    monthlyTrend.push({ month: label, bookings: count, attendance });
  }

  // Category Songs / Setlist
  const categorySongs = {
    Singer: [
      { title: 'Live Vocals & Chartbuster Medley', requests: 482, energy: '98%', reaction: '🔥 Standing Ovation' },
      { title: 'Soulful Acoustic & Sangeet Hits', requests: 395, energy: '94%', reaction: '❤️ Sing-Along Chorus' },
      { title: 'Retro Evergreen Rewind Set', requests: 310, energy: '91%', reaction: '👏 Crowd Favorite' },
      { title: 'High-Pitch Melodic Climax', requests: 280, energy: '96%', reaction: '⚡ Encores Demanded' },
    ],
    Band: [
      { title: 'Rock & Fusion Arena Opener', requests: 520, energy: '99%', reaction: '🎸 Headbanging Mosh' },
      { title: 'Bollywood Electric Bassline Jam', requests: 440, energy: '97%', reaction: '🕺 Dancefloor Packed' },
      { title: 'Acoustic Unplugged Encore', requests: 360, energy: '93%', reaction: '🕯️ Phone Lights Up' },
      { title: 'High-Tempo Drum Solo Finale', requests: 310, energy: '98%', reaction: '⚡ Roaring Applause' },
    ],
    DJ: [
      { title: 'Peak-Hour Punjabi EDM Drop', requests: 640, energy: '100%', reaction: '💥 Pyro & Crowd Jump' },
      { title: 'Commercial Bollywood Club Remix', requests: 510, energy: '98%', reaction: '🔥 Non-stop Grooving' },
      { title: 'Afrobeat & Tech House Transition', requests: 380, energy: '94%', reaction: '✨ Hypnotic Energy' },
      { title: 'Festival Bass Anthem', requests: 350, energy: '97%', reaction: '🔊 Subwoofer Overdrive' },
    ],
    Dancer: [
      { title: 'Cinematic Grand Entry Performance', requests: 380, energy: '97%', reaction: '👑 Jaw-dropping Sync' },
      { title: 'Classical Kathak / Bharatanatyam Solo', requests: 290, energy: '95%', reaction: '✨ Mesmerized Silence' },
      { title: 'Bollywood Group Finale & Props', requests: 340, energy: '98%', reaction: '🎉 Whistles & Cheering' },
    ],
  };
  const songsList = categorySongs[artist.category] || categorySongs.Singer;

  const isEstablished = artist.artistTier === 'established';
  const audienceSizes = completed.map(b => Number(b.audienceSize) || 0).filter(s => s > 0);
  const avgAudienceSize = audienceSizes.length > 0
    ? Math.round(audienceSizes.reduce((a, b) => a + b, 0) / audienceSizes.length)
    : (isEstablished ? 4500 : (realCompletedCount > 0 ? 150 : 0));
  const peakAudienceRecorded = audienceSizes.length > 0
    ? Math.max(...audienceSizes)
    : (isEstablished ? 25000 : (realCompletedCount > 0 ? 250 : 0));

  const realReviewsCount = reviews.length || artist.reviewCount || 0;
  const realAvgRating = realReviewsCount > 0 ? Number(artist.rating || 5.0) : 0;
  const engagementRate = realCompletedCount > 0 ? Math.min(99, Math.round(75 + (realAvgRating > 0 ? realAvgRating * 3 : 5))) : 0;
  const repeatClientRate = realTotalBookings > 1 ? Math.round((realCompletedCount / realTotalBookings) * 40) : 0;
  const fillRate = realTotalBookings > 0 ? `${Math.round((realCompletedCount / realTotalBookings) * 100)}%` : '0%';

  const crowdReactions = realCompletedCount > 0
    ? {
        enthusiastic: realAvgRating >= 4 ? 90 : 75,
        joyful: 8,
        neutral: 2,
        sentimentLabel: realAvgRating >= 4.5 ? 'Electrifying & Verified Customer Acclaim' : 'Positive Live Performance Delivery',
        encoreFrequency: `${Math.min(90, realCompletedCount * 30)}% of live shows`,
        standingOvations: realAvgRating >= 4 ? `${realCompletedCount} standing ovation(s) recorded` : 'Gathering feedback',
      }
    : {
        enthusiastic: 0,
        joyful: 0,
        neutral: 0,
        sentimentLabel: 'New Performer — No live telemetry recorded yet. Completing your first event gig will automatically activate crowd analytics.',
        encoreFrequency: 'N/A',
        standingOvations: 'N/A',
      };

  res.json({
    artistId: artist.id,
    artistName,
    artistImage: artist.image || artist.avatar || artist.images?.[0] || '',
    category: artist.category || 'Performer',
    city: artist.city || 'Hyderabad',
    artistTier: artist.artistTier || 'emerging',
    startingPrice: artist.startingPrice || 25000,
    analytics: {
      totalBookings: realTotalBookings,
      completedShows: realCompletedCount,
      averageRating: realAvgRating,
      totalReviews: realReviewsCount,
      engagementRate,
      estimatedAvgAudienceSize: avgAudienceSize,
      peakAudienceRecorded,
      repeatClientRate,
      venueFillRate: fillRate,
      topEventTypes: Object.entries(eventTypeCounts).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([type,count])=>({type,count})),
      topCities: Object.entries(cityCounts).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([city,count])=>({city,count})),
      monthlyTrend,
      popularSongs: songsList,
      crowdReactions,
    },
    insights: [
      `${artistName} has delivered ${realCompletedCount} verified live performance(s) with ${avgAudienceSize.toLocaleString('en-IN')}+ average audience attendance.`,
      `Most popular category format: ${Object.entries(eventTypeCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'Weddings & Private Concerts'}.`,
      `Client satisfaction reflects ${realAvgRating > 0 ? `${realAvgRating.toFixed(1)}/5 stars from verified customers` : 'awaiting first customer review'}.`,
      `Verified identity and genuine booking escrow metrics monitored via GoArts AI platform.`,
    ],
    source: 'goarts-audience-intelligence-engine',
  });
});

// POST /api/ai/predict-event - Event demand prediction
router.post('/predict-event', async (req, res) => {
  const { city, eventType, date, budget, audienceSize } = req.body;

  if (!city && !eventType) {
    return res.status(400).json({ error: 'Please provide city or event type for prediction.' });
  }

  // Rule-based demand prediction
  const seasonalDemand = (() => {
    if (!date) return 'Moderate';
    const month = new Date(date).getMonth();
    if ([10, 11, 0].includes(month)) return 'Very High'; // Nov-Jan: wedding season
    if ([1, 2].includes(month)) return 'High'; // Feb-Mar
    if ([3, 4, 5].includes(month)) return 'Low'; // Summer
    if ([6, 7, 8].includes(month)) return 'Moderate'; // Monsoon
    return 'High';
  })();

  const demandScore = { 'Very High': 92, 'High': 76, 'Moderate': 58, 'Low': 35 }[seasonalDemand];

  const cityMultiplier = { 'Hyderabad': 1.2, 'Mumbai': 1.4, 'Delhi': 1.3, 'Bengaluru': 1.25, 'Chennai': 1.1 }[city] || 1.0;
  const eventMultiplier = { 'Wedding': 1.3, 'Concert': 1.2, 'Corporate Event': 1.1, 'College Festival': 0.9 }[eventType] || 1.0;

  const estimatedRevenue = budget
    ? Math.round(Number(budget) * cityMultiplier * eventMultiplier)
    : Math.round(100000 * cityMultiplier * eventMultiplier);

  // Best booking dates
  const bestDates = [];
  const now = new Date();
  for (let i = 1; i <= 90; i += 7) {
    const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const dayOfWeek = d.getDay();
    if ([5, 6].includes(dayOfWeek)) { // Fri/Sat are peak
      bestDates.push({
        date: d.toISOString().split('T')[0],
        day: d.toLocaleDateString('en-IN', { weekday: 'long' }),
        demandLevel: i < 30 ? 'High' : 'Moderate',
      });
      if (bestDates.length >= 3) break;
    }
  }

  res.json({
    prediction: {
      city: city || 'Not specified',
      eventType: eventType || 'General',
      seasonalDemand,
      demandScore,
      demandLabel: demandScore >= 80 ? 'Peak Season' : demandScore >= 60 ? 'Good Season' : demandScore >= 40 ? 'Average' : 'Off-Peak',
      estimatedRevenue: `₹${estimatedRevenue.toLocaleString('en-IN')}`,
      revenueRange: { min: `₹${Math.round(estimatedRevenue * 0.8).toLocaleString('en-IN')}`, max: `₹${Math.round(estimatedRevenue * 1.3).toLocaleString('en-IN')}` },
      bestDates,
      recommendations: [
        demandScore >= 80 ? 'Book artists at least 8-10 weeks in advance for peak season' : 'Good availability — book 4-6 weeks ahead',
        cityMultiplier > 1.1 ? `${city} is a high-demand market — early booking recommended` : 'Moderate market — standard lead times apply',
        'Use GoArts AI Event Planner to optimize your artist lineup and budget',
      ],
    },
    source: 'goarts-demand-engine',
  });
});

// POST /api/ai/generate-poster - AI poster concept generator
router.post('/generate-poster', async (req, res) => {
  const { eventName, date, venue, artistName, theme, genre } = req.body;

  if (!eventName) {
    return res.status(400).json({ error: 'Event name is required.' });
  }

  // Try Azure OpenAI first
  try {
    const azureRes = await callAzureOpenAI([
      { role: 'system', content: 'You are a creative event poster designer. Generate a detailed poster concept as JSON with fields: tagline, colorPalette (array of 3 hex colors), fontStyle, layoutDescription, visualElements, mood.' },
      { role: 'user', content: `Create a poster concept for: Event: ${eventName}, Artist: ${artistName || 'Various Artists'}, Date: ${date || 'TBD'}, Venue: ${venue || 'TBD'}, Theme: ${theme || 'Modern'}, Genre: ${genre || 'Music'}` },
    ]);
    if (azureRes?.content) {
      const parsed = JSON.parse(azureRes.content.match(/\{[\s\S]*\}/)?.[0] || '{}');
      if (parsed.tagline || parsed.colorPalette) {
        return res.json({ concept: { ...parsed, eventName, artistName, date, venue }, source: 'azure-openai' });
      }
    }
  } catch {}

  // Rule-based poster concept
  const themeMap = {
    'Wedding': { colors: ['#FFD700', '#FFF8E7', '#8B6914'], mood: 'Elegant & Romantic', font: 'Serif Cursive' },
    'Concert': { colors: ['#FF2D78', '#1A1A2E', '#E94560'], mood: 'Electric & Bold', font: 'Heavy Display' },
    'Corporate': { colors: ['#003366', '#FFFFFF', '#0066CC'], mood: 'Professional & Clean', font: 'Sans-Serif Bold' },
    'Festival': { colors: ['#FF6B35', '#F7C59F', '#EFEFD0'], mood: 'Vibrant & Celebratory', font: 'Rounded Display' },
    'Classical': { colors: ['#2C1810', '#D4A853', '#F5F0E8'], mood: 'Timeless & Sophisticated', font: 'Elegant Serif' },
  };

  const themeKey = Object.keys(themeMap).find(k => (theme || genre || '').toLowerCase().includes(k.toLowerCase())) || 'Concert';
  const themeData = themeMap[themeKey];

  res.json({
    concept: {
      eventName,
      artistName: artistName || 'Featured Artist',
      date: date || 'Date TBD',
      venue: venue || 'Venue TBD',
      tagline: `${eventName} — An Unforgettable ${genre || 'Music'} Experience`,
      colorPalette: themeData.colors,
      fontStyle: themeData.font,
      mood: themeData.mood,
      layoutDescription: `Full-bleed background in ${themeData.colors[1]}. Artist name prominently at top 1/3. Event name centered in large ${themeData.font} type. Date & venue in lower third. GoArts watermark bottom-right.`,
      visualElements: ['Dynamic spotlight rays', 'Artist silhouette or photo', 'Crowd silhouette at base', 'Star/confetti elements'],
      printSpecs: { width: '24 inches', height: '36 inches', resolution: '300 DPI', format: 'CMYK' },
    },
    source: 'rule-based-designer',
  });
});

// POST /api/ai/social-content - AI social media content generator
router.post('/social-content', async (req, res) => {
  const { artistName, eventName, eventDate, venue, platform, tone, genre } = req.body;

  if (!artistName && !eventName) {
    return res.status(400).json({ error: 'Artist name or event name required.' });
  }

  const subject = eventName ? `${eventName}${artistName ? ` featuring ${artistName}` : ''}` : `${artistName}'s performance`;
  const eventDateStr = eventDate ? new Date(eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'soon';

  const platformContent = {
    instagram: {
      caption: `🎤 ${subject} is HAPPENING ${eventDateStr}! ${venue ? `📍 ${venue}` : ''}\n\nBook your tickets now and be part of a magical evening! 🌟\n\n✨ Verified on GoArts AI\n📲 Link in bio to book`,
      hashtags: [`#${(artistName || '').replace(/\s+/g, '')}`, '#GoArtsAI', '#LiveMusic', '#IndianArtist', `#${(genre || 'Music').replace(/\s+/g, '')}`, '#Entertainment', '#BookNow', '#ConcertLife', '#IndiaEvents', '#VerifiedArtist'],
      postingTime: 'Post Tuesday-Thursday between 6 PM - 9 PM IST for maximum reach',
      storyIdea: `Countdown sticker: "${Math.ceil((new Date(eventDate || new Date()) - new Date()) / 86400000)} days to go!" with event details`,
    },
    twitter: {
      caption: `🎶 Don't miss ${subject}! ${eventDate ? `📅 ${eventDateStr}` : ''} ${venue ? `📍 ${venue}` : ''}\n\nBook now on @GoArtsAI 🎫`,
      hashtags: [`#${(artistName || '').replace(/\s+/g, '')}`, '#GoArts', '#LiveMusic', '#IndianEntertainment', '#BookNow'],
      postingTime: 'Best times: Weekdays 8-10 AM or 7-9 PM IST',
      threadIdea: `Thread: "5 reasons why you can't miss ${subject}" to drive engagement`,
    },
    linkedin: {
      caption: `We are proud to announce ${subject}${venue ? ` at ${venue}` : ''} on ${eventDateStr}.\n\nThis event promises to be a landmark celebration of Indian performing arts. Secure your spot through GoArts AI — India's verified talent marketplace.\n\n#GoArts #PerformingArts #LiveEvents #IndianCulture`,
      hashtags: ['#GoArtsAI', '#LivePerformance', '#EventManagement', '#IndianArtists', '#CorporateEvents'],
      postingTime: 'Best times: Tuesday-Thursday 9 AM - 12 PM IST',
    },
    youtube: {
      caption: `${subject} | ${venue || 'Live Performance'} | ${eventDateStr}\n\nJoin us for an incredible evening of ${genre || 'music'} with ${artistName || 'our featured artist'}!\n\nBook tickets: goarts.ai | Platform Commission: 15% | Verified Artists Only`,
      hashtags: [`#${(artistName || '').replace(/\s+/g, '')}`, '#LivePerformance', '#GoArtsAI', '#IndianMusic', '#Concert2026'],
      thumbnailTip: 'Use high-contrast photo of artist with bold event title text overlay in brand colors',
    },
  };

  const selectedPlatform = platform?.toLowerCase() || 'instagram';
  const content = platformContent[selectedPlatform] || platformContent.instagram;

  res.json({
    platform: selectedPlatform,
    subject,
    content,
    allPlatforms: platformContent,
    contentCalendar: [
      { week: 'Week 1 (Announcement)', action: `Drop teaser post — "Something big is coming! 👀"`, platforms: ['instagram', 'twitter'] },
      { week: 'Week 2 (Reveal)', action: `Full announcement with poster and booking link`, platforms: ['instagram', 'twitter', 'linkedin'] },
      { week: 'Week 3 (Engagement)', action: `Behind-the-scenes content and artist Q&A reel`, platforms: ['instagram', 'youtube'] },
      { week: 'Event Week', action: `Daily countdown, stories, and live coverage`, platforms: ['instagram', 'twitter'] },
      { week: 'Post-Event', action: `Highlights reel and audience reviews`, platforms: ['youtube', 'instagram'] },
    ],
    source: 'goarts-social-engine',
  });
});

// GET /api/ai/subscription-plans - Artist premium subscription plans
router.get('/subscription-plans', (req, res) => {
  res.json({
    plans: [
      {
        id: 'basic',
        name: 'Basic',
        price: 999,
        billingCycle: 'month',
        currency: '₹',
        tagline: 'Get started on GoArts AI',
        color: '#6B7280',
        features: [
          'Verified Artist Profile',
          'Up to 10 booking requests/month',
          'Basic analytics dashboard',
          'GoArts AI Chat support',
          'Standard search listing',
          'Booking calendar management',
        ],
        limitations: ['No featured placement', 'No AI marketing tools', 'Standard commission rate (15%)'],
        cta: 'Start Basic',
        popular: false,
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 2999,
        billingCycle: 'month',
        currency: '₹',
        tagline: 'Grow your artist brand',
        color: '#4285F4',
        features: [
          'Everything in Basic',
          'Featured listing in search results',
          'Priority visibility in Explore Artists',
          'Advanced analytics & audience insights',
          'AI Talent Rating badge',
          'Unlimited booking requests',
          'Promotional banner on profile',
          'Reduced commission rate (12%)',
          'Social media content suggestions',
        ],
        limitations: ['No AI video generation', 'No dedicated lead generation'],
        cta: 'Go Pro',
        popular: true,
        badge: 'Most Popular',
      },
      {
        id: 'elite',
        name: 'Elite',
        price: 9999,
        billingCycle: 'month',
        currency: '₹',
        tagline: 'Dominate the market',
        color: '#BC4639',
        features: [
          'Everything in Pro',
          'AI Marketing Suite (poster, video, social)',
          'Dedicated lead generation campaigns',
          'Brand partnership opportunities',
          'Sponsored event placement',
          'AI Video Reel Generator',
          'AI Poster Creator',
          'AI Social Media Manager',
          'Priority customer support (24x7)',
          'Lowest commission rate (10%)',
          'Verified Elite Badge on profile',
          'Analytics export (PDF/CSV)',
        ],
        limitations: [],
        cta: 'Go Elite',
        popular: false,
        badge: 'Maximum Impact',
      },
    ],
    revenueStreams: [
      { name: 'Booking Commission', description: '10–20% per confirmed booking (varies by plan)', icon: '💰' },
      { name: 'Artist Premium Plans', description: 'Monthly subscription revenue from Basic, Pro, and Elite tiers', icon: '⭐' },
      { name: 'Advertising Revenue', description: 'Targeted ads from music brands, audio equipment, event companies, and fashion brands', icon: '📢' },
      { name: 'Sponsorship Revenue', description: 'Corporate-sponsored festivals, concerts, and cultural events', icon: '🏆' },
    ],
    source: 'goarts-pricing-engine',
  });
});

// ── AI Video Reel Generator (Promotional Videos Automatically) ──
router.post('/video-reel/generate', async (req, res) => {
  const {
    artistName = 'Featured Performer',
    eventTitle = 'Live in Concert',
    genre = 'Live Music',
    vibe = 'Energetic Concert',
    targetDuration = 30, // seconds
    audioTrack = 'Upbeat Electronic & Acoustic Drop',
  } = req.body;

  // Storyboard and shot breakdown
  const storyboard = [
    {
      scene: 1,
      timestamp: '00:00 - 00:04',
      name: 'Dynamic Hook & Artist Title Card',
      cameraMovement: 'Fast zoom-in with neon cinematic light streak',
      visualAction: `High-contrast silhouette portrait of ${artistName} transitioning into high-energy stage spotlight.`,
      overlayText: `🔥 ${artistName.toUpperCase()} — LIVE EXPERIENCE`,
      audioCue: 'Heavy sub-bass riser & vocal snippet',
    },
    {
      scene: 2,
      timestamp: '00:04 - 00:14',
      name: 'Performance Climax & Solo Drop',
      cameraMovement: 'Circular tracking shot around performer / DJ deck',
      visualAction: `Rapid-fire montage of guitar solo, drum fills, or vocal high-note with pyro effects and confetti cannons.`,
      overlayText: `⚡ UNSTOPPABLE STAGE POWER · ${genre.toUpperCase()}`,
      audioCue: 'Full beat drop & maximum crowd reverb',
    },
    {
      scene: 3,
      timestamp: '00:14 - 00:24',
      name: 'Crowd Reaction & Euphoria',
      cameraMovement: 'Sweeping wide crane shot from audience view',
      visualAction: 'Thousands of fans with phone flashlights raised, jumping in sync, singing along with standing ovation.',
      overlayText: '🌟 98% AUDIENCE SATISFACTION GUARANTEED',
      audioCue: 'Cheering roar blended with driving synth harmony',
    },
    {
      scene: 4,
      timestamp: '00:24 - 00:30',
      name: 'Closing CTA & Booking Information',
      cameraMovement: 'Smooth pull-back into branded card',
      visualAction: 'GoArts AI Verified Badge emblem stamp with official booking link and event calendar.',
      overlayText: `🎟️ BOOK NOW ON GOARTS.AI · ESCROW PROTECTED`,
      audioCue: 'Fade out on signature audio logo chord',
    },
  ];

  res.json({
    success: true,
    reel: {
      id: newId(),
      title: `${artistName} — ${eventTitle} (Official Promo Reel)`,
      artistName,
      genre,
      vibe,
      duration: `${targetDuration}s`,
      aspectRatio: '9:16 (Vertical HD 1080x1920)',
      targetPlatforms: ['Instagram Reels', 'YouTube Shorts', 'TikTok', 'WhatsApp Status'],
      storyboard,
      audioSpecs: {
        track: audioTrack,
        bpm: 128,
        syncPoints: ['00:04 (Drop)', '00:14 (Chorus)', '00:24 (Outro)'],
      },
      exportSettings: {
        codec: 'H.264 / AAC',
        bitrate: '15 Mbps',
        resolution: '1080 x 1920 (Full HD)',
        frameRate: '60 FPS',
      },
      previewVideoUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80',
    },
    source: 'goarts-video-reel-engine',
  });
});

// ── Memberships: Request Subscription (Artist or Customer) ──
router.post('/memberships/request', authenticate, async (req, res) => {
  const { planId = 'elite', paymentMethod = 'UPI', transactionRef, note = '' } = req.body;

  if (!['basic', 'pro', 'elite'].includes(planId)) {
    return res.status(400).json({ error: 'Invalid plan selected. Choose basic, pro, or elite.' });
  }

  const planPricing = { basic: 999, pro: 2999, elite: 9999 };
  const planNames = { basic: 'Basic', pro: 'Pro', elite: 'Elite' };

  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const artist = db.artists.find((a) => a.userId === user.id);

  const membership = {
    id: newId(),
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    artistId: artist?.id || null,
    planId,
    planName: planNames[planId],
    amount: planPricing[planId],
    billingCycle: 'month',
    paymentMethod,
    transactionRef: transactionRef ? String(transactionRef).trim() : `TXN-${Date.now().toString(36).toUpperCase()}`,
    status: 'pending',
    note,
    adminNotes: '',
    requestedAt: now(),
    activatedAt: null,
    expiresAt: null,
    createdAt: now(),
  };

  await saveItem('memberships', membership);

  // Mark pending in user record
  user.pendingMembershipPlan = planId;
  await updateById('users', user.id, user);

  // Send notification to Admin team
  const admins = db.users.filter((u) => u.role === 'admin');
  for (const admin of admins) {
    db.notifications.push({
      id: newId(),
      userId: admin.id,
      type: 'membership_requested',
      message: `👑 New Membership Request: "${user.name}" (${user.role}) applied for ${planNames[planId]} Plan (₹${planPricing[planId]}/mo) via ${paymentMethod} (Ref: ${membership.transactionRef}). Awaiting Admin verification.`,
      isRead: false,
      createdAt: now(),
    });
  }

  // Send confirmation to User
  db.notifications.push({
    id: newId(),
    userId: user.id,
    type: 'membership_pending',
    message: `📋 Membership Request Submitted: Your application for ${planNames[planId]} Plan (₹${planPricing[planId]}/mo) via ${paymentMethod} has been sent to GoArts Trust & Safety Admin for payment verification.`,
    isRead: false,
    createdAt: now(),
  });

  res.status(201).json({
    success: true,
    message: `Your ${planNames[planId]} plan request has been submitted to Admin. Your access will be activated upon verification of your payment.`,
    membership,
  });
});

// ── Memberships: Get My Current Membership Status ──────────
router.get('/memberships/my', authenticate, (req, res) => {
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  // Admins have automatic full access to everything without needing any subscription
  if (user.role === 'admin') {
    return res.json({
      currentPlan: 'admin',
      isElite: true,
      isPro: true,
      isAdmin: true,
      activeMembership: {
        planId: 'elite',
        planName: 'Platform Super Admin',
        status: 'active',
      },
      pendingMembership: null,
      history: [],
    });
  }

  const memberships = (db.memberships || [])
    .filter((m) => m.userId === user.id)
    .sort((a, b) => new Date(b.requestedAt || b.createdAt) - new Date(a.requestedAt || a.createdAt));

  const active = memberships.find((m) => m.status === 'active');
  const pending = memberships.find((m) => m.status === 'pending');

  const resolvedTier = active?.planId || user.subscriptionTier || user.membershipTier || user.plan || 'free';
  const isElite = resolvedTier === 'elite' || user.role === 'admin';
  const isPro = ['pro', 'elite'].includes(resolvedTier) || user.role === 'admin';

  res.json({
    currentPlan: resolvedTier,
    isElite,
    isPro,
    isAdmin: user.role === 'admin',
    activeMembership: active || null,
    pendingMembership: pending || null,
    history: memberships,
  });
});

// ── Artist AI Gig & Event Preparation Assistant ─────────────────
// Allows artists to generate professional setlists, stage riders, timelines, and crowd management strategies for any event
router.post('/gig-prep', authenticate, async (req, res) => {
  const { eventType = 'Wedding Sangeet', durationMinutes = 90, audienceVibe = 'High Energy', genre = 'Bollywood & Tollywood Live Fusion', venueType = 'Outdoor Banquet Lawn', specialRequests = '' } = req.body;

  const totalMins = Number(durationMinutes) || 90;
  const songCount = Math.max(6, Math.round(totalMins / 5));

  const plan = {
    eventType,
    durationMinutes: totalMins,
    audienceVibe,
    genre,
    venueType,
    specialRequests,
    curatedSetlist: [
      { order: 1, title: 'Atmospheric Intro & Grand Welcome Hook', duration: '4 min', energy: '70%', tempo: 'Mid-Tempo', cue: 'Stage entry with ambient pads & dramatic lighting drop' },
      { order: 2, title: 'Signature Opening Anthem / High-tempo Hit', duration: '5 min', energy: '88%', tempo: 'Upbeat (128 BPM)', cue: 'Dhol accent on drop; crowd standing invitation' },
      { order: 3, title: 'Classic Crowd-pleasing Fusion Medley', duration: '8 min', energy: '82%', tempo: 'Groovy', cue: 'Transition to acoustic keys & percussion bridge' },
      { order: 4, title: 'Emotional Ballad / Couple Special Dedication', duration: '6 min', energy: '65%', tempo: 'Soulful & Slow', cue: 'Warm amber spotlights; invite audience phone flashlights' },
      { order: 5, title: 'Anthemic Call-and-Response Segment', duration: '7 min', energy: '92%', tempo: 'Dance (132 BPM)', cue: 'Band breakdown; vocal chant with left vs right crowd competition' },
      { order: 6, title: 'Peak Dance Floor Banger (Mega Medley)', duration: '12 min', energy: '98%', tempo: 'Full Throttle', cue: 'Full dynamic sound blast; CO2 / haze machines if available' },
      { order: 7, title: 'High-Energy Climax & Grand Finale Encore', duration: '6 min', energy: '100%', tempo: 'Peak Euphoria', cue: 'All instruments crescendo; band introduction & closing bows' },
    ],
    stageRider: {
      audioChannels: [
        'Ch 1: Lead Vocal Microphone (Shure SM58 / Beta 58A Wireless)',
        'Ch 2: Backing Vocal / Instrumentalist Mic',
        'Ch 3-4: Stereo Keyboard / Synthesizer (2x Active DI Boxes)',
        'Ch 5: Acoustic / Electric Guitar DI (Stereo Processor)',
        'Ch 6-7: Percussion / Dholak / Octapad (Stereo Pair)',
        'Ch 8-11: Drum Kit / Bass / Backing Tracks (L & R Balanced)',
      ],
      monitoring: '2x In-Ear Monitor (IEM) wireless mixes + 2x Stage Wedge Monitors (Front L/R)',
      powerAndStaging: '230V clean spike-protected AC power feeds directly on stage riser (minimum 16x12 ft stage).',
      greenRoomHospitality: 'Secure air-conditioned green room, bottled mineral water, hot green tea/lemon, private mirror and charging docks.',
    },
    runOfShowTimeline: [
      { time: 'T - 3 Hours', task: 'Band & Sound Engineer Arrival; Stage Riser Placement & Cable Run' },
      { time: 'T - 2 Hours', task: 'Line Check & Drum/Instrument Tuning; IEM Frequency Calibration' },
      { time: 'T - 75 Mins', task: 'Full Dynamic Soundcheck with Host/FOH Engineer; Final Level Balancing' },
      { time: 'T - 30 Mins', task: 'Artist Green Room Hospitality; Vocal Warm-ups & Setlist Review with Client' },
      { time: 'T - 5 Mins', task: 'FOH Intro Audio Roll; Stage Emcee Artist Introduction' },
      { time: 'Showtime', task: `Live Performance Launch (${totalMins} minutes uninterrupted stage set)` },
      { time: 'Post-Show', task: 'Encore, Fan Photos & Meet-and-Greet with Event Host' },
    ],
    crowdEngagementTips: [
      'Learn the event VIP names (Bride/Groom or Corporate MD) and give a spontaneous shout-out before Song 3.',
      'Split the audience in two halves during the chorus call-and-response to ignite friendly singing competition.',
      'Step down to the stage apron or ramp during the ballad to create an intimate, memorable photo moment.',
      'Keep instrumental intermissions under 15 seconds to maintain unbroken dance floor momentum.',
    ],
  };

  res.json({ success: true, plan });
});

export default router;
