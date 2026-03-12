// Mandi-Connect Auth Module - Uses Supabase for Auth + IndexedDB for offline session
const SUPABASE_URL = 'https://gdzkixmschicixsrzqvb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkemtpeG1zY2hpY2l4c3J6cXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMDk4MjIsImV4cCI6MjA4ODg4NTgyMn0.lORtoWso3Jd4YJ-FMVPepyWCsaY-Za1rXPyw0fiTqh8';

// We load Supabase from CDN in the HTML
let supabaseClient = null;
function getSupabase() {
  if (!supabaseClient && window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

// Session helpers using localStorage for instant access
function saveLocalSession(profile, session) {
  localStorage.setItem('mc_profile', JSON.stringify(profile));
  localStorage.setItem('mc_session', JSON.stringify(session));
}

function getLocalProfile() {
  try { return JSON.parse(localStorage.getItem('mc_profile')); } catch { return null; }
}

function clearLocalSession() {
  localStorage.removeItem('mc_profile');
  localStorage.removeItem('mc_session');
}

// Guard: redirect to login if not authenticated
function requireAuth(role = null) {
  const profile = getLocalProfile();
  if (!profile) {
    window.location.href = '/login.html';
    return null;
  }
  if (role && profile.role !== role) {
    window.location.href = profile.role === 'farmer' ? '/farmer-dashboard.html' : '/marketplace.html';
    return null;
  }
  return profile;
}

// Register a new user
async function registerUser(email, password, fullName, phone, location, role) {
  const sb = getSupabase();
  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) throw error;

  // Insert profile row
  const { error: profileError } = await sb.from('profiles').insert([{
    id: data.user.id,
    role,
    full_name: fullName,
    phone,
    location
  }]);
  if (profileError) throw profileError;

  const profile = { id: data.user.id, role, full_name: fullName, phone, location, email };
  saveLocalSession(profile, data.session);
  return profile;
}

// Login existing user
async function loginUser(email, password) {
  const sb = getSupabase();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;

  // Fetch profile
  const { data: profile, error: pErr } = await sb.from('profiles').select('*').eq('id', data.user.id).single();
  if (pErr) throw pErr;

  const profileWithEmail = { ...profile, email: data.user.email };
  saveLocalSession(profileWithEmail, data.session);
  return profileWithEmail;
}

// Logout
async function logoutUser() {
  try {
    const sb = getSupabase();
    await sb.auth.signOut();
  } catch (e) { /* ignore if offline */ }
  clearLocalSession();
  window.location.href = '/login.html';
}

// Render user info in navbar
function renderNavUser() {
  const profile = getLocalProfile();
  const el = document.getElementById('nav-user-info');
  if (el && profile) {
    el.textContent = `👤 ${profile.full_name}`;
  }
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logoutUser);
  }
}
