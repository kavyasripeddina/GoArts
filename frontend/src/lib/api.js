// GoArts AI - API Client
import axios from 'axios';

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    const clean = envUrl.trim().replace(/\/+$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }
  return '/api';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token (prioritizes tab-isolated sessionStorage so customer & artist can be tested in 2 tabs)
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('goarts_token') || localStorage.getItem('goarts_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      sessionStorage.removeItem('goarts_token');
      sessionStorage.removeItem('goarts_user');
      localStorage.removeItem('goarts_token');
      localStorage.removeItem('goarts_user');
      // Redirect to login if on protected page
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth ───────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data),
  verifyAadhaar: (data) => api.post('/auth/verify-aadhaar', data),
};

// ── Artists ────────────────────────────────────────────────
export const artistsAPI = {
  list: (params) => api.get('/artists', { params }),
  featured: () => api.get('/artists/featured'),
  categories: () => api.get('/artists/categories'),
  leaderboard: (params) => api.get('/artists/leaderboard', { params }),
  getById: (id) => api.get(`/artists/${id}`),
  getReviews: (id) => api.get(`/artists/${id}/reviews`),
  addReview: (id, data) => api.post(`/artists/${id}/reviews`, data),
  getMyProfile: () => api.get('/artists/my'),
  updateMyProfile: (data) => api.put('/artists/my', data),
  updateAvailability: (data) => api.post('/artists/my/availability', data),
  submitVerification: (data) => api.post('/artists/verify-request', data),
};

// ── Bookings ───────────────────────────────────────────────
export const bookingsAPI = {
  create: (data) => api.post('/bookings', data),
  myBookings: (params) => api.get('/bookings/my', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  updateStatus: (id, data) => api.put(`/bookings/${id}/status`, data),
  payMilestone: (id, data) => api.post(`/bookings/${id}/pay`, data),
  requestChat: (id) => api.post(`/bookings/${id}/chat/request`),
  getMessages: (id) => api.get(`/bookings/${id}/messages`),
  sendMessage: (id, data) => api.post(`/bookings/${id}/messages`, data),
  submitReview: (id, data) => api.post(`/bookings/${id}/review`, data),
};

// ── Open Events / Gig Board ────────────────────────────────
export const eventsAPI = {
  list: (params) => api.get('/events', { params }),
  myEvents: () => api.get('/events/my'),
  create: (data) => api.post('/events', data),
  getById: (id) => api.get(`/events/${id}`),
  submitProposal: (id, data) => api.post(`/events/${id}/proposals`, data),
  acceptProposal: (eventId, proposalId) => api.put(`/events/${eventId}/proposals/${proposalId}/accept`),
};

// ── Admin ──────────────────────────────────────────────────
export const adminAPI = {
  overview: (params) => api.get('/admin/overview', { params }),
  revenue: () => api.get('/admin/revenue'),
  artists: (params) => api.get('/admin/artists', { params }),
  updateArtistStatus: (id, data) => api.put(`/admin/artists/${id}/status`, data),
  updateArtistTier: (id, data) => api.put(`/admin/artists/${id}/tier`, data),
  verifications: (params) => api.get('/admin/verifications', { params }),
  reviewVerification: (id, data) => api.put(`/admin/verifications/${id}`, data),
  customers: (params) => api.get('/admin/customers', { params }),
  updateCustomerStatus: (id, data) => api.put(`/admin/customers/${id}/status`, data),
  reviewCustomerKyc: (id, data) => api.put(`/admin/customers/${id}/kyc`, data),
  bookings: (params) => api.get('/admin/bookings', { params }),
  auditLogs: () => api.get('/admin/audit-logs'),
  reseed: () => api.post('/admin/reseed'),
  memberships: (params) => api.get('/admin/memberships', { params }),
  reviewMembership: (id, data) => api.put(`/admin/memberships/${id}/review`, data),
};

// ── AI & Azure Cloud Services ──────────────────────────────
export const aiAPI = {
  match: (data) => api.post('/ai/match', data),
  plan: (data) => api.post('/ai/plan', data),
  chat: (data) => api.post('/ai/chat', data),
  talentScore: (artistId) => api.get(`/ai/talent-score/${artistId}`),
  cloudStatus: () => api.get('/ai/cloud-status'),
  analyzeVision: (data) => api.post('/ai/vision/analyze', data),
  searchVenueMaps: (query) => api.get('/ai/maps/search', { params: { query } }),
  getLogistics: (artistCity, venueCity) => api.get('/ai/maps/logistics', { params: { artistCity, venueCity } }),
  getReelInfo: (data) => api.post('/ai/media/reel-info', data),
  // New AI Ecosystem endpoints
  talentRating: (data) => api.post('/ai/talent-rating', data),
  audienceAnalytics: (artistId) => api.get(`/ai/audience-analytics/${artistId}`),
  predictEvent: (data) => api.post('/ai/predict-event', data),
  generatePoster: (data) => api.post('/ai/generate-poster', data),
  socialContent: (data) => api.post('/ai/social-content', data),
  subscriptionPlans: () => api.get('/ai/subscription-plans'),
  generateVideoReel: (data) => api.post('/ai/video-reel/generate', data),
  gigPrep: (data) => api.post('/ai/gig-prep', data),
  requestMembership: (data) => api.post('/ai/memberships/request', data),
  myMembership: () => api.get('/ai/memberships/my'),
};

// ── Favorites & Notifications ──────────────────────────────
export const miscAPI = {
  getFavorites: () => api.get('/favorites'),
  addFavorite: (artistId) => api.post('/favorites', { artistId }),
  removeFavorite: (artistId) => api.delete(`/favorites/${artistId}`),
  getNotifications: () => api.get('/notifications'),
  markAllRead: () => api.put('/notifications/read-all'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
};

export default api;
