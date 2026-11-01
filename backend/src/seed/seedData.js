// GoArts AI - Demo Seed Data
import bcrypt from 'bcryptjs';
import { db, newId, now, clearDb, syncAllToMongo } from '../db/inMemoryDb.js';

const HASH_ROUNDS = 10;

// Demo artist images (using Unsplash for realistic demo)
const artistImages = {
  anirudh: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80',
  poorna: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&q=80',
  sidsriram: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80',
  dsp: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&q=80',
  singer: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
  singer2: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80',
  singer3: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&q=80',
  band: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400&q=80',
  band2: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=400&q=80',
  dj: 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=400&q=80',
  dj2: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
  dancer: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=800&q=80',
  dancer2: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=400&q=80',
  comedian: 'https://images.unsplash.com/photo-1527224538127-2104bb71c51b?w=400&q=80',
  classical: 'https://images.unsplash.com/photo-1555354140-fca0b5527f31?w=400&q=80',
  magician: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&q=80',
  cultural: 'https://images.unsplash.com/photo-1515023115689-589c33041d3c?w=400&q=80',
};

export async function seedDatabase(force = false) {
  if (process.env.NODE_ENV === 'production') {
    console.log('Production mode: Demo seeding is disabled.');
    return;
  }

  if (!force && db.users.some((u) => u.email === 'admin@goarts.ai')) {
    console.log('📦 Database already seeded, skipping...');
    return;
  }

  // Preserve any user-created accounts, artists, bookings, and notifications

  // Preserve any user-created accounts, artists, bookings, and notifications
  const seedEmails = [
    'admin@goarts.ai', 'priya@example.com', 'rahul@example.com', 'anita@example.com',
    'kiran@example.com', 'deepa@example.com', 'anirudh.band@goarts.ai', 'poorna.dance@goarts.ai',
    'sidsriram.live@goarts.ai', 'dsp.live@goarts.ai', 'kavya@example.com', 'ravi.band@example.com',
    'arjun@example.com', 'djphantom@example.com', 'meera@example.com', 'vikram@example.com',
    'nataraj@example.com', 'aarav@example.com', 'sufi@example.com', 'raghav@example.com',
    'djmaya@example.com', 'lakshmi@example.com',
  ];
  const userAccounts = db.users.filter((u) => !seedEmails.includes(u.email?.toLowerCase()));
  const userArtists = db.artists.filter((a) => userAccounts.some((u) => u.id === a.userId));
  const userBookings = db.bookings.filter((b) => userAccounts.some((u) => u.id === b.customerId) || userArtists.some((a) => a.id === b.artistId));
  const userNotifs = db.notifications.filter((n) => userAccounts.some((u) => u.id === n.userId));
  const userMessages = db.messages.filter((m) => userBookings.some((b) => b.id === m.bookingId));
  const userPayments = db.payments.filter((p) => userBookings.some((b) => b.id === p.bookingId));

  clearDb();

  // Restore preserved user records
  for (const u of userAccounts) db.users.push(u);
  for (const a of userArtists) db.artists.push(a);
  for (const b of userBookings) db.bookings.push(b);
  for (const n of userNotifs) db.notifications.push(n);
  for (const m of userMessages) db.messages.push(m);
  for (const p of userPayments) db.payments.push(p);

  console.log('🌱 Seeding GoArts AI database with realtime artists (Anirudh Band, Poorna Dance Troupe, Sid Sriram)...');

  // ── Admin ──────────────────────────────────────────────────
  const adminId = newId();
  const adminHash = await bcrypt.hash('GoArts_Admin#2026$', HASH_ROUNDS);
  db.users.push({
    id: adminId,
    email: 'admin@goarts.ai',
    password: adminHash,
    role: 'admin',
    name: 'GoArts Admin',
    phone: '+91-9000000000',
    isActive: true,
    isVerified: true,
    createdAt: now(),
    updatedAt: now(),
  });

  // ── Demo Customers ─────────────────────────────────────────
  const customerPassword = await bcrypt.hash('GoArts_Customer#2026$', HASH_ROUNDS);
  const customers = [
    { name: 'Priya Sharma', email: 'priya@example.com', phone: '+91-9876543210', city: 'Hyderabad' },
    { name: 'Rahul Verma', email: 'rahul@example.com', phone: '+91-9876543211', city: 'Bengaluru' },
    { name: 'Anita Reddy', email: 'anita@example.com', phone: '+91-9876543212', city: 'Chennai' },
    { name: 'Kiran Patel', email: 'kiran@example.com', phone: '+91-9876543213', city: 'Mumbai' },
    { name: 'Deepa Nair', email: 'deepa@example.com', phone: '+91-9876543214', city: 'Delhi' },
  ];

  const customerIds = [];
  for (const c of customers) {
    const cId = newId();
    customerIds.push(cId);
    db.users.push({
      id: cId,
      email: c.email,
      password: customerPassword,
      role: 'customer',
      name: c.name,
      phone: c.phone,
      city: c.city,
      isActive: true,
      isVerified: true,
      createdAt: now(),
      updatedAt: now(),
    });
  }

  // ── Demo Artists ───────────────────────────────────────────
  const artistPassword = await bcrypt.hash('GoArts_Artist#2026$', HASH_ROUNDS);
  const artistDefs = [
    {
      name: 'Anirudh Ravichander',
      email: 'anirudh.band@goarts.ai',
      displayName: 'The Anirudh Band - Rockstar Live Experience',
      bio: 'Sensation of modern Indian cinema music. Full live concert arena band delivering electrifying rock, pop, and chart-topping anthems with world-class lighting & sound production.',
      category: 'Band',
      genres: ['Rock', 'Pop', 'Film Score', 'Electronic'],
      languages: ['Tamil', 'Telugu', 'Hindi', 'English'],
      city: 'Chennai',
      startingPrice: 1800000,
      rating: 4.98,
      reviewCount: 342,
      image: artistImages.anirudh,
      verified: true,
      featured: true,
      eventTypes: ['Concert', 'College Festival', 'Arena Tour', 'Mega Wedding'],
      audienceSize: '1000-50000',
      experience: 12,
      tags: ['Anirudh', 'Rockstar', 'Arena Live', 'Concert Headliner'],
    },
    {
      name: 'Poorna Dance Ensemble',
      email: 'poorna.dance@goarts.ai',
      displayName: 'Poorna Dance Troupe - Cinematic & Classical Fusion',
      bio: 'South India’s premier celebrity performance troupe led by renowned choreographer Poorna. Masterful synthesis of Kuchipudi, contemporary acrobatics, and high-energy cinematic choreography.',
      category: 'Dancer',
      genres: ['Kuchipudi Fusion', 'Cinematic Dance', 'Contemporary', 'Semi-Classical'],
      languages: ['Telugu', 'Hindi', 'English', 'Tamil'],
      city: 'Hyderabad',
      startingPrice: 150000,
      rating: 4.95,
      reviewCount: 198,
      image: artistImages.poorna,
      verified: true,
      featured: true,
      eventTypes: ['Wedding', 'Award Ceremony', 'Corporate Gala', 'Cultural Event'],
      audienceSize: '100-10000',
      experience: 14,
      tags: ['Poorna Dance', 'Cinematic Fusion', 'Kuchipudi', 'Celebrity Troupe'],
    },
    {
      name: 'Sid Sriram',
      email: 'sidsriram.live@goarts.ai',
      displayName: 'Sid Sriram - Soul & Carnatic Live',
      bio: 'Grammy-recognized, global touring artist fusing traditional South Indian Carnatic music with modern soul, R&B, and playback melodies that evoke goosebumps in every listener.',
      category: 'Singer',
      genres: ['Carnatic', 'Soul', 'Indie', 'Playback Melodies'],
      languages: ['Telugu', 'Tamil', 'Malayalam', 'English'],
      city: 'Hyderabad',
      startingPrice: 850000,
      rating: 4.96,
      reviewCount: 412,
      image: artistImages.sidsriram,
      verified: true,
      featured: true,
      eventTypes: ['Concert', 'Premium Wedding', 'College Festival', 'Cultural Event'],
      audienceSize: '200-15000',
      experience: 11,
      tags: ['Sid Sriram', 'Soul Vocalist', 'Carnatic Live', 'Playback Star'],
    },
    {
      name: 'Devi Sri Prasad (DSP)',
      email: 'dsp.live@goarts.ai',
      displayName: 'DSP Live Arena Band - Rockstar Devi Sri Prasad',
      bio: 'The undisputed king of high-voltage musical entertainment. 18-piece live arena band featuring explosive drums, mass beats, and unmatched crowd engagement across India and worldwide.',
      category: 'Band',
      genres: ['Commercial Pop', 'Folk Rock', 'Mass Beats', 'High Voltage'],
      languages: ['Telugu', 'Tamil', 'Hindi'],
      city: 'Hyderabad',
      startingPrice: 1400000,
      rating: 4.92,
      reviewCount: 280,
      image: artistImages.dsp,
      verified: true,
      featured: true,
      eventTypes: ['Concert', 'Arena Show', 'Celebrity Wedding', 'Sangeet Mega Night'],
      audienceSize: '500-40000',
      experience: 16,
      tags: ['DSP', 'Devi Sri Prasad', 'Mass Energy', 'Live Arena Band'],
    },
    {
      name: 'Arjun Mehta',
      email: 'arjun@example.com',
      displayName: 'Arjun Mehta - Bollywood Vocalist',
      bio: 'Award-winning Bollywood playback singer with 15 years of stage experience. Has performed at 500+ weddings and corporate events across India.',
      category: 'Singer',
      genres: ['Bollywood', 'Ghazal', 'Sufi'],
      languages: ['Hindi', 'Urdu', 'Punjabi'],
      city: 'Hyderabad',
      startingPrice: 45000,
      rating: 4.8,
      reviewCount: 124,
      image: artistImages.singer,
      verified: true,
      featured: true,
      eventTypes: ['Wedding', 'Corporate Event', 'Concert'],
      audienceSize: '50-5000',
      experience: 15,
      tags: ['Bollywood', 'Live Music', 'Stage Performance'],
    },
    {
      name: 'Kavya Krishnan',
      email: 'kavya@example.com',
      displayName: 'Kavya Krishnan - Carnatic Fusion',
      bio: 'Classical Carnatic vocalist trained at Chennai Music Academy. Blends classical tradition with contemporary fusion for diverse audiences.',
      category: 'Singer',
      genres: ['Carnatic', 'Classical', 'Fusion'],
      languages: ['Telugu', 'Tamil', 'Kannada', 'Sanskrit'],
      city: 'Chennai',
      startingPrice: 35000,
      rating: 4.9,
      reviewCount: 89,
      image: artistImages.singer2,
      verified: true,
      featured: true,
      eventTypes: ['Cultural Event', 'Concert', 'College Festival'],
      audienceSize: '100-2000',
      experience: 12,
      tags: ['Carnatic', 'Classical', 'Fusion'],
    },
    {
      name: 'Ravi & The Rhythm Collective',
      email: 'ravi.band@example.com',
      displayName: 'Ravi & The Rhythm Collective',
      bio: 'A 6-piece band specializing in Bollywood hits, retro classics, and original compositions. High energy performances for weddings and corporate events.',
      category: 'Band',
      genres: ['Bollywood', 'Retro', 'Pop', 'Rock'],
      languages: ['Hindi', 'English', 'Punjabi'],
      city: 'Mumbai',
      startingPrice: 120000,
      rating: 4.7,
      reviewCount: 67,
      image: artistImages.band,
      verified: true,
      featured: true,
      eventTypes: ['Wedding', 'Corporate Event', 'Hotel Event'],
      audienceSize: '100-10000',
      experience: 10,
      tags: ['Live Band', 'Bollywood', 'Corporate'],
    },
    {
      name: 'DJ Phantom',
      email: 'djphantom@example.com',
      displayName: 'DJ Phantom - Electronic Music Artist',
      bio: 'Internationally trained DJ with residencies at top clubs in Goa, Mumbai, and Bengaluru. Specializes in EDM, house, and Bollywood mashups.',
      category: 'DJ',
      genres: ['EDM', 'House', 'Techno', 'Bollywood Mashup'],
      languages: ['Hindi', 'English'],
      city: 'Bengaluru',
      startingPrice: 55000,
      rating: 4.6,
      reviewCount: 156,
      image: artistImages.dj,
      verified: true,
      featured: true,
      eventTypes: ['College Festival', 'Corporate Event', 'Night Club', 'Private Party'],
      audienceSize: '200-50000',
      experience: 8,
      tags: ['DJ', 'EDM', 'Electronic', 'Club'],
    },
    {
      name: 'Meera Dance Academy',
      email: 'meera@example.com',
      displayName: 'Meera Dance Academy - Bharatanatyam',
      bio: 'Premier Bharatanatyam troupe with 20+ trained dancers. Stunning classical and contemporary dance performances for all occasions.',
      category: 'Dancer',
      genres: ['Bharatanatyam', 'Classical', 'Contemporary'],
      languages: ['Tamil', 'Telugu', 'Kannada'],
      city: 'Chennai',
      startingPrice: 60000,
      rating: 4.9,
      reviewCount: 78,
      image: artistImages.dancer,
      verified: true,
      featured: false,
      eventTypes: ['Cultural Event', 'Wedding', 'Government Event', 'Concert'],
      audienceSize: '100-5000',
      experience: 20,
      tags: ['Bharatanatyam', 'Classical Dance', 'Troupe'],
    },
    {
      name: 'Vikram Sharma Comedy',
      email: 'vikram@example.com',
      displayName: 'Vikram Sharma - Stand-up Comedian',
      bio: 'Featured on Comedy Premium League and Amazon MiniTV. Razor-sharp wit with clean corporate humor and crowd interaction.',
      category: 'Comedian',
      genres: ['Stand-up', 'Corporate Comedy', 'Observational'],
      languages: ['Hindi', 'English', 'Hinglish'],
      city: 'Delhi',
      startingPrice: 80000,
      rating: 4.7,
      reviewCount: 203,
      image: artistImages.comedian,
      verified: true,
      featured: true,
      eventTypes: ['Corporate Event', 'College Festival', 'Private Party', 'Brand Launch'],
      audienceSize: '50-3000',
      experience: 9,
      tags: ['Comedy', 'Stand-up', 'Corporate'],
    },
    {
      name: 'Sufi Strings Ensemble',
      email: 'sufi@example.com',
      displayName: 'Sufi Strings Ensemble',
      bio: 'Soulful Sufi music collective featuring tabla, sarangi, and vocals. Creates an ethereal atmosphere perfect for weddings and spiritual events.',
      category: 'Band',
      genres: ['Sufi', 'Qawwali', 'Folk'],
      languages: ['Urdu', 'Hindi', 'Punjabi'],
      city: 'Hyderabad',
      startingPrice: 75000,
      rating: 4.8,
      reviewCount: 45,
      image: artistImages.band2,
      verified: true,
      featured: false,
      eventTypes: ['Wedding', 'Cultural Event', 'Hotel Event'],
      audienceSize: '50-2000',
      experience: 18,
      tags: ['Sufi', 'Qawwali', 'Live Music'],
    },
    {
      name: 'Nataraj Cultural Troupe',
      email: 'nataraj@example.com',
      displayName: 'Nataraj Cultural Troupe',
      bio: 'Multi-disciplinary cultural performance group showcasing folk dances from Andhra Pradesh, Telangana, and Tamil Nadu. Government certified.',
      category: 'Cultural Troupe',
      genres: ['Folk Dance', 'Classical', 'Cultural'],
      languages: ['Telugu', 'Tamil', 'Kannada'],
      city: 'Hyderabad',
      startingPrice: 90000,
      rating: 4.6,
      reviewCount: 33,
      image: artistImages.cultural,
      verified: true,
      featured: false,
      eventTypes: ['Government Event', 'Cultural Event', 'Corporate Event', 'College Festival'],
      audienceSize: '500-20000',
      experience: 25,
      tags: ['Folk Dance', 'Cultural', 'Government'],
    },
    {
      name: 'DJ Maya',
      email: 'djmaya@example.com',
      displayName: 'DJ Maya - Bollywood Beats Queen',
      bio: 'South India\'s premier female DJ specializing in wedding soundscapes, sangeet nights, and high-octane dance floors.',
      category: 'DJ',
      genres: ['Bollywood', 'Sangeet', 'Item Songs', 'Retro'],
      languages: ['Hindi', 'Telugu', 'Tamil'],
      city: 'Hyderabad',
      startingPrice: 40000,
      rating: 4.8,
      reviewCount: 201,
      image: artistImages.dj2,
      verified: true,
      featured: true,
      eventTypes: ['Wedding', 'Sangeet', 'Private Party', 'Hotel Event'],
      audienceSize: '50-5000',
      experience: 7,
      tags: ['DJ', 'Wedding', 'Bollywood', 'Sangeet'],
    },
    {
      name: 'Aarav The Illusionist',
      email: 'aarav@example.com',
      displayName: 'Aarav The Illusionist',
      bio: 'India\'s youngest master illusionist. Stage magic, close-up magic, and mind-bending mentalism for corporate and private events.',
      category: 'Magician',
      genres: ['Stage Magic', 'Close-up Magic', 'Mentalism'],
      languages: ['Hindi', 'English', 'Telugu'],
      city: 'Bengaluru',
      startingPrice: 30000,
      rating: 4.5,
      reviewCount: 89,
      image: artistImages.magician,
      verified: false,
      featured: false,
      eventTypes: ['Corporate Event', 'Birthday Party', 'Brand Launch', 'College Festival'],
      audienceSize: '20-2000',
      experience: 6,
      tags: ['Magic', 'Illusion', 'Mentalism'],
    },
    {
      name: 'Lakshmi Navratri Dancers',
      email: 'lakshmi@example.com',
      displayName: 'Lakshmi Navratri Dancers',
      bio: 'Vibrant Garba and Dandiya dance troupe bringing the spirit of Gujarat to every celebration. Costume-change performances available.',
      category: 'Dancer',
      genres: ['Garba', 'Dandiya', 'Folk Dance'],
      languages: ['Gujarati', 'Hindi', 'English'],
      city: 'Mumbai',
      startingPrice: 50000,
      rating: 4.7,
      reviewCount: 112,
      image: artistImages.dancer2,
      verified: true,
      featured: false,
      eventTypes: ['Wedding', 'Navratri Event', 'Cultural Event', 'Corporate Event'],
      audienceSize: '100-5000',
      experience: 14,
      tags: ['Garba', 'Dandiya', 'Folk Dance'],
    },
    {
      name: 'Sitar Maestro Raghav',
      email: 'raghav@example.com',
      displayName: 'Pandit Raghav Kumar - Sitar',
      bio: 'Disciple of the Imdadkhani gharana. Breathtaking sitar recitals for concert halls, hotel events, and intimate gatherings.',
      category: 'Instrumentalist',
      genres: ['Hindustani Classical', 'Ragas', 'Fusion'],
      languages: ['Hindi', 'English'],
      city: 'Delhi',
      startingPrice: 55000,
      rating: 4.9,
      reviewCount: 41,
      image: artistImages.classical,
      verified: true,
      featured: false,
      eventTypes: ['Concert', 'Hotel Event', 'Cultural Event', 'Corporate Event'],
      audienceSize: '20-1000',
      experience: 22,
      tags: ['Classical', 'Sitar', 'Hindustani'],
    },
  ];

  const artistUserIds = [];
  const artistIds = [];

  for (const a of artistDefs) {
    const userId = newId();
    artistUserIds.push(userId);
    db.users.push({
      id: userId,
      email: a.email,
      password: artistPassword,
      role: 'artist',
      name: a.name,
      phone: `+91-98765${Math.floor(10000 + Math.random() * 90000)}`,
      isActive: true,
      isVerified: true,
      createdAt: new Date(Date.now() - Math.random() * 90 * 86400000).toISOString(),
      updatedAt: now(),
    });

    const artistId = newId();
    artistIds.push(artistId);
    const profileScore = Math.floor(70 + Math.random() * 30);

    const isEstablished = ['The Anirudh Band - Rockstar Live Experience', 'Poorna Dance Troupe - Cinematic & Classical Fusion', 'Sid Sriram - Soul & Carnatic Live', 'DSP Live Arena Band - Rockstar Devi Sri Prasad'].includes(a.displayName);
    const artistTier = isEstablished ? 'established' : 'emerging';
    const verificationStatus = isEstablished ? 'celebrity_verified' : (a.verified ? 'verified' : 'unverified');

    const evaluationMetrics = isEstablished
      ? {
          identityScore: 100,
          recognition: 'National & Film Industry Recognized / Chart Headliner',
          officialPresence: {
            verifiedSocial: true,
            instagram: `@${a.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
            spotify: 'Verified Artist Profile (5M+ Monthly Listeners)',
            streamsCount: '50M+ Verified Plays',
          },
          performanceScale: 'Arena Concerts & Stadium Tours (1,000 - 50,000 capacity)',
          pastPerformances: '500+ Headline Shows & Mega Festivals Worldwide',
          popularityIndex: 99,
        }
      : {
          talentScore: Math.floor(88 + Math.random() * 9),
          audienceEngagement: Math.floor(92 + Math.random() * 6),
          repertoireBreadth: 'Multi-genre (Live Vocals, Acoustic, Covers & Fusion)',
          skillLevel: 'Advanced Performing Artist & Stage Musician',
          liveGigsCount: Math.floor(25 + Math.random() * 40),
          reviewScore: a.rating,
          portfolioReels: ['Live Stage Performance Reel', 'Acoustic Studio Session'],
        };

    db.artists.push({
      id: artistId,
      userId,
      displayName: a.displayName,
      bio: a.bio,
      category: a.category,
      artistTier,
      verificationStatus,
      evaluationMetrics,
      genres: a.genres,
      languages: a.languages,
      city: a.city,
      startingPrice: a.startingPrice,
      rating: a.rating,
      reviewCount: a.reviewCount,
      image: a.image,
      images: [a.image],
      verified: a.verified,
      featured: a.featured,
      status: 'approved',
      eventTypes: a.eventTypes,
      audienceSize: a.audienceSize,
      experience: a.experience,
      tags: a.tags,
      profileScore,
      totalBookings: Math.floor(20 + Math.random() * 100),
      completedBookings: Math.floor(15 + Math.random() * 80),
      cancelledBookings: Math.floor(0 + Math.random() * 5),
      responseRate: Math.floor(85 + Math.random() * 15),
      socialLinks: { instagram: `@${a.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`, youtube: '', facebook: '' },
      technicalRequirements: 'PA system, stage lighting, green room.',
      packages: [
        { name: 'Standard', price: a.startingPrice, duration: '2 hours', description: 'Standard performance package' },
        { name: 'Premium', price: Math.round(a.startingPrice * 1.6), duration: '4 hours', description: 'Extended premium performance with soundcheck' },
      ],
      createdAt: new Date(Date.now() - Math.random() * 120 * 86400000).toISOString(),
      updatedAt: now(),
      // Availability
      unavailableDates: [],
    });
  }

  // ── Demo Bookings ──────────────────────────────────────────
  const bookingStatuses = ['requested', 'quoted', 'confirmed', 'completed', 'cancelled', 'declined'];
  const eventTypes = ['Wedding', 'Corporate Event', 'College Festival', 'Concert', 'Birthday Party', 'Brand Launch'];
  const cities = ['Hyderabad', 'Bengaluru', 'Chennai', 'Mumbai', 'Delhi'];

  const bookingDefs = [
    // Completed Bookings
    { customerId: customerIds[0], artistId: artistIds[0], status: 'completed', eventType: 'Concert', city: 'Chennai', budget: 2000000, quotedPrice: 1850000, daysAgo: 14, venue: 'YMCA Arena Stadium' },
    { customerId: customerIds[1], artistId: artistIds[1], status: 'completed', eventType: 'Wedding', city: 'Hyderabad', budget: 180000, quotedPrice: 160000, daysAgo: 8, venue: 'Taj Falaknuma Palace' },
    { customerId: customerIds[2], artistId: artistIds[2], status: 'completed', eventType: 'Concert', city: 'Hyderabad', budget: 1000000, quotedPrice: 900000, daysAgo: 25, venue: 'Gachibowli Outdoor Stadium' },
    { customerId: customerIds[3], artistId: artistIds[3], status: 'completed', eventType: 'Corporate Event', city: 'Bengaluru', budget: 1600000, quotedPrice: 1450000, daysAgo: 38, venue: 'Bangalore Palace Grounds' },
    { customerId: customerIds[4], artistId: artistIds[4], status: 'completed', eventType: 'Wedding', city: 'Hyderabad', budget: 50000, quotedPrice: 48000, daysAgo: 45, venue: 'N Convention Madhapur' },
    { customerId: customerIds[0], artistId: artistIds[7], status: 'completed', eventType: 'Corporate Event', city: 'Bengaluru', budget: 70000, quotedPrice: 65000, daysAgo: 55, venue: 'The Leela Convention' },
    { customerId: customerIds[1], artistId: artistIds[8], status: 'completed', eventType: 'Cultural Event', city: 'Chennai', budget: 80000, quotedPrice: 70000, daysAgo: 60, venue: 'Music Academy Auditorium' },

    // Confirmed Bookings (Upcoming)
    { customerId: customerIds[4], artistId: artistIds[0], status: 'confirmed', eventType: 'College Festival', city: 'Chennai', budget: 2200000, quotedPrice: 2000000, daysAgo: -15, venue: 'IIT Madras Open Air' },
    { customerId: customerIds[0], artistId: artistIds[1], status: 'confirmed', eventType: 'Award Ceremony', city: 'Hyderabad', budget: 200000, quotedPrice: 180000, daysAgo: -8, venue: 'Novotel HICC Arena' },
    { customerId: customerIds[1], artistId: artistIds[2], status: 'confirmed', eventType: 'Wedding', city: 'Bengaluru', budget: 1100000, quotedPrice: 950000, daysAgo: -18, venue: 'Jayalaxmi Palace Hall' },
    { customerId: customerIds[2], artistId: artistIds[6], status: 'confirmed', eventType: 'Wedding', city: 'Hyderabad', budget: 150000, quotedPrice: 130000, daysAgo: -10, venue: 'Golkonda Resort Lawns' },

    // Quoted Bookings
    { customerId: customerIds[3], artistId: artistIds[3], status: 'quoted', eventType: 'Concert', city: 'Hyderabad', budget: 1600000, quotedPrice: 1500000, daysAgo: -3, venue: 'HITEX Exhibition Center' },
    { customerId: customerIds[4], artistId: artistIds[5], status: 'quoted', eventType: 'Concert', city: 'Chennai', budget: 45000, quotedPrice: 38000, daysAgo: -4, venue: 'Sir Mutha Venkatasubba Concert Hall' },
    { customerId: customerIds[2], artistId: artistIds[10], status: 'quoted', eventType: 'Wedding', city: 'Hyderabad', budget: 100000, quotedPrice: 85000, daysAgo: -2, venue: 'Fort Grand Shamshabad' },

    // Requested Bookings
    { customerId: customerIds[3], artistId: artistIds[1], status: 'requested', eventType: 'Cultural Event', city: 'Hyderabad', budget: 150000, quotedPrice: null, daysAgo: -1, venue: 'Shilpakala Vedika' },
    { customerId: customerIds[0], artistId: artistIds[0], status: 'requested', eventType: 'Brand Launch', city: 'Mumbai', budget: 2500000, quotedPrice: null, daysAgo: -2, venue: 'Jio World Convention Centre' },
    { customerId: customerIds[1], artistId: artistIds[12], status: 'requested', eventType: 'Cultural Event', city: 'Delhi', budget: 65000, quotedPrice: null, daysAgo: -1, venue: 'Siri Fort Auditorium' },

    // Cancelled / Declined
    { customerId: customerIds[4], artistId: artistIds[9], status: 'cancelled', eventType: 'Government Event', city: 'Hyderabad', budget: 110000, quotedPrice: null, daysAgo: 12, venue: 'People’s Plaza Necklace Road' },
    { customerId: customerIds[1], artistId: artistIds[11], status: 'declined', eventType: 'Wedding', city: 'Mumbai', budget: 30000, quotedPrice: null, daysAgo: 20, venue: 'Blue Sea Banquets Worli' },
  ];

  const bookingIds = [];
  for (const b of bookingDefs) {
    const bId = newId();
    bookingIds.push(bId);
    const eventDate = new Date(Date.now() - b.daysAgo * 86400000).toISOString().split('T')[0];
    const platformCommission = b.quotedPrice ? Math.round(b.quotedPrice * 0.15) : null;

    db.bookings.push({
      id: bId,
      customerId: b.customerId,
      artistId: b.artistId,
      status: b.status,
      eventType: b.eventType,
      eventDate,
      eventLocation: { city: b.city, venue: `${b.city} Convention Hall`, address: `123 Event Street, ${b.city}` },
      budget: b.budget,
      quotedPrice: b.quotedPrice,
      platformCommission,
      artistEarnings: b.quotedPrice ? b.quotedPrice - platformCommission : null,
      duration: 3,
      audienceSize: Math.floor(200 + Math.random() * 800),
      languagePreference: 'Hindi',
      specialRequirements: 'Standard setup required.',
      artistNote: b.quotedPrice ? 'Looking forward to performing at your event!' : null,
      cancelReason: b.status === 'cancelled' ? 'Event postponed due to unforeseen circumstances.' : null,
      createdAt: new Date(Date.now() - (b.daysAgo + 5) * 86400000).toISOString(),
      updatedAt: now(),
    });
  }

  // ── Demo Reviews ───────────────────────────────────────────
  const completedBookings = db.bookings.filter((b) => b.status === 'completed');
  for (let i = 0; i < completedBookings.length; i++) {
    const b = completedBookings[i];
    const artist = db.artists.find((a) => a.id === b.artistId);
    const ratings = [4, 5, 5, 4, 5];
    const comments = [
      'Absolutely fantastic performance! The crowd loved every moment. Highly recommend!',
      'Professional, punctual, and incredibly talented. Made our event unforgettable.',
      'Exceeded all expectations. The energy was electric and the audience was on their feet the entire time.',
      'Great performance, very cooperative and easy to work with. Would book again!',
    ];

    db.reviews.push({
      id: newId(),
      bookingId: b.id,
      customerId: b.customerId,
      artistId: b.artistId,
      rating: ratings[i % ratings.length],
      comment: comments[i % comments.length],
      isPublished: true,
      createdAt: new Date(Date.now() - (i + 1) * 7 * 86400000).toISOString(),
      updatedAt: now(),
    });
  }

  // ── Demo Favorites ─────────────────────────────────────────
  db.favorites.push(
    { id: newId(), customerId: customerIds[0], artistId: artistIds[0], createdAt: now() },
    { id: newId(), customerId: customerIds[0], artistId: artistIds[3], createdAt: now() },
    { id: newId(), customerId: customerIds[1], artistId: artistIds[2], createdAt: now() },
    { id: newId(), customerId: customerIds[2], artistId: artistIds[4], createdAt: now() },
  );

  // ── Demo Open Event Gigs (Customer posted events) ───────────
  const event1Id = newId();
  const event2Id = newId();
  const event3Id = newId();

  db.events.push(
    {
      id: event1Id,
      customerId: customerIds[0],
      title: 'College Annual Fest - Headline Live Band Wanted',
      category: 'Band',
      eventDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      city: 'Hyderabad',
      venue: 'Gachibowli Stadium Campus',
      budget: 250000,
      description: 'Looking for a high-energy live band for our 3-day college festival headliner evening. Must be able to perform rock, cinematic hits, and fusion songs for 3 hours.',
      audienceSize: 2500,
      duration: 3,
      status: 'open',
      acceptedProposalId: null,
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      updatedAt: now(),
    },
    {
      id: event2Id,
      customerId: customerIds[1],
      title: 'Royal Wedding Sangeet - Classical & Bollywood Fusion Dance',
      category: 'Dancer',
      eventDate: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0],
      city: 'Bengaluru',
      venue: 'Palace Grounds Banquet Arena',
      budget: 120000,
      description: 'Seeking an expressive and synchronized dance troupe to open our Sangeet night with a 45-minute thematic medley (Kuchipudi/Bharatanatyam into upbeat Bollywood).',
      audienceSize: 600,
      duration: 2,
      status: 'open',
      acceptedProposalId: null,
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      updatedAt: now(),
    },
    {
      id: event3Id,
      customerId: customerIds[2],
      title: 'Tech Annual Gala - High-Octane Commercial DJ Night',
      category: 'DJ',
      eventDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
      city: 'Chennai',
      venue: 'ITC Grand Chola Ballroom',
      budget: 80000,
      description: 'Corporate celebration for 800 IT professionals. Need a versatile DJ who spins commercial English, Bollywood, and South Indian dance anthems with interactive MC skills.',
      audienceSize: 800,
      duration: 4,
      status: 'open',
      acceptedProposalId: null,
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      updatedAt: now(),
    }
  );

  // Seed artist proposals for open event 1
  db.proposals.push(
    {
      id: newId(),
      eventId: event1Id,
      artistId: artistIds[7], // Sufi Strings
      quoteAmount: 220000,
      pitchMessage: 'We would love to headline your college festival! We bring our own in-ear monitoring and can deliver an electrifying 3-hour set with crowd interaction.',
      status: 'pending',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    }
  );

  // Set Aadhaar / Govt ID Verified status on seed users & artists
  db.users.forEach((u) => {
    u.aadhaarVerified = true;
    u.aadhaarData = {
      idType: 'Aadhaar (UIDAI)',
      legalName: u.name,
      maskedNumber: `XXXX-XXXX-${Math.floor(1000 + Math.random() * 9000)}`,
      verifiedAt: now(),
    };
  });

  db.artists.forEach((a) => {
    a.aadhaarVerified = true;
    a.verified = true;
    a.aadhaarData = {
      idType: 'Aadhaar (UIDAI)',
      legalName: a.displayName,
      maskedNumber: `XXXX-XXXX-${Math.floor(1000 + Math.random() * 9000)}`,
      verifiedAt: now(),
    };
  });

  // ── Notifications ──────────────────────────────────────────
  db.notifications.push(
    { id: newId(), userId: customerIds[0], type: 'booking_confirmed', message: 'Your booking with Ravi & The Rhythm Collective has been confirmed!', isRead: false, createdAt: now() },
    { id: newId(), userId: customerIds[1], type: 'booking_quoted', message: 'DJ Phantom has sent you a quote. Check it out!', isRead: false, createdAt: now() },
    { id: newId(), userId: artistUserIds[0], type: 'new_booking', message: 'You have a new booking request from Priya Sharma.', isRead: false, createdAt: now() },
  );

  console.log(`✅ Seeded: ${db.users.length} users, ${db.artists.length} artists, ${db.bookings.length} bookings, ${db.events.length} open events, ${db.reviews.length} reviews`);
  await syncAllToMongo();
  console.log('🍃 All seed data synchronized to MongoDB Compass!');
}
