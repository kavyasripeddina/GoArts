// GoArts AI - Deduplication and Image Uniqueness Enforcer
import { connectMongo, getMongoDb } from '../db/mongo.js';

const UNIQUE_IMAGES = {
  'The Anirudh Band - Rockstar Live Experience': 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80',
  'Poorna Dance Troupe - Cinematic & Classical Fusion': 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&q=80',
  'Sid Sriram - Soul & Carnatic Live': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80',
  'DSP Live Arena Band - Rockstar Devi Sri Prasad': 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&q=80',
  'Kavya Krishnan - Carnatic Fusion': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
  'Arjun Mehta - Bollywood Vocalist': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
  'Ravi & The Rhythm Collective': 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&q=80',
  'Meera Dance Academy - Bharatanatyam': 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=800&q=80',
  'Vikram Sharma - Stand-up Comedian': 'https://images.unsplash.com/photo-1527224538127-2104bb71c51b?w=800&q=80',
  'Sufi Strings Ensemble': 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=800&q=80',
  'Nataraj Cultural Troupe': 'https://images.unsplash.com/photo-1515023115689-589c33041d3c?w=800&q=80',
  'DJ Maya - Bollywood Beats Queen': 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800&q=80',
  'Aarav The Illusionist': 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&q=80',
  'Lakshmi Navratri Dancers': 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=800&q=80',
  'Pandit Raghav Kumar - Sitar': 'https://images.unsplash.com/photo-1555354140-fca0b5527f31?w=800&q=80',
  'DJ Phantom - Electronic Music Artist': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  'Meghana Kenguva': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
  'Sahithi Andhavarapu': 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80',
  'Junnu': 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&q=80',
};

async function dedupAndUnique() {
  await connectMongo();
  const db = getMongoDb();

  const artists = await db.collection('artists').find({}).toArray();
  const seen = new Set();
  const toDelete = [];

  for (const a of artists) {
    const key = a.displayName.trim().toLowerCase();
    if (seen.has(key)) {
      toDelete.push(a._id);
    } else {
      seen.add(key);
      const uniqueImg = UNIQUE_IMAGES[a.displayName];
      if (uniqueImg) {
        await db.collection('artists').updateOne({ _id: a._id }, { $set: { image: uniqueImg, images: [uniqueImg] } });
      }
    }
  }

  if (toDelete.length > 0) {
    const delRes = await db.collection('artists').deleteMany({ _id: { $in: toDelete } });
    console.log(`Deleted ${delRes.deletedCount} duplicate artist documents.`);
  }

  const finalArtists = await db.collection('artists').find({}).toArray();
  console.log(`Final unique artists count in MongoDB: ${finalArtists.length}`);
  const imagesSet = new Set();
  for (const a of finalArtists) {
    if (imagesSet.has(a.image)) {
      console.warn('⚠️ WARNING: DUPLICATE IMAGE DETECTED:', a.displayName, a.image);
    }
    imagesSet.add(a.image);
    console.log(`✔ ${a.displayName} | Tier: ${a.artistTier} | Image: ${a.image}`);
  }
  console.log(`Unique images count: ${imagesSet.size} out of ${finalArtists.length}`);

  process.exit(0);
}

dedupAndUnique().catch((err) => {
  console.error(err);
  process.exit(1);
});

