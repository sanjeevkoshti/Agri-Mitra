const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const notificationService = require('../services/notificationService');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * 1. Get Farmer Onboarding Status
 * Checks if the farmer has linked their bank account for payouts.
 */
router.get('/razorpay/onboard-status/:farmerId', async (req, res) => {
  try {
    // Ownership check (only self or admin)
    if (req.user.role !== 'admin' && req.user.id !== req.params.farmerId) {
      return res.status(403).json({ success: false, error: 'Unauthorized status check' });
    }

    const { data } = await supabase.safeQuery(async () => {
      const result = await supabase
        .from('farmer_profiles')
        .select('*')
        .eq('farmer_id', req.params.farmerId)
        .single();
      
      if (result.error && result.error.code === 'PGRST116') {
        return { data: null, error: null };
      }
      return result;
    });


    res.json({ 
      success: true, 
      onboarded: !!(data && data.razorpay_account_id),
      data: data || null
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 2. Onboard Farmer as Linked Account
 * Creates a Razorpay Route Linked Account for the farmer.
 */
router.post('/razorpay/onboard-farmer', async (req, res) => {
  try {
    const { farmer_id, bank_account, ifsc, name } = req.body;
    
    // Ownership check
    if (req.user.id !== farmer_id) {
       return res.status(403).json({ success: false, error: 'Unauthorized: Can only onboard your own account' });
    }

    if (!bank_account || !ifsc) {
      return res.status(400).json({ success: false, error: 'Bank account and IFSC are required' });
    }

    // Create Linked Account in Razorpay
    // For demo, if keys are test-keys, we might use a simulated ID.
    let accountId = `acc_simulated_${farmer_id.slice(0,8)}`;
    
    try {
      const account = await razorpay.accounts.create({
        type: 'route',
        name: name || req.user.full_name || 'Farmer Account',
        email: req.user.email || `${farmer_id.slice(0,8)}@mandiconnect.com`,
        tnc_accepted: true,
      });
      accountId = account.id;
    } catch (rzpErr) {
       console.log('[Payments] Razorpay Account creation failed (Expected in demo). Using simulated ID.', rzpErr.message);
    }

    // Update profiling data in Supabase (upsert)
    const { data } = await supabase.safeQuery(() => 
      supabase
        .from('farmer_profiles')
        .upsert({
          farmer_id,
          bank_account_number: bank_account,
          ifsc_code: ifsc,
          razorpay_account_id: accountId
        }, { onConflict: 'farmer_id' })
        .select()
        .single()
    );


    res.json({ success: true, data: { accountId, ...data } });
  } catch (err) {
    console.error('Farmer Onboarding Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 3. Create a Razorpay Order
 */
router.post('/razorpay/create-order/:orderId', async (req, res) => {
  try {
    const { data: order } = await supabase.safeQuery(() => 
      supabase
        .from('orders')
        .select('*')
        .eq('id', req.params.orderId)
        .single()
    );

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }


    const options = {
      amount: Math.round(order.total_price * 100), 
      currency: "INR",
      receipt: `receipt_order_${order.id.slice(0, 8)}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.json({
      success: true,
      data: { 
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        orderId: order.id 
      }
    });
  } catch (err) {
    console.error('Razorpay Order Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 4. Verify Payment and Generate Delivery OTP (Escrow Start)
 */
router.post('/confirm/:orderId', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify Signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Invalid payment signature' });
    }

    // Ensure we DON'T generate OTP here anymore
    // Update Order: Set status to PAID 
    const { data } = await supabase.safeQuery(() => 
      supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'paid',
          upi_transaction_id: razorpay_payment_id,
        })
        .eq('id', req.params.orderId)
        .select()
        .single()
    );


    // --- Trigger Multi-Channel Alerts ---
    try {
      // 1. Fetch Farmer for Payout Alert
      const { data: farmerProf } = await supabase.safeQuery(() => 
        supabase.from('profiles').select('phone').eq('id', data.farmer_id).single()
      );
      if (farmerProf && farmerProf.phone) {
        notificationService.sendPaymentAlert(data, farmerProf.phone).catch(e => global.serverLog(`❌ [PAYMENTS] Farmer Notify Failed: ${e.message}`));
      }

      // Retailer OTP alert will be sent manually when they generate the code

    } catch (notifyErr) {
      console.error('[Payments] Notification logic error:', notifyErr.message);
    }

    res.json({ 
      success: true, 
      data, 
      message: 'Payment secured in escrow. You can generate the delivery code from order details.' 
    });
  } catch (err) {
    console.error('Payment Confirmation Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Minimal UPI reference route for compatibility
router.get('/upi/:orderId', async (req, res) => {
  try {
    const { data: order } = await supabase.from('orders').select('*').eq('id', req.params.orderId).single();
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    const upiLink = `upi://pay?pa=mandiconnect@upi&pn=MandiConnect&am=${order.total_price}&cu=INR`;
    res.json({ success: true, data: { orderId: order.id, upiLink } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
