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
    const { data } = await supabase.safeQuery(() => 
      supabase
        .from('orders')
        .select('*')
        .eq('farmer_id', req.params.farmerId)
        .order('created_at', { ascending: false })
    );

    if (!data || !Array.isArray(data)) {
      return res.json({ success: true, data: [] });
    }

    // Calculate trust stats for the retailers in the list
    const retailerIds = [...new Set(data.filter(o => o.retailer_id).map(o => o.retailer_id))];
    let retailerStatsMap = {};

    if (retailerIds.length > 0) {
      const { data: statsRaw } = await supabase.safeQuery(() => 
        supabase
          .from('orders')
          .select('retailer_id, status')
          .in('retailer_id', retailerIds)
      );

      if (statsRaw && Array.isArray(statsRaw)) {
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
    const { data } = await supabase.safeQuery(() => 
      supabase
        .from('orders')
        .select('*')
        .eq('retailer_id', req.params.retailerId)
        .order('created_at', { ascending: false })
    );
    res.json({ success: true, data });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single order
router.get('/:id', async (req, res) => {
  try {
    const { data } = await supabase.safeQuery(() => 
      supabase
        .from('orders')
        .select('*')
        .eq('id', req.params.id)
        .single()
    );
    
    if (!data) throw new Error('Order not found');


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

    const { data } = await supabase.safeQuery(() => 
      supabase
        .from('orders')
        .insert([{
          crop_id, farmer_id, retailer_id, retailer_name, retailer_phone,
          crop_name, quantity_kg, price_per_kg,
          pickup_location, delivery_address, estimated_delivery_date,
          status: 'pending', payment_status: 'unpaid'
        }])
        .select()
        .single()
    );

    // --- NEW: Stock Reduction Logic ---
    if (crop_id) {
      // 1. Get current crop details
      const { data: crop } = await supabase.safeQuery(() => 
        supabase
          .from('crops')
          .select('quantity_kg, is_available')
          .eq('id', crop_id)
          .single()
      );
      
      if (crop) {
        const newQty = Math.max(0, crop.quantity_kg - quantity_kg);
        const isAvailable = newQty > 0;

        // 2. Update crop stock and availability
        await supabase.safeQuery(() => 
          supabase
            .from('crops')
            .update({ 
              quantity_kg: newQty, 
              is_available: isAvailable 
            })
            .eq('id', crop_id)
        );
      }
    }
    // ----------------------------------

    // --- NEW: Trigger SMS Alert to Farmer ---
    try {
      const { data: farmerProfile } = await supabase.safeQuery(() => 
        supabase
          .from('profiles')
          .select('phone')
          .eq('id', farmer_id)
          .single()
      );
      
      if (farmerProfile && farmerProfile.phone) {
        // Send alert asynchronously so it doesn't slow down the response
        notificationService.sendOrderAlert(data, farmerProfile.phone).catch(err => {
          global.serverLog(`❌ [ORDERS] Notification failed: ${err.message}`);
        });
      }
    } catch (notifyErr) {
      global.serverLog(`❌ [ORDERS] Notification system error: ${notifyErr.message}`);
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
    const { data: existingOrder } = await supabase.safeQuery(() => 
      supabase
        .from('orders')
        .select('*')
        .eq('id', req.params.id)
        .single()
    );

    if (!existingOrder) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // 2. Ownership check: User must be either the farmer or the retailer
    if (req.user.id !== existingOrder.farmer_id && req.user.id !== existingOrder.retailer_id) {
      return res.status(403).json({ success: false, error: 'Access denied: You are not authorized to update this order' });
    }

    const allowed = ['status', 'payment_status', 'upi_transaction_id', 'estimated_delivery_date', 'pickup_location', 'delivery_address', 'proposed_quantity_kg', 'proposed_price_per_kg', 'quantity_kg', 'price_per_kg'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    // Handle Secure Delivery Handshake (Escrow Release)
    if (updates.status === 'delivered') {
       // 1. Verify OTP
       if (!req.body.otp || req.body.otp !== existingOrder.delivery_otp) {
          return res.status(400).json({ success: false, error: 'Invalid delivery verification code' });
       }

       // 2. Fetch Farmer's Payout Account
       const { data: farmerProf } = await supabase.safeQuery(() => 
         supabase
           .from('farmer_profiles')
           .select('razorpay_account_id')
           .eq('farmer_id', existingOrder.farmer_id)
           .single()
       );
       
       if (farmerProf && farmerProf.razorpay_account_id) {
          try {
            const Razorpay = require('razorpay');
            const razorpay = new Razorpay({
              key_id: process.env.RAZORPAY_KEY_ID,
              key_secret: process.env.RAZORPAY_KEY_SECRET,
            });

            // Calculate split: 98% to Farmer, 2% Platform Fee
            const totalAmountPaise = Math.round(existingOrder.total_price * 100);
            const transferAmount = Math.round(totalAmountPaise * 0.98);

            // Trigger Razorpay Transfer (Escrow Release)
            if (farmerProf.razorpay_account_id.startsWith('acc_simulated')) {
               global.serverLog(`[Escrow Release] Simulated transfer of ₹${(transferAmount/100).toFixed(2)} to ${farmerProf.razorpay_account_id}`);
            } else {
               await razorpay.transfers.create({
                  account: farmerProf.razorpay_account_id,
                  amount: transferAmount,
                  currency: "INR",
                  notes: { order_id: existingOrder.id }
               });
            }
          } catch (payoutErr) {
             global.serverLog(`❌ [Escrow] Fund release failed: ${payoutErr.message}`);
          }
       }
    }

    const { data } = await supabase.safeQuery(() => 
      supabase
        .from('orders')
        .update(updates)
        .eq('id', req.params.id)
        .select()
        .single()
    );

    global.serverLog(`✅ [ORDERS] Status update for ${req.params.id}: ${updates.status || 'no status change'}`);

    // --- NEW: Trigger SMS Alert on Status Change ---
    if (updates.status && updates.status !== existingOrder.status) {
      try {
        const isFarmer = req.user.id === existingOrder.farmer_id;
        const recipientId = isFarmer ? existingOrder.retailer_id : existingOrder.farmer_id;
        
        const { data: recipientProfile } = await supabase.safeQuery(() => 
          supabase
            .from('profiles')
            .select('phone')
            .eq('id', recipientId)
            .single()
        );

        const recipientIsFarmer = recipientId === existingOrder.farmer_id;

        if (recipientProfile && recipientProfile.phone) {
          notificationService.sendStatusAlert(data, recipientProfile.phone, updates.status, recipientId, recipientIsFarmer).catch(err => {
            global.serverLog(`❌ [ORDERS] Status notification failed: ${err.message}`);
          });
        }
      } catch (notifyErr) {
        global.serverLog(`❌ [ORDERS] Status notification error: ${notifyErr.message}`);
      }
    }
    // ---------------------------------------------

    res.json({ success: true, data });
  } catch (err) {
    global.serverLog(`❌ [ORDERS] Update failed: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});


module.exports = router;
