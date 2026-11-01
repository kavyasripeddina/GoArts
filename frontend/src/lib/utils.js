// GoArts AI - Shared Utility Functions

// ── Format Currency (Indian Rupees) ────────────────────────
export const formatINR = (amount) => `₹${(amount || 0).toLocaleString('en-IN')}`;

// ── Format Date ─────────────────────────────────────────────
export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// ── Format DateTime ─────────────────────────────────────────
export const formatDateTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ── Truncate Text ───────────────────────────────────────────
export const truncate = (str, len = 80) => {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '…' : str;
};

// ── Capitalize First Letter ─────────────────────────────────
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// ── Generate Avatar URL ─────────────────────────────────────
export const avatarUrl = (name, bg = 'BC4639') =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=${bg}&color=fff&size=200`;

// ── Debounce ────────────────────────────────────────────────
export const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

