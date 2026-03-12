// Mandi-Connect API library
const API_BASE = 'http://localhost:3001/api';

const api = {
  // Crops
  async getCrops(cropName = '') {
    const url = cropName ? `${API_BASE}/crops?crop_name=${encodeURIComponent(cropName)}` : `${API_BASE}/crops`;
    const res = await fetch(url);
    return res.json();
  },

  async getCropsByFarmer(farmerId) {
    const res = await fetch(`${API_BASE}/crops/farmer/${farmerId}`);
    return res.json();
  },

  async addCrop(cropData) {
    const res = await fetch(`${API_BASE}/crops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cropData)
    });
    return res.json();
  },

  // Orders
  async getOrdersByFarmer(farmerId) {
    const res = await fetch(`${API_BASE}/orders/farmer/${farmerId}`);
    return res.json();
  },

  async getOrdersByRetailer(retailerId) {
    const res = await fetch(`${API_BASE}/orders/retailer/${retailerId}`);
    return res.json();
  },

  async getOrder(orderId) {
    const res = await fetch(`${API_BASE}/orders/${orderId}`);
    return res.json();
  },

  async placeOrder(orderData) {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    return res.json();
  },

  async updateOrder(orderId, updates) {
    const res = await fetch(`${API_BASE}/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return res.json();
  },

  // Payments
  async getPaymentDetails(orderId) {
    const res = await fetch(`${API_BASE}/payments/upi/${orderId}`);
    return res.json();
  },

  async confirmPayment(orderId, transactionId) {
    const res = await fetch(`${API_BASE}/payments/confirm/${orderId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId })
    });
    return res.json();
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
