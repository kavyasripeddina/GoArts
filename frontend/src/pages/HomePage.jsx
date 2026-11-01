// GoArts AI - Premium Homepage (v3 — Business Plan Complete)
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search, Music, Mic2, Disc3, Dumbbell, Laugh, Zap, Star, Users, Shield,
  ArrowRight, ChevronRight, Sparkles, Check, Bot, Globe, BarChart2,
  CreditCard, FileText, Calendar, MapPin, Video, TrendingUp,
  Building2, GraduationCap, Utensils, Briefcase, HeartHandshake, PartyPopper,
  Landmark, BrainCircuit
} from 'lucide-react';
import { Navbar, Footer, ArtistCard, Soundwave, formatINR } from '../components/shared';
import { artistsAPI } from '../lib/api';
import { useAuth } from '../context/useAuth';

// Category icons & data (The 5-Color Swatch Theme)
const CATEGORIES = [
  { name: 'Singers', icon: Mic2, color: '#4285F4', artists: '120+', desc: 'Sid Sriram to Bollywood' },
  { name: 'Bands', icon: Music, color: '#BC4639', artists: '45+', desc: 'Anirudh Band & Live Acts' },
  { name: 'DJs', icon: Disc3, color: '#4285F4', artists: '88+', desc: 'Club & Wedding Mashups' },
  { name: 'Dancers', icon: Dumbbell, color: '#D4A59A', artists: '65+', desc: 'Poorna Dance & Classical' },
  { name: 'Comedians', icon: Laugh, color: '#10b981', artists: '30+', desc: 'Stand-up & Corporate' },
  { name: 'Instrumentalists', icon: Music, color: '#D4A59A', artists: '40+', desc: 'Sitar to Electric Violin' },
  { name: 'Magicians', icon: Sparkles, color: '#4285F4', artists: '20+', desc: 'Mentalism & Illusion' },
  { name: 'Cultural Troupes', icon: Users, color: '#BC4639', artists: '35+', desc: 'Folk & Regional Fusion' },
];

const TESTIMONIALS = [
  { name: 'Priya Sharma', event: 'Wedding Reception, Hyderabad', rating: 5, text: 'GoArts booked Poorna Dance Troupe and a fabulous singer for our wedding reception. Truly world-class coordination!', avatar: 'P' },
  { name: 'Rahul Verma', event: 'TechCorp Arena Gala, Bengaluru', rating: 5, text: 'We managed to book an arena live band and DJ within 48 hours through GoArts. The escrow security made budgeting completely effortless.', avatar: 'R' },
  { name: 'Ananya Reddy', event: 'College Festival, Chennai', rating: 5, text: 'The AI Event Planner helped us curate our college fest headliner lineup within budget. The crowd went completely wild!', avatar: 'A' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Describe Your Event', desc: 'Tell our AI about your event type, date, city, budget, and the energy you envision.', color: '#4285F4' },
  { step: '02', title: 'Discover Matched Artists', desc: 'Our AI surfaces top compatible artists like Anirudh Band, Poorna Dance Troupe, and verified acts.', color: '#BC4639' },
  { step: '03', title: 'Book with Escrow Protection', desc: 'Review pricing, confirm the contract with guaranteed escrow protection, and enjoy an unforgettable show.', color: '#10b981' },
];

const EVENT_VENUES = [
  { label: 'Weddings', icon: HeartHandshake, color: '#BC4639' },
  { label: 'Corporate Events', icon: Briefcase, color: '#4285F4' },
  { label: 'College Festivals', icon: GraduationCap, color: '#10b981' },
  { label: 'Hotels & Resorts', icon: Building2, color: '#D4A59A' },
  { label: 'Pubs & Lounges', icon: Utensils, color: '#BC4639' },
  { label: 'Government Events', icon: Landmark, color: '#4285F4' },
  { label: 'Private Parties', icon: PartyPopper, color: '#10b981' },
  { label: 'Concerts & Festivals', icon: Music, color: '#BC4639' },
];

const PRICING_TABLE = [
  { category: 'Solo Singer', range: '₹5,000 – ₹25,000', icon: Mic2, color: '#4285F4' },
  { category: 'Duo Performers', range: '₹10,000 – ₹50,000', icon: Users, color: '#BC4639' },
  { category: 'Music Band', range: '₹20,000 – ₹2 Lakhs', icon: Music, color: '#10b981' },
  { category: 'Celebrity Singer', range: '₹1 Lakh – ₹25 Lakhs', icon: Star, color: '#D4A59A' },
  { category: 'DJ Nights', range: '₹10,000 – ₹5 Lakhs', icon: Disc3, color: '#4285F4' },
  { category: 'Stand-up Comedy', range: '₹10,000 – ₹2 Lakhs', icon: Laugh, color: '#BC4639' },
  { category: 'Dance Groups', range: '₹15,000 – ₹3 Lakhs', icon: Dumbbell, color: '#10b981' },
  { category: 'Cultural Acts', range: '₹5,000 – ₹2 Lakhs', icon: Globe, color: '#D4A59A' },
];

const WORKFLOW_STEPS = [
  { step: '01', title: 'Customer Posts Event', desc: 'Share event type, date, city, budget, and audience size.' },
  { step: '02', title: 'AI Understands Requirements', desc: 'Our Gemini-powered engine parses your vision instantly.' },
  { step: '03', title: 'Shortlists Suitable Artists', desc: 'Top matching artists are ranked by compatibility score.' },
  { step: '04', title: 'Artists Submit Quotes', desc: 'Vetted performers send transparent proposals.' },
  { step: '05', title: 'Customer Selects Artist', desc: 'Compare portfolios, demos, and ratings side by side.' },
  { step: '06', title: 'Online Agreement Generated', desc: 'Digital contract created with all agreed terms.' },
  { step: '07', title: 'Payment Escrow', desc: 'Half upfront held securely until performance is confirmed.' },
  { step: '08', title: 'Performance Completed', desc: 'Artist performs at your event seamlessly.' },
  { step: '09', title: 'Final Payment Released', desc: 'Remaining balance released to the artist post-event.' },
  { step: '10', title: 'Ratings & Reviews', desc: 'Both parties review for community trust.' },
];

const AI_FEATURES = [
  { title: 'AI Artist Matching Engine', icon: BrainCircuit, color: '#4285F4', desc: 'Enter event type, city, budget & language — AI recommends the perfect lineup from 500+ verified artists.' },
  { title: 'AI Event Planner', icon: Sparkles, color: '#BC4639', desc: 'Describe your event in plain language and get an instant artist list, budget estimate, stage requirements, and timeline.' },
  { title: 'AI Chat Assistant', icon: Bot, color: '#10b981', desc: '24×7 multilingual assistant for artist search, booking, quotations, contracts, and payment queries.' },
  { title: 'AI Talent Rating System', icon: BarChart2, color: '#D4A59A', desc: 'AI scores artists out of 100 based on reviews, engagement, booking frequency, social growth & professionalism.' },
];

const EXPANSION_PHASES = [
  { phase: 'Phase 1 — India', cities: ['Hyderabad', 'Chennai', 'Bengaluru', 'Mumbai', 'Delhi'], color: '#4285F4' },
  { phase: 'Phase 2 — South Asia', cities: ['Sri Lanka', 'Nepal', 'Bangladesh'], color: '#BC4639' },
  { phase: 'Phase 3 — Global', cities: ['UAE', 'Singapore', 'UK', 'USA'], color: '#10b981' },
];

const ARTIST_BENEFITS = [
  { icon: FileText, label: 'Digital Portfolio', desc: 'Showcase your work with verified video reels' },
  { icon: CreditCard, label: 'Secure Payments', desc: 'Escrow-backed payouts — no chasing clients' },
  { icon: Sparkles, label: 'AI Promotion', desc: 'AI-powered matching puts you in front of bookers' },
  { icon: Calendar, label: 'Calendar Management', desc: 'Smart schedule & availability management' },
  { icon: BarChart2, label: 'Earnings Dashboard', desc: 'Track bookings and income in real time' },
  { icon: Globe, label: 'Brand Collaborations', desc: 'Unlock sponsored events and music brand deals' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [establishedArtists, setEstablishedArtists] = useState([]);
  const [emergingArtists, setEmergingArtists] = useState([]);
  const [searchForm, setSearchForm] = useState({ eventType: '', city: '', date: '', budget: '' });
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState(new Set());

  useEffect(() => {
    Promise.allSettled([
      artistsAPI.list({ tier: 'established', limit: 4 }),
      artistsAPI.list({ tier: 'emerging', limit: 4 }),
    ])
      .then(([estRes, emRes]) => {
        if (estRes.status === 'fulfilled') {
          setEstablishedArtists(estRes.value.data.artists || []);
        }
        if (emRes.status === 'fulfilled') {
          setEmergingArtists(emRes.value.data.artists || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchForm.eventType) params.set('eventType', searchForm.eventType);
    if (searchForm.city) params.set('city', searchForm.city);
    if (searchForm.budget) params.set('maxPrice', searchForm.budget);
    navigate(`/artists?${params.toString()}`);
  };

  const handleAISearch = () => {
    navigate('/ai-planner', { state: searchForm });
  };

  return (
    <div>
      <Navbar transparent />

      {/* ── Hero ────────────────────────────────────────────── */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', background: 'var(--gradient-hero)' }}>
        {/* Glow effects */}
        <div style={{ position: 'absolute', width: '700px', height: '700px', background: 'var(--color-blue-glow)', borderRadius: '50%', filter: 'blur(100px)', top: '-150px', right: '-150px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: '500px', height: '500px', background: 'var(--color-terracotta-glow)', borderRadius: '50%', filter: 'blur(100px)', bottom: '-100px', left: '-100px', pointerEvents: 'none' }} />

        {/* Background Image Overlay */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1600&q=60)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.05, pointerEvents: 'none' }} />

        <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: '6rem', paddingBottom: '4rem' }}>
          <div style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center' }}>
            {/* Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(66,133,244,0.12)', border: '1px solid rgba(66,133,244,0.25)', borderRadius: '999px', padding: '0.4rem 1.1rem', marginBottom: '2rem', animation: 'fadeInUp 0.6s ease' }}>
              <Sparkles size={14} color="#4285F4" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4285F4' }}>AI-Powered Artist, Band & Live Entertainment Marketplace</span>
            </div>

            {/* Main Headline */}
            <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '1.5rem', color: 'var(--text-primary)', animation: 'fadeInUp 0.7s ease 0.1s both' }}>
              Where Talent Meets{' '}
              <span className="font-display" style={{ fontStyle: 'italic', display: 'block', background: 'linear-gradient(135deg, #4285F4 0%, #BC4639 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Opportunity.
              </span>
            </h1>

            <p style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: 'var(--text-secondary)', maxWidth: '640px', margin: '0 auto 2.5rem', lineHeight: 1.7, animation: 'fadeInUp 0.7s ease 0.2s both' }}>
              Discover and book India's headline talent — from The Anirudh Band & Sid Sriram to Poorna Dance Troupe, DJs, and comedians. Transparent escrow pricing, powered by AI.
            </p>

            {/* Soundwave */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
              <Soundwave bars={12} />
            </div>

            {/* Search Bar */}
            <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '24px', padding: '1.25rem', boxShadow: 'var(--shadow-lg)', animation: 'fadeInUp 0.7s ease 0.3s both' }}>
              <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr)) auto', gap: '0.75rem', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem', textAlign: 'left' }}>Event Type</div>
                  <select className="form-select" value={searchForm.eventType} onChange={e => setSearchForm(p => ({ ...p, eventType: e.target.value }))} style={{ border: 'none', background: 'var(--color-surface)', borderRadius: '12px', padding: '0.65rem 0.875rem', color: 'var(--text-primary)', boxShadow: 'none' }}>
                    <option value="">Any Event</option>
                    {['Wedding', 'Corporate Event', 'College Festival', 'Concert', 'Birthday Party', 'Brand Launch', 'Hotel Event', 'Government Event', 'Pub Night', 'Private Party'].map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem', textAlign: 'left' }}>City</div>
                  <select className="form-select" value={searchForm.city} onChange={e => setSearchForm(p => ({ ...p, city: e.target.value }))} style={{ border: 'none', background: 'var(--color-surface)', borderRadius: '12px', padding: '0.65rem 0.875rem', color: 'var(--text-primary)', boxShadow: 'none' }}>
                    <option value="">Any City</option>
                    {['Hyderabad', 'Bengaluru', 'Chennai', 'Mumbai', 'Delhi', 'Pune', 'Kolkata'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem', textAlign: 'left' }}>Max Budget</div>
                  <select className="form-select" value={searchForm.budget} onChange={e => setSearchForm(p => ({ ...p, budget: e.target.value }))} style={{ border: 'none', background: 'var(--color-surface)', borderRadius: '12px', padding: '0.65rem 0.875rem', color: 'var(--text-primary)', boxShadow: 'none' }}>
                    <option value="">Any Budget</option>
                    <option value="50000">Under ₹50,000</option>
                    <option value="100000">Under ₹1 Lakh</option>
                    <option value="500000">Under ₹5 Lakhs</option>
                    <option value="2000000">Under ₹20 Lakhs (Concerts)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.25rem', whiteSpace: 'nowrap' }}>
                    <Search size={18} /> Search
                  </button>
                  <button type="button" onClick={handleAISearch} className="btn btn-secondary" title="Use AI to plan your event" style={{ padding: '0.75rem 1rem', background: 'rgba(66,133,244,0.12)', borderColor: 'rgba(66,133,244,0.25)', color: '#4285F4' }}>
                    <Sparkles size={18} />
                  </button>
                </div>
              </form>
            </div>

            {/* Trust indicators */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', marginTop: '2.5rem', flexWrap: 'wrap', animation: 'fadeInUp 0.7s ease 0.5s both' }}>
              {[['500+', 'Top Artists'], ['10K+', 'Events Booked'], ['4.9★', 'Audience Rating'], ['15+', 'Tier-1 Cities']].map(([num, label]) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, background: 'linear-gradient(135deg, #4285F4, #BC4639)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{num}</div>
                  <div style={{ fontSize: '0.75rem', color: '#D4A59A', fontWeight: 600 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', opacity: 0.5 }}>
          <div style={{ width: '1px', height: '40px', background: 'linear-gradient(to bottom, transparent, #4285F4)', animation: 'pulse 2s infinite' }} />
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--color-midnight)' }}>
        <div className="container">
          <div className="section-header">
            <div className="section-header__label" style={{ background: 'rgba(66,133,244,0.12)', color: '#4285F4', border: '1px solid rgba(66,133,244,0.25)' }}><Music size={12} /> Explore by Discipline</div>
            <h2 className="section-header__title" style={{ color: 'var(--text-primary)' }}>Find the Right Performer<br />for Every Occasion</h2>
            <p className="section-header__subtitle" style={{ color: 'var(--text-secondary)' }}>From high-energy rock arenas to intimate classical recitals and viral dance acts.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
            {CATEGORIES.map(({ name, icon: Icon, color, artists, desc }) => (
              <Link key={name} to={`/artists?category=${encodeURIComponent(name.replace(/s$/, ''))}`}
                style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '1.5rem', textDecoration: 'none', transition: 'all 0.25s', display: 'block', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 30px rgba(0,0,0,0.1)`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}>
                <div style={{ width: '52px', height: '52px', background: `${color}18`, border: `1px solid ${color}35`, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <Icon size={24} color={color} />
                </div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{desc}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', color, fontWeight: 700 }}>{artists} artists</span>
                  <ChevronRight size={16} color={color} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 1: Famous & Established Headline Artists ── */}
      <section className="section" style={{ background: 'var(--color-deep)' }}>
        <div className="container">
          <div className="section-header" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
            <div>
              <div className="section-header__label" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                👑 Authenticated Headliners
              </div>
              <h2 className="section-header__title" style={{ color: 'var(--text-primary)', margin: '0.5rem 0' }}>
                Famous & Established Artists
              </h2>
              <p className="section-header__subtitle" style={{ color: 'var(--text-secondary)', margin: 0 }}>
                Recognized celebrities, arena bands & iconic performers with verified identity and stadium track records.
              </p>
            </div>
            <Link to="/artists?tier=established" className="btn btn-outline btn-sm" style={{ borderColor: '#f59e0b', color: '#f59e0b' }}>
              View All Established Acts <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {establishedArtists.map((artist) => (
              <ArtistCard
                key={artist.id}
                artist={artist}
                isFavorite={favorites.has(artist.id)}
                onFavoriteToggle={(id) => setFavorites(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 2: Emerging & New Talent Spotlight ─────────── */}
      <section className="section" style={{ background: 'var(--color-midnight)', borderTop: '1px solid var(--color-border)' }}>
        <div className="container">
          <div className="section-header" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
            <div>
              <div className="section-header__label" style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.3)' }}>
                🚀 Rising Talent Showcase
              </div>
              <h2 className="section-header__title" style={{ color: 'var(--text-primary)', margin: '0.5rem 0' }}>
                Emerging & New Talent
              </h2>
              <p className="section-header__subtitle" style={{ color: 'var(--text-secondary)', margin: 0 }}>
                Upcoming singers, independent bands, campus favorites, and fresh voices evaluated on skill, reels, and crowd reviews.
              </p>
            </div>
            <Link to="/artists?tier=emerging" className="btn btn-outline btn-sm" style={{ borderColor: '#06b6d4', color: '#06b6d4' }}>
              Discover Emerging Talent <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {emergingArtists.map((artist) => (
              <ArtistCard
                key={artist.id}
                artist={artist}
                isFavorite={favorites.has(artist.id)}
                onFavoriteToggle={(id) => setFavorites(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })}
              />
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <Link to="/artists" className="btn btn-primary btn-lg">
              Explore All Artists ({establishedArtists.length + emergingArtists.length}+) <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── AI Event Planner Promo ──────────────────────────── */}
      <section className="section" style={{ background: 'var(--color-midnight)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
            <div>
              <div className="section-header__label" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(66,133,244,0.12)', color: '#4285F4', border: '1px solid rgba(66,133,244,0.25)' }}>
                <Sparkles size={12} color="#4285F4" /> AI-Powered Planning
              </div>
              <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, lineHeight: 1.2, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
                Plan Your Entire Event with
                <span style={{ display: 'block', background: 'linear-gradient(135deg, #4285F4, #BC4639)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>One Smart Prompt</span>
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '2rem', fontSize: '1.05rem' }}>
                Describe your dream concert or celebration in natural language. Our AI engine evaluates your vision, curates top headline acts like The Anirudh Band or Poorna Dance Troupe, allocates your budget intelligently, and formats a production schedule.
              </p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                {['Natural language event prompt parsing', 'Celebrity talent matching & rider checklist', 'Budget allocation across headline & supporting acts', 'Technical stage PA & lighting verification', 'Escrow milestone-backed contracts'].map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                    <div style={{ width: '20px', height: '20px', background: 'rgba(66,133,244,0.14)', border: '1px solid rgba(66,133,244,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={11} color="#4285F4" strokeWidth={3} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/ai-planner" className="btn btn-primary btn-lg"><Sparkles size={18} /> Launch AI Event Planner</Link>
            </div>
            <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '24px', padding: '2rem', boxShadow: 'var(--shadow-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #4285F4, #BC4639)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={20} color="white" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>GoArts Event Engine</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Realtime Talent Matching Engine</div>
                </div>
              </div>
              <div style={{ background: 'var(--color-deep)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: 1.6 }}>
                  "We want a high-voltage youth college fest in Hyderabad for 5,000 students. We want an arena live band headliner (Anirudh or DSP style), plus Poorna Dance Troupe for an explosive fusion opening."
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>Optimal acts matched (99% confidence)...</span>
              </div>
              {[
                { cat: 'Rockstar Arena Headliner', artist: 'The Anirudh Band - Live', price: '₹18,00,000', match: '99%' },
                { cat: 'Cinematic Dance Troupe', artist: 'Poorna Dance Troupe - Fusion', price: '₹1,50,000', match: '98%' },
                { cat: 'Soul & Carnatic Live', artist: 'Sid Sriram - Soul Live', price: '₹8,50,000', match: '95%' }
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--color-surface)', borderRadius: '10px', marginBottom: '0.5rem', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#4285F4', fontWeight: 700 }}>{r.cat}</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>{r.artist}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Starting {r.price}</div>
                  </div>
                  <div style={{ background: 'rgba(66,133,244,0.12)', border: '1px solid rgba(66,133,244,0.25)', borderRadius: '8px', padding: '0.25rem 0.6rem', fontSize: '0.75rem', fontWeight: 700, color: '#4285F4' }}>{r.match}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--color-deep)' }}>
        <div className="container">
          <div className="section-header">
            <div className="section-header__label" style={{ background: 'rgba(188,70,57,0.14)', color: '#BC4639', border: '1px solid rgba(188,70,57,0.3)' }}><Star size={12} /> Verified Reviews</div>
            <h2 className="section-header__title" style={{ color: 'var(--text-primary)' }}>Events That Created History</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {TESTIMONIALS.map(({ name, event, rating, text, avatar }) => (
              <div key={name} style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '1.75rem', transition: 'all 0.25s', boxShadow: 'var(--shadow-sm)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(66,133,244,0.4)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = ''; }}>
                <div style={{ display: 'flex', gap: '3px', marginBottom: '1rem' }}>
                  {Array(rating).fill(null).map((_, i) => <Star key={i} size={14} color="#4285F4" fill="#4285F4" />)}
                </div>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.7, fontStyle: 'italic', marginBottom: '1.5rem' }}>"{text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #4285F4, #BC4639)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', color: 'white', flexShrink: 0 }}>{avatar}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{event}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Become an Artist CTA ──────────────────────────────── */}
      <section className="section" style={{ background: 'var(--color-midnight)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(66,133,244,0.12)', border: '1px solid rgba(66,133,244,0.3)', borderRadius: '999px', padding: '0.4rem 1.1rem', marginBottom: '1.5rem' }}>
            <Mic2 size={14} color="#4285F4" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4285F4' }}>For Headline & Emerging Artists</span>
          </div>
          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Share Your Art with<br />
            <span style={{ background: 'linear-gradient(135deg, #4285F4, #BC4639)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Thousands of Event Organizers</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
            Join India's premiere talent platform. Showcase verified video reels, configure multi-tier packages, and secure bookings with escrow transparency.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register?role=artist" className="btn btn-terracotta btn-xl"><Music size={18} /> Join as Talent</Link>
            <Link to="/artists" className="btn btn-secondary btn-xl">Explore the Roster</Link>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', marginTop: '3rem', flexWrap: 'wrap' }}>
            {[['Zero listing fee', 'Free registration and instant portfolio listing'], ['Smart schedule management', 'Calendar sync, technical riders & contracts'], ['15% platform commission', 'Strictly on successful payouts — no hidden charges']].map(([title, desc]) => (
              <div key={title} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '20px', height: '20px', background: 'rgba(66,133,244,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={11} color="#4285F4" strokeWidth={3} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EVENT VENUES ──────────────────────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--color-deep)' }}>
        <div className="container">
          <div className="section-header">
            <div className="section-header__label" style={{ background: 'rgba(188,70,57,0.12)', color: '#BC4639', border: '1px solid rgba(188,70,57,0.25)' }}>
              <MapPin size={12} /> Where We Perform
            </div>
            <h2 className="section-header__title" style={{ color: 'var(--text-primary)' }}>Every Venue. Every Occasion.</h2>
            <p className="section-header__subtitle" style={{ color: 'var(--text-secondary)' }}>From intimate private parties to large-scale government galas — GoArts has you covered.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {EVENT_VENUES.map(({ label, icon: Icon, color }) => (
              <Link key={label} to={`/artists?eventType=${encodeURIComponent(label)}`}
                style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1.25rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.875rem', transition: 'all 0.22s', boxShadow: 'var(--shadow-sm)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = ''; }}>
                <div style={{ width: '44px', height: '44px', background: `${color}18`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={22} color={color} />
                </div>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI FEATURES ──────────────────────────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--color-midnight)' }}>
        <div className="container">
          <div className="section-header">
            <div className="section-header__label" style={{ background: 'rgba(66,133,244,0.12)', color: '#4285F4', border: '1px solid rgba(66,133,244,0.25)' }}>
              <BrainCircuit size={12} /> AI Ecosystem
            </div>
            <h2 className="section-header__title" style={{ color: 'var(--text-primary)' }}>Powered by AI.<br />Built for Entertainment.</h2>
            <p className="section-header__subtitle" style={{ color: 'var(--text-secondary)' }}>GoArts handles every stage — from discovery to booking to post-event analytics.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            {AI_FEATURES.map(({ title, icon: Icon, color, desc }) => (
              <div key={title} style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '1.75rem', boxShadow: 'var(--shadow-sm)', transition: 'all 0.25s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = ''; }}>
                <div style={{ width: '52px', height: '52px', background: `${color}18`, border: `1px solid ${color}30`, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                  <Icon size={26} color={color} />
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <Link to="/ai-planner" className="btn btn-primary btn-lg"><Sparkles size={18} /> Launch AI Event Planner</Link>
          </div>
        </div>
      </section>

      {/* ── PLATFORM WORKFLOW ───────────────────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--color-deep)' }}>
        <div className="container">
          <div className="section-header">
            <div className="section-header__label" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}>
              <Zap size={12} /> Platform Workflow
            </div>
            <h2 className="section-header__title" style={{ color: 'var(--text-primary)' }}>From Idea to Standing Ovation<br />in 10 Simple Steps</h2>
            <p className="section-header__subtitle" style={{ color: 'var(--text-secondary)' }}>GoArts manages every step — discovery, booking, escrow, performance, and reviews.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
            {WORKFLOW_STEPS.map(({ step, title, desc }, idx) => {
              const colors = ['#4285F4','#BC4639','#10b981','#D4A59A','#4285F4','#BC4639','#10b981','#D4A59A','#BC4639','#4285F4'];
              const color = colors[idx % colors.length];
              return (
                <div key={step} style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1.5rem', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: `${color}20`, position: 'absolute', top: '0.75rem', right: '1rem', lineHeight: 1, userSelect: 'none' }}>{step}</div>
                  <div style={{ width: '36px', height: '36px', background: `${color}18`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.875rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color }}>{step}</span>
                  </div>
                  <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>{title}</h4>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TRANSPARENT PRICING ────────────────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--color-midnight)' }}>
        <div className="container">
          <div className="section-header">
            <div className="section-header__label" style={{ background: 'rgba(188,70,57,0.12)', color: '#BC4639', border: '1px solid rgba(188,70,57,0.25)' }}>
              <CreditCard size={12} /> Transparent Pricing
            </div>
            <h2 className="section-header__title" style={{ color: 'var(--text-primary)' }}>Every Budget. Every Category.</h2>
            <p className="section-header__subtitle" style={{ color: 'var(--text-secondary)' }}>Indicative pricing ranges across all entertainment categories.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {PRICING_TABLE.map(({ category, range, icon: Icon, color }) => (
              <div key={category} style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: 'var(--shadow-sm)', transition: 'all 0.22s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = ''; }}>
                <div style={{ width: '48px', height: '48px', background: `${color}18`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={22} color={color} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{category}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color }}>{range}</div>
                </div>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
            Prices are indicative. Final quotes depend on event specifics, travel requirements, and artist tier. 10–20% platform commission on successful bookings.
          </p>
        </div>
      </section>

      {/* ── ARTIST BENEFITS ──────────────────────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--color-deep)' }}>
        <div className="container">
          <div className="section-header">
            <div className="section-header__label" style={{ background: 'rgba(66,133,244,0.12)', color: '#4285F4', border: '1px solid rgba(66,133,244,0.25)' }}>
              <Mic2 size={12} /> For Artists
            </div>
            <h2 className="section-header__title" style={{ color: 'var(--text-primary)' }}>Everything an Artist Needs<br />
              <span style={{ background: 'linear-gradient(135deg, #4285F4, #BC4639)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>to Grow & Earn</span>
            </h2>
            <p className="section-header__subtitle" style={{ color: 'var(--text-secondary)' }}>Digital portfolio, AI promotion, secure payments, and brand collaborations — all in one platform.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
            {ARTIST_BENEFITS.map(({ icon: Icon, label, desc }) => (
              <div key={label} style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1.25rem', display: 'flex', gap: '0.875rem', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ width: '40px', height: '40px', background: 'rgba(66,133,244,0.12)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={20} color="#4285F4" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{label}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            <Link to="/register?role=artist" className="btn btn-terracotta btn-xl"><Music size={18} /> Join as Talent</Link>
          </div>
        </div>
      </section>

      {/* ── EXPANSION ROADMAP ────────────────────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--color-midnight)' }}>
        <div className="container">
          <div className="section-header">
            <div className="section-header__label" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}>
              <Globe size={12} /> Expansion Roadmap
            </div>
            <h2 className="section-header__title" style={{ color: 'var(--text-primary)' }}>Growing from India<br />to the World</h2>
            <p className="section-header__subtitle" style={{ color: 'var(--text-secondary)' }}>Starting with India's top cities and scaling globally — Phase by Phase.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {EXPANSION_PHASES.map(({ phase, cities, color }) => (
              <div key={phase} style={{ background: 'var(--color-card)', border: `1px solid ${color}30`, borderRadius: '20px', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}60` }} />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{phase}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {cities.map(city => (
                    <span key={city} style={{ background: `${color}15`, border: `1px solid ${color}30`, borderRadius: '999px', padding: '0.3rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{city}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GOARTS STUDIO ────────────────────────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--color-deep)' }}>
        <div className="container">
          <div style={{ background: 'linear-gradient(135deg, rgba(66,133,244,0.08), rgba(188,70,57,0.08))', border: '1px solid var(--color-border)', borderRadius: '28px', padding: '3rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center', boxShadow: 'var(--shadow-md)' }}>
            <div>
              <div className="section-header__label" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', background: 'rgba(188,70,57,0.12)', color: '#BC4639', border: '1px solid rgba(188,70,57,0.25)' }}>
                <Video size={12} /> GoArts Studio Division
              </div>
              <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', fontWeight: 800, lineHeight: 1.25, marginBottom: '1rem', color: 'var(--text-primary)' }}>
                Beyond Booking —<br />
                <span style={{ background: 'linear-gradient(135deg, #BC4639, #4285F4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>A Full Creative Studio</span>
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.75rem', fontSize: '0.95rem' }}>
                GoArts Studios is an additional revenue vertical providing end-to-end creative production services for artists and brands.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                {['Music Recording', 'Podcast Production', 'Video Production', 'Artist Branding', 'Digital Marketing', 'Album Launch Management'].map(s => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    <Check size={14} color="#10b981" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { label: 'Basic Plan', price: '₹999/mo', features: 'Artist Profile listing', color: '#4285F4' },
                { label: 'Pro Plan', price: '₹2,999/mo', features: 'Featured Listings + Priority Visibility', color: '#BC4639' },
                { label: 'Elite Plan', price: '₹9,999/mo', features: 'AI Marketing + Lead Generation + Brand Deals', color: '#10b981' },
              ].map(({ label, price, features, color }) => (
                <div key={label} style={{ background: 'var(--color-card)', border: `1px solid ${color}30`, borderRadius: '16px', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{label}</div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{features}</div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color }}>{price}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
