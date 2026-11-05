// GoArts AI - Open Events & Gig Marketplace (Customers post events; Rising artists pitch & apply)
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  PlusCircle, Calendar, MapPin, Users, DollarSign, Send, CheckCircle, 
  Clock, ShieldCheck, Sparkles, Filter, ChevronRight, X, User, Music, MessageSquare
} from 'lucide-react';
import { Navbar, Spinner, EmptyState, formatINR, formatDate } from '../components/shared';
import { eventsAPI } from '../lib/api';
import { useAuth } from '../context/useAuth';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'Singer', 'Band', 'Dancer', 'DJ', 'Comedian', 'Cultural Troupe', 'Instrumentalist'];

export default function EventsBoardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'my_events'
  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showPostModal, setShowPostModal] = useState(searchParams.get('post') === 'true');
  const [pitchingEvent, setPitchingEvent] = useState(null);
  const [proposalsEvent, setProposalsEvent] = useState(null);

  useEffect(() => {
    if (searchParams.get('post') === 'true') {
      setShowPostModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    loadEvents();
    if (user?.role === 'customer' || user?.role === 'admin') {
      loadMyEvents();
    }
  }, [category, activeTab, user]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (category && category !== 'All') params.category = category;
      const { data } = await eventsAPI.list(params);
      setEvents(data.events || []);
    } catch {
      toast.error('Failed to load event gigs.');
    } finally {
      setLoading(false);
    }
  };

  const loadMyEvents = async () => {
    try {
      const { data } = await eventsAPI.myEvents();
      setMyEvents(data.events || []);
    } catch {}
  };

  return (
    <div style={{ background: 'var(--color-midnight)', minHeight: '100vh', color: 'var(--text-primary)' }}>
      <Navbar />

      <main style={{ paddingTop: '80px', paddingBottom: '4rem' }}>
        <div className="container">
          {/* Header Banner */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem' }}>
            <div style={{ maxWidth: '680px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(188, 70, 57, 0.1)', border: '1px solid rgba(188, 70, 57, 0.25)', borderRadius: '999px', padding: '0.4rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: '#BC4639', marginBottom: '0.75rem' }}>
                <Sparkles size={16} /> Open Gig Board • Empowering Rising Talent
              </div>
              <h1 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', fontWeight: 900, letterSpacing: '-0.5px', marginBottom: '0.5rem', lineHeight: 1.2 }}>
                Customer Event Gigs & <span className="gradient-text">Artist Callouts</span>
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Customers post event details here once, and interested artists can submit direct performance pitches! A fantastic launchpad for emerging talent to secure gigs without needing celebrity status.
              </p>
            </div>

            <div>
              {(user?.role === 'customer' || user?.role === 'admin') ? (
                <button 
                  className="btn btn-primary" 
                  onClick={() => setShowPostModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 1.5rem', fontSize: '1rem', fontWeight: 700, boxShadow: '0 8px 20px rgba(188, 70, 57, 0.3)' }}
                >
                  <PlusCircle size={20} /> Post an Event Gig
                </button>
              ) : !user ? (
                <button 
                  className="btn btn-primary" 
                  onClick={() => navigate('/login?redirect=/events?post=true')}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 1.5rem', fontSize: '1rem', fontWeight: 700 }}
                >
                  <PlusCircle size={20} /> Sign In to Post Event Gig
                </button>
              ) : (
                <button 
                  className="btn btn-secondary" 
                  onClick={() => toast('To post customer gigs, sign in with your customer account.', { icon: 'ℹ️' })}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 1.5rem', fontSize: '1rem', fontWeight: 700 }}
                >
                  <PlusCircle size={20} /> Post an Event Gig
                </button>
              )}
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          {(user?.role === 'customer' || user?.role === 'admin') && (
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--color-border)', marginBottom: '1.5rem' }}>
              <button
                onClick={() => setActiveTab('browse')}
                style={{
                  padding: '0.75rem 1.25rem',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'browse' ? '2.5px solid #BC4639' : '2.5px solid transparent',
                  color: activeTab === 'browse' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'browse' ? 800 : 500,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                }}
              >
                🌐 Browse Open Gigs ({events.length})
              </button>
              <button
                onClick={() => setActiveTab('my_events')}
                style={{
                  padding: '0.75rem 1.25rem',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'my_events' ? '2.5px solid #BC4639' : '2.5px solid transparent',
                  color: activeTab === 'my_events' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'my_events' ? 800 : 500,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                }}
              >
                📋 My Posted Events & Pitches ({myEvents.length})
              </button>
            </div>
          )}

          {/* Category Filter Chips (on browse tab) */}
          {activeTab === 'browse' && (
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '2rem', scrollbarWidth: 'none' }}>
              {CATEGORIES.map(cat => {
                const active = category === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    style={{
                      padding: '0.55rem 1.15rem',
                      borderRadius: '999px',
                      border: `1.5px solid ${active ? '#4285F4' : 'var(--color-border)'}`,
                      background: active ? '#4285F4' : 'var(--color-card)',
                      color: active ? '#ffffff' : 'var(--text-secondary)',
                      fontWeight: active ? 700 : 500,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          )}

          {/* Main Grid List */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '5rem 0' }}>
              <Spinner size={48} />
            </div>
          ) : activeTab === 'my_events' ? (
            myEvents.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="You haven't posted any events yet"
                description="Post your wedding, festival, or party event details and let talented artists pitch to you!"
                action={<button className="btn btn-primary" onClick={() => setShowPostModal(true)}><PlusCircle size={16} /> Post an Event Gig</button>}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {myEvents.map(ev => (
                  <div key={ev.id} style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1, minWidth: '260px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, background: 'rgba(188,70,57,0.15)', color: '#BC4639', padding: '0.2rem 0.6rem', borderRadius: '6px', textTransform: 'uppercase' }}>{ev.category}</span>
                        <span style={{ fontSize: '0.8rem', color: ev.status === 'open' ? '#10b981' : '#f59e0b', fontWeight: 700 }}>● {ev.status === 'open' ? 'Actively Receiving Pitches' : 'Booked'}</span>
                      </div>
                      <h3 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>{ev.title}</h3>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                        <span>📅 {formatDate(ev.eventDate)}</span>
                        <span>📍 {ev.city} ({ev.venue})</span>
                        <span>💰 Budget: {formatINR(ev.budget)}</span>
                        <span>👥 ~{ev.audienceSize} guests</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <button
                        className="btn btn-primary"
                        onClick={() => setProposalsEvent(ev)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                      >
                        <Users size={16} /> View Artist Pitches ({ev.proposalCount})
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : events.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No open gigs in this category"
              description="Be the first customer to post an event callout for artists!"
              action={user?.role === 'customer' ? <button className="btn btn-primary" onClick={() => setShowPostModal(true)}><PlusCircle size={16} /> Post an Event Gig</button> : null}
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
              {events.map(ev => {
                const isOwner = user?.id === ev.customerId;
                const isArtist = user?.role === 'artist';

                return (
                  <div
                    key={ev.id}
                    style={{
                      background: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '20px',
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    }}
                  >
                    <div>
                      {/* Top Badges */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, background: 'rgba(66, 133, 244, 0.12)', color: '#4285F4', padding: '0.25rem 0.65rem', borderRadius: '6px', textTransform: 'uppercase' }}>
                          {ev.category}
                        </span>
                        <span style={{ fontWeight: 900, fontSize: '1.15rem', color: '#BC4639' }}>
                          {formatINR(ev.budget)}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '0.75rem', lineHeight: 1.35 }}>
                        {ev.title}
                      </h3>

                      {/* Details row */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Calendar size={15} color="#4285F4" /> <span>Date: <strong>{formatDate(ev.eventDate)}</strong></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <MapPin size={15} color="#BC4639" /> <span>Location: <strong>{ev.city}</strong> ({ev.venue})</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Users size={15} color="#10b981" /> <span>Audience: <strong>~{ev.audienceSize} people</strong> ({ev.duration} hrs)</span>
                        </div>
                      </div>

                      {/* Description */}
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '0.75rem', marginBottom: '1rem', fontStyle: 'italic' }}>
                        "{ev.description || 'No specific requirements mentioned. Standard stage performance.'}"
                      </p>

                      {/* Client info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <User size={14} />
                        <span>Posted by <strong style={{ color: 'var(--text-primary)' }}>{ev.customer?.name || 'Verified Client'}</strong></span>
                        {(ev.customer?.aadhaarVerified || ev.customer?.isVerified) && (
                          <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.2rem' }} title="Govt ID Verified">
                            <ShieldCheck size={15} /> Verified
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        🎯 {ev.proposalCount} {ev.proposalCount === 1 ? 'pitch' : 'pitches'} received
                      </span>

                      {isOwner ? (
                        <button className="btn btn-secondary btn-sm" onClick={() => setProposalsEvent(ev)}>
                          Review Pitches ({ev.proposalCount})
                        </button>
                      ) : isArtist ? (
                        <button className="btn btn-primary btn-sm" onClick={() => setPitchingEvent(ev)}>
                          <Send size={14} /> Pitch to Perform
                        </button>
                      ) : (
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/login')}>
                          Sign In to Pitch
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* POST EVENT MODAL FOR CUSTOMERS */}
      {showPostModal && (
        <PostEventModal
          onClose={() => setShowPostModal(false)}
          onSuccess={(newEvent) => {
            setShowPostModal(false);
            setEvents(prev => [newEvent, ...prev]);
            setMyEvents(prev => [newEvent, ...prev]);
            setActiveTab('my_events');
            toast.success('🎉 Event gig posted! Artists will start pitching soon.');
          }}
        />
      )}

      {/* PITCH MODAL FOR ARTISTS */}
      {pitchingEvent && (
        <PitchModal
          event={pitchingEvent}
          onClose={() => setPitchingEvent(null)}
          onSuccess={() => {
            setPitchingEvent(null);
            loadEvents();
            toast.success('Your performance pitch was sent to the client!');
          }}
        />
      )}

      {/* REVIEW PROPOSALS MODAL FOR EVENT CREATOR */}
      {proposalsEvent && (
        <ProposalsModal
          event={proposalsEvent}
          onClose={() => setProposalsEvent(null)}
          onSuccess={() => {
            setProposalsEvent(null);
            loadEvents();
            loadMyEvents();
            navigate('/dashboard?tab=bookings');
          }}
        />
      )}
    </div>
  );
}

// ── MODAL: POST EVENT GIG (CUSTOMER) ─────────────────────────
function PostEventModal({ onClose, onSuccess }) {
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCity, setIsCustomCity] = useState(false);
  const [customCity, setCustomCity] = useState('');

  const [form, setForm] = useState({
    title: '',
    category: 'Singer',
    eventDate: '',
    city: 'Hyderabad',
    venue: '',
    budget: '',
    audienceSize: '300',
    duration: '3',
    description: '',
  });
  const [loading, setLoading] = useState(false);

  const resolvedCategory = (isCustomCategory || form.category === '__custom__')
    ? customCategory.trim()
    : form.category;
  const resolvedCity = (isCustomCity || form.city === '__custom__')
    ? customCity.trim()
    : form.city;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.title.trim()) {
      return toast.error('Please enter an Event Title / Requirement.');
    }
    if (!resolvedCategory) {
      return toast.error('Please specify the Performer Category needed.');
    }
    if (!form.eventDate) {
      return toast.error('Please choose the Event Date.');
    }
    if (!resolvedCity) {
      return toast.error('Please specify the City / Location.');
    }
    const cleanBudget = String(form.budget || '').replace(/[^0-9.]/g, '');
    if (!cleanBudget || Number(cleanBudget) <= 0) {
      return toast.error('Please enter a valid numeric budget in ₹.');
    }

    setLoading(true);
    try {
      const { data } = await eventsAPI.create({
        ...form,
        budget: Number(cleanBudget),
        category: resolvedCategory,
        city: resolvedCity,
      });
      onSuccess(data.event);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to post event.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '580px', animation: 'scaleUp 0.2s ease' }}>
        <div className="modal__header" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(188,70,57,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PlusCircle size={22} color="#BC4639" />
            </div>
            <div>
              <h3 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Post an Event Gig</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Invite singers, dancers, DJs & rising performers to pitch</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal__body" style={{ padding: '1.25rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Event Title */}
            <div className="form-group">
              <label className="form-label">Event Title / Requirement *</label>
              <input className="form-input" placeholder="e.g. Wedding Sangeet Bollywood Singer Required" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
              {/* Quick suggestions */}
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                {['Wedding Sangeet', 'College Fest Rock Show', 'Corporate Gala DJ', 'Housewarming Classical Singer', 'Birthday Party Entertainer', 'Dandiya Night Live Band'].map(suggestion => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, title: suggestion }))}
                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '999px', padding: '0.15rem 0.55rem', fontSize: '0.68rem', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {/* Category / Performer Type with Custom Option */}
              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Category / Talent *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomCategory(!isCustomCategory);
                      if (!isCustomCategory) setCustomCategory(form.category || '');
                    }}
                    style={{ background: 'transparent', border: 'none', color: '#4285F4', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                  >
                    {isCustomCategory ? '← Choose from list' : '✏️ Type custom'}
                  </button>
                </div>

                {isCustomCategory ? (
                  <div>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="e.g. Magician, Anchor/MC, Flutist, Standup Poet"
                      value={customCategory}
                      onChange={e => setCustomCategory(e.target.value)}
                      autoFocus
                    />
                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                      {['Magician', 'Anchor / MC', 'Standup Poet', 'Flutist', 'Illusionist'].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCustomCategory(c)}
                          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '999px', padding: '0.12rem 0.45rem', fontSize: '0.65rem', color: 'var(--text-secondary)', cursor: 'pointer' }}
                        >
                          + {c}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <select
                    className="form-select"
                    value={form.category}
                    onChange={e => {
                      if (e.target.value === '__custom__') {
                        setIsCustomCategory(true);
                      } else {
                        setForm(p => ({ ...p, category: e.target.value }));
                      }
                    }}
                  >
                    {['Singer', 'Band', 'Dancer', 'DJ', 'Comedian', 'Cultural Troupe', 'Instrumentalist'].map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="__custom__">✨ Custom / Other Performer Type...</option>
                  </select>
                )}
              </div>

              {/* Event Date */}
              <div className="form-group">
                <label className="form-label">Event Date *</label>
                <input className="form-input" type="date" value={form.eventDate} onChange={e => setForm(p => ({ ...p, eventDate: e.target.value }))} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {/* City with Custom Option */}
              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>City / Place *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomCity(!isCustomCity);
                      if (!isCustomCity) setCustomCity(form.city || '');
                    }}
                    style={{ background: 'transparent', border: 'none', color: '#4285F4', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                  >
                    {isCustomCity ? '← Choose from list' : '✏️ Type custom place'}
                  </button>
                </div>

                {isCustomCity ? (
                  <div>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="e.g. Vijayawada, Goa, Jaipur, Vizag, Surat"
                      value={customCity}
                      onChange={e => setCustomCity(e.target.value)}
                      autoFocus
                    />
                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                      {['Vijayawada', 'Goa', 'Jaipur', 'Vizag', 'Kochi', 'Coimbatore'].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCustomCity(c)}
                          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '999px', padding: '0.12rem 0.45rem', fontSize: '0.65rem', color: 'var(--text-secondary)', cursor: 'pointer' }}
                        >
                          + {c}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <select
                    className="form-select"
                    value={form.city}
                    onChange={e => {
                      if (e.target.value === '__custom__') {
                        setIsCustomCity(true);
                      } else {
                        setForm(p => ({ ...p, city: e.target.value }));
                      }
                    }}
                  >
                    {['Hyderabad', 'Bengaluru', 'Chennai', 'Mumbai', 'Delhi', 'Pune', 'Kolkata'].map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="__custom__">✨ Custom / Other City or Place...</option>
                  </select>
                )}
              </div>

              {/* Budget */}
              <div className="form-group">
                <label className="form-label">Your Budget (₹) *</label>
                <input className="form-input" type="text" placeholder="e.g. 50000" value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Venue / Hall / Destination</label>
                <input className="form-input" placeholder="e.g. Novotel HICC, Taj Fort Aguada, Leela Palace" value={form.venue} onChange={e => setForm(p => ({ ...p, venue: e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="form-label">Expected Audience</label>
                <input className="form-input" placeholder="e.g. 400 people" value={form.audienceSize} onChange={e => setForm(p => ({ ...p, audienceSize: e.target.value }))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description & Special Requirements</label>
              <textarea className="form-textarea" rows={3} placeholder="Describe the atmosphere, languages preferred, sound requirements, or setlist expectations..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
          </div>

          <div className="modal__footer" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Posting Gig...' : 'Publish Event Gig'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── MODAL: ARTIST PITCHES TO GIG ─────────────────────────────
function PitchModal({ event, onClose, onSuccess }) {
  const [quoteAmount, setQuoteAmount] = useState(String(event.budget || ''));
  const [pitchMessage, setPitchMessage] = useState('');
  const [travelLocation, setTravelLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!quoteAmount) return toast.error('Enter your quote amount.');
    setLoading(true);
    try {
      await eventsAPI.submitProposal(event.id, {
        quoteAmount: Number(quoteAmount),
        pitchMessage: pitchMessage || 'Hi, I would love to perform at your event with my signature set. Check my profile for samples!',
        artistLocation: travelLocation ? travelLocation.trim() : '',
      });
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit pitch.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '520px', animation: 'scaleUp 0.2s ease' }}>
        <div className="modal__header" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(66,133,244,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={20} color="#4285F4" />
            </div>
            <div>
              <h3 style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)' }}>Pitch to Perform</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{event.title}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal__body" style={{ padding: '1.25rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '0.85rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Client Budget: <strong style={{ color: '#BC4639' }}>{formatINR(event.budget)}</strong></div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Date: {formatDate(event.eventDate)} • Place: <strong style={{ color: 'var(--text-primary)' }}>{event.city}</strong> {event.venue ? `(${event.venue})` : ''}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Your Proposed Quote (₹) *</label>
              <input className="form-input" type="number" placeholder="e.g. 45000" value={quoteAmount} onChange={e => setQuoteAmount(e.target.value)} required />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                You will receive 85% after standard 15% platform commission upon event completion.
              </span>
            </div>

            {/* Artist Location / Travel Details */}
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Your Location & Travel (Optional)</label>
                <span style={{ fontSize: '0.72rem', color: '#4285F4', fontWeight: 600 }}>Event Place: {event.city}</span>
              </div>
              <input
                className="form-input"
                type="text"
                placeholder={`e.g. Local artist in ${event.city} / Travelling from Mumbai (travel included in quote)`}
                value={travelLocation}
                onChange={e => setTravelLocation(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                {[`Local artist in ${event.city}`, 'Willing to travel (travel included in quote)', 'Will arrange own stay & transport'].map(chip => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setTravelLocation(chip)}
                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '999px', padding: '0.12rem 0.5rem', fontSize: '0.68rem', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Pitch Message to Client *</label>
              <textarea className="form-textarea" rows={3} placeholder="Tell the client why your style, energy, and music are the best fit for this event..." value={pitchMessage} onChange={e => setPitchMessage(e.target.value)} />
            </div>
          </div>

          <div className="modal__footer" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Pitch Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── MODAL: CUSTOMER REVIEWS ARTIST PROPOSALS ─────────────────
function ProposalsModal({ event, onClose, onSuccess }) {
  const [loadingProposalId, setLoadingProposalId] = useState(null);

  const handleAccept = async (proposalId) => {
    if (!window.confirm('Accept this artist proposal? A booking will be generated where you can confirm and pay the 50% advance.')) return;
    setLoadingProposalId(proposalId);
    try {
      const { data } = await eventsAPI.acceptProposal(event.id, proposalId);
      toast.success('🎉 Proposal accepted! Booking created.');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to accept proposal.');
    } finally {
      setLoadingProposalId(null);
    }
  };

  const proposals = event.proposals || [];

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '640px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal__header" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <h3 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Artist Proposals ({proposals.length})</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Event: {event.title} • Place: {event.city}</p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div className="modal__body" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {proposals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              No artists have pitched for this gig yet. When an artist applies, their quotes and profiles will appear right here!
            </div>
          ) : (
            proposals.map(p => (
              <div key={p.id} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img 
                      src={p.artist?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.artist?.displayName || 'A')}`} 
                      alt="" 
                      style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover' }} 
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                        {p.artist?.displayName}
                        {p.artist?.aadhaarVerified && <ShieldCheck size={16} color="#10b981" title="Govt ID Verified" />}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {p.artist?.category} • ⭐ {p.artist?.reviewCount > 0 ? `${Number(p.artist?.rating).toFixed(1)} (${p.artist?.reviewCount} reviews)` : 'New (No reviews yet)'}
                      </div>
                      {p.artistLocation && (
                        <div style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem', fontWeight: 600 }}>
                          <MapPin size={12} /> {p.artistLocation}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quoted Price</div>
                    <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#BC4639' }}>{formatINR(p.quoteAmount)}</div>
                  </div>
                </div>

                <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '1rem' }}>
                  "{p.pitchMessage}"
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button 
                    className="btn btn-primary btn-sm" 
                    onClick={() => handleAccept(p.id)}
                    disabled={loadingProposalId === p.id}
                  >
                    {loadingProposalId === p.id ? 'Accepting...' : 'Accept & Create Booking'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="modal__footer" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
