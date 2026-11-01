// GoArts AI - Notifications, Favorites routes
import express from 'express';
import { db, newId, now, saveItem, deleteById } from '../db/inMemoryDb.js';
import { updateDocsInMongo, updateDocInMongo, isMongoConnected, loadCollectionFromMongo } from '../db/mongo.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// ── Notifications ──────────────────────────────────────────

// GET /api/notifications
router.get('/notifications', authenticate, async (req, res) => {
  // Ensure notifications are fetched for authenticated user only
  let notifications = (db.notifications || []).filter((n) => n.userId === req.user.id);

  // If memory has fewer than expected or cold start, synchronize from MongoDB
  if (isMongoConnected() && notifications.length === 0) {
    const mongoNotifs = await loadCollectionFromMongo('notifications');
    const userMongoNotifs = mongoNotifs.filter((n) => n.userId === req.user.id);
    if (userMongoNotifs.length > 0) {
      for (const n of userMongoNotifs) {
        if (!db.notifications.some((item) => item.id === n.id)) {
          db.notifications.push(n);
        }
      }
      notifications = db.notifications.filter((n) => n.userId === req.user.id);
    }
  }

  notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const paged = notifications.slice(0, 50);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  res.json({ notifications: paged, unreadCount });
});

// PUT /api/notifications/read-all - Mark all notifications as read (persisted)
router.put('/notifications/read-all', authenticate, async (req, res) => {
  (db.notifications || [])
    .filter((n) => n.userId === req.user.id)
    .forEach((n) => { n.isRead = true; });

  if (isMongoConnected()) {
    await updateDocsInMongo('notifications', { userId: req.user.id }, { isRead: true });
  }

  res.json({ success: true, message: 'All notifications marked as read.' });
});

// PUT /api/notifications/:id/read - Mark single notification as read (persisted)
router.put('/notifications/:id/read', authenticate, async (req, res) => {
  const notif = (db.notifications || []).find((n) => n.id === req.params.id && n.userId === req.user.id);
  if (!notif) {
    return res.status(404).json({ error: 'Notification not found.' });
  }

  notif.isRead = true;
  if (isMongoConnected()) {
    await updateDocInMongo('notifications', req.params.id, { isRead: true });
  }

  res.json({ success: true, notification: notif });
});

// ── Favorites ──────────────────────────────────────────────

// GET /api/favorites
router.get('/favorites', authenticate, (req, res) => {
  const favs = (db.favorites || [])
    .filter((f) => f.customerId === req.user.id)
    .map((f) => {
      const artist = (db.artists || []).find((a) => a.id === f.artistId);
      return { ...f, artist };
    })
    .filter((f) => f.artist);
  res.json({ favorites: favs });
});

// POST /api/favorites
router.post('/favorites', authenticate, async (req, res) => {
  const { artistId } = req.body;
  if (!artistId) return res.status(400).json({ error: 'artistId is required.' });

  const artist = (db.artists || []).find((a) => a.id === artistId);
  if (!artist) return res.status(404).json({ error: 'Artist not found.' });

  const exists = (db.favorites || []).find((f) => f.customerId === req.user.id && f.artistId === artistId);
  if (exists) return res.status(409).json({ error: 'Already in favorites.' });

  const fav = { id: newId(), customerId: req.user.id, artistId, createdAt: now() };
  await saveItem('favorites', fav);
  res.status(201).json({ favorite: { ...fav, artist } });
});

// DELETE /api/favorites/:artistId
router.delete('/favorites/:artistId', authenticate, async (req, res) => {
  const fav = (db.favorites || []).find((f) => f.customerId === req.user.id && f.artistId === req.params.artistId);
  if (!fav) return res.status(404).json({ error: 'Favorite not found.' });
  await deleteById('favorites', fav.id);
  res.json({ success: true });
});

export default router;
