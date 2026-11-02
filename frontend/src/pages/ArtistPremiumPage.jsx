// GoArts AI - Artist Premium Plans & Revenue Streams
import { useState, useEffect } from 'react';
import { Navbar, Footer } from '../components/shared';
import { aiAPI } from '../lib/api';
import { Crown, Check, Zap, Star, Loader2, TrendingUp, DollarSign, Megaphone, Award } from 'lucide-react';
import toast from 'react-hot-toast';

const PLAN_ICONS = { basic: Star, pro: Zap, elite: Crown };
const REVENUE_ICONS = { '💰': DollarSign, '⭐': Star, '📢': Megaphone, '🏆': Award };

export default function ArtistPremiumPage() {
  const [plans, setPlans] = useState([]);
  const [revenueStreams, setRevenueStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    aiAPI.subscriptionPlans().then(({ data }) => {
      setPlans(data.plans || []);
      setRevenueStreams(data.revenueStreams || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSubscribe = (plan) => {
    setSelectedPlan(plan.id);
    toast.success(`${plan.name} plan selected! Subscription gateway coming soon.`);
    setTimeout(() => setSelectedPlan(null), 3000);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-background)' }}>
      <Loader2 size={32} className="spin" style={{ color: '#4285F4' }} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background)' }}>
      <Navbar />
      <div style={{ paddingTop: '80px' }}>
        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg, var(--color-midnight), rgba(188,70,57,0.2))', borderBottom: '1px solid var(--color-border)', padding: '4rem 0 3rem', textAlign: 'center' }}>
          <div className="container">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(188,70,57,0.15)', border: '1px solid rgba(188,70,57,0.3)', borderRadius: '99px', padding: '0.35rem 1rem', marginBottom: '1.5rem' }}>
              <Crown size={14} color="#BC4639" />
              <span style={{ color: '#BC4639', fontSize: '0.8rem', fontWeight: 700 }}>ARTIST PREMIUM PLANS</span>
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '1rem', lineHeight: 1.2 }}>Grow Your Artist Career<br /><span style={{ background: 'linear-gradient(135deg, #4285F4, #BC4639)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>with GoArts AI</span></h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>Choose a plan that matches your ambitions. From emerging to elite — we have the tools to accelerate your success.</p>
          </div>
        </div>

        <div className="container" style={{ padding: '3rem 1rem' }}>
          {/* Pricing Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
            {plans.map(plan => {
              const Icon = PLAN_ICONS[plan.id] || Star;
              return (
                <div key={plan.id} style={{ background: 'var(--color-card)', border: `2px solid ${plan.popular ? plan.color : 'var(--color-border)'}`, borderRadius: '20px', padding: '2rem', position: 'relative', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  {plan.badge && (
                    <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: plan.color, color: 'white', fontSize: '0.72rem', fontWeight: 800, padding: '0.25rem 0.75rem', borderRadius: '99px', whiteSpace: 'nowrap' }}>
                      {plan.badge}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ background: `${plan.color}20`, borderRadius: '10px', padding: '0.5rem', display: 'flex' }}>
                      <Icon size={20} color={plan.color} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{plan.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{plan.tagline}</div>
                    </div>
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                      <span style={{ fontSize: '1.75rem', fontWeight: 900, color: plan.color }}>{plan.currency}{plan.price.toLocaleString('en-IN')}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>/{plan.billingCycle}</span>
                    </div>
                  </div>
                  <div style={{ flex: 1, marginBottom: '1.5rem' }}>
                    {plan.features.map(f => (
                      <div key={f} style={{ display: 'flex', gap: '0.5rem', padding: '0.3rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <Check size={14} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{f}</span>
                      </div>
                    ))}
                    {plan.limitations?.map(l => (
                      <div key={l} style={{ display: 'flex', gap: '0.5rem', padding: '0.3rem 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        <span style={{ flexShrink: 0 }}>✗</span><span>{l}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => handleSubscribe(plan)} className={`btn btn-full ${plan.popular ? 'btn-primary' : 'btn-outline'}`} disabled={selectedPlan === plan.id} style={{ fontWeight: 700, background: plan.popular ? plan.color : 'transparent', borderColor: plan.color, color: plan.popular ? 'white' : plan.color }}>
                    {selectedPlan === plan.id ? '✓ Selected!' : plan.cta}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Revenue Streams */}
          {revenueStreams.length > 0 && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Revenue Streams</h2>
                <p style={{ color: 'var(--text-secondary)' }}>How GoArts AI generates value for artists and the platform</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                {revenueStreams.map(rs => (
                  <div key={rs.name} style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '1.5rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{rs.icon}</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>{rs.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{rs.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Growth Tools Banner */}
          <div style={{ marginTop: '3rem', background: 'linear-gradient(135deg, rgba(66,133,244,0.1), rgba(188,70,57,0.1))', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '2rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>🚀 AI Growth Tools Included in Elite</h3>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {[['🎬', 'AI Video Reel Generator'], ['🎨', 'AI Poster Creator'], ['📱', 'AI Social Manager'], ['📈', 'Event Prediction'], ['🤖', '24x7 AI Assistant']].map(([icon, label]) => (
                <div key={label} style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{icon}</div>
                  {label}
                </div>
              ))}
            </div>
            <a href="/ai-ecosystem" className="btn btn-primary" style={{ textDecoration: 'none' }}>Explore AI Ecosystem →</a>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

