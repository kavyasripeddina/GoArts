import { connectMongo, getMongoDb } from '../db/mongo.js';

async function run() {
  await connectMongo();
  const db = getMongoDb();
  const cols = await db.listCollections().toArray();
  for (const c of cols) {
    const docs = await db.collection(c.name).find({
      $or: [
        { displayName: /Test Artist/i },
        { name: /Test/i },
        { email: /test/i },
      ]
    }).toArray();
    if (docs.length > 0) {
      console.log('Collection:', c.name, docs.map(d => ({ id: d.id, _id: d._id, name: d.displayName || d.name, email: d.email })));
    }
  }
  process.exit(0);
}
run();
