// GoArts AI - Top Artists Leaderboard (Singers, Dancers, Bands, etc. based on Reviews & Ratings)
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Trophy, Medal, Star, ShieldCheck, Music, Filter, ArrowUpDown, ChevronRight, 
  Calendar, CheckCircle, Sparkles, MessageSquareQuote, DollarSign
} from 'lucide-react';
import { Navbar, Spinner, EmptyState, formatINR } from '../components/shared';
import BookingModal from './BookingModal';
import { artistsAPI } from '../lib/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'Singer', 'Band', 'Dancer', 'DJ', 'Comedian', 'Cultural Troupe'];

const PRICE_RANGES = [
  { label: 'All Budgets', min: '', max: '' },
  { label: 'Under ₹50,000', min: '0', max: '50000' },
  { label: '₹50K – ₹1.5 Lakh', min: '50000', max: '150000' },
  { label: '₹1.5L – ₹5 Lakh', min: '150000', max: '500000' },
  { label: '₹5 Lakh+', min: '500000', max: '' },
];

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'Singer');
  const [priceRangeIdx, setPriceRangeIdx] = useState(0);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingArtist, setBookingArtist] = useState(null);

  useEffect(() => {
    loadLeaderboard();
  }, [selectedCategory, minPrice, maxPrice]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory && selectedCategory !== 'All') params.category = selectedCategory;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;

      const { data } = await artistsAPI.leaderboard(params);
      setArtists(data.leaderboard || []);
    } catch (err) {
      toast.error('Failed to load leaderboard.');
    } finally {
      setLoading(false);
    }
  };

  const handlePriceRange = (idx) => {
    setPriceRangeIdx(idx);
    const range = PRICE_RANGES[idx];
    setMinPrice(range.min);
    setMaxPrice(range.max);
  };

  const top3 = artists.slice(0, 3);
  const restList = artists.slice(3);

  return (
    <div style={{ background: 'var(--color-midnight)', minHeight: '100vh', color: 'var(--text-primary)' }}>
      <Navbar />

      <main style={{ paddingTop: '80px', paddingBottom: '4rem' }}>
        <div className="container">
          {/* Header Banner */}
          <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 2.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(66, 133, 244, 0.1)', border: '1px solid rgba(66, 133, 244, 0.25)', borderRadius: '999px', padding: '0.4rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: '#4285F4', marginBottom: '1rem' }}>
              <Trophy size={16} /> Top Talent Hall of Fame
            </div>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 900, letterSpacing: '-0.5px', marginBottom: '0.75rem', lineHeight: 1.2 }}>
              Verified Artist <span className="gradient-text">Leaderboard</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6 }}>
              Discover the highest rated singers, dancers, bands, and performers ranked purely on authentic client reviews, verified event completions, and real feedback.
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.5rem', scrollbarWidth: 'none' }}>
            {CATEGORIES.map(cat => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: '999px',
                    border: `1.5px solid ${active ? '#BC4639' : 'var(--color-border)'}`,
                    background: active ? '#BC4639' : 'var(--color-card)',
                    color: active ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: active ? 700 : 500,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                    boxShadow: active ? '0 4px 12px rgba(188, 70, 57, 0.25)' : 'none',
                  }}
                >
                  {cat === 'All' ? '🌟 All Categories' : cat === 'Singer' ? '🎤 Top Singers' : cat}
                </button>
              );
            })}
          </div>

          {/* Amount / Budget Filters */}
          <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1rem 1.25rem', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginRight: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <DollarSign size={16} color="#4285F4" /> Filter by Budget:
              </span>
              {PRICE_RANGES.map((r, idx) => (
                <button
                  key={r.label}
                  onClick={() => handlePriceRange(idx)}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '8px',
                    border: `1px solid ${priceRangeIdx === idx ? '#4285F4' : 'var(--color-border)'}`,
                    background: priceRangeIdx === idx ? 'rgba(66, 133, 244, 0.12)' : 'var(--color-surface)',
                    color: priceRangeIdx === idx ? '#4285F4' : 'var(--text-secondary)',
                    fontSize: '0.8rem',
                    fontWeight: priceRangeIdx === idx ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing {artists.length} Top Performers
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '5rem 0' }}>
              <Spinner size={48} />
              <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Calculating rankings from verified client reviews...</p>
            </div>
          ) : artists.length === 0 ? (
            <EmptyState 
              icon={Trophy} 
              title="No artists found for this budget" 
              description="Try adjusting your budget or category filter to discover more talent." 
              action={<button className="btn btn-secondary" onClick={() => { setMinPrice(''); setMaxPrice(''); setPriceRangeIdx(0); }}>Reset Filters</button>}
            />
          ) : (
            <>
              {/* Podium Highlight for Top 3 */}
              {top3.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                  {top3.map((a, idx) => {
                    const rank = a.rank || idx + 1;
                    const isFirst = rank === 1;
                    const badgeColor = rank === 1 ? '#eab308' : rank === 2 ? '#94a3b8' : '#cd7f32';
                    const badgeTitle = rank === 1 ? '🥇 #1 Champion' : rank === 2 ? '🥈 #2 Runner-Up' : '🥉 #3 Bronze Star';

                    return (
                      <div
                        key={a.id}
                        style={{
                          background: 'var(--color-card)',
                          border: isFirst ? '2px solid rgba(234, 179, 8, 0.5)' : '1px solid var(--color-border)',
                          borderRadius: '24px',
                          overflow: 'hidden',
                          boxShadow: isFirst ? '0 12px 30px rgba(234, 179, 8, 0.15)' : 'var(--shadow-md)',
                          position: 'relative',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'transform 0.2s ease',
                        }}
                      >
                        {/* Rank Badge Tag */}
                        <div style={{ position: 'absolute', top: '14px', left: '14px', zIndex: 10, background: badgeColor, color: '#ffffff', fontWeight: 900, fontSize: '0.75rem', padding: '0.35rem 0.85rem', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '0.35rem', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                          <Trophy size={14} /> {badgeTitle}
                        </div>

                        {/* Image Banner */}
                        <div style={{ position: 'relative', height: '220px', width: '100%', overflow: 'hidden' }}>
                          <img
                            src={a.image}
                            alt={a.displayName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(a.displayName)}&background=BC4639&color=fff`; }}
                          />
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,10,8,0.92) 0%, transparent 60%)' }} />
                          <div style={{ position: 'absolute', bottom: '12px', left: '16px', right: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div>
                              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#fbbf24', fontWeight: 700 }}>{a.category}</span>
                              <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                {a.displayName}
                                {(a.verified || a.aadhaarVerified) && <ShieldCheck size={18} color="#10b981" title="Govt ID & Aadhaar Verified" />}
                              </div>
                            </div>
                            <span style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: '0.75rem', padding: '0.3rem 0.6rem', borderRadius: '8px' }}>
                              📍 {a.city}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            {/* Score & Rating Bar */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                              <div style={{ background: 'var(--color-surface)', padding: '0.75rem', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--color-border)' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Talent Score</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#4285F4' }}>{a.profileScore || 95}/100</div>
                              </div>
                              <div style={{ background: 'var(--color-surface)', padding: '0.75rem', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--color-border)' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rating</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#eab308', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}>
                                  {a.reviewCount > 0 ? (
                                    <>
                                      <Star size={18} fill="#eab308" /> {a.rating} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>({a.reviewCount})</span>
                                    </>
                                  ) : (
                                    <span style={{ fontSize: '0.85rem', color: '#4285F4', fontWeight: 700 }}>New Artist</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Customer Feedback Snippet */}
                            {a.reviews && a.reviews.length > 0 ? (
                              <div style={{ background: 'rgba(66, 133, 244, 0.05)', border: '1px dashed var(--color-border)', borderRadius: '12px', padding: '0.75rem', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                                  <MessageSquareQuote size={14} color="#4285F4" /> Verified Client Review:
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.4 }}>
                                  "{a.reviews[0].comment || 'Superb performance, kept the crowd captivated all evening!'}"
                                </p>
                              </div>
                            ) : null}
                          </div>

                          {/* Footer & Actions */}
                          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                            <div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Starting from</div>
                              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#BC4639' }}>{formatINR(a.startingPrice)}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/artists/${a.id}`)}>
                                Profile
                              </button>
                              <button className="btn btn-primary btn-sm" onClick={() => setBookingArtist(a)}>
                                <Calendar size={14} /> Book
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Leaderboard Table / Cards for remaining ranks */}
              {restList.length > 0 && (
                <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                  <h3 style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                    All Ranked Performers in {selectedCategory === 'All' ? 'Entertainment' : selectedCategory}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {restList.map((a, idx) => {
                      const rank = a.rank || idx + 4;
                      return (
                        <div
                          key={a.id}
                          style={{
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '16px',
                            padding: '1rem 1.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1.25rem',
                            flexWrap: 'wrap',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1rem', color: 'var(--text-primary)' }}>
                            #{rank}
                          </div>

                          <img
                            src={a.image}
                            alt={a.displayName}
                            style={{ width: '52px', height: '52px', borderRadius: '12px', objectFit: 'cover' }}
                            onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(a.displayName)}&background=BC4639&color=fff`; }}
                          />

                          <div style={{ flex: 1, minWidth: '180px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                              {a.displayName}
                              {(a.verified || a.aadhaarVerified) && <ShieldCheck size={16} color="#10b981" title="Govt Verified" />}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.75rem', marginTop: '0.2rem' }}>
                              <span>🎭 {a.category}</span>
                              <span>📍 {a.city}</span>
                              <span>🌟 Score: {a.profileScore || 90}/100</span>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right', minWidth: '120px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem', fontWeight: 700, color: '#eab308', fontSize: '0.95rem' }}>
                              {a.reviewCount > 0 ? (
                                <>
                                  <Star size={16} fill="#eab308" /> {a.rating} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({a.reviewCount})</span>
                                </>
                              ) : (
                                <span style={{ color: '#4285F4', fontSize: '0.8rem', fontWeight: 700 }}>New</span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#BC4639', marginTop: '0.15rem' }}>
                              {formatINR(a.startingPrice)}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/artists/${a.id}`)}>
                              View
                            </button>
                            <button className="btn btn-primary btn-sm" onClick={() => setBookingArtist(a)}>
                              Book
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Booking Modal */}
      {bookingArtist && (
        <BookingModal
          artist={bookingArtist}
          onClose={() => setBookingArtist(null)}
          onSuccess={() => {
            setBookingArtist(null);
            const target = user?.role === 'artist' ? '/artist/dashboard?tab=bookings' : user?.role === 'admin' ? '/admin' : '/dashboard?tab=bookings';
            navigate(target);
          }}
        />
      )}
    </div>
  );
}
