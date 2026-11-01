// GoArts AI - Customer Dashboard with Split Payments, Mutual Chat & Verified KYC
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Calendar, Heart, Bell, Star, User, Settings, LogOut, Clock, CheckCircle, 
  XCircle, ChevronRight, Music, AlertCircle, ShieldCheck, MessageSquare, 
  CreditCard, Sparkles, X, PlusCircle, Check, BarChart2, Camera, Upload
} from 'lucide-react';
import { Navbar, Spinner, StatusBadge, EmptyState, StarRating, formatINR, formatDate } from '../components/shared';
import { bookingsAPI, miscAPI, authAPI } from '../lib/api';
import { useAuth } from '../context/useAuth';
import { 
  CancelModal, MilestonePaymentModal, ChatModal, AadhaarVerificationModal 
} from '../components/BookingActionsModal';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart2 },
  { id: 'bookings', label: 'My Bookings', icon: Calendar },
  { id: 'favorites', label: 'Saved Artists', icon: Heart },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'profile', label: 'My Profile & KYC', icon: User },
];

export default function CustomerDashboard() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [bookings, setBookings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [reviewModal, setReviewModal] = useState(null);
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [paymentModalData, setPaymentModalData] = useState(null); // { booking, milestone }
  const [chatModalBooking, setChatModalBooking] = useState(null);
  const [showKycModal, setShowKycModal] = useState(false);

  useEffect(() => {
    setActiveTab(searchParams.get('tab') || 'overview');
  }, [searchParams]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [bRes, fRes, nRes] = await Promise.allSettled([
        bookingsAPI.myBookings({ role: 'customer', limit: 50 }),
        miscAPI.getFavorites(),
        miscAPI.getNotifications(),
      ]);
      if (bRes.status === 'fulfilled') setBookings(bRes.value.data.bookings || []);
      if (fRes.status === 'fulfilled') setFavorites(fRes.value.data.favorites || []);
      if (nRes.status === 'fulfilled') setNotifications(nRes.value.data.notifications || []);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const removeFavorite = async (artistId) => {
    try {
      await miscAPI.removeFavorite(artistId);
      setFavorites(prev => prev.filter(f => f.artistId !== artistId));
      toast.success('Removed from favorites.');
    } catch {
      toast.error('Failed to remove favorite.');
    }
  };

  const markNotificationsRead = async () => {
    try {
      await miscAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
  };

  const handleAcceptDirectChat = async (booking) => {
    try {
      const { data } = await bookingsAPI.requestChat(booking.id);
      const isEnabled = Boolean(data.chatEnabled);
      const updated = data.booking || { 
        ...booking, 
        chatEnabled: isEnabled, 
        chatRequestedBy: isEnabled ? 'both' : 'customer' 
      };
      setBookings(prev => prev.map(b => b.id === booking.id ? updated : b));
      setChatModalBooking(updated);
      toast.success(data.message || `Direct chat unlocked with ${booking.artist?.displayName || 'artist'}!`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to accept chat request.');
    }
  };

  const upcomingBookings = bookings.filter(b => ['requested', 'quoted', 'confirmed'].includes(b.status));
  const completedBookings = bookings.filter(b => b.status === 'completed');
  const incomingChatRequests = bookings.filter(b => b.chatRequestedBy === 'artist' && !b.chatEnabled);
  const unreadNotifs = notifications.filter(n => !n.isRead).length;

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--color-midnight)' }}><Spinner size={50} /></div>;

  return (
    <div style={{ background: 'var(--color-midnight)', minHeight: '100vh', color: 'var(--text-primary)' }}>
      <Navbar />
      <div style={{ paddingTop: '64px', display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
        {/* Sidebar */}
        <aside style={{ width: '270px', background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)', position: 'fixed', top: '64px', left: 0, bottom: 0, overflowY: 'auto', zIndex: 100, padding: '1.5rem 1rem' }}>
          {/* User card */}
          <div 
            onClick={() => handleTabChange('profile')} 
            style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1.25rem 1rem', marginBottom: '1.5rem', textAlign: 'center', boxShadow: 'var(--shadow-sm)', cursor: 'pointer', transition: 'all 0.2s' }}
            title="Click to view My Profile & KYC"
          >
            <div style={{ position: 'relative', width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 0.75rem', border: '2px solid #4285F4', background: 'linear-gradient(135deg, #4285F4, #BC4639)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', boxShadow: '0 4px 12px rgba(66,133,244,0.3)' }}>
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user?.name?.[0]?.toUpperCase() || 'U'
              )}
            </div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
              {user?.name}
              {user?.aadhaarVerified && (
                <ShieldCheck size={18} color="#10b981" title="Govt ID / Aadhaar Verified" />
              )}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#4285F4', marginTop: '0.2rem', fontWeight: 600 }}>My Profile & Settings ›</div>

            {/* Aadhaar Verified Status Badge */}
            <div style={{ marginTop: '0.75rem' }}>
              {user?.aadhaarVerified ? (
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '999px', padding: '0.25rem 0.6rem', fontSize: '0.7rem', color: '#10b981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <ShieldCheck size={13} /> Govt ID Verified
                </div>
              ) : (
                <button 
                  onClick={() => setShowKycModal(true)}
                  style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '999px', padding: '0.25rem 0.6rem', fontSize: '0.7rem', color: '#f59e0b', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <AlertCircle size={13} /> Verify Aadhaar ID
                </button>
              )}
            </div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => handleTabChange(id)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 1rem', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, width: '100%', textAlign: 'left', transition: 'all 0.15s', background: activeTab === id ? 'linear-gradient(135deg, rgba(66,133,244,0.15), rgba(188,70,57,0.15))' : 'transparent', color: activeTab === id ? '#4285F4' : 'var(--text-secondary)', position: 'relative' }}>
                <Icon size={16} />
                {label}
                {id === 'bookings' && incomingChatRequests.length > 0 && (
                  <span style={{ position: 'absolute', right: '0.75rem', background: '#10b981', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800 }} title="Artist Requested Direct Chat!"><MessageSquare size={11} /></span>
                )}
                {id === 'notifications' && unreadNotifs > 0 && (
                  <span style={{ position: 'absolute', right: '0.75rem', background: '#BC4639', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700 }}>{unreadNotifs}</span>
                )}
              </button>
            ))}

            {/* Quick Link to Open Events Board */}
            <button onClick={() => navigate('/events')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 1rem', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, width: '100%', textAlign: 'left', color: '#BC4639', background: 'rgba(188,70,57,0.08)', marginTop: '0.75rem' }}>
              <PlusCircle size={16} /> Post / View Event Gigs
            </button>

            <button onClick={() => { logout(); navigate('/'); }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 1rem', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, width: '100%', textAlign: 'left', color: '#ef4444', background: 'transparent', marginTop: '1rem' }}>
              <LogOut size={16} /> Sign Out
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, marginLeft: '270px', padding: '2rem', minWidth: 0 }}>
          {/* Direct Chat Request Alert Banner */}
          {incomingChatRequests.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.14), rgba(66, 133, 244, 0.12))',
              border: '1.5px solid #10b981',
              borderRadius: '16px',
              padding: '1.1rem 1.35rem',
              marginBottom: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.2)',
              animation: 'fadeIn 0.3s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0, boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)' }}>
                  <MessageSquare size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    💬 Direct Chat Request Received ({incomingChatRequests.length})
                    <span style={{ fontSize: '0.7rem', background: '#10b981', color: '#fff', padding: '0.15rem 0.55rem', borderRadius: '999px', fontWeight: 800 }}>Action Required</span>
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    {incomingChatRequests.map(b => `${b.artist?.displayName || 'Artist'} (${b.eventType})`).join(', ')} wants to chat directly to coordinate your event booking!
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {incomingChatRequests.map(b => (
                  <button
                    key={b.id}
                    className="btn btn-primary btn-sm"
                    onClick={() => handleAcceptDirectChat(b)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      borderColor: '#10b981',
                      fontWeight: 800,
                      boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)',
                      padding: '0.5rem 1rem'
                    }}
                  >
                    <CheckCircle size={15} /> Accept & Chat with {b.artist?.displayName || 'Artist'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Overview */}
          {activeTab === 'overview' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
                  <p style={{ color: 'var(--text-secondary)' }}>Manage your booking requests, payments, and artist communications.</p>
                </div>

                <button className="btn btn-primary" onClick={() => navigate('/events?post=true')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <PlusCircle size={16} /> Post an Event Gig
                </button>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {[
                  { label: 'Total Bookings', value: bookings.length, icon: Calendar, color: '#4285F4' },
                  { label: 'Upcoming Events', value: upcomingBookings.length, icon: Clock, color: '#BC4639' },
                  { label: 'Completed Events', value: completedBookings.length, icon: CheckCircle, color: '#10b981' },
                  { label: 'Saved Artists', value: favorites.length, icon: Heart, color: '#BC4639' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="stat-card">
                    <div className="stat-card__icon" style={{ background: `${color}15` }}><Icon size={22} color={color} /></div>
                    <div className="stat-card__value">{value}</div>
                    <div className="stat-card__label">{label}</div>
                  </div>
                ))}
              </div>

              {/* Upcoming bookings */}
              <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>Upcoming Events</h3>
              {upcomingBookings.length === 0 ? (
                <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  No upcoming bookings. <button onClick={() => navigate('/artists')} style={{ background: 'transparent', border: 'none', color: '#4285F4', cursor: 'pointer', fontWeight: 600 }}>Discover artists</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {upcomingBookings.slice(0, 3).map(b => (
                    <CustomerBookingCard 
                      key={b.id} 
                      booking={b} 
                      onCancel={() => setCancelModalBooking(b)} 
                      onPay={(milestone) => setPaymentModalData({ booking: b, milestone })}
                      onChat={() => setChatModalBooking(b)}
                      onAcceptChat={handleAcceptDirectChat}
                      onReview={setReviewModal} 
                      navigate={navigate} 
                    />
                  ))}
                  {upcomingBookings.length > 3 && (
                    <button className="btn btn-secondary btn-sm" onClick={() => handleTabChange('bookings')}>View all {upcomingBookings.length} bookings <ChevronRight size={14} /></button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Bookings */}
          {activeTab === 'bookings' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>My Bookings</h1>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/events')}>
                  View Open Gigs
                </button>
              </div>

              {bookings.length === 0 ? (
                <EmptyState icon={Calendar} title="No bookings yet" description="Start by exploring artists and submitting a booking request."
                  action={<button className="btn btn-primary" onClick={() => navigate('/artists')}><Music size={14} /> Discover Artists</button>} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {bookings.map(b => (
                    <CustomerBookingCard 
                      key={b.id} 
                      booking={b} 
                      onCancel={() => setCancelModalBooking(b)} 
                      onPay={(milestone) => setPaymentModalData({ booking: b, milestone })}
                      onChat={() => setChatModalBooking(b)}
                      onAcceptChat={handleAcceptDirectChat}
                      onReview={setReviewModal} 
                      navigate={navigate} 
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Favorites */}
          {activeTab === 'favorites' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Saved Artists</h1>
              {favorites.length === 0 ? (
                <EmptyState icon={Heart} title="No saved artists" description="Browse artists and click the heart icon to save your favorites."
                  action={<button className="btn btn-primary" onClick={() => navigate('/artists')}><Music size={14} /> Discover Artists</button>} />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  {favorites.map(({ artist, artistId }) => artist && (
                    <div key={artistId} style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '16px', overflow: 'hidden' }}>
                      <div style={{ position: 'relative', height: '180px' }}>
                        <img src={artist.image} alt={artist.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.displayName)}&background=f59e0b&color=090a10`; }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(9,10,16,0.9), transparent)' }} />
                      </div>
                      <div style={{ padding: '1rem' }}>
                        <div style={{ fontSize: '0.7rem', color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>{artist.category}</div>
                        <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{artist.displayName}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.875rem', color: '#fbbf24', fontWeight: 700 }}>From {formatINR(artist.startingPrice)}</span>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-primary btn-sm" onClick={() => navigate(`/artists/${artist.id}`)}>View</button>
                            <button className="btn btn-secondary btn-sm" onClick={() => removeFavorite(artistId)}><Heart size={12} /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Notifications</h1>
                {unreadNotifs > 0 && <button className="btn btn-secondary btn-sm" onClick={markNotificationsRead}>Mark all as read</button>}
              </div>
              {notifications.length === 0 ? (
                <EmptyState icon={Bell} title="No notifications" description="You'll see updates about your bookings and artist quotes here." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {notifications.map(n => (
                    <div key={n.id} style={{ background: n.isRead ? 'var(--color-card)' : 'rgba(66,133,244,0.08)', border: `1px solid ${n.isRead ? 'var(--color-border)' : 'rgba(66,133,244,0.3)'}`, borderRadius: '14px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: 'var(--shadow-sm)' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: n.isRead ? 'var(--color-border)' : '#4285F4', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.875rem', color: n.isRead ? 'var(--text-secondary)' : 'var(--text-primary)', fontWeight: n.isRead ? 400 : 600, lineHeight: 1.5 }}>{n.message}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{formatDate(n.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Profile & KYC Settings */}
          {(activeTab === 'profile' || activeTab === 'settings') && (
            <ProfileSettings 
              user={user} 
              updateUser={updateUser} 
              onOpenKyc={() => setShowKycModal(true)} 
            />
          )}
        </main>
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <ReviewModal booking={reviewModal} onClose={() => setReviewModal(null)} onSuccess={(bookingId) => {
          setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, hasReview: true } : b));
          setReviewModal(null);
          toast.success('Review submitted! Thank you.');
        }} />
      )}

      {/* Cancel Booking Modal */}
      {cancelModalBooking && (
        <CancelModal
          booking={cancelModalBooking}
          userRole="customer"
          onClose={() => setCancelModalBooking(null)}
          onSuccess={(updatedBooking) => {
            setBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
          }}
        />
      )}

      {/* Milestone Payment Modal (50% before, 50% after) */}
      {paymentModalData && (
        <MilestonePaymentModal
          booking={paymentModalData.booking}
          milestone={paymentModalData.milestone}
          onClose={() => setPaymentModalData(null)}
          onSuccess={(updatedBooking) => {
            setBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
          }}
        />
      )}

      {/* Mutual Agreement Chat Modal */}
      {chatModalBooking && (
        <ChatModal
          booking={chatModalBooking}
          currentUser={user}
          onClose={() => setChatModalBooking(null)}
          onChatUpdated={(updatedBooking) => {
            setBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
            setChatModalBooking(updatedBooking);
          }}
        />
      )}

      {/* Government Aadhaar KYC Verification Modal */}
      {showKycModal && (
        <AadhaarVerificationModal
          user={user}
          onClose={() => setShowKycModal(false)}
          onSuccess={(updatedUser) => {
            updateUser(updatedUser);
          }}
        />
      )}
    </div>
  );
}

// ── CUSTOMER BOOKING CARD COMPONENT ──────────────────────────
function CustomerBookingCard({ booking, onCancel, onPay, onChat, onAcceptChat, onReview, navigate }) {
  const canCancel = ['requested', 'quoted', 'confirmed'].includes(booking.status);
  const canReview = booking.status === 'completed' && !booking.hasReview;

  // Split payment triggers: Advance is ONLY payable after artist accepts/quotes
  const canPayAdvance = ['quoted', 'accepted'].includes(booking.status) && booking.paymentStatus === 'unpaid';
  const canPayBalance = booking.status === 'completed' && booking.paymentStatus === 'advance_paid';

  return (
    <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '18px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', boxShadow: 'var(--shadow-sm)' }}>
      {booking.artist?.image && (
        <img 
          src={booking.artist.image} 
          alt={booking.artist?.displayName} 
          style={{ width: '64px', height: '64px', borderRadius: '14px', objectFit: 'cover', flexShrink: 0 }} 
          onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(booking.artist?.displayName || 'A')}&background=BC4639&color=fff`; }} 
        />
      )}
      <div style={{ flex: 1, minWidth: '240px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
          <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
            {booking.artist?.displayName || 'Unknown Artist'}
          </span>
          {(booking.artist?.aadhaarVerified || booking.artist?.verified) && (
            <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', fontWeight: 700 }} title="Government ID Verified Legal Artist">
              <ShieldCheck size={16} /> Verified Artist
            </span>
          )}
          <StatusBadge status={booking.status} />

          {/* Direct Chat Status Badges */}
          {booking.chatRequestedBy === 'artist' && !booking.chatEnabled && (
            <span style={{
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1.5px solid #f59e0b',
              color: '#f59e0b',
              borderRadius: '999px',
              padding: '0.22rem 0.75rem',
              fontSize: '0.75rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: '0 0 12px rgba(245, 158, 11, 0.25)'
            }}>
              <MessageSquare size={13} /> {booking.artist?.displayName || 'Artist'} Requested Direct Chat!
            </span>
          )}

          {booking.chatRequestedBy === 'customer' && !booking.chatEnabled && (
            <span style={{
              background: 'rgba(66, 133, 244, 0.12)',
              border: '1px solid rgba(66, 133, 244, 0.35)',
              color: '#4285F4',
              borderRadius: '999px',
              padding: '0.22rem 0.65rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              <Clock size={13} /> Chat Requested (Waiting for artist)
            </span>
          )}

          {booking.chatEnabled && (
            <span style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              color: '#10b981',
              borderRadius: '999px',
              padding: '0.22rem 0.65rem',
              fontSize: '0.75rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              <CheckCircle size={13} /> Direct Chat Active
            </span>
          )}

          {/* Payment Status Pill */}
          {booking.paymentStatus === 'advance_paid' && (
            <span style={{ fontSize: '0.7rem', fontWeight: 800, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', padding: '0.2rem 0.6rem', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <CheckCircle size={12} /> 50% Advance Paid
            </span>
          )}
          {booking.paymentStatus === 'fully_paid' && (
            <span style={{ fontSize: '0.7rem', fontWeight: 800, background: 'rgba(16, 185, 129, 0.18)', color: '#10b981', padding: '0.2rem 0.6rem', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <CheckCircle size={12} /> 100% Fully Settled
            </span>
          )}
        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span>📅 {formatDate(booking.eventDate)}</span>
          <span>🎭 {booking.eventType}</span>
          <span>📍 {booking.eventLocation?.city || 'Location'}</span>
          {booking.quotedPrice ? (
            <span style={{ color: '#BC4639', fontWeight: 700 }}>💰 Quoted: {formatINR(booking.quotedPrice)}</span>
          ) : (
            <span style={{ color: 'var(--text-secondary)' }}>Budget: {formatINR(booking.budget)}</span>
          )}
        </div>

        {booking.artistNote && (
          <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', background: 'var(--color-surface)', padding: '0.35rem 0.65rem', borderRadius: '8px', border: '1px dashed var(--color-border)' }}>
            Artist note: "{booking.artistNote}"
          </div>
        )}

        {booking.cancelReason && (
          <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: '#ef4444', fontStyle: 'italic' }}>
            Cancellation reason: "{booking.cancelReason}"
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Chat Button with Mutual Awareness */}
        {booking.chatRequestedBy === 'artist' && !booking.chatEnabled ? (
          <button 
            className="btn btn-primary btn-sm" 
            onClick={() => onAcceptChat ? onAcceptChat(booking) : onChat()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderColor: '#10b981',
              color: '#ffffff',
              fontWeight: 800,
              boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)',
              padding: '0.45rem 0.85rem'
            }}
            title={`Accept ${booking.artist?.displayName || 'artist'}'s chat request to start direct messaging`}
          >
            <CheckCircle size={14} />
            Accept Chat Request
          </button>
        ) : booking.chatRequestedBy === 'customer' && !booking.chatEnabled ? (
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={onChat}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.35)' }}
            title="You requested a direct chat. Waiting for artist to accept."
          >
            <Clock size={14} />
            Chat Pending (Waiting)
          </button>
        ) : (
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={onChat}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              color: booking.chatEnabled ? '#4285F4' : 'var(--text-secondary)',
              borderColor: booking.chatEnabled ? '#4285F4' : undefined,
              fontWeight: booking.chatEnabled ? 700 : 500
            }}
            title={booking.chatEnabled ? 'Direct Chat Connected' : 'Request Direct Chat'}
          >
            <MessageSquare size={14} />
            {booking.chatEnabled ? 'Open Chat' : 'Request Chat'}
          </button>
        )}

        {/* Awaiting Artist Acceptance Notice */}
        {booking.status === 'requested' && (
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.35)', padding: '0.35rem 0.75rem', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Clock size={13} /> Waiting for Artist to Accept / Quote
          </span>
        )}

        {/* 50% Advance Pay Button (Only active when artist has accepted/quoted) */}
        {canPayAdvance && (
          <button 
            className="btn btn-primary btn-sm" 
            onClick={() => onPay('advance')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderColor: '#10b981',
              boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)',
              fontWeight: 800
            }}
          >
            <CreditCard size={14} /> Pay 50% Advance ({formatINR(booking.advanceAmount || Math.round((booking.quotedPrice || booking.budget) * 0.5))})
          </button>
        )}

        {/* Confirmed Notice */}
        {booking.status === 'confirmed' && booking.paymentStatus === 'advance_paid' && (
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4285F4', background: 'rgba(66, 133, 244, 0.1)', border: '1px solid rgba(66, 133, 244, 0.3)', padding: '0.35rem 0.75rem', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <CheckCircle size={13} /> Date Confirmed · Balance due after performance
          </span>
        )}

        {/* 50% Balance Pay Button (Only after artist completes show) */}
        {canPayBalance && (
          <button 
            className="btn btn-primary btn-sm" 
            onClick={() => onPay('balance')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'linear-gradient(135deg, #4285F4, #BC4639)',
              borderColor: '#4285F4',
              fontWeight: 800
            }}
          >
            <CreditCard size={14} /> Pay Final 50% Balance ({formatINR(booking.balanceAmount || Math.round((booking.quotedPrice || booking.budget) * 0.5))})
          </button>
        )}

        {/* Rate & Review Button (Only after performance is completed) */}
        {booking.status === 'completed' && (!booking.hasReview ? (
          <button 
            className="btn btn-primary btn-sm" 
            onClick={() => onReview(booking)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'linear-gradient(135deg, #f59e0b, #BC4639)', borderColor: '#f59e0b', color: '#fff', fontWeight: 700 }}
            title="Leave a star rating & review for this artist"
          >
            <Star size={13} fill="#fff" /> Rate & Review
          </button>
        ) : (
          <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700, padding: '0.35rem 0.65rem', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px' }}>
            <Check size={12} strokeWidth={3} /> Reviewed
          </span>
        ))}

        {/* Cancel Button */}
        {canCancel && (
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={onCancel} 
            style={{ color: '#ef4444', borderColor: '#ef4444' }}
          >
            Cancel Request
          </button>
        )}
      </div>
    </div>
  );
}

// ── REVIEW MODAL ─────────────────────────────────────────────
function ReviewModal({ booking, onClose, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!rating) return toast.error('Please select a rating.');
    setLoading(true);
    try {
      await bookingsAPI.submitReview(booking.id, { rating, comment });
      onSuccess(booking.id);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '480px' }}>
        <div className="modal__header">
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Leave a Review & Rating</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><XCircle size={20} /></button>
        </div>
        <div className="modal__body">
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            How was your live experience with <strong style={{ color: 'var(--text-primary)' }}>{booking.artist?.displayName}</strong>? Your feedback directly impacts their public leaderboard ranking!
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} onClick={() => setRating(s)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem', transition: 'transform 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                <Star size={32} color={s <= rating ? '#BC4639' : 'var(--color-border)'} fill={s <= rating ? '#BC4639' : 'none'} />
              </button>
            ))}
          </div>
          <textarea className="form-textarea" placeholder="Share your experience (e.g., vocal performance, crowd interaction, stage presence)..." value={comment} onChange={e => setComment(e.target.value)} style={{ minHeight: '100px' }} />
        </div>
        <div className="modal__footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={loading}>{loading ? 'Submitting...' : 'Submit Review'}</button>
        </div>
      </div>
    </div>
  );
}

// ── PROFILE & GOVERNMENT KYC SETTINGS ────────────────────────
function ProfileSettings({ user, updateUser, onOpenKyc }) {
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', city: user?.city || '' });
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const PRESET_AVATARS = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
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
      toast.success('Photo chosen! Click "Save Changes" to apply.');
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setLoading(true);
    try {
      const { data } = await authAPI.updateMe({ ...form, avatar });
      updateUser(data.user);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      toast.success('Profile and photo updated successfully!');
    } catch {
      toast.error('Failed to save changes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: '580px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Account & Identity Verification</h1>

      {/* KYC Government ID Card */}
      <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: user?.aadhaarVerified ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={24} color={user?.aadhaarVerified ? '#10b981' : '#f59e0b'} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                Government ID & Aadhaar Status
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Ensures you are recognized as a real, legal customer by artists
              </div>
            </div>
          </div>

          {user?.aadhaarVerified ? (
            <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '999px', padding: '0.35rem 0.85rem', color: '#10b981', fontWeight: 800, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <CheckCircle size={15} /> Verified by Admin
            </div>
          ) : user?.aadhaarStatus === 'under_review' ? (
            <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '999px', padding: '0.35rem 0.85rem', color: '#f59e0b', fontWeight: 800, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Clock size={15} /> Under Admin Review
            </div>
          ) : user?.aadhaarStatus === 'rejected' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '999px', padding: '0.35rem 0.85rem', color: '#ef4444', fontWeight: 800, fontSize: '0.8rem' }}>
                ✕ Not Approved
              </span>
              <button className="btn btn-outline btn-sm" onClick={onOpenKyc} style={{ fontSize: '0.75rem', borderColor: '#ef4444', color: '#ef4444' }}>
                Resubmit ID
              </button>
            </div>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={onOpenKyc}>
              Verify Now
            </button>
          )}
        </div>

        {user?.aadhaarVerified ? (
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '0.85rem 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <div>● ID Type: <strong>{user?.aadhaarData?.idType || 'Aadhaar (UIDAI)'}</strong></div>
            <div>● Masked Number: <strong>{user?.aadhaarData?.maskedNumber || 'XXXX-XXXX-1234'}</strong></div>
            <div>● Legal Name: <strong>{user?.aadhaarData?.legalName || user?.name}</strong></div>
            <div style={{ marginTop: '0.4rem', color: '#10b981', fontSize: '0.78rem', fontWeight: 700 }}>
              🛡️ Authenticated & Approved by GoArts Trust & Safety Admin
            </div>
          </div>
        ) : user?.aadhaarStatus === 'under_review' ? (
          <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '12px', padding: '0.85rem 1rem', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <strong style={{ color: '#f59e0b' }}>⏳ Application Submitted for Admin Review:</strong>
            <p style={{ margin: '0.25rem 0 0' }}>
              Your {user?.aadhaarData?.idType || 'Government ID'} ({user?.aadhaarData?.maskedNumber || ''}) has been forwarded to GoArts Admin for manual authentication. Once approved, you will receive a verified client green badge.
            </p>
          </div>
        ) : user?.aadhaarStatus === 'rejected' ? (
          <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '12px', padding: '0.85rem 1rem', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <strong style={{ color: '#ef4444' }}>✕ Admin Decision Remarks:</strong>
            <p style={{ margin: '0.25rem 0 0' }}>
              {user?.adminNotes || 'The submitted Government ID could not be validated. Please click "Resubmit ID" to upload clear details.'}
            </p>
          </div>
        ) : (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Artists prefer working with verified organizers. Verify your Aadhaar or Government ID to get a verified green shield badge on all booking requests and event gig postings.
          </p>
        )}
      </div>

      {/* Account Settings Form */}
      <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>Personal Details</h3>

        {/* Profile Photo Upload Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          padding: '1.25rem',
          background: 'var(--color-surface)',
          borderRadius: '16px',
          border: '1px solid var(--color-border)',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
        }}>
          <div style={{
            position: 'relative',
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '2px solid #4285F4',
            background: 'linear-gradient(135deg, #4285F4, #BC4639)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '1.6rem',
            fontWeight: 800,
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(66,133,244,0.25)',
          }}>
            {avatar ? (
              <img src={avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              user?.name?.[0]?.toUpperCase() || 'U'
            )}
          </div>

          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                Profile Photo
              </span>
              <span style={{ fontSize: '0.7rem', background: 'rgba(66,133,244,0.1)', color: '#4285F4', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '6px' }}>
                Optional
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
              Upload a picture so artists recognize you when you book events or message them.
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
            />

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-outline btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', padding: '0.35rem 0.8rem' }}
              >
                <Camera size={14} /> {avatar ? 'Change Photo' : 'Upload From Device'}
              </button>

              {avatar && (
                <button
                  type="button"
                  onClick={() => { setAvatar(''); toast.info('Photo removed. Click "Save Changes" to save.'); }}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.8rem', color: '#ef4444' }}
                >
                  Remove
                </button>
              )}
            </div>

            {/* Quick Presets */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.6rem' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Or choose preset avatar:</span>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                {PRESET_AVATARS.map((pImg, idx) => (
                  <img
                    key={idx}
                    src={pImg}
                    alt="Preset"
                    onClick={() => { setAvatar(pImg); toast.success('Preset selected! Click "Save Changes" to save.'); }}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      objectFit: 'cover',
                      border: avatar === pImg ? '2px solid #4285F4' : '1px solid rgba(255,255,255,0.2)',
                      transition: 'transform 0.15s ease',
                    }}
                    title="Choose preset portrait"
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" value={user?.email} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email cannot be changed.</span>
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">City</label>
            <select className="form-select" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))}>
              <option value="">Select city</option>
              {['Hyderabad', 'Bengaluru', 'Chennai', 'Mumbai', 'Delhi', 'Pune', 'Kolkata', 'Ahmedabad'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={save} disabled={loading}>
          {success ? <><CheckCircle size={14} /> Saved!</> : loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
