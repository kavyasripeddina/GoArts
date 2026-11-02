// GoArts AI Ecosystem - Comprehensive AI Tools Hub
import { useState } from 'react';
import { Navbar, Footer } from '../components/shared';
import { aiAPI, artistsAPI } from '../lib/api';
import { Brain, Zap, Star, BarChart2, Calendar, Users, MapPin, Music, DollarSign, ChevronRight, Loader2, AlertCircle, TrendingUp, Target, Award } from 'lucide-react';
import toast from 'react-hot-toast';

const TAB_ICONS = { matching: Zap, planner: Calendar, rating: Star, analytics: BarChart2, prediction: TrendingUp };

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

function ScoreBar({ score, max = 100, color = '#4285F4' }) {
  return (
    <div style={{ background: 'var(--color-surface)', borderRadius: '99px', height: '8px', overflow: 'hidden', flex: 1 }}>
      <div style={{ width: `${(score / max) * 100}%`, height: '100%', background: color, borderRadius: '99px', transition: 'width 0.8s ease' }} />
    </div>
  );
}

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
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Enter your event details and our AI will match the best artists from our verified roster.</p>
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
          {loading ? <><Loader2 size={16} className="spin" /> Matching...</> : <><Zap size={16} /> Find Best Artists</>}
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
            {(result.matches || []).map((m, i) => (
              <div key={m.artist.id} style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
                  <img src={m.artist.avatar} alt={m.artist.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(m.artist.name)}&background=4285F4&color=fff`; }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{m.artist.name}</span>
                    <span style={{ background: 'rgba(66,133,244,0.12)', color: '#4285F4', fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '99px' }}>{m.artist.category}</span>
                    <span style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '99px' }}>Score: {m.score}/100</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>📍 {m.artist.city} • ⭐ {m.artist.rating}/5 • Starting ₹{m.artist.startingPrice?.toLocaleString('en-IN')}</div>
                  {m.reasons?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {m.reasons.map(r => <span key={r} style={{ background: 'rgba(16,185,129,0.08)', color: '#10b981', fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>✓ {r}</span>)}
                    </div>
                  )}
                </div>
                <a href={`/artists/${m.artist.id}`} className="btn btn-sm btn-outline" style={{ flexShrink: 0 }}>View</a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Describe your event in plain language and AI will create a complete plan with artist lineup, budget, and timeline.</p>
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
          {loading ? <><Loader2 size={16} className="spin" /> Planning...</> : <><Brain size={16} /> Generate Event Plan</>}
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
                    {rec.artists?.map(a => (
                      <a key={a.id} href={`/artists/${a.id}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '0.5rem 0.75rem', textDecoration: 'none', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                        <img src={a.avatar} alt={a.name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(a.name)}&background=4285F4&color=fff&size=28`; }} />
                        <span>{a.name}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>⭐{a.rating}</span>
                      </a>
                    ))}
                    {(!rec.artists || rec.artists.length === 0) && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No approved artists in this category yet</span>}
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
                  <span style={{ fontWeight: 700, color: '#4285F4', minWidth: '80px', fontSize: '0.8rem' }}>{t.time}</span>
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

function RatingTab() {
  const [artists, setArtists] = useState([]);
  const [selected, setSelected] = useState(null);
  const [ratingData, setRatingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingArtists, setLoadingArtists] = useState(false);

  const loadArtists = async () => {
    setLoadingArtists(true);
    try {
      const { data } = await artistsAPI.list({ limit: 50 });
      setArtists(data.artists || []);
    } catch {} finally { setLoadingArtists(false); }
  };

  useState(() => { loadArtists(); }, []);

  const fetchRating = async (artistId) => {
    setLoading(true);
    setRatingData(null);
    try {
      const { data } = await aiAPI.talentScore(artistId);
      setRatingData(data);
    } catch (err) {
      toast.error('Failed to load talent score.');
    } finally { setLoading(false); }
  };

  const handleSelect = (artist) => {
    setSelected(artist);
    fetchRating(artist.id);
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>⭐ AI Talent Rating System</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>AI evaluates artists on Reviews, Booking Completion, Responsiveness, Profile Quality, and Verification — generating a score out of 100.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) 2fr', gap: '1.5rem' }}>
        <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '1rem', maxHeight: '500px', overflowY: 'auto' }}>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem', padding: '0 0.25rem' }}>SELECT ARTIST</div>
          {loadingArtists && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}><Loader2 size={20} className="spin" /></div>}
          {artists.map(a => (
            <button key={a.id} onClick={() => handleSelect(a)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.5rem', borderRadius: '10px', border: 'none', cursor: 'pointer', background: selected?.id === a.id ? 'rgba(66,133,244,0.12)' : 'transparent', color: selected?.id === a.id ? '#4285F4' : 'var(--text-primary)', transition: 'all 0.15s', textAlign: 'left', marginBottom: '0.25rem' }}>
              <img src={a.avatar} alt={a.name} style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(a.name)}&background=4285F4&color=fff&size=32`; }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.category}</div>
              </div>
            </button>
          ))}
        </div>

        <div>
          {!selected && (
            <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Star size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <p>Select an artist to view their AI Talent Score</p>
            </div>
          )}
          {loading && <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}><Loader2 size={32} className="spin" /></div>}
          {ratingData && !loading && (
            <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #4285F4, #BC4639)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white' }}>{ratingData.talentScore ?? '—'}</span>
                </div>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{selected?.name}</div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ background: ratingData.label === 'Excellent' ? 'rgba(16,185,129,0.12)' : 'rgba(66,133,244,0.12)', color: ratingData.label === 'Excellent' ? '#10b981' : '#4285F4', fontWeight: 700, fontSize: '0.85rem', padding: '0.25rem 0.75rem', borderRadius: '99px' }}>{ratingData.label}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>AI Talent Score</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {(ratingData.factors || []).map(f => (
                  <div key={f.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{f.name}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: f.score === null ? 'var(--text-muted)' : 'var(--text-primary)' }}>{f.score === null ? '—' : `${f.score}/${f.max}`}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <ScoreBar score={f.score || 0} max={f.max} color={f.score >= f.max * 0.7 ? '#10b981' : f.score >= f.max * 0.4 ? '#4285F4' : '#f59e0b'} />
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', minWidth: '120px' }}>{f.note}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AnalyticsTab() {
  const [artists, setArtists] = useState([]);
  const [selected, setSelected] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  useState(() => {
    artistsAPI.list({ limit: 50 }).then(({ data }) => setArtists(data.artists || [])).catch(() => {});
  }, []);

  const fetchAnalytics = async (artistId) => {
    setLoading(true);
    setAnalytics(null);
    try {
      const { data } = await aiAPI.audienceAnalytics(artistId);
      setAnalytics(data);
    } catch { toast.error('Failed to load analytics.'); } finally { setLoading(false); }
  };

  const handleSelect = (a) => { setSelected(a); fetchAnalytics(a.id); };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>📊 AI Audience Analytics</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Deep audience intelligence — crowd reactions, popular event types, engagement rates, and booking trends per artist.</p>
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {artists.slice(0, 12).map(a => (
          <button key={a.id} onClick={() => handleSelect(a)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.75rem', borderRadius: '99px', border: `1px solid ${selected?.id === a.id ? '#4285F4' : 'var(--color-border)'}`, background: selected?.id === a.id ? 'rgba(66,133,244,0.12)' : 'var(--color-surface)', color: selected?.id === a.id ? '#4285F4' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, transition: 'all 0.15s' }}>
            {a.name}
          </button>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '3rem' }}><Loader2 size={32} className="spin" style={{ color: '#4285F4' }} /></div>}
      {!selected && !loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '14px' }}>
          <BarChart2 size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p>Select an artist above to view their audience analytics</p>
        </div>
      )}
      {analytics && !loading && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
            {[
              { label: 'Total Bookings', value: analytics.analytics.totalBookings, icon: '📅' },
              { label: 'Completed Shows', value: analytics.analytics.completedShows, icon: '✅' },
              { label: 'Avg Rating', value: `${analytics.analytics.averageRating}/5`, icon: '⭐' },
              { label: 'Engagement Rate', value: `${analytics.analytics.engagementRate}%`, icon: '🔥' },
              { label: 'Avg Audience', value: `~${analytics.analytics.estimatedAvgAudienceSize}`, icon: '👥' },
              { label: 'Total Reviews', value: analytics.analytics.totalReviews, icon: '💬' },
            ].map(stat => (
              <div key={stat.label} style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{stat.icon}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stat.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {analytics.analytics.topEventTypes?.length > 0 && (
            <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '1.25rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)', fontSize: '1rem' }}>Top Event Types</h3>
              {analytics.analytics.topEventTypes.map(et => (
                <div key={et.type} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{et.type}</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{et.count} bookings</strong>
                </div>
              ))}
            </div>
          )}

          {analytics.analytics.monthlyTrend?.length > 0 && (
            <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '1.25rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)', fontSize: '1rem' }}>Monthly Booking Trend (Last 6 Months)</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '80px' }}>
                {analytics.analytics.monthlyTrend.map(m => {
                  const max = Math.max(...analytics.analytics.monthlyTrend.map(x => x.bookings), 1);
                  return (
                    <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                      <div style={{ width: '100%', background: '#4285F4', borderRadius: '4px 4px 0 0', height: `${Math.max(4, (m.bookings / max) * 60)}px`, transition: 'height 0.5s' }} />
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{m.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {analytics.insights?.length > 0 && (
            <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '1.25rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)', fontSize: '1rem' }}>💡 AI Insights</h3>
              {analytics.insights.map((insight, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 0', borderBottom: i < analytics.insights.length - 1 ? '1px solid var(--color-border)' : 'none', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <span>✦</span><span>{insight}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Predict event demand, best booking dates, and estimated revenue opportunities for your city and event type.</p>
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
              <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)', fontSize: '1rem' }}>📅 Best Booking Dates</h3>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {result.bestDates.map(d => (
                  <div key={d.date} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{d.date}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{d.day}</div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: d.demandLevel === 'High' ? '#10b981' : '#f59e0b', marginTop: '0.25rem' }}>{d.demandLevel}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.recommendations?.length > 0 && (
            <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '1.25rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)', fontSize: '1rem' }}>💡 AI Recommendations</h3>
              {result.recommendations.map((r, i) => <div key={i} style={{ display: 'flex', gap: '0.5rem', padding: '0.4rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}><span style={{ color: '#10b981' }}>✓</span>{r}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Powered by Azure OpenAI · Gemini AI · GoArts Intelligence Engine</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
              {[['🎯 AI Matching', 'Find perfect artists'], ['📋 Event Planner', 'Full event blueprint'], ['⭐ Talent Rating', 'AI score /100'], ['📊 Analytics', 'Audience intelligence'], ['📈 Prediction', 'Demand forecasting']].map(([label, desc]) => (
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
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.1rem', border: 'none', cursor: 'pointer', background: activeTab === tab.id ? 'rgba(66,133,244,0.12)' : 'transparent', color: activeTab === tab.id ? '#4285F4' : 'var(--text-secondary)', fontWeight: activeTab === tab.id ? 700 : 500, fontSize: '0.875rem', whiteSpace: 'nowrap', transition: 'all 0.15s', borderBottom: activeTab === tab.id ? '2px solid #4285F4' : '2px solid transparent', borderRadius: 0 }}>
                  <Icon size={16} />{tab.label}
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
        </div>
      </div>
      <Footer />
    </div>
  );
}
