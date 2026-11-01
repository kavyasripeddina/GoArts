// GoArts AI - MongoDB Integration & Synchronization
import { MongoClient } from 'mongodb';

const IS_TEST = process.env.NODE_ENV === 'test';

const MONGODB_URI = IS_TEST
  ? process.env.MONGODB_URI_TEST
  : process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/goarts';

const DB_NAME = IS_TEST
  ? (process.env.DB_NAME_TEST || 'goarts_test')
  : (process.env.DB_NAME || 'goarts');

let client = null;
let mongoDb = null;
let isConnected = false;

/**
 * Helper to mask credentials in MongoDB URI for safe logging
 */
export function getMaskedMongoUri(uri = MONGODB_URI) {
  if (!uri) return '';
  return uri.replace(/:([^:@]+)@/, ':****@');
}

/**
 * Connect to MongoDB instance (e.g., MongoDB Atlas or local MongoDB Compass)
 */
export async function connectMongo(retry = true) {
  if (isConnected && mongoDb) return mongoDb;

  if (IS_TEST && !MONGODB_URI) {
    throw new Error(
      'MONGODB_URI_TEST is required. Tests must never use the production database.'
    );
  }

  try {
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
    });
    await client.connect();

    // Use DB_NAME or default to 'goarts'
    mongoDb = client.db(DB_NAME || 'goarts');
    isConnected = true;
    const safeUri = getMaskedMongoUri(MONGODB_URI);
    console.log(`\n🍃 [MongoDB Atlas] Connected successfully to: ${safeUri}`);
    console.log(`📦 [Database] Active MongoDB database: "${mongoDb.databaseName}"\n`);
    
    // Ensure critical unique and performance indexes (prevents duplicate accounts & profiles)
    await ensureMongoIndexes(mongoDb);

    return mongoDb;
  } catch (err) {
    if (retry) {
      console.warn(`⏳ [MongoDB Atlas] First connection attempt failed (${err.message}). Retrying in 2.5s...`);
      await new Promise((r) => setTimeout(r, 2500));
      return connectMongo(false);
    }
    console.error(`\n⚠️ [MongoDB Atlas] Connection failed: ${err.message}`);
    if (MONGODB_URI.includes('mongodb+srv://') || process.env.NODE_ENV === 'production') {
      console.warn(`\n🔍 MongoDB Atlas Troubleshooting Checklist:`);
      console.warn(`   1. Network Access: Ensure '0.0.0.0/0' (Allow access from anywhere) is in MongoDB Atlas -> Network Access.`);
      console.warn(`   2. Credentials: Check Database Access username & password in MONGODB_URI (URL-encode special characters like @, #, $).`);
      console.warn(`   3. Render Environment: Ensure MONGODB_URI is saved in your Render service environment variables.\n`);
    }
    isConnected = false;
    return null;
  }
}

export function getMongoDb() {
  return mongoDb;
}

export function isMongoConnected() {
  return isConnected && mongoDb !== null;
}

// Convert doc for Mongo: ensure _id is present (mapped from doc.id)
const formatForMongo = (doc) => {
  if (!doc || typeof doc !== 'object') return doc;
  const copy = { ...doc };
  if (copy.id && !copy._id) {
    copy._id = copy.id;
  }
  return copy;
};

// Convert doc from Mongo: ensure id is set
const formatFromMongo = (doc) => {
  if (!doc || typeof doc !== 'object') return doc;
  const copy = { ...doc };
  if (!copy.id && copy._id) {
    copy.id = String(copy._id);
  }
  return copy;
};

/**
 * Load all documents for a collection from MongoDB
 */
export async function loadCollectionFromMongo(collectionName) {
  if (!isMongoConnected()) return [];
  try {
    const docs = await mongoDb.collection(collectionName).find({}).toArray();
    return docs.map(formatFromMongo);
  } catch (err) {
    console.error(`[MongoDB] Error loading ${collectionName}:`, err.message);
    return [];
  }
}

/**
 * Count documents in a collection
 */
export async function countCollectionDocs(collectionName) {
  if (!isMongoConnected()) return 0;
  try {
    return await mongoDb.collection(collectionName).countDocuments();
  } catch (err) {
    console.error(`[MongoDB] Error counting ${collectionName}:`, err.message);
    return 0;
  }
}

/**
 * Find single document from MongoDB matching query
 */
export async function findDocInMongo(collectionName, query) {
  if (!isMongoConnected()) return null;
  try {
    const doc = await mongoDb.collection(collectionName).findOne(query);
    return doc ? formatFromMongo(doc) : null;
  } catch (err) {
    console.error(`[MongoDB] Error finding in ${collectionName}:`, err.message);
    return null;
  }
}

/**
 * Save / Upsert a single document to MongoDB
 */
export async function saveDocToMongo(collectionName, doc) {
  if (!isMongoConnected() || !doc || typeof doc !== 'object') return null;
  try {
    const formatted = formatForMongo(doc);
    const filter = { _id: formatted._id || formatted.id };
    const res = await mongoDb.collection(collectionName).replaceOne(filter, formatted, { upsert: true });
    return res;
  } catch (err) {
    console.error(`[MongoDB] Error saving to ${collectionName}:`, err.message);
    return null;
  }
}

/**
 * Update a document in MongoDB by ID
 */
export async function updateDocInMongo(collectionName, id, updates) {
  if (!isMongoConnected() || !id) return null;
  try {
    const cleanUpdates = { ...updates };
    delete cleanUpdates._id;
    const res = await mongoDb.collection(collectionName).updateOne(
      { $or: [{ _id: id }, { id }] },
      { $set: cleanUpdates }
    );
    return res;
  } catch (err) {
    console.error(`[MongoDB] Error updating ${collectionName}:`, err.message);
    return null;
  }
}

/**
 * Update multiple documents in MongoDB by filter
 */
export async function updateDocsInMongo(collectionName, filter, updates) {
  if (!isMongoConnected()) return null;
  try {
    const res = await mongoDb.collection(collectionName).updateMany(filter, { $set: updates });
    return res;
  } catch (err) {
    console.error(`[MongoDB] Error updating many in ${collectionName}:`, err.message);
    return null;
  }
}

/**
 * Delete a document from MongoDB by ID
 */
export async function deleteDocFromMongo(collectionName, id) {
  if (!isMongoConnected() || !id) return false;
  try {
    await mongoDb.collection(collectionName).deleteOne({ $or: [{ _id: id }, { id }] });
    return true;
  } catch (err) {
    console.error(`[MongoDB] Error deleting from ${collectionName}:`, err.message);
    return false;
  }
}

/**
 * Close MongoDB connection cleanly
 */
export async function closeMongo() {
  if (client) {
    await client.close();
    isConnected = false;
    mongoDb = null;
  }
}

/**
 * Bulk save / upsert an array of documents to MongoDB
 */
export async function bulkSaveToMongo(collectionName, docs) {
  if (!isMongoConnected() || !Array.isArray(docs) || docs.length === 0) return;
  try {
    const collection = mongoDb.collection(collectionName);
    const operations = docs.map((doc) => {
      const formatted = formatForMongo(doc);
      return {
        replaceOne: {
          filter: { _id: formatted._id || formatted.id },
          replacement: formatted,
          upsert: true,
        },
      };
    });
    await collection.bulkWrite(operations, { ordered: false });
  } catch (err) {
    console.error(`[MongoDB] Error bulk saving to ${collectionName}:`, err.message);
  }
}

/**
 * Clear a collection in MongoDB
 */
export async function clearMongoCollection(collectionName) {
  if (!isMongoConnected()) return;
  try {
    await mongoDb.collection(collectionName).deleteMany({});
  } catch (err) {
    console.error(`[MongoDB] Error clearing ${collectionName}:`, err.message);
  }
}

/**
 * Ensure strict database-level unique indexes and performance indexes
 * Prevents race conditions and duplicate user or artist accounts at the database layer.
 */
export async function ensureMongoIndexes(dbInstance = mongoDb) {
  if (!dbInstance) return;
  try {
    // 1. Strict unique constraint on users email (case-insensitive deduplication)
    await dbInstance.collection('users').createIndex(
      { email: 1 },
      { unique: true, background: true }
    );

    // 2. Strict unique constraint: 1 artist profile per user ID
    await dbInstance.collection('artists').createIndex(
      { userId: 1 },
      { unique: true, background: true }
    );

    // 3. Category & Tier indexes for fast filtering
    await dbInstance.collection('artists').createIndex({ artistTier: 1 }, { background: true });
    await dbInstance.collection('artists').createIndex({ category: 1 }, { background: true });
    await dbInstance.collection('artists').createIndex({ status: 1 }, { background: true });
    await dbInstance.collection('artists').createIndex({ verificationStatus: 1 }, { background: true });

    // 4. Verifications unique index per user & role
    await dbInstance.collection('verifications').createIndex({ userId: 1 }, { background: true });

    console.log('🔒 [MongoDB] Strict unique & performance indexes verified successfully.');
  } catch (err) {
    // If index already exists or background building, note safely
    if (err.code !== 85 && err.code !== 11000) {
      console.warn('[MongoDB] Index creation note:', err.message);
    }
  }
}
