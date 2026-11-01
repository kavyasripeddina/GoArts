// GoArts AI - Artist Profile Page
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, Star, Check, Heart, Calendar, Users, Clock, Music, Share2, ChevronLeft, Mic2, Tag, DollarSign, ArrowRight, ShieldCheck, Award, Globe, Video, CheckCircle2, Shield } from 'lucide-react';
import { Navbar, Footer, Spinner, EmptyState, StarRating, StatusBadge, formatINR, formatDate } from '../components/shared';
import { artistsAPI, miscAPI, aiAPI } from '../lib/api';
import { useAuth } from '../context/useAuth';
import toast from 'react-hot-toast';
import BookingModal from './BookingModal';

export default function ArtistProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [artist, setArtist] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [talentScore, setTalentScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [artistRes, reviewsRes, scoreRes] = await Promise.allSettled([
          artistsAPI.getById(id),
          artistsAPI.getReviews(id),
          aiAPI.talentScore(id),
        ]);
        if (artistRes.status === 'fulfilled') setArtist(artistRes.value.data.artist);
        else { toast.error('Artist not found.'); navigate('/artists'); return; }
        if (reviewsRes.status === 'fulfilled') setReviews(reviewsRes.value.data.reviews || []);
        if (scoreRes.status === 'fulfilled') setTalentScore(scoreRes.value.data);
      } catch {
        navigate('/artists');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (user) {
      miscAPI.getFavorites().then(({ data }) => {
        setIsFavorite(data.favorites?.some(f => f.artistId === id));
      }).catch(() => {});
    }
  }, [user, id]);

  const toggleFavorite = async () => {
    if (!user) { toast.error('Sign in to save favorites.'); return; }
    try {
      if (isFavorite) {
        await miscAPI.removeFavorite(id);
        setIsFavorite(false);
        toast.success('Removed from favorites.');
      } else {
        await miscAPI.addFavorite(id);
        setIsFavorite(true);
        toast.success('Added to favorites!');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update favorites.');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to submit a review.');
      navigate('/login');
      return;
    }
    if (!newRating) {
      toast.error('Please select a star rating.');
      return;
    }
    setSubmittingReview(true);
    try {
      const { data } = await artistsAPI.addReview(id, {
        rating: newRating,
        comment: newComment || 'Great performance!',
      });
      setReviews(prev => [data.review, ...prev]);
      if (data.artistRating) {
        setArtist(prev => ({
          ...prev,
          rating: data.artistRating,
          reviewCount: data.reviewCount || prev.reviewCount + 1,
        }));
      }
      setNewComment('');
      setShowReviewForm(false);
      toast.success('Your review has been published! Thank you.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--color-midnight)' }}><Spinner size={50} /></div>;
  if (!artist) return null;

  const tabs = ['about', 'packages', 'reviews'];
  const scoreColor = talentScore?.talentScore >= 80 ? '#10b981' : talentScore?.talentScore >= 65 ? '#4285F4' : '#BC4639';

  return (
    <div style={{ background: 'var(--color-midnight)', minHeight: '100vh', color: 'var(--text-primary)' }}>
      <Navbar />

      {/* Hero Image */}
      <div style={{ paddingTop: '64px' }}>
        <div style={{ position: 'relative', height: '400px', overflow: 'hidden' }}>
          <img src={artist.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.displayName)}&background=4285F4&color=fff&size=800`} alt={artist.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.displayName)}&background=4285F4&color=fff&size=800`; }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--color-midnight) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)' }} />
          <div style={{ position: 'absolute', top: '1rem', left: '1rem' }}>
            <button onClick={() => navigate('/artists')} className="btn btn-secondary btn-sm glass"><ChevronLeft size={16} /> Back</button>
          </div>
          <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
            <button onClick={toggleFavorite} className="btn glass btn-sm" style={{ color: isFavorite ? '#BC4639' : 'inherit', borderColor: isFavorite ? '#BC4639' : undefined }}>
              <Heart size={16} fill={isFavorite ? '#BC4639' : 'none'} /> {isFavorite ? 'Saved' : 'Save'}
            </button>
            <button className="btn glass btn-sm"><Share2 size={16} /> Share</button>
          </div>
        </div>

        <div className="container" style={{ marginTop: '-100px', position: 'relative', zIndex: 1, paddingBottom: '4rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
            {/* Main Content */}
            <div>
              {/* Artist Header */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  <span className="badge badge-brand">{artist.category}</span>
                  
                  {artist.artistTier === 'established' ? (
                    <span style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', padding: '0.3rem 0.75rem', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800, fontSize: '0.75rem', boxShadow: '0 2px 8px rgba(245,158,11,0.3)' }}>
                      <Award size={14} /> 👑 Famous & Established Icon
                    </span>
                  ) : (
                    <span style={{ background: 'linear-gradient(135deg, #06b6d4, #0284c7)', color: 'white', padding: '0.3rem 0.75rem', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800, fontSize: '0.75rem', boxShadow: '0 2px 8px rgba(6,182,212,0.3)' }}>
                      🚀 Emerging & New Talent
                    </span>
                  )}

                  {artist.verificationStatus === 'celebrity_verified' ? (
                    <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.35)', padding: '0.3rem 0.75rem', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, fontSize: '0.75rem' }}>
                      <CheckCircle2 size={14} color="#3b82f6" /> Authenticated Celebrity (Official Check)
                    </span>
                  ) : (artist.aadhaarVerified || artist.verified) ? (
                    <span style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.3rem 0.75rem', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, fontSize: '0.75rem' }}>
                      <ShieldCheck size={14} /> Govt ID & Aadhaar Verified Performer
                    </span>
                  ) : null}

                  {artist.featured && <span className="badge badge-coral">Featured</span>}
                </div>
                <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>{artist.displayName}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><MapPin size={14} /> {artist.city}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#4285F4' }}>
                    {artist.reviewCount > 0 ? (
                      <>
                        <Star size={14} fill="#4285F4" /> {artist.rating} <span style={{ color: 'var(--text-muted)' }}>({artist.reviewCount} reviews)</span>
                      </>
                    ) : (
                      <span style={{ color: '#4285F4', fontWeight: 600 }}>★ New Artist (No reviews yet)</span>
                    )}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Music size={14} /> {artist.experience}+ years exp.</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Users size={14} /> {artist.completedBookings} events completed</span>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: '0', background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '4px', marginBottom: '2rem', width: 'fit-content', boxShadow: 'var(--shadow-sm)' }}>
                {tabs.map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '0.5rem 1.25rem', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, textTransform: 'capitalize', transition: 'all 0.2s', background: activeTab === tab ? 'linear-gradient(135deg, #4285F4, #BC4639)' : 'transparent', color: activeTab === tab ? 'white' : 'var(--text-secondary)' }}>
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === 'about' && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                  <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1.05rem', color: 'var(--text-primary)' }}>About</h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '2rem', fontSize: '0.95rem' }}>{artist.bio || 'No bio available.'}</p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div>
                      <h4 style={{ fontWeight: 700, fontSize: '0.875rem', color: '#fbbf24', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Genres</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {artist.genres?.map(g => <span key={g} className="tag">{g}</span>) || '—'}
                      </div>
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 700, fontSize: '0.875rem', color: '#fbbf24', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Languages</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {artist.languages?.map(l => <span key={l} className="tag">{l}</span>) || '—'}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '2rem' }}>
                    <h4 style={{ fontWeight: 700, fontSize: '0.875rem', color: '#fbbf24', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Suitable Event Types</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {artist.eventTypes?.map(e => <span key={e} className="badge badge-muted">{e}</span>) || '—'}
                    </div>
                  </div>

                  {artist.technicalRequirements && (
                    <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                      <h4 style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Technical Requirements</h4>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{artist.technicalRequirements}</p>
                    </div>
                  )}

                  {/* ── ARTIST VERIFICATION & EVALUATION METRICS ── */}
                  <div style={{ background: 'var(--color-card)', border: artist.artistTier === 'established' ? '1px solid rgba(245,158,11,0.35)' : '1px solid rgba(6,182,212,0.35)', borderRadius: '20px', padding: '1.5rem', marginTop: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {artist.artistTier === 'established' ? (
                          <>
                            <span style={{ fontSize: '1.25rem' }}>👑</span>
                            <div>
                              <h4 style={{ fontWeight: 800, color: '#f59e0b', margin: 0, fontSize: '0.95rem' }}>
                                Established Artist Authentication
                              </h4>
                              <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                Evaluated via authentic identity, official presence, performance scale & industry recognition
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <span style={{ fontSize: '1.25rem' }}>🚀</span>
                            <div>
                              <h4 style={{ fontWeight: 800, color: '#06b6d4', margin: 0, fontSize: '0.95rem' }}>
                                Emerging Talent Evaluation System
                              </h4>
                              <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                Evaluated via live performance reels, talent scores, crowd engagement & client reviews
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '8px', background: artist.artistTier === 'established' ? 'rgba(245,158,11,0.15)' : 'rgba(6,182,212,0.15)', color: artist.artistTier === 'established' ? '#f59e0b' : '#06b6d4' }}>
                        {artist.artistTier === 'established' ? 'Icon Verification Tier' : 'Talent Evaluation Tier'}
                      </span>
                    </div>

                    {artist.artistTier === 'established' ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
                        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '0.85rem' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                            Identity & Authenticity
                          </div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <ShieldCheck size={14} /> 100% Verified Identity
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                            Protected against impersonation & verified official management
                          </div>
                        </div>

                        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '0.85rem' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                            Performance Scale
                          </div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Award size={14} color="#f59e0b" /> Arena & Festival Headliner
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                            {artist.evaluationMetrics?.performanceScale || '1,000 - 50,000 capacity venue touring'}
                          </div>
                        </div>

                        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '0.85rem' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                            Official Presence
                          </div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--palette-blue)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Globe size={14} /> Verified Streaming & Media
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                            {artist.socialLinks?.instagram || 'Official Social'} • {artist.evaluationMetrics?.officialPresence?.streamsCount || '50M+ plays'}
                          </div>
                        </div>

                        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '0.85rem' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                            Industry Recognition
                          </div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {artist.evaluationMetrics?.recognition || 'Award Winner & Film Playback Performer'}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                            Popularity Index: {artist.evaluationMetrics?.popularityIndex || 98}/100
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
                        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '0.85rem' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                            Auditioned Talent Score
                          </div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#06b6d4' }}>
                            {artist.evaluationMetrics?.talentScore || 88}%
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                            Evaluated via vocal/instrumental skill & stage presence
                          </div>
                        </div>

                        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '0.85rem' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                            Audience Engagement
                          </div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#10b981' }}>
                            {artist.evaluationMetrics?.audienceEngagement || 93}%
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                            Crowd responsiveness, energy & prompt communication
                          </div>
                        </div>

                        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '0.85rem' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                            Performance Portfolio
                          </div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Video size={14} color="#06b6d4" /> Verified Video Reels
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                            {artist.evaluationMetrics?.portfolioReels?.length || 2} Live Stage Reels Available
                          </div>
                        </div>

                        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '0.85rem' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                            Community Feedback
                          </div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {artist.reviewCount > 0 ? `${artist.rating} ⭐ (${artist.reviewCount} Reviews)` : '★ Ready for First Booking'}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                            {artist.completedBookings || 0} Verified Completed Gigs
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Talent Score */}
                  {talentScore && (
                    <div style={{ background: 'var(--color-card)', border: `1px solid ${scoreColor}30`, borderRadius: '20px', padding: '1.5rem', marginTop: '2rem', boxShadow: 'var(--shadow-sm)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                        <h4 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Talent Score</h4>
                        {talentScore.talentScore ? (
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: scoreColor }}>{talentScore.talentScore}</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: scoreColor }}>{talentScore.label}</div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Insufficient data</span>
                        )}
                      </div>
                      {talentScore.factors?.map(f => (
                        <div key={f.name} style={{ marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{f.name}</span>
                            <span style={{ color: f.score !== null ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: 700 }}>{f.score !== null ? `${f.score}/${f.max}` : '—'}</span>
                          </div>
                          <div style={{ height: '4px', background: 'var(--color-border)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: f.score !== null ? `${(f.score / f.max) * 100}%` : '0%', background: scoreColor, borderRadius: '2px', transition: 'width 1s ease' }} />
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{f.note}</div>
                        </div>
                      ))}
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.75rem', fontStyle: 'italic' }}>{talentScore.disclaimer}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'packages' && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                  <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1.05rem', color: 'var(--text-primary)' }}>Performance Packages</h3>
                  {artist.packages?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {artist.packages.map((pkg, i) => (
                        <div key={i} style={{ background: 'var(--color-card)', border: i === 1 ? '1px solid #BC4639' : '1px solid var(--color-border)', borderRadius: '16px', padding: '1.5rem', position: 'relative', boxShadow: 'var(--shadow-sm)' }}>
                          {i === 1 && <div style={{ position: 'absolute', top: '-10px', left: '1.5rem', background: 'linear-gradient(135deg, #4285F4, #BC4639)', borderRadius: '999px', padding: '0.2rem 0.75rem', fontSize: '0.7rem', fontWeight: 700, color: 'white' }}>MOST POPULAR</div>}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                              <h4 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{pkg.name}</h4>
                              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{pkg.description}</p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                <Clock size={12} /> {pkg.duration}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#BC4639' }}>{formatINR(pkg.price)}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>per event</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState icon={DollarSign} title="No packages listed" description="Contact the artist directly for custom pricing." />
                  )}
                  <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>* All prices are starting rates. Final quote provided after reviewing your event requirements.</p>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <h3 style={{ fontWeight: 700, margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Customer Reviews ({reviews.length})</h3>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => setShowReviewForm(!showReviewForm)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'linear-gradient(135deg, #f59e0b, #BC4639)', borderColor: '#f59e0b', color: '#fff', fontWeight: 700 }}
                    >
                      <Star size={14} fill="#fff" /> {showReviewForm ? 'Cancel Review' : 'Write a Review'}
                    </button>
                  </div>

                  {/* Inline Review Form */}
                  {showReviewForm && (
                    <div style={{ background: 'var(--color-card)', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '18px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: 'var(--shadow-md)', animation: 'slideDown 0.2s ease' }}>
                      <h4 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Rate your experience with {artist.displayName}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Your authentic review and rating help this artist rank higher on the public leaderboard.</p>

                      <form onSubmit={handleReviewSubmit}>
                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Select Rating (1 to 5 Stars)</label>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {[1, 2, 3, 4, 5].map((s) => (
                              <button 
                                key={s} 
                                type="button" 
                                onClick={() => setNewRating(s)}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.2rem', transition: 'transform 0.15s' }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                              >
                                <Star size={28} color={s <= newRating ? '#f59e0b' : 'var(--color-border)'} fill={s <= newRating ? '#f59e0b' : 'none'} />
                              </button>
                            ))}
                            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f59e0b', marginLeft: '0.5rem' }}>{newRating} / 5 Stars</span>
                          </div>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Review Feedback</label>
                          <textarea 
                            className="form-textarea" 
                            rows={3} 
                            placeholder="Share highlights of the vocal performance, crowd energy, stage setup, punctuality..." 
                            value={newComment} 
                            onChange={(e) => setNewComment(e.target.value)} 
                            required 
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                          <button type="submit" className="btn btn-primary btn-sm" disabled={submittingReview}>
                            {submittingReview ? 'Submitting Review...' : 'Publish Public Review'}
                          </button>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowReviewForm(false)}>
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {reviews.length === 0 ? (
                    <EmptyState 
                      icon={Star} 
                      title="No reviews yet" 
                      description="Be the first to leave an authentic review for this artist!" 
                      action={
                        <button className="btn btn-primary btn-sm" onClick={() => setShowReviewForm(true)}>
                          <Star size={14} fill="#fff" /> Be the First to Review
                        </button>
                      }
                    />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {reviews.map(r => (
                        <div key={r.id} style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                {r.customerName}
                                {r.customerAadhaarVerified && (
                                  <span style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.7rem', fontWeight: 700 }} title="Verified Customer">
                                    <ShieldCheck size={14} /> Verified Customer
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDate(r.createdAt)}</div>
                            </div>
                            <StarRating rating={r.rating} size={15} />
                          </div>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{r.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Booking Sidebar */}
            <div style={{ position: 'sticky', top: '90px' }}>
              <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '24px', padding: '1.75rem', boxShadow: 'var(--shadow-lg)' }}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Starting from</div>
                  <div style={{ fontSize: '2.25rem', fontWeight: 900, background: 'linear-gradient(135deg, #4285F4, #BC4639)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{formatINR(artist.startingPrice)}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>per event · prices are estimates</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
                  {[
                    [MapPin, 'Location', artist.city],
                    [Users, 'Audience Size', artist.audienceSize || 'Flexible'],
                    [Music, 'Category', artist.category],
                    [Star, 'Rating', artist.reviewCount > 0 ? `${artist.rating}/5 (${artist.reviewCount} reviews)` : 'No reviews yet (New)'],
                    [Check, 'Response Rate', `${artist.responseRate}%`],
                  ].map(([Icon, label, value]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}><Icon size={13} /> {label}</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
                    </div>
                  ))}
                </div>

                {user ? (
                  <>
                    <button className="btn btn-primary btn-full btn-lg" onClick={() => setShowBookingModal(true)}>
                      <Calendar size={16} /> Request Booking
                    </button>
                    {(user.id === artist.userId || user.email === artist.email) && (
                      <div style={{ marginTop: '0.6rem', textAlign: 'center' }}>
                        <Link to="/artist/dashboard" style={{ fontSize: '0.82rem', color: '#4285F4', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          ⚡ Manage in Artist Dashboard &rarr;
                        </Link>
                      </div>
                    )}
                  </>
                ) : (
                  <Link to="/login" className="btn btn-primary btn-full btn-lg">
                    Sign In to Book <ArrowRight size={16} />
                  </Link>
                )}

                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>No payment required to submit a request.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal
          artist={artist}
          onClose={() => setShowBookingModal(false)}
          onSuccess={() => {
            setShowBookingModal(false);
            const targetDashboard = user?.role === 'artist' ? '/artist/dashboard?tab=bookings' : user?.role === 'admin' ? '/admin' : '/dashboard?tab=bookings';
            navigate(targetDashboard);
          }}
        />
      )}

      <Footer />
      <style>{`
        @media (max-width: 1024px) {
          .profile-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
