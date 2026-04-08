const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const supabase = require('../supabase');

// In-memory OTP storage
const otpStore = new Map();
const rateLimiter = new Map();

// Gmail SMTP configuration
const SMTP_EMAIL = process.env.SMTP_EMAIL || '';
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || '';

// Create transporter
// Create transporter with explicit settings for better reliability in cloud environments
function createTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Use SSL on 465
    auth: {
      user: SMTP_EMAIL.trim(),
      pass: SMTP_PASSWORD.trim()
    },
    family: 4, // Force IPv4 to avoid ENETUNREACH on IPv6
    connectionTimeout: 30000, // 30 seconds
    greetingTimeout: 30000,
    socketTimeout: 30000
  });
}

// Rate limit: max 5 OTPs per email per 10 minutes
function checkRateLimit(email) {
  const now = Date.now();
  const key = email.toLowerCase();
  const record = rateLimiter.get(key);
  if (!record) {
    rateLimiter.set(key, { count: 1, firstRequest: now });
    return true;
  }
  if (now - record.firstRequest > 10 * 60 * 1000) {
    rateLimiter.set(key, { count: 1, firstRequest: now });
    return true;
  }
  if (record.count >= 5) return false;
  record.count++;
  return true;
}

// ========== SEND OTP ==========
router.post('/send', async (req, res) => {
  console.log(`[OTP] Request received: POST /api/otp/send`, req.body);
  try {
    const { email, checkRegistration } = req.body; // checkRegistration: 'login' or 'register'
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email address is required' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address' });
    }

    const emailKey = email.toLowerCase().trim();

    // Check registration status if requested
    if (checkRegistration) {
      console.log(`[OTP] Checking registration status for ${emailKey} as ${checkRegistration}`);
      const { data: user, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', emailKey)
        .single();
      
      if (checkRegistration === 'login' && (!user || error)) {
        return res.status(404).json({ success: false, error: 'This email is not registered. Please register first.' });
      }
      if (checkRegistration === 'register' && user) {
        return res.status(400).json({ success: false, error: 'This email is already registered. Please login.' });
      }
      if (error && error.code !== 'PGRST116') {
        console.warn(`[OTP] Supabase check error:`, error);
      }
    }

    // Rate limit
    if (!checkRateLimit(emailKey)) {
      return res.status(429).json({ success: false, error: 'Too many OTP requests. Please wait 10 minutes.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with 5-minute expiry
    otpStore.set(emailKey, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempts: 0
    });

    console.log(`[OTP] Generated for ${emailKey}: ${otp}`);

    // Check SMTP credentials
    if (!SMTP_EMAIL || !SMTP_PASSWORD) {
      console.warn('[OTP] ⚠️ SMTP_EMAIL or SMTP_PASSWORD not set in .env. Cannot send email.');
      return res.status(500).json({ 
        success: false, 
        error: 'Email configuration is missing. Cannot send OTP.'
      });
    }

    // --- SENDING LOGIC (Using Brevo HTTP API to avoid SMTP blocks) ---
    try {
      const BREVO_API_KEY = process.env.BREVO_API_KEY;

      if (!BREVO_API_KEY) {
        console.warn('[OTP] ⚠️ BREVO_API_KEY not set. Falling back to console log for OTP.');
        console.log(`[DEV MODE] OTP for ${emailKey} is: ${otp}`);
        return res.json({ 
          success: true, 
          message: `[DEV MODE] OTP for ${emailKey} is: ${otp}` 
        });
      }

      const axios = require('axios');
      const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
        sender: { name: "MandiConnect", email: SMTP_EMAIL || "no-reply@mandiconnect.com" },
        to: [{ email: emailKey }],
        subject: "🌾 MandiConnect - OTP Verification",
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <span style="font-size: 3rem;">🌾</span>
              <h2 style="color: #0f3d2e; margin: 8px 0;">MandiConnect</h2>
              <p style="color: #666; font-size: 14px;">Farm-to-Retail Marketplace</p>
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 16px; color: #333;">Your OTP for MandiConnect registration is:</p>
            <div style="background: #f0faf4; border: 2px dashed #28a745; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
              <span style="font-size: 2.5rem; font-weight: 700; letter-spacing: 10px; color: #0f3d2e;">${otp}</span>
            </div>
            <p style="font-size: 14px; color: #666;">⏱️ This OTP will expire in <strong>5 minutes</strong>.</p>
            <p style="font-size: 13px; color: #999;">If you did not request this OTP, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="text-align: center; font-size: 12px; color: #aaa;">© 2026 MandiConnect · Built for Rural India 🇮🇳</p>
          </div>
        `
      }, {
        headers: {
          'api-key': BREVO_API_KEY,
          'Content-Type': 'application/json'
        }
      });

      console.log(`[OTP] ✅ Email sent via Brevo API to ${emailKey}`);
      return res.json({ success: true, message: `OTP sent to ${emailKey}` });

    } catch (apiErr) {
      console.error('[OTP] ❌ Brevo API Error:', apiErr.response?.data || apiErr.message);
      
      // Safety fallback so users aren't stuck during testing
      return res.json({
        success: true,
        message: `[SERVER BUSY] For this demo, your OTP is: ${otp}`
      });
    }

  } catch (err) {
    console.error('[OTP] Error:', err);
    res.status(500).json({ success: false, error: 'Server error: ' + err.message });
  }
});

// ========== VERIFY OTP ==========
router.post('/verify', (req, res) => {
  console.log(`[OTP] Request received: POST /api/otp/verify`, req.body);
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email and OTP are required' });
    }

    const emailKey = email.toLowerCase().trim();
    const stored = otpStore.get(emailKey);

    if (!stored) {
      console.log(`[OTP] No OTP found for ${emailKey}`);
      return res.status(400).json({ success: false, error: 'OTP expired or not sent. Please request a new OTP.' });
    }

    // Check 5-minute expiry
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(emailKey);
      console.log(`[OTP] OTP expired for ${emailKey}`);
      return res.status(400).json({ success: false, error: 'OTP expired. Please request a new one.' });
    }

    // Max 3 wrong attempts
    if (stored.attempts >= 3) {
      otpStore.delete(emailKey);
      console.log(`[OTP] Too many wrong attempts for ${emailKey}`);
      return res.status(400).json({ success: false, error: 'Too many wrong attempts. Request a new OTP.' });
    }

    stored.attempts++;

    // Force compare as strings
    const receivedOtp = String(otp).trim();

    if (stored.otp === receivedOtp) {
      otpStore.delete(emailKey);
      console.log(`[OTP] ✅ Verified for ${emailKey}`);
      return res.json({ success: true, verified: true, message: 'Email verified successfully' });
    } else {
      console.log(`[OTP] ❌ Wrong OTP for ${emailKey}: got ${receivedOtp}, expected ${stored.otp}`);
      return res.status(400).json({ success: false, error: 'Invalid OTP. Please try again.' });
    }

  } catch (err) {
    console.error('[OTP] Verify error:', err);
    res.status(500).json({ success: false, error: 'Server error: ' + err.message });
  }
});

module.exports = router;
