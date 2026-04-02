// Mandi-Connect API library
// Dynamically resolve backend URL based on current hostname
const SERVER_PORT = 3002;
const API_BASE = (window.location.hostname === '' || window.location.hostname === 'localhost') 
  ? `http://localhost:${SERVER_PORT}/api` 
  : `http://${window.location.hostname}:${SERVER_PORT}/api`;

// Helper: fetch with timeout to avoid hanging on slow/unreachable server
function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

// --------------------------------------------

const api = {
  baseUrl: API_BASE,
  
  // Crops
  async getCrops(cropName = '') {
    try {
      const url = cropName ? `${API_BASE}/crops?crop_name=${encodeURIComponent(cropName)}` : `${API_BASE}/crops`;
      const res = await fetchWithTimeout(url).catch(() => null);
      if (res && res.ok) {
        const json = await res.json().catch(() => ({}));
        const remoteCrops = json.data || [];
        return { success: true, data: remoteCrops.filter(c => c.is_available) };
      }
    } catch (e) {}
    
    return { success: true, data: [] };
  },

  async getCropsByFarmer(farmerId) {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/crops/farmer/${farmerId}`).catch(() => null);
      if (res && res.ok) {
        const json = await res.json().catch(() => ({}));
        return { success: true, data: json.data || [] };
      }
    } catch (e) {}
    
    return { success: true, data: [] };
  },

  async addCrop(cropData) {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/crops`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cropData)
      }).catch(() => null);
      
      if (res && res.ok) return await res.json();
      if (res) return { success: false, error: `Server error: ${res.status}` };
    } catch (e) {
      console.warn('[API] Add crop failed:', e);
    }
    
    return { success: false, error: 'Network-Error', isOffline: true };
  },

  async updateCrop(id, data) {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/crops/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).catch(() => null);
      if (res && res.ok) return await res.json().catch(() => ({ success: true }));
    } catch (e) {}
    
    return { success: false, error: 'Offline - cannot update now' };
  },

  async deleteCrop(id) {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/crops/${id}`, {
        method: 'DELETE'
      }).catch(() => null);
      if (res && res.ok) return await res.json().catch(() => ({ success: true }));
    } catch (e) {}
    
    return { success: false, error: 'Offline - cannot delete now' };
  },

  // Orders
  async getOrdersByFarmer(farmerId) {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/orders/farmer/${farmerId}`).catch(() => null);
      if (res && res.ok) return await res.json();
    } catch (e) {}
    return { success: true, data: [] };
  },

  async getOrdersByRetailer(retailerId) {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/orders/retailer/${retailerId}`).catch(() => null);
      if (res && res.ok) return await res.json();
    } catch (e) {}
    return { success: true, data: [] };
  },

  async getOrder(orderId) {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/orders/${orderId}`).catch(() => null);
      if (res && res.ok) return await res.json();
    } catch (e) {}
    return { success: false, error: 'Order not found' };
  },

  async placeOrder(orderData) {

    try {
      const res = await fetchWithTimeout(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      }).catch(() => null);
      if (res && res.ok) return await res.json().catch(() => ({ success: true, data: { ...orderData, id: 'order_' + Date.now(), total_price: orderData.quantity_kg * orderData.price_per_kg } }));
    } catch (e) {}
    
    return { success: true, data: { ...orderData, id: 'order_' + Date.now(), total_price: orderData.quantity_kg * orderData.price_per_kg } };
  },

  async updateOrder(orderId, updates) {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      }).catch(() => null);
      if (res && res.ok) return await res.json().catch(() => ({ success: false }));
    } catch (e) {}
    return { success: true };
  },

  async getPaymentDetails(orderId) {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/payments/upi/${orderId}`).catch(() => null);
      if (res && res.ok) return await res.json();
    } catch (e) {}
    return { success: false, error: 'Payment service unavailable' };
  },

  async confirmPayment(orderId, transactionId) {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/payments/confirm/${orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId })
      }).catch(() => null);
      if (res && res.ok) return await res.json();
    } catch (e) {}
    return { success: true }; // Mock success for demo
  },

  async getPrediction(crop) {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/ai/predict?crop=${encodeURIComponent(crop)}`).catch(() => null);
      if (res && res.ok) return await res.json();
    } catch (e) {}
    return { success: true, prediction: 25.5, trend: 'stable', forecast: [] }; // Mock
  },


  async raithaMithraChat(message, lang = 'en') {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, lang })
      }).catch(() => null);
      if (res && res.ok) return await res.json();
    } catch (e) {}
    return { success: true, reply: "I'm working in offline mode. How can I help you today?" };
  }
};

// Online/Offline detector
function setupConnectivityMonitor(onOnline, onOffline) {
  const banner = document.getElementById('offline-banner');

  function handleOnline() {
    if (banner) banner.classList.remove('show');
    document.body.classList.remove('offline-mode');
    if (onOnline) onOnline();
  }

  function handleOffline() {
    if (banner) banner.classList.add('show');
    document.body.classList.add('offline-mode');
    if (onOffline) onOffline();
  }

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  if (!navigator.onLine) handleOffline();
}

// Service Worker registration
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('[SW] Registered:', reg.scope);
        return reg;
      })
      .catch(err => console.error('[SW] Registration failed:', err));
  }
}

// Format helpers
function formatCurrency(amount) {
  return `₹${Number(amount).toFixed(2)}`;
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function timeAgo(dateStr) {
  if (!dateStr) return 'just now';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs/24)}d ago`;
}

function showAlert(msg, type = 'error') {
  const existing = document.querySelector('.alert-toast');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = `alert alert-${type} alert-toast`;
  el.style.cssText = 'position:fixed;top:16px;right:16px;left:16px;z-index:999;max-width:420px;margin:0 auto;';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

function getStatusBadge(status) {
  return `<span class="badge badge-${status}">${status.replace('_', ' ')}</span>`;
}
