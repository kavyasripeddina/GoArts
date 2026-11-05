// GoArts AI Poster Creator
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Navbar, Footer } from '../components/shared';
import { aiAPI } from '../lib/api';
import { useAuth } from '../context/useAuth';
import { Image, Loader2, Download, Copy, Palette, Check, Crown, Lock, ArrowRight, Sparkles, Sliders, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const EVENT_TYPES = ['Wedding', 'Concert', 'Corporate Event', 'College Festival', 'Birthday Party', 'Cultural Event', 'Brand Launch'];
const GENRES = ['Bollywood', 'Classical', 'Rock', 'Electronic/EDM', 'Folk', 'Jazz', 'Pop', 'Fusion'];
const THEMES = ['Modern Minimal', 'Vintage Retro', 'Bold Neon', 'Elegant Gold', 'Festive Vibrant', 'Corporate Clean', 'Dark Drama'];

export default function AIPosterCreatorPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    eventName: 'Artist Live Concert',
    artistName: 'Featured Artist',
    venue: 'Taj Palace, Hyderabad',
    date: '2026-11-13',
    eventType: 'Concert',
    theme: 'Bold Neon',
    genre: 'Classical',
  });
  const [isCustomEventType, setIsCustomEventType] = useState(false);
  const [customEventType, setCustomEventType] = useState('');
  const [concept, setConcept] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewTab, setViewTab] = useState('artwork'); // 'artwork' | 'specs'
  const [membershipStatus, setMembershipStatus] = useState(null);
  const [loadingMembership, setLoadingMembership] = useState(true);

  const canvasRef = useRef(null);

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
    e?.preventDefault();
    if (!hasAccess && !loadingMembership) {
      toast.error('AI Poster Creator is available to Pro and Elite Members.');
      return;
    }
    if (!form.eventName.trim()) {
      toast.error('Event name is required.');
      return;
    }
    setLoading(true);
    try {
      const resolvedEventType = isCustomEventType ? customEventType.trim() : form.eventType;
      const { data } = await aiAPI.generatePoster({ ...form, eventType: resolvedEventType || 'Concert' });
      setConcept(data.concept);
      setViewTab('artwork');
      toast.success('Visual Poster & Concept generated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Generation failed.');
    } finally {
      setLoading(false);
    }
  };

  // Render high-resolution visual poster on HTML5 canvas whenever concept changes
  useEffect(() => {
    if (!concept || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 800;
    const h = 1100;
    canvas.width = w;
    canvas.height = h;

    const colors = concept.colorPalette && concept.colorPalette.length >= 3
      ? concept.colorPalette
      : ['#FF2D78', '#1A1A2E', '#E94560'];

    // 1. Base gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, colors[1] || '#10101a');
    bgGrad.addColorStop(0.5, '#0b0c14');
    bgGrad.addColorStop(1, '#180d19');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Radiant atmospheric spotlight glows
    const glow1 = ctx.createRadialGradient(w * 0.5, h * 0.35, 50, w * 0.5, h * 0.35, 420);
    glow1.addColorStop(0, `${colors[0]}80`);
    glow1.addColorStop(0.5, `${colors[2] || colors[0]}33`);
    glow1.addColorStop(1, 'transparent');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, w, h);

    const glow2 = ctx.createRadialGradient(w * 0.2, h * 0.8, 20, w * 0.2, h * 0.8, 300);
    glow2.addColorStop(0, `${colors[2]}55`);
    glow2.addColorStop(1, 'transparent');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, w, h);

    // 3. Stage light beams
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.beginPath();
    ctx.moveTo(w * 0.1, 0);
    ctx.lineTo(w * 0.45, h * 0.65);
    ctx.lineTo(w * 0.2, h * 0.65);
    ctx.closePath();
    ctx.fillStyle = colors[0];
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(w * 0.9, 0);
    ctx.lineTo(w * 0.8, h * 0.65);
    ctx.lineTo(w * 0.55, h * 0.65);
    ctx.closePath();
    ctx.fillStyle = colors[2];
    ctx.fill();
    ctx.restore();

    // 4. Stardust / Confetti particles
    ctx.save();
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 65; i++) {
      const px = (Math.sin(i * 99) * 0.5 + 0.5) * w;
      const py = (Math.cos(i * 33) * 0.5 + 0.5) * h * 0.85;
      const r = (i % 3) + 1;
      ctx.globalAlpha = (i % 5 + 2) / 10;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 5. Geometric framing border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    ctx.strokeRect(28, 28, w - 56, h - 56);

    ctx.strokeStyle = colors[0];
    ctx.lineWidth = 1.5;
    ctx.strokeRect(36, 36, w - 72, h - 72);

    // 6. Header: Presenter & Brand Tag
    ctx.textAlign = 'center';
    ctx.font = '800 13px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.letterSpacing = '3px';
    ctx.fillText('GOARTS AI ENTERTAINMENT PRESENTS', w / 2, 75);

    // Live In Concert Ribbon
    ctx.fillStyle = colors[0];
    ctx.fillRect(w / 2 - 130, 95, 260, 26);
    ctx.font = '900 12px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('★ LIVE EXPERIENCE SHOWCASE ★', w / 2, 112);

    // 7. Event Title (Bold stylized concert typography)
    const titleText = (concept.eventName || 'LIVE CONCERT').toUpperCase();
    ctx.font = '900 44px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = colors[0];
    ctx.shadowBlur = 24;
    ctx.fillText(titleText, w / 2, 220);
    ctx.shadowBlur = 0; // reset shadow

    // 8. Featuring Artist Section
    if (concept.artistName) {
      ctx.font = '700 16px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = colors[2] || '#f59e0b';
      ctx.letterSpacing = '4px';
      ctx.fillText('FEATURING', w / 2, 275);

      ctx.font = '900 34px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(concept.artistName, w / 2, 320);
    }

    // 9. Central Tagline Banner
    if (concept.tagline) {
      ctx.font = 'italic 600 17px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
      ctx.fillText(`"${concept.tagline}"`, w / 2, 375);
    }

    // 10. Center Stage Visual Motif (Soundwave Graphic)
    ctx.save();
    ctx.strokeStyle = colors[0];
    ctx.lineWidth = 3;
    ctx.beginPath();
    const waveY = 460;
    const waveCount = 38;
    for (let i = 0; i < waveCount; i++) {
      const bx = w * 0.15 + (i * (w * 0.7 / waveCount));
      const bh = Math.sin(i * 0.45) * 45 + Math.cos(i * 0.8) * 35;
      ctx.moveTo(bx, waveY - Math.abs(bh));
      ctx.lineTo(bx, waveY + Math.abs(bh));
    }
    ctx.stroke();
    ctx.restore();

    // 11. Genre Pill
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.roundRect(w / 2 - 100, 530, 200, 32, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.stroke();

    ctx.font = '800 13px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.letterSpacing = '1.5px';
    ctx.fillText((form.genre || concept.mood || 'MUSIC').toUpperCase(), w / 2, 551);

    // 12. Bottom Info Cards: Date, Time & Venue
    const cardY = 620;
    const cardH = 150;
    const cardW = w * 0.82;
    const cardX = (w - cardW) / 2;

    ctx.fillStyle = 'rgba(20, 22, 34, 0.85)';
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.stroke();

    // Date Column (Left)
    ctx.textAlign = 'left';
    ctx.font = '800 12px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = colors[0];
    ctx.fillText('DATE & TIME', cardX + 35, cardY + 45);

    ctx.font = '900 24px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(concept.date || '13 NOV 2026', cardX + 35, cardY + 80);

    ctx.font = '600 14px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fillText('Gates Open: 6:00 PM IST', cardX + 35, cardY + 110);

    // Divider
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(cardX + cardW * 0.48, cardY + 25);
    ctx.lineTo(cardX + cardW * 0.48, cardY + cardH - 25);
    ctx.stroke();

    // Venue Column (Right)
    ctx.font = '800 12px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = colors[2] || '#f59e0b';
    ctx.fillText('VENUE LOCATION', cardX + cardW * 0.53, cardY + 45);

    ctx.font = '900 22px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText((concept.venue || 'Taj Palace').slice(0, 22), cardX + cardW * 0.53, cardY + 80);

    ctx.font = '600 14px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fillText('Official Stage Arena', cardX + cardW * 0.53, cardY + 110);

    // 13. Simulated Barcode & Security Hologram
    ctx.fillStyle = '#ffffff';
    const barX = cardX + 30;
    const barY = 820;
    for (let i = 0; i < 35; i++) {
      const bw = (i % 3 === 0) ? 4 : 2;
      ctx.fillRect(barX + i * 7, barY, bw, 32);
    }

    ctx.font = '600 10px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText('GA-PASS-2026-X77912', barX, barY + 48);

    // 14. VIP / Booking Status Pill
    ctx.textAlign = 'right';
    ctx.font = '900 14px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#10b981';
    ctx.fillText('● ESCROW VERIFIED TICKETING', cardX + cardW - 30, barY + 18);

    ctx.font = '600 12px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText('Bookings Powered by GoArts AI', cardX + cardW - 30, barY + 42);

    // 15. Footer Watermark Seal
    ctx.textAlign = 'center';
    ctx.font = '700 11px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('GOARTS AI · COMMERCIAL EVENT PRODUCTION SUITE · 300 DPI CMYK READY', w / 2, h - 55);

  }, [concept, form.genre]);

  const handleDownloadPNG = () => {
    if (!canvasRef.current) return;
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const a = document.createElement('a');
      const cleanName = (concept?.eventName || 'GoArts-Event')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .toLowerCase();
      a.href = dataUrl;
      a.download = `GoArts-Poster-${cleanName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('High-Resolution Poster downloaded (PNG)!');
    } catch {
      toast.error('Failed to export canvas image.');
    }
  };

  const handleCopySpecs = () => {
    if (!concept) return;
    const text = `GOARTS AI POSTER CONCEPT SPECIFICATION: ${concept.eventName}\n\n` +
      `Artist: ${concept.artistName}\n` +
      `Date: ${concept.date} | Venue: ${concept.venue}\n` +
      `Tagline: "${concept.tagline}"\n` +
      `Mood: ${concept.mood} | Font Style: ${concept.fontStyle}\n` +
      `Color Palette: ${concept.colorPalette?.join(', ')}\n\n` +
      `Layout Description:\n${concept.layoutDescription}\n\n` +
      `Visual Elements:\n${concept.visualElements?.map(v => `• ${v}`).join('\n')}\n\n` +
      `Print Specs: ${concept.printSpecs?.width} × ${concept.printSpecs?.height} at ${concept.printSpecs?.resolution} (${concept.printSpecs?.format})`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Design specs copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background)' }}>
      <Navbar />
      <div style={{ paddingTop: '80px' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, var(--color-midnight), rgba(188,70,57,0.15))', borderBottom: '1px solid var(--color-border)', padding: '3rem 0 2rem' }}>
          <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'linear-gradient(135deg, #BC4639, #f59e0b)', borderRadius: '16px', padding: '0.75rem', display: 'flex' }}>
                <Image size={28} color="white" />
              </div>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>AI Poster Creator</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                  Generate professional high-resolution concert & festival poster artworks with AI
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container" style={{ padding: '2rem 1rem' }}>
          {/* Membership Access Banner */}
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
                    Instant commercial event poster generation & high-res image download is available for Pro (₹2,999/mo) and Elite (₹9,999/mo) members.
                  </p>
                </div>
              </div>
              <Link to="/premium" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                Upgrade Plan <ArrowRight size={16} />
              </Link>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', alignItems: 'start' }}>
            {/* Form */}
            <form onSubmit={handleGenerate} style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <Palette size={20} color="#4285F4" />
                <h2 style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)', margin: 0 }}>Event & Poster Specs</h2>
              </div>

              {[
                { label: 'Event Name *', key: 'eventName', placeholder: 'e.g. Artist Live Concert' },
                { label: 'Artist / Performer', key: 'artistName', placeholder: 'e.g. Anirudh / Sid Sriram / Band' },
                { label: 'Venue', key: 'venue', placeholder: 'e.g. Taj Palace / Hitex Arena' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>{f.label}</label>
                  <input className="form-input" placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>Event Type</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomEventType(!isCustomEventType);
                      if (!isCustomEventType) setCustomEventType(form.eventType || '');
                    }}
                    style={{ background: 'transparent', border: 'none', color: '#4285F4', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                  >
                    {isCustomEventType ? '← List' : '✨ Customized'}
                  </button>
                </div>
                {isCustomEventType ? (
                  <input
                    className="form-input"
                    placeholder="e.g. Sangeet, Music Festival, Club Night"
                    value={customEventType}
                    onChange={e => setCustomEventType(e.target.value)}
                    autoFocus
                  />
                ) : (
                  <select
                    className="form-input"
                    value={form.eventType}
                    onChange={e => {
                      if (e.target.value === '__custom__') {
                        setIsCustomEventType(true);
                      } else {
                        setForm(p => ({ ...p, eventType: e.target.value }));
                      }
                    }}
                  >
                    {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    <option value="__custom__">✨ Customized / Other Event...</option>
                  </select>
                )}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Event Date</label>
                <input className="form-input" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Theme / Aesthetic</label>
                <select className="form-input" value={form.theme} onChange={e => setForm(p => ({ ...p, theme: e.target.value }))}>
                  {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Music Genre</label>
                <select className="form-input" value={form.genre} onChange={e => setForm(p => ({ ...p, genre: e.target.value }))}>
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
                  fontWeight: 800,
                  padding: '0.85rem 1.25rem',
                  opacity: (!hasAccess && !loadingMembership) ? 0.6 : 1
                }}
              >
                {loading ? (
                  <><Loader2 size={18} className="spin" /> Generating Poster Artwork...</>
                ) : !hasAccess && !loadingMembership ? (
                  <><Lock size={18} /> Unlock with Pro or Elite Plan</>
                ) : (
                  <><Sparkles size={18} /> Generate Visual Poster</>
                )}
              </button>
            </form>

            {/* Poster Canvas Preview & Controls */}
            <div>
              {!concept && !loading && (
                <div style={{ background: 'var(--color-card)', border: '2px dashed var(--color-border)', borderRadius: '20px', padding: '4.5rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Image size={56} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                    Visual Poster Canvas Ready
                  </h3>
                  <p style={{ fontSize: '0.85rem', maxWidth: '380px', margin: '0 auto 1.5rem', color: 'var(--text-secondary)' }}>
                    Fill in your event details, artist name, and date to instantly render a commercial event poster ready for high-resolution PNG download.
                  </p>
                  <button onClick={handleGenerate} className="btn btn-primary btn-sm">
                    Generate Sample Poster Now
                  </button>
                </div>
              )}

              {loading && (
                <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '4.5rem 2rem', textAlign: 'center' }}>
                  <Loader2 size={44} className="spin" style={{ color: '#4285F4', marginBottom: '1rem' }} />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                    AI Generating Poster Artwork...
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Calculating stage lighting, color palette harmonics, typographic hierarchy, and print specifications.
                  </p>
                </div>
              )}

              {concept && !loading && (
                <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '20px', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
                  {/* Top Bar with View Toggles and Download Buttons */}
                  <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', background: 'var(--color-surface)' }}>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        type="button"
                        onClick={() => setViewTab('artwork')}
                        className={`btn btn-sm ${viewTab === 'artwork' ? 'btn-primary' : 'btn-outline'}`}
                        style={{ fontSize: '0.8rem', fontWeight: 700 }}
                      >
                        🎨 Poster Artwork
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewTab('specs')}
                        className={`btn btn-sm ${viewTab === 'specs' ? 'btn-primary' : 'btn-outline'}`}
                        style={{ fontSize: '0.8rem', fontWeight: 700 }}
                      >
                        📋 Design Specs
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        onClick={handleCopySpecs}
                        className="btn btn-sm btn-outline"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
                        title="Copy design specifications"
                      >
                        {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy Specs'}
                      </button>
                      <button
                        onClick={handleDownloadPNG}
                        className="btn btn-sm btn-primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, background: 'linear-gradient(135deg, #10b981, #059669)', borderColor: '#10b981' }}
                        title="Download high-resolution poster as PNG"
                      >
                        <Download size={14} /> Download Poster (PNG)
                      </button>
                    </div>
                  </div>

                  {/* Artwork Preview Tab */}
                  {viewTab === 'artwork' && (
                    <div style={{ padding: '1.5rem', textAlign: 'center', background: '#08080e' }}>
                      <canvas
                        ref={canvasRef}
                        style={{
                          width: '100%',
                          maxWidth: '460px',
                          height: 'auto',
                          borderRadius: '14px',
                          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.75)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          display: 'block',
                          margin: '0 auto',
                        }}
                      />
                      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem', alignItems: 'center' }}>
                        <button
                          onClick={handleDownloadPNG}
                          className="btn btn-primary"
                          style={{
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.65rem 1.5rem',
                            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                          }}
                        >
                          <Download size={16} /> Download High-Res Poster (PNG)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Specs & Layout Tab */}
                  {viewTab === 'specs' && (
                    <div style={{ padding: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                          <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{concept.eventName}</h2>
                          {concept.artistName && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>ft. {concept.artistName}</p>}
                        </div>
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
