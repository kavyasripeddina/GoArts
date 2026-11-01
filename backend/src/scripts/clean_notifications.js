import { connectMongo, getMongoDb } from '../db/mongo.js';

async function clean() {
  await connectMongo();
  const db = getMongoDb();
  const notifs = await db.collection('notifications').find({}).toArray();
  console.log(`Initial notification count: ${notifs.length}`);

  const seen = new Set();
  const toDelete = [];

  for (const n of notifs) {
    const key = `${n.userId}::${n.type}::${n.message}`;
    if (seen.has(key)) {
      toDelete.push(n.id);
    } else {
      seen.add(key);
    }
  }

  console.log(`Found ${toDelete.length} duplicate notifications to remove.`);
  if (toDelete.length > 0) {
    await db.collection('notifications').deleteMany({ id: { $in: toDelete } });
  }

  const remaining = await db.collection('notifications').countDocuments();
  console.log(`Remaining unique notifications: ${remaining}`);
  process.exit(0);
}

clean().catch(err => { console.error(err); process.exit(1); });
