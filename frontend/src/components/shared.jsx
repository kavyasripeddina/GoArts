// GoArts AI - Shared Components
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Music, Bell, Search, X, Menu, LogOut, User, Settings, ChevronDown, Heart, Star, MapPin, Tag, Check, CheckCircle2, Sun, Moon, PlusCircle, Trophy, BarChart2, Eye, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { useTheme } from '../context/ThemeContext';
import { miscAPI } from '../lib/api';
export { formatINR, formatDate } from '../lib/utils';

// ── GoArts Brand Performing Arts Logo Emblem ───────────────
export const GoArtsLogoIcon = ({ size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'block', flexShrink: 0 }}
  >
    <defs>
      <linearGradient id="logoBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4285F4" />
        <stop offset="100%" stopColor="#BC4639" />
      </linearGradient>
      <linearGradient id="starGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#fef08a" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="url(#logoBgGrad)" />
    {/* Inner stage glow */}
    <circle cx="32" cy="24" r="14" fill="#ffffff" opacity="0.22" />
    {/* Performing Arts Intertwined Flourish (G & A ribbons) */}
    <path
      d="M17 44 C15 36, 17 25, 25 18 C29 14, 32 15, 32 20 C32 26, 22 28, 22 36 C22 41, 26 44, 31 44 C34 44, 36 43, 37 41 L37 35 L29 35"
      stroke="#ffffff"
      strokeWidth="4.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M47 44 C49 36, 47 25, 39 18 C35 14, 32 15, 32 20 C32 26, 42 28, 42 36 C42 41, 38 44, 33 44"
      stroke="#ffffff"
      strokeWidth="4.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.92"
    />
    {/* Center tie */}
    <path d="M26 35 L38 35" stroke="#fde047" strokeWidth="3.2" strokeLinecap="round" />
    {/* Star Talent Peak */}
    <path
      d="M32 9 L33.5 13 L37.5 14.5 L33.5 16 L32 20 L30.5 16 L26.5 14.5 L30.5 13 Z"
      fill="url(#starGold)"
    />
  </svg>
);

// ── Logo ───────────────────────────────────────────────────
export const Logo = ({ size = 'md' }) => {
  const sizes = { sm: { icon: 28, text: 'text-lg' }, md: { icon: 34, text: 'text-xl' }, lg: { icon: 42, text: 'text-2xl' } };
  const s = sizes[size];
  return (
    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
      <div style={{ borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 14px rgba(66, 133, 244, 0.35)' }}>
        <GoArtsLogoIcon size={s.icon} />
      </div>
      <span className={`${s.text} font-display`} style={{ fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
        Go<span style={{ background: 'linear-gradient(135deg, #4285F4, #BC4639)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Arts</span>
      </span>
    </Link>
  );
};

// ── Navbar ─────────────────────────────────────────────────
export const Navbar = ({ transparent = false }) => {
  const { user, logout } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const { data } = await miscAPI.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {}
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleNotifs = async () => {
    const nextState = !notifsOpen;
    setNotifsOpen(nextState);
    if (nextState) {
      setUserMenuOpen(false);
      setLoadingNotifs(true);
      await loadNotifications();
      setLoadingNotifs(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await miscAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleNotifClick = async (notif) => {
    try {
      if (!notif.isRead) {
        await miscAPI.markAsRead(notif.id);
        setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {}
    setNotifsOpen(false);

    if (user?.role === 'admin') {
      if (notif.type?.includes('verification') || notif.type?.includes('celebrity') || notif.message?.includes('Verification') || notif.message?.includes('Celebrity')) {
        navigate('/admin?tab=verifications');
      } else if (notif.type?.includes('booking') || notif.message?.includes('Booking') || notif.message?.includes('booking')) {
        navigate('/admin?tab=bookings');
      } else if (notif.type?.includes('artist') || notif.message?.includes('Artist') || notif.message?.includes('artist')) {
        navigate('/admin?tab=artists');
      } else {
        navigate('/admin?tab=overview');
      }
    } else if (user?.role === 'artist') {
      if (notif.type?.includes('booking')) {
        navigate('/artist/dashboard?tab=bookings');
      } else if (notif.type?.includes('verification')) {
        navigate('/artist/dashboard?tab=profile');
      } else {
        navigate('/artist/dashboard');
      }
    } else {
      if (notif.type?.includes('booking')) {
        navigate('/dashboard?tab=bookings');
      } else {
        navigate('/dashboard');
      }
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const navStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
    padding: scrolled ? '0.75rem 0' : '1rem 0',
    background: (!transparent || scrolled) ? 'var(--color-midnight)' : 'transparent',
    backdropFilter: (!transparent || scrolled) ? 'blur(20px)' : 'none',
    borderBottom: (!transparent || scrolled) ? '1px solid var(--color-border)' : 'none',
    boxShadow: (!transparent || scrolled) ? 'var(--shadow-sm)' : 'none',
    transition: 'all 0.25s ease',
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'artist') return '/artist/dashboard';
    return '/dashboard';
  };

  return (
    <nav style={navStyle}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Logo />
        {/* Desktop Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} className="desktop-nav">
          {[
            ['Explore Artists', '/artists'],
            ['Open Gigs Board', '/events'],
            ['Leaderboard', '/leaderboard'],
            ['AI Planner', '/ai-planner'],
            ['How It Works', '/#how-it-works']
          ].map(([label, href]) => (
            <Link key={label} to={href} style={{ padding: '0.5rem 0.875rem', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, borderRadius: '8px', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.target.style.color = 'var(--palette-blue)'; e.target.style.background = 'var(--color-surface)'; }}
              onMouseLeave={e => { e.target.style.color = 'var(--text-secondary)'; e.target.style.background = 'transparent'; }}>
              {label}
            </Link>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          
          {/* Light / Dark Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            id="global-theme-toggle"
            className="theme-toggle-btn"
            title={isDark ? "Switch to Peaceful Light Theme" : "Switch to Peaceful Dark Theme"}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#4285F4" />}
          </button>

          {user ? (
            <>
              {/* Notifications Dropdown */}
              <div style={{ position: 'relative' }} ref={notifRef}>
                <button
                  type="button"
                  onClick={toggleNotifs}
                  style={{
                    position: 'relative',
                    background: notifsOpen ? 'var(--color-surface)' : 'transparent',
                    border: 'none',
                    color: notifsOpen ? '#4285F4' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: '0.45rem',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                  title="Notifications & Alerts"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-2px',
                        background: '#BC4639',
                        color: 'white',
                        borderRadius: '50%',
                        minWidth: '17px',
                        height: '17px',
                        padding: '0 3px',
                        fontSize: '0.62rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        border: '2px solid var(--color-midnight)',
                      }}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {notifsOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 10px)',
                      background: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '18px',
                      width: '360px',
                      maxWidth: '92vw',
                      maxHeight: '440px',
                      boxShadow: 'var(--shadow-lg)',
                      zIndex: 2500,
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      animation: 'slideDown 0.2s ease',
                    }}
                  >
                    {/* Header */}
                    <div
                      style={{
                        padding: '0.85rem 1rem',
                        borderBottom: '1px solid var(--color-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'var(--color-surface)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Bell size={16} color="#4285F4" />
                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          Notifications
                        </span>
                        {unreadCount > 0 && (
                          <span
                            style={{
                              background: 'rgba(188,70,57,0.12)',
                              color: '#BC4639',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '999px',
                            }}
                          >
                            {unreadCount} new
                          </span>
                        )}
                      </div>

                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllRead}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#4285F4',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            padding: '0.2rem 0.4rem',
                            borderRadius: '6px',
                          }}
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    {/* Notification List */}
                    <div style={{ overflowY: 'auto', flex: 1, maxHeight: '360px' }}>
                      {loadingNotifs ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          Loading alerts...
                        </div>
                      ) : notifications.length === 0 ? (
                        <div style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
                          <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>🎉</div>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                            All caught up!
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            No notifications right now.
                          </div>
                        </div>
                      ) : (
                        notifications.map((n) => {
                          const isVerif = n.type?.includes('verification') || n.type?.includes('celebrity');
                          const isBooking = n.type?.includes('booking');
                          return (
                            <div
                              key={n.id}
                              onClick={() => handleNotifClick(n)}
                              style={{
                                padding: '0.85rem 1rem',
                                borderBottom: '1px solid var(--color-border)',
                                cursor: 'pointer',
                                background: n.isRead ? 'transparent' : 'rgba(66,133,244,0.06)',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '0.75rem',
                                transition: 'background 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = n.isRead ? 'var(--color-surface)' : 'rgba(66,133,244,0.12)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(66,133,244,0.06)';
                              }}
                            >
                              <div
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '10px',
                                  background: isVerif
                                    ? 'rgba(245,158,11,0.15)'
                                    : isBooking
                                    ? 'rgba(66,133,244,0.15)'
                                    : 'rgba(16,185,129,0.15)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  fontSize: '0.9rem',
                                }}
                              >
                                {isVerif ? '🛡️' : isBooking ? '📅' : '🔔'}
                              </div>

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: '0.82rem',
                                    fontWeight: n.isRead ? 500 : 700,
                                    color: 'var(--text-primary)',
                                    lineHeight: 1.4,
                                    wordBreak: 'break-word',
                                  }}
                                >
                                  {n.message}
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--text-muted)',
                                    marginTop: '0.25rem',
                                  }}
                                >
                                  {formatTimeAgo(n.createdAt)}
                                </div>
                              </div>

                              {!n.isRead && (
                                <div
                                  style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: '#4285F4',
                                    marginTop: '0.35rem',
                                    flexShrink: 0,
                                  }}
                                />
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
              {/* User Menu */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '999px', padding: '0.4rem 0.875rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #4285F4, #BC4639)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'white' }}>
                    {user.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name?.split(' ')[0]}</span>
                  <ChevronDown size={14} />
                </button>
                {userMenuOpen && (
                  <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '16px', minWidth: '200px', padding: '0.5rem', zIndex: 2000, animation: 'slideDown 0.2s ease', boxShadow: 'var(--shadow-lg)' }}
                    onMouseLeave={() => setUserMenuOpen(false)}>
                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', marginBottom: '0.5rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{user.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
                      <span className={`badge badge-terracotta`} style={{ marginTop: '0.4rem' }}>{user.role}</span>
                    </div>
                    {[
                      ['My Profile', user.role === 'artist' ? '/artist/dashboard?tab=profile' : user.role === 'admin' ? '/admin?tab=profile' : '/dashboard?tab=profile', <User size={14}/>],
                      ['My Dashboard', user.role === 'admin' ? '/admin?tab=overview' : getDashboardLink(), <BarChart2 size={14}/>],
                      user.role === 'customer' ? ['Post an Event Gig', '/events?post=true', <PlusCircle size={14}/>] : ['Browse Gigs', '/events', <Music size={14}/>],
                      ['Top Leaderboard', '/leaderboard', <Trophy size={14}/>],
                    ].filter(Boolean).map(([label, href, icon]) => (
                      <button key={label} onClick={() => { navigate(href); setUserMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.6rem 0.75rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '0.875rem', cursor: 'pointer', borderRadius: '10px', transition: 'all 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-deep)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        {icon} {label}
                      </button>
                    ))}
                    <button onClick={() => { logout(); setUserMenuOpen(false); navigate('/'); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.6rem 0.75rem', background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.875rem', cursor: 'pointer', borderRadius: '10px', transition: 'all 0.15s', marginTop: '0.25rem', borderTop: '1px solid var(--color-border)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Book Talent</Link>
            </>
          )}
          {/* Mobile Menu Button */}
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)} style={{ display: 'none', background: 'transparent', border: 'none', color: 'var(--text-primary)', padding: '0.4rem' }}>
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      {/* Mobile Menu */}
      {mobileOpen && (
        <div style={{ background: 'var(--color-midnight)', borderTop: '1px solid var(--color-border)', padding: '1rem' }}>
          {[
            ['Explore Artists', '/artists'],
            ['Open Gigs Board', '/events'],
            ['Leaderboard', '/leaderboard'],
            ['AI Planner', '/ai-planner'],
            ['How It Works', '/#how-it-works']
          ].map(([label, href]) => (
            <Link key={label} to={href} onClick={() => setMobileOpen(false)} style={{ display: 'block', padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', borderRadius: '8px' }}>{label}</Link>
          ))}
          {!user && (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', padding: '0 1rem' }}>
              <Link to="/login" onClick={() => setMobileOpen(false)} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>Sign In</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="btn btn-primary btn-sm" style={{ flex: 1 }}>Get Started</Link>
            </div>
          )}
        </div>
      )}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </nav>
  );
};

// ── Footer ─────────────────────────────────────────────────
export const Footer = () => (
  <footer style={{ background: 'var(--color-deep)', borderTop: '1px solid var(--color-border)', padding: '4rem 0 2rem' }}>
    <div className="container">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', marginBottom: '3rem' }}>
        <div>
          <Logo size="md" />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.7, marginTop: '1rem', maxWidth: '260px' }}>
            India's premium AI-powered entertainment marketplace connecting top performers with premier events.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
            {['Instagram', 'YouTube', 'Twitter', 'LinkedIn'].map((s) => (
              <a key={s} href="#" style={{ width: '36px', height: '36px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.65rem', fontWeight: 700, transition: 'all 0.2s', textDecoration: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--palette-blue)'; e.currentTarget.style.color = '#ffffff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                {s[0]}
              </a>
            ))}
          </div>
        </div>
        {[
          { title: 'Discover', links: ['All Artists', 'Live Arena Bands', 'Classical & Cinematic Dancers', 'Playback Singers', 'DJs & Mashups'] },
          { title: 'Events', links: ['Weddings', 'Corporate Galas', 'College Festivals', 'Stadium Concerts', 'Private Parties'] },
          { title: 'Platform', links: ['How It Works', 'AI Event Planner', 'Artist Verification', 'Transparency & Escrow', 'Contact Us'] },
        ].map(({ title, links }) => (
          <div key={title}>
            <h4 style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {links.map((l) => (
                <li key={l}><a href="#" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#4285F4'} onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}>{l}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid rgba(212,165,154,0.12)', paddingTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <p style={{ color: 'rgba(212,165,154,0.5)', fontSize: '0.8rem' }}>© {new Date().getFullYear()} GoArts. All rights reserved.</p>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((l) => (
            <a key={l} href="#" style={{ color: 'rgba(212,165,154,0.5)', fontSize: '0.8rem', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#4285F4'} onMouseLeave={e => e.target.style.color = 'rgba(212,165,154,0.5)'}>{l}</a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

// ── Artist Card ────────────────────────────────────────────
export const ArtistCard = ({ artist, onFavoriteToggle, isFavorite, compact = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [imgError, setImgError] = useState(false);

  const formatPrice = (p) => `₹${(p || 0).toLocaleString('en-IN')}`;
  const isEstablished = artist.artistTier === 'established';
  const isCelebrityVerified = artist.verificationStatus === 'celebrity_verified';
  const isIdVerified = artist.verified || artist.aadhaarVerified;

  return (
    <div className="artist-card" onClick={() => navigate(`/artists/${artist.id}`)}>
      <div className="artist-card__image">
        <img
          src={imgError ? `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.displayName)}&background=BC4639&color=fff&size=400` : (artist.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.displayName)}&background=BC4639&color=fff&size=400`)}
          alt={artist.displayName}
          onError={() => setImgError(true)}
        />
        <div className="artist-card__overlay" />
        
        {/* Category Badge on Top-Left */}
        <span className="artist-card__badge" style={{ background: 'linear-gradient(135deg, #4285F4, #BC4639)' }}>
          {artist.category}
        </span>

        {/* Tier Classification Badge on Top-Right */}
        <span
          style={{
            position: 'absolute',
            top: '0.75rem',
            right: user ? '3rem' : '0.75rem',
            padding: '0.2rem 0.55rem',
            borderRadius: '8px',
            fontSize: '0.68rem',
            fontWeight: 800,
            letterSpacing: '0.3px',
            textTransform: 'uppercase',
            color: '#ffffff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            background: isEstablished
              ? 'linear-gradient(135deg, #f59e0b, #d97706)'
              : 'linear-gradient(135deg, #06b6d4, #0284c7)',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            zIndex: 2,
          }}
        >
          {isEstablished ? '👑 Established' : '🚀 Emerging'}
        </span>

        {user && (
          <button className={`artist-card__fav ${isFavorite ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onFavoriteToggle?.(artist.id); }}>
            <Heart size={16} fill={isFavorite ? '#fff' : 'none'} color="#fff" />
          </button>
        )}

        {/* Verification Checkmark (Blue for Celebrity Authenticated, Green for Aadhaar / Government ID Verified) */}
        {isCelebrityVerified ? (
          <div
            style={{
              position: 'absolute',
              bottom: '0.75rem',
              right: '0.75rem',
              background: '#3b82f6',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(59,130,246,0.6)',
              border: '2px solid #ffffff',
            }}
            title="👑 Authenticated Celebrity & Established Artist (Identity & Portfolio Verified)"
          >
            <Check size={14} color="white" strokeWidth={3.5} />
          </div>
        ) : isIdVerified ? (
          <div
            style={{
              position: 'absolute',
              bottom: '0.75rem',
              right: '0.75rem',
              background: '#10b981',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(16,185,129,0.5)',
              border: '2px solid #ffffff',
            }}
            title="🛡️ Government ID & Aadhaar Verified Talent"
          >
            <Check size={14} color="white" strokeWidth={3} />
          </div>
        ) : null}
      </div>

      <div className="artist-card__body">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
          <div className="artist-card__category" style={{ color: 'var(--palette-blue)', fontWeight: 700, margin: 0 }}>
            {artist.category}
          </div>
          {isEstablished && (
            <span style={{ fontSize: '0.68rem', color: '#f59e0b', fontWeight: 700 }}>
              ★ Arena Scale
            </span>
          )}
        </div>

        <div className="artist-card__name" style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {artist.displayName}
          </span>
          {isCelebrityVerified && (
            <span title="Verified Celebrity" style={{ color: '#3b82f6', display: 'inline-flex', flexShrink: 0 }}>
              <CheckCircle2 size={15} fill="#3b82f6" color="#ffffff" />
            </span>
          )}
        </div>

        <div className="artist-card__meta">
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-muted)' }}>
            <MapPin size={12} color="var(--text-muted)" /> {artist.city}
          </span>
          {artist.languages?.slice(0, 2).map((l) => <span key={l} className="tag">{l}</span>)}
        </div>

        <div className="artist-card__footer">
          <div>
            <div className="artist-card__rating">
              {artist.reviewCount > 0 ? (
                <>
                  <Star size={13} fill="currentColor" color="#4285F4" />
                  <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{artist.rating}</span>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({artist.reviewCount})</span>
                </>
              ) : isEstablished ? (
                <span style={{ color: '#f59e0b', fontSize: '0.72rem', fontWeight: 700, background: 'rgba(245,158,11,0.12)', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
                  ★ Celebrity Headliner
                </span>
              ) : (
                <span style={{ color: '#06b6d4', fontSize: '0.72rem', fontWeight: 700, background: 'rgba(6,182,212,0.12)', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
                  🚀 Talent Score: {artist.evaluationMetrics?.talentScore || 88}%
                </span>
              )}
            </div>
          </div>
          <div className="artist-card__price" style={{ color: 'var(--palette-blue)', fontWeight: 800 }}>
            From {formatPrice(artist.startingPrice)}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Loading Spinner ────────────────────────────────────────
export const Spinner = ({ size = 40, center = false }) => (
  <div style={{ display: 'flex', justifyContent: center ? 'center' : 'flex-start', alignItems: 'center', padding: center ? '4rem 0' : '0' }}>
    <div style={{ width: size, height: size, border: '3px solid rgba(212,165,154,0.2)', borderTop: '3px solid #4285F4', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ── Empty State ────────────────────────────────────────────
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="empty-state">
    {Icon && (
      <div className="empty-state__icon">
        <Icon size={36} />
      </div>
    )}
    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{title}</h3>
    {description && <p style={{ fontSize: '0.875rem', maxWidth: '400px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>{description}</p>}
    {action && <div style={{ marginTop: '1.5rem' }}>{action}</div>}
  </div>
);

// ── Status Badge ───────────────────────────────────────────
export const StatusBadge = ({ status }) => {
  const labels = {
    requested: 'Requested', quoted: 'Quoted', confirmed: 'Confirmed',
    completed: 'Completed', cancelled: 'Cancelled', declined: 'Declined',
    approved: 'Approved', pending: 'Pending', suspended: 'Suspended', rejected: 'Rejected',
  };
  return (
    <span className={`badge status-${status}`} style={{ textTransform: 'capitalize' }}>
      {labels[status] || status}
    </span>
  );
};

// ── Star Rating ────────────────────────────────────────────
export const StarRating = ({ rating, max = 5, size = 14 }) => (
  <div className="stars">
    {Array.from({ length: max }, (_, i) => (
      <Star key={i} size={size} fill={i < Math.floor(rating) ? '#f59e0b' : 'none'} color={i < Math.floor(rating) ? '#f59e0b' : '#374151'} />
    ))}
  </div>
);

// ── Soundwave ──────────────────────────────────────────────
export const Soundwave = ({ bars = 8 }) => (
  <div className="soundwave">
    {Array.from({ length: bars }, (_, i) => (
      <div key={i} className="soundwave__bar" />
    ))}
  </div>
);

// ── Protected Route ────────────────────────────────────────
export const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login', { state: { from: location.pathname } });
      } else if (role && user.role !== role && !(role === 'artist' && user.role === 'admin')) {
        navigate(user.role === 'admin' ? '/admin' : user.role === 'artist' ? '/artist/dashboard' : '/dashboard');
      }
    }
  }, [user, loading, role, navigate, location]);

  if (loading) return <Spinner center size={50} />;
  if (!user) return null;
  if (role && user.role !== role && !(role === 'artist' && user.role === 'admin')) return null;
  return children;
};

// formatINR and formatDate are re-exported from ../lib/utils via the top-level export above
