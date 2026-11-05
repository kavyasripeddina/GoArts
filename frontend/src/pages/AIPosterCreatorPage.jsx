// GoArts AI Poster Creator
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar, Footer } from '../components/shared';
import { aiAPI } from '../lib/api';
import { useAuth } from '../context/useAuth';
import { Image, Loader2, Download, Copy, Palette, Check, Crown, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const EVENT_TYPES = ['Wedding', 'Concert', 'Corporate Event', 'College Festival', 'Birthday Party', 'Cultural Event', 'Brand Launch'];
const GENRES = ['Bollywood', 'Classical', 'Rock', 'Electronic/EDM', 'Folk', 'Jazz', 'Pop', 'Fusion'];
const THEMES = ['Modern Minimal', 'Vintage Retro', 'Bold Neon', 'Elegant Gold', 'Festive Vibrant', 'Corporate Clean', 'Dark Drama'];

export default function AIPosterCreatorPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ eventName: '', artistName: '', date: '', venue: '', theme: '', genre: '' });
  const [concept, setConcept] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState(null);
  const [loadingMembership, setLoadingMembership] = useState(true);

  useEffect(() => {
    const fetchMembership = async () => {
      try {
        const { data } = await aiAPI.myMembership();
        setMembershipStatus(data);
      } catch (e) {
        console.error('Membership fetch error:', e);
      } finally {
        setLoadingMembership(false);
      }
    };
    if (user) fetchMembership();
    else setLoadingMembership(false);
  }, [user]);

  const hasAccess = membershipStatus?.isPro || membershipStatus?.isElite || user?.role === 'admin';

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!hasAccess && !loadingMembership) {
      toast.error('AI Poster Creator is available to Pro and Elite Members.');
      return;
    }
    if (!form.eventName.trim()) { toast.error('Event name is required.'); return; }
    setLoading(true);
    try {
      const { data } = await aiAPI.generatePoster(form);
      setConcept(data.concept);
      toast.success('Poster concept generated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Generation failed.');
    } finally { setLoading(false); }
  };

  const handleCopy = () => {
    if (!concept) return;
    const text = `POSTER CONCEPT: ${concept.eventName}\n\nTagline: ${concept.tagline}\nMood: ${concept.mood}\nFont Style: ${concept.fontStyle}\nColors: ${concept.colorPalette?.join(', ')}\n\nLayout: ${concept.layoutDescription}\n\nVisual Elements:\n${concept.visualElements?.map(v => `• ${v}`).join('\n')}\n\nPrint Specs: ${concept.printSpecs?.width} × ${concept.printSpecs?.height} at ${concept.printSpecs?.resolution}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Poster concept copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background)' }}>
      <Navbar />
      <div style={{ paddingTop: '80px' }}>
        <div style={{ background: 'linear-gradient(135deg, var(--color-midnight), rgba(188,70,57,0.15))', borderBottom: '1px solid var(--color-border)', padding: '3rem 0 2rem' }}>
          <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'linear-gradient(135deg, #BC4639, #f59e0b)', borderRadius: '16px', padding: '0.75rem', display: 'flex' }}>
                <Image size={28} color="white" />
              </div>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>AI Poster Creator</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Generate professional event poster concepts instantly with AI</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container" style={{ padding: '2rem 1rem' }}>
          {/* Paywall Banner for non-Pro/Elite users */}
          {!loadingMembership && !hasAccess && (
            <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(188,70,57,0.12))', border: '2px solid rgba(245,158,11,0.4)', borderRadius: '20px', padding: '1.75rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: '#f59e0b', borderRadius: '14px', padding: '0.75rem', display: 'flex' }}>
                  <Crown size={26} color="white" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                    Pro & Elite Feature — AI Poster Creator
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                    Instant commercial concert & event poster creation is unlocked for Pro (₹2,999/mo) and Elite (₹9,999/mo) members.
                  </p>
                </div>
              </div>
              <Link to="/premium" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                Upgrade Plan <ArrowRight size={16} />
              </Link>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1.5fr)', gap: '2rem', alignItems: 'start' }}>
            {/* Form */}
            <form onSubmit={handleGenerate} style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1.5rem' }}>
              <h2 style={{ fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>Event Details</h2>
              {[
                { label: 'Event Name *', key: 'eventName', placeholder: 'e.g. Anirudh Live in Hyderabad' },
                { label: 'Artist / Performer', key: 'artistName', placeholder: 'e.g. Anirudh Ravichander' },
                { label: 'Venue', key: 'venue', placeholder: 'e.g. Hitex Exhibition Centre' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: '1rem' }}>
                  <label className="form-label">{f.label}</label>
                  <input className="form-input" placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Event Date</label>
                <input className="form-input" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} min={new Date().toISOString().split('T')[0]} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Theme / Style</label>
                <select className="form-input" value={form.theme} onChange={e => setForm(p => ({ ...p, theme: e.target.value }))}>
                  <option value="">Auto-select theme</option>
                  {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Music Genre</label>
                <select className="form-input" value={form.genre} onChange={e => setForm(p => ({ ...p, genre: e.target.value }))}>
                  <option value="">Select genre</option>
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <button 
                type="submit" 
                className="btn btn-primary btn-full" 
                disabled={loading || (!hasAccess && !loadingMembership)} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.5rem',
                  opacity: (!hasAccess && !loadingMembership) ? 0.6 : 1
                }}
              >
                {loading ? (
                  <><Loader2 size={16} className="spin" /> Generating...</>
                ) : !hasAccess && !loadingMembership ? (
                  <><Lock size={16} /> Unlock with Pro or Elite Plan</>
                ) : (
                  <><Palette size={16} /> Generate Poster Concept</>
                )}
              </button>
            </form>

            {/* Result */}
            <div>
              {!concept && !loading && (
                <div style={{ background: 'var(--color-card)', border: '2px dashed var(--color-border)', borderRadius: '16px', padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Image size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                  <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Your poster concept will appear here</p>
                  <p style={{ fontSize: '0.85rem' }}>Fill in event details and click Generate</p>
                </div>
              )}
              {loading && (
                <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '4rem', textAlign: 'center' }}>
                  <Loader2 size={40} className="spin" style={{ color: '#4285F4', marginBottom: '1rem' }} />
                  <p style={{ color: 'var(--text-secondary)' }}>AI is designing your poster concept...</p>
                </div>
              )}
              {concept && !loading && (
                <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '16px', overflow: 'hidden' }}>
                  {/* Color preview */}
                  <div style={{ height: '8px', background: `linear-gradient(90deg, ${concept.colorPalette?.join(', ')})` }} />
                  <div style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{concept.eventName}</h2>
                        {concept.artistName && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>ft. {concept.artistName}</p>}
                      </div>
                      <button onClick={handleCopy} className="btn btn-sm btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                      </button>
                    </div>

                    <div style={{ background: 'var(--color-surface)', borderRadius: '10px', padding: '1rem', marginBottom: '1rem', borderLeft: '3px solid #4285F4' }}>
                      <p style={{ fontStyle: 'italic', color: 'var(--text-primary)', fontWeight: 600 }}>"{concept.tagline}"</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div><p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>MOOD</p><p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{concept.mood}</p></div>
                      <div><p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>FONT STYLE</p><p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{concept.fontStyle}</p></div>
                      {concept.date && <div><p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>DATE</p><p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{concept.date}</p></div>}
                      {concept.venue && <div><p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>VENUE</p><p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{concept.venue}</p></div>}
                    </div>

                    {/* Color Palette */}
                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>COLOR PALETTE</p>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {concept.colorPalette?.map(color => (
                          <div key={color} title={color} style={{ width: '40px', height: '40px', background: color, borderRadius: '8px', border: '2px solid var(--color-border)', cursor: 'pointer' }} onClick={() => { navigator.clipboard.writeText(color); toast.success(`Copied ${color}`); }} />
                        ))}
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          {concept.colorPalette?.map(c => <span key={c} style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{c}</span>)}
                        </div>
                      </div>
                    </div>

                    {/* Layout */}
                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>LAYOUT DESCRIPTION</p>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{concept.layoutDescription}</p>
                    </div>

                    {/* Visual Elements */}
                    {concept.visualElements?.length > 0 && (
                      <div style={{ marginBottom: '1rem' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>VISUAL ELEMENTS</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {concept.visualElements.map(el => <span key={el} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '0.25rem 0.6rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{el}</span>)}
                        </div>
                      </div>
                    )}

                    {/* Print Specs */}
                    {concept.printSpecs && (
                      <div style={{ background: 'var(--color-surface)', borderRadius: '10px', padding: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        🖨️ Print: {concept.printSpecs.width} × {concept.printSpecs.height} · {concept.printSpecs.resolution} · {concept.printSpecs.format}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

