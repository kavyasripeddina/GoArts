// GoArts AI - Authentication Middleware
import jwt from 'jsonwebtoken';
import { findUserById, findUserByEmail } from '../db/inMemoryDb.js';

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'local_development_only_secret' : undefined));
    let user = await findUserById(decoded.id);
    if (!user && decoded.email) {
      user = await findUserByEmail(decoded.email);
    }
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User account not found or deactivated.' });
    }
    // Authoritative user from database
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
  }
  next();
};

export const requireAdmin = requireRole('admin');
export const requireArtist = requireRole('artist', 'admin');
export const requireCustomer = requireRole('customer', 'admin');
