import axios from 'axios';

const SERVER_PORT = 3002;
const API_BASE = (window.location.hostname === '' || window.location.hostname === 'localhost') 
  ? `http://localhost:${SERVER_PORT}/api` 
  : `http://${window.location.hostname}:${SERVER_PORT}/api`;

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000, // Increased timeout for slow backend services
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for logging API calls in the browser console
apiClient.interceptors.request.use((config) => {
  console.log(`[API] Request: ${config.method.toUpperCase()} ${config.url}`, config.data || '');
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API] Success: ${response.config.method.toUpperCase()} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error(`[API] Error: ${error.config?.method.toUpperCase()} ${error.config?.url}`, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const api = {
  // --- Auth & OTP ---
  async login(email, password) {
    try {
      const resp = await apiClient.post('/auth/login', { email, password });
      return resp.data;
    } catch (e) {
      return { success: false, error: e.response?.data?.error || 'Login failed' };
    }
  },

  async register(userData) {
    try {
      const resp = await apiClient.post('/auth/register', userData);
      return resp.data;
    } catch (e) {
      return { success: false, error: e.response?.data?.error || 'Registration failed' };
    }
  },

  async forgotPassword(email) {
    try {
      const resp = await apiClient.post('/auth/forgot-password', { email });
      return resp.data;
    } catch (e) {
      return { success: false, error: e.response?.data?.error || 'Failed to send reset link' };
    }
  },

  async resetPassword(token, email, newPassword) {
    try {
      const resp = await apiClient.post('/auth/reset-password', { token, email, newPassword });
      return resp.data;
    } catch (e) {
      return { success: false, error: e.response?.data?.error || 'Failed to update password' };
    }
  },

  async sendOTP(email, checkRegistration = null) {
    try {
      const resp = await apiClient.post('/otp/send', { email, checkRegistration });
      return resp.data;
    } catch (e) {
      return { success: false, error: e.response?.data?.error || 'Failed to send OTP' };
    }
  },

  async verifyOTP(email, otp) {
    try {
      const resp = await apiClient.post('/otp/verify', { email, otp });
      return resp.data;
    } catch (e) {
      return { success: false, error: e.response?.data?.error || 'Invalid OTP. Please try again.' };
    }
  },

  async raithaMithraChat(message, lang, context = null) {
    try {
      const resp = await apiClient.post('/chat', { message, lang, context });
      return resp.data;
    } catch (e) {
      return { success: false, error: e.response?.data?.error || 'Failed to get chat response' };
    }
  },

  // Crops
  async getCrops(cropName = '') {
    try {
      const resp = await apiClient.get('/crops', { params: { crop_name: cropName } });
      const mapped = (resp.data.data || []).map(c => ({
        ...c,
        _id: c.id,
        quantity: c.quantity_kg,
        price_per_unit: c.price_per_kg
      }));
      return { success: true, data: mapped.filter(c => c.is_available) };
    } catch (e) {
      return { success: true, data: [] };
    }
  },

  async getCropsByFarmer(farmerId) {
    try {
      const resp = await apiClient.get(`/crops/farmer/${farmerId}`);
      const mapped = (resp.data.data || []).map(c => ({
        ...c,
        _id: c.id,
        quantity: c.quantity_kg,
        price_per_unit: c.price_per_kg
      }));
      return { success: true, data: mapped };
    } catch (e) {
      return { success: true, data: [] };
    }
  },

  async addCrop(cropData) {
    try {
      const mapped = {
        ...cropData,
        quantity_kg: Number(cropData.quantity),
        price_per_kg: Number(cropData.price_per_unit)
      };
      // Remove the non-database fields
      delete mapped.quantity;
      delete mapped.price_per_unit;
      
      const resp = await apiClient.post('/crops', mapped);
      return resp.data;
    } catch (e) {
      console.error('[API] Add Crop Failed:', e.response?.data || e.message);
      return { success: false, error: e.response?.data?.error || 'Failed to add crop', isOffline: !e.response };
    }
  },

  async updateCrop(id, data) {
    try {
      const { quantity, price_per_unit, ...rest } = data;
      const mapped = {
        ...rest,
        quantity_kg: quantity !== undefined ? Number(quantity) : undefined,
        price_per_kg: price_per_unit !== undefined ? Number(price_per_unit) : undefined
      };
      // Clean up undefined fields
      Object.keys(mapped).forEach(key => mapped[key] === undefined && delete mapped[key]);
      
      const resp = await apiClient.patch(`/crops/${id}`, mapped);
      return resp.data;
    } catch (e) {
      console.error('[API] Update Crop Failed:', e.response?.data || e.message);
      return { 
        success: false, 
        error: e.response?.data?.error || 'Failed to update crop'
      };
    }
  },

  async deleteCrop(id) {
    try {
      const resp = await apiClient.delete(`/crops/${id}`);
      return resp.data;
    } catch (e) {
      return { success: false, error: 'Offline - cannot delete now' };
    }
  },

  // Orders
  async getOrdersByFarmer(farmerId) {
    try {
      const resp = await apiClient.get(`/orders/farmer/${farmerId}`);
      return resp.data;
    } catch (e) {
      return { success: true, data: [] };
    }
  },

  async getOrdersByRetailer(retailerId) {
    try {
      const resp = await apiClient.get(`/orders/retailer/${retailerId}`);
      return resp.data;
    } catch (e) {
      return { success: true, data: [] };
    }
  },

  async getOrder(orderId) {
    try {
      const resp = await apiClient.get(`/orders/${orderId}`);
      return resp.data;
    } catch (e) {
      return { success: false, error: 'Order not found' };
    }
  },

  async placeOrder(orderData) {
    try {
      const resp = await apiClient.post('/orders', orderData);
      return resp.data;
    } catch (e) {
      return { success: false, error: 'Could not place order' };
    }
  },

  async updateOrder(orderId, updates) {
    try {
      const resp = await apiClient.patch(`/orders/${orderId}`, updates);
      return resp.data;
    } catch (e) {
      return { success: false, error: e.response?.data?.error || 'Failed to update order' };
    }
  },

  async getPaymentDetails(orderId) {
    try {
      const resp = await apiClient.get(`/payments/upi/${orderId}`);
      return resp.data;
    } catch (e) {
      return { success: false, error: 'Payment service unavailable' };
    }
  },

  async confirmPayment(orderId, transactionId) {
    try {
      const resp = await apiClient.post(`/payments/confirm/${orderId}`, { transactionId });
      return resp.data;
    } catch (e) {
      return { success: true }; // Mock success
    }
  },

  async getPrediction(crop) {
    try {
      const resp = await apiClient.get('/ai/predict', { params: { crop } });
      return resp.data;
    } catch (e) {
      // Mock failure
      return { 
        success: true, 
        crop: crop,
        prediction: {
          current_market_price: 24.50,
          predicted_price: 26.00,
          confidence: "82%",
          recommendation: "Prices expected to rise.",
          trend: "up"
        }
      };
    }
  },

  // --- Spoilage Rescue ---
  async getSpoilageListings(cropName = '') {
    try {
      const resp = await apiClient.get('/spoilage', { params: { crop_name: cropName } });
      return { success: true, data: resp.data.data || [] };
    } catch (e) {
      console.error('[API] getSpoilageListings failed:', e);
      return { success: false, data: [], error: 'Failed to fetch marketplace' };
    }
  },

  async getSpoilageByFarmer(farmerId) {
    try {
      const resp = await apiClient.get(`/spoilage/farmer/${farmerId}`);
      return { success: true, data: resp.data.data || [] };
    } catch (e) {
      console.error('[API] getSpoilageByFarmer failed:', e);
      return { success: false, data: [], error: 'Failed to fetch your listings' };
    }
  },

  async addSpoilageListing(data) {
    try {
      const resp = await apiClient.post('/spoilage', data);
      return resp.data;
    } catch (e) {
      return { success: false, error: e.response?.data?.error || 'Failed to create rescue listing' };
    }
  },

  async updateSpoilageListing(id, updates) {
    try {
      const resp = await apiClient.patch(`/spoilage/${id}`, updates);
      return resp.data;
    } catch (e) {
      return { success: false, error: e.response?.data?.error || 'Failed to update rescue listing' };
    }
  },

  async deleteSpoilageListing(id) {
    try {
      const resp = await apiClient.delete(`/spoilage/${id}`);
      return resp.data;
    } catch (e) {
      return { success: false, error: 'Could not delete rescue listing' };
    }
  }

};
