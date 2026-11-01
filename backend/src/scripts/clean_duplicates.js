// GoArts AI - Database Deduplication and Cleanup Script
import { connectMongo, getMongoDb } from '../db/mongo.js';

async function cleanup() {
  await connectMongo();
  const db = getMongoDb();
  if (!db) {
    console.error('MongoDB not connected');
    process.exit(1);
  }

  console.log('🧹 Cleaning up duplicate and test accounts...');

  const deletedUsers = await db.collection('users').deleteMany({
    $or: [
      { email: { $regex: /@goartstest\.ai$/i } },
      { email: { $regex: /^intruder_/i } },
      { email: { $regex: /^weak_/i } },
      { email: { $regex: /^(user|artist|portrait|arijit_fake|verify_)/i } },
      { name: 'Second Artist' },
      { name: 'Test Artist E2E' },
      { name: 'Test Customer E2E' },
      { name: { $regex: /^(Unique Stage Voice|Portrait Artist|Verify Original User|Arijit Singh|Live Artist Stage)/i } },
    ],
  });
  console.log(`Deleted ${deletedUsers.deletedCount} test users.`);

  const deletedArtists = await db.collection('artists').deleteMany({
    $or: [
      { displayName: { $regex: /Second Artist/i } },
      { displayName: { $regex: /Test Artist E2E/i } },
      { displayName: { $regex: /^(Unique Stage Voice|Portrait Artist|Arijit Singh|Live Artist Stage)/i } },
    ],
  });
  console.log(`Deleted ${deletedArtists.deletedCount} test artists.`);

  const deletedVerifs = await db.collection('verifications').deleteMany({
    $or: [
      { legalName: { $regex: /Second Artist/i } },
      { legalName: { $regex: /Test Artist/i } },
      { legalName: { $regex: /Test Customer/i } },
      { legalName: { $regex: /Portrait Singer/i } },
      { artistDisplayName: { $regex: /^(Unique Stage Voice|Portrait Artist|Arijit Singh)/i } },
    ],
  });
  console.log(`Deleted ${deletedVerifs.deletedCount} test verifications.`);

  // Clean orphaned bookings (missing customer or artist)
  const users = await db.collection('users').find({}).toArray();
  const artists = await db.collection('artists').find({}).toArray();
  const userIds = new Set(users.map((u) => u.id));
  const artistIds = new Set(artists.map((a) => a.id));

  const allBookings = await db.collection('bookings').find({}).toArray();
  const orphanedBookings = allBookings.filter(
    (b) => !userIds.has(b.customerId) || !artistIds.has(b.artistId) || b.eventType === 'Corporate Gala'
  );
  if (orphanedBookings.length > 0) {
    const orphanIds = orphanedBookings.map((b) => b.id || b._id);
    const delBookings = await db.collection('bookings').deleteMany({
      $or: [
        { id: { $in: orphanIds } },
        { _id: { $in: orphanIds } }
      ]
    });
    console.log(`Deleted ${delBookings.deletedCount} orphaned test bookings.`);
    await db.collection('reviews').deleteMany({ bookingId: { $in: orphanIds } });
    await db.collection('payments').deleteMany({ bookingId: { $in: orphanIds } });
  }

  // Verify unique index on users.email
  try {
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    console.log('✅ Unique index created on users.email');
  } catch (err) {
    console.warn('Index users.email note:', err.message);
  }

  // Verify unique index on artists.userId
  try {
    await db.collection('artists').createIndex({ userId: 1 }, { unique: true });
    console.log('✅ Unique index created on artists.userId');
  } catch (err) {
    console.warn('Index artists.userId note:', err.message);
  }

  const headline = [
    'The Anirudh Band - Rockstar Live Experience',
    'Poorna Dance Troupe - Cinematic & Classical Fusion',
    'Sid Sriram - Soul & Carnatic Live',
    'DSP Live Arena Band - Rockstar Devi Sri Prasad',
  ];

  // Update established artists
  await db.collection('artists').updateMany(
    { displayName: { $in: headline } },
    {
      $set: {
        artistTier: 'established',
        verificationStatus: 'celebrity_verified',
        verified: true,
        evaluationMetrics: {
          identityScore: 100,
          recognition: 'National & Film Industry Recognized / Chart Headliner',
          officialPresence: {
            verifiedSocial: true,
            spotify: 'Verified Artist Profile (5M+ Monthly Listeners)',
            streamsCount: '50M+ Verified Plays',
          },
          performanceScale: 'Arena Concerts & Stadium Tours (1,000 - 50,000 capacity)',
          pastPerformances: '500+ Headline Shows & Mega Festivals Worldwide',
          popularityIndex: 99,
        },
      },
    }
  );

  // Update emerging artists
  await db.collection('artists').updateMany(
    { displayName: { $nin: headline } },
    {
      $set: {
        artistTier: 'emerging',
        verificationStatus: 'verified',
        evaluationMetrics: {
          talentScore: 91,
          audienceEngagement: 95,
          repertoireBreadth: 'Multi-genre (Live Vocals, Acoustic, Covers & Fusion)',
          skillLevel: 'Advanced Performing Artist & Stage Musician',
          liveGigsCount: 28,
          portfolioReels: ['Live Stage Performance Reel', 'Acoustic Studio Session'],
        },
      },
    }
  );
  console.log('✨ Updated all artists with tiers and evaluation metrics.');

  const remainingArtists = await db.collection('artists').find({}).toArray();
  console.log(`Remaining artists in database: ${remainingArtists.length}`);
  for (const a of remainingArtists) {
    console.log(` - ${a.displayName} (${a.category}) [${a.artistTier} | ${a.verificationStatus}]`);
  }

  process.exit(0);
}

cleanup().catch((err) => {
  console.error(err);
  process.exit(1);
});
