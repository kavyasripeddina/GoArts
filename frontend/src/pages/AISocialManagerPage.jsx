// GoArts AI Social Media Manager
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar, Footer } from '../components/shared';
import { aiAPI } from '../lib/api';
import { useAuth } from '../context/useAuth';
import { Share2, Loader2, Copy, Check, Calendar, Crown, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: '📸', color: '#E1306C' },
  { id: 'twitter', label: 'Twitter/X', icon: '🐦', color: '#1DA1F2' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼', color: '#0077B5' },
  { id: 'youtube', label: 'YouTube', icon: '▶️', color: '#FF0000' },
];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); toast.success('Copied!'); setTimeout(() => setCopied(false), 1500); }}
      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.3rem 0.65rem', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
      {copied ? <><Check size={12} color="#10b981" /> Copied</> : <><Copy size={12} /> Copy</>}
    </button>
  );
}

export default function AISocialManagerPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ artistName: '', eventName: '', eventDate: '', venue: '', platform: 'instagram', tone: 'exciting', genre: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeP, setActiveP] = useState('instagram');
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

  const isElite = membershipStatus?.isElite || user?.role === 'admin';

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!isElite && !loadingMembership) {
      toast.error('AI Social Media Manager is an exclusive Elite Plan feature.');
      return;
    }
    if (!form.artistName && !form.eventName) { toast.error('Please enter artist name or event name.'); return; }
    setLoading(true);
    try {
      const { data } = await aiAPI.socialContent({ ...form, platform: activeP });
      setResult(data);
      toast.success('Content generated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Generation failed.');
    } finally { setLoading(false); }
  };

  const allPlatforms = result?.allPlatforms || {};
  const activePlatformData = allPlatforms[activeP] || {};

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background)' }}>
      <Navbar />
      <div style={{ paddingTop: '80px' }}>
        <div style={{ background: 'linear-gradient(135deg, var(--color-midnight), rgba(66,133,244,0.15))', borderBottom: '1px solid var(--color-border)', padding: '3rem 0 2rem' }}>
          <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'linear-gradient(135deg, #4285F4, #10b981)', borderRadius: '16px', padding: '0.75rem', display: 'flex' }}>
                <Share2 size={28} color="white" />
              </div>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>AI Social Media Manager</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Auto-generate captions, hashtags, content calendars & posting schedules</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container" style={{ padding: '2rem 1rem' }}>
          {/* Paywall Banner for non-Elite users */}
          {!loadingMembership && !isElite && (
            <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(66,133,244,0.12))', border: '2px solid rgba(245,158,11,0.4)', borderRadius: '20px', padding: '1.75rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: '#f59e0b', borderRadius: '14px', padding: '0.75rem', display: 'flex' }}>
                  <Crown size={26} color="white" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                    Elite Tier Feature — AI Social Media Manager
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                    Automated multi-platform campaigns, hashtag suggestions, and posting calendars are unlocked with Elite Plan (₹9,999/month).
                  </p>
                </div>
              </div>
              <Link to="/premium" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                Upgrade to Elite <ArrowRight size={16} />
              </Link>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(300px, 1.5fr)', gap: '2rem', alignItems: 'start' }}>
            {/* Form */}
            <form onSubmit={handleGenerate} style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1.5rem' }}>
              <h2 style={{ fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>Content Details</h2>
              {[
                { label: 'Artist Name', key: 'artistName', placeholder: 'e.g. Anirudh Ravichander' },
                { label: 'Event Name', key: 'eventName', placeholder: 'e.g. Anirudh Live 2026' },
                { label: 'Venue', key: 'venue', placeholder: 'e.g. Hitex Exhibition Centre' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: '1rem' }}>
                  <label className="form-label">{f.label}</label>
                  <input className="form-input" placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Event Date</label>
                <input className="form-input" type="date" value={form.eventDate} onChange={e => setForm(p => ({ ...p, eventDate: e.target.value }))} />
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Tone / Style</label>
                <select className="form-input" value={form.tone} onChange={e => setForm(p => ({ ...p, tone: e.target.value }))}>
                  <option value="exciting">🔥 Exciting & Energetic</option>
                  <option value="professional">💼 Professional & Formal</option>
                  <option value="casual">😊 Casual & Friendly</option>
                  <option value="luxury">✨ Premium & Luxury</option>
                  <option value="cultural">🎭 Cultural & Traditional</option>
                </select>
              </div>
              <button 
                type="submit" 
                className="btn btn-primary btn-full" 
                disabled={loading || (!isElite && !loadingMembership)} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.5rem',
                  opacity: (!isElite && !loadingMembership) ? 0.6 : 1
                }}
              >
                {loading ? (
                  <><Loader2 size={16} className="spin" /> Generating...</>
                ) : !isElite && !loadingMembership ? (
                  <><Lock size={16} /> Unlock with Elite Membership</>
                ) : (
                  <><Share2 size={16} /> Generate Content</>
                )}
              </button>
            </form>

            {/* Results */}
            <div>
              {!result && !loading && (
                <div style={{ background: 'var(--color-card)', border: '2px dashed var(--color-border)', borderRadius: '16px', padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Share2 size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                  <p>Your social media content will appear here</p>
                </div>
              )}
              {loading && (
                <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '4rem', textAlign: 'center' }}>
                  <Loader2 size={40} className="spin" style={{ color: '#4285F4', marginBottom: '1rem' }} />
                  <p style={{ color: 'var(--text-secondary)' }}>AI is crafting your content...</p>
                </div>
              )}
              {result && !loading && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {/* Platform Tabs */}
                  <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '0.5rem' }}>
                    {PLATFORMS.map(p => (
                      <button key={p.id} onClick={() => setActiveP(p.id)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', background: activeP === p.id ? p.color : 'transparent', color: activeP === p.id ? 'white' : 'var(--text-secondary)', fontWeight: activeP === p.id ? 700 : 400, fontSize: '0.8rem', transition: 'all 0.15s' }}>
                        <span>{p.icon}</span><span>{p.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Caption */}
                  {activePlatformData.caption && (
                    <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>📝 Caption</h3>
                        <CopyButton text={activePlatformData.caption} />
                      </div>
                      <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7, fontFamily: 'inherit', margin: 0 }}>{activePlatformData.caption}</pre>
                    </div>
                  )}

                  {/* Hashtags */}
                  {activePlatformData.hashtags?.length > 0 && (
                    <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}># Hashtags</h3>
                        <CopyButton text={activePlatformData.hashtags.join(' ')} />
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {activePlatformData.hashtags.map(h => (
                          <span key={h} onClick={() => { navigator.clipboard.writeText(h); toast.success(`Copied ${h}`); }} style={{ background: 'rgba(66,133,244,0.1)', color: '#4285F4', borderRadius: '6px', padding: '0.2rem 0.6rem', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 500 }}>{h}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Posting Time & Tips */}
                  {(activePlatformData.postingTime || activePlatformData.storyIdea || activePlatformData.threadIdea || activePlatformData.thumbnailTip) && (
                    <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '1.25rem' }}>
                      <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '0.75rem' }}>💡 Platform Tips</h3>
                      {activePlatformData.postingTime && <div style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>BEST TIME TO POST</strong><p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{activePlatformData.postingTime}</p></div>}
                      {activePlatformData.storyIdea && <div style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>STORY IDEA</strong><p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{activePlatformData.storyIdea}</p></div>}
                      {activePlatformData.threadIdea && <div><strong style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>THREAD IDEA</strong><p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{activePlatformData.threadIdea}</p></div>}
                      {activePlatformData.thumbnailTip && <div><strong style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>THUMBNAIL TIP</strong><p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{activePlatformData.thumbnailTip}</p></div>}
                    </div>
                  )}

                  {/* Content Calendar */}
                  {result.contentCalendar?.length > 0 && (
                    <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '1.25rem' }}>
                      <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '0.75rem' }}>📅 Content Calendar</h3>
                      {result.contentCalendar.map((item, i) => (
                        <div key={i} style={{ display: 'flex', gap: '1rem', padding: '0.65rem 0', borderBottom: i < result.contentCalendar.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                          <span style={{ fontWeight: 700, color: '#4285F4', minWidth: '120px', fontSize: '0.8rem' }}>{item.week}</span>
                          <div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>{item.action}</p>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              {item.platforms?.map(p => <span key={p} style={{ fontSize: '0.7rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '0.1rem 0.4rem', color: 'var(--text-muted)' }}>{p}</span>)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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

