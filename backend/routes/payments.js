const express = require('express');
const router = express.Router();
const supabase = require('../supabase');

// Generate UPI payment details for an order
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

    // UPI payment string (standard format)
    const upiId = 'mandiconnect@upi'; // Demo UPI ID
    const amount = order.total_amount;
    const note = `Order:${order.id.slice(0,8)} | ${order.crop_name}`;
    const upiLink = `upi://pay?pa=${upiId}&pn=MandiConnect&am=${amount}&tn=${encodeURIComponent(note)}&cu=INR`;

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.total_amount,
        cropName: order.crop_name,
        quantityKg: order.quantity_kg,
        upiId,
        upiLink,
        qrData: upiLink // Frontend will generate QR from this string
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST confirm payment (mark order as paid)
router.post('/confirm/:orderId', async (req, res) => {
  try {
    const { transactionId } = req.body;

    const { data, error } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'paid',
        upi_transaction_id: transactionId || `MOCK_${Date.now()}`
      })
      .eq('id', req.params.orderId)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data, message: 'Payment confirmed successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
