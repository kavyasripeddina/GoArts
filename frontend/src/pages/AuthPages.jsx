import { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Music, Mail, Lock, User, Phone, MapPin, ArrowLeft, Sparkles, Sun, Moon, Camera, Upload, X, Shield, Award, Check } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { useTheme } from '../context/ThemeContext';
import { Logo } from '../components/shared';
import toast from 'react-hot-toast';

const BG_STYLE = {
  minHeight: '100vh',
  background: 'var(--color-midnight)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem 1rem',
  position: 'relative',
  overflow: 'hidden',
};

const GLOWS = (
  <>
    <div style={{ position: 'absolute', width: '500px', height: '500px', background: 'rgba(66,133,244,0.08)', borderRadius: '50%', filter: 'blur(80px)', top: '-100px', right: '-100px', pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', width: '400px', height: '400px', background: 'rgba(188,70,57,0.08)', borderRadius: '50%', filter: 'blur(80px)', bottom: '-100px', left: '-100px', pointerEvents: 'none' }} />
  </>
);

export function LoginPage() {
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/dashboard';
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name?.split(' ')[0]}!`);
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'artist') {
        navigate(from.startsWith('/artist') ? from : '/artist/dashboard');
      } else {
        navigate(from.startsWith('/artist') || from.startsWith('/admin') ? '/dashboard' : from);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={BG_STYLE}>
      {GLOWS}
      
      {/* Top right Theme Toggle */}
      <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', zIndex: 10 }}>
        <button
          onClick={toggleTheme}
          className="theme-toggle-btn"
          title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#4285F4" />}
        </button>
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '460px' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <Logo size="lg" />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Sign in to your account
          </p>
        </div>

        <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '24px', padding: '2rem', boxShadow: 'var(--shadow-lg)' }}>
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#ef4444', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input className="form-input" style={{ paddingLeft: '2.5rem' }} type="text" placeholder="you@example.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input className="form-input" style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }} type={showPwd ? 'text' : 'password'} placeholder="Your password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} autoComplete="current-password" />
                <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Don't have an account? <Link to="/register" style={{ color: '#4285F4', fontWeight: 600 }}>Create one</Link>
          </p>
        </div>
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem', transition: 'color 0.2s' }}>
            <ArrowLeft size={14} /> Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const defaultRole = new URLSearchParams(location.search).get('role') || 'customer';
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: defaultRole,
    phone: '',
    city: '',
    category: 'Singer',
    artistTier: 'emerging',
    startingPrice: '25000',
  });
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [avatar, setAvatar] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const isSubmittingRef = useRef(false);
  const fileInputRef = useRef(null);

  const CATEGORIES = [
    'Singer', 'Band', 'DJ', 'Dancer', 'Comedian', 'Instrumentalist', 'Magician', 'Cultural Troupe'
  ];

  const PRESET_AVATARS = [
    `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><defs><linearGradient id="p1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#4285F4"/><stop offset="100%" stop-color="#1E40AF"/></linearGradient></defs><rect width="120" height="120" rx="60" fill="url(#p1)"/><text x="60" y="68" font-size="44" text-anchor="middle" fill="#fff">🎤</text></svg>')}`,
    `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><defs><linearGradient id="p2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#BC4639"/><stop offset="100%" stop-color="#7F1D1D"/></linearGradient></defs><rect width="120" height="120" rx="60" fill="url(#p2)"/><text x="60" y="68" font-size="44" text-anchor="middle" fill="#fff">🎸</text></svg>')}`,
    `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><defs><linearGradient id="p3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#10B981"/><stop offset="100%" stop-color="#065F46"/></linearGradient></defs><rect width="120" height="120" rx="60" fill="url(#p3)"/><text x="60" y="68" font-size="44" text-anchor="middle" fill="#fff">🎧</text></svg>')}`,
    `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><defs><linearGradient id="p4" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#8B5CF6"/><stop offset="100%" stop-color="#4C1D95"/></linearGradient></defs><rect width="120" height="120" rx="60" fill="url(#p4)"/><text x="60" y="68" font-size="44" text-anchor="middle" fill="#fff">🎭</text></svg>')}`,
    `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><defs><linearGradient id="p5" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#F59E0B"/><stop offset="100%" stop-color="#B45309"/></linearGradient></defs><rect width="120" height="120" rx="60" fill="url(#p5)"/><text x="60" y="68" font-size="44" text-anchor="middle" fill="#fff">✨</text></svg>')}`,
  ];

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatar(event.target.result);
      toast.success('Profile photo ready!');
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required.';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email address is required.';
    
    // Strong password check: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol/underscore
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#_\-+=~^()[\]{}|:;,.<>]).{8,}$/;
    if (!strongPasswordRegex.test(form.password)) {
      e.password = 'Must be 8+ chars and include uppercase, lowercase, number & symbol/underscore (e.g. GoArts_2026!).';
    }
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match.';
    return e;
  };

  const hasLength = form.password.length >= 8;
  const hasUpper = /[A-Z]/.test(form.password);
  const hasLower = /[a-z]/.test(form.password);
  const hasNumber = /\d/.test(form.password);
  const hasSymbol = /[@$!%*?&#_\-+=~^()[\]{}|:;,.<>]/.test(form.password);

  const generateStrongPassword = () => {
    const lowers = 'abcdefghijkmnopqrstuvwxyz';
    const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const numbers = '23456789';
    const symbols = '!@#$%&*_-+=';
    let pwd = '';
    pwd += uppers[Math.floor(Math.random() * uppers.length)];
    pwd += lowers[Math.floor(Math.random() * lowers.length)];
    pwd += numbers[Math.floor(Math.random() * numbers.length)];
    pwd += symbols[Math.floor(Math.random() * symbols.length)];
    const all = lowers + uppers + numbers + symbols;
    for (let i = 0; i < 8; i++) {
      pwd += all[Math.floor(Math.random() * all.length)];
    }
    pwd = pwd.split('').sort(() => 0.5 - Math.random()).join('');
    setForm(p => ({ ...p, password: pwd, confirmPassword: pwd }));
    setShowPwd(true);
    toast.success('Generated strong secure password!');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingRef.current || loading) return;

    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});

    isSubmittingRef.current = true;
    setLoading(true);

    try {
      const resolvedCategory = (isCustomCategory && customCategory.trim()) ? customCategory.trim() : form.category;
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        phone: form.phone.trim(),
        city: form.city || 'Hyderabad',
        category: form.role === 'artist' ? resolvedCategory : undefined,
        artistTier: form.role === 'artist' ? form.artistTier : undefined,
        startingPrice: form.role === 'artist' ? (Number(form.startingPrice) || 25000) : undefined,
        avatar: avatar || undefined,
      };

      const user = await register(payload);
      toast.success(`Welcome to GoArts, ${user.name?.split(' ')[0]}!`);
      if (user.role === 'artist') navigate('/artist/dashboard');
      else navigate('/dashboard');
    } catch (err) {
      setErrors({ general: err.response?.data?.error || 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <div style={{ ...BG_STYLE, alignItems: 'flex-start', paddingTop: '3.5rem', paddingBottom: '3.5rem' }}>
      {GLOWS}

      {/* Top right Theme Toggle */}
      <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', zIndex: 10 }}>
        <button
          onClick={toggleTheme}
          className="theme-toggle-btn"
          title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#4285F4" />}
        </button>
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '560px' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <Logo size="lg" />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Create your account on India's premier entertainment marketplace
          </p>
        </div>

        <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '24px', padding: '2rem', boxShadow: 'var(--shadow-lg)' }}>
          {/* Role toggle */}
          <div style={{ display: 'flex', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '4px', marginBottom: '1.5rem' }}>
            {[['customer', 'I\'m Booking Talent'], ['artist', 'I\'m a Performer / Artist']].map(([role, label]) => (
              <button
                key={role}
                type="button"
                onClick={() => setForm(p => ({ ...p, role }))}
                style={{
                  flex: 1,
                  padding: '0.6rem 0.5rem',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  transition: 'all 0.2s',
                  background: form.role === role ? 'linear-gradient(135deg, #4285F4, #BC4639)' : 'transparent',
                  color: form.role === role ? 'white' : 'var(--text-secondary)',
                  boxShadow: form.role === role ? '0 2px 8px rgba(66,133,244,0.3)' : 'none',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {errors.general && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#ef4444', fontSize: '0.85rem', lineHeight: 1.5 }}>
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* ── PROFILE PHOTO SECTION ───────────────────────────────── */}
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <label className="form-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                  <Camera size={15} color="var(--palette-blue)" />
                  {form.role === 'artist' ? 'Artist Profile Photo' : 'Customer Profile Photo (Optional)'}
                  {form.role === 'artist' ? (
                    <span style={{ fontSize: '0.7rem', background: 'rgba(16,185,129,0.15)', color: '#10b981', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '6px' }}>
                      Highly Recommended
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.72rem', background: 'rgba(66,133,244,0.1)', color: '#4285F4', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '6px' }}>
                      Optional — You Can Skip This
                    </span>
                  )}
                </label>
              </div>

              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.85rem', lineHeight: 1.4 }}>
                {form.role === 'artist'
                  ? '✨ Clear headshots and stage portraits increase inquiries by 3x and help clients recognize your talent.'
                  : '🔒 Uploading a profile photo is completely optional for customers. You may choose to skip this step and add a photo anytime later in your account.'}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', width: '64px', height: '64px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--palette-blue)', background: 'rgba(66,133,244,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {avatar ? (
                    <img src={avatar} alt="Profile Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <User size={28} color="var(--text-muted)" />
                  )}
                  {avatar && (
                    <button
                      type="button"
                      onClick={() => setAvatar('')}
                      style={{ position: 'absolute', top: 0, right: 0, width: '20px', height: '20px', background: 'rgba(239,68,68,0.9)', border: 'none', borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      title="Remove Photo"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: '180px' }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    style={{ display: 'none' }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Upload size={13} /> {avatar ? 'Change Photo' : 'Upload From Device'}
                    </button>
                    {avatar && (
                      <button
                        type="button"
                        onClick={() => setAvatar('')}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer' }}
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {!avatar && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Or choose avatar icon:</span>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {PRESET_AVATARS.map((pImg, idx) => (
                          <img
                            key={idx}
                            src={pImg}
                            alt="Preset Avatar"
                            onClick={() => setAvatar(pImg)}
                            style={{ width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', objectFit: 'cover', border: '1.5px solid rgba(255,255,255,0.3)', transition: 'transform 0.15s' }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            title="Select preset avatar icon"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── ARTIST TIER & CATEGORY (ONLY FOR ARTISTS) ───────────── */}
            {form.role === 'artist' && (
              <div style={{ background: 'rgba(66,133,244,0.06)', border: '1px solid rgba(66,133,244,0.25)', borderRadius: '16px', padding: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <label className="form-label" style={{ fontSize: '0.8rem', margin: 0 }}>Primary Performance Category</label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomCategory(!isCustomCategory);
                          if (!isCustomCategory) setCustomCategory(form.category || '');
                        }}
                        style={{ background: 'transparent', border: 'none', color: '#4285F4', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                      >
                        {isCustomCategory ? '← Choose list' : '✏️ Custom'}
                      </button>
                    </div>

                    {isCustomCategory ? (
                      <div>
                        <input
                          className="form-input"
                          style={{ fontSize: '0.85rem' }}
                          type="text"
                          placeholder="e.g. Flutist, Puppeteer, Anchor/MC, Beatboxer"
                          value={customCategory}
                          onChange={e => setCustomCategory(e.target.value)}
                          autoFocus
                        />
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
                          {['Anchor / MC', 'Flutist', 'Poet / Storyteller', 'Puppeteer', 'Beatboxer'].map(c => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setCustomCategory(c)}
                              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '999px', padding: '0.1rem 0.45rem', fontSize: '0.62rem', color: 'var(--text-secondary)', cursor: 'pointer' }}
                            >
                              + {c}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <select
                        className="form-select"
                        style={{ fontSize: '0.85rem' }}
                        value={form.category}
                        onChange={e => {
                          if (e.target.value === '__custom__') {
                            setIsCustomCategory(true);
                          } else {
                            setForm(p => ({ ...p, category: e.target.value }));
                          }
                        }}
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        <option value="__custom__">✨ Other / Custom Category...</option>
                      </select>
                    )}
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Artist Track / Category</label>
                    <select
                      className="form-select"
                      style={{ fontSize: '0.85rem' }}
                      value={form.artistTier}
                      onChange={e => setForm(p => ({ ...p, artistTier: e.target.value }))}
                    >
                      <option value="emerging">🚀 Emerging & New Talent</option>
                      <option value="established">👑 Famous & Established Artist</option>
                    </select>
                  </div>
                </div>

                {/* Starting Price Input */}
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', margin: 0 }}>Starting Performance Price (₹)</label>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Customers book you based on this minimum quote</span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 800 }}>₹</span>
                    <input
                      className="form-input"
                      style={{ paddingLeft: '2.2rem', fontSize: '0.85rem' }}
                      type="number"
                      min="1000"
                      step="1000"
                      placeholder="e.g. 25000"
                      value={form.startingPrice}
                      onChange={e => setForm(p => ({ ...p, startingPrice: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Anti-impersonation notice */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '0.65rem 0.75rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  <Shield size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    {form.artistTier === 'established' ? (
                      <span>
                        <strong style={{ color: '#f59e0b' }}>Celebrity Anti-Impersonation Gate:</strong> Established profiles undergo identity authentication (social links, achievements, and government ID) before public listing to prevent fake celebrity claims.
                      </span>
                    ) : (
                      <span>
                        <strong style={{ color: '#10b981' }}>Emerging Talent Opportunity:</strong> Instant marketplace listing without requiring celebrity credentials. Build your profile, showcase live performance reels, and earn client reviews!
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── ACCOUNT DETAILS ────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name / Stage Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    className="form-input"
                    style={{ paddingLeft: '2.5rem', borderColor: errors.name ? '#ef4444' : undefined }}
                    type="text"
                    placeholder={form.role === 'artist' ? 'e.g. Arijit Singh / Stage Name' : 'Your full name'}
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Phone (Optional)</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    type="tel"
                    placeholder="+91-XXXXXXXXXX"
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    className="form-input"
                    style={{ paddingLeft: '2.5rem', borderColor: errors.email ? '#ef4444' : undefined }}
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    autoComplete="email"
                  />
                </div>
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">City</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <select
                    className="form-select"
                    style={{ paddingLeft: '2.5rem' }}
                    value={form.city}
                    onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                  >
                    <option value="">Select your city</option>
                    {['Hyderabad', 'Bengaluru', 'Chennai', 'Mumbai', 'Delhi', 'Pune', 'Kolkata', 'Ahmedabad'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', marginBottom: '0.35rem' }}>
              <label className="form-label" style={{ margin: 0, fontWeight: 700 }}>Security & Password</label>
              <button
                type="button"
                onClick={generateStrongPassword}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#4285F4',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: 0,
                }}
              >
                ✨ Suggest Strong Unique Password
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    className="form-input"
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem', borderColor: errors.password ? '#ef4444' : undefined }}
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Strong password"
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <span className="form-error">{errors.password}</span>}
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    className="form-input"
                    style={{ paddingLeft: '2.5rem', borderColor: errors.confirmPassword ? '#ef4444' : undefined }}
                    type="password"
                    placeholder="Repeat password"
                    value={form.confirmPassword}
                    onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
                    autoComplete="new-password"
                  />
                </div>
                {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
              </div>
            </div>

            {/* Password strength criteria checklist */}
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '0.65rem 0.85rem', marginBottom: '1.25rem', fontSize: '0.72rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ color: hasLength ? '#10b981' : 'var(--text-muted)', fontWeight: hasLength ? 700 : 400 }}>
                {hasLength ? '✓' : '○'} 8+ chars
              </span>
              <span style={{ color: hasUpper ? '#10b981' : 'var(--text-muted)', fontWeight: hasUpper ? 700 : 400 }}>
                {hasUpper ? '✓' : '○'} Uppercase (A-Z)
              </span>
              <span style={{ color: hasLower ? '#10b981' : 'var(--text-muted)', fontWeight: hasLower ? 700 : 400 }}>
                {hasLower ? '✓' : '○'} Lowercase (a-z)
              </span>
              <span style={{ color: hasNumber ? '#10b981' : 'var(--text-muted)', fontWeight: hasNumber ? 700 : 400 }}>
                {hasNumber ? '✓' : '○'} Number (0-9)
              </span>
              <span style={{ color: hasSymbol ? '#10b981' : 'var(--text-muted)', fontWeight: hasSymbol ? 700 : 400 }}>
                {hasSymbol ? '✓' : '○'} Symbol / Underscore (@, #, _, !)
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {loading ? (
                <>Creating Account...</>
              ) : (
                <>
                  <Sparkles size={16} />
                  Create {form.role === 'artist' ? (form.artistTier === 'established' ? 'Established Artist' : 'Emerging Artist') : 'Customer'} Account
                </>
              )}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Already have an account? <Link to="/login" style={{ color: '#4285F4', fontWeight: 600 }}>Sign in</Link>
          </p>
          <p style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            By creating an account, you agree to our Terms of Service and Anti-Impersonation Guidelines.
          </p>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <ArrowLeft size={14} /> Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
