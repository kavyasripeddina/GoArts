// GoArts AI - Artist Premium Plans & Revenue Streams (Full Payment & Admin Governance)
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar, Footer } from '../components/shared';
import { useAuth } from '../context/useAuth';
import { aiAPI } from '../lib/api';
import {
  Crown,
  Check,
  Zap,
  Star,
  Loader2,
  TrendingUp,
  DollarSign,
  Megaphone,
  Award,
  X,
  CreditCard,
  QrCode,
  Building,
  ShieldCheck,
  AlertCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

const PLAN_ICONS = { basic: Star, pro: Zap, elite: Crown };

export default function ArtistPremiumPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [revenueStreams, setRevenueStreams] = useState([]);
  const [loading, setLoading] = useState(true);

  // User's membership status
  const [membershipData, setMembershipData] = useState(null);

  // Modal State
  const [activePlanModal, setActivePlanModal] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadMembership = () => {
    if (user) {
      aiAPI.myMembership()
        .then(({ data }) => setMembershipData(data))
        .catch(() => {});
    }
  };

  useEffect(() => {
    Promise.all([
      aiAPI.subscriptionPlans(),
      user ? aiAPI.myMembership().catch(() => ({ data: null })) : Promise.resolve({ data: null }),
    ])
      .then(([plansRes, membershipRes]) => {
        setPlans(plansRes.data.plans || []);
        setRevenueStreams(plansRes.data.revenueStreams || []);
        if (membershipRes.data) setMembershipData(membershipRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleOpenSubscribe = (plan) => {
    if (!user) {
      toast.error('Please sign in to subscribe to a membership plan.');
      navigate('/login');
      return;
    }
    setActivePlanModal(plan);
    setPaymentMethod('UPI');
    setTransactionRef('');
    setNote('');
  };

  const handleSubmitSubscription = async (e) => {
    e.preventDefault();
    if (!transactionRef.trim()) {
      toast.error('Please provide a payment Transaction Reference / UTR ID.');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await aiAPI.requestMembership({
        planId: activePlanModal.id,
        paymentMethod,
        transactionRef: transactionRef.trim(),
        note: note.trim(),
      });
      toast.success(data.message || 'Membership request submitted to Admin!');
      setActivePlanModal(null);
      loadMembership();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Subscription request failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-background)' }}>
        <Loader2 size={36} className="spin" style={{ color: '#4285F4' }} />
      </div>
    );
  }

  const currentPlan = membershipData?.currentPlan || user?.subscriptionTier || 'free';
  const pendingPlan = membershipData?.pendingMembership;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background)' }}>
      <Navbar />
      <div style={{ paddingTop: '80px' }}>
        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg, var(--color-midnight), rgba(188,70,57,0.22))', borderBottom: '1px solid var(--color-border)', padding: '4rem 0 3rem', textAlign: 'center' }}>
          <div className="container">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(188,70,57,0.15)', border: '1px solid rgba(188,70,57,0.3)', borderRadius: '99px', padding: '0.35rem 1rem', marginBottom: '1.5rem' }}>
              <Crown size={15} color="#BC4639" />
              <span style={{ color: '#BC4639', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.5px' }}>PREMIUM MEMBERSHIP TIERS</span>
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '1rem', lineHeight: 1.2 }}>
              Grow Your Career & Live Bookings<br />
              <span style={{ background: 'linear-gradient(135deg, #4285F4, #BC4639)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                with GoArts AI Ecosystem
              </span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '640px', margin: '0 auto' }}>
              Select a tier matched to your performance scale. All applications are reviewed and verified by GoArts Trust & Safety administrators.
            </p>

            {/* Current Status Badge */}
            {user && (
              <div style={{ marginTop: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.75rem', background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '99px', padding: '0.4rem 1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Logged in as <strong>{user.name}</strong></span>
                <span style={{ background: currentPlan === 'elite' ? '#BC4639' : currentPlan === 'pro' ? '#4285F4' : 'var(--color-surface)', color: currentPlan === 'free' ? 'var(--text-muted)' : 'white', fontWeight: 800, fontSize: '0.75rem', padding: '0.15rem 0.6rem', borderRadius: '99px', textTransform: 'uppercase' }}>
                  {currentPlan} Tier
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="container" style={{ padding: '3rem 1rem' }}>
          {/* Pending Application Alert Banner */}
          {pendingPlan && (
            <div style={{ background: 'rgba(245,158,11,0.12)', border: '2px solid rgba(245,158,11,0.4)', borderRadius: '16px', padding: '1.25rem 1.5rem', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Clock size={24} color="#f59e0b" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                  ⏳ Membership Application Under Admin Review
                </strong>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
                  Your request for the <strong>{pendingPlan.planName} Plan</strong> (Ref: {pendingPlan.transactionRef} via {pendingPlan.paymentMethod}) is awaiting verification by GoArts Admin. Your access will be activated upon payment confirmation.
                </p>
              </div>
            </div>
          )}

          {/* Pricing Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.75rem', marginBottom: '4rem' }}>
            {plans.map((plan) => {
              const Icon = PLAN_ICONS[plan.id] || Star;
              const isCurrent = currentPlan === plan.id;
              const isPendingThis = pendingPlan?.planId === plan.id;

              return (
                <div
                  key={plan.id}
                  style={{
                    background: 'var(--color-card)',
                    border: `2px solid ${isCurrent ? '#10b981' : plan.popular ? plan.color : 'var(--color-border)'}`,
                    borderRadius: '22px',
                    padding: '2rem',
                    position: 'relative',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: plan.popular ? '0 8px 30px rgba(66,133,244,0.15)' : 'none',
                  }}
                >
                  {plan.badge && (
                    <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: plan.color, color: 'white', fontSize: '0.72rem', fontWeight: 800, padding: '0.25rem 0.85rem', borderRadius: '99px', whiteSpace: 'nowrap' }}>
                      {plan.badge}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ background: `${plan.color}20`, borderRadius: '12px', padding: '0.6rem', display: 'flex' }}>
                      <Icon size={22} color={plan.color} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)' }}>{plan.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{plan.tagline}</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                      <span style={{ fontSize: '2rem', fontWeight: 900, color: plan.color }}>{plan.currency}{plan.price.toLocaleString('en-IN')}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>/{plan.billingCycle}</span>
                    </div>
                  </div>

                  <div style={{ flex: 1, marginBottom: '1.75rem' }}>
                    {plan.features.map((f) => (
                      <div key={f} style={{ display: 'flex', gap: '0.5rem', padding: '0.35rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <Check size={14} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{f}</span>
                      </div>
                    ))}
                    {plan.limitations?.map((l) => (
                      <div key={l} style={{ display: 'flex', gap: '0.5rem', padding: '0.3rem 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        <span style={{ flexShrink: 0 }}>✗</span><span>{l}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleOpenSubscribe(plan)}
                    disabled={isCurrent || isPendingThis}
                    className="btn btn-full"
                    style={{
                      fontWeight: 800,
                      background: isCurrent ? '#10b981' : plan.popular ? plan.color : 'transparent',
                      borderColor: isCurrent ? '#10b981' : plan.color,
                      color: isCurrent || plan.popular ? 'white' : plan.color,
                      opacity: isCurrent || isPendingThis ? 0.7 : 1,
                    }}
                  >
                    {isCurrent ? '✓ Active Plan' : isPendingThis ? '⏳ Under Review' : plan.cta}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Revenue Streams Overview */}
          {revenueStreams.length > 0 && (
            <div style={{ marginBottom: '4rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Platform Revenue Engine & Artist Economics
                </h2>
                <p style={{ color: 'var(--text-secondary)' }}>Transparent earnings model powering India's live entertainment marketplace</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                {revenueStreams.map((rs) => (
                  <div key={rs.name} style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1.5rem' }}>
                    <div style={{ fontSize: '2.2rem', marginBottom: '0.75rem' }}>{rs.icon}</div>
                    <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem', fontSize: '1rem' }}>{rs.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{rs.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Growth Tools Showcase */}
          <div style={{ background: 'linear-gradient(135deg, rgba(66,133,244,0.1), rgba(188,70,57,0.12))', border: '1px solid var(--color-border)', borderRadius: '22px', padding: '2.5rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              🚀 AI Features for Growth (Included in Elite Tier)
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '580px', margin: '0 auto 2rem auto' }}>
              Elite members unlock our proprietary generative marketing tools to create promotional videos, design instant posters, and automate social media calendars.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              {[
                { title: 'AI Video Reel Generator', desc: 'Auto promotional videos', link: '/ai-reel', icon: '🎬' },
                { title: 'AI Poster Creator', desc: 'Instant event poster concept', link: '/ai-poster', icon: '🎨' },
                { title: 'AI Social Media Manager', desc: 'Captions, schedules & tags', link: '/ai-social', icon: '📱' },
                { title: 'AI Event Prediction', desc: 'Demand & date forecasting', link: '/ai-ecosystem', icon: '📈' },
              ].map((tool) => (
                <a
                  key={tool.title}
                  href={tool.link}
                  style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '1.25rem', textDecoration: 'none', color: 'inherit', transition: 'all 0.2s', display: 'block' }}
                >
                  <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{tool.icon}</div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{tool.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{tool.desc}</div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── MEMBERSHIP PAYMENT & APPLICATION MODAL ─────────────────── */}
      {activePlanModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '24px', width: '100%', maxWidth: '520px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button
              onClick={() => setActivePlanModal(null)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ background: `${activePlanModal.color}20`, borderRadius: '12px', padding: '0.6rem' }}>
                <Crown size={22} color={activePlanModal.color} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                  Subscribe to {activePlanModal.name} Plan
                </h3>
                <span style={{ fontSize: '0.85rem', color: activePlanModal.color, fontWeight: 700 }}>
                  ₹{activePlanModal.price.toLocaleString('en-IN')}/{activePlanModal.billingCycle}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmitSubscription}>
              {/* Payment Method Selector */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Select Payment Method</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  {[
                    { id: 'UPI', label: '⚡ UPI / QR', desc: 'GPay, PhonePe, Paytm' },
                    { id: 'Card', label: '💳 Credit / Debit', desc: 'Visa, MasterCard' },
                    { id: 'NetBanking', label: '🏦 Net Banking', desc: 'NEFT / RTGS / IMPS' },
                    { id: 'Escrow', label: '🛡️ Bank Escrow', desc: 'Platform Verified' },
                  ].map((m) => (
                    <div
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id)}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '12px',
                        border: `1.5px solid ${paymentMethod === m.id ? '#4285F4' : 'var(--color-border)'}`,
                        background: paymentMethod === m.id ? 'rgba(66,133,244,0.1)' : 'var(--color-surface)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: '0.85rem', color: paymentMethod === m.id ? '#4285F4' : 'var(--text-primary)' }}>
                        {m.label}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Instructions Box */}
              <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem', fontSize: '0.8rem', lineHeight: 1.5 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  Official GoArts Payment Destination:
                </div>
                {paymentMethod === 'UPI' && (
                  <div>
                    <div>• UPI VPA ID: <strong style={{ color: '#4285F4', fontFamily: 'monospace' }}>goarts.official@icici</strong></div>
                    <div>• Scan or transfer ₹{activePlanModal.price.toLocaleString('en-IN')} and enter your UPI Ref / UTR number below.</div>
                  </div>
                )}
                {paymentMethod === 'Card' && (
                  <div>
                    <div>• Razorpay Merchant ID: <strong style={{ color: '#4285F4' }}>GOARTS-LIVE-IND</strong></div>
                    <div>• Complete payment via gateway or enter your Card Authorization Code below.</div>
                  </div>
                )}
                {paymentMethod === 'NetBanking' && (
                  <div>
                    <div>• Account: <strong>GoArts Live Entertainment Private Limited</strong></div>
                    <div>• A/C No: <strong>50200084920194</strong> · IFSC: <strong>HDFC0001824</strong></div>
                  </div>
                )}
                {paymentMethod === 'Escrow' && (
                  <div>
                    <div>• Platform Escrow Reference: <strong>ESCROW-GOARTS-2026</strong></div>
                    <div>• Held securely under platform dispute guarantee until verified.</div>
                  </div>
                )}
              </div>

              {/* Transaction Ref Input */}
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Transaction Reference / UTR Number *</label>
                <input
                  className="form-input"
                  placeholder="e.g. UPI/619283719283 or TXN-948201"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  required
                />
              </div>

              {/* Note / Remarks */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Note for Admin (Optional)</label>
                <input
                  className="form-input"
                  placeholder="e.g. Paid via GPay from Rahul Sharma"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setActivePlanModal(null)}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="spin" /> Submitting to Admin...
                    </>
                  ) : (
                    <>
                      <Check size={16} /> Submit for Admin Approval
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
