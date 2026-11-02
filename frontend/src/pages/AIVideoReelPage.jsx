// GoArts AI - Video Reel Generator (Promotional Videos Automatically)
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar, Footer } from '../components/shared';
import { useAuth } from '../context/useAuth';
import { aiAPI } from '../lib/api';
import {
  Film,
  Loader2,
  Play,
  Pause,
  Download,
  Copy,
  Sparkles,
  Lock,
  Crown,
  CheckCircle2,
  Volume2,
  Video,
  Music,
  Share2,
  Layers,
  Clock,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

const VIBES = [
  { id: 'arena', label: '⚡ Energetic Arena Concert', desc: 'Pyro, strobe flashes & heavy beat drops' },
  { id: 'cinematic', label: '🎬 Cinematic Slow-Motion', desc: 'Dramatic lighting, anamorphic flares & sweeping crane shots' },
  { id: 'wedding', label: '✨ Luxury Wedding & Sangeet', desc: 'Warm golden hues, emotional crescendo & crowd sing-along' },
  { id: 'club', label: '🔊 Club Night & Bass Drop', desc: 'Fast cuts, glitch transitions & sub-bass reverb' },
];

const DURATIONS = [15, 30, 60];

export default function AIVideoReelPage() {
  const { user } = useAuth();
  const [membershipStatus, setMembershipStatus] = useState(null);
  const [loadingMembership, setLoadingMembership] = useState(true);

  const [form, setForm] = useState({
    artistName: user?.role === 'artist' ? (user.name || '') : '',
    eventTitle: 'Live Performance Showcase 2026',
    genre: 'Live Fusion & Bollywood',
    vibe: 'Energetic Concert',
    targetDuration: 30,
    audioTrack: 'Upbeat Electronic & Acoustic Drop',
  });

  const [reelData, setReelData] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);

  useEffect(() => {
    if (user) {
      aiAPI.myMembership()
        .then(({ data }) => setMembershipStatus(data))
        .catch(() => {})
        .finally(() => setLoadingMembership(false));
    } else {
      setLoadingMembership(false);
    }
  }, [user]);

  const isElite = membershipStatus?.isElite || user?.role === 'admin';

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.artistName.trim()) {
      toast.error('Artist / Performer name is required.');
      return;
    }
    setGenerating(true);
    try {
      const { data } = await aiAPI.generateVideoReel(form);
      setReelData(data.reel);
      setActiveSceneIndex(0);
      setIsPlaying(true);
      toast.success('AI Promotional Video Reel generated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyScript = () => {
    if (!reelData) return;
    const text = `PROMOTIONAL VIDEO REEL SPECIFICATION: ${reelData.title}\n` +
      `Duration: ${reelData.duration} | Ratio: ${reelData.aspectRatio}\n` +
      `Audio Track: ${reelData.audioSpecs.track} (${reelData.audioSpecs.bpm} BPM)\n\n` +
      `STORYBOARD:\n` +
      reelData.storyboard.map(s => `[${s.timestamp}] ${s.name}\nVisual: ${s.visualAction}\nOverlay Text: "${s.overlayText}"\nAudio: ${s.audioCue}`).join('\n\n');
    navigator.clipboard.writeText(text);
    toast.success('Reel script copied to clipboard!');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background)' }}>
      <Navbar />
      <div style={{ paddingTop: '80px' }}>
        {/* Hero Section */}
        <div style={{ background: 'linear-gradient(135deg, var(--color-midnight), rgba(66,133,244,0.18))', borderBottom: '1px solid var(--color-border)', padding: '3.5rem 0 2.5rem' }}>
          <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
              <div style={{ background: 'linear-gradient(135deg, #4285F4, #BC4639)', borderRadius: '16px', padding: '0.85rem', display: 'flex' }}>
                <Film size={30} color="white" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h1 style={{ fontSize: '2.1rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                    AI Video Reel Generator
                  </h1>
                  <span style={{ background: 'linear-gradient(135deg, #f59e0b, #BC4639)', color: 'white', fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '99px', letterSpacing: '0.5px' }}>
                    👑 ELITE SUITE
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.35rem' }}>
                  Synthesize high-converting promotional video reels for Instagram, YouTube Shorts, and marketing campaigns automatically.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container" style={{ padding: '2.5rem 1rem' }}>
          {/* Paywall Banner for non-Elite users */}
          {!loadingMembership && !isElite && (
            <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(188,70,57,0.12))', border: '2px solid rgba(245,158,11,0.4)', borderRadius: '20px', padding: '1.75rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: '#f59e0b', borderRadius: '14px', padding: '0.75rem', display: 'flex' }}>
                  <Crown size={26} color="white" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Elite Membership Required for Video Synthesis
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    AI Video Reel generation is included exclusively in the <strong>Elite Tier (₹9,999/mo)</strong>. Upgrade your account or submit your payment reference for Admin approval to unlock.
                  </p>
                </div>
              </div>
              <Link to="/premium" className="btn btn-primary" style={{ background: '#BC4639', borderColor: '#BC4639', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <Crown size={15} /> Upgrade to Elite Plan <ArrowRight size={15} />
              </Link>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.1fr) minmax(320px, 1.4fr)', gap: '2rem', alignItems: 'start' }}>
            {/* Form */}
            <form onSubmit={handleGenerate} style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '18px', padding: '1.75rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
                Reel Parameters
              </h2>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Artist / Act Name *</label>
                <input
                  className="form-input"
                  placeholder="e.g. Sid Sriram Live, DJ Phantom, Anirudh Band"
                  value={form.artistName}
                  onChange={(e) => setForm((p) => ({ ...p, artistName: e.target.value }))}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Event / Showcase Title</label>
                <input
                  className="form-input"
                  placeholder="e.g. Soul & Carnatic Live Arena Tour 2026"
                  value={form.eventTitle}
                  onChange={(e) => setForm((p) => ({ ...p, eventTitle: e.target.value }))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">Performance Genre</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Bollywood Rock, EDM, Fusion"
                    value={form.genre}
                    onChange={(e) => setForm((p) => ({ ...p, genre: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="form-label">Target Duration</label>
                  <select
                    className="form-select"
                    value={form.targetDuration}
                    onChange={(e) => setForm((p) => ({ ...p, targetDuration: Number(e.target.value) }))}
                  >
                    {DURATIONS.map((d) => (
                      <option key={d} value={d}>{d} Seconds (Standard Reel)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Cinematic Vibe & Visual Treatment</label>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {VIBES.map((v) => (
                    <div
                      key={v.id}
                      onClick={() => setForm((p) => ({ ...p, vibe: v.label }))}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        border: `1.5px solid ${form.vibe === v.label ? '#4285F4' : 'var(--color-border)'}`,
                        background: form.vibe === v.label ? 'rgba(66,133,244,0.1)' : 'var(--color-surface)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: form.vibe === v.label ? '#4285F4' : 'var(--text-primary)' }}>
                        {v.label}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        {v.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Audio Track Style</label>
                <input
                  className="form-input"
                  placeholder="e.g. Upbeat Electronic & Acoustic Drop, Driving Percussion"
                  value={form.audioTrack}
                  onChange={(e) => setForm((p) => ({ ...p, audioTrack: e.target.value }))}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                disabled={generating || (!isElite && !loadingMembership)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  opacity: (!isElite && !loadingMembership) ? 0.6 : 1,
                }}
              >
                {generating ? (
                  <>
                    <Loader2 size={18} className="spin" /> Synthesizing Promotional Reel...
                  </>
                ) : !isElite && !loadingMembership ? (
                  <>
                    <Lock size={18} /> Unlock with Elite Membership
                  </>
                ) : (
                  <>
                    <Sparkles size={18} /> Generate Video Reel
                  </>
                )}
              </button>
            </form>

            {/* Reel Simulator & Storyboard Output */}
            <div>
              {!reelData && !generating && (
                <div style={{ background: 'var(--color-card)', border: '2px dashed var(--color-border)', borderRadius: '18px', padding: '4.5rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Video size={52} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                    Promotional Video Canvas Ready
                  </h3>
                  <p style={{ fontSize: '0.85rem', maxWidth: '380px', margin: '0 auto' }}>
                    Configure your performance style and click Generate to produce a 9:16 vertical promotional video storyboard with beat-synchronized camera cuts and audio overlays.
                  </p>
                </div>
              )}

              {generating && (
                <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '18px', padding: '4.5rem 2rem', textAlign: 'center' }}>
                  <Loader2 size={44} className="spin" style={{ color: '#4285F4', marginBottom: '1rem' }} />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                    AI Video Reel In Production...
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Generating scene shot-list, camera tracking maneuvers, audio BPM sync, and dynamic marketing typography.
                  </p>
                </div>
              )}

              {reelData && !generating && (
                <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '18px', overflow: 'hidden' }}>
                  {/* Top Header */}
                  <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 800, textTransform: 'uppercase' }}>
                        ✓ Reel Ready ({reelData.duration} · {reelData.aspectRatio})
                      </div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.2rem 0 0 0' }}>
                        {reelData.title}
                      </h3>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={handleCopyScript} className="btn btn-sm btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Copy size={13} /> Copy Script
                      </button>
                      <button onClick={() => toast.success('Reel storyboard package downloaded!')} className="btn btn-sm btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Download size={13} /> Export
                      </button>
                    </div>
                  </div>

                  {/* Vertical Reel Simulation Preview Card */}
                  <div style={{ padding: '1.5rem' }}>
                    <div style={{ background: '#0a0d14', borderRadius: '14px', padding: '1.25rem', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', color: 'white' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                          <strong style={{ letterSpacing: '0.5px' }}>REEL SCENE {activeSceneIndex + 1} OF {reelData.storyboard.length}</strong>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>
                          {reelData.storyboard[activeSceneIndex]?.timestamp}
                        </span>
                      </div>

                      {/* Video Screen Simulation */}
                      <div style={{ background: 'linear-gradient(180deg, rgba(66,133,244,0.3) 0%, rgba(188,70,57,0.3) 100%)', height: '180px', borderRadius: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '1rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.15)' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ffffff', textShadow: '0 2px 8px rgba(0,0,0,0.8)', marginBottom: '0.5rem' }}>
                          {reelData.storyboard[activeSceneIndex]?.overlayText}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', maxWidth: '320px' }}>
                          {reelData.storyboard[activeSceneIndex]?.visualAction}
                        </div>
                      </div>

                      {/* Scene Switcher Pills */}
                      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '1rem' }}>
                        {reelData.storyboard.map((sc, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveSceneIndex(i)}
                            style={{
                              flex: 1,
                              padding: '0.45rem',
                              borderRadius: '6px',
                              border: 'none',
                              cursor: 'pointer',
                              background: activeSceneIndex === i ? '#4285F4' : 'rgba(255,255,255,0.1)',
                              color: 'white',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              transition: 'all 0.15s',
                            }}
                          >
                            Scene {i + 1}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Detailed Storyboard Breakdown */}
                    <div style={{ marginTop: '1.5rem' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                        Shot-by-Shot Director Script
                      </h4>
                      <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {reelData.storyboard.map((sc, idx) => (
                          <div
                            key={idx}
                            style={{
                              background: 'var(--color-surface)',
                              border: `1.5px solid ${activeSceneIndex === idx ? '#4285F4' : 'var(--color-border)'}`,
                              borderRadius: '12px',
                              padding: '0.85rem 1rem',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                              <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                {sc.scene}. {sc.name}
                              </strong>
                              <span style={{ fontSize: '0.75rem', color: '#4285F4', fontWeight: 700, fontFamily: 'monospace' }}>
                                {sc.timestamp}
                              </span>
                            </div>
                            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '0.2rem 0' }}>
                              🎥 <strong>Camera:</strong> {sc.cameraMovement}
                            </p>
                            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '0.2rem 0' }}>
                              ⚡ <strong>Overlay:</strong> <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>"{sc.overlayText}"</span>
                            </p>
                            <p style={{ fontSize: '0.8rem', color: '#10b981', margin: '0.2rem 0' }}>
                              🎵 <strong>Audio Cue:</strong> {sc.audioCue}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
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

