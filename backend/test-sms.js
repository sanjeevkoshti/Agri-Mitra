/**
 * Test script for Mandi-Connect SMS Alerts (TWILIO VERSION)
 * ---------------------------------------
 * This script tests the notification engine in:
 * 1. Simulator Mode (if TWILIO_ACCOUNT_SID is missing)
 * 2. Real SMS Mode (if TWILIO_ACCOUNT_SID is added)
 */

require('dotenv').config();
const { sendSMS, createInAppNotification } = require('./services/notificationService');

// Setup logging for standalone script
global.serverLog = console.log;

async function runTest() {
  console.log('--- Mandi-Connect Notification Test (Twilio + DB) ---');
  
  const testNumber = '8105608047'; // User's number
  const testMessage = 'Mandi-Connect: This is a test alert from Twilio! 🌾';
  const testUserId = '10e5ca16-29a7-43b8-9364-0c6eabb3d4de'; // Real user ID from DB

  console.log(`\n1. Testing In-App Notification storage...`);
  // Note: This requires a valid user_id in your Supabase 'profiles' table.
  // We'll try to find one or just log the failure.
  await createInAppNotification(testUserId, "Test Title", "Test Message", "test");
  console.log('✅ In-app trigger sent (Check your DB or App Header)');

  console.log(`\n2. Testing SMS logic...`);
  const result = await sendSMS(testNumber, testMessage);

  if (result.success) {
    if (result.simulated) {
      console.log('\n✅ TEST SUCCESSFUL (Simulator Mode)');
      console.log('Note: To send a real SMS, add your Twilio credentials to .env');
    } else {
      console.log('\n✅ TEST SUCCESSFUL (Real SMS Sent via Twilio)');
      console.log('SID:', result.sid);
    }
  } else {
    console.log('\n❌ TEST FAILED');
    console.log('Error:', result.error);
    console.log('\nTip: If it says "The number is unverified", you must go to Twilio.com and verify your number first!');
  }
}

runTest().catch(err => {
  console.error('Fatal Test Error:', err);
});
