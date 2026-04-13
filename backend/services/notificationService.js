const twilio = require('twilio');
const supabase = require('../supabase');

/**
 * Mandi-Connect Notification Engine (Twilio + DB Inbox)
 * Handles SMS via Twilio and In-App Notifications via Supabase.
 */

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

// Only initialize if IDs are present (prevents crash if empty)
let client = null;
if (accountSid && accountSid !== 'your_account_sid_here') {
  client = twilio(accountSid, authToken);
}

/**
 * Saves a notification to the in-app inbox (Supabase table)
 */
async function createInAppNotification(userId, title, message, type = 'general') {
  try {
    if (!userId) return;
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        title,
        message,
        type,
        is_read: false
      }]);
    
    if (error) console.error('[NotificationService] In-app storage failed:', error.message);
    return data;
  } catch (err) {
    console.error('[NotificationService] In-app system error:', err.message);
  }
}

/**
 * Sends a real SMS via Twilio (or simulates it if disabled)
 */
async function sendSMS(to, text) {
  // Check if the developer has manually enabled real SMS sending for the demo
  const isSmsEnabled = process.env.ENABLE_TWILIO_SMS === 'true';

  // Simulator Mode: If keys are missing, fake number, or manually disabled
  if (!client || to === '9999988888' || !isSmsEnabled) {
    console.log('\n--- SMS SIMULATOR (Twilio Disabled or Testing) ---');
    console.log(`To: ${to}`);
    console.log(`Msg: ${text}`);
    if (!isSmsEnabled) {
      console.log(`[!] SMS skipped: ENABLE_TWILIO_SMS is set to false in .env`);
    }
    console.log('-------------------------------------------\n');
    return { success: true, simulated: true };
  }

  try {
    // Format number for international compatibility (adds +91 for India if missing)
    let formattedTo = to.startsWith('+') ? to : `+91${to}`;

    const message = await client.messages.create({
      body: text,
      from: twilioNumber,
      to: formattedTo
    });

    console.log(`[Twilio] SMS sent successfully. SID: ${message.sid}`);
    return { success: true, sid: message.sid };
  } catch (err) {
    console.error(`[Twilio] SMS Error: ${err.message}`);
    return { success: false, error: err.message };
  }
}

/**
 * Triggers alert for a New Order (To Farmer)
 */
async function sendOrderAlert(orderData, farmerPhone) {
  const title = "New Order Received! 🌾";
  const message = `Mandi-Connect: New order for ${orderData.crop_name}. Qty: ${orderData.quantity_kg}kg. Buyer: ${orderData.retailer_name}. Review in app!`;
  
  // 1. In-App Notification (Always)
  await createInAppNotification(orderData.farmer_id, title, message, 'order_new');

  // 2. SMS (If phone is available)
  if (farmerPhone) {
    return await sendSMS(farmerPhone, message);
  }
}

/**
 * Triggers alert for Status Updates (To Farmer or Retailer)
 */
async function sendStatusAlert(orderData, recipientPhone, newStatus, recipientId, shouldSendSMS = true) {
  const title = `Order Status: ${newStatus.toUpperCase()} 🔔`;
  const message = `Mandi-Connect: Order for ${orderData.crop_name} is now ${newStatus.toUpperCase()}. Check your orders page for details.`;
  
  // 1. In-App Notification (Always)
  if (recipientId) {
    await createInAppNotification(recipientId, title, message, 'order_status');
  }

  // 2. SMS (ONLY if shouldSendSMS is true and role is Farmer/etc.)
  if (shouldSendSMS && recipientPhone) {
    return await sendSMS(recipientPhone, message);
  } else {
    console.log(`[NotificationService] Skipping SMS for Retailer (Inbox only)`);
  }
}

/**
 * Triggers alert for Payment Confirmation (To Farmer)
 */
async function sendPaymentAlert(orderData, farmerPhone) {
  const title = "Payment Received! 💰";
  const message = `Mandi-Connect: Payment of ₹${orderData.price_per_kg * orderData.quantity_kg} received for ${orderData.crop_name}. Keep the harvest ready for pickup!`;
  
  // 1. In-App Notification (Always)
  await createInAppNotification(orderData.farmer_id, title, message, 'payment_received');

  // 2. SMS (If phone is available)
  if (farmerPhone) {
    return await sendSMS(farmerPhone, message);
  }
}

module.exports = {
  sendSMS,
  sendOrderAlert,
  sendStatusAlert,
  sendPaymentAlert,
  createInAppNotification
};
