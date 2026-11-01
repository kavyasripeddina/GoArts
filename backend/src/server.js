// GoArts AI - Main Server Entry Point
import 'dotenv/config';
import dns from 'node:dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { seedDatabase } from './seed/seedData.js';
import { connectMongo, getMongoDb } from './db/mongo.js';
import { db, loadAllFromMongo, syncAllToMongo } from './db/inMemoryDb.js';
import authRoutes from './routes/auth.js';
import artistRoutes from './routes/artists.js';
import bookingRoutes from './routes/bookings.js';
import adminRoutes from './routes/admin.js';
import aiRoutes from './routes/ai.js';
import miscRoutes from './routes/misc.js';
import eventRoutes from './routes/events.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || '';

// ── Security & Proxy ────────────────────────────────────────
// Required for Render and reverse proxies to correctly forward client IPs
app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Parse allowed origins dynamically (handles trailing slashes, comma-separated URLs, and *.vercel.app)
const developmentOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://localhost:4173'
];

const configuredOrigins = FRONTEND_URL
  .split(',')
  .map((u) => u.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? configuredOrigins
  : [...developmentOrigins, ...configuredOrigins];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.replace(/\/+$/, '');

    if (allowedOrigins.includes(cleanOrigin)) {
      return callback(null, true);
    }

    return callback(new Error('Origin not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Rate limiting (generous for active dashboard polling and interactive pilot use)
const generalLimiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, 
  max: 50000, 
  skip: () => process.env.NODE_ENV !== 'production',
  message: { error: 'Too many requests. Please try again later.' } 
});
const authLimiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, 
  max: 5000, 
  skip: () => process.env.NODE_ENV !== 'production',
  message: { error: 'Too many authentication attempts. Please try again later.' } 
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ── Middleware ─────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Static uploads (if any)
app.use('/uploads', express.static(join(__dirname, '../uploads')));

// ── Routes ─────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api', miscRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'GoArts AI API', version: '1.0.0', timestamp: new Date().toISOString() });
});

// ── Error Handler ──────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message,
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// ── Start ──────────────────────────────────────────────────

async function start() {
  const mongo = await connectMongo();

  // Production must always use MongoDB Atlas
  if (!mongo && process.env.NODE_ENV === 'production') {
    throw new Error('MongoDB connection is required in production. Server startup stopped.');
  }

  const loadedCount = mongo ? await loadAllFromMongo() : 0;

  if (mongo && loadedCount === 0) {
    // Never seed an empty production database automatically
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Production database is empty. Automatic demo seeding is disabled.');
    }

    console.log('🌱 No existing data found. Initializing development seed data...');
    await seedDatabase(false);
    await syncAllToMongo();
  } else if (!mongo) {
    // Development-only in-memory fallback
    console.log('⚠️ MongoDB unavailable. Using development in-memory data.');
    await seedDatabase(false);
  } else {
    console.log(`📦 Loaded ${loadedCount} documents from MongoDB.`);
    console.log('🔒 Existing database records are preserved.');
  }

  app.listen(PORT, () => {
    console.log(`\n🚀 GoArts AI API running on port ${PORT}`);
    console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🍃 Database Status: ${mongo ? 'Connected to MongoDB Atlas' : 'Development In-Memory Mode'}`);
    console.log(`\n🌍 Allowed Frontend Origin(s): ${allowedOrigins.join(', ')}\n`);
  });
}


export { app, start };
export default app;

if (process.env.NODE_ENV !== 'test') {
  start();
}
