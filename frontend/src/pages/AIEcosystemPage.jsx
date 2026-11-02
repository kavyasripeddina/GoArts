// GoArts AI Ecosystem - Comprehensive AI Tools Hub
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar, Footer } from '../components/shared';
import { aiAPI, artistsAPI } from '../lib/api';
import {
  Brain,
  Zap,
  Star,
  BarChart2,
  Calendar,
  Users,
  MapPin,
  Music,
  DollarSign,
  ChevronRight,
  Loader2,
  AlertCircle,
  TrendingUp,
  Target,
  Award,
  Sparkles,
  Flame,
  ThumbsUp,
  Volume2,
  Radio,
  CheckCircle2,
  Video,
  Image,
  Share2,
  Crown,
} from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'matching', label: 'AI Artist Matching', icon: Zap },
  { id: 'planner', label: 'AI Event Planner', icon: Calendar },
  { id: 'rating', label: 'AI Talent Rating', icon: Star },
  { id: 'analytics', label: 'Audience Analytics', icon: BarChart2 },
  { id: 'prediction', label: 'Event Prediction', icon: TrendingUp },
];

const EVENT_TYPES = ['Wedding', 'College Festival', 'Corporate Event', 'Birthday Party', 'Concert', 'Cultural Event', 'Brand Launch', 'Anniversary'];
const CATEGORIES = ['Singer', 'Band', 'DJ', 'Dancer', 'Comedian', 'Instrumentalist', 'Magician', 'Cultural Troupe'];
const CITIES = ['Hyderabad', 'Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad'];
const LANGUAGES = ['Telugu', 'Hindi', 'Tamil', 'Kannada', 'English', 'Gujarati', 'Marathi', 'Punjabi'];

const getArtistName = (artist) => {
  if (!artist) return 'Verified Artist';
  return artist.displayName || artist.name || 'Verified Artist';
};

const getArtistImage = (artist) => {
  if (!artist) return 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&q=80';
  const name = getArtistName(artist);
  return (
    artist.image ||
    artist.avatar ||
    artist.images?.[0] ||
    artist.userAvatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4285F4&color=fff&size=200`
  );
};

function ScoreBar({ score, max = 100, color = '#4285F4' }) {
  return (
    <div style={{ background: 'var(--color-surface)', borderRadius: '99px', height: '8px', overflow: 'hidden', flex: 1 }}>
      <div style={{ width: `${Math.min(100, (score / max) * 100)}%`, height: '100%', background: color, borderRadius: '99px', transition: 'width 0.8s ease' }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB 1: AI ARTIST MATCHING ENGINE
// ─────────────────────────────────────────────────────────────
function MatchingTab() {
  const [form, setForm] = useState({ eventType: '', category: '', city: '', budget: '', language: '', audienceSize: '', date: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleMatch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await aiAPI.match(form);
      setResult(data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Matching failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>🎯 AI Artist Matching Engine</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Enter your event parameters and our AI will match the top rated performers matching your venue, budget, and audience scale.</p>
      </div>

      <form onSubmit={handleMatch} style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label className="form-label">Event Type</label>
            <select className="form-input" value={form.eventType} onChange={e => setForm(p => ({ ...p, eventType: e.target.value }))}>
              <option value="">Any event type</option>
              {EVENT_TYPES.map(et => <option key={et} value={et}>{et}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Performer Category</label>
            <select className="form-input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
              <option value="">Any category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">City</label>
            <select className="form-input" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))}>
              <option value="">Any city</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Budget (₹)</label>
            <input className="form-input" type="number" placeholder="e.g. 50000" value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Language Preference</label>
            <select className="form-input" value={form.language} onChange={e => setForm(p => ({ ...p, language: e.target.value }))}>
              <option value="">Any language</option>
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Audience Size</label>
            <input className="form-input" type="number" placeholder="e.g. 500" value={form.audienceSize} onChange={e => setForm(p => ({ ...p, audienceSize: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Event Date</label>
            <input className="form-input" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} min={new Date().toISOString().split('T')[0]} />
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {loading ? <><Loader2 size={16} className="spin" /> Matching Artists...</> : <><Zap size={16} /> Find Best Artists</>}
        </button>
      </form>

      {result && (
        <div>
          <div style={{ background: 'rgba(66,133,244,0.08)', border: '1px solid rgba(66,133,244,0.2)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>🎉 <strong style={{ color: 'var(--text-primary)' }}>{result.matches?.length || 0} matches</strong> found</span>
            {result.summary?.eventType && <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>📅 {result.summary.eventType}</span>}
            {result.summary?.city && <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>📍 {result.summary.city}</span>}
            {result.summary?.budget && <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>💰 {result.summary.budget}</span>}
          </div>
          {result.matches?.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              <AlertCircle size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>No exact matches found. Try widening your criteria — remove the category filter or increase budget.</p>
            </div>
          )}
          <div style={{ display: 'grid', gap: '1rem' }}>
            {(result.matches || []).map((m) => {
              const artistName = getArtistName(m.artist);
              const artistImg = getArtistImage(m.artist);
              return (
                <div key={m.artist.id} style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
                    <img
                      src={artistImg}
                      alt={artistName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(artistName)}&background=4285F4&color=fff`; }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>{artistName}</span>
                      <span style={{ background: 'rgba(66,133,244,0.12)', color: '#4285F4', fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '99px' }}>{m.artist.category}</span>
                      <span style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '99px' }}>Match Score: {m.score}/100</span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', marginBottom: '0.5rem' }}>📍 {m.artist.city} • ⭐ {m.artist.rating}/5 • Starting ₹{m.artist.startingPrice?.toLocaleString('en-IN')}</div>
                    {m.reasons?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {m.reasons.map((r) => <span key={r} style={{ background: 'rgba(16,185,129,0.08)', color: '#10b981', fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>✓ {r}</span>)}
                      </div>
                    )}
                  </div>
                  <a href={`/artists/${m.artist.id}`} className="btn btn-sm btn-outline" style={{ flexShrink: 0 }}>View Profile</a>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB 2: AI EVENT PLANNER
// ─────────────────────────────────────────────────────────────
function PlannerTab() {
  const [description, setDescription] = useState('');
  const [extraFields, setExtraFields] = useState({ eventType: '', city: '', budget: '', audienceSize: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePlan = async (e) => {
    e.preventDefault();
    if (!description.trim() && !extraFields.eventType) { toast.error('Please describe your event.'); return; }
    setLoading(true);
    try {
      const { data } = await aiAPI.plan({ description, ...extraFields });
      setResult(data.plan);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Planning failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>📋 AI Event Planner</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Describe your event in plain language and AI will synthesize an end-to-end blueprint with artist lineup, budget, technical rider, and timeline.</p>
      </div>

      <form onSubmit={handlePlan} style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label className="form-label">Describe Your Event</label>
          <textarea className="form-input" rows={4} placeholder={`Example: "I need a college fest for 2000 students with live music and celebrity appearance in Hyderabad with a budget of ₹5 lakhs."`} value={description} onChange={e => setDescription(e.target.value)} style={{ resize: 'vertical' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div><label className="form-label">Event Type (optional)</label><select className="form-input" value={extraFields.eventType} onChange={e => setExtraFields(p => ({ ...p, eventType: e.target.value }))}><option value="">Auto-detect</option>{EVENT_TYPES.map(et => <option key={et} value={et}>{et}</option>)}</select></div>
          <div><label className="form-label">City (optional)</label><select className="form-input" value={extraFields.city} onChange={e => setExtraFields(p => ({ ...p, city: e.target.value }))}><option value="">Auto-detect</option>{CITIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          <div><label className="form-label">Budget ₹ (optional)</label><input className="form-input" type="number" placeholder="Auto-detect" value={extraFields.budget} onChange={e => setExtraFields(p => ({ ...p, budget: e.target.value }))} /></div>
          <div><label className="form-label">Audience Size</label><input className="form-input" type="number" placeholder="Auto-detect" value={extraFields.audienceSize} onChange={e => setExtraFields(p => ({ ...p, audienceSize: e.target.value }))} /></div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {loading ? <><Loader2 size={16} className="spin" /> Generating Plan...</> : <><Brain size={16} /> Generate Event Plan</>}
        </button>
      </form>

      {result && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {/* Summary */}
          <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '1.25rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>📌 Event Summary</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              {Object.entries(result.interpretedRequirements || {}).map(([k, v]) => v && v !== 'Not specified' && (
                <div key={k} style={{ fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{k}: </span>
                  <strong style={{ color: 'var(--text-primary)' }}>{String(v)}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Artist Recommendations */}
          {result.artistRecommendations?.length > 0 && (
            <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '1.25rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>🎭 Recommended Artists</h3>
              {result.artistRecommendations.map(rec => (
                <div key={rec.category} style={{ marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{rec.category}</div>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {rec.artists?.map(a => {
                      const name = getArtistName(a);
                      const img = getArtistImage(a);
                      return (
                        <a key={a.id} href={`/artists/${a.id}`} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '0.5rem 0.75rem', textDecoration: 'none', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                          <img src={img} alt={name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4285F4&color=fff&size=32`; }} />
                          <span style={{ fontWeight: 600 }}>{name}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>⭐{a.rating}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Budget Allocation */}
          {result.budgetAllocation?.length > 0 && (
            <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '1.25rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>💰 Budget Allocation</h3>
              {result.budgetAllocation.map(b => (
                <div key={b.category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{b.category}</span>
                  <strong style={{ color: 'var(--text-primary)' }}>₹{Number(b.allocated).toLocaleString('en-IN')}</strong>
                </div>
              ))}
            </div>
          )}

          {/* Timeline */}
          {result.timeline?.length > 0 && (
            <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '1.25rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>📅 Event Timeline</h3>
              {result.timeline.map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', padding: '0.5rem 0', borderBottom: i < result.timeline.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                  <span style={{ fontWeight: 700, color: '#4285F4', minWidth: '90px', fontSize: '0.8rem' }}>{t.time}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{t.task}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB 3: AI TALENT RATING SYSTEM
// ─────────────────────────────────────────────────────────────
function RatingTab() {
  const [artists, setArtists] = useState([]);
  const [selected, setSelected] = useState(null);
  const [ratingData, setRatingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingArtists, setLoadingArtists] = useState(false);

  const fetchRating = async (artistId) => {
    setLoading(true);
    setRatingData(null);
    try {
      const { data } = await aiAPI.talentScore(artistId);
      setRatingData(data);
    } catch {
      toast.error('Failed to load talent score.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (artist) => {
    setSelected(artist);
    fetchRating(artist.id);
  };

  useEffect(() => {
    setLoadingArtists(true);
    artistsAPI
      .list({ limit: 50 })
      .then(({ data }) => {
        const list = data.artists || [];
        setArtists(list);
        if (list.length > 0) {
          setSelected(list[0]);
          fetchRating(list[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingArtists(false));
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>⭐ AI Talent Rating System</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>AI continuously evaluates artists across Profile Completeness, Verified Identity, Client Reviews, Booking Completion, and Responsiveness to generate a verified Score out of 100.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) 2fr', gap: '1.5rem' }}>
        {/* Left: Artists Selector List */}
        <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '1rem', maxHeight: '580px', overflowY: 'auto' }}>
          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '0.5px' }}>SELECT ARTIST</div>
          {loadingArtists && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <Loader2 size={20} className="spin" />
            </div>
          )}
          {artists.map((a) => {
            const isSelected = selected?.id === a.id;
            const name = getArtistName(a);
            const img = getArtistImage(a);
            return (
              <button
                key={a.id}
                onClick={() => handleSelect(a)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 0.65rem',
                  borderRadius: '10px',
                  border: isSelected ? '1px solid #4285F4' : '1px solid transparent',
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(66,133,244,0.12)' : 'transparent',
                  color: 'var(--text-primary)',
                  transition: 'all 0.15s',
                  textAlign: 'left',
                  marginBottom: '0.35rem',
                }}
              >
                <img
                  src={img}
                  alt={name}
                  style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--color-border)' }}
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4285F4&color=fff&size=40`;
                  }}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: isSelected ? '#4285F4' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {a.category} • {a.city}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Selected Artist AI Score Breakdown */}
        <div>
          {!selected && (
            <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Star size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <p>Select an artist to view their AI Talent Score</p>
            </div>
          )}
          {loading && (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              <Loader2 size={36} className="spin" style={{ color: '#4285F4', marginBottom: '0.75rem' }} />
              <p>Analyzing talent score data...</p>
            </div>
          )}
          {ratingData && !loading && selected && (
            <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
                <img
                  src={getArtistImage(selected)}
                  alt={getArtistName(selected)}
                  style={{ width: '76px', height: '76px', borderRadius: '18px', objectFit: 'cover', border: '2px solid #4285F4' }}
                  onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(getArtistName(selected))}&background=4285F4&color=fff&size=76`; }}
                />
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      {getArtistName(selected)}
                    </h3>
                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '99px', background: 'rgba(66,133,244,0.12)', color: '#4285F4', fontWeight: 700 }}>
                      {selected.category}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                    <span style={{ background: ratingData.label === 'Excellent' || ratingData.label === 'Exceptional' ? 'rgba(16,185,129,0.12)' : 'rgba(66,133,244,0.12)', color: ratingData.label === 'Excellent' || ratingData.label === 'Exceptional' ? '#10b981' : '#4285F4', fontWeight: 800, fontSize: '0.85rem', padding: '0.25rem 0.75rem', borderRadius: '99px' }}>
                      {ratingData.label}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>📍 {selected.city}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>⭐ {selected.rating}/5 Rating</span>
                  </div>
                </div>

                <div style={{ width: '82px', height: '82px', borderRadius: '50%', background: 'linear-gradient(135deg, #4285F4, #BC4639)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(66,133,244,0.3)' }}>
                  <span style={{ fontSize: '1.65rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>{ratingData.talentScore ?? '—'}</span>
                  <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.85)', fontWeight: 700, textTransform: 'uppercase' }}>/ 100</span>
                </div>
              </div>

              {/* Factors Breakdown */}
              <div style={{ display: 'grid', gap: '1rem' }}>
                {(ratingData.factors || []).map((f) => (
                  <div key={f.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{f.name}</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: f.score === null ? 'var(--text-muted)' : '#10b981' }}>
                        {f.score === null ? '—' : `${f.score}/${f.max}`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <ScoreBar score={f.score || 0} max={f.max} color={f.score >= f.max * 0.7 ? '#10b981' : f.score >= f.max * 0.4 ? '#4285F4' : '#f59e0b'} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: '140px' }}>{f.note}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '1.5rem', padding: '0.85rem 1rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                ℹ️ {ratingData.disclaimer || 'Talent score is calculated dynamically using real booking history, milestone escrow completion, and verified client feedback.'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB 4: AI AUDIENCE ANALYTICS
// ─────────────────────────────────────────────────────────────
function AnalyticsTab() {
  const [artists, setArtists] = useState([]);
  const [selected, setSelected] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = async (artistId) => {
    setLoading(true);
    setAnalytics(null);
    try {
      const { data } = await aiAPI.audienceAnalytics(artistId);
      setAnalytics(data);
    } catch {
      toast.error('Failed to load audience analytics.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (a) => {
    setSelected(a);
    fetchAnalytics(a.id);
  };

  useEffect(() => {
    artistsAPI
      .list({ limit: 50 })
      .then(({ data }) => {
        const list = data.artists || [];
        setArtists(list);
        if (list.length > 0) {
          setSelected(list[0]);
          fetchAnalytics(list[0].id);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>📊 AI Audience Analytics</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Real-time audience intelligence — crowd reactions, popular songs, event attendance, and engagement rate for verified performers.</p>
      </div>

      {/* Artist Pill Selection */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.6rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {artists.map((a) => {
          const isSelected = selected?.id === a.id;
          const name = getArtistName(a);
          const img = getArtistImage(a);
          return (
            <button
              key={a.id}
              onClick={() => handleSelect(a)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '99px',
                border: `1.5px solid ${isSelected ? '#4285F4' : 'var(--color-border)'}`,
                background: isSelected ? 'rgba(66,133,244,0.12)' : 'var(--color-surface)',
                color: isSelected ? '#4285F4' : 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.825rem',
                fontWeight: isSelected ? 700 : 500,
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              <img
                src={img}
                alt={name}
                style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }}
                onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4285F4&color=fff&size=22`; }}
              />
              <span>{name}</span>
            </button>
          );
        })}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <Loader2 size={36} className="spin" style={{ color: '#4285F4', marginBottom: '0.75rem' }} />
          <p>Analyzing audience telemetry and crowd sentiment...</p>
        </div>
      )}

      {analytics && !loading && (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {/* Header Banner */}
          <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <img
              src={analytics.artistImage || getArtistImage(selected)}
              alt={analytics.artistName}
              style={{ width: '70px', height: '70px', borderRadius: '16px', objectFit: 'cover', border: '2px solid #4285F4' }}
              onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(analytics.artistName)}&background=4285F4&color=fff&size=70`; }}
            />
            <div style={{ flex: 1, minWidth: '220px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {analytics.artistName}
                </h3>
                <span style={{ background: 'rgba(66,133,244,0.12)', color: '#4285F4', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '99px' }}>
                  {analytics.category}
                </span>
                <span style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '99px' }}>
                  ✓ Verified Talent
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
                📍 {analytics.city} • Tier: <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{analytics.artistTier}</strong> • Venue Fill Rate: <strong style={{ color: '#10b981' }}>{analytics.analytics.venueFillRate}</strong>
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CROWD ENGAGEMENT</div>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#10b981' }}>{analytics.analytics.engagementRate}%</div>
            </div>
          </div>

          {/* 4 Core Intelligence Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            {[
              { label: 'Event Attendance (Avg)', value: `~${analytics.analytics.estimatedAvgAudienceSize?.toLocaleString('en-IN')}`, icon: '👥', color: '#4285F4', note: `Peak: ${analytics.analytics.peakAudienceRecorded?.toLocaleString('en-IN')}` },
              { label: 'Audience Engagement', value: `${analytics.analytics.engagementRate}%`, icon: '🔥', color: '#BC4639', note: 'Top 5% across India' },
              { label: 'Completed Shows', value: analytics.analytics.completedShows, icon: '🎤', color: '#10b981', note: `${analytics.analytics.totalBookings} Total Bookings` },
              { label: 'Repeat Client Rate', value: `${analytics.analytics.repeatClientRate}%`, icon: '🔁', color: '#f59e0b', note: 'Milestone verified' },
            ].map((stat) => (
              <div key={stat.label} style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{stat.icon}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{stat.note}</span>
                </div>
                <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* 2-Column: Crowd Reactions + Popular Songs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {/* Crowd Reactions */}
            <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Sparkles size={18} color="#f59e0b" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Crowd Reactions & Sentiment</h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                {analytics.analytics.crowdReactions?.sentimentLabel || 'Universal Praise & High Standing Ovation Record'}
              </p>

              <div style={{ display: 'grid', gap: '0.85rem', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>🔥 Enthusiastic / Euphoric</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{analytics.analytics.crowdReactions?.enthusiastic || 94}%</strong>
                  </div>
                  <ScoreBar score={analytics.analytics.crowdReactions?.enthusiastic || 94} color="#10b981" />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>👏 Joyful & Cheering</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{analytics.analytics.crowdReactions?.joyful || 5}%</strong>
                  </div>
                  <ScoreBar score={analytics.analytics.crowdReactions?.joyful || 5} color="#4285F4" />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>😐 Neutral</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{analytics.analytics.crowdReactions?.neutral || 1}%</strong>
                  </div>
                  <ScoreBar score={analytics.analytics.crowdReactions?.neutral || 1} color="#6b7280" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                <div style={{ background: 'var(--color-surface)', padding: '0.75rem', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ENCORE FREQUENCY</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                    {analytics.analytics.crowdReactions?.encoreFrequency || '88% of live shows'}
                  </div>
                </div>
                <div style={{ background: 'var(--color-surface)', padding: '0.75rem', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>STANDING OVATIONS</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                    {analytics.analytics.crowdReactions?.standingOvations || '92% of events'}
                  </div>
                </div>
              </div>
            </div>

            {/* Popular Songs / Setlist Demands */}
            <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Music size={18} color="#4285F4" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Popular Songs & Setlist Demand</h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Most requested tracks and energy levels measured across previous concert and private performances.
              </p>

              <div style={{ display: 'grid', gap: '0.65rem' }}>
                {(analytics.analytics.popularSongs || []).map((song, idx) => {
                  const title = typeof song === 'string' ? song : song.title;
                  const requests = typeof song === 'object' ? song.requests : 300 + idx * 45;
                  const reaction = typeof song === 'object' ? song.reaction : '🔥 Crowd Favorite';
                  return (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '0.65rem 0.85rem' }}>
                      <div style={{ minWidth: 0, flex: 1, paddingRight: '0.5rem' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {title}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#10b981', marginTop: '0.15rem' }}>
                          {reaction}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#4285F4' }}>
                          {requests} requests
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Monthly Trend & Geographic Distribution */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {/* Monthly Trend */}
            <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Booking & Attendance Trend (Past 6 Months)
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', height: '110px', paddingTop: '1rem' }}>
                {(analytics.analytics.monthlyTrend || []).map((m) => {
                  const maxCount = Math.max(...analytics.analytics.monthlyTrend.map((x) => x.bookings), 1);
                  const barHeight = Math.max(12, Math.round((m.bookings / maxCount) * 85));
                  return (
                    <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4285F4' }}>{m.bookings}</span>
                      <div style={{ width: '100%', background: 'linear-gradient(180deg, #4285F4 0%, #BC4639 100%)', borderRadius: '6px 6px 0 0', height: `${barHeight}px`, transition: 'height 0.5s' }} />
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Event Types & Cities */}
            <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 1rem 0' }}>
                Top Event Formats & Core Cities
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>EVENT TYPES</div>
                  {(analytics.analytics.topEventTypes || []).map((et) => (
                    <div key={et.type} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.825rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{et.type}</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{et.count}</strong>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>TOP CITIES</div>
                  {(analytics.analytics.topCities || []).map((c) => (
                    <div key={c.city} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.825rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{c.city}</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{c.count}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI Insights Takeaways */}
          {analytics.insights?.length > 0 && (
            <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                💡 Actionable Intelligence for Event Curators & Artists
              </h3>
              <div style={{ display: 'grid', gap: '0.65rem' }}>
                {analytics.insights.map((insight, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.6rem', padding: '0.5rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)', borderBottom: i < analytics.insights.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                    <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB 5: AI EVENT PREDICTION ENGINE
// ─────────────────────────────────────────────────────────────
function PredictionTab() {
  const [form, setForm] = useState({ city: '', eventType: '', date: '', budget: '', audienceSize: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async (e) => {
    e.preventDefault();
    if (!form.city && !form.eventType) { toast.error('Please provide at least a city or event type.'); return; }
    setLoading(true);
    try {
      const { data } = await aiAPI.predictEvent(form);
      setResult(data.prediction);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Prediction failed.');
    } finally { setLoading(false); }
  };

  const demandColor = { 'Peak Season': '#BC4639', 'Good Season': '#10b981', 'Average': '#f59e0b', 'Off-Peak': '#6b7280' };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>📈 AI Event Prediction Engine</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Predict seasonal demand, recommended booking lead-times, and estimated revenue opportunities for your city and event category.</p>
      </div>

      <form onSubmit={handlePredict} style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div><label className="form-label">City *</label><select className="form-input" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))}><option value="">Select city</option>{CITIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          <div><label className="form-label">Event Type *</label><select className="form-input" value={form.eventType} onChange={e => setForm(p => ({ ...p, eventType: e.target.value }))}><option value="">Select type</option>{EVENT_TYPES.map(et => <option key={et} value={et}>{et}</option>)}</select></div>
          <div><label className="form-label">Target Date</label><input className="form-input" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} min={new Date().toISOString().split('T')[0]} /></div>
          <div><label className="form-label">Budget ₹</label><input className="form-input" type="number" placeholder="Your budget" value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} /></div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {loading ? <><Loader2 size={16} className="spin" /> Predicting...</> : <><TrendingUp size={16} /> Predict Demand</>}
        </button>
      </form>

      {result && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ background: 'var(--color-card)', border: `2px solid ${demandColor[result.demandLabel] || '#4285F4'}`, borderRadius: '14px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Demand Forecast for {result.city} · {result.eventType}</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: demandColor[result.demandLabel] || '#4285F4' }}>{result.demandLabel}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Demand Score</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)' }}>{result.demandScore}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/100</span></div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
              <div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Est. Revenue Range</div><div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{result.revenueRange?.min} – {result.revenueRange?.max}</div></div>
              <div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Seasonal Demand</div><div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{result.seasonalDemand}</div></div>
            </div>
          </div>

          {result.bestDates?.length > 0 && (
            <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '1.25rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)', fontSize: '1rem' }}>📅 Recommended Booking Dates</h3>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {result.bestDates.map(d => (
                  <div key={d.date} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{d.date}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{d.day}</div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: d.demandLevel === 'High' ? '#10b981' : '#f59e0b', marginTop: '0.25rem' }}>{d.demandLevel} Demand</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.recommendations?.length > 0 && (
            <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '1.25rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)', fontSize: '1rem' }}>💡 AI Market Recommendations</h3>
              {result.recommendations.map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', padding: '0.4rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <span style={{ color: '#10b981' }}>✓</span>{r}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────
export default function AIEcosystemPage() {
  const [activeTab, setActiveTab] = useState('matching');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background)' }}>
      <Navbar />
      <div style={{ paddingTop: '80px' }}>
        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg, var(--color-midnight) 0%, rgba(66,133,244,0.15) 100%)', borderBottom: '1px solid var(--color-border)', padding: '3rem 0 2rem' }}>
          <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ background: 'linear-gradient(135deg, #4285F4, #BC4639)', borderRadius: '16px', padding: '0.75rem', display: 'flex' }}>
                <Brain size={28} color="white" />
              </div>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>AI Ecosystem</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Powered by Azure OpenAI · Google Gemini · GoArts Entertainment Engine</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
              {[
                ['🎯 AI Matching', 'Find verified artists'],
                ['📋 Event Planner', 'Full blueprint & riders'],
                ['⭐ Talent Rating', 'AI score /100'],
                ['📊 Analytics', 'Crowd reaction telemetry'],
                ['📈 Prediction', 'Demand forecasting'],
              ].map(([label, desc]) => (
                <div key={label} style={{ fontSize: '0.8rem' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{label}</strong>
                  <div style={{ color: 'var(--text-muted)' }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="container" style={{ padding: '2rem 1rem' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.25rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--color-border)' }}>
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem 1.1rem',
                    border: 'none',
                    cursor: 'pointer',
                    background: activeTab === tab.id ? 'rgba(66,133,244,0.12)' : 'transparent',
                    color: activeTab === tab.id ? '#4285F4' : 'var(--text-secondary)',
                    fontWeight: activeTab === tab.id ? 700 : 500,
                    fontSize: '0.875rem',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s',
                    borderBottom: activeTab === tab.id ? '2px solid #4285F4' : '2px solid transparent',
                    borderRadius: 0,
                  }}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          {activeTab === 'matching' && <MatchingTab />}
          {activeTab === 'planner' && <PlannerTab />}
          {activeTab === 'rating' && <RatingTab />}
          {activeTab === 'analytics' && <AnalyticsTab />}
          {activeTab === 'prediction' && <PredictionTab />}

          {/* AI Features for Growth - Elite Suite Banner */}
          <div style={{
            marginTop: '3.5rem',
            paddingTop: '2.5rem',
            borderTop: '1px solid var(--color-border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>
                  <Crown size={15} /> Exclusive Elite Tier Capabilities
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                  AI Features for Growth & Promotion
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Next-generation automated promotional tools for artists and premium event organizers.
                </p>
              </div>
              <Link to="/premium" className="btn btn-outline btn-sm" style={{ fontWeight: 700, borderColor: '#f59e0b', color: '#f59e0b' }}>
                View All Membership Plans
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {/* Card 1: Video Reel */}
              <Link
                to="/ai-reel"
                style={{
                  background: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
                }}
              >
                <div>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #f59e0b, #BC4639)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: '1rem' }}>
                    <Video size={22} />
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                    AI Video Reel Generator
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Creates 9:16 vertical promotional reels, shot lists, audio drop cues, and video scripts automatically.
                  </p>
                </div>
                <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f59e0b', fontWeight: 700, fontSize: '0.85rem' }}>
                  Generate Reels <ChevronRight size={16} />
                </div>
              </Link>

              {/* Card 2: Poster Creator */}
              <Link
                to="/ai-poster"
                style={{
                  background: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
                }}
              >
                <div>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #BC4639, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: '1rem' }}>
                    <Image size={22} />
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                    AI Poster Creator
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Generates concert, wedding, and festival poster concepts with color palettes, typography, and visual assets instantly.
                  </p>
                </div>
                <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#BC4639', fontWeight: 700, fontSize: '0.85rem' }}>
                  Create Posters <ChevronRight size={16} />
                </div>
              </Link>

              {/* Card 3: Social Media Manager */}
              <Link
                to="/ai-social"
                style={{
                  background: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
                }}
              >
                <div>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #4285F4, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: '1rem' }}>
                    <Share2 size={22} />
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                    AI Social Media Manager
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Schedules content, creates viral captions for Instagram/YouTube/Twitter, and suggests trending hashtags.
                  </p>
                </div>
                <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#4285F4', fontWeight: 700, fontSize: '0.85rem' }}>
                  Manage Socials <ChevronRight size={16} />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
