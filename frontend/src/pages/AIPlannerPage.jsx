// GoArts AI - AI Event Planner & Smart Matching Page
import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  Sparkles, Bot, Send, Calendar, MapPin, DollarSign, Users, Music, 
  CheckCircle, ArrowRight, Clock, Shield, Sliders, ChevronRight,
  HelpCircle, Info, RefreshCw, Star, Layers, Check, ExternalLink
} from 'lucide-react';
import { Navbar, Footer, Spinner, formatINR, formatDate, ArtistCard } from '../components/shared';
import { aiAPI, artistsAPI } from '../lib/api';
import toast from 'react-hot-toast';

const EVENT_TYPES = [
  'Wedding', 'Corporate Event', 'College Festival', 'Concert', 
  'Birthday Party', 'Brand Launch', 'Cultural Event', 'Hotel Event'
];
const CITIES = ['Hyderabad', 'Bengaluru', 'Chennai', 'Mumbai', 'Delhi', 'Pune', 'Kolkata'];
const CATEGORIES = ['Singer', 'Band', 'DJ', 'Dancer', 'Comedian', 'Instrumentalist', 'Magician', 'Cultural Troupe'];
const LANGUAGES = ['Hindi', 'Telugu', 'Tamil', 'Kannada', 'English', 'Marathi', 'Punjabi'];

const QUICK_PROMPTS = [
  'Best singers for a 300-guest wedding in Hyderabad under ₹1 Lakh',
  'What is the typical budget for a college fest DJ and rock band?',
  'Recommend clean stand-up comedians for a corporate annual gala in Bengaluru',
  'How does GoArts escrow and artist booking confirmation work?',
];

export default function AIPlannerPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('planner'); // 'planner' | 'matcher' | 'chat'

  // Planner Form State
  const [plannerForm, setPlannerForm] = useState({
    eventType: location.state?.eventType || 'Wedding',
    city: location.state?.city || 'Hyderabad',
    budget: location.state?.budget || '150000',
    audienceSize: '300',
    language: 'Telugu',
    date: location.state?.date || '',
    description: '',
  });
  const [isCustomPlannerEvent, setIsCustomPlannerEvent] = useState(false);
  const [customPlannerEvent, setCustomPlannerEvent] = useState('');
  const [isCustomPlannerCity, setIsCustomPlannerCity] = useState(false);
  const [customPlannerCity, setCustomPlannerCity] = useState('');

  const [planResult, setPlanResult] = useState(null);
  const [planningLoading, setPlanningLoading] = useState(false);

  // Matcher Form State
  const [matcherForm, setMatcherForm] = useState({
    category: 'Singer',
    eventType: 'Wedding',
    city: 'Hyderabad',
    budget: '75000',
    language: 'Telugu',
    date: '',
  });
  const [isCustomMatcherEvent, setIsCustomMatcherEvent] = useState(false);
  const [customMatcherEvent, setCustomMatcherEvent] = useState('');
  const [isCustomMatcherCity, setIsCustomMatcherCity] = useState(false);
  const [customMatcherCity, setCustomMatcherCity] = useState('');

  const [matchResult, setMatchResult] = useState(null);
  const [matchingLoading, setMatchingLoading] = useState(false);

  // Chat State
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: "Hello! I am **GoArts AI**, your entertainment curation advisor. Describe your upcoming celebration or ask me about artist availability, budgets, and stage riders. How can I assist you today?",
      suggestions: ['Plan a wedding reception', 'Recommend college fest bands', 'Average artist rates', 'How booking works'],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Auto-run if state was passed from HomePage
  useEffect(() => {
    if (location.state?.eventType || location.state?.city) {
      handleGeneratePlan();
    }
  }, []);

  // ── Handlers ──────────────────────────────────────────────────
  const handleGeneratePlan = async (e) => {
    if (e) e.preventDefault();
    setPlanningLoading(true);
    const resolvedEventType = (plannerForm.eventType === '__custom__' || isCustomPlannerEvent)
      ? (customPlannerEvent.trim() || 'Custom Celebration')
      : plannerForm.eventType;
    const resolvedCity = (plannerForm.city === '__custom__' || isCustomPlannerCity)
      ? (customPlannerCity.trim() || 'Custom Location')
      : plannerForm.city;

    try {
      const { data } = await aiAPI.plan({
        eventType: resolvedEventType,
        city: resolvedCity,
        budget: Number(plannerForm.budget),
        audienceSize: Number(plannerForm.audienceSize),
        language: plannerForm.language,
        date: plannerForm.date,
        description: plannerForm.description || `${resolvedEventType} in ${resolvedCity} for ${plannerForm.audienceSize} people`,
      });
      setPlanResult(data.plan);
      toast.success('AI Event Plan generated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate event plan.');
    } finally {
      setPlanningLoading(false);
    }
  };

  const handleRunMatcher = async (e) => {
    if (e) e.preventDefault();
    setMatchingLoading(true);
    const resolvedEventType = (matcherForm.eventType === '__custom__' || isCustomMatcherEvent)
      ? (customMatcherEvent.trim() || 'Custom Celebration')
      : matcherForm.eventType;
    const resolvedCity = (matcherForm.city === '__custom__' || isCustomMatcherCity)
      ? (customMatcherCity.trim() || 'Custom Location')
      : matcherForm.city;

    try {
      const { data } = await aiAPI.match({
        category: matcherForm.category,
        eventType: resolvedEventType,
        city: resolvedCity,
        budget: Number(matcherForm.budget),
        language: matcherForm.language,
        date: matcherForm.date,
      });
      setMatchResult(data);
      toast.success(`Found ${data.matches.length} matching artists!`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to find matching artists.');
    } finally {
      setMatchingLoading(false);
    }
  };

  const handleSendChat = async (textToSend) => {
    const query = textToSend || chatInput;
    if (!query.trim() || chatLoading) return;

    const userMsg = {
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const { data } = await aiAPI.chat({ message: query });
      const botMsg = {
        sender: 'assistant',
        text: data.response,
        suggestions: data.suggestions || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: "I'm having trouble connecting to the intelligence engine right now. Please try asking again in a moment.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-midnight)', color: 'var(--text-primary)' }}>
      <Navbar />

      <main style={{ flex: 1, paddingTop: '100px', paddingBottom: '5rem' }}>
        <div className="container">
          
          {/* Header Banner */}
          <div style={{ 
            textAlign: 'center', 
            maxWidth: '780px', 
            margin: '0 auto 2.5rem',
            position: 'relative'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 1rem',
              borderRadius: '999px',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              color: '#fbbf24',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '1rem'
            }}>
              <Sparkles size={16} color="#f59e0b" />
              AI-Powered Entertainment Intelligence
            </div>

            <h1 className="font-display" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.15 }}>
              Smart Event Planning &{' '}
              <span style={{ 
                background: 'linear-gradient(135deg, #ff5e3a, #f59e0b, #06b6d4)', 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent' 
              }}>
                Talent Matching
              </span>
            </h1>

            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
              Harness predictive budgeting, automated rider specifications, and compatibility matching to secure the perfect lineup for your event.
            </p>

            {/* Navigation Tabs */}
            <div style={{ 
              display: 'inline-flex', 
              background: 'var(--color-card)', 
              border: '1px solid var(--color-border)',
              borderRadius: '999px', 
              padding: '4px', 
              marginTop: '1.75rem',
              gap: '4px'
            }}>
              {[
                { id: 'planner', label: 'AI Event Planner', icon: Layers },
                { id: 'matcher', label: 'Talent Matcher', icon: Sparkles },
                { id: 'chat', label: 'AI Advisor Chat', icon: Bot },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  id={`tab-${id}`}
                  onClick={() => setActiveTab(id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 1.4rem',
                    borderRadius: '999px',
                    border: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: activeTab === id ? 'linear-gradient(135deg, #ff5e3a, #f59e0b)' : 'transparent',
                    color: activeTab === id ? '#ffffff' : 'var(--text-secondary)',
                    boxShadow: activeTab === id ? '0 4px 15px rgba(255, 94, 58, 0.4)' : 'none',
                  }}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* TAB 1: AI EVENT PLANNER */}
          {activeTab === 'planner' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: '2rem', alignItems: 'start' }}>
                
                {/* Form Card */}
                <div style={{
                  background: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '24px',
                  padding: '2rem',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  position: 'sticky',
                  top: '100px'
                }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sliders size={20} color="#f59e0b" />
                    Event Parameters
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    Define your event specs to get a tailored entertainment roadmap.
                  </p>

                  <form onSubmit={handleGeneratePlan} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <label className="form-label" style={{ fontSize: '0.825rem', margin: 0 }}>Event Type</label>
                        <button
                          type="button"
                          onClick={() => {
                            const next = !isCustomPlannerEvent;
                            setIsCustomPlannerEvent(next);
                            if (next) setPlannerForm(prev => ({ ...prev, eventType: '__custom__' }));
                            else setPlannerForm(prev => ({ ...prev, eventType: EVENT_TYPES[0] }));
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: isCustomPlannerEvent ? '#fbbf24' : 'var(--text-muted)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                        >
                          {isCustomPlannerEvent ? '← Choose list' : '✏️ Custom event'}
                        </button>
                      </div>

                      {isCustomPlannerEvent || plannerForm.eventType === '__custom__' ? (
                        <input 
                          id="planner-custom-event-type"
                          type="text" 
                          className="form-input" 
                          placeholder="e.g. Sangeet, Half Saree, Housewarming, Dandiya..."
                          value={customPlannerEvent} 
                          onChange={(e) => setCustomPlannerEvent(e.target.value)}
                          autoFocus
                        />
                      ) : (
                        <select 
                          id="planner-event-type"
                          className="form-input" 
                          value={plannerForm.eventType} 
                          onChange={(e) => {
                            if (e.target.value === '__custom__') {
                              setIsCustomPlannerEvent(true);
                              setPlannerForm({ ...plannerForm, eventType: '__custom__' });
                            } else {
                              setPlannerForm({ ...plannerForm, eventType: e.target.value });
                            }
                          }}
                        >
                          {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                          <option value="__custom__">✨ Custom / Other Event Type...</option>
                        </select>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <label className="form-label" style={{ fontSize: '0.825rem', margin: 0 }}>City / Place</label>
                          <button
                            type="button"
                            onClick={() => {
                              const next = !isCustomPlannerCity;
                              setIsCustomPlannerCity(next);
                              if (next) setPlannerForm(prev => ({ ...prev, city: '__custom__' }));
                              else setPlannerForm(prev => ({ ...prev, city: CITIES[0] }));
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: isCustomPlannerCity ? '#fbbf24' : 'var(--text-muted)',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              textDecoration: 'underline'
                            }}
                          >
                            {isCustomPlannerCity ? '← List' : '✏️ Custom'}
                          </button>
                        </div>
                        {isCustomPlannerCity || plannerForm.city === '__custom__' ? (
                          <input 
                            id="planner-custom-city"
                            type="text" 
                            className="form-input" 
                            placeholder="e.g. Vijayawada, Goa, Jaipur, Vizag..."
                            value={customPlannerCity} 
                            onChange={(e) => setCustomPlannerCity(e.target.value)}
                            autoFocus
                          />
                        ) : (
                          <select 
                            id="planner-city"
                            className="form-input" 
                            value={plannerForm.city} 
                            onChange={(e) => {
                              if (e.target.value === '__custom__') {
                                setIsCustomPlannerCity(true);
                                setPlannerForm({ ...plannerForm, city: '__custom__' });
                              } else {
                                setPlannerForm({ ...plannerForm, city: e.target.value });
                              }
                            }}
                          >
                            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                            <option value="__custom__">✨ Custom / Other City...</option>
                          </select>
                        )}
                      </div>

                      <div>
                        <label className="form-label" style={{ fontSize: '0.825rem' }}>Audience Size</label>
                        <input 
                          id="planner-audience"
                          type="number" 
                          className="form-input" 
                          placeholder="e.g. 250"
                          value={plannerForm.audienceSize} 
                          onChange={(e) => setPlannerForm({ ...plannerForm, audienceSize: e.target.value })} 
                        />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <label className="form-label" style={{ fontSize: '0.825rem', margin: 0 }}>Entertainment Budget</label>
                        <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.85rem' }}>
                          {formatINR(Number(plannerForm.budget))}
                        </span>
                      </div>
                      <input 
                        id="planner-budget-range"
                        type="range" 
                        min="25000" 
                        max="1000000" 
                        step="10000"
                        value={plannerForm.budget} 
                        onChange={(e) => setPlannerForm({ ...plannerForm, budget: e.target.value })} 
                        style={{ width: '100%', accentColor: '#f59e0b' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span>₹25,000</span>
                        <span>₹5,00,000</span>
                        <span>₹10,00,000+</span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.825rem' }}>Primary Language</label>
                        <select 
                          id="planner-language"
                          className="form-input" 
                          value={plannerForm.language} 
                          onChange={(e) => setPlannerForm({ ...plannerForm, language: e.target.value })}
                        >
                          {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="form-label" style={{ fontSize: '0.825rem' }}>Tentative Date</label>
                        <input 
                          id="planner-date"
                          type="date" 
                          className="form-input" 
                          value={plannerForm.date} 
                          onChange={(e) => setPlannerForm({ ...plannerForm, date: e.target.value })} 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: '0.825rem' }}>Custom Vision / Vibes (Optional)</label>
                      <textarea 
                        id="planner-description"
                        className="form-input" 
                        rows="2" 
                        placeholder="e.g. High energy sangeet evening, modern Tollywood songs with a live band and a DJ for afterparty."
                        value={plannerForm.description} 
                        onChange={(e) => setPlannerForm({ ...plannerForm, description: e.target.value })}
                      />
                    </div>

                    <button 
                      id="btn-generate-plan"
                      type="submit" 
                      className="btn btn-primary" 
                      disabled={planningLoading}
                      style={{ 
                        marginTop: '0.5rem', 
                        padding: '0.85rem', 
                        fontWeight: 700, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '0.5rem' 
                      }}
                    >
                      {planningLoading ? <Spinner size={20} /> : <Sparkles size={18} />}
                      {planningLoading ? 'Synthesizing Plan...' : 'Generate Blueprint'}
                    </button>
                  </form>
                </div>

                {/* Results View */}
                <div>
                  {planningLoading ? (
                    <div style={{ 
                      minHeight: '400px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      background: 'var(--color-card)', 
                      borderRadius: '24px', 
                      border: '1px solid rgba(255,255,255,0.08)' 
                    }}>
                      <Spinner size={48} center />
                      <p style={{ marginTop: '1.25rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                        Analyzing talent databases and crafting production rider...
                      </p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Evaluating budget distribution, scheduling milestones, and compatibility ratings
                      </p>
                    </div>
                  ) : planResult ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                      
                      {/* Summary Header */}
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(255, 94, 58, 0.15), rgba(245, 158, 11, 0.1))',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: '20px',
                        padding: '1.75rem',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                          <div>
                            <span style={{ fontSize: '0.8rem', color: '#ff5e3a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Recommended Lineup Strategy
                            </span>
                            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
                              {planResult.interpretedRequirements.eventType} Production Plan
                            </h2>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target Budget</span>
                            <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399' }}>
                              {planResult.interpretedRequirements.budget}
                            </p>
                          </div>
                        </div>

                        {/* Pills */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span className="badge" style={{ background: 'var(--color-border)' }}>
                            <MapPin size={12} style={{ marginRight: '4px' }} />
                            {planResult.interpretedRequirements.city}
                          </span>
                          <span className="badge" style={{ background: 'var(--color-border)' }}>
                            <Users size={12} style={{ marginRight: '4px' }} />
                            {planResult.interpretedRequirements.audienceSize} Attendees
                          </span>
                          <span className="badge" style={{ background: 'var(--color-border)' }}>
                            Language: {planResult.interpretedRequirements.language}
                          </span>
                          {planResult.suggestedCategories.map((cat) => (
                            <span key={cat} className="badge" style={{ background: 'rgba(245,158,11,0.18)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.35)' }}>
                              <Music size={12} style={{ marginRight: '4px' }} />
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Recommended Artists */}
                      <div>
                        <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Star size={20} color="#f59e0b" />
                          Handpicked Recommended Performers
                        </h3>
                        
                        {planResult.artistRecommendations?.map((group) => (
                          <div key={group.category} style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                              <span style={{ fontWeight: 700, color: '#fbbf24', fontSize: '0.95rem' }}>{group.category} Recommendations</span>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({group.artists?.length || 0} top matches)</span>
                            </div>

                            {group.artists?.length > 0 ? (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                                {group.artists.map((artist) => (
                                  <div key={artist.id} style={{
                                    background: 'var(--color-surface)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '16px',
                                    padding: '1rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    gap: '0.75rem'
                                  }}>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                      <img 
                                        src={artist.profileImage} 
                                        alt={artist.stageName} 
                                        style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover' }} 
                                      />
                                      <div>
                                        <h4 style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0, color: 'var(--text-primary)' }}>{artist.stageName}</h4>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{artist.category} • {artist.city}</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '2px' }}>
                                          <Star size={12} color="#f59e0b" fill="#f59e0b" />
                                          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{artist.rating}</span>
                                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({artist.reviewCount})</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
                                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                        {formatINR(artist.startingPrice)}
                                      </span>
                                      <Link to={`/artists/${artist.id}`} className="btn btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderColor: 'rgba(245,158,11,0.3)', color: '#fbbf24' }}>
                                        View & Book
                                      </Link>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px' }}>
                                No specific artists matched for {group.category} within the estimated sub-budget. <Link to={`/artists?category=${group.category}`} style={{ color: '#fbbf24', textDecoration: 'underline' }}>Browse all {group.category}s</Link>
                              </p>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Budget Breakdown & Timeline Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        
                        {/* Budget Allocation */}
                        <div style={{
                          background: 'var(--color-card)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '20px',
                          padding: '1.5rem',
                        }}>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <DollarSign size={18} color="#34d399" />
                            Budget Allocation Breakdown
                          </h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            {planResult.budgetAllocation.map((item) => (
                              <div key={item.category}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                                  <span style={{ fontWeight: 600 }}>{item.category}</span>
                                  <span style={{ fontWeight: 700, color: '#fbbf24' }}>{formatINR(item.allocated)}</span>
                                </div>
                                <div style={{ height: '6px', background: 'var(--color-border)', borderRadius: '999px', overflow: 'hidden' }}>
                                  <div style={{
                                    height: '100%',
                                    width: `${Math.min(100, Math.round((item.allocated / (Number(plannerForm.budget) || 100000)) * 100))}%`,
                                    background: 'linear-gradient(90deg, #ff5e3a, #f59e0b)',
                                    borderRadius: '999px',
                                  }} />
                                </div>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.note}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Timeline */}
                        <div style={{
                          background: 'var(--color-card)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '20px',
                          padding: '1.5rem',
                        }}>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Clock size={18} color="#f59e0b" />
                            Production & Booking Timeline
                          </h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '2px solid rgba(245,158,11,0.3)', paddingLeft: '1rem', marginLeft: '0.5rem' }}>
                            {planResult.timeline.map((step, idx) => (
                              <div key={idx} style={{ position: 'relative' }}>
                                <div style={{
                                  position: 'absolute',
                                  left: '-1.45rem',
                                  top: '2px',
                                  width: '12px',
                                  height: '12px',
                                  borderRadius: '50%',
                                  background: idx === planResult.timeline.length - 1 ? '#ff5e3a' : '#f59e0b',
                                  border: '2px solid var(--color-midnight)'
                                }} />
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ff5e3a', textTransform: 'uppercase' }}>
                                  {step.time}
                                </span>
                                <p style={{ fontSize: '0.85rem', color: 'rgba(248,248,255,0.85)', marginTop: '2px' }}>
                                  {step.task}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Technical Rider & Assumptions */}
                      <div style={{
                        background: 'var(--color-card)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '20px',
                        padding: '1.5rem',
                      }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Shield size={18} color="#06b6d4" />
                          Recommended Technical Rider & Production Notes
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                          <div>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                              Stage & Audio Specifications
                            </h4>
                            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                              {planResult.technicalRequirements.map((req, i) => (
                                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.825rem', color: 'rgba(248,248,255,0.7)' }}>
                                  <Check size={14} color="#10b981" style={{ flexShrink: 0, marginTop: '3px' }} />
                                  <span>{req}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                              Logistics & Advisory Assumptions
                            </h4>
                            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                              {planResult.assumptions?.map((ass, i) => (
                                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.825rem', color: 'rgba(248,248,255,0.7)' }}>
                                  <Info size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: '3px' }} />
                                  <span>{ass}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                    </div>
                  ) : (
                    /* Default state before submission */
                    <div style={{
                      background: 'var(--color-card)',
                      border: '1px dashed var(--color-border-light)',
                      borderRadius: '24px',
                      padding: '4rem 2rem',
                      textAlign: 'center',
                    }}>
                      <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '20px',
                        background: 'rgba(245, 158, 11, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.25rem',
                        color: '#f59e0b'
                      }}>
                        <Sparkles size={32} />
                      </div>
                      <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                        Ready to Architect Your Event?
                      </h3>
                      <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
                        Adjust your parameters on the left and click "Generate Blueprint" to generate your artist breakdown, budget pacing, and technical stage rider.
                      </p>
                      <button 
                        onClick={handleGeneratePlan}
                        className="btn btn-outline" 
                        style={{ padding: '0.6rem 1.4rem', borderColor: 'rgba(245,158,11,0.3)', color: '#fbbf24' }}
                      >
                        Run with Sample Settings
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: SMART TALENT MATCHER */}
          {activeTab === 'matcher' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{
                background: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                borderRadius: '24px',
                padding: '1.75rem',
                marginBottom: '2rem',
                boxShadow: 'var(--shadow-md)'
              }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={18} color="#f59e0b" />
                  Instant Compatibility Ranking
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  Filter vetted artists by multi-factor score: category fit (30 pts), budget compatibility (25 pts), city location (15 pts), languages (15 pts), and ratings (15 pts).
                </p>

                <form onSubmit={handleRunMatcher} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Category</label>
                    <select 
                      id="matcher-category"
                      className="form-input" 
                      value={matcherForm.category} 
                      onChange={(e) => setMatcherForm({ ...matcherForm, category: e.target.value })}
                    >
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <label className="form-label" style={{ fontSize: '0.8rem', margin: 0 }}>Event Type</label>
                      <button
                        type="button"
                        onClick={() => {
                          const next = !isCustomMatcherEvent;
                          setIsCustomMatcherEvent(next);
                          if (next) setMatcherForm(prev => ({ ...prev, eventType: '__custom__' }));
                          else setMatcherForm(prev => ({ ...prev, eventType: EVENT_TYPES[0] }));
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: isCustomMatcherEvent ? '#fbbf24' : 'var(--text-muted)',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        {isCustomMatcherEvent ? '← List' : '✏️ Custom'}
                      </button>
                    </div>
                    {isCustomMatcherEvent || matcherForm.eventType === '__custom__' ? (
                      <input 
                        id="matcher-custom-event-type"
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. Sangeet, Dandiya..."
                        value={customMatcherEvent} 
                        onChange={(e) => setCustomMatcherEvent(e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <select 
                        id="matcher-event-type"
                        className="form-input" 
                        value={matcherForm.eventType} 
                        onChange={(e) => {
                          if (e.target.value === '__custom__') {
                            setIsCustomMatcherEvent(true);
                            setMatcherForm({ ...matcherForm, eventType: '__custom__' });
                          } else {
                            setMatcherForm({ ...matcherForm, eventType: e.target.value });
                          }
                        }}
                      >
                        {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                        <option value="__custom__">✨ Custom / Other...</option>
                      </select>
                    )}
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <label className="form-label" style={{ fontSize: '0.8rem', margin: 0 }}>Target City</label>
                      <button
                        type="button"
                        onClick={() => {
                          const next = !isCustomMatcherCity;
                          setIsCustomMatcherCity(next);
                          if (next) setMatcherForm(prev => ({ ...prev, city: '__custom__' }));
                          else setMatcherForm(prev => ({ ...prev, city: CITIES[0] }));
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: isCustomMatcherCity ? '#fbbf24' : 'var(--text-muted)',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        {isCustomMatcherCity ? '← List' : '✏️ Custom'}
                      </button>
                    </div>
                    {isCustomMatcherCity || matcherForm.city === '__custom__' ? (
                      <input 
                        id="matcher-custom-city"
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. Vijayawada, Goa..."
                        value={customMatcherCity} 
                        onChange={(e) => setCustomMatcherCity(e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <select 
                        id="matcher-city"
                        className="form-input" 
                        value={matcherForm.city} 
                        onChange={(e) => {
                          if (e.target.value === '__custom__') {
                            setIsCustomMatcherCity(true);
                            setMatcherForm({ ...matcherForm, city: '__custom__' });
                          } else {
                            setMatcherForm({ ...matcherForm, city: e.target.value });
                          }
                        }}
                      >
                        {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        <option value="__custom__">✨ Custom / Other City...</option>
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Language</label>
                    <select 
                      id="matcher-language"
                      className="form-input" 
                      value={matcherForm.language} 
                      onChange={(e) => setMatcherForm({ ...matcherForm, language: e.target.value })}
                    >
                      {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Max Budget (₹)</label>
                    <input 
                      id="matcher-budget"
                      type="number" 
                      className="form-input" 
                      placeholder="e.g. 75000"
                      value={matcherForm.budget} 
                      onChange={(e) => setMatcherForm({ ...matcherForm, budget: e.target.value })} 
                    />
                  </div>

                  <button 
                    id="btn-match-artists"
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={matchingLoading}
                    style={{ height: '44px', fontWeight: 700 }}
                  >
                    {matchingLoading ? <Spinner size={18} /> : 'Calculate Matches'}
                  </button>
                </form>
              </div>

              {/* Matcher Results */}
              {matchingLoading ? (
                <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                  <Spinner size={40} center />
                  <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Scoring available artists against your criteria...</p>
                </div>
              ) : matchResult ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                      Matched {matchResult.matches?.length || 0} Performers
                    </h3>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Ranked by compatibility percentage
                    </span>
                  </div>

                  {matchResult.matches?.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--color-card)', borderRadius: '20px' }}>
                      <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>No artists found strictly meeting this budget and category.</p>
                      <button onClick={() => setMatcherForm({ ...matcherForm, budget: '150000' })} className="btn btn-outline" style={{ borderColor: 'rgba(245,158,11,0.3)', color: '#fbbf24' }}>
                        Broaden Budget Threshold
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                      {matchResult.matches.map(({ artist, score, reasons, gaps }) => (
                        <div key={artist.id} style={{
                          background: 'var(--color-card)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '20px',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                          transition: 'transform 0.2s',
                        }}>
                          {/* Image & Match Badge */}
                          <div style={{ position: 'relative', height: '180px' }}>
                            <img 
                              src={artist.profileImage} 
                              alt={artist.stageName} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            />
                            <div style={{
                              position: 'absolute',
                              top: '12px',
                              right: '12px',
                              background: 'rgba(0, 0, 0, 0.75)',
                              backdropFilter: 'blur(10px)',
                              border: '1px solid rgba(245, 158, 11, 0.4)',
                              borderRadius: '999px',
                              padding: '4px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 2px 10px rgba(0,0,0,0.5)'
                            }}>
                              <span style={{ color: '#10b981', fontWeight: 800, fontSize: '0.85rem' }}>
                                {score}%
                              </span>
                              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>Match</span>
                            </div>
                            <div style={{
                              position: 'absolute',
                              bottom: '12px',
                              left: '12px',
                              background: 'rgba(0,0,0,0.65)',
                              backdropFilter: 'blur(8px)',
                              padding: '3px 10px',
                              borderRadius: '8px',
                              fontSize: '0.75rem',
                              color: '#ffffff'
                            }}>
                              {artist.category}
                            </div>
                          </div>

                          {/* Body */}
                          <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{artist.stageName}</h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#f59e0b', fontSize: '0.85rem', fontWeight: 700 }}>
                                  <Star size={14} fill="#f59e0b" />
                                  <span>{artist.rating}</span>
                                </div>
                              </div>
                              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '1rem' }}>
                                <MapPin size={13} /> {artist.city} • Languages: {artist.languages?.slice(0, 2).join(', ')}
                              </p>

                              {/* Match Reasons */}
                              <div style={{ marginBottom: '1rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                                  Match Signals:
                                </span>
                                <ul style={{ marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                  {reasons.slice(0, 3).map((r, i) => (
                                    <li key={i} style={{ fontSize: '0.775rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                      <CheckCircle size={12} /> {r}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            {/* Footer & CTA */}
                            <div style={{ paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Starts at</span>
                                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>{formatINR(artist.startingPrice)}</span>
                              </div>
                              <Link to={`/artists/${artist.id}`} className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>
                                Book Artist
                              </Link>
                            </div>

                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                  <button onClick={handleRunMatcher} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
                    Find Recommended Artists
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AI ADVISOR CHAT */}
          {activeTab === 'chat' && (
            <div style={{ 
              maxWidth: '850px', 
              margin: '0 auto', 
              animation: 'fadeIn 0.3s ease',
              background: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
              height: '620px'
            }}>
              
              {/* Chat Header */}
              <div style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--color-border)',
                background: 'var(--color-deep)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #ff5e3a, #f59e0b)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 15px rgba(245,158,11,0.45)'
                  }}>
                    <Bot size={22} color="white" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>GoArts AI Assistant</h3>
                    <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                      Online • Entertainment Consultant
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => setMessages([messages[0]])}
                  className="btn btn-outline" 
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', gap: '4px', borderColor: 'var(--color-border)' }}
                >
                  <RefreshCw size={12} /> Clear Chat
                </button>
              </div>

              {/* Chat Message History */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem'
              }}>
                {messages.map((msg, idx) => (
                  <div 
                    key={idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div style={{
                      maxWidth: '80%',
                      background: msg.sender === 'user' 
                        ? 'linear-gradient(135deg, #ff5e3a, #f59e0b)' 
                        : '#192030',
                      border: msg.sender === 'user' 
                        ? 'none' 
                        : '1px solid rgba(255,255,255,0.08)',
                      padding: '1rem 1.25rem',
                      borderRadius: msg.sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                      color: '#ffffff',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                      fontSize: '0.925rem',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap'
                    }}>
                      {msg.text}
                    </div>

                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', padding: '0 4px' }}>
                      {msg.timestamp}
                    </span>

                    {/* Quick Follow-up Pills */}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.6rem' }}>
                        {msg.suggestions.map((sug, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => handleSendChat(sug)}
                            style={{
                              background: 'rgba(245, 158, 11, 0.12)',
                              border: '1px solid rgba(245, 158, 11, 0.28)',
                              borderRadius: '999px',
                              padding: '0.35rem 0.85rem',
                              color: '#fbbf24',
                              fontSize: '0.775rem',
                              fontWeight: 500,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => e.target.style.background = 'rgba(245, 158, 11, 0.25)'}
                            onMouseLeave={(e) => e.target.style.background = 'rgba(245, 158, 11, 0.12)'}
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {chatLoading && (
                  <div style={{ alignSelf: 'flex-start', background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '0.75rem 1.25rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Spinner size={16} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>GoArts AI is typing...</span>
                  </div>
                )}
              </div>

              {/* Quick Prompts Bar */}
              <div style={{
                padding: '0.6rem 1.25rem',
                background: 'var(--color-deep)',
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                gap: '0.5rem',
                overflowX: 'auto',
                whiteSpace: 'nowrap'
              }}>
                {QUICK_PROMPTS.map((qp, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendChat(qp)}
                    style={{
                      background: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      padding: '0.3rem 0.6rem',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    {qp}
                  </button>
                ))}
              </div>

              {/* Chat Input Bar */}
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSendChat(); }}
                style={{
                  padding: '1rem 1.25rem',
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  background: 'var(--color-card)',
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'center'
                }}
              >
                <input 
                  id="chat-input"
                  type="text" 
                  className="form-input" 
                  placeholder="Ask about pricing, planning, artist genres, or booking terms..."
                  value={chatInput} 
                  onChange={(e) => setChatInput(e.target.value)}
                  style={{ flex: 1, padding: '0.75rem 1rem' }}
                />
                <button 
                  id="btn-chat-send"
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={!chatInput.trim() || chatLoading}
                  style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Send size={16} />
                  <span>Send</span>
                </button>
              </form>

            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
