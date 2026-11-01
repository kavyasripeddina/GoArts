import { connectMongo, getMongoDb } from '../db/mongo.js';

async function run() {
  await connectMongo();
  const db = getMongoDb();
  const artists = await db.collection('artists').find({}).toArray();
  console.log('All artists in DB:');
  for (const a of artists) {
    if (a.displayName.toLowerCase().includes('meghana') || a.displayName.toLowerCase().includes('kavya') || a.userId === '28b673c5-57d0-48ae-affa-61b98a32431b') {
      console.log('Match:', { id: a.id, userId: a.userId, displayName: a.displayName, category: a.category });
    }
  }
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
