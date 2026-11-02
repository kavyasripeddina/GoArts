// GoArts AI - Artist Dashboard with Real-time Gigs, Mutual Chat & Verified KYC
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Calendar, BarChart2, User, Settings, LogOut, Star, DollarSign, Clock, 
  CheckCircle, XCircle, Music, Eye, ChevronRight, Check, MessageSquare, 
  ShieldCheck, AlertTriangle, AlertCircle, PlusCircle, Send, Bell, Upload,
  Award, Globe, Video, FileText, CheckCircle2, Shield, Crown
} from 'lucide-react';
import { Navbar, Spinner, StatusBadge, EmptyState, formatINR, formatDate } from '../components/shared';
import { bookingsAPI, artistsAPI, authAPI, miscAPI, aiAPI } from '../lib/api';
import { useAuth } from '../context/useAuth';
import { 
  CancelModal, ChatModal, AadhaarVerificationModal, MilestonePaymentModal
} from '../components/BookingActionsModal';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart2 },
  { id: 'bookings', label: 'Booking Requests', icon: Calendar },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'availability', label: 'Availability', icon: Calendar },
  { id: 'settings', label: 'Settings & KYC', icon: Settings },
];

export default function ArtistDashboard() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [bookings, setBookings] = useState([]);
  const [artist, setArtist] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [membershipStatus, setMembershipStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [chatModalBooking, setChatModalBooking] = useState(null);
  const [showKycModal, setShowKycModal] = useState(false);
  const [paymentModalData, setPaymentModalData] = useState(null); // { booking, milestone }

  useEffect(() => {
    setActiveTab(searchParams.get('tab') || 'overview');
  }, [searchParams]);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [bRes, aRes, nRes, mRes] = await Promise.allSettled([
        bookingsAPI.myBookings({ role: 'artist', limit: 50 }),
        artistsAPI.getMyProfile(),
        miscAPI.getNotifications(),
        aiAPI.myMembership(),
      ]);
      if (bRes.status === 'fulfilled') setBookings(bRes.value.data.bookings || []);
      if (aRes.status === 'fulfilled') setArtist(aRes.value.data.artist);
      if (nRes.status === 'fulfilled') setNotifications(nRes.value.data.notifications || []);
      if (mRes.status === 'fulfilled') setMembershipStatus(mRes.value.data);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Real-time polling so when a customer books or requests chat, it updates at the artist's end!
    const timer = setInterval(() => {
      if (!document.hidden) loadData(true);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleTabChange = (tab) => { 
    setActiveTab(tab); 
    setSearchParams({ tab }); 
    loadData(true);
  };

  const markNotificationsRead = async () => {
    try {
      await miscAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
  };

  const updateBookingStatus = async (bookingId, status, extra = {}) => {
    try {
      const { data } = await bookingsAPI.updateStatus(bookingId, { status, ...extra });
      setBookings(prev => prev.map(b => b.id === bookingId ? data.booking : b));
      toast.success(`Booking status updated to ${status}.`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update booking.');
    }
  };

  const handleAcceptDirectChat = async (booking) => {
    try {
      const { data } = await bookingsAPI.requestChat(booking.id);
      const isEnabled = Boolean(data.chatEnabled);
      const updated = data.booking || { 
        ...booking, 
        chatEnabled: isEnabled, 
        chatRequestedBy: isEnabled ? 'both' : 'artist' 
      };
      setBookings(prev => prev.map(b => b.id === booking.id ? updated : b));
      setChatModalBooking(updated);
      toast.success(data.message || `Direct chat unlocked with ${booking.customer?.name || 'client'}!`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to accept chat request.');
    }
  };

  const pendingBookings = bookings.filter(b => b.status === 'requested');
  const activeBookings = bookings.filter(b => ['quoted', 'confirmed'].includes(b.status));
  const completedBookings = bookings.filter(b => b.status === 'completed');
  const incomingChatRequests = bookings.filter(b => b.chatRequestedBy === 'customer' && !b.chatEnabled);
  const unreadNotifs = notifications.filter(n => !n.isRead).length;
  const totalEarnings = completedBookings.reduce((s, b) => s + (b.artistEarnings || 0), 0);
  const confirmedEarnings = bookings.filter(b => b.status === 'confirmed').reduce((s, b) => s + (b.artistEarnings || 0), 0);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--color-midnight)' }}><Spinner size={50} /></div>;

  return (
    <div style={{ background: 'var(--color-midnight)', minHeight: '100vh', color: 'var(--text-primary)' }}>
      <Navbar />
      <div style={{ paddingTop: '64px', display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
        {/* Sidebar */}
        <aside style={{ width: '270px', background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)', position: 'fixed', top: '64px', left: 0, bottom: 0, overflowY: 'auto', zIndex: 100, padding: '1.5rem 1rem' }}>
          <div 
            onClick={() => handleTabChange('profile')}
            style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1.25rem 1rem', marginBottom: '1.5rem', textAlign: 'center', boxShadow: 'var(--shadow-sm)', cursor: 'pointer', transition: 'all 0.2s' }}
            title="Click to view & edit My Profile"
          >
            {artist?.image ? (
              <img src={artist.image} alt={artist?.displayName} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 0.75rem', display: 'block', border: '2px solid var(--color-border)' }} onError={e => { e.target.style.display = 'none'; }} />
            ) : (
              <div style={{ width: '60px', height: '60px', background: 'linear-gradient(135deg, #4285F4, #BC4639)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: '0 auto 0.75rem' }}>
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
            )}
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
              {artist?.displayName || user?.name}
              {(artist?.aadhaarVerified || artist?.verified) && (
                <ShieldCheck size={18} color="#10b981" title="Govt ID / Aadhaar Verified Artist" />
              )}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#4285F4', marginTop: '0.2rem', fontWeight: 600 }}>Edit My Profile ›</div>

            {artist?.id && (
              <div style={{ marginTop: '0.4rem' }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); navigate(`/artists/${artist.id}`); }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.72rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <Eye size={12} /> Preview Public Page
                </button>
              </div>
            )}

            {/* Aadhaar status */}
            <div style={{ marginTop: '0.6rem' }}>
              {(artist?.aadhaarVerified || user?.aadhaarVerified) ? (
                <span style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '999px', padding: '0.2rem 0.6rem', fontSize: '0.7rem', color: '#10b981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <ShieldCheck size={12} /> Govt ID Verified
                </span>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowKycModal(true); }}
                  style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '999px', padding: '0.2rem 0.6rem', fontSize: '0.7rem', color: '#f59e0b', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <AlertCircle size={12} /> Verify Aadhaar ID
                </button>
              )}
            </div>

            {/* Membership Plan Badge & Upgrade Link */}
            <div style={{ marginTop: '0.65rem' }}>
              {membershipStatus?.activeMembership ? (
                <div style={{
                  background: membershipStatus.isElite ? 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(188,70,57,0.15))' : 'rgba(66,133,244,0.1)',
                  border: `1px solid ${membershipStatus.isElite ? '#f59e0b' : '#4285F4'}`,
                  borderRadius: '10px',
                  padding: '0.35rem 0.65rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.4rem',
                }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: membershipStatus.isElite ? '#f59e0b' : '#4285F4', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Crown size={12} /> {membershipStatus.activeMembership.planName || 'Pro Plan'}
                  </span>
                  <button
                    onClick={() => navigate('/premium')}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.68rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Manage
                  </button>
                </div>
              ) : membershipStatus?.pendingMembership ? (
                <div style={{
                  background: 'rgba(245,158,11,0.1)',
                  border: '1px solid rgba(245,158,11,0.3)',
                  borderRadius: '10px',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.72rem',
                  color: '#f59e0b',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  <Clock size={12} /> {membershipStatus.pendingMembership.planName} (Under Review)
                </div>
              ) : (
                <button
                  onClick={() => navigate('/premium')}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(188,70,57,0.12))',
                    border: '1px dashed #f59e0b',
                    borderRadius: '10px',
                    padding: '0.4rem 0.65rem',
                    color: '#f59e0b',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Crown size={13} /> Upgrade to Elite / Pro
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
                {id === 'bookings' && pendingBookings.length > 0 && (
                  <span style={{ position: 'absolute', right: incomingChatRequests.length > 0 ? '2.5rem' : '0.75rem', background: '#BC4639', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>{pendingBookings.length}</span>
                )}
                {id === 'bookings' && incomingChatRequests.length > 0 && (
                  <span style={{ position: 'absolute', right: '0.75rem', background: '#10b981', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }} title="Direct Chat Request Received!"><MessageSquare size={11} /></span>
                )}
                {id === 'notifications' && unreadNotifs > 0 && (
                  <span style={{ position: 'absolute', right: '0.75rem', background: '#BC4639', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>{unreadNotifs > 9 ? '9+' : unreadNotifs}</span>
                )}
              </button>
            ))}

            {/* Browse Open Gigs */}
            <button onClick={() => navigate('/events')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 1rem', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, width: '100%', textAlign: 'left', color: '#4285F4', background: 'rgba(66,133,244,0.08)', marginTop: '0.75rem' }}>
              <Music size={16} /> Browse Open Gigs & Pitch
            </button>

            <button onClick={() => { logout(); navigate('/'); }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 1rem', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, width: '100%', textAlign: 'left', color: '#ef4444', background: 'transparent', marginTop: '1rem' }}>
              <LogOut size={16} /> Sign Out
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, marginLeft: '270px', padding: '2rem', minWidth: 0 }}>
          {/* Pending Membership Notification Banner */}
          {membershipStatus?.pendingMembership && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(66, 133, 244, 0.08))',
              border: '1.5px solid #f59e0b',
              borderRadius: '16px',
              padding: '1rem 1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: '#f59e0b', borderRadius: '10px', padding: '0.5rem', display: 'flex', color: 'white' }}>
                  <Crown size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    ⏳ Your {membershipStatus.pendingMembership.planName} Membership Application is Under Review
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    Payment method: <strong>{membershipStatus.pendingMembership.paymentMethod?.toUpperCase()}</strong> · Reference: <code style={{ color: '#4285F4' }}>{membershipStatus.pendingMembership.transactionRef}</code>. GoArts Admins are verifying the payment proof. Features will unlock automatically upon approval.
                  </div>
                </div>
              </div>
              <button onClick={() => navigate('/premium')} className="btn btn-sm btn-outline" style={{ fontSize: '0.75rem' }}>
                View Payment Details
              </button>
            </div>
          )}
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
                    {incomingChatRequests.map(b => `${b.customer?.name || 'Client'} (${b.eventType})`).join(', ')} requested a direct chat with you to coordinate event details.
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
                    <CheckCircle size={15} /> Accept & Chat with {b.customer?.name || 'Client'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Overview */}
          {activeTab === 'overview' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>Artist Command Center</h1>
                  <p style={{ color: 'var(--text-secondary)' }}>Manage your booking requests, quotations, split payments, and customer chats.</p>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/events')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Music size={16} /> Find New Event Gigs
                </button>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {[
                  { label: 'Pending Requests', value: pendingBookings.length, icon: Clock, color: '#ff5e3a' },
                  { label: 'Active Bookings', value: activeBookings.length, icon: Calendar, color: '#f59e0b' },
                  { label: 'Completed Events', value: completedBookings.length, icon: CheckCircle, color: '#10b981' },
                  { label: 'Rating', value: `${artist?.rating || '5.0'} ⭐`, icon: Star, color: '#eab308' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="stat-card">
                    <div className="stat-card__icon" style={{ background: `${color}15` }}><Icon size={22} color={color} /></div>
                    <div className="stat-card__value">{value}</div>
                    <div className="stat-card__label">{label}</div>
                  </div>
                ))}
              </div>

              {/* Pending Requests Alert */}
              {pendingBookings.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ fontWeight: 800, color: '#BC4639', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={18} /> Action Required: New Booking Requests ({pendingBookings.length})
                    </h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {pendingBookings.map(b => (
                      <ArtistBookingCard 
                        key={b.id} 
                        booking={b} 
                        currentUser={user}
                        onUpdate={updateBookingStatus} 
                        onCancel={() => setCancelModalBooking(b)}
                        onChat={() => setChatModalBooking(b)}
                        onAcceptChat={handleAcceptDirectChat}
                        onPay={(booking, milestone) => setPaymentModalData({ booking, milestone })}
                        navigate={navigate} 
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming confirmed */}
              <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Upcoming Confirmed Events</h3>
              {activeBookings.length === 0 ? (
                <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>No upcoming confirmed events.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {activeBookings.map(b => (
                    <ArtistBookingCard 
                      key={b.id} 
                      booking={b} 
                      currentUser={user}
                      onUpdate={updateBookingStatus} 
                      onCancel={() => setCancelModalBooking(b)}
                      onChat={() => setChatModalBooking(b)}
                      onAcceptChat={handleAcceptDirectChat}
                      onPay={(booking, milestone) => setPaymentModalData({ booking, milestone })}
                      navigate={navigate} 
                    />
                  ))}
                </div>
              )}

              {/* Earnings summary */}
              {(totalEarnings > 0 || confirmedEarnings > 0) && (
                <div style={{ marginTop: '2rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '20px', padding: '1.5rem' }}>
                  <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: '#34d399' }}>💰 Payout & Split Payment Summary</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {[['Settled (Earned)', formatINR(totalEarnings), '#10b981'], ['Confirmed (Upcoming)', formatINR(confirmedEarnings), '#f59e0b']].map(([label, val, color]) => (
                      <div key={label} style={{ background: 'var(--color-card)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--color-border)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{label}</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color }}>{val}</div>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', fontStyle: 'italic' }}>* Clients pay 50% advance before the event to secure your booking, and 50% balance after performance completion.</p>
                </div>
              )}
            </div>
          )}

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Booking Requests & Confirmed Events</h1>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Auto-refreshes every 5s</span>
              </div>

              {bookings.length === 0 ? (
                <EmptyState icon={Calendar} title="No booking requests yet" description="Clients can discover you in the directory, or you can pitch for gigs on the Open Gig Board!" action={<button className="btn btn-primary" onClick={() => navigate('/events')}><Music size={14} /> Browse Open Gigs</button>} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {bookings.map(b => (
                    <ArtistBookingCard 
                      key={b.id} 
                      booking={b} 
                      currentUser={user}
                      onUpdate={updateBookingStatus} 
                      onCancel={() => setCancelModalBooking(b)}
                      onChat={() => setChatModalBooking(b)}
                      onAcceptChat={handleAcceptDirectChat}
                      onPay={(booking, milestone) => setPaymentModalData({ booking, milestone })}
                      navigate={navigate} 
                      showAll 
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Notifications</h1>
                {unreadNotifs > 0 && (
                  <button className="btn btn-secondary btn-sm" onClick={markNotificationsRead}>
                    Mark all as read
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <EmptyState icon={Bell} title="No notifications" description="You'll see real-time updates when customers book you, pay advances, or request direct chats." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {notifications.map(n => (
                    <div key={n.id} style={{
                      background: n.isRead ? 'var(--color-card)' : 'rgba(66, 133, 244, 0.08)',
                      border: `1px solid ${n.isRead ? 'var(--color-border)' : 'rgba(66, 133, 244, 0.35)'}`,
                      borderRadius: '14px',
                      padding: '1rem 1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: n.isRead ? 'var(--color-border)' : '#4285F4', flexShrink: 0 }} />
                        <div>
                          <p style={{ fontSize: '0.875rem', color: n.isRead ? 'var(--text-secondary)' : 'var(--text-primary)', fontWeight: n.isRead ? 400 : 700, lineHeight: 1.5 }}>
                            {n.message}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            {formatDate(n.createdAt)}
                          </p>
                        </div>
                      </div>
                      {n.type === 'chat_request' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            const matched = bookings.find(b => b.chatRequestedBy === 'customer' && !b.chatEnabled);
                            if (matched) handleAcceptDirectChat(matched);
                            else handleTabChange('bookings');
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            borderColor: '#10b981',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            flexShrink: 0,
                            fontWeight: 700
                          }}
                        >
                          <CheckCircle size={14} /> Accept & Chat
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            artist ? (
              <ArtistProfileEditor artist={artist} setArtist={setArtist} navigate={navigate} />
            ) : (
              <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '3rem 2rem', textAlign: 'center', maxWidth: '640px' }}>
                <Spinner size={40} center />
                <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Loading your artist profile details...</p>
              </div>
            )
          )}

          {/* Availability Tab */}
          {activeTab === 'availability' && (
            artist ? (
              <AvailabilityManager artist={artist} setArtist={setArtist} />
            ) : (
              <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '3rem 2rem', textAlign: 'center', maxWidth: '580px' }}>
                <Spinner size={40} center />
                <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Loading calendar availability...</p>
              </div>
            )
          )}

          {/* Settings & KYC Tab */}
          {activeTab === 'settings' && (
            <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: '640px' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                Artist Verification & Authenticity Command
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Prevent celebrity impersonation, authenticate your official identity, and unlock verified status on the marketplace.
              </p>

              {/* Tier & Verification Status Banner */}
              <div
                style={{
                  background: 'var(--color-card)',
                  border: artist?.artistTier === 'established' ? '1px solid rgba(245,158,11,0.35)' : '1px solid rgba(6,182,212,0.35)',
                  borderRadius: '20px',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ fontSize: '1.75rem' }}>
                      {artist?.artistTier === 'established' ? '👑' : '🚀'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                        {artist?.artistTier === 'established' ? 'Famous & Established Artist Track' : 'Emerging & New Talent Track'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Category: <strong>{artist?.category || 'Performer'}</strong> • City: <strong>{artist?.city}</strong>
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      padding: '0.35rem 0.85rem',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      background: artist?.verificationStatus === 'celebrity_verified'
                        ? 'rgba(59,130,246,0.15)'
                        : artist?.verificationStatus === 'verified'
                        ? 'rgba(16,185,129,0.15)'
                        : artist?.verificationStatus === 'needs_info'
                        ? 'rgba(245,158,11,0.15)'
                        : artist?.verificationStatus === 'rejected'
                        ? 'rgba(239,68,68,0.15)'
                        : (artist?.verificationStatus === 'pending_review' || artist?.verificationStatus === 'under_review')
                        ? 'rgba(245,158,11,0.15)'
                        : 'rgba(100,116,139,0.15)',
                      color: artist?.verificationStatus === 'celebrity_verified'
                        ? '#3b82f6'
                        : artist?.verificationStatus === 'verified'
                        ? '#10b981'
                        : artist?.verificationStatus === 'needs_info'
                        ? '#f59e0b'
                        : artist?.verificationStatus === 'rejected'
                        ? '#ef4444'
                        : (artist?.verificationStatus === 'pending_review' || artist?.verificationStatus === 'under_review')
                        ? '#f59e0b'
                        : '#64748b',
                      border: '1px solid currentColor',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    {artist?.verificationStatus === 'celebrity_verified' ? (
                      <>👑 Verified Popular Artist (Blue Badge)</>
                    ) : artist?.verificationStatus === 'verified' ? (
                      <>🛡️ Government ID Verified</>
                    ) : artist?.verificationStatus === 'needs_info' ? (
                      <>📝 Additional Info Required</>
                    ) : artist?.verificationStatus === 'rejected' ? (
                      <>❌ Verification Rejected</>
                    ) : (artist?.verificationStatus === 'pending_review' || artist?.verificationStatus === 'under_review') ? (
                      <>⏳ Under Review</>
                    ) : (
                      <>○ Verification Pending</>
                    )}
                  </span>
                </div>

                {artist?.verificationStatus === 'rejected' ? (
                  <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', padding: '0.9rem 1.1rem', fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, color: '#ef4444' }}>
                      ❌ Verification Application Not Approved by Trust & Safety
                    </div>
                    <p style={{ margin: '0.4rem 0 0', color: 'var(--text-secondary)' }}>
                      <strong>Decision Remarks:</strong> {artist.adminVerificationNotes || 'The submitted proof did not satisfy our authenticity criteria. Please review our guidelines and resubmit with updated documents.'}
                    </p>
                    <div style={{ marginTop: '0.45rem', fontSize: '0.8rem', color: '#ef4444', fontWeight: 600 }}>
                      ⚠️ Your previous application was not approved. Click "Resubmit Rectified Application" below to update your documents and resubmit for review.
                    </div>
                  </div>
                ) : artist?.verificationStatus === 'needs_info' ? (
                  <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '12px', padding: '0.85rem 1rem', fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    <strong style={{ color: '#f59e0b' }}>📝 Action Required: Additional Information Requested by Admin</strong>
                    <p style={{ margin: '0.35rem 0 0', color: 'var(--text-secondary)' }}>
                      {artist.adminVerificationNotes || 'Please review the requested supporting evidence, social links, or press coverage below and update your application.'}
                    </p>
                  </div>
                ) : (artist?.verificationStatus === 'pending_review' || artist?.verificationStatus === 'under_review') ? (
                  <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '12px', padding: '0.85rem 1rem', fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    <strong style={{ color: '#f59e0b' }}>⏳ Application Under Authentication Audit:</strong> Your verification application has been submitted to our Trust & Safety team. We are verifying your identity, official social presence, and performance records to prevent duplicate/impersonation accounts.
                  </div>
                ) : artist?.verificationStatus === 'celebrity_verified' ? (
                  <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '12px', padding: '0.85rem 1rem', fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    <strong style={{ color: '#3b82f6' }}>👑 Authenticated Popular Artist:</strong> Your account is officially verified with the blue celebrity checkmark. Your public presence, official channels, and notability have been authenticated by GoArts Trust & Safety.
                  </div>
                ) : (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    {artist?.artistTier === 'established'
                      ? 'Famous artists undergo strict celebrity anti-impersonation verification (social links, achievements, management contact, and Aadhaar/Govt ID).'
                      : 'Emerging artists are spotlighted based on performance reels, verified skills, and client reviews without requiring celebrity credentials.'}
                  </p>
                )}
              </div>

              {/* Verification Application Form Subcomponent */}
              <ArtistVerificationForm artist={artist} setArtist={setArtist} />

              {/* KYC Government ID Card */}
              <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: 'var(--shadow-sm)', marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: (artist?.aadhaarVerified || user?.aadhaarVerified) ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShieldCheck size={24} color={(artist?.aadhaarVerified || user?.aadhaarVerified) ? '#10b981' : '#f59e0b'} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                        Government ID & Aadhaar KYC
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Authenticates your legal identity to organizers & clients
                      </div>
                    </div>
                  </div>

                  {(artist?.aadhaarVerified || user?.aadhaarVerified) ? (
                    <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '999px', padding: '0.35rem 0.85rem', color: '#10b981', fontWeight: 800, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <CheckCircle size={15} /> Verified Legal Artist
                    </div>
                  ) : (
                    <button className="btn btn-primary btn-sm" onClick={() => setShowKycModal(true)}>
                      Verify Now
                    </button>
                  )}
                </div>

                {(artist?.aadhaarVerified || user?.aadhaarVerified) ? (
                  <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '0.85rem 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <div>● Document: <strong>{user?.aadhaarData?.idType || 'UIDAI Aadhaar Card'}</strong></div>
                    <div>● Legal Identity: <strong>{user?.aadhaarData?.maskedNumber || 'XXXX-XXXX-9842'}</strong></div>
                    <div>● Status: <strong style={{ color: '#10b981' }}>Government Authenticated Performer</strong></div>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Customers book artists who are verified. Verify your Aadhaar or Government ID to get the verified green shield badge on your profile and increase booking requests by 3x!
                  </p>
                )}
              </div>

              {/* Account Settings */}
              <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '1.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input className="form-input" value={user?.email} disabled style={{ opacity: 0.5 }} />
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    To update your stage photo, bio, pricing, or packages, use the <button onClick={() => handleTabChange('profile')} style={{ background: 'transparent', border: 'none', color: '#4285F4', cursor: 'pointer', fontWeight: 700 }}>My Profile</button> tab.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Cancel Modal */}
      {cancelModalBooking && (
        <CancelModal
          booking={cancelModalBooking}
          userRole="artist"
          onClose={() => setCancelModalBooking(null)}
          onSuccess={(updatedBooking) => {
            setBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
          }}
        />
      )}

      {/* Mutual Chat Modal */}
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

      {/* Aadhaar Verification Modal */}
      {showKycModal && (
        <AadhaarVerificationModal
          user={user}
          onClose={() => setShowKycModal(false)}
          onSuccess={(updatedUser) => {
            updateUser(updatedUser);
            if (artist) setArtist(prev => ({ ...prev, aadhaarVerified: true, verified: true }));
          }}
        />
      )}

      {/* Milestone Payment Modal */}
      {paymentModalData && (
        <MilestonePaymentModal
          booking={paymentModalData.booking}
          milestone={paymentModalData.milestone}
          onClose={() => setPaymentModalData(null)}
          onSuccess={(updatedBooking) => {
            setBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
            setPaymentModalData(null);
          }}
        />
      )}
    </div>
  );
}

// ── ARTIST BOOKING CARD WITH ACTIONS ─────────────────────────
function ArtistBookingCard({ booking, onUpdate, onCancel, onChat, onAcceptChat, onPay, currentUser, navigate }) {
  const [quotedPrice, setQuotedPrice] = useState(booking.quotedPrice ? String(booking.quotedPrice) : String(booking.budget || ''));
  const [artistNote, setArtistNote] = useState(booking.artistNote || '');
  const [showQuoteForm, setShowQuoteForm] = useState(false);

  useEffect(() => {
    setQuotedPrice(booking.quotedPrice ? String(booking.quotedPrice) : String(booking.budget || ''));
    setArtistNote(booking.artistNote || '');
  }, [booking.quotedPrice, booking.artistNote, booking.budget]);

  const isOutgoingBooking = booking.customerId === currentUser?.id && booking.artist?.userId !== currentUser?.id;
  const canQuote = !isOutgoingBooking && booking.status === 'requested';
  const canComplete = !isOutgoingBooking && booking.status === 'confirmed';
  const canCancel = ['requested', 'quoted', 'confirmed'].includes(booking.status);

  return (
    <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '18px', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
              {isOutgoingBooking ? (booking.artist?.displayName || 'Booked Artist') : (booking.customer?.name || 'Customer')}
            </span>
            {isOutgoingBooking ? (
              <span style={{ background: 'rgba(66, 133, 244, 0.12)', color: '#4285F4', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700 }}>
                You Booked This Talent
              </span>
            ) : (
              (booking.customer?.aadhaarVerified || booking.customer?.isVerified) && (
                <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', fontWeight: 700 }} title="Government ID Verified Legal Customer">
                  <ShieldCheck size={16} /> Verified Client
                </span>
              )
            )}
            <StatusBadge status={booking.status} />

            {/* Direct Chat Status Badges */}
            {booking.chatRequestedBy === 'customer' && !booking.chatEnabled && (
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
                <MessageSquare size={13} /> {booking.customer?.name || 'Client'} Requested Direct Chat!
              </span>
            )}

            {booking.chatRequestedBy === 'artist' && !booking.chatEnabled && (
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
                <Clock size={13} /> Chat Requested (Waiting for client)
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

            {/* Split payment indicators */}
            {booking.paymentStatus === 'advance_paid' && (
              <span style={{ fontSize: '0.7rem', fontWeight: 800, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', padding: '0.2rem 0.6rem', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle size={12} /> 50% Advance Received
              </span>
            )}
            {booking.paymentStatus === 'fully_paid' && (
              <span style={{ fontSize: '0.7rem', fontWeight: 800, background: 'rgba(16, 185, 129, 0.18)', color: '#10b981', padding: '0.2rem 0.6rem', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle size={12} /> 100% Fully Settled
              </span>
            )}
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <span>📅 {formatDate(booking.eventDate)}</span>
            <span>🎭 {booking.eventType}</span>
            <span>📍 {booking.eventLocation?.city || 'Location'}</span>
            <span>👥 {booking.audienceSize ? `~${booking.audienceSize} guests` : '—'}</span>
            <span>💰 Client Budget: {formatINR(booking.budget)}</span>
          </div>

          {booking.specialRequirements && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', background: 'var(--color-surface)', borderRadius: '8px', padding: '0.5rem 0.75rem', border: '1px solid var(--color-border)' }}>
              Client requirements: "{booking.specialRequirements}"
            </div>
          )}

          {booking.quotedPrice && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#BC4639', fontWeight: 700 }}>
              Quotation: {formatINR(booking.quotedPrice)} (Your Earnings: {formatINR(booking.artistEarnings || Math.round(booking.quotedPrice * 0.85))})
            </div>
          )}

          {booking.cancelReason && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#ef4444', fontStyle: 'italic' }}>
              Cancellation reason: "{booking.cancelReason}"
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Chat Button with Mutual Request Awareness */}
          {booking.chatRequestedBy === 'customer' && !booking.chatEnabled ? (
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
              title={`Accept ${booking.customer?.name || 'client'}'s chat request to start direct messaging`}
            >
              <CheckCircle size={14} />
              Accept Chat Request
            </button>
          ) : booking.chatRequestedBy === 'artist' && !booking.chatEnabled ? (
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={onChat}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.35)' }}
              title="You requested a direct chat. Waiting for client to accept."
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

          {/* Outgoing Client Actions: Pay Advance or Balance */}
          {isOutgoingBooking && booking.status === 'quoted' && onPay && (
            <button 
              className="btn btn-primary btn-sm" 
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', borderColor: '#10b981', fontWeight: 800 }} 
              onClick={() => onPay(booking, 'advance')}
            >
              Pay 50% Advance ({formatINR(booking.advanceAmount || Math.round((booking.quotedPrice || booking.budget) * 0.5))})
            </button>
          )}

          {isOutgoingBooking && booking.status === 'completed' && booking.paymentStatus === 'advance_paid' && onPay && (
            <button 
              className="btn btn-primary btn-sm" 
              style={{ background: 'linear-gradient(135deg, #4285F4, #BC4639)', fontWeight: 800 }} 
              onClick={() => onPay(booking, 'balance')}
            >
              Pay Remaining 50% Balance
            </button>
          )}

          {canQuote && (
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <button 
                className="btn btn-primary btn-sm" 
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', borderColor: '#10b981', fontWeight: 800 }}
                onClick={() => onUpdate(booking.id, 'quoted', { quotedPrice: Number(booking.budget), artistNote: 'Accepted at client budget. Excited to perform!' })}
                title={`Accept booking request at client's offered budget of ${formatINR(booking.budget)}`}
              >
                <CheckCircle size={14} /> Accept Request ({formatINR(booking.budget)})
              </button>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => setShowQuoteForm(!showQuoteForm)}
              >
                {showQuoteForm ? 'Close Quote Form' : 'Send Custom Quote'}
              </button>
            </div>
          )}

          {canComplete && (
            <button className="btn btn-primary btn-sm" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', borderColor: '#10b981' }} onClick={() => onUpdate(booking.id, 'completed')}>
              Mark Complete
            </button>
          )}

          {canCancel && (
            <button 
              className="btn btn-secondary btn-sm" 
              style={{ color: '#ef4444', borderColor: '#ef4444' }} 
              onClick={onCancel}
            >
              Cancel / Decline
            </button>
          )}
        </div>
      </div>

      {showQuoteForm && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', animation: 'fadeIn 0.2s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Your Quotation (₹)</label>
              <input className="form-input" type="number" placeholder="e.g. 48000" value={quotedPrice} onChange={e => setQuotedPrice(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Note to Client</label>
              <input className="form-input" type="text" placeholder="e.g. Ready with 3 hours of hits!" value={artistNote} onChange={e => setArtistNote(e.target.value)} />
            </div>
          </div>
          {quotedPrice && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Client will pay 50% advance ({formatINR(Math.round(Number(quotedPrice) * 0.5))}) before performance. You earn: {formatINR(Math.round(Number(quotedPrice) * 0.85))} after 15% platform commission.
            </div>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => { if (!quotedPrice) return toast.error('Enter a quote amount.'); onUpdate(booking.id, 'quoted', { quotedPrice: Number(quotedPrice), artistNote }); setShowQuoteForm(false); }}>
            Send Quotation to Client
          </button>
        </div>
      )}
    </div>
  );
}

// ── PROFILE EDITOR ───────────────────────────────────────────
const STANDARD_CATEGORIES = ['Singer', 'Band', 'Dancer', 'DJ', 'Comedian', 'Cultural Troupe', 'Instrumentalist', 'Magician'];

function ArtistProfileEditor({ artist, setArtist, navigate }) {
  const [form, setForm] = useState({
    displayName: artist?.displayName || '',
    category: artist?.category || 'Singer',
    startingPrice: artist?.startingPrice || 30000,
    city: artist?.city || '',
    bio: artist?.bio || '',
    image: artist?.image || '',
    genres: Array.isArray(artist?.genres) ? artist.genres.join(', ') : (artist?.genres || ''),
    languages: Array.isArray(artist?.languages) ? artist.languages.join(', ') : (artist?.languages || ''),
    tags: Array.isArray(artist?.tags) ? artist.tags.join(', ') : (artist?.tags || ''),
  });
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (artist) {
      const isCustom = artist.category && !STANDARD_CATEGORIES.includes(artist.category);
      if (isCustom) {
        setIsCustomCategory(true);
        setCustomCategory(artist.category);
      }
      setForm({
        displayName: artist.displayName || '',
        category: artist.category || 'Singer',
        startingPrice: artist.startingPrice || 30000,
        city: artist.city || '',
        bio: artist.bio || '',
        image: artist.image || '',
        genres: Array.isArray(artist.genres) ? artist.genres.join(', ') : (artist.genres || ''),
        languages: Array.isArray(artist.languages) ? artist.languages.join(', ') : (artist.languages || ''),
        tags: Array.isArray(artist.tags) ? artist.tags.join(', ') : (artist.tags || ''),
      });
    }
  }, [artist]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      return toast.error('Please select an image file (JPEG, PNG, WEBP).');
    }
    if (file.size > 8 * 1024 * 1024) {
      return toast.error('Image is too large. Please select an image under 8MB.');
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress & scale to max 800x800 for optimal MongoDB storage and rapid load speed
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        setForm((prev) => ({ ...prev, image: dataUrl }));
        toast.success('Photo ready! Click "Save Changes" to store permanently in MongoDB Atlas.');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setLoading(true);
    try {
      const resolvedCategory = (isCustomCategory && customCategory.trim()) ? customCategory.trim() : form.category;
      const payload = {
        ...form,
        category: resolvedCategory,
        startingPrice: Number(form.startingPrice) || 0,
        genres: typeof form.genres === 'string' ? form.genres.split(',').map(s => s.trim()).filter(Boolean) : form.genres,
        languages: typeof form.languages === 'string' ? form.languages.split(',').map(s => s.trim()).filter(Boolean) : form.languages,
        tags: typeof form.tags === 'string' ? form.tags.split(',').map(s => s.trim()).filter(Boolean) : form.tags,
      };
      const { data } = await artistsAPI.updateMyProfile(payload);
      setArtist(data.artist);
      toast.success('Artist profile updated successfully!');
    } catch {
      toast.error('Failed to update artist profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: '680px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>My Artist Profile</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Manage how your talent, performance rates, and bio appear to event clients.</p>
        </div>
        {artist?.id && (
          <button 
            type="button" 
            className="btn btn-secondary btn-sm" 
            onClick={() => navigate(`/artists/${artist.id}`)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Eye size={14} /> Preview Live Page
          </button>
        )}
      </div>

      <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
        {/* Profile Image & Avatar Preview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            {form.image ? (
              <img 
                src={form.image} 
                alt="Profile Preview" 
                style={{ width: '74px', height: '74px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #4285F4', boxShadow: 'var(--shadow-sm)' }} 
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&q=80'; }}
              />
            ) : (
              <div style={{ width: '74px', height: '74px', borderRadius: '50%', background: 'linear-gradient(135deg, #4285F4, #BC4639)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.5rem', fontWeight: 800 }}>
                {form.displayName?.[0]?.toUpperCase() || 'A'}
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <label className="form-label" style={{ marginBottom: '0.35rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Profile Photo</span>
              <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>● Stored permanently in MongoDB Atlas</span>
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input 
                className="form-input" 
                placeholder="Paste Image URL (Unsplash, Cloudinary, etc.)"
                value={form.image?.startsWith('data:') ? 'Image selected from device' : (form.image || '')} 
                onChange={e => setForm(p => ({ ...p, image: e.target.value }))} 
                style={{ flex: 1 }}
              />
              <label 
                className="btn btn-secondary btn-sm" 
                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap', padding: '0.55rem 0.85rem' }}
                title="Upload image from your computer or phone"
              >
                <Upload size={14} />
                <span>Upload File</span>
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              </label>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>Upload directly from device or paste a web image link. Persists permanently in your database across restarts.</span>
          </div>
        </div>

        {/* Display Name */}
        <div className="form-group">
          <label className="form-label">Display Name / Band Name</label>
          <input className="form-input" value={form.displayName || ''} onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))} placeholder="e.g. The Acoustic Trio / Pandit Raghav" />
        </div>

        {/* Category & Pricing */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Category</label>
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
                value={form.category || 'Singer'}
                onChange={e => {
                  if (e.target.value === '__custom__') {
                    setIsCustomCategory(true);
                  } else {
                    setForm(p => ({ ...p, category: e.target.value }));
                  }
                }}
              >
                {STANDARD_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="__custom__">✨ Other / Custom Category...</option>
              </select>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Starting Price (₹)</label>
            <input className="form-input" type="number" value={form.startingPrice || ''} onChange={e => setForm(p => ({ ...p, startingPrice: Number(e.target.value) }))} />
          </div>
        </div>

        {/* City */}
        <div className="form-group">
          <label className="form-label">Base City</label>
          <input className="form-input" value={form.city || ''} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} placeholder="e.g. Hyderabad, Chennai, Bengaluru, Mumbai" />
        </div>

        {/* Genres & Languages */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="form-label">Genres (comma-separated)</label>
            <input className="form-input" value={form.genres || ''} onChange={e => setForm(p => ({ ...p, genres: e.target.value }))} placeholder="Rock, Pop, Acoustic, Fusion" />
          </div>
          <div className="form-group">
            <label className="form-label">Languages (comma-separated)</label>
            <input className="form-input" value={form.languages || ''} onChange={e => setForm(p => ({ ...p, languages: e.target.value }))} placeholder="Telugu, Hindi, English, Tamil" />
          </div>
        </div>

        {/* Bio */}
        <div className="form-group">
          <label className="form-label">Bio & Performance Pitch</label>
          <textarea className="form-textarea" rows={4} value={form.bio || ''} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} placeholder="Tell clients about your stage experience, signature sets, and memorable concerts..." />
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
          <button className="btn btn-primary" onClick={save} disabled={loading}>
            {loading ? 'Saving Profile...' : 'Save Profile Changes'}
          </button>
          {artist?.id && (
            <button type="button" className="btn btn-secondary" onClick={() => navigate(`/artists/${artist.id}`)}>
              View Public Listing
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── AVAILABILITY MANAGER ─────────────────────────────────────
function AvailabilityManager({ artist, setArtist }) {
  const [unavailableDates, setUnavailableDates] = useState(artist?.unavailableDates || []);
  const [dateInput, setDateInput] = useState('');
  const [loading, setLoading] = useState(false);

  const addDate = () => {
    if (!dateInput) return;
    if (unavailableDates.includes(dateInput)) return toast.error('Date already marked.');
    setUnavailableDates([...unavailableDates, dateInput].sort());
    setDateInput('');
  };

  const removeDate = (d) => {
    setUnavailableDates(unavailableDates.filter(x => x !== d));
  };

  const save = async () => {
    setLoading(true);
    try {
      await artistsAPI.updateAvailability({ unavailableDates });
      setArtist(p => ({ ...p, unavailableDates }));
      toast.success('Availability calendar updated!');
    } catch {
      toast.error('Failed to update calendar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: '580px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Calendar Availability</h1>
      <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Block out dates when you are already booked or unavailable so clients don't double-book you.</p>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <input className="form-input" type="date" value={dateInput} onChange={e => setDateInput(e.target.value)} />
          <button className="btn btn-primary" type="button" onClick={addDate}>Block Date</button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {unavailableDates.length === 0 ? (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>You are currently available on all upcoming dates!</span>
          ) : (
            unavailableDates.map(d => (
              <span key={d} style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '8px', padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                {d}
                <button onClick={() => removeDate(d)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}>×</button>
              </span>
            ))
          )}
        </div>
        <button className="btn btn-primary" onClick={save} disabled={loading}>{loading ? 'Saving...' : 'Save Availability'}</button>
      </div>
    </div>
  );
}

// ── Artist Verification & Authentication Form Component ────────
function ArtistVerificationForm({ artist, setArtist }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tierRequested, setTierRequested] = useState(artist?.artistTier || 'emerging');
  const [formData, setFormData] = useState({
    legalName: artist?.verificationRecord?.legalName || artist?.displayName || '',
    idProofType: artist?.verificationRecord?.idProofType || 'Aadhaar (UIDAI)',
    idProofNumber: artist?.verificationRecord?.idProofNumber || '',
    instagram: artist?.verificationRecord?.officialLinks?.instagram || artist?.socialLinks?.instagram || '',
    youtube: artist?.verificationRecord?.officialLinks?.youtube || artist?.socialLinks?.youtube || '',
    spotify: artist?.verificationRecord?.officialLinks?.spotify || artist?.socialLinks?.spotify || '',
    website: artist?.verificationRecord?.officialLinks?.website || artist?.socialLinks?.website || '',
    pressArticles: Array.isArray(artist?.verificationRecord?.pressArticles) ? artist.verificationRecord.pressArticles.join('\n') : (artist?.verificationRecord?.pressArticles || ''),
    taxOrUtilityProof: artist?.verificationRecord?.taxOrUtilityProof || '',
    achievements: artist?.verificationRecord?.achievements || artist?.bio || '',
    portfolioDocs: Array.isArray(artist?.verificationRecord?.portfolioDocs) ? artist.verificationRecord.portfolioDocs.join('\n') : (artist?.verificationRecord?.portfolioDocs || ''),
    performanceReels: Array.isArray(artist?.verificationRecord?.performanceReels) ? artist.verificationRecord.performanceReels.join('\n') : (artist?.verificationRecord?.performanceReels || ''),
    managementContact: artist?.verificationRecord?.managementContact || '',
    confirmedAuthenticity: false,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (artist) {
      if (artist.artistTier) setTierRequested(artist.artistTier);
      const rec = artist.verificationRecord;
      setFormData(prev => ({
        ...prev,
        legalName: rec?.legalName || artist.displayName || prev.legalName,
        idProofType: rec?.idProofType || prev.idProofType || 'Aadhaar (UIDAI)',
        idProofNumber: rec?.idProofNumber !== undefined ? rec.idProofNumber : prev.idProofNumber,
        instagram: rec?.officialLinks?.instagram || artist.socialLinks?.instagram || prev.instagram,
        youtube: rec?.officialLinks?.youtube || artist.socialLinks?.youtube || prev.youtube,
        spotify: rec?.officialLinks?.spotify || artist.socialLinks?.spotify || prev.spotify,
        website: rec?.officialLinks?.website || artist.socialLinks?.website || prev.website,
        pressArticles: Array.isArray(rec?.pressArticles) ? rec.pressArticles.join('\n') : (rec?.pressArticles || prev.pressArticles),
        taxOrUtilityProof: rec?.taxOrUtilityProof !== undefined ? rec.taxOrUtilityProof : prev.taxOrUtilityProof,
        achievements: rec?.achievements || artist.bio || prev.achievements,
        portfolioDocs: Array.isArray(rec?.portfolioDocs) ? rec.portfolioDocs.join('\n') : (rec?.portfolioDocs || prev.portfolioDocs),
        performanceReels: Array.isArray(rec?.performanceReels) ? rec.performanceReels.join('\n') : (rec?.performanceReels || prev.performanceReels),
        managementContact: rec?.managementContact !== undefined ? rec.managementContact : prev.managementContact,
      }));
    }
  }, [artist]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.confirmedAuthenticity) {
      toast.error('Please confirm the declaration of genuine identity.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        verificationTrack: tierRequested === 'established' ? 'popular_celebrity' : 'regular',
        tierRequested,
        legalName: formData.legalName,
        idProofType: formData.idProofType,
        idProofNumber: formData.idProofNumber.trim(),
        taxOrUtilityProof: formData.taxOrUtilityProof.trim(),
        officialLinks: {
          instagram: formData.instagram.trim(),
          youtube: formData.youtube.trim(),
          spotify: formData.spotify.trim(),
          website: formData.website.trim(),
        },
        pressArticles: formData.pressArticles ? formData.pressArticles.split('\n').map(s => s.trim()).filter(Boolean) : [],
        achievements: formData.achievements.trim(),
        portfolioDocs: formData.portfolioDocs ? formData.portfolioDocs.split('\n').map(s => s.trim()).filter(Boolean) : [],
        performanceReels: formData.performanceReels ? formData.performanceReels.split('\n').map(s => s.trim()).filter(Boolean) : [],
        managementContact: formData.managementContact.trim(),
        statementOfAuthenticity: `Declared authentic legal representation for ${artist?.displayName}`,
      };

      const { data } = await artistsAPI.submitVerification(payload);
      if (data.artist) {
        setArtist(data.artist);
      }
      toast.success('Verification dossier submitted! Our Trust & Safety team will review your authenticity credentials.');
      setIsOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit verification application.');
    } finally {
      setSubmitting(false);
    }
  };

  const isUnderReview = artist?.verificationStatus === 'pending_review' || artist?.verificationStatus === 'under_review';
  const isNeedsInfo = artist?.verificationStatus === 'needs_info';
  const isRejected = artist?.verificationStatus === 'rejected';
  const isCelebrityVerified = artist?.verificationStatus === 'celebrity_verified';
  const isVerified = artist?.verificationStatus === 'verified';

  return (
    <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Shield size={16} color="var(--palette-blue)" /> Artist Verification & Anti-Impersonation Command
          </h3>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Authenticate official identity, submit notability evidence, and separate Famous Celebrities from Emerging Talent
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="btn btn-outline btn-sm"
          style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            borderColor: isRejected || isNeedsInfo ? '#ef4444' : isUnderReview ? '#f59e0b' : 'var(--color-border)',
            color: isRejected || isNeedsInfo ? '#ef4444' : isUnderReview ? '#f59e0b' : 'var(--text-primary)',
            background: isRejected ? 'rgba(239, 68, 68, 0.06)' : 'transparent',
          }}
        >
          {isOpen
            ? 'Close Form'
            : isRejected
            ? '🔄 Resubmit Rectified Application'
            : isNeedsInfo
            ? '📝 Update Application (Required)'
            : isUnderReview
            ? 'Update Application'
            : isCelebrityVerified || isVerified
            ? 'Update Authenticity Dossier'
            : 'Apply for Verification'}
        </button>
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)' }}>
          {isRejected && (
            <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '0.9rem 1.1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, color: '#ef4444', fontSize: '0.9rem' }}>
                ❌ Previous Application Was Rejected by Trust & Safety
              </div>
              <div style={{ marginTop: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Admin Decision Remarks: </strong>
                {artist?.adminVerificationNotes || 'Please verify your legal identity, official social presence, and authentic documents.'}
              </div>
              <div style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                You can rectify the information, upload valid links and documents below, and click "Submit Rectified Verification Dossier" to request a new review.
              </div>
            </div>
          )}

          {isNeedsInfo && (
            <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px', padding: '0.9rem 1.1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, color: '#f59e0b', fontSize: '0.9rem' }}>
                📝 Additional Information Requested by Admin
              </div>
              <div style={{ marginTop: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Officer Remarks: </strong>
                {artist?.adminVerificationNotes || 'Please provide updated links, performance reels, or proof.'}
              </div>
            </div>
          )}
          {/* Target Track */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Verification Track & Category Level</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setTierRequested('emerging')}
                style={{
                  padding: '0.85rem',
                  borderRadius: '12px',
                  border: tierRequested === 'emerging' ? '2px solid #06b6d4' : '1px solid var(--color-border)',
                  background: tierRequested === 'emerging' ? 'rgba(6,182,212,0.1)' : 'var(--color-surface)',
                  color: 'var(--text-primary)',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#06b6d4', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  🚀 Regular & Emerging Talent (Standard KYC)
                </div>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                  For rising singers, indie bands, campus favorites & DJs. Evaluated on Government ID, performance reels, and reviews.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTierRequested('established')}
                style={{
                  padding: '0.85rem',
                  borderRadius: '12px',
                  border: tierRequested === 'established' ? '2px solid #f59e0b' : '1px solid var(--color-border)',
                  background: tierRequested === 'established' ? 'rgba(245,158,11,0.1)' : 'var(--color-surface)',
                  color: 'var(--text-primary)',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  👑 Popular & Established Artist (Instagram-Style Blue Badge)
                </div>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                  For arena celebrities, renowned playback vocalists & public figures. Evaluated on 4 pillars: Authenticity, Uniqueness, Notability & Press.
                </div>
              </button>
            </div>
          </div>

          {/* Legal Identification */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Legal Full Name (Matching Government ID) *</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Official Name on Passport / Aadhaar"
                value={formData.legalName}
                onChange={e => setFormData(p => ({ ...p, legalName: e.target.value }))}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Government ID Type *</label>
              <select
                className="form-select"
                value={formData.idProofType}
                onChange={e => setFormData(p => ({ ...p, idProofType: e.target.value }))}
              >
                <option value="Aadhaar (UIDAI)">Aadhaar (UIDAI)</option>
                <option value="Passport">Passport</option>
                <option value="Voter ID">Voter ID</option>
                <option value="PAN Card">PAN Card</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">ID Document Number / Reference</label>
              <input
                className="form-input"
                type="text"
                placeholder="Last 4 digits or official reference"
                value={formData.idProofNumber}
                onChange={e => setFormData(p => ({ ...p, idProofNumber: e.target.value }))}
              />
            </div>
          </div>

          {/* Established Track Exclusive: Tax / Utility & Press Media */}
          {tierRequested === 'established' && (
            <div style={{ marginBottom: '1rem', background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '14px', padding: '1rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f59e0b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                👑 Enhanced Celebrity Evidence (Notability & Legal Presence)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Press Articles & Media Coverage (One URL / Title per line)</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    placeholder="e.g. Times of India interview link, Wikipedia page, film release press..."
                    value={formData.pressArticles}
                    onChange={e => setFormData(p => ({ ...p, pressArticles: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Utility Bill / GSTIN / Tax Record Reference</label>
                  <input
                    className="form-input"
                    placeholder="GSTIN registration, trade license, or business utility proof"
                    value={formData.taxOrUtilityProof}
                    onChange={e => setFormData(p => ({ ...p, taxOrUtilityProof: e.target.value }))}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
                    Protects celebrity identity and validates authorized direct booking.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Social Media & Official Channels */}
          <div style={{ marginBottom: '1rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.65rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Globe size={14} color="var(--palette-blue)" /> Official Social Media & Streaming Footprint
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Instagram Handle / Profile URL</label>
                <input
                  className="form-input"
                  placeholder="@yourhandle or instagram.com/..."
                  value={formData.instagram}
                  onChange={e => setFormData(p => ({ ...p, instagram: e.target.value }))}
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>YouTube Channel / Video</label>
                <input
                  className="form-input"
                  placeholder="youtube.com/@channel"
                  value={formData.youtube}
                  onChange={e => setFormData(p => ({ ...p, youtube: e.target.value }))}
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Spotify / Apple Music / Streaming URL</label>
                <input
                  className="form-input"
                  placeholder="Verified artist profile URL"
                  value={formData.spotify}
                  onChange={e => setFormData(p => ({ ...p, spotify: e.target.value }))}
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Official Website / Wikipedia</label>
                <input
                  className="form-input"
                  placeholder="https://officialwebsite.com"
                  value={formData.website}
                  onChange={e => setFormData(p => ({ ...p, website: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Achievements & Performance History */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">
              {tierRequested === 'established'
                ? 'Concert Venues, Arena Tours, Film Credits, Awards & High-Profile Achievements *'
                : 'Performance Experience, Live Gigs Completed & Musical Repertoire *'}
            </label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder={tierRequested === 'established'
                ? 'e.g. Headlined DY Patil Stadium (30k audience), Film Playback Singer for 12 major releases, National Film Award Winner 2024...'
                : 'e.g. Lead vocalist with 40+ wedding and corporate gigs across Hyderabad and Bangalore. Specialized in live Telugu & Hindi acoustic fusion...'}
              value={formData.achievements}
              onChange={e => setFormData(p => ({ ...p, achievements: e.target.value }))}
              required
            />
          </div>

          {/* Video Performance Reels */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Live Performance Video Reels (One URL per line)</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="https://youtube.com/watch?v=... (Link to live recording, stage reel, or acoustic session)"
              value={formData.performanceReels}
              onChange={e => setFormData(p => ({ ...p, performanceReels: e.target.value }))}
            />
          </div>

          {/* Management Contact */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Official Booking Management / Agency Contact (Optional)</label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. Manager: Ananya Rao (+91-9876543210, agency@talent.com)"
              value={formData.managementContact}
              onChange={e => setFormData(p => ({ ...p, managementContact: e.target.value }))}
            />
          </div>

          {/* Authenticity Declaration Checkbox */}
          <div style={{ background: 'rgba(66,133,244,0.06)', border: '1px solid rgba(66,133,244,0.25)', borderRadius: '12px', padding: '0.85rem', marginBottom: '1.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
              <input
                type="checkbox"
                checked={formData.confirmedAuthenticity}
                onChange={e => setFormData(p => ({ ...p, confirmedAuthenticity: e.target.checked }))}
                style={{ marginTop: '2px', accentColor: '#4285F4' }}
              />
              <span>
                <strong>Anti-Impersonation Legal Declaration:</strong> I solemnly declare that I am the authentic artist or authorized direct booking representative. I understand that impersonating public celebrities or using misleading identities results in immediate permanent ban and legal forfeiture.
              </span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !formData.confirmedAuthenticity}
              style={{
                background: isRejected ? '#ef4444' : undefined,
                borderColor: isRejected ? '#ef4444' : undefined,
              }}
            >
              {submitting
                ? 'Submitting Application...'
                : isRejected
                ? '🔄 Resubmit Rectified Application'
                : 'Submit Verification Dossier'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
