// Script to clean orphaned bookings with deleted customer or artist IDs
import { MongoClient } from 'mongodb';

async function run() {
  const client = new MongoClient('mongodb://127.0.0.1:27017');
  await client.connect();
  const db = client.db('goarts');

  const users = await db.collection('users').find({}).toArray();
  const artists = await db.collection('artists').find({}).toArray();
  const userIds = new Set(users.map((u) => u.id));
  const artistIds = new Set(artists.map((a) => a.id));

  const allBookings = await db.collection('bookings').find({}).toArray();
  const orphaned = allBookings.filter((b) => !userIds.has(b.customerId) || !artistIds.has(b.artistId));
  console.log(`Found ${orphaned.length} orphaned bookings out of ${allBookings.length} total.`);

  if (orphaned.length > 0) {
    const orphanIds = orphaned.map((b) => b.id || b._id);
    const res = await db.collection('bookings').deleteMany({
      $or: [{ id: { $in: orphanIds } }, { _id: { $in: orphanIds } }],
    });
    console.log(`Deleted ${res.deletedCount} orphaned bookings from MongoDB.`);
  }

  const remaining = await db.collection('bookings').find({}).toArray();
  console.log(`Remaining clean bookings in MongoDB: ${remaining.length}`);

  // Check if any booking is missing customer or talent name
  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));
  const artistMap = Object.fromEntries(artists.map((a) => [a.id, a.displayName || a.name]));

  let allValid = true;
  for (const b of remaining) {
    const cName = userMap[b.customerId];
    const aName = artistMap[b.artistId];
    if (!cName || !aName) {
      console.warn(`Booking ${b.id} still missing client (${cName}) or artist (${aName})`);
      allValid = false;
    }
  }

  if (allValid) {
    console.log('✅ 100% of remaining bookings have valid clients and valid talent!');
  }

  await client.close();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

