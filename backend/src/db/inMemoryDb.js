// GoArts AI - Hybrid Database with Automatic MongoDB Compass Synchronization
import { v4 as uuidv4 } from 'uuid';
import {
  saveDocToMongo,
  updateDocInMongo,
  updateDocsInMongo,
  deleteDocFromMongo,
  bulkSaveToMongo,
  loadCollectionFromMongo,
  findDocInMongo,
  countCollectionDocs,
  isMongoConnected,
} from './mongo.js';

let isSyncing = false;

// ============================================================
// SYNCED ARRAY PROXY FACTORY
// Automatically writes push, unshift, and direct mutations to MongoDB
// ============================================================
function createSyncedArray(collectionName) {
  const target = [];
  return new Proxy(target, {
    get(arr, prop) {
      if (prop === 'push') {
        return function (...items) {
          const result = Array.prototype.push.apply(arr, items);
          if (!isSyncing) {
            for (const item of items) {
              saveDocToMongo(collectionName, item);
            }
          }
          return result;
        };
      }
      if (prop === 'unshift') {
        return function (...items) {
          const result = Array.prototype.unshift.apply(arr, items);
          if (!isSyncing) {
            for (const item of items) {
              saveDocToMongo(collectionName, item);
            }
          }
          return result;
        };
      }
      if (prop === 'splice') {
        return function (start, deleteCount, ...items) {
          if (deleteCount > 0 && !isSyncing) {
            const deleted = arr.slice(start, start + deleteCount);
            for (const item of deleted) {
              if (item?.id) deleteDocFromMongo(collectionName, item.id);
            }
          }
          const result = Array.prototype.splice.apply(arr, [start, deleteCount, ...items]);
          if (!isSyncing) {
            for (const item of items) {
              saveDocToMongo(collectionName, item);
            }
          }
          return result;
        };
      }
      return arr[prop];
    },
    set(arr, prop, val) {
      arr[prop] = val;
      if (!isSyncing && !isNaN(prop) && val && typeof val === 'object') {
        saveDocToMongo(collectionName, val);
      }
      return true;
    },
  });
}

const COLLECTION_NAMES = [
  'users',
  'artists',
  'bookings',
  'reviews',
  'favorites',
  'notifications',
  'availability',
  'auditLogs',
  'events',
  'proposals',
  'messages',
  'payments',
  'verifications',
  'memberships',
];

// ============================================================
// DATA STORES (Reactive & Synced with MongoDB)
// ============================================================
export const db = {};
for (const col of COLLECTION_NAMES) {
  db[col] = createSyncedArray(col);
}

// ============================================================
// HELPERS
// ============================================================
export const newId = () => uuidv4();

export const now = () => new Date().toISOString();

export const clearDb = () => {
  for (const key of Object.keys(db)) {
    db[key].length = 0;
  }
};

export const paginate = (arr, page = 1, limit = 12) => {
  const total = arr.length;
  const start = (page - 1) * limit;
  const end = start + limit;
  return {
    data: arr.slice(start, end),
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

// Find helpers
export const findById = (collection, id) => db[collection].find((item) => item.id === id);
export const findByField = (collection, field, value) => db[collection].find((item) => item[field] === value);

// Normalized user lookups with MongoDB fallback
export const findUserByEmail = async (email) => {
  if (!email) return null;
  const normalized = String(email).trim().toLowerCase();
  let user = db.users.find((u) => u.email && u.email.trim().toLowerCase() === normalized);
  if (!user && isMongoConnected()) {
    const mongoUser = await findDocInMongo('users', { email: normalized });
    if (mongoUser) {
      user = mongoUser;
      const exists = db.users.findIndex((u) => u.id === user.id);
      if (exists === -1) {
        db.users.push(user);
      } else {
        db.users[exists] = user;
      }
    }
  }
  return user || null;
};

export const findUserById = async (id) => {
  if (!id) return null;
  let user = db.users.find((u) => u.id === id);
  if (!user && isMongoConnected()) {
    const mongoUser = await findDocInMongo('users', { $or: [{ id }, { _id: id }] });
    if (mongoUser) {
      user = mongoUser;
      const exists = db.users.findIndex((u) => u.id === user.id);
      if (exists === -1) {
        db.users.push(user);
      } else {
        db.users[exists] = user;
      }
    }
  }
  return user || null;
};

// Save / persist single item directly into memory AND MongoDB (Awaited)
export const saveItem = async (collection, item) => {
  if (!item || !collection || !db[collection]) return item;
  const idx = db[collection].findIndex((it) => it.id === item.id);
  if (idx === -1) {
    db[collection].push(item);
  } else {
    db[collection][idx] = { ...item };
  }
  if (isMongoConnected()) {
    await saveDocToMongo(collection, item);
  }
  return item;
};

// Update helper (Awaited)
export const updateById = async (collection, id, updates) => {
  if (!collection || !id || !db[collection]) return null;
  const idx = db[collection].findIndex((item) => item.id === id);
  const updatedDoc = {
    ...(idx !== -1 ? db[collection][idx] : {}),
    ...updates,
    id,
    updatedAt: now(),
  };
  if (idx !== -1) {
    db[collection][idx] = updatedDoc;
  } else {
    db[collection].push(updatedDoc);
  }
  if (isMongoConnected()) {
    await updateDocInMongo(collection, id, { ...updates, updatedAt: now() });
  }
  return updatedDoc;
};

// Delete helper (Awaited)
export const deleteById = async (collection, id) => {
  if (!collection || !id || !db[collection]) return false;
  const idx = db[collection].findIndex((item) => item.id === id);
  if (idx !== -1) {
    db[collection].splice(idx, 1);
  }
  if (isMongoConnected()) {
    await deleteDocFromMongo(collection, id);
  }
  return true;
};

// ============================================================
// MONGODB SYNC & RESTORE
// ============================================================

/**
 * Load all collections from MongoDB Compass / MongoDB server into memory
 */
export async function loadAllFromMongo() {
  if (!isMongoConnected()) return false;
  isSyncing = true;
  let loadedCount = 0;
  try {
    for (const col of COLLECTION_NAMES) {
      const docs = await loadCollectionFromMongo(col);
      if (docs.length > 0) {
        db[col].length = 0;
        for (const d of docs) {
          db[col].push(d);
        }
        loadedCount += docs.length;
      }
    }
  } finally {
    isSyncing = false;
  }
  return loadedCount;
}

/**
 * Save all currently held documents into MongoDB collections
 */
export async function syncAllToMongo() {
  if (!isMongoConnected()) return;
  for (const col of COLLECTION_NAMES) {
    if (db[col].length > 0) {
      await bulkSaveToMongo(col, [...db[col]]);
    }
  }
}

// Background auto-sync every 8 seconds to capture any in-place property mutations
const syncInterval = setInterval(() => {
  if (isMongoConnected() && !isSyncing) {
    syncAllToMongo().catch(() => {});
  }
}, 8000);
if (syncInterval.unref) syncInterval.unref();
