// Mandi-Connect Auth Module - Email/Password Authentication
// Calls backend API for registration and login. OTP has been removed.

// Fallback logic for localhost/127.0.0.1
const BACKEND_PORT = 3002;
const backendUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
  ? `http://127.0.0.1:${BACKEND_PORT}` 
  : `http://${window.location.hostname}:${BACKEND_PORT}`;

const AUTH_API = `${backendUrl}/api/auth`;

console.log('[Auth] Backend URL set to:', AUTH_API);

// Session helpers
window.saveLocalSession = function(profile) {
  localStorage.setItem('mc_profile', JSON.stringify(profile));
}

window.getLocalProfile = function() {
  try { return JSON.parse(localStorage.getItem('mc_profile')); } catch { return null; }
}

window.clearLocalSession = function() {
  localStorage.removeItem('mc_profile');
}

// Guard: redirect to login if not authenticated
window.requireAuth = function(role = null) {
  const profile = getLocalProfile();
  if (!profile) {
    if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('index.html')) {
        window.location.href = '/login.html';
    }
    return null;
  }
  if (role && profile.role !== role) {
    window.location.href = profile.role === 'farmer' ? '/farmer-dashboard.html' : '/marketplace.html';
    return null;
  }
  return profile;
}

// =============================================
//  AUTHENTICATION FUNCTIONS
// =============================================

/**
 * Register user in Supabase via backend (Simplified: No OTP)
 */
window.apiRegister = async function(userData) {
  try {
    console.log('[Auth] Calling Register:', AUTH_API + '/register');
    const res = await fetch(`${AUTH_API}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  } catch (err) {
    console.error('[Auth] Register Error:', err.message);
    if (err.message === 'Failed to fetch') {
      throw new Error('Connection failed. Please ensure the backend server is running on port 3002.');
    }
    throw err;
  }
}

/**
 * Login user via backend (checks email and password)
 */
window.apiLogin = async function(email, password) {
  const res = await fetch(`${AUTH_API}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

/**
 * Forgot Password: Request reset link
 */
window.apiForgotPassword = async function(email) {
  const res = await fetch(`${AUTH_API}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to send reset link');
  return data;
}

/**
 * Reset Password: Set new password
 */
window.apiResetPassword = async function(token, email, newPassword) {
  const res = await fetch(`${AUTH_API}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, email, newPassword })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update password');
  return data;
}

// Logout
window.logoutUser = function() {
  clearLocalSession();
  window.location.href = '/login.html';
}

// Render user info in navbar
window.renderNavUser = function() {
  const profile = getLocalProfile();
  const el = document.getElementById('nav-user-info');
  if (el && profile) {
    el.textContent = `👤 ${profile.full_name}`;
  }
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logoutUser();
    });
  }
}
