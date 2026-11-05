// GoArts AI - Video Reel Generator (Promotional Videos Automatically)
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Navbar, Footer } from '../components/shared';
import { useAuth } from '../context/useAuth';
import { aiAPI } from '../lib/api';
import {
  Film,
  Loader2,
  Play,
  Pause,
  RotateCcw,
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
  Maximize2,
  Image,
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
    artistName: user?.role === 'artist' ? (user.name || '') : 'Featured Artist',
    eventTitle: 'Live Performance Showcase 2026',
    genre: 'Live Fusion & Bollywood',
    vibe: '⚡ Energetic Arena Concert',
    targetDuration: 30,
    audioTrack: 'Upbeat Electronic & Acoustic Drop',
  });

  const [reelData, setReelData] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const playbackTimerRef = useRef(null);

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
    e?.preventDefault();
    if (!form.artistName.trim()) {
      toast.error('Artist / Performer name is required.');
      return;
    }
    setGenerating(true);
    try {
      const { data } = await aiAPI.generateVideoReel(form);
      setReelData(data.reel);
      setActiveSceneIndex(0);
      setElapsedSeconds(0);
      setIsPlaying(true);
      toast.success('AI Promotional Video Reel synthesized!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  // Timeline & Playback Loop
  useEffect(() => {
    if (!isPlaying || !reelData) return;

    const totalSec = form.targetDuration || 30;
    const sceneCount = reelData.storyboard?.length || 4;
    const secPerScene = totalSec / sceneCount;

    playbackTimerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 0.2;
        if (next >= totalSec) {
          // Loop back to start
          setActiveSceneIndex(0);
          return 0;
        }
        const nextScene = Math.min(sceneCount - 1, Math.floor(next / secPerScene));
        setActiveSceneIndex(nextScene);
        return next;
      });
    }, 200);

    return () => clearInterval(playbackTimerRef.current);
  }, [isPlaying, reelData, form.targetDuration]);

  // Real-time Canvas Rendering for 9:16 Vertical Reel Simulation
  useEffect(() => {
    if (!reelData || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    const render = () => {
      frame++;
      const w = 540;
      const h = 960; // 9:16 vertical standard
      canvas.width = w;
      canvas.height = h;

      const scene = reelData.storyboard[activeSceneIndex] || reelData.storyboard[0];

      // Dynamic color theme based on vibe and active scene
      const themes = [
        ['#4285F4', '#BC4639', '#15132a'],
        ['#FF2D78', '#E94560', '#0a0d18'],
        ['#10B981', '#4285F4', '#06171f'],
        ['#8B5CF6', '#F59E0B', '#1c0e25'],
      ];
      const [colPrimary, colSecondary, colDark] = themes[activeSceneIndex % themes.length];

      // 1. Background Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#06070c');
      grad.addColorStop(0.4, colDark);
      grad.addColorStop(1, '#050508');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // 2. Animated Center Pulsing Spotlight
      const pulse = Math.sin(frame * 0.06) * 35;
      const spotGrad = ctx.createRadialGradient(w / 2, h * 0.42, 40, w / 2, h * 0.42, 280 + pulse);
      spotGrad.addColorStop(0, `${colPrimary}99`);
      spotGrad.addColorStop(0.5, `${colSecondary}40`);
      spotGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = spotGrad;
      ctx.fillRect(0, 0, w, h);

      // 3. Stage Light Beams (Anamorphic concert flares)
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      const beamShift = Math.sin(frame * 0.04) * 80;
      ctx.moveTo(w / 2 + beamShift, 0);
      ctx.lineTo(w * 0.1, h * 0.7);
      ctx.lineTo(w * 0.35, h * 0.7);
      ctx.closePath();
      ctx.fillStyle = colPrimary;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(w / 2 - beamShift, 0);
      ctx.lineTo(w * 0.9, h * 0.7);
      ctx.lineTo(w * 0.65, h * 0.7);
      ctx.closePath();
      ctx.fillStyle = colSecondary;
      ctx.fill();
      ctx.restore();

      // 4. Stardust bokeh particles
      ctx.save();
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 28; i++) {
        const px = (Math.sin(i * 45 + frame * 0.02) * 0.5 + 0.5) * w;
        const py = (Math.cos(i * 25 + frame * 0.02) * 0.5 + 0.5) * h * 0.8;
        const r = (i % 3) + 1.2;
        ctx.globalAlpha = ((i % 4) + 1) / 10;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 5. Soundwave & Audio Frequency Spectrum Bars (reacting to beat)
      ctx.save();
      const numBars = 32;
      const barWidth = 8;
      const barSpacing = 5;
      const startX = (w - (numBars * (barWidth + barSpacing))) / 2;
      const baseY = h * 0.74;

      for (let i = 0; i < numBars; i++) {
        const bh = Math.abs(Math.sin(i * 0.35 + frame * 0.12)) * 55 + Math.abs(Math.cos(i * 0.6 - frame * 0.08)) * 30 + 8;
        const barGrad = ctx.createLinearGradient(0, baseY - bh, 0, baseY);
        barGrad.addColorStop(0, '#ffffff');
        barGrad.addColorStop(0.4, colPrimary);
        barGrad.addColorStop(1, colSecondary);
        ctx.fillStyle = barGrad;
        ctx.beginPath();
        ctx.roundRect(startX + i * (barWidth + barSpacing), baseY - bh, barWidth, bh, 4);
        ctx.fill();
      }
      ctx.restore();

      // 6. Header Badge: GoArts Verified Live Reel
      ctx.textAlign = 'center';
      ctx.font = '800 11px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.letterSpacing = '2px';
      ctx.fillText('GOARTS AI · OFFICIAL PROMO REEL', w / 2, 85);

      // Live Scene Indicator
      ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
      ctx.beginPath();
      ctx.arc(w / 2 - 80, 115, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '800 12px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`SCENE ${activeSceneIndex + 1} OF ${reelData.storyboard.length} · ${scene?.name?.toUpperCase() || ''}`, w / 2 + 10, 119);

      // 7. Dynamic Main Text Overlay (Cinema Typography)
      const textScale = 1 + Math.sin(frame * 0.05) * 0.02;
      ctx.save();
      ctx.translate(w / 2, h * 0.38);
      ctx.scale(textScale, textScale);
      ctx.textAlign = 'center';

      ctx.font = '900 28px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = colPrimary;
      ctx.shadowBlur = 18;
      ctx.fillText(scene?.overlayText || `${form.artistName} LIVE`, 0, 0);
      ctx.shadowBlur = 0;

      // Sub-caption / Action
      ctx.font = '600 14px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
      ctx.fillText(scene?.visualAction?.slice(0, 48) || '', 0, 42);
      ctx.restore();

      // 8. Audio Cue / Beat Drop Indicator Pill
      ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.beginPath();
      ctx.roundRect(w / 2 - 140, h * 0.52, 280, 34, 17);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.font = '700 12px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`🎵 AUDIO: ${scene?.audioCue?.slice(0, 32) || form.audioTrack}`, w / 2, h * 0.52 + 21);

      // 9. Camera Maneuver Pill
      ctx.font = '700 11px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = colSecondary;
      ctx.fillText(`🎥 CAMERA: ${scene?.cameraMovement || 'Wide Tracking'}`, w / 2, h * 0.60);

      // 10. Bottom Footer CTA Bar
      const btmY = h * 0.83;
      ctx.fillStyle = 'rgba(15, 17, 28, 0.9)';
      ctx.beginPath();
      ctx.roundRect(30, btmY, w - 60, 105, 18);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.font = '900 16px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(form.artistName || 'Artist Live Experience', 50, btmY + 36);

      ctx.font = '700 12px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#10b981';
      ctx.fillText(`● BOOKINGS OPEN · ESCROW PROTECTED`, 50, btmY + 62);

      ctx.font = '600 11px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('Available for Weddings, Festivals & Arenas', 50, btmY + 84);

      // Verified Emblem Stamp
      ctx.textAlign = 'right';
      ctx.font = '800 24px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = colPrimary;
      ctx.fillText('★', w - 50, btmY + 55);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [reelData, activeSceneIndex, form.artistName]);

  // Real Video Export via HTML5 Canvas captureStream & MediaRecorder
  const handleDownloadVideo = () => {
    if (!canvasRef.current) return;
    try {
      const canvas = canvasRef.current;
      const stream = canvas.captureStream(30); // 30 FPS stream
      const recordedChunks = [];

      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      setIsRecording(true);
      toast.loading('Synthesizing & recording video reel clip...', { id: 'reel-rec' });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.push(e.data);
      };

      recorder.onstop = () => {
        setIsRecording(false);
        const blob = new Blob(recordedChunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const cleanName = (form.artistName || 'GoArts-Artist')
          .replace(/[^a-zA-Z0-9_-]/g, '_')
          .toLowerCase();
        a.href = url;
        a.download = `GoArts-Reel-${cleanName}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Promotional Video Reel (.webm) downloaded successfully!', { id: 'reel-rec' });
      };

      recorder.start();
      // Record 6 seconds of animated scenes
      setTimeout(() => {
        recorder.stop();
      }, 6000);

    } catch (e) {
      setIsRecording(false);
      toast.dismiss('reel-rec');
      // Fallback: download current frame as PNG
      handleDownloadFramePNG();
    }
  };

  // Download Current Scene Frame as High-Resolution PNG
  const handleDownloadFramePNG = () => {
    if (!canvasRef.current) return;
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const a = document.createElement('a');
      const cleanName = (form.artistName || 'GoArts-Artist')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .toLowerCase();
      a.href = dataUrl;
      a.download = `GoArts-Reel-Scene${activeSceneIndex + 1}-${cleanName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('High-Resolution 9:16 Reel Poster Frame downloaded (PNG)!');
    } catch {
      toast.error('Failed to export reel image.');
    }
  };

  const handleCopyScript = () => {
    if (!reelData) return;
    const text = `PROMOTIONAL VIDEO REEL SPECIFICATION: ${reelData.title}\n` +
      `Duration: ${reelData.duration} | Ratio: ${reelData.aspectRatio}\n` +
      `Audio Track: ${reelData.audioSpecs?.track} (${reelData.audioSpecs?.bpm} BPM)\n\n` +
      `STORYBOARD & SHOT-LIST:\n` +
      reelData.storyboard.map(s => `[${s.timestamp}] ${s.name}\nVisual: ${s.visualAction}\nOverlay Text: "${s.overlayText}"\nCamera: ${s.cameraMovement}\nAudio Cue: ${s.audioCue}`).join('\n\n');
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
                  Generate high-impact 9:16 vertical video reels for Instagram, YouTube Shorts, and booking promos with downloadable video exports.
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
                    AI Video Reel generation and direct video downloads are included exclusively in the <strong>Elite Tier (₹9,999/mo)</strong>.
                  </p>
                </div>
              </div>
              <Link to="/premium" className="btn btn-primary" style={{ background: '#BC4639', borderColor: '#BC4639', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <Crown size={15} /> Upgrade to Elite Plan <ArrowRight size={15} />
              </Link>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', alignItems: 'start' }}>
            {/* Form */}
            <form onSubmit={handleGenerate} style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
                Reel Parameters
              </h2>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Artist / Act Name *</label>
                <input
                  className="form-input"
                  placeholder="e.g. Sid Sriram Live, DJ Phantom, Anirudh Band"
                  value={form.artistName}
                  onChange={(e) => setForm((p) => ({ ...p, artistName: e.target.value }))}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>Event / Showcase Title</label>
                  <span style={{ fontSize: '0.72rem', color: '#4285F4', fontWeight: 700 }}>Customized or Live Tour</span>
                </div>
                <input
                  className="form-input"
                  placeholder="e.g. Soul & Carnatic Live Arena Tour 2026, Wedding Sangeet"
                  value={form.eventTitle}
                  onChange={(e) => setForm((p) => ({ ...p, eventTitle: e.target.value }))}
                />
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                  {['Wedding Sangeet', 'College Fest Headline', 'Arena Concert', 'Club Night'].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, eventTitle: preset }))}
                      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '999px', padding: '0.15rem 0.55rem', fontSize: '0.68rem', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>Performance Genre</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Bollywood Rock, EDM, Fusion"
                    value={form.genre}
                    onChange={(e) => setForm((p) => ({ ...p, genre: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>Target Duration</label>
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
                <label className="form-label" style={{ fontWeight: 700 }}>Cinematic Vibe & Visual Treatment</label>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {VIBES.map((v) => (
                    <div
                      key={v.id}
                      onClick={() => setForm((p) => ({ ...p, vibe: v.label }))}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '12px',
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
                <label className="form-label" style={{ fontWeight: 700 }}>Audio Track Style</label>
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
                  fontWeight: 800,
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

            {/* Live Reel Player & Downloads */}
            <div>
              {!reelData && !generating && (
                <div style={{ background: 'var(--color-card)', border: '2px dashed var(--color-border)', borderRadius: '20px', padding: '4.5rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Video size={56} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                    Vertical 9:16 Reel Player Ready
                  </h3>
                  <p style={{ fontSize: '0.85rem', maxWidth: '380px', margin: '0 auto 1.5rem', color: 'var(--text-secondary)' }}>
                    Fill in your act name and style to generate a real-time animated vertical promotional video reel with direct video (.webm) and poster frame (.png) download capabilities.
                  </p>
                  <button onClick={handleGenerate} className="btn btn-primary btn-sm">
                    Generate Sample Reel Now
                  </button>
                </div>
              )}

              {generating && (
                <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '4.5rem 2rem', textAlign: 'center' }}>
                  <Loader2 size={44} className="spin" style={{ color: '#4285F4', marginBottom: '1rem' }} />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                    AI Video Reel In Production...
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Synthesizing camera maneuvers, audio spectrum choreography, and dynamic marketing typography.
                  </p>
                </div>
              )}

              {reelData && !generating && (
                <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '20px', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
                  {/* Top Header */}
                  <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', background: 'var(--color-surface)' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 800, textTransform: 'uppercase' }}>
                        ✓ Reel Ready ({reelData.duration} · {reelData.aspectRatio})
                      </div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.2rem 0 0 0' }}>
                        {reelData.title}
                      </h3>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button onClick={handleCopyScript} className="btn btn-sm btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Copy size={13} /> Copy Script
                      </button>
                      <button
                        onClick={handleDownloadVideo}
                        disabled={isRecording}
                        className="btn btn-sm btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800, background: 'linear-gradient(135deg, #10b981, #059669)', borderColor: '#10b981' }}
                      >
                        {isRecording ? <Loader2 size={13} className="spin" /> : <Download size={13} />}
                        {isRecording ? 'Recording Clip...' : 'Download Video (.webm)'}
                      </button>
                      <button
                        onClick={handleDownloadFramePNG}
                        className="btn btn-sm btn-outline"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                        title="Download high-res current scene poster"
                      >
                        <Image size={13} /> Frame (.png)
                      </button>
                    </div>
                  </div>

                  {/* Vertical 9:16 Interactive Video Reel Canvas Player */}
                  <div style={{ padding: '1.5rem', background: '#07080e', textAlign: 'center' }}>
                    <div style={{ maxWidth: '340px', margin: '0 auto', position: 'relative' }}>
                      {/* Segmented Story Progress Bars (Instagram Reels Style) */}
                      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
                        {reelData.storyboard.map((_, idx) => {
                          const isActive = activeSceneIndex === idx;
                          const isPassed = activeSceneIndex > idx;
                          return (
                            <div
                              key={idx}
                              onClick={() => {
                                setActiveSceneIndex(idx);
                                setElapsedSeconds(idx * ((form.targetDuration || 30) / reelData.storyboard.length));
                              }}
                              style={{
                                flex: 1,
                                height: '3.5px',
                                background: isPassed ? '#ffffff' : isActive ? 'linear-gradient(90deg, #4285F4, #ffffff)' : 'rgba(255,255,255,0.25)',
                                borderRadius: '99px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                              }}
                              title={`Jump to Scene ${idx + 1}`}
                            />
                          );
                        })}
                      </div>

                      {/* Video Canvas */}
                      <canvas
                        ref={canvasRef}
                        style={{
                          width: '100%',
                          height: 'auto',
                          borderRadius: '16px',
                          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.85)',
                          border: '2px solid rgba(255, 255, 255, 0.18)',
                          display: 'block',
                        }}
                      />

                      {/* Floating Playback Controls Bar */}
                      <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '0.5rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => setIsPlaying(!isPlaying)}
                            style={{ background: '#4285F4', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
                            title={isPlaying ? 'Pause' : 'Play'}
                          >
                            {isPlaying ? <Pause size={15} /> : <Play size={15} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSceneIndex(0);
                              setElapsedSeconds(0);
                              setIsPlaying(true);
                            }}
                            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
                            title="Replay from beginning"
                          >
                            <RotateCcw size={16} />
                          </button>
                        </div>

                        <span style={{ fontSize: '0.8rem', color: '#fff', fontFamily: 'monospace', fontWeight: 700 }}>
                          {Math.floor(elapsedSeconds)}s / {form.targetDuration}s
                        </span>

                        <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 800 }}>
                          ● 60 FPS HD
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Scene Tabs */}
                  <div style={{ padding: '1.25rem 1.5rem', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                      {reelData.storyboard.map((sc, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setActiveSceneIndex(i);
                            setElapsedSeconds(i * ((form.targetDuration || 30) / reelData.storyboard.length));
                          }}
                          style={{
                            flex: 1,
                            minWidth: '100px',
                            padding: '0.6rem 0.5rem',
                            borderRadius: '10px',
                            border: `1.5px solid ${activeSceneIndex === i ? '#4285F4' : 'var(--color-border)'}`,
                            background: activeSceneIndex === i ? 'rgba(66,133,244,0.12)' : 'var(--color-card)',
                            color: activeSceneIndex === i ? '#4285F4' : 'var(--text-secondary)',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            textAlign: 'center',
                          }}
                        >
                          <div>Scene {i + 1}</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>{sc.timestamp}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Shot-by-Shot Director Script */}
                  <div style={{ padding: '1.5rem' }}>
                    <h4 style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Layers size={16} color="#4285F4" /> Shot-by-Shot Director Script & Audio Cues
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {reelData.storyboard.map((s, idx) => (
                        <div
                          key={s.scene || idx}
                          onClick={() => setActiveSceneIndex(idx)}
                          style={{
                            background: activeSceneIndex === idx ? 'rgba(66,133,244,0.08)' : 'var(--color-surface)',
                            border: `1.5px solid ${activeSceneIndex === idx ? '#4285F4' : 'var(--color-border)'}`,
                            borderRadius: '12px',
                            padding: '1rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                              {idx + 1}. {s.name}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#4285F4', fontFamily: 'monospace', fontWeight: 700 }}>
                              {s.timestamp}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                            🎥 <strong>Camera:</strong> {s.cameraMovement}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600, marginBottom: '0.35rem' }}>
                            ⚡ <strong>Overlay:</strong> "{s.overlayText}"
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            🎵 <strong>Audio Cue:</strong> {s.audioCue}
                          </div>
                        </div>
                      ))}
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
