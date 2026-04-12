import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  if (!token || !email) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-bg">
        <div className="card p-8 text-center max-w-sm border-danger border">
          <h2 className="text-xl font-bold text-danger mb-2">Invalid Reset Link</h2>
          <p className="text-text-muted mb-4">This link is invalid or has expired.</p>
          <button onClick={() => navigate('/login')} className="btn btn-primary w-full py-2">Back to Login</button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (password.length < 6) errors.password = 'Password must be 6+ chars.';
    if (password !== confirmPassword) errors.confirm = 'Passwords do not match.';
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    setError('');
    setFieldErrors({});
    
    // DEMO mode bypass - testing token from testing mode
    if (token === 'demo_token') {
      setTimeout(() => {
        setSuccess('Password updated successfully! Redirecting...');
        setLoading(false);
        setTimeout(() => navigate('/login'), 2000);
      }, 1000);
      return;
    }

    const res = await api.resetPassword(token, email, password);
    setLoading(false);
    
    if (res.success) {
      setSuccess('Password updated successfully! Redirecting...');
      setTimeout(() => navigate('/login'), 2000);
    } else {
      setError(res.error || 'Failed to reset password');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-gradient-to-br from-primary-dark to-[#1e5c3c]">
      <div className="bg-white rounded-large p-8 w-full max-w-md shadow-hard animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-hard">
            🌿
          </div>
          <h2 className="text-2xl font-heading font-black text-primary-dark">New Password</h2>
          <p className="text-text-muted text-sm mt-1">Secure your Agri-Mitra account</p>
        </div>

        {error && <div className="p-3 mb-4 rounded-md bg-danger/10 text-danger text-sm font-bold border border-danger/20">{error}</div>}
        {success && <div className="p-3 mb-4 rounded-md bg-success/10 text-success text-sm font-bold border border-success/20">{success}</div>}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="relative">
            <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/60" />
            <input 
              type="password" placeholder="New Password" required minLength="6"
              className={`w-full pl-10 pr-4 py-3 rounded-small border-2 ${fieldErrors.password ? 'border-red-500' : 'border-primary/10'} focus:border-primary outline-none transition-all font-bold`}
              value={password} onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors({...fieldErrors, password: null}); }}
            />
            {fieldErrors.password && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-widest pl-2">{fieldErrors.password}</p>}
          </div>

          <div className="relative">
            <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/60" />
            <input 
              type="password" placeholder="Confirm New Password" required minLength="6"
              className={`w-full pl-10 pr-4 py-3 rounded-small border-2 ${fieldErrors.confirm ? 'border-red-500' : 'border-primary/10'} focus:border-primary outline-none transition-all font-bold`}
              value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); if (fieldErrors.confirm) setFieldErrors({...fieldErrors, confirm: null}); }}
            />
            {fieldErrors.confirm && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-widest pl-2">{fieldErrors.confirm}</p>}
          </div>

          <button type="submit" disabled={loading} className="w-full btn btn-primary py-3 mt-4 text-lg items-center justify-center gap-2 flex disabled:opacity-50">
            {loading ? 'Securing Account...' : 'Update Password'} <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <p className="text-center mt-6 text-sm">
          Already remember? <button onClick={() => navigate('/login')} className="font-bold text-primary hover:underline">Sign In</button>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
