// GoArts AI - Artist Discovery Page
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, X, Star, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { Navbar, Footer, ArtistCard, Spinner, EmptyState, formatINR } from '../components/shared';
import { artistsAPI, miscAPI } from '../lib/api';
import { useAuth } from '../context/useAuth';
import toast from 'react-hot-toast';

const CATEGORIES = ['Singer', 'Band', 'DJ', 'Dancer', 'Comedian', 'Instrumentalist', 'Magician', 'Cultural Troupe'];
const CITIES = ['Hyderabad', 'Bengaluru', 'Chennai', 'Mumbai', 'Delhi', 'Pune', 'Kolkata'];
const EVENT_TYPES = ['Wedding', 'Corporate Event', 'College Festival', 'Concert', 'Birthday Party', 'Brand Launch', 'Cultural Event', 'Hotel Event'];
const SORT_OPTIONS = [{ value: 'rating', label: 'Top Rated' }, { value: 'popularity', label: 'Most Popular' }, { value: 'price_asc', label: 'Price: Low to High' }, { value: 'price_desc', label: 'Price: High to Low' }, { value: 'newest', label: 'Newest First' }];

export default function ArtistsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [tierCounts, setTierCounts] = useState({ all: 0, established: 0, emerging: 0 });
  const [favorites, setFavorites] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    tier: searchParams.get('tier') || 'all',
    category: searchParams.get('category') || '',
    city: searchParams.get('city') || '',
    eventType: searchParams.get('eventType') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    minRating: searchParams.get('minRating') || '',
    verified: searchParams.get('verified') || '',
    sort: searchParams.get('sort') || 'rating',
    page: 1,
  });
  const [customCityMode, setCustomCityMode] = useState(false);
  const [customEventMode, setCustomEventMode] = useState(false);
  const [customCategoryMode, setCustomCategoryMode] = useState(false);

  // Load favorites
  useEffect(() => {
    if (user) {
      miscAPI.getFavorites().then(({ data }) => {
        setFavorites(new Set(data.favorites?.map(f => f.artistId) || []));
      }).catch(() => {});
    }
  }, [user]);

  const fetchArtists = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const { data } = await artistsAPI.list(params);
      setArtists(data.artists || []);
      setPagination(data.pagination || { total: 0, page: 1, pages: 1 });
      if (data.tierCounts) setTierCounts(data.tierCounts);
    } catch {
      toast.error('Failed to load artists.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchArtists(); }, [fetchArtists]);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      if (value && value !== 'all') p.set(key, value);
      else p.delete(key);
      return p;
    });
  };

  const clearFilters = () => {
    setCustomCityMode(false);
    setCustomEventMode(false);
    setCustomCategoryMode(false);
    setFilters({
      search: '',
      tier: 'all',
      category: '',
      city: '',
      eventType: '',
      minPrice: '',
      maxPrice: '',
      minRating: '',
      verified: '',
      sort: 'rating',
      page: 1,
    });
    setSearchParams({});
  };

  const toggleFavorite = async (artistId) => {
    if (!user) { toast.error('Sign in to save favorites.'); return; }
    const isFav = favorites.has(artistId);
    try {
      if (isFav) {
        await miscAPI.removeFavorite(artistId);
        setFavorites(prev => { const n = new Set(prev); n.delete(artistId); return n; });
        toast.success('Removed from favorites.');
      } else {
        await miscAPI.addFavorite(artistId);
        setFavorites(prev => new Set([...prev, artistId]));
        toast.success('Added to favorites!');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update favorites.');
    }
  };

  const hasActiveFilters = filters.search || filters.category || filters.city || filters.eventType || filters.minPrice || filters.maxPrice || filters.minRating || filters.verified;

  return (
    <div>
      <Navbar />
      <div style={{ paddingTop: '80px', minHeight: '100vh', background: 'var(--color-midnight)' }}>
        {/* Header */}
        <div style={{ background: 'var(--gradient-hero)', padding: '2.5rem 0 2rem', borderBottom: '1px solid var(--color-border)' }}>
          <div className="container">
            <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Explore Artists & Live Talent
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '700px' }}>
              Connect with authentic performers across India — from celebrated arena headliners to the next wave of extraordinary indie talent.
            </p>

            {/* SEPARATE CATEGORIES: Famous & Established vs Emerging Talent */}
            <div style={{ marginTop: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
              {[
                { id: 'all', label: 'All Performers', icon: '🌟', count: tierCounts.all || pagination.total },
                { id: 'established', label: 'Famous & Established Artists', icon: '👑', count: tierCounts.established, badge: 'Strict Verification' },
                { id: 'emerging', label: 'Emerging & New Talent', icon: '🚀', count: tierCounts.emerging, badge: 'Rising Talent' },
              ].map((t) => {
                const isActive = (filters.tier || 'all') === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => updateFilter('tier', t.id)}
                    style={{
                      padding: '0.65rem 1.15rem',
                      borderRadius: '14px',
                      border: isActive ? '1px solid var(--palette-blue)' : '1px solid var(--color-border)',
                      background: isActive ? 'linear-gradient(135deg, #4285F4, #BC4639)' : 'var(--color-card)',
                      color: isActive ? '#ffffff' : 'var(--text-primary)',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s ease',
                      boxShadow: isActive ? '0 4px 14px rgba(66,133,244,0.35)' : 'none',
                    }}
                  >
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                    {t.count !== undefined && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.1rem 0.45rem',
                          borderRadius: '10px',
                          background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--color-surface)',
                          color: isActive ? '#ffffff' : 'var(--text-muted)',
                          fontWeight: 800,
                        }}
                      >
                        {t.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search bar */}
            <div style={{ position: 'relative', maxWidth: '640px', marginTop: '1.25rem' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                className="form-input"
                style={{ paddingLeft: '2.75rem', paddingRight: filters.search ? '2.5rem' : '1rem', height: '48px', fontSize: '0.95rem' }}
                type="text"
                placeholder="Search by artist name, category, genre, or city..."
                value={filters.search}
                onChange={e => updateFilter('search', e.target.value)}
              />
              {filters.search && (
                <button
                  onClick={() => updateFilter('search', '')}
                  style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Informative Evaluation Criteria Banner */}
        <div style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: '0.85rem 0' }}>
          <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {filters.tier === 'established' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1rem' }}>👑</span>
                <span>
                  <strong style={{ color: '#f59e0b' }}>Famous & Established Evaluation Metrics:</strong> Verified official presence, arena & headline performance history, verified social channels & discography, and celebrity authenticity audit.
                </span>
              </div>
            ) : filters.tier === 'emerging' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1rem' }}>🚀</span>
                <span>
                  <strong style={{ color: '#06b6d4' }}>Emerging Talent Evaluation Metrics:</strong> Auditioned skill & talent scores, uploaded live performance reels, audience engagement rates, client reviews, and transparent pricing.
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1rem' }}>🛡️</span>
                <span>
                  <strong>Dual Evaluation System:</strong> Established icons undergo strict celebrity anti-impersonation verification, while emerging talent are spotlighted through performance reels and real crowd feedback.
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
            {/* Sidebar Filters */}
            <div style={{ width: '260px', flexShrink: 0 }} className="filter-sidebar">
              <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '1.5rem', position: 'sticky', top: '90px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}><SlidersHorizontal size={16} color="#4285F4" /> Filters</h3>
                  {hasActiveFilters && <button onClick={clearFilters} style={{ fontSize: '0.75rem', color: '#BC4639', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Clear All</button>}
                </div>

                {/* Track / Tier Filter */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Artist Track</label>
                  <select className="form-select" value={filters.tier || 'all'} onChange={e => updateFilter('tier', e.target.value)}>
                    <option value="all">🌟 All Categories</option>
                    <option value="established">👑 Famous & Established ({tierCounts.established || 0})</option>
                    <option value="emerging">🚀 Emerging Talent ({tierCounts.emerging || 0})</option>
                  </select>
                </div>

                {/* Category Filter with Custom Option */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label className="form-label" style={{ margin: 0, color: 'var(--text-secondary)' }}>Category</label>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomCategoryMode(!customCategoryMode);
                        if (customCategoryMode) updateFilter('category', '');
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-primary, #4285F4)',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      {customCategoryMode ? '← Preset List' : '✏️ Type Custom'}
                    </button>
                  </div>

                  {customCategoryMode ? (
                    <div>
                      <input
                        className="form-input"
                        type="text"
                        placeholder="e.g. Flutist, Puppeteer, MC..."
                        value={filters.category}
                        onChange={e => updateFilter('category', e.target.value)}
                        style={{ fontSize: '0.85rem' }}
                        autoFocus
                      />
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                        {['Flutist', 'Puppeteer', 'Anchor / MC', 'Beatboxer', 'Illusionist'].map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => updateFilter('category', c)}
                            style={{
                              background: filters.category === c ? 'var(--palette-blue, #4285F4)' : 'var(--color-surface)',
                              color: filters.category === c ? '#fff' : 'var(--text-secondary)',
                              border: '1px solid var(--color-border)',
                              borderRadius: '999px',
                              padding: '0.15rem 0.45rem',
                              fontSize: '0.65rem',
                              cursor: 'pointer',
                            }}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <select className="form-select" value={filters.category} onChange={e => updateFilter('category', e.target.value)}>
                      <option value="">All Categories</option>
                      {CATEGORIES.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  )}
                </div>

                {/* City Filter with Custom Option */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label className="form-label" style={{ margin: 0, color: 'var(--text-secondary)' }}>City / Location</label>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !customCityMode;
                        setCustomCityMode(next);
                        if (!next && !CITIES.includes(filters.city)) updateFilter('city', '');
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: customCityMode ? '#4285F4' : 'var(--text-muted)',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      {customCityMode ? '← Standard list' : '✏️ Custom place'}
                    </button>
                  </div>
                  {customCityMode ? (
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Type any city (e.g. Vijayawada, Goa)..."
                      value={filters.city}
                      onChange={e => updateFilter('city', e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <select
                      className="form-select"
                      value={filters.city}
                      onChange={e => {
                        if (e.target.value === '__custom__') {
                          setCustomCityMode(true);
                          updateFilter('city', '');
                        } else {
                          updateFilter('city', e.target.value);
                        }
                      }}
                    >
                      <option value="">All Cities</option>
                      {CITIES.map(o => <option key={o} value={o}>{o}</option>)}
                      <option value="__custom__">✨ Custom / Type City...</option>
                    </select>
                  )}
                </div>

                {/* Event Type Filter with Custom Option */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label className="form-label" style={{ margin: 0, color: 'var(--text-secondary)' }}>Event Type</label>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !customEventMode;
                        setCustomEventMode(next);
                        if (!next && !EVENT_TYPES.includes(filters.eventType)) updateFilter('eventType', '');
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: customEventMode ? '#4285F4' : 'var(--text-muted)',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      {customEventMode ? '← Standard list' : '✏️ Custom event'}
                    </button>
                  </div>
                  {customEventMode ? (
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Type event (e.g. Sangeet, Dandiya)..."
                      value={filters.eventType}
                      onChange={e => updateFilter('eventType', e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <select
                      className="form-select"
                      value={filters.eventType}
                      onChange={e => {
                        if (e.target.value === '__custom__') {
                          setCustomEventMode(true);
                          updateFilter('eventType', '');
                        } else {
                          updateFilter('eventType', e.target.value);
                        }
                      }}
                    >
                      <option value="">All Event Types</option>
                      {EVENT_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
                      <option value="__custom__">✨ Custom / Type Event...</option>
                    </select>
                  )}
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ color: 'var(--text-secondary)' }}>Budget Range (₹)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <input className="form-input" type="number" placeholder="Min" value={filters.minPrice} onChange={e => updateFilter('minPrice', e.target.value)} />
                    <input className="form-input" type="number" placeholder="Max" value={filters.maxPrice} onChange={e => updateFilter('maxPrice', e.target.value)} />
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ color: 'var(--text-secondary)' }}>Minimum Rating</label>
                  <select className="form-select" value={filters.minRating} onChange={e => updateFilter('minRating', e.target.value)}>
                    <option value="">Any Rating</option>
                    <option value="4.5">4.5+ ⭐</option>
                    <option value="4.0">4.0+ ⭐</option>
                    <option value="3.5">3.5+ ⭐</option>
                  </select>
                </div>

                <div style={{ marginBottom: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    <input type="checkbox" checked={filters.verified === 'true'} onChange={e => updateFilter('verified', e.target.checked ? 'true' : '')} style={{ accentColor: '#4285F4' }} />
                    Verified Artists Only
                  </label>
                </div>
              </div>
            </div>

            {/* Results */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Sort + Count */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {loading ? 'Loading...' : <span><strong style={{ color: 'var(--text-primary)' }}>{pagination.total}</strong> artists found</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowFilters(!showFilters)} style={{ display: 'none' }}>
                    <Filter size={14} /> Filters
                  </button>
                  <select className="form-select" style={{ width: 'auto', fontSize: '0.85rem', padding: '0.4rem 0.875rem' }} value={filters.sort} onChange={e => updateFilter('sort', e.target.value)}>
                    {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Active filter chips */}
              {hasActiveFilters && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                  {[['search', 'Search: '], ['category', ''], ['city', ''], ['eventType', ''], ['verified', 'Verified']].map(([key, prefix]) =>
                    filters[key] ? (
                      <span key={key} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(66,133,244,0.12)', border: '1px solid rgba(66,133,244,0.25)', borderRadius: '999px', padding: '0.2rem 0.6rem 0.2rem 0.75rem', fontSize: '0.75rem', color: '#4285F4', fontWeight: 600 }}>
                        {prefix}{filters[key] === 'true' ? prefix : filters[key]}
                        <button onClick={() => updateFilter(key, '')} style={{ background: 'transparent', border: 'none', color: '#4285F4', cursor: 'pointer', padding: 0, lineHeight: 1 }}><X size={12} /></button>
                      </span>
                    ) : null
                  )}
                </div>
              )}

              {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  {[...Array(9)].map((_, i) => (
                    <div key={i} style={{ borderRadius: '20px', overflow: 'hidden' }}>
                      <div className="skeleton" style={{ height: '220px' }} />
                      <div style={{ padding: '1.25rem', background: 'var(--color-card)' }}>
                        <div className="skeleton" style={{ height: '12px', width: '60%', marginBottom: '0.75rem' }} />
                        <div className="skeleton" style={{ height: '18px', width: '80%', marginBottom: '0.5rem' }} />
                        <div className="skeleton" style={{ height: '14px', width: '40%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : artists.length === 0 ? (
                <EmptyState icon={Search} title="No artists found" description="Try adjusting your filters or search terms to find more performers."
                  action={<button className="btn btn-secondary" onClick={clearFilters}><X size={14} /> Clear all filters</button>} />
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                    {artists.map(artist => (
                      <ArtistCard key={artist.id} artist={artist} isFavorite={favorites.has(artist.id)} onFavoriteToggle={toggleFavorite} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginTop: '3rem' }}>
                      <button className="btn btn-secondary btn-sm" disabled={filters.page <= 1} onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}>
                        <ChevronLeft size={16} /> Previous
                      </button>
                      <span style={{ fontSize: '0.875rem', color: 'rgba(248,248,255,0.6)' }}>Page {pagination.page} of {pagination.pages}</span>
                      <button className="btn btn-secondary btn-sm" disabled={filters.page >= pagination.pages} onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}>
                        Next <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <style>{`
        @media (max-width: 768px) {
          .filter-sidebar { display: none; }
        }
      `}</style>
    </div>
  );
}
