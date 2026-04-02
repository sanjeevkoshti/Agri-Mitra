// Mandi-Connect API library
// Dynamically resolve backend URL based on current hostname
const API_BASE = `http://${window.location.hostname}:3002/api`;

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
    const url = cropName ? `${API_BASE}/crops?crop_name=${encodeURIComponent(cropName)}` : `${API_BASE}/crops`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error('Failed to load crops');
    const json = await res.json();
    const remoteCrops = json.data || [];
    return { success: true, data: remoteCrops.filter(c => c.is_available) };
  },

  async getCropsByFarmer(farmerId) {
    const res = await fetchWithTimeout(`${API_BASE}/crops/farmer/${farmerId}`);
    if (!res.ok) throw new Error('Failed to load farmer crops');
    const json = await res.json();
    return { success: true, data: json.data || [] };
  },

  async addCrop(cropData) {
    const res = await fetchWithTimeout(`${API_BASE}/crops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cropData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to add crop');
    }
    return await res.json();
  },

  async updateCrop(id, data) {
    const res = await fetchWithTimeout(`${API_BASE}/crops/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update crop');
    return await res.json();
  },

  async deleteCrop(id) {
    const res = await fetchWithTimeout(`${API_BASE}/crops/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete crop');
    return await res.json();
  },

  // Orders
  async getOrdersByFarmer(farmerId) {
    const res = await fetchWithTimeout(`${API_BASE}/orders/farmer/${farmerId}`);
    if (!res.ok) throw new Error('Failed to load orders');
    return await res.json();
  },

  async getOrdersByRetailer(retailerId) {
    const res = await fetchWithTimeout(`${API_BASE}/orders/retailer/${retailerId}`);
    if (!res.ok) throw new Error('Failed to load orders');
    return await res.json();
  },

  async getOrder(orderId) {
    const res = await fetchWithTimeout(`${API_BASE}/orders/${orderId}`);
    if (!res.ok) throw new Error('Order not found');
    return await res.json();
  },

  async placeOrder(orderData) {
    const res = await fetchWithTimeout(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to place order');
    }
    return await res.json();
  },

  async updateOrder(orderId, updates) {
    const res = await fetchWithTimeout(`${API_BASE}/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update order');
    return await res.json();
  },

  async getPaymentDetails(orderId) {
    const res = await fetchWithTimeout(`${API_BASE}/payments/upi/${orderId}`);
    if (!res.ok) throw new Error('Payment service unavailable');
    return await res.json();
  },

  async confirmPayment(orderId, transactionId) {
    const res = await fetchWithTimeout(`${API_BASE}/payments/confirm/${orderId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId })
    });
    if (!res.ok) throw new Error('Failed to confirm payment');
    return await res.json();
  },

  async getPrediction(crop) {
    const res = await fetchWithTimeout(`${API_BASE}/ai/predict?crop=${encodeURIComponent(crop)}`);
    if (!res.ok) throw new Error('AI prediction unavailable');
    return await res.json();
  },

  async raithaMithraChat(message, lang = 'en') {
    const res = await fetchWithTimeout(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, lang })
    });
    if (!res.ok) throw new Error('Chat service unavailable');
    return await res.json();
  }
};

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
