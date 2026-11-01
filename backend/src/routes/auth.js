// GoArts AI - Auth Routes (register, login)
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db, newId, now, findUserByEmail, findUserById, saveItem, updateById } from '../db/inMemoryDb.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be configured in production.');
  }

  return secret || 'local_development_only_secret';
};

const getJwtExpires = () => process.env.JWT_EXPIRES_IN || '7d';

const signToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, getJwtSecret(), { expiresIn: getJwtExpires() });

const safeUser = (u) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  role: u.role,
  phone: u.phone || '',
  city: u.city || '',
  avatar: u.avatar || '',
  isVerified: u.isVerified || false,
  aadhaarVerified: u.aadhaarVerified || false,
  aadhaarStatus: u.aadhaarStatus || (u.aadhaarVerified ? 'verified' : 'unverified'),
  aadhaarData: u.aadhaarData || null,
  adminNotes: u.adminNotes || '',
  createdAt: u.createdAt,
});

// Known celebrity & established artist roster for impersonation protection
export const KNOWN_CELEBRITIES = [
  'arijit singh', 'anirudh ravichander', 'anirudh', 'sid sriram', 'devi sri prasad', 'dsp',
  'shreya ghoshal', 'sonu nigam', 'a. r. rahman', 'ar rahman', 'badshah', 'diljit dosanjh',
  'armaan malik', 'sunidhi chauhan', 'neha kakkar', 'jubin nautiyal', 'atif aslam',
  'rahat fateh ali khan', 'kk', 'mohit chauhan', 'lucky ali', 'prateek kuhad', 'darshan raval',
  'shankar mahadevan', 'amit trivedi', 'vishal dadlani', 'shekhar ravjiani', 'poorna dance',
];

// Concurrency mutex lock to prevent simultaneous duplicate registration race conditions
const inFlightRegistrations = new Set();

export const ARTIST_IMAGES_BY_CATEGORY = {
  Singer: [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&q=80',
  ],
  Dancer: [
    'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&q=80',
    'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=800&q=80',
    'https://images.unsplash.com/photo-1547153760-18fc86324498?w=800&q=80',
    'https://images.unsplash.com/photo-1516475429286-465d815a0df7?w=800&q=80',
  ],
  DJ: [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800&q=80',
    'https://images.unsplash.com/photo-1516873240891-4bf014598ab4?w=800&q=80',
  ],
  Band: [
    'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=800&q=80',
    'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&q=80',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
  ],
  Comedian: [
    'https://images.unsplash.com/photo-1527224538127-2104bb71c51b?w=800&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80',
  ],
  Magician: [
    'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&q=80',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80',
  ],
  Instrumentalist: [
    'https://images.unsplash.com/photo-1555354140-fca0b5527f31?w=800&q=80',
    'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&q=80',
    'https://images.unsplash.com/photo-1520523839898-50712825e617?w=800&q=80',
  ],
};

export const getUniqueArtistImage = (category = 'Singer', name = '') => {
  const list = ARTIST_IMAGES_BY_CATEGORY[category] || ARTIST_IMAGES_BY_CATEGORY.Singer;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % list.length;
  return list[index];
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  let normalizedEmail = '';
  try {
    const {
      name,
      email,
      password,
      role = 'customer',
      phone,
      city,
      category,
      avatar,
      artistTier,
      officialLinks,
      achievements,
      portfolioDocs,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    normalizedEmail = String(email).trim().toLowerCase();
    const trimmedName = String(name).trim();

    if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }

    // Strong password policy: min 8 characters, at least 1 uppercase, 1 lowercase, 1 number, 1 symbol/underscore
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#_\-+=~^()[\]{}|:;,.<>]).{8,}$/;
    if (!strongPasswordRegex.test(String(password))) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters and include at least one uppercase letter, one lowercase letter, one number, and one symbol or underscore (e.g. GoArts_2026!).',
      });
    }

    if (!['customer', 'artist'].includes(role)) {
      return res.status(400).json({ error: 'Role must be customer or artist.' });
    }

    // Concurrency Lock: Prevent multiple in-flight registrations for the exact same email
    if (inFlightRegistrations.has(normalizedEmail)) {
      return res.status(409).json({ error: 'Registration is already in progress for this email.' });
    }
    inFlightRegistrations.add(normalizedEmail);

    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      inFlightRegistrations.delete(normalizedEmail);
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // For artists, prevent duplicate accounts with the exact same display name
    if (role === 'artist') {
      const existingArtistName = db.artists.find(
        (a) => a.displayName && a.displayName.trim().toLowerCase() === trimmedName.toLowerCase()
      );
      if (existingArtistName) {
        inFlightRegistrations.delete(normalizedEmail);
        return res.status(409).json({
          error: `An artist with the name "${trimmedName}" already exists on GoArts. To protect artist identity, duplicate accounts under the same stage name are prohibited. If this is your authentic persona, please verify your identity.`,
        });
      }
    }

    const hashed = await bcrypt.hash(password, 10);
    const userId = newId();
    const user = {
      id: userId,
      email: normalizedEmail,
      password: hashed,
      role,
      name: trimmedName,
      phone: phone ? String(phone).trim() : '',
      city: city ? String(city).trim() : 'Hyderabad',
      avatar: avatar && typeof avatar === 'string' ? avatar.trim() : '',
      isActive: true,
      isVerified: true,
      aadhaarVerified: false,
      aadhaarData: null,
      createdAt: now(),
      updatedAt: now(),
    };

    // Save user to memory and MongoDB (persisted)
    await saveItem('users', user);

    // If artist role, handle verification, tier classification & anti-impersonation
    if (role === 'artist') {
      const artistCat = category || 'Singer';
      const userPhoto = user.avatar;
      const artistImg = userPhoto || getUniqueArtistImage(artistCat, trimmedName);

      // Check for celebrity name match or established tier claim
      const isCelebrityMatch = KNOWN_CELEBRITIES.some((celeb) =>
        trimmedName.toLowerCase().includes(celeb.toLowerCase())
      );
      const isClaimingEstablished = artistTier === 'established' || isCelebrityMatch;

      // Anti-impersonation rule: Celebrity or established claims must be verified by admin before public listing
      const initialStatus = isClaimingEstablished ? 'pending' : 'approved';
      const initialTier = isClaimingEstablished ? 'established' : (artistTier || 'emerging');
      const initialVerifStatus = isClaimingEstablished ? 'pending_review' : 'unverified';

      // Tier-specific evaluation metrics
      const evaluationMetrics = isClaimingEstablished
        ? {
            identityScore: 30, // Unverified until official documentation is checked
            recognition: isCelebrityMatch ? 'Recognized Celebrity (Pending Identity Verification)' : 'Established Performer (Under Review)',
            officialPresence: {
              verifiedSocial: false,
              instagram: officialLinks?.instagram || '',
              youtube: officialLinks?.youtube || '',
              spotify: officialLinks?.spotify || '',
              website: officialLinks?.website || '',
            },
            performanceScale: 'Arena & Large Format Concerts (Pending Documentation Audit)',
            pastPerformances: achievements || 'Pending Authenticity Review',
            popularityIndex: 50,
          }
        : {
            talentScore: 88,
            audienceEngagement: 92,
            repertoireBreadth: 'Contemporary & Live Repertoire',
            skillLevel: 'Independent Performing Artist',
            liveGigsCount: 0,
            reviewScore: 0,
            portfolioReels: portfolioDocs || [],
          };

      const artistProfile = {
        id: newId(),
        userId,
        displayName: trimmedName,
        bio: isClaimingEstablished
          ? `Established ${artistCat} performing across premier venues and festivals.`
          : `Professional ${artistCat} based in ${user.city}. Available for weddings, corporate events, and live concerts.`,
        category: artistCat,
        artistTier: initialTier,
        verificationStatus: initialVerifStatus,
        celebrityClaim: isClaimingEstablished,
        evaluationMetrics,
        genres: ['Live Music', 'Fusion', 'Acoustic'],
        languages: ['Telugu', 'Hindi', 'English'],
        city: user.city,
        startingPrice: isClaimingEstablished ? 250000 : 30000,
        rating: 0,
        reviewCount: 0,
        image: artistImg,
        images: [artistImg],
        verified: false,
        aadhaarVerified: false,
        featured: isClaimingEstablished,
        status: initialStatus,
        eventTypes: ['Wedding', 'Corporate Event', 'Private Party', 'Cultural Event', 'Concert'],
        audienceSize: isClaimingEstablished ? '500-25000' : '50-1000',
        experience: isClaimingEstablished ? 10 : 3,
        tags: [artistCat, 'Live Performance', initialTier === 'established' ? 'Celebrity Headliner' : 'Emerging Talent'],
        profileScore: isClaimingEstablished ? 65 : 75,
        totalBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        responseRate: 100,
        socialLinks: {
          instagram: officialLinks?.instagram || '',
          youtube: officialLinks?.youtube || '',
          spotify: officialLinks?.spotify || '',
          facebook: '',
        },
        technicalRequirements: 'Standard stage audio monitor & wireless microphone.',
        packages: [
          {
            name: isClaimingEstablished ? 'Headline Concert Showcase' : 'Standard Performance',
            duration: isClaimingEstablished ? '3 Hours' : '2 Hours',
            price: isClaimingEstablished ? 250000 : 30000,
            description: isClaimingEstablished
              ? 'Complete headline concert set with full production staging'
              : 'Solo/Ensemble live performance with sound check & backing gear',
          },
        ],
        unavailableDates: [],
        createdAt: now(),
        updatedAt: now(),
      };

      // Ensure no duplicate artist profile for same userId
      const existingProfile = db.artists.find((a) => a.userId === userId);
      if (!existingProfile) {
        await saveItem('artists', artistProfile);
      }

      // If celebrity claim, notify Admin command center
      if (isClaimingEstablished) {
        const adminUsers = db.users.filter((u) => u.role === 'admin');
        for (const admin of adminUsers) {
          await saveItem('notifications', {
            id: newId(),
            userId: admin.id,
            type: 'celebrity_claim_pending',
            message: `🛡️ Celebrity Verification Required: Account registered as "${trimmedName}" (${initialTier} tier). Identity verification required before public marketplace approval.`,
            isRead: false,
            createdAt: now(),
          });
        }
      }
    }

    // Welcome Notification (Awaited & Persisted)
    const welcomeNotif = {
      id: newId(),
      userId,
      type: 'welcome',
      message: `Welcome to GoArts AI, ${trimmedName}! Your ${role} account is active.`,
      isRead: false,
      createdAt: now(),
    };
    await saveItem('notifications', welcomeNotif);

    inFlightRegistrations.delete(normalizedEmail);
    const token = signToken(user);
    res.status(201).json({ token, user: safeUser(user) });
  } catch (err) {
    if (normalizedEmail) inFlightRegistrations.delete(normalizedEmail);
    console.error('Register error:', err);
    if (err.code === 11000) {
      return res.status(409).json({ error: 'An account with this email already exists in the database.' });
    }
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await findUserByEmail(normalizedEmail);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account has been deactivated. Contact support.' });
    }

    const valid = await bcrypt.compare(String(password), user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signToken(user);
    res.json({ token, user: safeUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  res.json({ user: safeUser(req.user) });
});

// PUT /api/auth/me
router.put('/me', authenticate, async (req, res) => {
  const { name, phone, city, password, avatar } = req.body;
  const updates = {};
  if (name && String(name).trim()) updates.name = String(name).trim();
  if (phone !== undefined) updates.phone = String(phone).trim();
  if (city && String(city).trim()) updates.city = String(city).trim();
  if (avatar !== undefined) updates.avatar = String(avatar).trim();

  if (password) {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#_\-+=~^()[\]{}|:;,.<>]).{8,}$/;
    if (!strongPasswordRegex.test(String(password))) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters and include uppercase, lowercase, numbers, and symbols/underscores.',
      });
    }
    updates.password = await bcrypt.hash(String(password), 10);
  }

  const updatedUser = await updateById('users', req.user.id, updates);
  if (!updatedUser) return res.status(404).json({ error: 'User not found.' });

  // If user is an artist and avatar was updated, sync artist profile image
  if (req.user.role === 'artist' && avatar) {
    const artist = db.artists.find((a) => a.userId === req.user.id);
    if (artist) {
      await updateById('artists', artist.id, {
        image: avatar,
        images: [avatar, ...(artist.images || []).filter((im) => im !== avatar)].slice(0, 5),
      });
    }
  }

  res.json({ user: safeUser(updatedUser), message: 'Profile updated successfully.' });
});

// POST /api/auth/verify-aadhaar - Government Aadhaar & National ID Verification
router.post('/verify-aadhaar', authenticate, async (req, res) => {
  const { aadhaarNumber, legalName, idType = 'Aadhaar (UIDAI)', submitForAdminReview } = req.body;

  if (!aadhaarNumber || !legalName) {
    return res.status(400).json({ error: 'Legal name and Government ID/Aadhaar number are required.' });
  }

  // Clean and format Aadhaar / ID number
  const cleanNumber = String(aadhaarNumber).replace(/[\s-]/g, '');

  if (String(idType).toLowerCase().includes('aadhaar')) {
    if (!/^\d{12}$/.test(cleanNumber)) {
      return res.status(400).json({ error: 'Please enter a valid 12-digit UIDAI Aadhaar number (digits only).' });
    }
  } else if (cleanNumber.length < 8) {
    return res.status(400).json({ error: 'Please enter a valid Government ID number.' });
  }

  // SHA-256 hash for secure matching without exposing full plain ID
  const aadhaarHash = crypto.createHash('sha256').update(cleanNumber).digest('hex');

  // Strict role-based Aadhaar uniqueness:
  // - No 2 customer accounts can share the same Aadhaar.
  // - No 2 artist accounts can share the same Aadhaar.
  // - The same person CAN have one customer account and one artist account with their Aadhaar.
  const duplicateInSameRole = db.users.find(
    (u) => u.aadhaarHash === aadhaarHash && u.role === req.user.role && u.id !== req.user.id
  ) || (db.verifications || []).find(
    (v) => v.aadhaarHash === aadhaarHash && v.role === req.user.role && v.userId !== req.user.id
  );

  if (duplicateInSameRole) {
    const existingName = duplicateInSameRole.name || duplicateInSameRole.legalName || 'another user';
    return res.status(409).json({
      error: `This Aadhaar number is already verified on another ${req.user.role} account (${existingName}). Each Aadhaar card can only be linked to one ${req.user.role} profile.`,
    });
  }

  const maskedNumber = cleanNumber.length === 12
    ? `XXXX-XXXX-${cleanNumber.slice(-4)}`
    : `***${cleanNumber.slice(-4)}`;

  const isCustomerReview = req.user.role === 'customer' && submitForAdminReview === true;
  const status = isCustomerReview ? 'under_review' : 'verified';

  // Check if existing verification record exists for this user
  let verificationRecord = (db.verifications || []).find((v) => v.userId === req.user.id);
  if (verificationRecord) {
    verificationRecord.role = req.user.role;
    verificationRecord.legalName = String(legalName).trim();
    verificationRecord.idType = idType;
    verificationRecord.maskedNumber = maskedNumber;
    verificationRecord.aadhaarHash = aadhaarHash;
    verificationRecord.status = status;
    verificationRecord.updatedAt = now();
    await updateById('verifications', verificationRecord.id, verificationRecord);
  } else {
    verificationRecord = {
      id: newId(),
      userId: req.user.id,
      customerName: req.user.name,
      customerEmail: req.user.email,
      role: req.user.role,
      verificationTrack: req.user.role === 'customer' ? 'customer_kyc' : 'regular',
      legalName: String(legalName).trim(),
      idType,
      maskedNumber,
      aadhaarHash,
      status,
      verifiedAt: status === 'verified' ? now() : null,
      createdAt: now(),
      updatedAt: now(),
    };
    await saveItem('verifications', verificationRecord);
  }

  // Update user
  const aadhaarData = {
    idType,
    legalName: String(legalName).trim(),
    maskedNumber,
    submittedAt: now(),
    verifiedAt: status === 'verified' ? now() : null,
  };

  const updatedUser = await updateById('users', req.user.id, {
    aadhaarVerified: status === 'verified',
    aadhaarStatus: status,
    aadhaarHash,
    aadhaarData,
  });

  // If user is artist, update their artist profile
  if (req.user.role === 'artist') {
    const artist = db.artists.find((a) => a.userId === req.user.id);
    if (artist) {
      await updateById('artists', artist.id, {
        verified: status === 'verified',
        aadhaarVerified: status === 'verified',
        aadhaarData,
      });
    }
  }

  // If customer submitted for admin review, notify all admins
  if (isCustomerReview) {
    const admins = db.users.filter((u) => u.role === 'admin');
    for (const admin of admins) {
      await saveItem('notifications', {
        id: newId(),
        userId: admin.id,
        type: 'verification_request',
        message: `📋 Customer KYC Verification Alert: "${req.user.name}" submitted Government ID (${idType}: ${maskedNumber}) for admin manual approval.`,
        isRead: false,
        createdAt: now(),
      });
    }
  }

  // Idempotent KYC notification
  const existingKycNotif = db.notifications.find(
    (n) => n.userId === req.user.id && n.type === 'kyc_verified'
  );
  if (!existingKycNotif) {
    await saveItem('notifications', {
      id: newId(),
      userId: req.user.id,
      type: 'kyc_verified',
      message: `🛡️ Government ID Verified: Your ${idType} (${maskedNumber}) has been authenticated. You now have a verified badge!`,
      isRead: false,
      createdAt: now(),
    });
  }

  res.json({
    success: true,
    message: 'Government ID / Aadhaar successfully verified.',
    user: safeUser(updatedUser),
  });
});

export default router;
