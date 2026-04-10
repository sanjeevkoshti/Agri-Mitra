const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const supabase = require('../supabase');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

const SMTP_EMAIL = process.env.SMTP_EMAIL || '';
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || '';

// Create transporter
function createTransporter() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: SMTP_EMAIL,
      pass: SMTP_PASSWORD
    }
  });
}

/**
 * REGISTER: Save user data directly
 */
router.post('/register', async (req, res) => {
  try {
    const { email, full_name, phone, location, role, password } = req.body;

    if (!email || !full_name || !location || !role || !password) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already registered. Please login.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const { data, error } = await supabase
      .from('profiles')
      .insert([{
        email: email.toLowerCase().trim(),
        full_name,
        phone,
        location,
        role,
        password: hashedPassword,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    // If the user is a farmer, create an entry in farmer_profiles
    if (role === 'farmer') {
      const { error: profileError } = await supabase
        .from('farmer_profiles')
        .insert([{ farmer_id: data.id }]);
      
      if (profileError) {
        console.warn('[Auth] Could not create farmer profile:', profileError.message);
      }
    }

    // Generate JWT
    const token = jwt.sign(
      { id: data.id, role: data.role, email: data.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ success: true, user: data, token, message: 'Registration successful' });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * LOGIN: Check email and password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    // Check if user exists
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !user) {
      return res.status(404).json({ 
        success: false, 
        error: 'Email not registered. Please create an account.' 
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        error: 'Incorrect password.' 
      });
    }

    // Remove password from response
    const { password: _, ...userData } = user;

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ success: true, user: userData, token, message: 'Login successful' });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * FORGOT PASSWORD: Send reset link
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email is required' });

    const emailKey = email.toLowerCase().trim();

    // Check if user exists
    const { data: user, error } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('email', emailKey)
      .single();

    if (error || !user) {
      // For security, don't reveal if email exists or not? 
      // Requirement 5 says reveal on login, but usually for forgot-pass we might be vague.
      // However, requirement 11 says "Reset link sent to your email".
      return res.status(404).json({ success: false, error: 'Email not registered.' });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    await supabase
      .from('profiles')
      .update({ reset_token: token, reset_token_expiry: expiry })
      .eq('email', emailKey);

    // Send Email
    const frontendUrl = process.env.FRONTEND_URL || `http://localhost:3000`;
    const resetUrl = `${frontendUrl}/reset-password.html?token=${token}&email=${emailKey}`;
    
    // In a real app, this would be the frontend URL. 
    // Since the frontend is currently served statically or via simple server, 
    // I'll assume it's on the same domain/port for now or just placeholder.
    // Actually, backend is 3002, frontend is likely 3000 or 5500.
    // Let's use a relative link or environment variable if possible.
    // I'll use a placeholder and mention it.

    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"MandiConnect" <${SMTP_EMAIL}>`,
      to: emailKey,
      subject: '🌾 MandiConnect - Password Reset',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 12px;">
          <h2>Password Reset</h2>
          <p>Hi ${user.full_name},</p>
          <p>You requested a password reset. Click the button below to set a new password:</p>
          <a href="${resetUrl}" style="display:inline-block; padding:12px 24px; background-color:#28a745; color:white; text-decoration:none; border-radius:6px; font-weight:bold;">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `
    });

    res.json({ success: true, message: 'Reset link sent to your email' });
  } catch (err) {
    console.error('[Auth] Forgot password error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * RESET PASSWORD: Update password using token
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;
    if (!token || !email || !newPassword) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const emailKey = email.toLowerCase().trim();

    // Verify token
    const { data: user, error } = await supabase
      .from('profiles')
      .select('id, reset_token, reset_token_expiry')
      .eq('email', emailKey)
      .single();

    if (error || !user || user.reset_token !== token) {
      return res.status(400).json({ success: false, error: 'Invalid or expired token.' });
    }

    if (new Date() > new Date(user.reset_token_expiry)) {
      return res.status(400).json({ success: false, error: 'Token expired.' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear token
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        password: hashedPassword, 
        reset_token: null, 
        reset_token_expiry: null 
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('[Auth] Reset password error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
