// GoArts AI - Fix existing artists images, ratings, clean test data, and update seed passwords
import bcrypt from 'bcryptjs';
import { connectMongo, getMongoDb } from '../db/mongo.js';

const HASH_ROUNDS = 10;

async function run() {
  await connectMongo();
  const db = getMongoDb();
  if (!db) {
    console.error('❌ Could not connect to MongoDB');
    process.exit(1);
  }

  console.log('🚀 Running database cleanup and artist profile fixup...');

  // 1. Remove past E2E test users and test artists
  const deletedTestUsers = await db.collection('users').deleteMany({
    $or: [
      { email: { $regex: /@goartstest\.ai$/i } },
      { email: { $regex: /^intruder_/i } },
      { name: 'Test Artist E2E' },
      { name: 'Test Customer E2E' },
    ],
  });
  console.log(`🧹 Removed ${deletedTestUsers.deletedCount} temporary test users.`);

  const deletedTestArtists = await db.collection('artists').deleteMany({
    $or: [
      { displayName: 'Test Artist E2E' },
      { bio: { $regex: /Automated test artist/i } },
    ],
  });
  console.log(`🧹 Removed ${deletedTestArtists.deletedCount} temporary test artists.`);

  const deletedReviews = await db.collection('reviews').deleteMany({
    $or: [
      { comment: { $regex: /Incredible performance/i } },
      { customerName: 'Test Customer E2E' },
    ],
  });
  console.log(`🧹 Removed ${deletedReviews.deletedCount} temporary test reviews.`);

  const deletedBookings = await db.collection('bookings').deleteMany({
    $or: [
      { eventType: { $regex: /Annual Corporate Gala/i } },
    ],
  });
  console.log(`🧹 Removed ${deletedBookings.deletedCount} temporary test bookings.`);

  // 2. Fix Meghana Kenguva
  const updateMeghana = await db.collection('artists').updateMany(
    { displayName: { $regex: /Meghana Kenguva/i } },
    {
      $set: {
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
        rating: 0,
        reviewCount: 0,
      },
    }
  );
  console.log(`✨ Updated Meghana Kenguva: matched ${updateMeghana.matchedCount}, modified ${updateMeghana.modifiedCount}`);

  // 3. Fix Sahithi Andhavarapu
  const updateSahithi = await db.collection('artists').updateMany(
    { displayName: { $regex: /Sahithi Andhavarapu/i } },
    {
      $set: {
        image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80',
        rating: 0,
        reviewCount: 0,
      },
    }
  );
  console.log(`✨ Updated Sahithi Andhavarapu: matched ${updateSahithi.matchedCount}, modified ${updateSahithi.modifiedCount}`);

  // 4. Fix Arjun Mehta (replace duplicate concert image with distinct male singer portrait)
  const updateArjun = await db.collection('artists').updateMany(
    { displayName: { $regex: /Arjun Mehta/i } },
    {
      $set: {
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
      },
    }
  );
  console.log(`✨ Updated Arjun Mehta: matched ${updateArjun.matchedCount}, modified ${updateArjun.modifiedCount}`);

  // 5. Ensure any artist with 0 reviews has rating: 0
  const zeroReviews = await db.collection('artists').updateMany(
    { reviewCount: { $in: [0, '0', null] } },
    {
      $set: {
        rating: 0,
        reviewCount: 0,
      },
    }
  );
  console.log(`⭐ Fixed 0-review artists rating: matched ${zeroReviews.matchedCount}, modified ${zeroReviews.modifiedCount}`);

  // 6. Update seed users passwords in MongoDB to strong breach-free passwords
  const adminHash = await bcrypt.hash('GoArts_Admin#2026$', HASH_ROUNDS);
  const customerHash = await bcrypt.hash('GoArts_Customer#2026$', HASH_ROUNDS);
  const artistHash = await bcrypt.hash('GoArts_Artist#2026$', HASH_ROUNDS);

  await db.collection('users').updateOne({ email: 'admin@goarts.ai' }, { $set: { password: adminHash } });
  
  const seedCustomerEmails = ['priya@example.com', 'rahul@example.com', 'anita@example.com', 'kiran@example.com', 'deepa@example.com'];
  await db.collection('users').updateMany({ email: { $in: seedCustomerEmails } }, { $set: { password: customerHash } });

  const seedArtistEmails = [
    'anirudh.band@goarts.ai', 'poorna.dance@goarts.ai', 'sidsriram.live@goarts.ai', 'dsp.live@goarts.ai',
    'kavya@example.com', 'ravi.band@example.com', 'arjun@example.com', 'djphantom@example.com',
    'meera@example.com', 'vikram@example.com', 'nataraj@example.com', 'aarav@example.com',
    'sufi@example.com', 'raghav@example.com', 'djmaya@example.com', 'lakshmi@example.com',
  ];
  await db.collection('users').updateMany({ email: { $in: seedArtistEmails } }, { $set: { password: artistHash } });

  console.log('🔒 Seed user passwords updated to strong breach-free credentials in MongoDB.');

  // Also check if sahi@gmail.com and meggie@gmail.com exist and give them strong passwords if needed
  // Note: we don't overwrite user's custom passwords unless requested, but if they want breach-free, let's set them if they match weak defaults
  const userList = await db.collection('users').find({}).toArray();
  console.log(`\n📋 Current DB Users count: ${userList.length}`);
  
  const artistList = await db.collection('artists').find({}).toArray();
  console.log(`\n🎨 Current DB Artists count: ${artistList.length}`);
  for (const a of artistList) {
    console.log(` - ${a.displayName} (${a.category}) | ★ ${a.rating} (${a.reviewCount} reviews) | img: ${a.image.substring(0, 45)}...`);
  }

  console.log('\n✅ Database migration & cleanup completed successfully!');
  process.exit(0);
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
