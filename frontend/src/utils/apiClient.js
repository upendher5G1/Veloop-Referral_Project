// Thin fetch wrapper for the VELOOP referral backend. All referral stats,
// balances, and progress shown in this app come from these calls - nothing
// user-specific is hardcoded in React per the integration requirements.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
const TOKEN_KEY = 'veloop_auth_token';
const DEVICE_TOKEN_KEY = 'veloop_device_token';

// A persistent, opaque per-browser device token. This is what lets the
// backend's fraud/device-risk service actually recognize "this is the same
// device" across separate accounts - without it, every request would look
// like a brand-new device and device-based fraud detection could never
// trigger from this client. Generated once and reused indefinitely; a real
// mobile app would typically use a more tamper-resistant equivalent
// (Keychain/Keystore-backed identifier), but the principle is the same:
// persist it client-side, never regenerate it per request.
export function getDeviceToken() {
  let token = localStorage.getItem(DEVICE_TOKEN_KEY);
  if (!token) {
    token = (crypto.randomUUID && crypto.randomUUID()) || `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(DEVICE_TOKEN_KEY, token);
  }
  return token;
}

// This frontend previously had NO authentication of any kind (it was a
// static dummy-data demo). Until this page is wired into VELOOP's real
// login flow, the token is picked up from a `?token=` query param (typical
// for a webview/app handoff) and persisted to localStorage, or read
// directly from localStorage on subsequent visits.
export function bootstrapAuthFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const tokenFromUrl = params.get('token');
  if (tokenFromUrl) {
    localStorage.setItem(TOKEN_KEY, tokenFromUrl);
    params.delete('token');
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ''}`;
    window.history.replaceState({}, '', newUrl);
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

class ApiError extends Error {
  constructor(status, code, message, extra = {}) {
    super(message);
    this.status = status;
    this.code = code;
    Object.assign(this, extra);
  }
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (!token) {
      throw new ApiError(401, 'NO_TOKEN', 'Not signed in.');
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const { code, message, ...extra } = json;
    throw new ApiError(res.status, code || 'UNKNOWN_ERROR', message || 'Something went wrong.', extra);
  }

  return json;
}

export const api = {
  getDashboard: () => request('/referrals/me'),
  getReferrals: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/referrals${query ? `?${query}` : ''}`);
  },
  getSpamSummary: () => request('/referrals/spam'),
  attributeReferral: (referralCode, deviceToken = getDeviceToken()) =>
    request('/referrals/attribute', { method: 'POST', body: { referralCode, deviceToken } }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
};

export { ApiError };
