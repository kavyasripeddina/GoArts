// GoArts AI - Booking Modal
import { useState } from 'react';
import { X, Calendar, MapPin, Users, Clock, DollarSign, FileText, Check, AlertCircle } from 'lucide-react';
import { bookingsAPI } from '../lib/api';
import { formatINR } from '../components/shared';
import toast from 'react-hot-toast';

const EVENT_TYPES = ['Wedding', 'Corporate Event', 'College Festival', 'Concert', 'Birthday Party', 'Brand Launch', 'Cultural Event', 'Hotel Event', 'Government Event', 'Private Party'];
const CITIES = ['Hyderabad', 'Bengaluru', 'Chennai', 'Mumbai', 'Delhi', 'Pune', 'Kolkata', 'Ahmedabad'];
const LANGUAGES = ['Hindi', 'Telugu', 'Tamil', 'Kannada', 'Marathi', 'Gujarati', 'Punjabi', 'English', 'Urdu'];

export default function BookingModal({ artist, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isCustomEventType, setIsCustomEventType] = useState(false);
  const [customEventType, setCustomEventType] = useState('');
  const [isCustomCity, setIsCustomCity] = useState(false);
  const [customCity, setCustomCity] = useState('');

  const [form, setForm] = useState({
    eventType: '',
    eventDate: '',
    city: '',
    venue: '',
    address: '',
    budget: '',
    duration: 3,
    audienceSize: '',
    languagePreference: '',
    specialRequirements: '',
  });

  const today = new Date().toISOString().split('T')[0];

  const resolvedEventType = isCustomEventType ? customEventType.trim() : form.eventType;
  const resolvedCity = isCustomCity ? customCity.trim() : form.city;

  const validateStep1 = () => {
    const e = {};
    if (!resolvedEventType) e.eventType = 'Event type is required.';
    if (!form.eventDate) e.eventDate = 'Event date is required.';
    else if (form.eventDate <= today) e.eventDate = 'Event date must be in the future.';
    if (!resolvedCity) e.city = 'City / Location is required.';
    if (!form.budget || form.budget < 1000) e.budget = 'Please enter a valid budget (min ₹1,000).';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    setStep(2);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await bookingsAPI.create({
        artistId: artist.id,
        eventType: resolvedEventType,
        eventDate: form.eventDate,
        eventLocation: { city: resolvedCity, venue: form.venue, address: form.address },
        budget: Number(form.budget),
        duration: Number(form.duration),
        audienceSize: Number(form.audienceSize) || 0,
        languagePreference: form.languagePreference,
        specialRequirements: form.specialRequirements,
      });
      toast.success('Booking request sent successfully!');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send booking request.');
    } finally {
      setLoading(false);
    }
  };

  const estimatedTotal = form.budget ? Math.max(Number(form.budget), artist.startingPrice) : artist.startingPrice;
  const platformFee = Math.round(estimatedTotal * 0.15);
  const artistEarning = estimatedTotal - platformFee;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '580px' }}>
        {/* Header */}
        <div className="modal__header">
          <div>
            <h2 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
              {step === 1 ? 'Event Details' : 'Review & Confirm'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Booking request for {artist.displayName}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Step indicator */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[1, 2].map(s => (
                <div key={s} style={{ width: '28px', height: '6px', borderRadius: '3px', background: s <= step ? 'linear-gradient(135deg, #4285F4, #BC4639)' : 'var(--color-border)', transition: 'all 0.3s' }} />
              ))}
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="modal__body">
          {step === 1 && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Event Type with Custom Option */}
                <div className="form-group">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Event Type *</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomEventType(!isCustomEventType);
                        if (!isCustomEventType) setCustomEventType(form.eventType || '');
                      }}
                      style={{ background: 'transparent', border: 'none', color: '#4285F4', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                    >
                      {isCustomEventType ? '← Select from list' : '✏️ Type custom event'}
                    </button>
                  </div>

                  {isCustomEventType ? (
                    <div>
                      <div style={{ position: 'relative' }}>
                        <Calendar size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        <input
                          className="form-input"
                          style={{ paddingLeft: '2.25rem', borderColor: errors.eventType ? '#ef4444' : undefined }}
                          type="text"
                          placeholder="e.g. Sangeet, Housewarming, Dandiya Night, Half Saree"
                          value={customEventType}
                          onChange={e => setCustomEventType(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                        {['Sangeet', 'Housewarming', 'Dandiya Night', 'Half Saree', 'Farewell'].map(chip => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => setCustomEventType(chip)}
                            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '999px', padding: '0.15rem 0.5rem', fontSize: '0.68rem', color: 'var(--text-secondary)', cursor: 'pointer' }}
                          >
                            + {chip}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <Calendar size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                      <select
                        className="form-select"
                        style={{ paddingLeft: '2.25rem', borderColor: errors.eventType ? '#ef4444' : undefined }}
                        value={form.eventType}
                        onChange={e => {
                          if (e.target.value === '__custom__') {
                            setIsCustomEventType(true);
                          } else {
                            setForm(p => ({ ...p, eventType: e.target.value }));
                          }
                        }}
                      >
                        <option value="">Select type</option>
                        {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        <option value="__custom__">✨ Custom / Other Event Type...</option>
                      </select>
                    </div>
                  )}
                  {errors.eventType && <span className="form-error">{errors.eventType}</span>}
                </div>

                {/* Event Date */}
                <div className="form-group">
                  <label className="form-label">Event Date *</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input className="form-input" style={{ paddingLeft: '2.25rem', borderColor: errors.eventDate ? '#ef4444' : undefined }} type="date" min={today} value={form.eventDate} onChange={e => setForm(p => ({ ...p, eventDate: e.target.value }))} />
                  </div>
                  {errors.eventDate && <span className="form-error">{errors.eventDate}</span>}
                </div>

                {/* City with Custom Option */}
                <div className="form-group">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>City / Place *</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomCity(!isCustomCity);
                        if (!isCustomCity) setCustomCity(form.city || '');
                      }}
                      style={{ background: 'transparent', border: 'none', color: '#4285F4', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                    >
                      {isCustomCity ? '← Select from list' : '✏️ Type custom place'}
                    </button>
                  </div>

                  {isCustomCity ? (
                    <div>
                      <div style={{ position: 'relative' }}>
                        <MapPin size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        <input
                          className="form-input"
                          style={{ paddingLeft: '2.25rem', borderColor: errors.city ? '#ef4444' : undefined }}
                          type="text"
                          placeholder="e.g. Vijayawada, Goa, Jaipur, Vizag, Surat"
                          value={customCity}
                          onChange={e => setCustomCity(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                        {['Vijayawada', 'Goa', 'Jaipur', 'Vizag', 'Kochi', 'Coimbatore'].map(chip => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => setCustomCity(chip)}
                            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '999px', padding: '0.15rem 0.5rem', fontSize: '0.68rem', color: 'var(--text-secondary)', cursor: 'pointer' }}
                          >
                            + {chip}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <MapPin size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                      <select
                        className="form-select"
                        style={{ paddingLeft: '2.25rem', borderColor: errors.city ? '#ef4444' : undefined }}
                        value={form.city}
                        onChange={e => {
                          if (e.target.value === '__custom__') {
                            setIsCustomCity(true);
                          } else {
                            setForm(p => ({ ...p, city: e.target.value }));
                          }
                        }}
                      >
                        <option value="">Select city</option>
                        {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                        <option value="__custom__">✨ Custom / Other City or Place...</option>
                      </select>
                    </div>
                  )}
                  {errors.city && <span className="form-error">{errors.city}</span>}
                </div>

                {/* Budget */}
                <div className="form-group">
                  <label className="form-label">Your Budget (₹) *</label>
                  <div style={{ position: 'relative' }}>
                    <DollarSign size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input className="form-input" style={{ paddingLeft: '2.25rem', borderColor: errors.budget ? '#ef4444' : undefined }} type="number" placeholder="e.g. 50000" min="1000" value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} />
                  </div>
                  {errors.budget && <span className="form-error">{errors.budget}</span>}
                  {form.budget && Number(form.budget) < artist.startingPrice && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#BC4639', marginTop: '0.25rem' }}>
                      <AlertCircle size={12} /> Artist's starting price is {formatINR(artist.startingPrice)}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Duration (hours)</label>
                  <div style={{ position: 'relative' }}>
                    <Clock size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input className="form-input" style={{ paddingLeft: '2.25rem' }} type="number" min="1" max="24" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Expected Audience</label>
                  <div style={{ position: 'relative' }}>
                    <Users size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input className="form-input" style={{ paddingLeft: '2.25rem' }} type="number" placeholder="e.g. 500" value={form.audienceSize} onChange={e => setForm(p => ({ ...p, audienceSize: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Venue / Hall / Address</label>
                <input className="form-input" type="text" placeholder="e.g. Taj Deccan Banquets, Grand Ballroom, Beach Resort Lawns" value={form.venue} onChange={e => setForm(p => ({ ...p, venue: e.target.value }))} />
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Language Preference</label>
                <select className="form-select" value={form.languagePreference} onChange={e => setForm(p => ({ ...p, languagePreference: e.target.value }))}>
                  <option value="">No preference</option>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Special Requirements</label>
                <textarea className="form-textarea" placeholder="Any specific songs, costume requirements, stage setup, or other requests..." value={form.specialRequirements} onChange={e => setForm(p => ({ ...p, specialRequirements: e.target.value }))} style={{ minHeight: '80px' }} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              {/* Artist Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--color-surface)', borderRadius: '14px', padding: '1rem', marginBottom: '1.5rem', border: '1px solid var(--color-border)' }}>
                <img src={artist.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.displayName)}&background=4285F4&color=fff`} alt={artist.displayName} style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover' }} onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.displayName)}&background=4285F4&color=fff`; }} />
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{artist.displayName}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{artist.category} · {artist.city}</div>
                </div>
              </div>

              {/* Event Details */}
              <h4 style={{ fontWeight: 700, fontSize: '0.875rem', color: '#BC4639', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem' }}>Event Details</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', background: 'var(--color-surface)', borderRadius: '14px', padding: '1rem', marginBottom: '1.5rem', border: '1px solid var(--color-border)' }}>
                {[
                  ['Event Type', resolvedEventType],
                  ['Date', form.eventDate],
                  ['Location', `${form.venue ? form.venue + ', ' : ''}${resolvedCity}`],
                  ['Duration', `${form.duration} hours`],
                  ['Audience', form.audienceSize ? `~${Number(form.audienceSize).toLocaleString('en-IN')} people` : 'Not specified'],
                  ['Language', form.languagePreference || 'No preference'],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Price & Split Payment Estimate */}
              <h4 style={{ fontWeight: 700, fontSize: '0.875rem', color: '#BC4639', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem' }}>
                Price & Milestone Payment Terms
              </h4>
              <div style={{ background: 'var(--color-deep)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '1.1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Proposed Event Budget</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatINR(Number(form.budget))}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
                  <span>Artist Minimum Starting Rate</span>
                  <span>{formatINR(artist.startingPrice)} (Budget meets minimum)</span>
                </div>

                <div style={{ background: 'var(--color-surface)', borderRadius: '10px', padding: '0.75rem', margin: '0.65rem 0', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4285F4', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>
                    GoArts 50/50 Escrow Protection Milestones
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>1️⃣ 50% Advance (to confirm date)</span>
                    <span style={{ fontWeight: 700, color: '#10b981' }}>{formatINR(Math.round(estimatedTotal * 0.5))}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>2️⃣ 50% Balance (after show completion)</span>
                    <span style={{ fontWeight: 700, color: '#4285F4' }}>{formatINR(Math.round(estimatedTotal * 0.5))}</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem', borderTop: '1px dashed var(--color-border)', paddingTop: '0.35rem' }}>
                    * 15% platform escrow fee ({formatINR(platformFee)}) is included in the total and deducted from artist payout. No extra charges are added to you.
                  </div>
                </div>

                <div style={{ height: '1px', background: 'var(--color-border)', margin: '0.75rem 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800 }}>
                  <span style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>Estimated Total Cost</span>
                  <span style={{ color: '#BC4639', fontSize: '1.25rem' }}>{formatINR(estimatedTotal)}</span>
                </div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                  * The artist will review your event requirements and send a confirmed quote.
                </p>
              </div>

              <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '12px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Check size={16} color="#10b981" style={{ flexShrink: 0 }} />
                <p style={{ fontSize: '0.8rem', color: '#10b981', margin: 0, fontWeight: 600 }}>
                  No payment required now. The 50% advance is only paid AFTER the artist accepts your request.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal__footer">
          {step === 2 && (
            <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
          )}
          {step === 1 ? (
            <button className="btn btn-primary" style={{ minWidth: '120px' }} onClick={handleNext}>
              Next: Review →
            </button>
          ) : (
            <button className="btn btn-primary" style={{ minWidth: '160px' }} onClick={handleSubmit} disabled={loading}>
              {loading ? 'Sending...' : <><Calendar size={15} /> Send Request</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
