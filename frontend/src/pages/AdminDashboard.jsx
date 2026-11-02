// GoArts AI - Super Admin Command Center & Executive Analytics
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  BarChart2, Users, Calendar, DollarSign, Shield, CheckCircle, 
  XCircle, AlertTriangle, Eye, Search, Filter, RefreshCw, 
  TrendingUp, Award, Layers, Clock, LogOut, Check, ArrowUpRight,
  Sparkles, Activity, PieChart, Star, MapPin, ArrowRight, Sun, Moon,
  User, Lock, Key, Server, Database, ShieldCheck, CheckCircle2, ChevronRight,
  ExternalLink, FileText, Globe, CreditCard, Building2, HelpCircle, CheckSquare, MessageSquare, Crown
} from 'lucide-react';
import { Navbar, Spinner, StatusBadge, formatINR, formatDate, EmptyState } from '../components/shared';
import { adminAPI, authAPI } from '../lib/api';
import { useAuth } from '../context/useAuth';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'overview', label: 'Executive Analytics', icon: BarChart2 },
  { id: 'verifications', label: 'Artist Verification Queue', icon: ShieldCheck },
  { id: 'memberships', label: 'Memberships & Revenue', icon: Crown },
  { id: 'artists', label: 'Talent Management', icon: Award },
  { id: 'bookings', label: 'Booking Ledger', icon: Calendar },
  { id: 'customers', label: 'Client Accounts', icon: Users },
  { id: 'logs', label: 'Security & Audit', icon: Shield },
  { id: 'profile', label: 'Admin Profile & Security', icon: User },
];

const PERIODS = [
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: '90d', label: 'Last Quarter (90d)' },
  { id: 'all', label: 'All Time' },
];

// ── Interactive SVG Revenue & GMV Growth Chart ─────────────────
function InteractiveRevenueChart({ trends = [], metric = 'both', onHoverPoint, hoveredPoint }) {
  if (!trends || trends.length === 0) return null;

  const width = 760;
  const height = 240;
  const paddingX = 60;
  const paddingY = 35;

  const maxGmv = Math.max(...trends.map((t) => t.gmv || 0), 1000000);
  const maxRev = Math.max(...trends.map((t) => t.revenue || 0), 150000);

  const isRevenueOnly = metric === 'revenue';
  const getX = (index) => paddingX + (index * (width - paddingX * 2)) / Math.max(1, trends.length - 1);
  const getYForGmv = (val) => height - paddingY - ((val || 0) / maxGmv) * (height - paddingY * 2);
  const getYForRev = (val) => isRevenueOnly
    ? height - paddingY - ((val || 0) / maxRev) * (height - paddingY * 2)
    : height - paddingY - ((val || 0) / (maxGmv * 0.35)) * (height - paddingY * 2);

  // Polygonal paths
  const gmvPoints = trends.map((t, i) => `${getX(i)},${getYForGmv(t.gmv)}`);
  const gmvPath = `M ${gmvPoints.join(' L ')}`;
  const gmvArea = `${gmvPath} L ${getX(trends.length - 1)},${height - paddingY} L ${getX(0)},${height - paddingY} Z`;

  const revPoints = trends.map((t, i) => `${getX(i)},${getYForRev(t.revenue)}`);
  const revPath = `M ${revPoints.join(' L ')}`;
  const revArea = `${revPath} L ${getX(trends.length - 1)},${height - paddingY} L ${getX(0)},${height - paddingY} Z`;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', overflow: 'visible', display: 'block' }}
      >
        <defs>
          <linearGradient id="gmvAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4285F4" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#4285F4" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="revAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#BC4639" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#BC4639" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal Gridlines */}
        {[0, 0.33, 0.66, 1].map((pct, i) => {
          const y = height - paddingY - pct * (height - paddingY * 2);
          return (
            <g key={i}>
              <line
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="var(--color-border)"
                strokeDasharray="4 4"
              />
              <text
                x={paddingX - 12}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="var(--text-muted)"
                fontFamily="monospace"
              >
                {isRevenueOnly
                  ? `₹${Math.round((maxRev * pct) / 1000)}k`
                  : `₹${Math.round((maxGmv * pct) / 100000)}L`}
              </text>
            </g>
          );
        })}

        {/* GMV Area & Line */}
        {(metric === 'both' || metric === 'gmv') && (
          <>
            <path d={gmvArea} fill="url(#gmvAreaGrad)" />
            <path
              d={gmvPath}
              fill="none"
              stroke="#4285F4"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}

        {/* Revenue Area & Line */}
        {(metric === 'both' || metric === 'revenue') && (
          <>
            <path d={revArea} fill="url(#revAreaGrad)" />
            <path
              d={revPath}
              fill="none"
              stroke="#BC4639"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}

        {/* Interactive Data points */}
        {trends.map((item, i) => {
          const x = getX(i);
          const yGmv = getYForGmv(item.gmv);
          const yRev = getYForRev(item.revenue);
          const isHovered = hoveredPoint?.month === item.month;

          return (
            <g key={item.month}>
              {/* Vertical Guide when hovered */}
              {isHovered && (
                <line
                  x1={x}
                  y1={paddingY}
                  x2={x}
                  y2={height - paddingY}
                  stroke="#4285F4"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
              )}

              {/* GMV Point */}
              {(metric === 'both' || metric === 'gmv') && (
                <circle
                  cx={x}
                  cy={yGmv}
                  r={isHovered ? 7 : 4.5}
                  fill="#4285F4"
                  stroke="var(--color-card)"
                  strokeWidth={isHovered ? 3 : 1.5}
                />
              )}

              {/* Revenue Point */}
              {(metric === 'both' || metric === 'revenue') && (
                <circle
                  cx={x}
                  cy={yRev}
                  r={isHovered ? 6.5 : 4}
                  fill="#BC4639"
                  stroke="var(--color-card)"
                  strokeWidth={isHovered ? 3 : 1.5}
                />
              )}

              {/* Month label */}
              <text
                x={x}
                y={height - 10}
                textAnchor="middle"
                fontSize="11"
                fontWeight={isHovered ? '700' : '500'}
                fill={isHovered ? 'var(--palette-blue)' : 'var(--text-muted)'}
              >
                {item.month}
              </text>

              {/* Wide invisible rectangle for comfortable hover detection */}
              <rect
                x={x - (width / trends.length) / 2}
                y={0}
                width={width / trends.length}
                height={height}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => onHoverPoint(item)}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Dedicated Administrator Profile & Governance Tab ───────────
function AdminProfileTab({ user, updateUser, overview }) {
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Strong password checks
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSymbol = /[@$!%*?&#_\-+=~^()[\]{}|:;,.<>]/.test(newPassword);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSymbol;

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await authAPI.updateMe({ name: name.trim(), phone: phone.trim() });
      if (updateUser) updateUser(data.user);
      toast.success('Admin profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!isPasswordValid) {
      return toast.error('Please meet all strong password requirements.');
    }
    if (newPassword !== confirmPassword) {
      return toast.error('Passwords do not match.');
    }
    setSavingPassword(true);
    try {
      await authAPI.updateMe({ password: newPassword });
      toast.success('Admin password rotated successfully with enterprise encryption!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.25s ease', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* Super Admin Identity Hero */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(66, 133, 244, 0.12), rgba(188, 70, 57, 0.12))',
        border: '1px solid var(--color-border)',
        borderRadius: '24px',
        padding: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: '76px',
            height: '76px',
            borderRadius: '22px',
            background: 'linear-gradient(135deg, #4285F4, #BC4639)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            fontWeight: 800,
            color: '#fff',
            boxShadow: '0 8px 24px rgba(66, 133, 244, 0.35)'
          }}>
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {user?.name || 'GoArts Administrator'}
              </h2>
              <span style={{
                background: 'linear-gradient(135deg, #4285F4, #BC4639)',
                color: '#fff',
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '0.2rem 0.65rem',
                borderRadius: '999px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Super Admin
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
              {user?.email} • Root Governance & Financial Authority
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>🛡️ Full Platform Access</span>
              <span>🍃 MongoDB Compass Attached</span>
              <span>🔐 Multi-Role Uniqueness Active</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--color-card)', padding: '0.85rem 1.25rem', borderRadius: '16px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total GMV Supervised</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4285F4' }}>{formatINR(overview?.grossBookingValue || 0)}</div>
          </div>
          <div style={{ background: 'var(--color-card)', padding: '0.85rem 1.25rem', borderRadius: '16px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Active Talent Acts</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>{overview?.totalArtists || 18} Acts</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        
        {/* Profile Contact Details */}
        <div style={{
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          borderRadius: '20px',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <User size={20} color="#4285F4" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Administrator Profile
            </h3>
          </div>

          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Admin Full Name"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Official Email (Root Identity)</label>
              <input
                className="form-input"
                type="email"
                value={user?.email || ''}
                disabled
                style={{ opacity: 0.7, cursor: 'not-allowed', background: 'var(--color-surface)' }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                Admin email is locked to system root authority.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                className="form-input"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91-9000000000"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="btn btn-primary"
              style={{ marginTop: '0.5rem', fontWeight: 700 }}
            >
              {savingProfile ? 'Saving Changes...' : 'Update Admin Info'}
            </button>
          </form>
        </div>

        {/* Strong Password Change & Security */}
        <div style={{
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          borderRadius: '20px',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <Key size={20} color="#BC4639" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Rotate Admin Password
            </h3>
          </div>

          <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">New Strong Password</label>
              <input
                className="form-input"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Include symbols, numbers, upper/lower"
                required
              />
            </div>

            {/* Visual criteria checklist */}
            {newPassword && (
              <div style={{
                background: 'var(--color-deep)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                fontSize: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem'
              }}>
                <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Password Strength:</div>
                <div style={{ color: hasMinLength ? '#10b981' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {hasMinLength ? '✓' : '○'} At least 8 characters
                </div>
                <div style={{ color: hasUpper ? '#10b981' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {hasUpper ? '✓' : '○'} At least one uppercase letter (A-Z)
                </div>
                <div style={{ color: hasLower ? '#10b981' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {hasLower ? '✓' : '○'} At least one lowercase letter (a-z)
                </div>
                <div style={{ color: hasNumber ? '#10b981' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {hasNumber ? '✓' : '○'} At least one number (0-9)
                </div>
                <div style={{ color: hasSymbol ? '#10b981' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {hasSymbol ? '✓' : '○'} At least one symbol or underscore (@, #, $, _, !)
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                className="form-input"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={savingPassword || (newPassword && !isPasswordValid)}
              className="btn btn-primary"
              style={{
                marginTop: '0.5rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #BC4639, #5C2018)',
                borderColor: '#BC4639'
              }}
            >
              {savingPassword ? 'Encrypting...' : 'Rotate Admin Password'}
            </button>
          </form>
        </div>

      </div>

      {/* System Architecture & Platform Governance Card */}
      <div style={{
        background: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        borderRadius: '20px',
        padding: '1.75rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <Database size={20} color="#10b981" />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Platform Infrastructure & Governance Matrix
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {[
            {
              title: 'Database Engine',
              desc: 'MongoDB Compass Local Cluster',
              uri: 'mongodb://localhost:27017/goarts',
              status: 'Connected & Live',
              color: '#10b981'
            },
            {
              title: 'Escrow Milestone Protocol',
              desc: '50% Advance on Acceptance / 50% Balance on Completion',
              uri: 'Milestone Gate Enforced',
              status: 'Active',
              color: '#4285F4'
            },
            {
              title: 'Aadhaar Identity Policy',
              desc: 'Role-Based UIDAI Hash Verification (1 Customer / 1 Artist max)',
              uri: 'Duplicate Role Guard Active',
              status: 'Enforced',
              color: '#BC4639'
            },
            {
              title: 'Multi-Tab Session Security',
              desc: 'Isolated sessionStorage architecture with zero cross-tab token overwrites',
              uri: 'Tab Independence Active',
              status: 'Protected',
              color: '#8b5cf6'
            }
          ].map((item) => (
            <div key={item.title} style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '14px',
              padding: '1.1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{item.title}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: item.color, background: `${item.color}15`, padding: '0.15rem 0.5rem', borderRadius: '999px' }}>
                  {item.status}
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem', lineHeight: 1.4 }}>
                {item.desc}
              </p>
              <code style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--color-deep)', padding: '0.2rem 0.4rem', borderRadius: '6px', display: 'block', wordBreak: 'break-all' }}>
                {item.uri}
              </code>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default function AdminDashboard() {
  const { user, logout, updateUser } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');

  // Overview stats & Period state
  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [chartMetric, setChartMetric] = useState('both');
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [isReseeding, setIsReseeding] = useState(false);

  // Artist tab state
  const [artists, setArtists] = useState([]);
  const [artistSummary, setArtistSummary] = useState(null);
  const [artistStatusFilter, setArtistStatusFilter] = useState('all');
  const [artistTierFilter, setArtistTierFilter] = useState('all');
  const [artistSearch, setArtistSearch] = useState('');
  const [loadingArtists, setLoadingArtists] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [selectedArtistForGovernance, setSelectedArtistForGovernance] = useState(null);
  const [govTier, setGovTier] = useState('emerging');
  const [govVerifStatus, setGovVerifStatus] = useState('verified');
  const [govNotes, setGovNotes] = useState('');
  const [savingGovernance, setSavingGovernance] = useState(false);

  // Verification tab state
  const [verifications, setVerifications] = useState([]);
  const [verifCounts, setVerifCounts] = useState(null);
  const [verifFilter, setVerifFilter] = useState('all');
  const [verifTrackFilter, setVerifTrackFilter] = useState('all');
  const [loadingVerifications, setLoadingVerifications] = useState(false);
  const [selectedVerifForAudit, setSelectedVerifForAudit] = useState(null);
  const [auditDecisionStatus, setAuditDecisionStatus] = useState('approved');
  const [auditDecisionTier, setAuditDecisionTier] = useState('established');
  const [auditDecisionLevel, setAuditDecisionLevel] = useState('celebrity_verified');
  const [verifReviewNotes, setVerifReviewNotes] = useState('');
  const [submittingAudit, setSubmittingAudit] = useState(false);

  // Bookings tab state
  const [bookings, setBookings] = useState([]);
  const [ledgerSummary, setLedgerSummary] = useState(null);
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [bookingSearch, setBookingSearch] = useState('');
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [selectedBookingForLedger, setSelectedBookingForLedger] = useState(null);

  // Customers tab state
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Audit logs tab state
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Memberships & Subscriptions state
  const [memberships, setMemberships] = useState([]);
  const [membershipMetrics, setMembershipMetrics] = useState(null);
  const [loadingMemberships, setLoadingMemberships] = useState(false);
  const [membershipFilter, setMembershipFilter] = useState('all');
  const [membershipSearch, setMembershipSearch] = useState('');
  const [selectedMembershipForReview, setSelectedMembershipForReview] = useState(null);
  const [membershipDecisionStatus, setMembershipDecisionStatus] = useState('active');
  const [membershipReviewNotes, setMembershipReviewNotes] = useState('');
  const [submittingMembershipReview, setSubmittingMembershipReview] = useState(false);

  // Synchronize activeTab with URL search params when changed from navbar
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Update URL on tab change
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  // ── Fetchers ──────────────────────────────────────────────────
  const fetchOverview = useCallback(async (periodToFetch = selectedPeriod) => {
    setLoadingOverview(true);
    try {
      const { data } = await adminAPI.overview({ period: periodToFetch });
      setOverview(data);
      if (data.monthlyTrends && data.monthlyTrends.length > 0) {
        setHoveredPoint(data.monthlyTrends[data.monthlyTrends.length - 1]);
      }
    } catch {
      toast.error('Failed to load system metrics.');
    } finally {
      setLoadingOverview(false);
    }
  }, [selectedPeriod]);

  const handlePeriodChange = (pId) => {
    setSelectedPeriod(pId);
    fetchOverview(pId);
  };

  const handleReseed = async () => {
    setIsReseeding(true);
    try {
      await adminAPI.reseed();
      toast.success('Live database reseeded with Anirudh Band, Poorna Dance & analytics!');
      await fetchOverview();
      await fetchArtists();
      await fetchBookings();
    } catch {
      toast.error('Failed to reseed database.');
    } finally {
      setIsReseeding(false);
    }
  };

  const fetchArtists = useCallback(async () => {
    setLoadingArtists(true);
    try {
      const params = {};
      if (artistStatusFilter !== 'all') params.status = artistStatusFilter;
      if (artistTierFilter !== 'all') params.tier = artistTierFilter;
      if (artistSearch) params.search = artistSearch;
      const { data } = await adminAPI.artists(params);
      setArtists(data.artists || []);
      setArtistSummary(data.summary || null);
    } catch {
      toast.error('Failed to load artists.');
    } finally {
      setLoadingArtists(false);
    }
  }, [artistStatusFilter, artistTierFilter, artistSearch]);

  const fetchBookings = useCallback(async () => {
    setLoadingBookings(true);
    try {
      const params = {};
      if (bookingStatusFilter !== 'all') params.status = bookingStatusFilter;
      if (bookingSearch) params.search = bookingSearch;
      const { data } = await adminAPI.bookings(params);
      setBookings(data.bookings || []);
      setLedgerSummary(data.summary || null);
    } catch {
      toast.error('Failed to load booking transactions.');
    } finally {
      setLoadingBookings(false);
    }
  }, [bookingStatusFilter, bookingSearch]);

  const fetchCustomers = useCallback(async () => {
    setLoadingCustomers(true);
    try {
      const { data } = await adminAPI.customers();
      setCustomers(data.customers || []);
    } catch {
      toast.error('Failed to load customers.');
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const { data } = await adminAPI.auditLogs();
      setAuditLogs(data.auditLogs || data.logs || []);
    } catch {
      toast.error('Failed to load audit trail.');
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  const fetchMemberships = useCallback(async () => {
    setLoadingMemberships(true);
    try {
      const { data } = await adminAPI.memberships();
      setMemberships(data.memberships || []);
      setMembershipMetrics(data.metrics || null);
    } catch {
      toast.error('Failed to load membership subscriptions.');
    } finally {
      setLoadingMemberships(false);
    }
  }, []);

  const fetchVerifications = useCallback(async (filterToFetch = verifFilter, trackToFetch = verifTrackFilter) => {
    setLoadingVerifications(true);
    try {
      const params = {};
      if (filterToFetch !== 'all') params.status = filterToFetch;
      if (trackToFetch !== 'all') params.tier = trackToFetch;
      const { data } = await adminAPI.verifications(params);
      setVerifications(data.verifications || []);
      setVerifCounts(data.counts || null);
    } catch {
      toast.error('Failed to load verification applications.');
    } finally {
      setLoadingVerifications(false);
    }
  }, [verifFilter, verifTrackFilter]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    if (activeTab === 'verifications') fetchVerifications(verifFilter);
    else if (activeTab === 'memberships') fetchMemberships();
    else if (activeTab === 'artists') fetchArtists();
    else if (activeTab === 'bookings') fetchBookings();
    else if (activeTab === 'customers') fetchCustomers();
    else if (activeTab === 'logs') fetchAuditLogs();
  }, [activeTab, verifFilter, fetchVerifications, fetchMemberships, fetchArtists, fetchBookings, fetchCustomers, fetchAuditLogs]);

  // ── Actions ───────────────────────────────────────────────────
  const handleAuditDecisionSubmit = async () => {
    if (!selectedVerifForAudit) return;
    setSubmittingAudit(true);
    try {
      await adminAPI.reviewVerification(selectedVerifForAudit.id, {
        status: auditDecisionStatus,
        artistTier: auditDecisionTier,
        verificationLevel: auditDecisionLevel,
        adminNotes: verifReviewNotes,
      });
      toast.success(
        auditDecisionStatus === 'approved'
          ? `✓ Verification Approved as ${auditDecisionLevel === 'celebrity_verified' ? '👑 Verified Popular Artist' : '🛡️ Regular KYC Verified'}!`
          : auditDecisionStatus === 'needs_info'
          ? '📝 Additional information requested from artist.'
          : '✕ Verification application decision recorded.'
      );
      setSelectedVerifForAudit(null);
      setVerifReviewNotes('');
      fetchVerifications();
      fetchArtists();
      fetchOverview();
      fetchAuditLogs();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit verification decision.');
    } finally {
      setSubmittingAudit(false);
    }
  };

  const handleSaveGovernance = async () => {
    if (!selectedArtistForGovernance) return;
    setSavingGovernance(true);
    try {
      const effectiveVerif = (govTier === 'emerging' && govVerifStatus === 'celebrity_verified') ? 'verified' : govVerifStatus;
      await adminAPI.updateArtistTier(selectedArtistForGovernance.id, {
        artistTier: govTier,
        verificationStatus: effectiveVerif,
        adminNotes: govNotes,
      });
      toast.success(`Artist updated to ${govTier === 'established' ? '👑 Famous & Established' : '🚀 Emerging Talent'} (${effectiveVerif}).`);
      setSelectedArtistForGovernance(null);
      setGovNotes('');
      fetchArtists();
      fetchOverview();
      fetchAuditLogs();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update governance settings.');
    } finally {
      setSavingGovernance(false);
    }
  };

  const handleMembershipReviewSubmit = async () => {
    if (!selectedMembershipForReview) return;
    setSubmittingMembershipReview(true);
    try {
      await adminAPI.reviewMembership(selectedMembershipForReview.id, {
        status: membershipDecisionStatus,
        adminNotes: membershipReviewNotes,
      });
      toast.success(
        membershipDecisionStatus === 'active'
          ? `✓ Membership successfully activated for ${selectedMembershipForReview.userName}! Tier privileges unlocked.`
          : '✕ Membership application rejected.'
      );
      setSelectedMembershipForReview(null);
      setMembershipReviewNotes('');
      fetchMemberships();
      fetchOverview();
      fetchAuditLogs();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to process membership review.');
    } finally {
      setSubmittingMembershipReview(false);
    }
  };

  const handleUpdateArtistStatus = async (artistId, newStatus) => {
    try {
      await adminAPI.updateArtistStatus(artistId, { status: newStatus });
      toast.success(`Artist status updated to ${newStatus}.`);
      fetchArtists();
      fetchOverview();
      if (selectedArtist?.id === artistId) {
        setSelectedArtist((prev) => ({ ...prev, status: newStatus }));
      }
    } catch {
      toast.error('Failed to update status.');
    }
  };

  const handleUpdateCustomerStatus = async (customerId, newStatus) => {
    try {
      await adminAPI.updateCustomerStatus(customerId, { status: newStatus });
      toast.success(`User status updated to ${newStatus}.`);
      fetchCustomers();
    } catch {
      toast.error('Failed to update user status.');
    }
  };

  const handleReviewCustomerKyc = async (customerId, status) => {
    try {
      await adminAPI.reviewCustomerKyc(customerId, {
        status,
        adminNotes: status === 'approved' ? 'Verified by GoArts Admin' : 'ID proof did not match official records',
      });
      toast.success(`Customer Aadhaar KYC ${status === 'approved' ? 'Approved' : 'Rejected'}.`);
      fetchCustomers();
      fetchOverview();
      fetchAuditLogs();
    } catch {
      toast.error('Failed to update customer KYC status.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-midnight)', color: 'var(--text-primary)' }}>
      <Navbar />

      <main style={{ paddingTop: '85px', paddingBottom: '4rem' }}>
        <div className="container">
          
          {/* Top Admin Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            padding: '1.5rem 0',
            borderBottom: '1px solid var(--color-border)',
            marginBottom: '2rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span className="badge" style={{ background: 'rgba(66, 133, 244, 0.12)', color: '#4285F4', border: '1px solid rgba(66, 133, 244, 0.25)', fontWeight: 700 }}>
                  Super Admin
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Logged in as {user?.email}</span>
              </div>
              <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--text-primary)' }}>
                GoArts Command Center
              </h1>
            </div>

            {/* Quick Actions, Theme Toggle & Reseed */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {verifCounts?.pending > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('verifications')}
                  style={{
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    color: '#f59e0b',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    padding: '0.45rem 0.85rem',
                    borderRadius: '999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    cursor: 'pointer',
                  }}
                  title="Click to audit pending artist verification applications"
                >
                  <ShieldCheck size={14} color="#f59e0b" />
                  <span>{verifCounts.pending} Verification {verifCounts.pending === 1 ? 'Audit' : 'Audits'} Pending</span>
                </button>
              )}

              <button
                id="btn-admin-theme-toggle"
                onClick={toggleTheme}
                className="theme-toggle-btn"
                title={isDark ? "Switch to Peaceful Light Theme" : "Switch to Peaceful Dark Theme"}
                aria-label="Toggle theme"
              >
                {isDark ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#4285F4" />}
              </button>

              <button
                id="btn-reseed-data"
                onClick={handleReseed}
                disabled={isReseeding}
                className="btn btn-secondary btn-sm"
                style={{ borderColor: 'var(--color-border)', color: 'var(--text-primary)' }}
                title="Force refresh database with real Anirudh Band, Poorna Dance & Sid Sriram"
              >
                <RefreshCw size={14} className={isReseeding ? 'animate-spin' : ''} color="#4285F4" />
                {isReseeding ? 'Reseeding...' : 'Reload Live Talent & Seed'}
              </button>
            </div>

            {/* Navigation Tabs */}
            <div style={{
              display: 'flex',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '4px',
              overflowX: 'auto',
              gap: '4px',
              width: '100%',
              boxShadow: 'var(--shadow-sm)'
            }}>
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  id={`admin-tab-${id}`}
                  onClick={() => handleTabChange(id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 1.1rem',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    background: activeTab === id ? 'linear-gradient(135deg, #4285F4, #BC4639)' : 'transparent',
                    color: activeTab === id ? '#ffffff' : 'var(--text-secondary)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Icon size={15} />
                  {label}
                  {id === 'artists' && overview?.pendingArtists > 0 && (
                    <span style={{ 
                      background: '#BC4639', 
                      color: 'white', 
                      borderRadius: '999px', 
                      padding: '1px 6px', 
                      fontSize: '0.7rem', 
                      fontWeight: 700 
                    }}>
                      {overview.pendingArtists}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* TAB 1: EXECUTIVE ANALYTICS */}
          {activeTab === 'overview' && (
            <div style={{ animation: 'fadeIn 0.25s ease' }}>
              
              {/* Period Selector & Filter Bar */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                background: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                padding: '0.85rem 1.25rem',
                marginBottom: '1.75rem',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Activity size={18} color="#4285F4" />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Performance Window:</span>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {PERIODS.map((p) => (
                      <button
                        key={p.id}
                        id={`filter-period-${p.id}`}
                        onClick={() => handlePeriodChange(p.id)}
                        style={{
                          padding: '0.35rem 0.85rem',
                          borderRadius: '8px',
                          border: selectedPeriod === p.id ? 'none' : '1px solid var(--color-border)',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          background: selectedPeriod === p.id ? 'linear-gradient(135deg, #4285F4, #BC4639)' : 'var(--color-surface)',
                          color: selectedPeriod === p.id ? '#ffffff' : 'var(--text-primary)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  Live Syncing • Growth {overview?.growthRate || '+34.6%'}
                </div>
              </div>

              {loadingOverview ? (
                <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                  <Spinner size={40} center />
                  <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Aggregating platform metrics...</p>
                </div>
              ) : overview ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  
                  {/* KPI Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.25rem' }}>
                    
                    {/* Gross Booking Value */}
                    <div style={{
                      background: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '18px',
                      padding: '1.35rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(66, 133, 244, 0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4285F4' }}>
                        <DollarSign size={26} />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Gross Booking Value</span>
                        <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0' }}>{formatINR(overview.grossBookingValue)}</h3>
                        <span style={{ fontSize: '0.72rem', color: '#4285F4', fontWeight: 600 }}>Active & Executed Shows</span>
                      </div>
                    </div>

                    {/* Platform Revenue (15%) */}
                    <div style={{
                      background: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '18px',
                      padding: '1.35rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(188, 70, 57, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#BC4639' }}>
                        <TrendingUp size={26} />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Platform Commission (15%)</span>
                        <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0' }}>{formatINR(overview.platformRevenue)}</h3>
                        <span style={{ fontSize: '0.72rem', color: '#BC4639', fontWeight: 600 }}>Net Retained Take-Rate</span>
                      </div>
                    </div>

                    {/* Average Deal Size */}
                    <div style={{
                      background: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '18px',
                      padding: '1.35rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(212, 165, 154, 0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#BC4639' }}>
                        <Sparkles size={26} />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Average Deal Size</span>
                        <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0' }}>{formatINR(overview.avgDealSize || 450000)}</h3>
                        <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>High-Ticket Concerts</span>
                      </div>
                    </div>

                    {/* Bookings & Conversion */}
                    <div style={{
                      background: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '18px',
                      padding: '1.35rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(66, 133, 244, 0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4285F4' }}>
                        <Calendar size={26} />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Total Bookings</span>
                        <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0' }}>{overview.totalBookings} Shows</h3>
                        <span style={{ fontSize: '0.72rem', color: '#4285F4', fontWeight: 600 }}>
                          {overview.funnel?.conversionRate || 74}% Conversion Ratio
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* INTERACTIVE CHART SUITE: REVENUE & GMV PROGRESSION */}
                  <div style={{
                    background: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '24px',
                    padding: '1.75rem',
                    boxShadow: 'var(--shadow-md)'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      marginBottom: '1.25rem',
                      borderBottom: '1px solid var(--color-border)',
                      paddingBottom: '1rem'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <TrendingUp size={20} color="#4285F4" />
                          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            Interactive GMV & Net Revenue Trajectory
                          </h2>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '3px' }}>
                          Hover along the timeline to inspect gross platform volume vs 15% net commission
                        </p>
                      </div>

                      {/* Metric Toggle Buttons */}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {[
                          { id: 'both', label: 'All Curves' },
                          { id: 'gmv', label: 'GMV (Gross)' },
                          { id: 'revenue', label: '15% Net Rev' },
                        ].map((m) => (
                          <button
                            key={m.id}
                            id={`chart-metric-${m.id}`}
                            onClick={() => setChartMetric(m.id)}
                            style={{
                              padding: '0.35rem 0.85rem',
                              borderRadius: '8px',
                              border: chartMetric === m.id ? 'none' : '1px solid var(--color-border)',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              background: chartMetric === m.id ? 'linear-gradient(135deg, #4285F4, #BC4639)' : 'var(--color-surface)',
                              color: chartMetric === m.id ? '#ffffff' : 'var(--text-primary)',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Active Month Tooltip Preview Card */}
                    {hoveredPoint && (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '1rem',
                        background: 'var(--color-deep)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '14px',
                        padding: '0.85rem 1.25rem',
                        marginBottom: '1.25rem',
                        animation: 'fadeIn 0.2s ease'
                      }}>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Inspected Month</span>
                          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>{hoveredPoint.month}</div>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: '#4285F4', textTransform: 'uppercase', fontWeight: 700 }}>Gross Booking Value</span>
                          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#4285F4' }}>{formatINR(hoveredPoint.gmv)}</div>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: '#BC4639', textTransform: 'uppercase', fontWeight: 700 }}>Platform 15% Share</span>
                          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#BC4639' }}>{formatINR(hoveredPoint.revenue)}</div>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: '#10b981', textTransform: 'uppercase', fontWeight: 700 }}>Completed Shows</span>
                          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>{hoveredPoint.completed} / {hoveredPoint.bookings} Shows</div>
                        </div>
                      </div>
                    )}

                    {/* The Interactive SVG Chart */}
                    <InteractiveRevenueChart
                      trends={overview.monthlyTrends}
                      metric={chartMetric}
                      onHoverPoint={(point) => setHoveredPoint(point)}
                      hoveredPoint={hoveredPoint}
                    />

                    {/* Chart Legend */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#4285F4' }} />
                        <span>Gross Booking Value (GMV)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#BC4639' }} />
                        <span>Platform Commission (15%)</span>
                      </div>
                    </div>
                  </div>

                  {/* TOP TALENT LEADERBOARD (Featuring Real Stars like Anirudh Band, Poorna Dance, Sid Sriram) */}
                  <div style={{
                    background: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '24px',
                    padding: '1.75rem',
                    boxShadow: 'var(--shadow-md)'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                      marginBottom: '1.5rem',
                      borderBottom: '1px solid var(--color-border)',
                      paddingBottom: '1rem'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Award size={20} color="#4285F4" />
                          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            Top Performing Talent Leaderboard
                          </h2>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '3px' }}>
                          Ranked by Gross Booking Volume, Show Completion Rate & Customer Satisfaction
                        </p>
                      </div>

                      <button
                        onClick={() => handleTabChange('artists')}
                        className="btn btn-secondary btn-sm"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--text-primary)' }}
                      >
                        View Full Roster <ArrowRight size={14} />
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                      {(overview.topTalent || []).map((artist, idx) => (
                        <div
                          key={artist.id}
                          style={{
                            background: 'var(--color-surface)',
                            border: idx === 0 ? '1px solid #4285F4' : '1px solid var(--color-border)',
                            borderRadius: '16px',
                            padding: '1.2rem',
                            display: 'flex',
                            gap: '1rem',
                            position: 'relative',
                            transition: 'all 0.2s ease',
                            boxShadow: 'var(--shadow-sm)'
                          }}
                        >
                          {/* Rank Badge */}
                          <div style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            background: idx === 0 ? 'linear-gradient(135deg, #4285F4, #BC4639)' : 'var(--color-deep)',
                            color: idx === 0 ? '#ffffff' : 'var(--text-primary)',
                            border: idx === 0 ? 'none' : '1px solid var(--color-border)',
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 800
                          }}>
                            #{idx + 1}
                          </div>

                          <img
                            src={artist.image}
                            alt={artist.displayName}
                            style={{
                              width: '74px',
                              height: '74px',
                              borderRadius: '14px',
                              objectFit: 'cover',
                              border: '1px solid var(--color-border)'
                            }}
                          />

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                                {artist.category}
                              </span>
                              {artist.verified && (
                                <span style={{ background: '#4285F4', borderRadius: '50%', width: '14px', height: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Check size={9} color="white" strokeWidth={3} />
                                </span>
                              )}
                            </div>

                            <h4 style={{
                              fontSize: '0.98rem',
                              fontWeight: 700,
                              color: 'var(--text-primary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              margin: '2px 0 4px'
                            }}>
                              {artist.displayName}
                            </h4>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <MapPin size={11} color="var(--text-muted)" /> {artist.city}
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#4285F4', fontWeight: 700 }}>
                                <Star size={11} fill="#4285F4" color="#4285F4" /> {artist.rating} ({artist.reviewCount})
                              </span>
                            </div>

                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              background: 'var(--color-deep)',
                              borderRadius: '8px',
                              padding: '0.4rem 0.65rem',
                              fontSize: '0.75rem'
                            }}>
                              <div>
                                <span style={{ color: 'var(--text-muted)' }}>GMV: </span>
                                <strong style={{ color: 'var(--text-primary)' }}>{formatINR(artist.gmv || 0)}</strong>
                              </div>
                              <div>
                                <span style={{ color: 'var(--text-muted)' }}>15% Take: </span>
                                <strong style={{ color: '#BC4639' }}>{formatINR(artist.platformContribution || 0)}</strong>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* BOOKING CONVERSION FUNNEL & CATEGORY SHARE */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
                    
                    {/* Interactive Booking Conversion Funnel */}
                    <div style={{
                      background: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '20px',
                      padding: '1.5rem',
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                        <Activity size={18} color="#4285F4" />
                        Booking Conversion Funnel
                      </h3>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[
                          { label: 'Event Inquiries Initiated', value: overview.funnel?.inquiries || 32, pct: 100, color: '#4285F4' },
                          { label: 'Quotes & Pricing Dispatched', value: overview.funnel?.quoted || 26, pct: Math.round(((overview.funnel?.quoted || 26) / (overview.funnel?.inquiries || 32)) * 100), color: '#BC4639' },
                          { label: 'Bookings Confirmed & Escrowed', value: overview.funnel?.confirmed || 18, pct: Math.round(((overview.funnel?.confirmed || 18) / (overview.funnel?.inquiries || 32)) * 100), color: '#D4A59A' },
                          { label: 'Completed Shows & Payouts', value: overview.funnel?.completed || 12, pct: Math.round(((overview.funnel?.completed || 12) / (overview.funnel?.inquiries || 32)) * 100), color: '#10b981' },
                        ].map((stage, i) => (
                          <div key={stage.label}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{stage.label}</span>
                              <span style={{ color: stage.color, fontWeight: 700 }}>
                                {stage.value} ({stage.pct}%)
                              </span>
                            </div>
                            <div style={{ height: '8px', background: 'var(--color-deep)', borderRadius: '999px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${stage.pct}%`, background: stage.color, borderRadius: '999px', transition: 'width 0.4s ease' }} />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div style={{
                        marginTop: '1.5rem',
                        padding: '0.85rem',
                        borderRadius: '12px',
                        background: 'rgba(66, 133, 244, 0.08)',
                        border: '1px solid rgba(66, 133, 244, 0.2)',
                        fontSize: '0.8rem',
                        color: 'var(--text-primary)'
                      }}>
                        💡 <strong>Funnel Insight:</strong> High-ticket arena bookings (Anirudh Band, DSP Band) have an exceptional <strong>85% quote-to-confirmation rate</strong> due to verified reputation and escrow transparency.
                      </div>
                    </div>

                    {/* Category Distribution by Talent & GMV */}
                    <div style={{
                      background: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '20px',
                      padding: '1.5rem',
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                        <Layers size={18} color="#BC4639" />
                        Discipline Share & Roster Density
                      </h3>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        {Object.entries(overview.categoryDist || {}).map(([cat, count], i) => {
                          const pct = Math.round((count / (overview.totalArtists || 1)) * 100);
                          const colors = ['#4285F4', '#BC4639', '#D4A59A', '#5C2018', '#6ba2f7'];
                          const color = colors[i % colors.length];
                          return (
                            <div key={cat}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cat}</span>
                                <span style={{ color: 'var(--text-muted)' }}>{count} Acts ({pct}%)</span>
                              </div>
                              <div style={{ height: '7px', background: 'var(--color-deep)', borderRadius: '999px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '999px' }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* City Footprint Summary */}
                      <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                          Key Urban Footprints
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                          {Object.entries(overview.cityDist || {}).map(([city, count]) => (
                            <span key={city} className="badge badge-sandstone" style={{ fontSize: '0.72rem' }}>
                              {city}: {count} acts
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* ADVANCED VISUALIZATIONS: ESCROW MILESTONES & AADHAAR IDENTITY INTEGRITY */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
                    
                    {/* Escrow Milestone & Split Payment Health */}
                    <div style={{
                      background: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '24px',
                      padding: '1.75rem',
                      boxShadow: 'var(--shadow-md)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <ShieldCheck size={22} color="#10b981" />
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            Escrow Milestone & Split Payment Health
                          </h3>
                        </div>
                        <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', fontWeight: 700, fontSize: '0.72rem' }}>
                          50/50 Protected
                        </span>
                      </div>

                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                        Escrow gate enforces zero upfront payment on booking submission. Clients deposit <strong>50% Advance</strong> only after the talent accepts/quotes, and release the remaining <strong>50% Balance</strong> upon performance completion.
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                        <div style={{ background: 'var(--color-deep)', borderRadius: '14px', padding: '1rem', border: '1px solid var(--color-border)' }}>
                          <span style={{ fontSize: '0.72rem', color: '#4285F4', textTransform: 'uppercase', fontWeight: 700 }}>50% Advance In Escrow</span>
                          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                            {formatINR(overview.totalEscrowAdvanceCollected || Math.round(overview.grossBookingValue * 0.5))}
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Artist Accepted & Locked</span>
                        </div>

                        <div style={{ background: 'var(--color-deep)', borderRadius: '14px', padding: '1rem', border: '1px solid var(--color-border)' }}>
                          <span style={{ fontSize: '0.72rem', color: '#10b981', textTransform: 'uppercase', fontWeight: 700 }}>50% Balance Settled</span>
                          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                            {formatINR(overview.totalEscrowBalanceSettled || Math.round(overview.grossBookingValue * 0.42))}
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Shows Successfully Completed</span>
                        </div>
                      </div>

                      {/* Visual Milestone Stages */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Stage 1: Booking Request</span>
                          <span style={{ fontWeight: 700, color: '#f59e0b' }}>₹0 Required (Artist Review)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Stage 2: Artist Accepted</span>
                          <span style={{ fontWeight: 700, color: '#4285F4' }}>50% Advance Unlocked & Escrowed</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Stage 3: Event Completed</span>
                          <span style={{ fontWeight: 700, color: '#10b981' }}>50% Balance Released · 15% Platform Take</span>
                        </div>
                      </div>
                    </div>

                    {/* Aadhaar Identity & Role-Based Trust Matrix */}
                    <div style={{
                      background: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '24px',
                      padding: '1.75rem',
                      boxShadow: 'var(--shadow-md)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <Shield size={22} color="#BC4639" />
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            Aadhaar KYC & Trust Integrity
                          </h3>
                        </div>
                        <span className="badge" style={{ background: 'rgba(188, 70, 57, 0.12)', color: '#BC4639', fontWeight: 700, fontSize: '0.72rem' }}>
                          Role-Isolated Hash
                        </span>
                      </div>

                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                        UIDAI SHA-256 verification enforces that <strong>no 2 customer accounts</strong> and <strong>no 2 artist accounts</strong> can share an Aadhaar, while allowing 1 legitimate individual to maintain both a client and performer account.
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                        <div style={{ background: 'var(--color-deep)', borderRadius: '14px', padding: '1rem', border: '1px solid var(--color-border)' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Verified Performers</span>
                          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#BC4639', marginTop: '2px' }}>
                            {overview.verifiedArtistsCount || overview.totalArtists || 0} Acts
                          </div>
                          <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>Unique Artist Aadhaars</span>
                        </div>

                        <div style={{ background: 'var(--color-deep)', borderRadius: '14px', padding: '1rem', border: '1px solid var(--color-border)' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Verified Clients</span>
                          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4285F4', marginTop: '2px' }}>
                            {overview.verifiedCustomersCount || overview.totalCustomers || 0} Clients
                          </div>
                          <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>Unique Client Aadhaars</span>
                        </div>
                      </div>

                      <div style={{
                        background: 'var(--color-surface)',
                        borderRadius: '12px',
                        padding: '0.85rem 1rem',
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        fontSize: '0.78rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981' }}>
                          <CheckCircle2 size={14} />
                          <span>Same Aadhaar permitted across distinct roles (1 Performer + 1 Client)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444' }}>
                          <XCircle size={14} />
                          <span>Duplicate Aadhaar strictly blocked within the same role category (HTTP 409)</span>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>
              ) : null}
            </div>
          )}

          {/* TAB 1.5: ARTIST VERIFICATION & ANTI-IMPERSONATION QUEUE */}
          {activeTab === 'verifications' && (
            <div style={{ animation: 'fadeIn 0.25s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={22} color="#4285F4" /> Artist Verification & Anti-Impersonation Command
                  </h2>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Instagram-style authenticity verification for celebrities (Arijit Singh, Virat Kohli) & streamlined KYC for emerging talent.
                  </p>
                </div>
                <button onClick={() => fetchVerifications(verifFilter)} className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <RefreshCw size={14} /> Refresh Queue
                </button>
              </div>

              {/* Track Filters */}
              <div style={{
                background: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                padding: '0.75rem 1rem',
                marginBottom: '0.75rem',
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap',
                boxShadow: 'var(--shadow-sm)',
                alignItems: 'center',
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginRight: '0.25rem' }}>Track:</span>
                {[
                  { id: 'all', label: `All Tracks (${verifCounts?.total || verifications.length})` },
                  { id: 'established', label: `👑 Famous & Established (${verifCounts?.establishedClaims || 0})` },
                  { id: 'emerging', label: `🚀 Emerging Talent (${verifCounts?.emergingTalent || 0})` },
                  { id: 'customer', label: `📋 Client KYC (${verifCounts?.customerKyc || 0})` },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setVerifTrackFilter(t.id);
                      fetchVerifications(verifFilter, t.id);
                    }}
                    style={{
                      padding: '0.35rem 0.85rem',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: verifTrackFilter === t.id ? 'linear-gradient(135deg, #4285F4, #BC4639)' : 'var(--color-surface)',
                      color: verifTrackFilter === t.id ? '#ffffff' : 'var(--text-secondary)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Status Filters */}
              <div style={{
                background: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                padding: '0.85rem 1rem',
                marginBottom: '1.5rem',
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap',
                boxShadow: 'var(--shadow-sm)',
                alignItems: 'center',
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginRight: '0.25rem' }}>Status:</span>
                {[
                  { id: 'all', label: `All Statuses` },
                  { id: 'pending', label: `⏳ Pending Audit (${verifCounts?.pending || 0})` },
                  { id: 'under_review', label: `🔍 Under Investigation (${verifCounts?.under_review || 0})` },
                  { id: 'needs_info', label: `📝 Additional Info Required (${verifCounts?.needs_info || 0})` },
                  { id: 'approved', label: `✓ Approved (${verifCounts?.approved || 0})` },
                  { id: 'rejected', label: `✕ Rejected (${verifCounts?.rejected || 0})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setVerifFilter(f.id);
                      fetchVerifications(f.id, verifTrackFilter);
                    }}
                    style={{
                      padding: '0.4rem 0.9rem',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: verifFilter === f.id ? 'linear-gradient(135deg, #4285F4, #BC4639)' : 'var(--color-surface)',
                      color: verifFilter === f.id ? '#ffffff' : 'var(--text-secondary)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {loadingVerifications ? (
                <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '3rem', textAlign: 'center' }}>
                  <Spinner size={36} center />
                  <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading verification applications...</p>
                </div>
              ) : verifications.length === 0 ? (
                <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '3rem 2rem', textAlign: 'center' }}>
                  <CheckCircle2 size={42} color="#10b981" style={{ margin: '0 auto 1rem' }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Queue is Clean!</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '450px', margin: '0 auto' }}>
                    No applications currently match this status filter.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {verifications.map((v) => {
                    const isEstablishedTrack = v.tierRequested === 'established' || v.verificationTrack === 'popular_celebrity';
                    return (
                      <div
                        key={v.id}
                        style={{
                          background: 'var(--color-card)',
                          border: isEstablishedTrack ? '1px solid rgba(245,158,11,0.3)' : '1px solid var(--color-border)',
                          borderRadius: '20px',
                          padding: '1.5rem',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                      >
                        {/* Header Row */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <img
                              src={v.artistImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(v.artistDisplayName || 'Artist')}&background=4285F4&color=fff`}
                              alt="Avatar"
                              style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: isEstablishedTrack ? '2px solid #f59e0b' : '2px solid #06b6d4' }}
                            />
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                                  {v.artistDisplayName}
                                </h3>
                                <span style={{ fontSize: '0.72rem', background: 'rgba(66,133,244,0.12)', color: '#4285F4', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
                                  {v.artistCategory}
                                </span>
                                {v.artistTier === 'established' && (
                                  <span style={{ fontSize: '0.72rem', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
                                    👑 Famous & Established
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                Legal Name: <strong style={{ color: 'var(--text-primary)' }}>{v.legalName || '—'}</strong> • Email: <strong style={{ color: 'var(--text-primary)' }}>{v.userEmail || '—'}</strong> • Phone: <strong style={{ color: 'var(--text-primary)' }}>{v.userPhone || '—'}</strong>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                padding: '0.35rem 0.85rem',
                                borderRadius: '999px',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                background: isEstablishedTrack ? 'rgba(245,158,11,0.15)' : 'rgba(6,182,212,0.15)',
                                color: isEstablishedTrack ? '#f59e0b' : '#06b6d4',
                                border: '1px solid currentColor',
                              }}
                            >
                              Track: {v.isCustomer ? '📋 Client Aadhaar KYC' : isEstablishedTrack ? '👑 Popular Celebrity (Instagram Blue Badge)' : '🚀 Emerging Talent (Standard KYC)'}
                            </span>

                            <span
                              style={{
                                padding: '0.35rem 0.85rem',
                                borderRadius: '999px',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                background:
                                  v.status === 'approved'
                                    ? 'rgba(16,185,129,0.15)'
                                    : v.status === 'rejected'
                                    ? 'rgba(239,68,68,0.15)'
                                    : v.status === 'needs_info'
                                    ? 'rgba(239,68,68,0.15)'
                                    : 'rgba(245,158,11,0.15)',
                                color:
                                  v.status === 'approved'
                                    ? '#10b981'
                                    : v.status === 'rejected'
                                    ? '#ef4444'
                                    : v.status === 'needs_info'
                                    ? '#ef4444'
                                    : '#f59e0b',
                                border: '1px solid currentColor',
                              }}
                            >
                              {v.status === 'approved'
                                ? '✓ Approved'
                                : v.status === 'rejected'
                                ? '✕ Rejected'
                                : v.status === 'needs_info'
                                ? '📝 Additional Info Required'
                                : v.status === 'under_review'
                                ? '🔍 Under Investigation'
                                : '⏳ Pending Review'}
                            </span>
                          </div>
                        </div>

                        {/* 4 Pillars Authenticity Status for Established / Popular Track */}
                        {isEstablishedTrack && (
                          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '0.85rem 1rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
                            <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <ShieldCheck size={15} color="#4285F4" /> 4-Pillar Instagram-Style Authenticity Evaluation Matrix:
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.6rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: v.legalName ? '#10b981' : '#f59e0b' }}>
                                {v.legalName ? '✓' : '○'} <strong>1. Authenticity:</strong> {v.legalName ? `Legal: ${v.legalName}` : 'Needs Govt ID'}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981' }}>
                                ✓ <strong>2. Uniqueness:</strong> Protected Stage Persona
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: v.pressArticles?.length > 0 || v.achievements ? '#10b981' : '#f59e0b' }}>
                                {v.pressArticles?.length > 0 || v.achievements ? '✓' : '○'} <strong>3. Notability:</strong> {v.pressArticles?.length ? `${v.pressArticles.length} Press Links` : 'Concert History'}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: v.officialLinks?.spotify || v.officialLinks?.instagram ? '#10b981' : '#f59e0b' }}>
                                {v.officialLinks?.spotify || v.officialLinks?.instagram ? '✓' : '○'} <strong>4. Public Presence:</strong> {v.officialLinks?.instagram ? 'Verified Channels' : 'Links Submitted'}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Submitted Evidence Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '1rem', marginBottom: '1.25rem', fontSize: '0.82rem' }}>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                              Official Social Footprint
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              {v.officialLinks?.instagram && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  📸 <a href={v.officialLinks.instagram.startsWith('http') ? v.officialLinks.instagram : `https://instagram.com/${v.officialLinks.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" style={{ color: '#4285F4', fontWeight: 600 }}>
                                    {v.officialLinks.instagram} <ExternalLink size={11} style={{ display: 'inline' }} />
                                  </a>
                                </div>
                              )}
                              {v.officialLinks?.spotify && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  🎵 <a href={v.officialLinks.spotify} target="_blank" rel="noreferrer" style={{ color: '#10b981', fontWeight: 600 }}>
                                    Spotify Artist Profile <ExternalLink size={11} style={{ display: 'inline' }} />
                                  </a>
                                </div>
                              )}
                              {v.officialLinks?.youtube && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  ▶️ <a href={v.officialLinks.youtube} target="_blank" rel="noreferrer" style={{ color: '#ef4444', fontWeight: 600 }}>
                                    YouTube Channel <ExternalLink size={11} style={{ display: 'inline' }} />
                                  </a>
                                </div>
                              )}
                              {v.officialLinks?.website && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  🌐 <a href={v.officialLinks.website} target="_blank" rel="noreferrer" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                                    Official Website <ExternalLink size={11} style={{ display: 'inline' }} />
                                  </a>
                                </div>
                              )}
                              {!v.officialLinks?.instagram && !v.officialLinks?.spotify && !v.officialLinks?.youtube && !v.officialLinks?.website && (
                                <span style={{ color: 'var(--text-muted)' }}>No social handles submitted</span>
                              )}
                            </div>
                          </div>

                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                              {isEstablishedTrack ? 'Press Coverage & Notability' : 'Performance Experience'}
                            </div>
                            {isEstablishedTrack && v.pressArticles?.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginBottom: '0.5rem' }}>
                                {v.pressArticles.slice(0, 3).map((art, idx) => (
                                  <div key={idx} style={{ color: '#4285F4', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                    📰 {art}
                                  </div>
                                ))}
                              </div>
                            ) : null}
                            <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.4, maxHeight: '60px', overflowY: 'auto' }}>
                              {v.achievements || 'No past performance records entered.'}
                            </p>
                          </div>

                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                              Identity & Legal Validation
                            </div>
                            <div style={{ color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                              <div>Govt ID: <strong>{v.idProofType || 'Aadhaar (UIDAI)'}</strong> {v.idProofNumber ? `(#${v.idProofNumber})` : ''}</div>
                              {v.taxOrUtilityProof && <div>Tax/Utility: <strong>{v.taxOrUtilityProof}</strong></div>}
                              <div>Management: <strong>{v.managementContact || 'Self-Represented'}</strong></div>
                              {v.performanceReels?.length > 0 && <div>Reels: <strong>{v.performanceReels.length} live video(s)</strong></div>}
                            </div>
                          </div>
                        </div>

                        {/* Recent Admin Audit Remarks */}
                        {v.adminNotes && (
                          <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '0.65rem 0.85rem', marginBottom: '1.25rem', fontSize: '0.8rem' }}>
                            <strong>Admin Remarks / Audit History:</strong> {v.adminNotes}
                          </div>
                        )}

                        {/* Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedVerifForAudit(v);
                              setAuditDecisionStatus('approved');
                              setAuditDecisionTier(v.tierRequested || 'established');
                              setAuditDecisionLevel(v.tierRequested === 'established' ? 'celebrity_verified' : 'verified');
                              setVerifReviewNotes(v.adminNotes || '');
                            }}
                            className="btn btn-primary btn-sm"
                            style={{ fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                          >
                            <ShieldCheck size={14} /> Audit Dossier & Decide
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedVerifForAudit(v);
                              setAuditDecisionStatus('needs_info');
                              setVerifReviewNotes(v.adminNotes || 'Please upload official Spotify artist URL and utility/tax proof.');
                            }}
                            className="btn btn-outline btn-sm"
                            style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.4)', fontWeight: 700 }}
                          >
                            📝 Request Info
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: MEMBERSHIPS & REVENUE GOVERNANCE */}
          {activeTab === 'memberships' && (
            <div style={{ animation: 'fadeIn 0.25s ease' }}>
              {/* Header Title */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Crown size={26} color="#f59e0b" /> Memberships & Subscription Governance
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                    Verify payment transaction proofs (UPI/Card/NetBanking/Escrow) and unlock tier privileges for Elite, Pro, and Basic members in real time.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fetchMemberships}
                  disabled={loadingMemberships}
                  className="btn btn-outline btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
                >
                  <RefreshCw size={14} className={loadingMemberships ? 'spin' : ''} /> Refresh Ledger
                </button>
              </div>

              {/* KPI Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
                <div style={{ background: 'var(--color-card)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '16px', padding: '1.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#10b981', textTransform: 'uppercase', fontWeight: 800 }}>Monthly Recurring Revenue</span>
                  <div style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                    {formatINR(membershipMetrics?.mrr || 0)}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>From active verified subscriptions</span>
                </div>

                <div style={{ background: 'var(--color-card)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: '16px', padding: '1.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#f59e0b', textTransform: 'uppercase', fontWeight: 800 }}>Pending Review</span>
                  <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#f59e0b', marginTop: '0.25rem' }}>
                    {membershipMetrics?.pending || 0}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Awaiting admin payment verification</span>
                </div>

                <div style={{ background: 'var(--color-card)', border: '1px solid rgba(66,133,244,0.3)', borderRadius: '16px', padding: '1.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#4285F4', textTransform: 'uppercase', fontWeight: 800 }}>Active Members</span>
                  <div style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                    {membershipMetrics?.active || 0}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current active subscriptions</span>
                </div>

                <div style={{ background: 'var(--color-card)', border: '1px solid rgba(188,70,57,0.3)', borderRadius: '16px', padding: '1.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#BC4639', textTransform: 'uppercase', fontWeight: 800 }}>👑 Elite Tier VIPs</span>
                  <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#BC4639', marginTop: '0.25rem' }}>
                    {membershipMetrics?.elite || 0}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Full AI Growth suite unlocked</span>
                </div>
              </div>

              {/* Filter and Search Bar */}
              <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {[
                    { id: 'all', label: 'All Subscriptions' },
                    { id: 'pending', label: `Pending Review (${memberships.filter(m => m.status === 'pending').length})` },
                    { id: 'active', label: `Active (${memberships.filter(m => m.status === 'active').length})` },
                    { id: 'rejected', label: `Rejected (${memberships.filter(m => m.status === 'rejected').length})` },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setMembershipFilter(f.id)}
                      style={{
                        padding: '0.45rem 0.9rem',
                        borderRadius: '20px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: membershipFilter === f.id ? 700 : 500,
                        background: membershipFilter === f.id ? '#4285F4' : 'var(--color-surface)',
                        color: membershipFilter === f.id ? '#ffffff' : 'var(--text-secondary)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div style={{ position: 'relative', minWidth: '240px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search by member, email, or UTR..."
                    value={membershipSearch}
                    onChange={(e) => setMembershipSearch(e.target.value)}
                    style={{
                      paddingLeft: '2.2rem',
                      paddingRight: '0.75rem',
                      paddingTop: '0.45rem',
                      paddingBottom: '0.45rem',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-surface)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      width: '100%',
                    }}
                  />
                </div>
              </div>

              {/* Subscriptions List */}
              {loadingMemberships ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                  <Spinner size="lg" />
                </div>
              ) : (() => {
                const filtered = memberships.filter((m) => {
                  if (membershipFilter !== 'all' && m.status !== membershipFilter) return false;
                  if (membershipSearch.trim()) {
                    const q = membershipSearch.toLowerCase();
                    const matchUser = (m.userName || '').toLowerCase().includes(q);
                    const matchEmail = (m.userEmail || '').toLowerCase().includes(q);
                    const matchRef = (m.transactionRef || '').toLowerCase().includes(q);
                    const matchPlan = (m.planName || '').toLowerCase().includes(q);
                    if (!matchUser && !matchEmail && !matchRef && !matchPlan) return false;
                  }
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <EmptyState
                      icon={Crown}
                      title="No Membership Applications Found"
                      description="No subscription records match your selected filter criteria. When users subscribe, their payment proofs will appear here for verification."
                    />
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filtered.map((m) => {
                      const isPending = m.status === 'pending';
                      const isActive = m.status === 'active';
                      const isRejected = m.status === 'rejected';

                      const planBadgeColor = 
                        m.planId === 'elite' ? { bg: 'rgba(188,70,57,0.12)', text: '#BC4639', border: '#BC4639' } :
                        m.planId === 'pro' ? { bg: 'rgba(66,133,244,0.12)', text: '#4285F4', border: '#4285F4' } :
                        { bg: 'rgba(16,185,129,0.12)', text: '#10b981', border: '#10b981' };

                      return (
                        <div
                          key={m.id}
                          style={{
                            background: 'var(--color-card)',
                            border: `1px solid ${isPending ? 'rgba(245,158,11,0.5)' : 'var(--color-border)'}`,
                            borderRadius: '16px',
                            padding: '1.25rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            transition: 'border-color 0.2s ease',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                            {/* Member Details */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #4285F4, #BC4639)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '1.1rem'
                              }}>
                                {(m.userName || 'M').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                                    {m.userName || 'Member'}
                                  </h3>
                                  <span style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '6px',
                                    textTransform: 'uppercase',
                                    background: m.userRole === 'artist' ? 'rgba(66,133,244,0.12)' : 'rgba(16,185,129,0.12)',
                                    color: m.userRole === 'artist' ? '#4285F4' : '#10b981',
                                  }}>
                                    {m.userRole || 'customer'}
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                  {m.userEmail} · Requested: {formatDate(m.requestedAt || m.createdAt)}
                                </div>
                              </div>
                            </div>

                            {/* Plan and Status Badges */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                              <span style={{
                                background: planBadgeColor.bg,
                                color: planBadgeColor.text,
                                border: `1px solid ${planBadgeColor.border}`,
                                borderRadius: '10px',
                                padding: '0.35rem 0.75rem',
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                              }}>
                                {m.planId === 'elite' && '👑'} {m.planName} · {formatINR(m.amount)}/mo
                              </span>

                              <span style={{
                                background: isActive ? 'rgba(16,185,129,0.15)' : isPending ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                                color: isActive ? '#10b981' : isPending ? '#f59e0b' : '#ef4444',
                                borderRadius: '10px',
                                padding: '0.35rem 0.75rem',
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                              }}>
                                {isActive && <CheckCircle size={14} />}
                                {isPending && <Clock size={14} />}
                                {isRejected && <XCircle size={14} />}
                                {isActive ? 'Active Member' : isPending ? 'Pending Payment Review' : 'Rejected'}
                              </span>
                            </div>
                          </div>

                          {/* Payment Evidence Bar */}
                          <div style={{
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '12px',
                            padding: '0.85rem 1rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '1rem',
                            fontSize: '0.85rem',
                          }}>
                            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                              <div>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Payment Method</span>
                                <strong style={{ color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                                  💳 {m.paymentMethod || 'UPI / QR'}
                                </strong>
                              </div>

                              <div>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Transaction Reference / UTR</span>
                                <code style={{
                                  background: 'var(--color-card)',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '6px',
                                  color: '#4285F4',
                                  fontWeight: 700,
                                  fontFamily: 'monospace'
                                }}>
                                  {m.transactionRef || 'NO_REF_PROVIDED'}
                                </code>
                              </div>

                              <div>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Billing Cycle</span>
                                <strong style={{ color: 'var(--text-primary)' }}>Monthly Recurring</strong>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedMembershipForReview(m);
                                  setMembershipDecisionStatus(m.status === 'active' ? 'active' : 'active');
                                  setMembershipReviewNotes(m.adminNotes || '');
                                }}
                                className="btn btn-primary btn-sm"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
                              >
                                <ShieldCheck size={14} /> Review & Manage Access
                              </button>
                            </div>
                          </div>

                          {/* Admin Notes / Review Timestamp */}
                          {m.adminNotes && (
                            <div style={{
                              background: 'rgba(66,133,244,0.06)',
                              borderLeft: '3px solid #4285F4',
                              borderRadius: '6px',
                              padding: '0.5rem 0.75rem',
                              fontSize: '0.8rem',
                              color: 'var(--text-secondary)'
                            }}>
                              <strong style={{ color: 'var(--text-primary)' }}>Admin Remarks: </strong>
                              {m.adminNotes}
                              {m.reviewedAt && (
                                <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                                  (Reviewed: {formatDate(m.reviewedAt)})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 2: TALENT MANAGEMENT & GOVERNANCE */}
          {activeTab === 'artists' && (
            <div style={{ animation: 'fadeIn 0.25s ease' }}>
              
              {/* Roster KPI Summary Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1.15rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Talent Roster</span>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                    {artistSummary?.total || artists.length}
                  </div>
                </div>

                <div style={{ background: 'var(--color-card)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '16px', padding: '1.15rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#f59e0b', textTransform: 'uppercase', fontWeight: 800 }}>👑 Famous & Established</span>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#f59e0b', marginTop: '0.2rem' }}>
                    {artistSummary?.establishedCount || 0}
                  </div>
                </div>

                <div style={{ background: 'var(--color-card)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '16px', padding: '1.15rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#06b6d4', textTransform: 'uppercase', fontWeight: 800 }}>🚀 Emerging Talent</span>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#06b6d4', marginTop: '0.2rem' }}>
                    {artistSummary?.emergingCount || 0}
                  </div>
                </div>

                <div style={{ background: 'var(--color-card)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '16px', padding: '1.15rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#10b981', textTransform: 'uppercase', fontWeight: 800 }}>🛡️ ID / KYC Verified</span>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#10b981', marginTop: '0.2rem' }}>
                    {artistSummary?.idVerifiedCount || 0}
                  </div>
                </div>

                <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1.15rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>⏳ Pending Audits</span>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#f59e0b', marginTop: '0.2rem' }}>
                    {artistSummary?.pendingAuditCount || 0}
                  </div>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div style={{
                background: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                padding: '1rem',
                marginBottom: '1.5rem',
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '0.2rem' }}>Track:</span>
                  {[
                    { id: 'all', label: 'All Tracks' },
                    { id: 'established', label: '👑 Established' },
                    { id: 'emerging', label: '🚀 Emerging' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setArtistTierFilter(t.id)}
                      style={{
                        padding: '0.35rem 0.85rem',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: artistTierFilter === t.id ? 'linear-gradient(135deg, #4285F4, #BC4639)' : 'var(--color-surface)',
                        color: artistTierFilter === t.id ? '#ffffff' : 'var(--text-secondary)',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}

                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginLeft: '0.5rem', marginRight: '0.2rem' }}>Status:</span>
                  {['all', 'approved', 'pending', 'suspended'].map((status) => (
                    <button
                      key={status}
                      id={`artist-filter-${status}`}
                      onClick={() => setArtistStatusFilter(status)}
                      style={{
                        padding: '0.35rem 0.85rem',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                        background: artistStatusFilter === status ? 'var(--color-deep)' : 'transparent',
                        color: artistStatusFilter === status ? 'var(--text-primary)' : 'var(--text-muted)',
                      }}
                    >
                      {status}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flex: '1', maxWidth: '380px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search by talent name, email, or city..."
                    value={artistSearch}
                    onChange={(e) => setArtistSearch(e.target.value)}
                    style={{ fontSize: '0.85rem', padding: '0.5rem 0.85rem' }}
                  />
                  <button onClick={fetchArtists} className="btn btn-secondary" style={{ padding: '0.5rem 0.85rem' }}>
                    <Search size={15} />
                  </button>
                </div>
              </div>

              {/* Artists Table */}
              {loadingArtists ? (
                <div style={{ textAlign: 'center', padding: '3rem 0' }}><Spinner size={36} center /></div>
              ) : artists.length === 0 ? (
                <EmptyState icon={Users} title="No artists found" description="No performers match your status or track filter." />
              ) : (
                <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '20px', overflowX: 'auto', boxShadow: 'var(--shadow-sm)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '1rem' }}>Artist / Troupe</th>
                        <th style={{ padding: '1rem' }}>Track & Discipline</th>
                        <th style={{ padding: '1rem' }}>Verification Badge</th>
                        <th style={{ padding: '1rem' }}>Location</th>
                        <th style={{ padding: '1rem' }}>Base Price</th>
                        <th style={{ padding: '1rem' }}>Gigs & GMV</th>
                        <th style={{ padding: '1rem' }}>Status</th>
                        <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {artists.map((artist) => {
                        const isEst = artist.artistTier === 'established';
                        const isCelebVerif = artist.verificationStatus === 'celebrity_verified';
                        const isIdVerif = artist.verificationStatus === 'verified' || artist.aadhaarVerified;
                        const isNeedsInfo = artist.verificationStatus === 'needs_info';
                        const isPendingVerif = artist.verificationStatus === 'pending_review' || artist.verificationStatus === 'under_review';

                        return (
                          <tr key={artist.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <img 
                                  src={artist.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.displayName)}&background=4285F4&color=fff&size=120`} 
                                  alt={artist.displayName} 
                                  style={{ width: '46px', height: '46px', borderRadius: '12px', objectFit: 'cover', border: isEst ? '2px solid #f59e0b' : '1px solid var(--color-border)' }} 
                                  onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.displayName)}&background=4285F4&color=fff&size=120`; }}
                                />
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{artist.displayName}</span>
                                    {isCelebVerif && (
                                      <span title="Verified Popular Celebrity (Instagram-Style Blue Badge)" style={{ color: '#3b82f6', display: 'inline-flex' }}>
                                        <CheckCircle2 size={14} fill="#3b82f6" color="#ffffff" />
                                      </span>
                                    )}
                                  </div>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{artist.email || artist.userName}</span>
                                </div>
                              </div>
                            </td>

                            <td style={{ padding: '1rem' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{artist.category}</span>
                                <span style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  color: isEst ? '#f59e0b' : '#06b6d4',
                                  background: isEst ? 'rgba(245,158,11,0.12)' : 'rgba(6,182,212,0.12)',
                                  padding: '1px 6px',
                                  borderRadius: '6px',
                                  display: 'inline-block',
                                  width: 'fit-content',
                                }}>
                                  {isEst ? '👑 Established' : '🚀 Emerging'}
                                </span>
                              </div>
                            </td>

                            <td style={{ padding: '1rem' }}>
                              {isCelebVerif ? (
                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#3b82f6', background: 'rgba(59,130,246,0.12)', padding: '0.25rem 0.65rem', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                  <CheckCircle2 size={12} fill="#3b82f6" color="#fff" /> Popular Verified
                                </span>
                              ) : isIdVerif ? (
                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', background: 'rgba(16,185,129,0.12)', padding: '0.25rem 0.65rem', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                  <ShieldCheck size={12} /> ID Verified
                                </span>
                              ) : isNeedsInfo ? (
                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ef4444', background: 'rgba(239,68,68,0.12)', padding: '0.25rem 0.65rem', borderRadius: '999px' }}>
                                  📝 Needs Info
                                </span>
                              ) : isPendingVerif ? (
                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', padding: '0.25rem 0.65rem', borderRadius: '999px' }}>
                                  ⏳ Audit Pending
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  Unverified
                                </span>
                              )}
                            </td>

                            <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{artist.city}</td>
                            <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{formatINR(artist.startingPrice)}</td>
                            
                            <td style={{ padding: '1rem' }}>
                              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{artist.completedBookingsCount || artist.totalBookings || 0} shows</span>
                              <span style={{ display: 'block', fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>{formatINR(artist.totalEarnings || 0)}</span>
                            </td>

                            <td style={{ padding: '1rem' }}>
                              <StatusBadge status={artist.status} />
                            </td>

                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                                <button
                                  onClick={() => setSelectedArtist(artist)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', color: '#4285F4' }}
                                  title="View Full Profile"
                                >
                                  <Eye size={14} />
                                </button>

                                <button
                                  onClick={() => {
                                    setSelectedArtistForGovernance(artist);
                                    setGovTier(artist.artistTier || 'emerging');
                                    setGovVerifStatus(artist.verificationStatus || 'verified');
                                    setGovNotes('');
                                  }}
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)' }}
                                  title="Manage Tier & Verification Governance"
                                >
                                  <Award size={14} />
                                </button>

                                {artist.status !== 'approved' && (
                                  <button
                                    onClick={() => handleUpdateArtistStatus(artist.id, 'approved')}
                                    className="btn btn-secondary btn-sm"
                                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', color: '#10b981', borderColor: 'rgba(16,185,129,0.3)' }}
                                    title="Approve Artist"
                                  >
                                    <CheckCircle size={14} />
                                  </button>
                                )}
                                {artist.status !== 'suspended' && (
                                  <button
                                    onClick={() => handleUpdateArtistStatus(artist.id, 'suspended')}
                                    className="btn btn-secondary btn-sm"
                                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                                    title="Suspend Artist"
                                  >
                                    <XCircle size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BOOKINGS LEDGER & FINANCIAL TRANSACTIONS */}
          {activeTab === 'bookings' && (
            <div style={{ animation: 'fadeIn 0.25s ease' }}>
              
              {/* Financial Ledger Top KPI Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
                <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '1.4rem', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Gross Booking Volume (GMV)</span>
                    <DollarSign size={18} color="#4285F4" />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                    {formatINR(ledgerSummary?.totalGrossVolume || 0)}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total value of all confirmed/settled gigs</span>
                </div>

                <div style={{ background: 'var(--color-card)', border: '1px solid rgba(66,133,244,0.3)', borderRadius: '20px', padding: '1.4rem', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#4285F4', textTransform: 'uppercase' }}>Escrow Vault Balance</span>
                    <ShieldCheck size={18} color="#4285F4" />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#4285F4' }}>
                    {formatINR(ledgerSummary?.totalEscrowHeld || 0)}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>50% advances secured for upcoming events</span>
                </div>

                <div style={{ background: 'var(--color-card)', border: '1px solid rgba(188,70,57,0.3)', borderRadius: '20px', padding: '1.4rem', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#BC4639', textTransform: 'uppercase' }}>Platform 15% Take</span>
                    <TrendingUp size={18} color="#BC4639" />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#BC4639' }}>
                    {formatINR(ledgerSummary?.totalPlatformRevenue || 0)}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Net realized marketplace commissions</span>
                </div>

                <div style={{ background: 'var(--color-card)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '20px', padding: '1.4rem', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>Talent Payouts Settled</span>
                    <Award size={18} color="#10b981" />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10b981' }}>
                    {formatINR(ledgerSummary?.totalPayoutsDisbursed || 0)}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>85% total performer payouts disbursed</span>
                </div>
              </div>

              {/* Ledger Filter and Search */}
              <div style={{
                background: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                padding: '1rem',
                marginBottom: '1.5rem',
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {[
                    { id: 'all', label: `All Transactions (${ledgerSummary?.statusCounts?.all || bookings.length})` },
                    { id: 'confirmed', label: `🔒 Confirmed (In Escrow: ${ledgerSummary?.statusCounts?.confirmed || 0})` },
                    { id: 'completed', label: `✓ Completed (Disbursed: ${ledgerSummary?.statusCounts?.completed || 0})` },
                    { id: 'quoted', label: `Quoted (${ledgerSummary?.statusCounts?.quoted || 0})` },
                    { id: 'requested', label: `Requested (${ledgerSummary?.statusCounts?.requested || 0})` },
                    { id: 'cancelled', label: `Cancelled (${ledgerSummary?.statusCounts?.cancelled || 0})` },
                  ].map((s) => (
                    <button
                      key={s.id}
                      id={`booking-filter-${s.id}`}
                      onClick={() => setBookingStatusFilter(s.id)}
                      style={{
                        padding: '0.4rem 0.85rem',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: bookingStatusFilter === s.id ? 'linear-gradient(135deg, #4285F4, #BC4639)' : 'var(--color-surface)',
                        color: bookingStatusFilter === s.id ? '#ffffff' : 'var(--text-secondary)',
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flex: '1', maxWidth: '360px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search client, talent, venue, or ID..."
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    style={{ fontSize: '0.85rem', padding: '0.5rem 0.85rem' }}
                  />
                  <button onClick={fetchBookings} className="btn btn-secondary" style={{ padding: '0.5rem 0.85rem' }}>
                    <Search size={15} />
                  </button>
                </div>
              </div>

              {loadingBookings ? (
                <div style={{ textAlign: 'center', padding: '3rem 0' }}><Spinner size={36} center /></div>
              ) : bookings.length === 0 ? (
                <EmptyState icon={Calendar} title="No booking transactions" description="No financial transactions match your selected filter." />
              ) : (
                <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '20px', overflowX: 'auto', boxShadow: 'var(--shadow-sm)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '1rem' }}>Transaction ID & Date</th>
                        <th style={{ padding: '1rem' }}>Client</th>
                        <th style={{ padding: '1rem' }}>Talent / Act</th>
                        <th style={{ padding: '1rem' }}>Event Specs & Venue</th>
                        <th style={{ padding: '1rem' }}>Contract Value</th>
                        <th style={{ padding: '1rem' }}>Platform 15%</th>
                        <th style={{ padding: '1rem' }}>Talent 85%</th>
                        <th style={{ padding: '1rem' }}>Escrow Status</th>
                        <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((booking) => {
                        const isEst = booking.artistTier === 'established';
                        const isCelebVerif = booking.artistVerificationStatus === 'celebrity_verified';

                        return (
                          <tr key={booking.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '1rem' }}>
                              <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#4285F4', fontWeight: 700 }}>
                                #{booking.id.slice(0, 8)}
                              </span>
                              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {formatDate(booking.eventDate)}
                              </span>
                            </td>

                            <td style={{ padding: '1rem' }}>
                              <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
                                {booking.customerName}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {booking.customerPhone || booking.customerEmail || '—'}
                              </span>
                            </td>

                            <td style={{ padding: '1rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{booking.artistName}</span>
                                {isCelebVerif && (
                                  <span title="Verified Popular Celebrity" style={{ color: '#3b82f6', display: 'inline-flex' }}>
                                    <CheckCircle2 size={13} fill="#3b82f6" color="#ffffff" />
                                  </span>
                                )}
                              </div>
                              <span style={{
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                color: isEst ? '#f59e0b' : '#06b6d4',
                                background: isEst ? 'rgba(245,158,11,0.12)' : 'rgba(6,182,212,0.12)',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                display: 'inline-block',
                                marginTop: '2px',
                              }}>
                                {isEst ? '👑 Established' : '🚀 Emerging'} • {booking.artistCategory}
                              </span>
                            </td>

                            <td style={{ padding: '1rem' }}>
                              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{booking.eventType}</span>
                              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {booking.eventLocation?.venue || booking.eventLocation?.city || 'Venue TBA'}
                              </span>
                            </td>

                            <td style={{ padding: '1rem' }}>
                              <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                                {formatINR(booking.contractValue || booking.quotedPrice || booking.budget || 0)}
                              </div>
                            </td>

                            <td style={{ padding: '1rem' }}>
                              {booking.platformCommission ? (
                                <span style={{ fontWeight: 800, color: '#BC4639' }}>{formatINR(booking.platformCommission)}</span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>—</span>
                              )}
                            </td>

                            <td style={{ padding: '1rem' }}>
                              {booking.artistEarnings ? (
                                <span style={{ fontWeight: 800, color: '#10b981' }}>{formatINR(booking.artistEarnings)}</span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>—</span>
                              )}
                            </td>

                            <td style={{ padding: '1rem' }}>
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  padding: '0.25rem 0.65rem',
                                  borderRadius: '999px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  background:
                                    booking.status === 'confirmed'
                                      ? 'rgba(66,133,244,0.15)'
                                      : booking.status === 'completed'
                                      ? 'rgba(16,185,129,0.15)'
                                      : booking.status === 'cancelled' || booking.status === 'declined'
                                      ? 'rgba(239,68,68,0.15)'
                                      : 'rgba(245,158,11,0.15)',
                                  color:
                                    booking.status === 'confirmed'
                                      ? '#4285F4'
                                      : booking.status === 'completed'
                                      ? '#10b981'
                                      : booking.status === 'cancelled' || booking.status === 'declined'
                                      ? '#ef4444'
                                      : '#f59e0b',
                                }}
                              >
                                {booking.status === 'confirmed'
                                  ? '🔒 Escrow Held'
                                  : booking.status === 'completed'
                                  ? '✓ Payout Disbursed'
                                  : booking.status === 'cancelled' || booking.status === 'declined'
                                  ? '↩ Refunded / Voided'
                                  : booking.status === 'quoted'
                                  ? '⏳ Awaiting Advance'
                                  : '○ Pending Quote'}
                              </span>
                            </td>

                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                              <button
                                onClick={() => setSelectedBookingForLedger(booking)}
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: '0.75rem', fontWeight: 700 }}
                              >
                                Audit Breakdown
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── MODAL 1: VERIFICATION AUDIT & DECISION INSPECTOR ────── */}
          {selectedVerifForAudit && (
            <div style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2200,
              padding: '1rem'
            }}>
              <div style={{
                background: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                borderRadius: '24px',
                maxWidth: '720px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: 'var(--shadow-lg)',
                padding: '2rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <ShieldCheck size={26} color="#4285F4" />
                    <div>
                      <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        Audit Artist Verification Dossier
                      </h3>
                      <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Evaluating {selectedVerifForAudit.artistDisplayName} ({selectedVerifForAudit.artistCategory})
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedVerifForAudit(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.4rem' }}>
                    ✕
                  </button>
                </div>

                {/* 4 Pillars Authenticity Review Card - Comprehensive Evidence Dossier */}
                <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '18px', padding: '1.4rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h4 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <CheckSquare size={18} color="#10b981" /> Comprehensive Verification Evidence & Authenticity Dossier
                    </h4>
                    <span className="badge" style={{ background: selectedVerifForAudit.tierRequested === 'established' ? 'rgba(245,158,11,0.15)' : 'rgba(6,182,212,0.15)', color: selectedVerifForAudit.tierRequested === 'established' ? '#f59e0b' : '#06b6d4', fontWeight: 800 }}>
                      {selectedVerifForAudit.tierRequested === 'established' ? '👑 Famous & Established Track' : '🚀 Emerging Talent KYC Track'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                    
                    {/* 1. Legal Identity & Govt Proof */}
                    <div style={{ padding: '0.9rem 1rem', background: 'var(--color-card)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                          1. Authenticity & Legal Identity:
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>
                          ✓ Government ID Provided
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', marginTop: '0.4rem', fontSize: '0.82rem' }}>
                        <div>Legal Full Name: <strong style={{ color: '#4285F4' }}>{selectedVerifForAudit.legalName || '—'}</strong></div>
                        <div>Govt ID Document: <strong>{selectedVerifForAudit.idProofType || 'Aadhaar (UIDAI)'}</strong> {selectedVerifForAudit.idProofNumber ? `(#${selectedVerifForAudit.idProofNumber})` : ''}</div>
                        {selectedVerifForAudit.idProofDoc && (
                          <div>
                            ID Proof Attachment: <a href={selectedVerifForAudit.idProofDoc} target="_blank" rel="noreferrer" style={{ color: '#4285F4', fontWeight: 700 }}>View Document File <ExternalLink size={11} style={{ display: 'inline' }} /></a>
                          </div>
                        )}
                        <div>Contact Email: <strong>{selectedVerifForAudit.userEmail || '—'}</strong></div>
                        <div>Phone Number: <strong>{selectedVerifForAudit.userPhone || '—'}</strong></div>
                        <div>Location: <strong>{selectedVerifForAudit.userCity || '—'}</strong></div>
                      </div>

                      {/* Tax or Utility Proof */}
                      {selectedVerifForAudit.taxOrUtilityProof && (
                        <div style={{ marginTop: '0.6rem', padding: '0.5rem 0.75rem', background: 'rgba(245,158,11,0.08)', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.25)', fontSize: '0.8rem' }}>
                          <strong style={{ color: '#f59e0b' }}>🏛️ Tax / Utility / GSTIN Proof:</strong> {selectedVerifForAudit.taxOrUtilityProof}
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Validates business tax records, commercial billing entity, and direct booking authorization.
                          </div>
                        </div>
                      )}

                      {/* Management / Agency Contact */}
                      {selectedVerifForAudit.managementContact && (
                        <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.8rem' }}>
                          <strong>👔 Official Management / Booking Agency:</strong> {selectedVerifForAudit.managementContact}
                        </div>
                      )}
                    </div>

                    {/* 2. Uniqueness & Anti-Impersonation */}
                    <div style={{ padding: '0.9rem 1rem', background: 'var(--color-card)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem', fontSize: '0.88rem' }}>
                        2. Uniqueness & Stage Persona Protection:
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        Platform Stage Name: <strong style={{ color: 'var(--text-primary)' }}>"{selectedVerifForAudit.artistDisplayName}"</strong> ({selectedVerifForAudit.artistCategory})
                        <div style={{ fontSize: '0.78rem', color: '#10b981', marginTop: '3px' }}>
                          🔒 Single-identity policy enforced. Duplicate accounts under this stage persona are blocked by database uniqueness constraint.
                        </div>
                      </div>
                      {selectedVerifForAudit.statementOfAuthenticity && (
                        <div style={{ marginTop: '0.45rem', fontSize: '0.76rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          Signed Declaration: "{selectedVerifForAudit.statementOfAuthenticity}"
                        </div>
                      )}
                    </div>

                    {/* 3. Notability, Concerts, Press & Reels */}
                    <div style={{ padding: '0.9rem 1rem', background: 'var(--color-card)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem', fontSize: '0.88rem' }}>
                        3. Notability, Concert History & Media Recognition:
                      </div>
                      
                      {/* Achievements / Concert Venues */}
                      <div style={{ marginBottom: '0.75rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                          Concerts, Arena Tours, Film Credits & Awards:
                        </div>
                        <div style={{ padding: '0.65rem 0.85rem', background: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-border)', lineHeight: 1.5, fontSize: '0.82rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                          {selectedVerifForAudit.achievements || 'No past achievements entered.'}
                        </div>
                      </div>

                      {/* Press Articles (Clickable Links) */}
                      {selectedVerifForAudit.pressArticles?.length > 0 && (
                        <div style={{ marginBottom: '0.75rem' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                            📰 Press Coverage & Media Articles ({selectedVerifForAudit.pressArticles.length}):
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            {selectedVerifForAudit.pressArticles.map((art, idx) => {
                              const isUrl = art.startsWith('http://') || art.startsWith('https://');
                              return (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--color-surface)', padding: '0.4rem 0.65rem', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                                  <span style={{ color: '#4285F4' }}>📰</span>
                                  {isUrl ? (
                                    <a href={art} target="_blank" rel="noreferrer" style={{ color: '#4285F4', fontWeight: 600, wordBreak: 'break-all', fontSize: '0.8rem' }}>
                                      {art} <ExternalLink size={11} style={{ display: 'inline', marginLeft: '3px' }} />
                                    </a>
                                  ) : (
                                    <span style={{ color: 'var(--text-primary)', fontSize: '0.8rem' }}>{art}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Video Performance Reels (Clickable Links) */}
                      {selectedVerifForAudit.performanceReels?.length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                            🎬 Live Video Performance Reels ({selectedVerifForAudit.performanceReels.length}):
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            {selectedVerifForAudit.performanceReels.map((reel, idx) => {
                              const isUrl = reel.startsWith('http://') || reel.startsWith('https://');
                              return (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--color-surface)', padding: '0.4rem 0.65rem', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                                  <span style={{ color: '#ef4444' }}>▶️</span>
                                  {isUrl ? (
                                    <a href={reel} target="_blank" rel="noreferrer" style={{ color: '#ef4444', fontWeight: 600, wordBreak: 'break-all', fontSize: '0.8rem' }}>
                                      {reel} <ExternalLink size={11} style={{ display: 'inline', marginLeft: '3px' }} />
                                    </a>
                                  ) : (
                                    <span style={{ color: 'var(--text-primary)', fontSize: '0.8rem' }}>{reel}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 4. Public Presence & Official Channels (ALL CLICKABLE) */}
                    <div style={{ padding: '0.9rem 1rem', background: 'var(--color-card)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '0.88rem' }}>
                        4. Public Presence & Official Streaming Channels:
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem' }}>
                        
                        {/* Instagram */}
                        <div style={{ background: 'var(--color-surface)', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Instagram</span>
                          {selectedVerifForAudit.officialLinks?.instagram ? (
                            <a
                              href={selectedVerifForAudit.officialLinks.instagram.startsWith('http') ? selectedVerifForAudit.officialLinks.instagram : `https://instagram.com/${selectedVerifForAudit.officialLinks.instagram.replace('@', '')}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: '#4285F4', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '2px' }}
                            >
                              📸 {selectedVerifForAudit.officialLinks.instagram} <ExternalLink size={12} />
                            </a>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Not provided</span>
                          )}
                        </div>

                        {/* Spotify */}
                        <div style={{ background: 'var(--color-surface)', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Spotify / Streaming</span>
                          {selectedVerifForAudit.officialLinks?.spotify ? (
                            <a
                              href={selectedVerifForAudit.officialLinks.spotify.startsWith('http') ? selectedVerifForAudit.officialLinks.spotify : `https://${selectedVerifForAudit.officialLinks.spotify}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: '#10b981', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '2px' }}
                            >
                              🎵 {selectedVerifForAudit.officialLinks.spotify} <ExternalLink size={12} />
                            </a>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Not provided</span>
                          )}
                        </div>

                        {/* YouTube */}
                        <div style={{ background: 'var(--color-surface)', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>YouTube Channel / Video</span>
                          {selectedVerifForAudit.officialLinks?.youtube ? (
                            <a
                              href={selectedVerifForAudit.officialLinks.youtube.startsWith('http') ? selectedVerifForAudit.officialLinks.youtube : `https://${selectedVerifForAudit.officialLinks.youtube}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '2px' }}
                            >
                              ▶️ {selectedVerifForAudit.officialLinks.youtube} <ExternalLink size={12} />
                            </a>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Not provided</span>
                          )}
                        </div>

                        {/* Official Website */}
                        <div style={{ background: 'var(--color-surface)', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Website / Wikipedia</span>
                          {selectedVerifForAudit.officialLinks?.website ? (
                            <a
                              href={selectedVerifForAudit.officialLinks.website.startsWith('http') ? selectedVerifForAudit.officialLinks.website : `https://${selectedVerifForAudit.officialLinks.website}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '2px' }}
                            >
                              🌐 {selectedVerifForAudit.officialLinks.website} <ExternalLink size={12} />
                            </a>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Not provided</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Audit Trail History */}
                    {selectedVerifForAudit.auditTrail?.length > 0 && (
                      <div style={{ padding: '0.75rem 1rem', background: 'rgba(66,133,244,0.05)', borderRadius: '10px', border: '1px solid rgba(66,133,244,0.2)', fontSize: '0.78rem' }}>
                        <div style={{ fontWeight: 800, color: '#4285F4', marginBottom: '0.3rem' }}>
                          📜 Submission & Audit History:
                        </div>
                        {selectedVerifForAudit.auditTrail.map((log, i) => (
                          <div key={i} style={{ color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                            • <strong>{formatDate(log.timestamp)}</strong>: {log.action} by {log.by} ({log.notes})
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                </div>

                {/* Decision Form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontWeight: 800 }}>Audit Decision & Verification Level</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setAuditDecisionStatus('approved');
                          setAuditDecisionTier('established');
                          setAuditDecisionLevel('celebrity_verified');
                        }}
                        style={{
                          padding: '0.85rem',
                          borderRadius: '12px',
                          border: auditDecisionStatus === 'approved' && auditDecisionLevel === 'celebrity_verified' ? '2px solid #f59e0b' : '1px solid var(--color-border)',
                          background: auditDecisionStatus === 'approved' && auditDecisionLevel === 'celebrity_verified' ? 'rgba(245,158,11,0.1)' : 'var(--color-surface)',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ fontWeight: 800, color: '#f59e0b', fontSize: '0.85rem' }}>👑 Approve as Popular Artist</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Grants Blue Instagram-Style Badge & Famous Tier</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAuditDecisionStatus('approved');
                          setAuditDecisionTier('emerging');
                          setAuditDecisionLevel('verified');
                        }}
                        style={{
                          padding: '0.85rem',
                          borderRadius: '12px',
                          border: auditDecisionStatus === 'approved' && auditDecisionLevel === 'verified' ? '2px solid #06b6d4' : '1px solid var(--color-border)',
                          background: auditDecisionStatus === 'approved' && auditDecisionLevel === 'verified' ? 'rgba(6,182,212,0.1)' : 'var(--color-surface)',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ fontWeight: 800, color: '#06b6d4', fontSize: '0.85rem' }}>🚀 Approve as Emerging Talent</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Grants Green ID Verified Shield & Spotlight</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAuditDecisionStatus('needs_info');
                          setVerifReviewNotes('Please provide your official Spotify artist profile URL and tax/utility record reference.');
                        }}
                        style={{
                          padding: '0.85rem',
                          borderRadius: '12px',
                          border: auditDecisionStatus === 'needs_info' ? '2px solid #ef4444' : '1px solid var(--color-border)',
                          background: auditDecisionStatus === 'needs_info' ? 'rgba(239,68,68,0.1)' : 'var(--color-surface)',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ fontWeight: 800, color: '#ef4444', fontSize: '0.85rem' }}>📝 Request Additional Info</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Prompts artist to upload missing documents</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAuditDecisionStatus('rejected');
                        }}
                        style={{
                          padding: '0.85rem',
                          borderRadius: '12px',
                          border: auditDecisionStatus === 'rejected' ? '2px solid #64748b' : '1px solid var(--color-border)',
                          background: auditDecisionStatus === 'rejected' ? 'rgba(100,116,139,0.1)' : 'var(--color-surface)',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ fontWeight: 800, color: '#64748b', fontSize: '0.85rem' }}>✕ Reject Application</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Declines claim with explanation</div>
                      </button>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontWeight: 800 }}>Admin Remarks / Reason for Decision *</label>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      placeholder="Add specific remarks explaining the decision, or specifying exact documents required from the artist..."
                      value={verifReviewNotes}
                      onChange={(e) => setVerifReviewNotes(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setSelectedVerifForAudit(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={submittingAudit}
                      onClick={handleAuditDecisionSubmit}
                      style={{ fontWeight: 800 }}
                    >
                      {submittingAudit ? 'Recording Decision...' : 'Commit Verification Decision'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── MODAL 2: TALENT GOVERNANCE & TIER CONTROLLER ─────────── */}
          {selectedArtistForGovernance && (
            <div style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2200,
              padding: '1rem'
            }}>
              <div style={{
                background: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                borderRadius: '24px',
                maxWidth: '580px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: 'var(--shadow-lg)',
                padding: '2rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Award size={24} color="#f59e0b" />
                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        Talent Tier & Verification Governance
                      </h3>
                      <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Managing {selectedArtistForGovernance.displayName}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedArtistForGovernance(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.4rem' }}>
                    ✕
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontWeight: 800 }}>Artist Track Category</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setGovTier('emerging');
                          if (govVerifStatus === 'celebrity_verified') setGovVerifStatus('verified');
                        }}
                        style={{
                          padding: '0.85rem',
                          borderRadius: '12px',
                          border: govTier === 'emerging' ? '2px solid #06b6d4' : '1px solid var(--color-border)',
                          background: govTier === 'emerging' ? 'rgba(6,182,212,0.1)' : 'var(--color-surface)',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ fontWeight: 800, color: '#06b6d4' }}>🚀 Emerging Talent</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Independent rising performer</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setGovTier('established');
                          if (govVerifStatus === 'verified') setGovVerifStatus('celebrity_verified');
                        }}
                        style={{
                          padding: '0.85rem',
                          borderRadius: '12px',
                          border: govTier === 'established' ? '2px solid #f59e0b' : '1px solid var(--color-border)',
                          background: govTier === 'established' ? 'rgba(245,158,11,0.1)' : 'var(--color-surface)',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ fontWeight: 800, color: '#f59e0b' }}>👑 Famous & Established</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Headline celebrity & icon</div>
                      </button>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontWeight: 800 }}>Platform Verification Status Badge</label>
                    <select
                      className="form-select"
                      value={govVerifStatus}
                      onChange={(e) => setGovVerifStatus(e.target.value)}
                    >
                      <option value="celebrity_verified">👑 Verified Popular Artist (Blue Instagram-Style Badge)</option>
                      <option value="verified">🛡️ Government ID / KYC Verified (Green Shield)</option>
                      <option value="under_review">🔍 Under Investigation</option>
                      <option value="needs_info">📝 Additional Information Required</option>
                      <option value="unverified">✕ Unverified</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontWeight: 800 }}>Governance Audit Remarks</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="e.g. Verified by Super Admin based on Wikipedia and Spotify chart presence."
                      value={govNotes}
                      onChange={(e) => setGovNotes(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setSelectedArtistForGovernance(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={savingGovernance}
                      onClick={handleSaveGovernance}
                      style={{ fontWeight: 800 }}
                    >
                      {savingGovernance ? 'Saving...' : 'Save Governance Settings'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── MODAL 3: FINANCIAL LEDGER TRANSACTION DETAIL ─────────── */}
          {selectedBookingForLedger && (
            <div style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2200,
              padding: '1rem'
            }}>
              <div style={{
                background: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                borderRadius: '24px',
                maxWidth: '640px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: 'var(--shadow-lg)',
                padding: '2rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <DollarSign size={24} color="#10b981" />
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        Financial Transaction Ledger Breakdown
                      </h3>
                      <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        ID: {selectedBookingForLedger.id}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedBookingForLedger(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.4rem' }}>
                    ✕
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.85rem' }}>
                  {/* Parties Card */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Client Information</span>
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem', marginTop: '2px' }}>{selectedBookingForLedger.customerName}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{selectedBookingForLedger.customerEmail || selectedBookingForLedger.customerPhone || 'Contact verified'}</div>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Talent / Performer</span>
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem', marginTop: '2px' }}>{selectedBookingForLedger.artistName}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{selectedBookingForLedger.artistCategory} • {selectedBookingForLedger.artistTier === 'established' ? '👑 Established' : '🚀 Emerging'}</div>
                    </div>
                  </div>

                  {/* Financial Breakdown Table */}
                  <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '1.25rem' }}>
                    <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                      Contract Financial Split (15% Commission / 85% Talent Payout)
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px dashed var(--color-border)' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Gross Agreed Contract Value:</span>
                        <strong style={{ color: 'var(--text-primary)', fontSize: '1.05rem' }}>{formatINR(selectedBookingForLedger.contractValue || selectedBookingForLedger.quotedPrice || 0)}</strong>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#BC4639', paddingBottom: '0.4rem', borderBottom: '1px dashed var(--color-border)' }}>
                        <span>GoArts Platform Commission (15%):</span>
                        <strong>+ {formatINR(selectedBookingForLedger.platformCommission || 0)}</strong>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', paddingTop: '0.2rem' }}>
                        <span>Net Talent Earnings Disbursed (85%):</span>
                        <strong style={{ fontSize: '1.05rem' }}>{formatINR(selectedBookingForLedger.artistEarnings || 0)}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Escrow Milestone Timeline */}
                  <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '1.25rem' }}>
                    <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <ShieldCheck size={16} color="#4285F4" /> 50/50 Escrow Milestone Vault Protocol
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={{ padding: '0.75rem', background: 'var(--color-card)', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Milestone 1: 50% Advance</span>
                        <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                          {formatINR(Math.round((selectedBookingForLedger.contractValue || 0) * 0.5))}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: selectedBookingForLedger.advancePayment || ['confirmed', 'completed'].includes(selectedBookingForLedger.status) ? '#10b981' : '#f59e0b', fontWeight: 700 }}>
                          {selectedBookingForLedger.advancePayment || ['confirmed', 'completed'].includes(selectedBookingForLedger.status) ? '✓ Secured in Escrow Vault' : '⏳ Awaiting Deposit'}
                        </span>
                      </div>

                      <div style={{ padding: '0.75rem', background: 'var(--color-card)', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Milestone 2: 50% Settlement</span>
                        <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                          {formatINR(Math.round((selectedBookingForLedger.contractValue || 0) * 0.5))}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: selectedBookingForLedger.status === 'completed' ? '#10b981' : 'var(--text-muted)', fontWeight: 700 }}>
                          {selectedBookingForLedger.status === 'completed' ? '✓ Released Post-Event' : '○ Held Until Show Completion'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Event Date: <strong>{formatDate(selectedBookingForLedger.eventDate)}</strong> • Venue: <strong>{selectedBookingForLedger.eventLocation?.venue || 'Hyderabad Convention'}</strong> • City: <strong>{selectedBookingForLedger.eventLocation?.city || 'Hyderabad'}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setSelectedBookingForLedger(null)}
                    >
                      Close Breakdown
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── MODAL 4: ARTIST FULL PROFILE & DOSSIER INSPECTOR ────── */}
          {selectedArtist && (
            <div style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.72)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2300,
              padding: '1rem',
            }}>
              <div style={{
                background: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                borderRadius: '24px',
                maxWidth: '780px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: 'var(--shadow-lg)',
                padding: '2rem',
              }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', gap: '1.15rem', alignItems: 'center' }}>
                    <div style={{
                      width: '68px',
                      height: '68px',
                      borderRadius: '18px',
                      background: 'linear-gradient(135deg, #4285F4, #BC4639)',
                      padding: '2px',
                      flexShrink: 0,
                    }}>
                      {selectedArtist.image ? (
                        <img
                          src={selectedArtist.image}
                          alt={selectedArtist.displayName}
                          style={{ width: '100%', height: '100%', borderRadius: '16px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', borderRadius: '16px', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 800, color: 'white' }}>
                          {selectedArtist.displayName?.[0] || 'A'}
                        </div>
                      )}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {selectedArtist.displayName}
                        </h2>
                        {selectedArtist.verificationStatus === 'celebrity_verified' ? (
                          <span
                            title="Celebrity Verified"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: '#4285F4',
                              color: 'white',
                              borderRadius: '50%',
                              width: '20px',
                              height: '20px',
                              fontSize: '11px',
                              boxShadow: '0 0 8px rgba(66,133,244,0.5)',
                            }}
                          >
                            ★
                          </span>
                        ) : selectedArtist.verificationStatus === 'verified' || selectedArtist.verified ? (
                          <span
                            title="KYC Verified"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: '#10b981',
                              color: 'white',
                              borderRadius: '50%',
                              width: '18px',
                              height: '18px',
                              fontSize: '10px',
                            }}
                          >
                            ✓
                          </span>
                        ) : null}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                        <span className="badge" style={{ background: selectedArtist.artistTier === 'established' ? 'rgba(245,158,11,0.15)' : 'rgba(6,182,212,0.15)', color: selectedArtist.artistTier === 'established' ? '#f59e0b' : '#06b6d4', fontWeight: 800 }}>
                          {selectedArtist.artistTier === 'established' ? '👑 Famous & Established' : '🚀 Emerging Talent'}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {selectedArtist.category} • {selectedArtist.city || 'Hyderabad'}
                        </span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--palette-blue)' }}>
                          From {formatINR(selectedArtist.basePrice || 30000)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedArtist(null)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.4rem' }}
                  >
                    ✕
                  </button>
                </div>

                {/* KPI Highlights Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ padding: '0.85rem', background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Marketplace Status</span>
                    <div style={{ marginTop: '0.2rem' }}>
                      <StatusBadge status={selectedArtist.status || 'approved'} />
                    </div>
                  </div>

                  <div style={{ padding: '0.85rem', background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Shows Completed</span>
                    <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                      {selectedArtist.completedBookingsCount || 0} gigs
                    </div>
                  </div>

                  <div style={{ padding: '0.85rem', background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Earnings</span>
                    <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#10b981', marginTop: '0.15rem' }}>
                      {formatINR(selectedArtist.totalEarnings || 0)}
                    </div>
                  </div>

                  <div style={{ padding: '0.85rem', background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Client Reviews</span>
                    <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#f59e0b', marginTop: '0.15rem' }}>
                      ★ {selectedArtist.rating || '5.0'} ({selectedArtist.reviewCount || 0})
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div style={{ marginBottom: '1.25rem', background: 'var(--color-surface)', padding: '1rem', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    Artist Biography & Career Overview
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {selectedArtist.bio || 'No biography text available for this performer.'}
                  </p>
                </div>

                {/* Identity & Legal Authenticity Section */}
                <div style={{ marginBottom: '1.25rem', background: 'var(--color-surface)', padding: '1rem', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ShieldCheck size={16} color="#4285F4" /> Legal Identity & Authenticity Records
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.6rem', fontSize: '0.82rem' }}>
                    <div>Legal Full Name: <strong>{selectedArtist.verificationRecord?.legalName || selectedArtist.userName || selectedArtist.displayName}</strong></div>
                    <div>Registered Email: <strong>{selectedArtist.email || '—'}</strong></div>
                    <div>Phone Number: <strong>{selectedArtist.phone || '—'}</strong></div>
                    <div>Govt ID Proof: <strong>{selectedArtist.verificationRecord?.idProofType || (selectedArtist.aadhaarVerified ? 'Aadhaar (UIDAI Verified)' : 'Aadhaar (UIDAI)')}</strong> {selectedArtist.verificationRecord?.idProofNumber ? `(#${selectedArtist.verificationRecord.idProofNumber})` : ''}</div>
                    <div>Tax / Utility / GSTIN: <strong>{selectedArtist.verificationRecord?.taxOrUtilityProof || 'On file'}</strong></div>
                    <div>Agency / Management: <strong>{selectedArtist.verificationRecord?.managementContact || 'Direct Artist Management'}</strong></div>
                  </div>
                </div>

                {/* Social & Streaming Links */}
                <div style={{ marginBottom: '1.5rem', background: 'var(--color-surface)', padding: '1rem', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Globe size={16} color="#4285F4" /> Official Social & Media Links
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', fontSize: '0.82rem' }}>
                    {selectedArtist.socialLinks?.instagram && (
                      <div>
                        📸 Instagram: <a href={selectedArtist.socialLinks.instagram.startsWith('http') ? selectedArtist.socialLinks.instagram : `https://instagram.com/${selectedArtist.socialLinks.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" style={{ color: '#4285F4', fontWeight: 700 }}>{selectedArtist.socialLinks.instagram} <ExternalLink size={11} style={{ display: 'inline' }} /></a>
                      </div>
                    )}
                    {selectedArtist.socialLinks?.spotify && (
                      <div>
                        🎵 Spotify: <a href={selectedArtist.socialLinks.spotify.startsWith('http') ? selectedArtist.socialLinks.spotify : `https://${selectedArtist.socialLinks.spotify}`} target="_blank" rel="noreferrer" style={{ color: '#10b981', fontWeight: 700 }}>Artist Profile <ExternalLink size={11} style={{ display: 'inline' }} /></a>
                      </div>
                    )}
                    {selectedArtist.socialLinks?.youtube && (
                      <div>
                        ▶️ YouTube: <a href={selectedArtist.socialLinks.youtube.startsWith('http') ? selectedArtist.socialLinks.youtube : `https://${selectedArtist.socialLinks.youtube}`} target="_blank" rel="noreferrer" style={{ color: '#ef4444', fontWeight: 700 }}>Channel <ExternalLink size={11} style={{ display: 'inline' }} /></a>
                      </div>
                    )}
                    {selectedArtist.socialLinks?.website && (
                      <div>
                        🌐 Website: <a href={selectedArtist.socialLinks.website.startsWith('http') ? selectedArtist.socialLinks.website : `https://${selectedArtist.socialLinks.website}`} target="_blank" rel="noreferrer" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Official Site <ExternalLink size={11} style={{ display: 'inline' }} /></a>
                      </div>
                    )}
                    {!selectedArtist.socialLinks?.instagram && !selectedArtist.socialLinks?.spotify && !selectedArtist.socialLinks?.youtube && !selectedArtist.socialLinks?.website && (
                      <span style={{ color: 'var(--text-muted)' }}>No external handles configured</span>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => window.open(`/artists/${selectedArtist.id}`, '_blank')}
                    style={{ fontSize: '0.82rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <ExternalLink size={13} /> View Public Marketplace Profile
                  </button>

                  <div style={{ display: 'flex', gap: '0.65rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setSelectedArtistForGovernance(selectedArtist);
                        setGovTier(selectedArtist.artistTier || 'emerging');
                        setGovVerifStatus(selectedArtist.verificationStatus || 'verified');
                        setSelectedArtist(null);
                      }}
                      style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)' }}
                    >
                      <Award size={14} style={{ display: 'inline', marginRight: '4px' }} /> Manage Tier & Badge
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setSelectedArtist(null)}
                      style={{ fontSize: '0.82rem' }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── MODAL 5: MEMBERSHIP APPLICATION REVIEW & DECISION INSPECTOR ────── */}
          {selectedMembershipForReview && (
            <div style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.72)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2350,
              padding: '1rem',
            }}>
              <div style={{
                background: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                borderRadius: '24px',
                maxWidth: '650px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: 'var(--shadow-lg)',
                padding: '2rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ background: '#f59e0b', borderRadius: '12px', padding: '0.5rem', display: 'flex' }}>
                      <Crown size={22} color="white" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        Review Membership Payment
                      </h3>
                      <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Evaluating subscription for {selectedMembershipForReview.userName}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMembershipForReview(null)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.4rem' }}
                  >
                    ✕
                  </button>
                </div>

                {/* Subscription Details summary */}
                <div style={{ background: 'var(--color-surface)', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', border: '1px solid var(--color-border)' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Member</span>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{selectedMembershipForReview.userName}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{selectedMembershipForReview.userEmail}</div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Applied Plan & Price</span>
                    <strong style={{ color: '#4285F4', fontSize: '0.95rem' }}>{selectedMembershipForReview.planName}</strong>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {formatINR(selectedMembershipForReview.amount)} / month
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Payment Method</span>
                    <strong style={{ color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                      💳 {selectedMembershipForReview.paymentMethod || 'UPI'}
                    </strong>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>UTR / Transaction Reference</span>
                    <code style={{ background: 'var(--color-card)', padding: '0.2rem 0.5rem', borderRadius: '6px', color: '#10b981', fontWeight: 700, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {selectedMembershipForReview.transactionRef || 'NO_REF_PROVIDED'}
                    </code>
                  </div>
                </div>

                {/* Decision Selector */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label" style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>
                    Admin Verification Decision
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <button
                      type="button"
                      onClick={() => setMembershipDecisionStatus('active')}
                      style={{
                        padding: '1rem',
                        borderRadius: '12px',
                        border: `2px solid ${membershipDecisionStatus === 'active' ? '#10b981' : 'var(--color-border)'}`,
                        background: membershipDecisionStatus === 'active' ? 'rgba(16,185,129,0.1)' : 'var(--color-surface)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#10b981', marginBottom: '0.25rem' }}>
                        <CheckCircle size={18} /> Approve & Activate Access
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Confirm payment receipt. Immediately unlocks {selectedMembershipForReview.planName} features.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMembershipDecisionStatus('rejected')}
                      style={{
                        padding: '1rem',
                        borderRadius: '12px',
                        border: `2px solid ${membershipDecisionStatus === 'rejected' ? '#ef4444' : 'var(--color-border)'}`,
                        background: membershipDecisionStatus === 'rejected' ? 'rgba(239,68,68,0.1)' : 'var(--color-surface)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#ef4444', marginBottom: '0.25rem' }}>
                        <XCircle size={18} /> Reject Application
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Decline payment proof. Access remains on previous free tier.
                      </div>
                    </button>
                  </div>
                </div>

                {/* Admin Notes */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label" style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>
                    Verification Remarks / Notes for Audit
                  </label>
                  <textarea
                    rows={3}
                    className="form-input"
                    placeholder="e.g. Verified ₹9,999 UTR transaction credit in HDFC Escrow account. All AI Growth features activated."
                    value={membershipReviewNotes}
                    onChange={(e) => setMembershipReviewNotes(e.target.value)}
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>

                {/* Footer Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedMembershipForReview(null)}
                    className="btn btn-outline"
                    disabled={submittingMembershipReview}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleMembershipReviewSubmit}
                    disabled={submittingMembershipReview}
                    className={`btn ${membershipDecisionStatus === 'active' ? 'btn-primary' : 'btn-danger'}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontWeight: 800,
                      background: membershipDecisionStatus === 'active' ? '#10b981' : '#ef4444',
                      borderColor: membershipDecisionStatus === 'active' ? '#10b981' : '#ef4444',
                    }}
                  >
                    {submittingMembershipReview ? (
                      <><RefreshCw size={16} className="spin" /> Updating Access...</>
                    ) : membershipDecisionStatus === 'active' ? (
                      <><CheckCircle size={16} /> Confirm & Activate Subscription</>
                    ) : (
                      <><XCircle size={16} /> Confirm Rejection</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CLIENT ACCOUNTS */}
          {activeTab === 'customers' && (
            <div style={{ animation: 'fadeIn 0.25s ease' }}>
              {loadingCustomers ? (
                <div style={{ textAlign: 'center', padding: '3rem 0' }}><Spinner size={36} center /></div>
              ) : customers.length === 0 ? (
                <EmptyState icon={Users} title="No clients registered" description="No customer accounts exist in the database." />
              ) : (
                <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '20px', overflowX: 'auto', boxShadow: 'var(--shadow-sm)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '1rem' }}>Client Name</th>
                        <th style={{ padding: '1rem' }}>Email</th>
                        <th style={{ padding: '1rem' }}>Phone</th>
                        <th style={{ padding: '1rem' }}>Aadhaar KYC</th>
                        <th style={{ padding: '1rem' }}>Registered</th>
                        <th style={{ padding: '1rem' }}>Status</th>
                        <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((c) => (
                        <tr key={c.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</td>
                          <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{c.email}</td>
                          <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{c.phone || '—'}</td>
                          <td style={{ padding: '1rem' }}>
                            {c.aadhaarVerified || c.aadhaarStatus === 'verified' ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
                                <ShieldCheck size={13} /> Verified
                              </span>
                            ) : c.aadhaarStatus === 'under_review' ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800 }}>
                                  ⏳ Awaiting Approval
                                </span>
                                <button
                                  onClick={() => handleReviewCustomerKyc(c.id, 'approved')}
                                  className="btn btn-primary btn-sm"
                                  style={{ padding: '0.2rem 0.55rem', fontSize: '0.72rem', background: '#10b981', borderColor: '#10b981' }}
                                  title="Approve Customer KYC"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReviewCustomerKyc(c.id, 'rejected')}
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '0.2rem 0.55rem', fontSize: '0.72rem', color: '#ef4444' }}
                                  title="Reject Customer KYC"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : c.aadhaarStatus === 'rejected' ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
                                ✕ Not Approved
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                ○ Not Submitted
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{formatDate(c.createdAt)}</td>
                          <td style={{ padding: '1rem' }}>
                            <StatusBadge status={c.isActive ? 'approved' : 'suspended'} />
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            <button
                              onClick={() => handleUpdateCustomerStatus(c.id, c.isActive ? 'suspended' : 'active')}
                              className="btn btn-secondary btn-sm"
                              style={{ 
                                padding: '0.35rem 0.75rem', 
                                fontSize: '0.75rem', 
                                color: c.isActive ? '#ef4444' : '#10b981',
                                borderColor: c.isActive ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'
                              }}
                            >
                              {c.isActive ? 'Suspend' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SECURITY AUDIT TRAIL */}
          {activeTab === 'logs' && (
            <div style={{ animation: 'fadeIn 0.25s ease' }}>
              <div style={{
                background: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                borderRadius: '20px',
                padding: '1.25rem 1.5rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(66, 133, 244, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={24} color="#4285F4" />
                  </div>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      Security & Governance Audit Trail
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                        🔒 Immutable MongoDB Log
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      Tracks administrative approvals, rejections, tier modifications, and platform security events.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {auditLogs.length} Logged Event{auditLogs.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => fetchAuditLogs()}
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <RefreshCw size={14} className={loadingLogs ? 'spin' : ''} /> Refresh Trail
                  </button>
                </div>
              </div>

              {loadingLogs ? (
                <div style={{ textAlign: 'center', padding: '3rem 0' }}><Spinner size={36} center /></div>
              ) : auditLogs.length === 0 ? (
                <EmptyState icon={Shield} title="No audit entries" description="System audit records will appear here as administrative actions occur." />
              ) : (
                <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {auditLogs.map((log) => {
                      const isApproved = log.action?.includes('approved');
                      const isRejected = log.action?.includes('rejected');
                      const isSuspended = log.action?.includes('suspended');
                      const isNeedsInfo = log.action?.includes('needs_info');
                      const isGovernance = log.action?.includes('tier_governance');
                      const isReseed = log.action?.includes('RESEEDED');

                      const badgeBg = isApproved ? 'rgba(16, 185, 129, 0.12)' : isRejected || isSuspended ? 'rgba(239, 68, 68, 0.12)' : isNeedsInfo ? 'rgba(245, 158, 11, 0.12)' : isGovernance ? 'rgba(168, 85, 247, 0.12)' : 'rgba(66, 133, 244, 0.12)';
                      const badgeColor = isApproved ? '#10b981' : isRejected || isSuspended ? '#ef4444' : isNeedsInfo ? '#f59e0b' : isGovernance ? '#a855f7' : '#4285f4';

                      const actionLabel = isApproved ? '✓ Verification Approved' : isRejected ? '✕ Verification Rejected' : isNeedsInfo ? '📝 Requested More Info' : isSuspended ? '🚫 Account Suspended' : isGovernance ? '👑 Tier Governance Modified' : isReseed ? '🔄 Database Reseeded' : log.action.replace(/_/g, ' ');

                      return (
                        <div key={log.id} style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '1rem',
                          padding: '1.1rem',
                          background: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '16px',
                          fontSize: '0.85rem'
                        }}>
                          <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            background: badgeBg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <Shield size={18} color={badgeColor} />
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                                <span style={{
                                  padding: '0.2rem 0.65rem',
                                  borderRadius: '999px',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  background: badgeBg,
                                  color: badgeColor,
                                  border: `1px solid ${badgeColor}33`,
                                  textTransform: 'capitalize'
                                }}>
                                  {actionLabel}
                                </span>

                                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                                  Target: <span style={{ color: 'var(--palette-blue)' }}>{log.targetName || log.details?.artistName || log.targetType}</span>
                                </span>

                                <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                                  (ID: #{log.targetId?.slice(0, 8)})
                                </span>
                              </div>

                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                {formatDate(log.createdAt)}
                              </span>
                            </div>

                            <div style={{ marginTop: '0.45rem', color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.5 }}>
                              {log.details?.adminNotes ? (
                                <div style={{ background: 'var(--color-card)', padding: '0.45rem 0.75rem', borderRadius: '8px', borderLeft: `3px solid ${badgeColor}`, marginTop: '0.35rem' }}>
                                  <strong style={{ color: 'var(--text-primary)' }}>Admin Decision Remarks: </strong>
                                  <span>{log.details.adminNotes}</span>
                                </div>
                              ) : null}

                              {log.details?.reason ? (
                                <div style={{ background: 'var(--color-card)', padding: '0.45rem 0.75rem', borderRadius: '8px', borderLeft: `3px solid ${badgeColor}`, marginTop: '0.35rem' }}>
                                  <strong style={{ color: 'var(--text-primary)' }}>Reason: </strong>
                                  <span>{log.details.reason}</span>
                                </div>
                              ) : null}

                              {log.details?.newTier || log.details?.newVerif ? (
                                <div style={{ marginTop: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                  Tier: <strong style={{ color: 'var(--text-primary)' }}>{log.details?.prevTier || 'emerging'} → {log.details?.newTier || 'established'}</strong> | Status: <strong style={{ color: 'var(--text-primary)' }}>{log.details?.newVerif}</strong>
                                </div>
                              ) : null}

                              {log.details?.message ? (
                                <div style={{ marginTop: '0.25rem', color: 'var(--text-muted)' }}>
                                  {log.details.message}
                                </div>
                              ) : null}
                            </div>

                            <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                              <span>👤 Authorized Officer:</span>
                              <strong style={{ color: 'var(--text-primary)' }}>{log.adminName || 'Super Admin'}</strong>
                              {log.adminEmail && <span>({log.adminEmail})</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: ADMIN PROFILE & SECURITY SETTINGS */}
          {activeTab === 'profile' && (
            <AdminProfileTab user={user} updateUser={updateUser} overview={overview} />
          )}

        </div>
      </main>
    </div>
  );
}
