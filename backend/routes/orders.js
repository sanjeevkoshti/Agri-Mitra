const express = require('express');
const router = express.Router();
const supabase = require('../supabase');

// GET orders for a user (farmer or retailer)
router.get('/farmer/:farmerId', async (req, res) => {
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
    if (error) throw error;
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

    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH update order status (accept/reject by farmer, update payment)
router.patch('/:id', async (req, res) => {
  try {
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
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
