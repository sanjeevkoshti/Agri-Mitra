const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const notificationService = require('../services/notificationService');

// GET orders for a user (farmer or retailer)
router.get('/farmer/:farmerId', async (req, res) => {
  // Ownership check
  if (req.user.id !== req.params.farmerId) {
    return res.status(403).json({ success: false, error: 'Access denied: Cannot view another user\'s orders' });
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('farmer_id', req.params.farmerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    
    // Calculate trust stats for the retailers in the list
    const retailerIds = [...new Set(data.filter(o => o.retailer_id).map(o => o.retailer_id))];
    let retailerStatsMap = {};

    if (retailerIds.length > 0) {
      const { data: statsRaw, error: statsError } = await supabase
        .from('orders')
        .select('retailer_id, status')
        .in('retailer_id', retailerIds);
      
      if (!statsError) {
        statsRaw.forEach(row => {
          if (!retailerStatsMap[row.retailer_id]) {
            retailerStatsMap[row.retailer_id] = { total: 0, delivered: 0 };
          }
          retailerStatsMap[row.retailer_id].total++;
          if (row.status === 'delivered') {
            retailerStatsMap[row.retailer_id].delivered++;
          }
        });
      }
    }

    const enhancedData = data.map(order => ({
      ...order,
      retailer_stats: retailerStatsMap[order.retailer_id] || { total: 0, delivered: 0 }
    }));

    res.json({ success: true, data: enhancedData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/retailer/:retailerId', async (req, res) => {
  // Ownership check
  if (req.user.id !== req.params.retailerId) {
    return res.status(403).json({ success: false, error: 'Access denied: Cannot view another user\'s orders' });
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('retailer_id', req.params.retailerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single order
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error || !data) throw new Error('Order not found');

    // Ownership check: User must be either the farmer or the retailer of this order
    if (req.user.id !== data.farmer_id && req.user.id !== data.retailer_id) {
      return res.status(403).json({ success: false, error: 'Access denied: You are not authorized to view this order' });
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(404).json({ success: false, error: 'Order not found' });
  }
});

// POST place a new order
router.post('/', async (req, res) => {
  try {
    const {
      crop_id, farmer_id, retailer_id, retailer_name, retailer_phone,
      crop_name, quantity_kg, price_per_kg,
      pickup_location, delivery_address, estimated_delivery_date
    } = req.body;

    // Security check: Ensure the order is being placed by the logged-in user
    if (req.user.id !== retailer_id) {
      return res.status(403).json({ success: false, error: 'Access denied: Cannot place order for another retailer' });
    }

    if (!farmer_id || !retailer_id || !crop_name || !quantity_kg || !price_per_kg) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const { data, error } = await supabase
      .from('orders')
      .insert([{
        crop_id, farmer_id, retailer_id, retailer_name, retailer_phone,
        crop_name, quantity_kg, price_per_kg,
        pickup_location, delivery_address, estimated_delivery_date,
        status: 'pending', payment_status: 'unpaid'
      }])
      .select()
      .single();

    if (error) throw error;

    // --- NEW: Stock Reduction Logic ---
    if (crop_id) {
      // 1. Get current crop details
      const { data: crop } = await supabase
        .from('crops')
        .select('quantity_kg, is_available')
        .eq('id', crop_id)
        .single();
      
      if (crop) {
        const newQty = Math.max(0, crop.quantity_kg - quantity_kg);
        const isAvailable = newQty > 0;

        // 2. Update crop stock and availability
        await supabase
          .from('crops')
          .update({ 
            quantity_kg: newQty, 
            is_available: isAvailable 
          })
          .eq('id', crop_id);
      }
    }
    // ----------------------------------

    // --- NEW: Trigger SMS Alert to Farmer ---
    try {
      const { data: farmerProfile } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', farmer_id)
        .single();
      
      if (farmerProfile && farmerProfile.phone) {
        // Send alert asynchronously so it doesn't slow down the response
        notificationService.sendOrderAlert(data, farmerProfile.phone).catch(err => {
          console.error('[Orders] Notification failed:', err.message);
        });
      }
    } catch (notifyErr) {
      console.error('[Orders] Notification system error:', notifyErr.message);
    }
    // ----------------------------------------

    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH update order status
router.patch('/:id', async (req, res) => {
  try {
    // 1. Fetch current order to check ownership
    const { data: existingOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !existingOrder) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // 2. Ownership check: User must be either the farmer or the retailer
    if (req.user.id !== existingOrder.farmer_id && req.user.id !== existingOrder.retailer_id) {
      return res.status(403).json({ success: false, error: 'Access denied: You are not authorized to update this order' });
    }

    const allowed = ['status', 'payment_status', 'upi_transaction_id', 'estimated_delivery_date', 'pickup_location', 'delivery_address', 'proposed_quantity_kg', 'proposed_price_per_kg', 'quantity_kg', 'price_per_kg'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    console.log(`[Orders] PATCH update result for ${req.params.id}:`, { success: !error, error: error?.message });

    if (error) throw error;

    // --- NEW: Trigger SMS Alert on Status Change ---
    if (updates.status && updates.status !== existingOrder.status) {
      try {
        // Find who to notify based on who made the change
        const isFarmer = req.user.id === existingOrder.farmer_id;
        const recipientId = isFarmer ? existingOrder.retailer_id : existingOrder.farmer_id;
        
        const { data: recipientProfile } = await supabase
          .from('profiles')
          .select('phone')
          .eq('id', recipientId)
          .single();

        // Determine if we should send SMS (Only for Farmers)
        const recipientIsFarmer = recipientId === existingOrder.farmer_id;

        if (recipientProfile && recipientProfile.phone) {
          notificationService.sendStatusAlert(data, recipientProfile.phone, updates.status, recipientId, recipientIsFarmer).catch(err => {
            console.error('[Orders] Status notification failed:', err.message);
          });
        }
      } catch (notifyErr) {
        console.error('[Orders] Status notification error:', notifyErr.message);
      }
    }
    // ---------------------------------------------

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
