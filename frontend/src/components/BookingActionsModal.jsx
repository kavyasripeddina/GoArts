// GoArts AI - Interactive Booking Actions: Cancellation, Split Payment, Mutual Chat & Aadhaar KYC
import { useState, useEffect, useRef } from 'react';
import { 
  X, ShieldCheck, CheckCircle2, MessageSquare, CreditCard, AlertTriangle, 
  Send, Clock, Lock, Sparkles, DollarSign, UserCheck, Check
} from 'lucide-react';
import { formatINR, formatDate, Spinner } from './shared';
import { bookingsAPI, authAPI } from '../lib/api';
import toast from 'react-hot-toast';

// ── 1. CANCEL BOOKING MODAL ──────────────────────────────────
export function CancelModal({ booking, onClose, onSuccess, userRole = 'customer' }) {
  const [reason, setReason] = useState('Event Date Changed');
  const [customNote, setCustomNote] = useState('');
  const [loading, setLoading] = useState(false);

  const REASONS = userRole === 'customer' ? [
    'Event Date Changed',
    'Budget Constraints',
    'Venue or Schedule Conflict',
    'Found Alternative Artist',
    'Event Postponed or Cancelled',
    'Other Reason',
  ] : [
    'Schedule Conflict on this Date',
    'Technical / Gear Requirements Cannot Be Met',
    'Travel / Logistics Constraint',
    'Health or Emergency',
    'Other Reason',
  ];

  const handleCancel = async () => {
    setLoading(true);
    const finalReason = reason === 'Other Reason' ? (customNote || 'No specific reason provided.') : reason;
    try {
      const { data } = await bookingsAPI.updateStatus(booking.id, {
        status: 'cancelled',
        cancelReason: finalReason,
      });
      toast.success('Booking cancelled successfully.');
      onSuccess(data.booking || { ...booking, status: 'cancelled', cancelReason: finalReason });
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel booking.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '460px', animation: 'scaleUp 0.2s ease' }}>
        <div className="modal__header" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={20} color="#ef4444" />
            </div>
            <div>
              <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Cancel Booking</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Booking #{booking.id.slice(0, 8)}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div className="modal__body" style={{ padding: '1.25rem 0' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
            Are you sure you want to cancel the booking for <strong style={{ color: 'var(--text-primary)' }}>{booking.eventType}</strong> on <strong style={{ color: 'var(--text-primary)' }}>{formatDate(booking.eventDate)}</strong>? Both parties will be notified immediately.
          </p>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Please select a reason</label>
            <select className="form-select" value={reason} onChange={e => setReason(e.target.value)}>
              {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {reason === 'Other Reason' && (
            <div className="form-group">
              <label className="form-label">Additional notes (optional)</label>
              <textarea 
                className="form-textarea" 
                rows={3} 
                placeholder="Tell us what happened..." 
                value={customNote} 
                onChange={e => setCustomNote(e.target.value)} 
              />
            </div>
          )}
        </div>

        <div className="modal__footer" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Keep Booking</button>
          <button className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444', color: '#fff' }} onClick={handleCancel} disabled={loading}>
            {loading ? 'Cancelling...' : 'Confirm Cancellation'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 2. SPLIT MILESTONE PAYMENT MODAL (50% before, 50% after) ──
export function MilestonePaymentModal({ booking, milestone = 'advance', onClose, onSuccess }) {
  const [method, setMethod] = useState('UPI');
  const [loading, setLoading] = useState(false);
  const totalAmount = booking.quotedPrice || booking.budget || 0;
  const halfAmount = Math.round(totalAmount * 0.5);

  const isAdvance = milestone === 'advance';

  const handlePay = async () => {
    setLoading(true);
    try {
      const { data } = await bookingsAPI.payMilestone(booking.id, {
        milestone,
        paymentMethod: method,
      });
      toast.success(data.message || 'Payment completed successfully!');
      onSuccess(data.booking);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '500px', animation: 'scaleUp 0.2s ease' }}>
        <div className="modal__header" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(66, 133, 244, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={22} color="#4285F4" />
            </div>
            <div>
              <h3 style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                {isAdvance ? 'Pay 50% Advance (Deposit)' : 'Pay 50% Remaining Balance'}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Secure Milestone Escrow Payment</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div className="modal__body" style={{ padding: '1.25rem 0' }}>
          {/* Milestone Explanation Card */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px dashed var(--color-border)', paddingBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Agreed Amount</span>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{formatINR(totalAmount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.85rem', color: isAdvance ? '#4285F4' : 'var(--text-secondary)', fontWeight: isAdvance ? 700 : 500 }}>
                ● Step 1: 50% Advance (Before Performance)
              </span>
              <span style={{ fontWeight: 700, color: isAdvance ? '#4285F4' : 'var(--text-secondary)' }}>
                {formatINR(halfAmount)} {booking.paymentStatus !== 'unpaid' && <span style={{ color: '#10b981', fontSize: '0.75rem' }}>✓ Paid</span>}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: !isAdvance ? '#BC4639' : 'var(--text-secondary)', fontWeight: !isAdvance ? 700 : 500 }}>
                ● Step 2: 50% Balance (After Performance)
              </span>
              <span style={{ fontWeight: 700, color: !isAdvance ? '#BC4639' : 'var(--text-secondary)' }}>
                {formatINR(halfAmount)} {booking.paymentStatus === 'fully_paid' && <span style={{ color: '#10b981', fontSize: '0.75rem' }}>✓ Settled</span>}
              </span>
            </div>
          </div>

          {/* Amount Due Big Banner */}
          <div style={{ textAlign: 'center', padding: '1.25rem', background: 'linear-gradient(135deg, rgba(66,133,244,0.1), rgba(188,70,57,0.1))', borderRadius: '16px', border: '1px solid var(--color-border)', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', fontWeight: 700 }}>
              {isAdvance ? 'Advance Due Now' : 'Final Settlement Due'}
            </span>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#BC4639', marginTop: '0.25rem' }}>
              {formatINR(halfAmount)}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              {isAdvance ? 'Locks date and confirms artist availability' : 'Releases final payout to artist upon event completion'}
            </p>
          </div>

          {/* Payment Method Selector */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700 }}>Select Payment Method</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              {[
                { id: 'UPI', label: 'UPI (GPay / PhonePe)' },
                { id: 'Card', label: 'Credit / Debit Card' },
                { id: 'NetBanking', label: 'Net Banking' },
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  style={{
                    padding: '0.75rem 0.5rem',
                    borderRadius: '12px',
                    border: `1.5px solid ${method === m.id ? '#4285F4' : 'var(--color-border)'}`,
                    background: method === m.id ? 'rgba(66,133,244,0.12)' : 'var(--color-surface)',
                    color: method === m.id ? '#4285F4' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="modal__footer" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-primary" onClick={handlePay} disabled={loading} style={{ minWidth: '150px' }}>
            {loading ? 'Processing...' : `Pay ${formatINR(halfAmount)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 3. DIRECT CHAT MODAL (MUTUAL AGREEMENT SYSTEM) ────────────
export function ChatModal({ booking, onClose, currentUser, onChatUpdated }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatState, setChatState] = useState({
    chatEnabled: Boolean(booking.chatEnabled),
    chatRequestedBy: booking.chatRequestedBy || null,
  });
  const messagesEndRef = useRef(null);

  const isCustomer = currentUser?.role === 'customer';
  const otherPartyName = isCustomer 
    ? (booking.artist?.displayName || 'Artist') 
    : (booking.customer?.name || 'Client');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const { data } = await bookingsAPI.getMessages(booking.id);
      setMessages(data.messages || []);
      scrollToBottom();
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    if (!chatState.chatEnabled) {
      // Polling to detect counterpart acceptance (e.g. Artist accepting Customer's request or vice versa)
      const checkStatus = async () => {
        try {
          const { data } = await bookingsAPI.getById(booking.id);
          const b = data.booking;
          if (b && b.chatEnabled && isMounted) {
            setChatState({
              chatEnabled: true,
              chatRequestedBy: 'both',
            });
            if (onChatUpdated) {
              onChatUpdated(b);
            }
            loadMessages();
          }
        } catch {}
      };

      const interval = setInterval(checkStatus, 2500);
      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    } else {
      // Chat is enabled: poll for new messages in real time
      loadMessages();
      const interval = setInterval(loadMessages, 2500);
      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }
  }, [booking.id, chatState.chatEnabled]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleRequestChat = async () => {
    try {
      const { data } = await bookingsAPI.requestChat(booking.id);
      const isEnabled = Boolean(data.chatEnabled);
      const updated = data.booking || { 
        ...booking, 
        chatEnabled: isEnabled, 
        chatRequestedBy: isEnabled ? 'both' : (data.booking?.chatRequestedBy || 'requested') 
      };
      setChatState({
        chatEnabled: isEnabled,
        chatRequestedBy: updated.chatRequestedBy,
      });
      if (onChatUpdated) {
        onChatUpdated(updated);
      }
      toast.success(data.message || 'Chat status updated!');
      if (isEnabled) {
        loadMessages();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to request chat.');
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim() || sending) return;
    const textToSend = input.trim();
    setInput('');
    setSending(true);

    try {
      const { data } = await bookingsAPI.sendMessage(booking.id, { text: textToSend });
      setMessages(prev => [...prev, data.message]);
      scrollToBottom();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '580px', height: '620px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        {/* Chat Header */}
        <div style={{ padding: '1rem 1.25rem', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #4285F4, #BC4639)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>
              {otherPartyName?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{otherPartyName}</span>
                {booking.artist?.aadhaarVerified && (
                  <span title="Govt ID Verified" style={{ color: '#10b981', display: 'flex' }}><ShieldCheck size={16} /></span>
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {booking.eventType} • {formatDate(booking.eventDate)}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {/* Chat Content / Lock Screen */}
        {!chatState.chatEnabled ? (
          <div style={{ flex: 1, padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: 'var(--color-card)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(66,133,244,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Lock size={30} color="#4285F4" />
            </div>
            <h3 style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Mutual Agreement Direct Chat
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '400px', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              To protect personal privacy and ensure genuine bookings, direct messaging is enabled once both the customer and artist agree to connect.
            </p>

            {chatState.chatRequestedBy === currentUser?.role ? (
              <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '0.85rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Clock size={18} color="#f59e0b" />
                <span>You requested a direct chat. Waiting for <strong>{otherPartyName}</strong> to accept...</span>
              </div>
            ) : chatState.chatRequestedBy && chatState.chatRequestedBy !== currentUser?.role ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%', maxWidth: '380px' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '12px', padding: '0.75rem 1.25rem', color: '#10b981', fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center' }}>
                  <MessageSquare size={16} /> <span>{otherPartyName} requested direct chat with you!</span>
                </div>
                <button 
                  className="btn btn-primary" 
                  onClick={handleRequestChat}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    borderColor: '#10b981',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Check size={18} /> Accept & Start Chatting with {otherPartyName}
                </button>
              </div>
            ) : (
              <button 
                className="btn btn-primary" 
                onClick={handleRequestChat}
                style={{
                  padding: '0.75rem 1.75rem',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <MessageSquare size={18} /> Request Direct Chat
              </button>
            )}
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: 'var(--color-card)' }}>
            {/* Messages Scroll Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ textAlign: 'center', margin: '0.5rem 0 1rem' }}>
                <span style={{ fontSize: '0.75rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '999px', padding: '0.3rem 0.8rem', color: 'var(--text-muted)' }}>
                  🔒 Direct end-to-end chat unlocked for Booking #{booking.id.slice(0, 8)}
                </span>
              </div>

              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '3rem' }}>
                  No messages yet. Say hello to {otherPartyName} to coordinate event details!
                </div>
              ) : (
                messages.map(m => {
                  const isMe = m.senderId === currentUser?.id;
                  return (
                    <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem', padding: '0 0.4rem' }}>
                        {m.senderName} ({m.senderRole})
                      </div>
                      <div
                        style={{
                          maxWidth: '78%',
                          padding: '0.75rem 1rem',
                          borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          background: isMe ? 'linear-gradient(135deg, #4285F4, #3367D6)' : 'var(--color-surface)',
                          color: isMe ? '#ffffff' : 'var(--text-primary)',
                          border: isMe ? 'none' : '1px solid var(--color-border)',
                          fontSize: '0.875rem',
                          lineHeight: 1.5,
                          boxShadow: 'var(--shadow-sm)',
                          wordBreak: 'break-word',
                        }}
                      >
                        {m.text}
                      </div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem', padding: '0 0.4rem' }}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSendMessage} style={{ padding: '0.85rem 1rem', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                className="form-input"
                style={{ flex: 1, padding: '0.65rem 1rem' }}
                placeholder={`Message ${otherPartyName}...`}
                value={input}
                onChange={e => setInput(e.target.value)}
              />
              <button className="btn btn-primary" type="submit" disabled={!input.trim() || sending} style={{ padding: '0.65rem 1rem' }}>
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 4. GOVERNMENT ID / AADHAAR KYC VERIFICATION MODAL ─────────
export function AadhaarVerificationModal({ user, onClose, onSuccess }) {
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [legalName, setLegalName] = useState(user?.name || '');
  const [idType, setIdType] = useState('Aadhaar (UIDAI)');
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (!aadhaarNumber.trim() || !legalName.trim()) {
      return toast.error('Please enter your full legal name and ID number.');
    }

    setLoading(true);
    try {
      const { data } = await authAPI.verifyAadhaar({
        aadhaarNumber: aadhaarNumber.trim(),
        legalName: legalName.trim(),
        idType,
        submitForAdminReview: user?.role === 'customer',
      });
      toast.success(
        user?.role === 'customer'
          ? '📋 Government ID submitted to Admin for verification and approval!'
          : '🛡️ Government ID Verified Successfully!'
      );
      onSuccess(data.user);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '480px', animation: 'scaleUp 0.2s ease' }}>
        <div className="modal__header" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={22} color="#10b981" />
            </div>
            <div>
              <h3 style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)' }}>Government ID Verification</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>UIDAI Aadhaar / National ID Authentication</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <form onSubmit={handleVerify}>
          <div className="modal__body" style={{ padding: '1.25rem 0' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Verify your legal identity so both customers and artists can confirm you are a verified, authentic person. A green verified shield badge will appear on your profile.
            </p>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">ID Document Type</label>
              <select className="form-select" value={idType} onChange={e => setIdType(e.target.value)}>
                <option value="Aadhaar (UIDAI)">Aadhaar Card (12 Digits - UIDAI)</option>
                <option value="Passport">Indian Passport</option>
                <option value="Voter ID">Election Commission Voter ID</option>
                <option value="PAN Card">Income Tax PAN Card</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Full Legal Name (as per Govt ID)</label>
              <input 
                className="form-input" 
                placeholder="e.g. Kavya Krishnan" 
                value={legalName} 
                onChange={e => setLegalName(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">
                {idType === 'Aadhaar (UIDAI)' ? '12-Digit Aadhaar Number' : 'National ID Number'}
              </label>
              <input 
                className="form-input" 
                placeholder={idType === 'Aadhaar (UIDAI)' ? '1234 5678 9012' : 'ID Document Number'} 
                value={aadhaarNumber} 
                onChange={e => {
                  let val = e.target.value;
                  if (idType === 'Aadhaar (UIDAI)') {
                    val = val.replace(/\D/g, '').slice(0, 12);
                    val = val.replace(/(\d{4})(?=\d)/g, '$1 ');
                  }
                  setAadhaarNumber(val);
                }} 
                required 
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block', lineHeight: 1.4 }}>
                🔒 Strict Government UIDAI Rule: Each Aadhaar can be linked to <strong>at most one customer account</strong> and <strong>at most one artist account</strong>. For your privacy, only the last 4 digits are stored and displayed.
              </span>
            </div>

            <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '12px', padding: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <CheckCircle2 size={20} color="#10b981" />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Government verification builds 100% legal trust for bookings, escrow payments, and contracts on GoArts.
              </span>
            </div>
          </div>

          <div className="modal__footer" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', borderColor: '#10b981' }}>
              {loading ? 'Authenticating...' : 'Verify Government ID'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
