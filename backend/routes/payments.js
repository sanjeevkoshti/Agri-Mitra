const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 1. Create a Razorpay Order
router.post('/razorpay/create-order/:orderId', async (req, res) => {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', req.params.orderId)
      .single();

    if (error || !order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Razorpay amount is in paise (1 INR = 100 Paise)
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
        orderId: order.id // Our internal DB order ID
      }
    });
  } catch (err) {
    console.error('Razorpay Order Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Verify Payment Signature and Confirm Order
router.post('/confirm/:orderId', async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature 
    } = req.body;

    // Verify Signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isSignatureValid = expectedSignature === razorpay_signature;

    if (!isSignatureValid) {
      return res.status(400).json({ success: false, error: 'Invalid payment signature' });
    }

    // Update Order in Supabase
    const { data, error } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'paid',
        upi_transaction_id: razorpay_payment_id // Store payment ID as reference
      })
      .eq('id', req.params.orderId)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data, message: 'Payment verified and confirmed successfully!' });
  } catch (err) {
    console.error('Payment Confirmation Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Keeping the UPI route for fallback or reference if needed, but updated to use dynamic logic
router.get('/upi/:orderId', async (req, res) => {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', req.params.orderId)
      .single();

    if (error || !order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const upiId = 'mandiconnect@upi';
    const amount = order.total_price;
    const note = `Order:${order.id.slice(0,8)} | ${order.crop_name}`;
    const upiLink = `upi://pay?pa=${upiId}&pn=MandiConnect&am=${amount}&tn=${encodeURIComponent(note)}&cu=INR`;

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.total_price,
        cropName: order.crop_name,
        upiId,
        upiLink
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
