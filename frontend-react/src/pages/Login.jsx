import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Lock, Mail, Phone, MapPin, ArrowRight, CheckCircle, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { useI18n } from '../context/I18nContext';

const Login = () => {
  const { t } = useI18n();
  const [view, setView] = useState('login'); // 'login', 'register', 'forgot'
  const [role, setRole] = useState('farmer');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', location: '', password: '', otp: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Registration OTP States
  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'retailer') setRole('retailer');
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const clearMessages = () => {
    setError(''); setSuccess('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    const res = await api.login(formData.email, formData.password);
    setLoading(false);
    
    if (res.success) {
      const user = { ...res.user, name: res.user.full_name || res.user.name };
      localStorage.setItem('mc_profile', JSON.stringify(user));
      setSuccess((t('success_label') || 'Login successful') + '! Redirecting...');
      setTimeout(() => {
        navigate(user.role === 'farmer' ? '/farmer-dash' : '/marketplace');
      }, 1000);
    } else {
      setError(res.error || 'Login failed.');
    }
  };

  const handleSendOTP = async () => {
    if (!formData.email) return setError('Please enter your email address first.');
    clearMessages();
    setLoading(true);
    
    console.log(`[AUTH] Sending OTP to ${formData.email}...`);
    const res = await api.sendOTP(formData.email, 'register');
    setLoading(false);
    
    if (res.success) {
      setOtpSent(true);
      setSuccess(res.message || t('enter_otp_msg') || 'OTP sent to your email.');
      console.log(`[AUTH] OTP Success:`, res.message);
    } else {
      setError(res.error || 'Could not send OTP.');
      console.error(`[AUTH] OTP Error:`, res.error);
    }
  };

  const handleVerifyOTP = async () => {
    if (formData.otp.length !== 6) return setError('Enter standard 6-digit OTP.');
    clearMessages();
    setLoading(true);
    const res = await api.verifyOTP(formData.email, formData.otp);
    setLoading(false);
    
    if (res.success) {
      setEmailVerified(true);
      setOtpSent(false);
      setSuccess(t('email_verified_msg') || 'Email verified successfully!');
    } else {
      setError(res.error || 'Invalid OTP.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!emailVerified) return setError('Please verify your email first.');
    if (formData.password.length < 6) return setError('Password must be at least 6 characters.');
    
    clearMessages();
    setLoading(true);
    
    const userData = {
      email: formData.email,
      full_name: formData.name,
      phone: formData.phone,
      location: formData.location,
      role,
      password: formData.password
    };

    const res = await api.register(userData);
    setLoading(false);
    
    if (res.success) {
      const user = { ...res.user, name: res.user.full_name || res.user.name };
      localStorage.setItem('mc_profile', JSON.stringify(user));
      setSuccess((t('success_label') || 'Account created') + '! Redirecting...');
      setTimeout(() => {
        navigate(res.user.role === 'farmer' ? '/farmer-dash' : '/marketplace');
      }, 1000);
    } else {
      setError(res.error || 'Failed to register.');
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    const res = await api.forgotPassword(formData.email);
    setLoading(false);
    
    if (res.success) {
      setSuccess('Reset link sent! Please check your email.');
      setTimeout(() => setView('login'), 3000);
    } else {
      setError(res.error || 'Error sending link.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-gradient-to-br from-primary-dark to-[#1e5c3c]">
      <div className="bg-white rounded-large p-8 w-full max-w-md shadow-hard animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🌾</div>
          <h2 className="text-2xl font-heading font-bold">
            {view === 'login' ? (t('tab_login') || 'Welcome Back') : view === 'forgot' ? (t('reset_password') || 'Reset Password') : (t('create_account') || 'Create Account')}
          </h2>
          <p className="text-text-muted text-sm px-4">{t('login_subtitle')}</p>
        </div>

        {error && <div className="p-3 mb-4 rounded-md bg-danger/10 text-danger text-sm font-bold shadow-sm border border-danger/20">{error}</div>}
        {success && <div className="p-3 mb-4 rounded-md bg-success/10 text-success text-sm font-bold shadow-sm border border-success/20">{success}</div>}

        {view !== 'forgot' && (
          <div className="flex border-2 border-primary/10 rounded-small overflow-hidden mb-6">
            <button 
              className={`flex-1 py-2 text-sm font-bold transition-colors ${view === 'login' ? 'bg-primary text-white' : 'bg-white text-text-muted hover:bg-bg'}`}
              onClick={() => { setView('login'); clearMessages(); }}
            >
              {t('tab_login')}
            </button>
            <button 
              className={`flex-1 py-2 text-sm font-bold transition-colors ${view === 'register' ? 'bg-primary text-white' : 'bg-white text-text-muted hover:bg-bg'}`}
              onClick={() => { setView('register'); clearMessages(); }}
            >
              {t('tab_register')}
            </button>
          </div>
        )}

        {/* FORGOT PASSWORD FORM */}
        {view === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-4">
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/60" />
              <input 
                name="email" type="email" placeholder={t('email_label')} required
                className="w-full pl-10 pr-4 py-3 rounded-small border-2 border-primary/10 focus:border-primary outline-none transition-all font-bold"
                value={formData.email} onChange={handleChange}
              />
            </div>
            <button type="submit" disabled={loading} className="w-full btn btn-primary py-4 mt-4 text-lg font-black uppercase tracking-widest">
              {loading ? 'Sending...' : t('send_link')}
            </button>
            <p className="text-center mt-4 text-sm"><a href="#" className="font-bold text-primary hover:underline" onClick={() => setView('login')}>{t('back_to_login')}</a></p>
          </form>
        )}

        {/* MAIN FORM */}
        {view !== 'forgot' && (
          <form onSubmit={view === 'login' ? handleLogin : handleRegister} className="space-y-4">
            {view === 'register' && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button type="button" className={`py-4 rounded-small border-2 font-black uppercase text-xs tracking-widest transition-all ${role === 'farmer' ? 'border-primary bg-primary/5 text-primary' : 'border-primary/10 text-text-muted hover:border-primary/30'}`} onClick={() => setRole('farmer')}>🌱 {t('farmer')}</button>
                <button type="button" className={`py-4 rounded-small border-2 font-black uppercase text-xs tracking-widest transition-all ${role === 'retailer' ? 'border-primary bg-primary/5 text-primary' : 'border-primary/10 text-text-muted hover:border-primary/30'}`} onClick={() => setRole('retailer')}>🛒 {t('retailer')}</button>
              </div>
            )}

            {view === 'register' && (
              <div className="relative">
                <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/60" />
                <input name="name" placeholder={t('full_name')} required className="w-full pl-10 pr-4 py-3 rounded-small border-2 border-primary/10 focus:border-primary outline-none transition-all font-bold" value={formData.name} onChange={handleChange} />
              </div>
            )}

            <div className="relative flex gap-2">
              <div className="relative flex-grow">
                <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/60" />
                <input 
                  name="email" type="email" placeholder={t('email_label')} required disabled={emailVerified && view === 'register'}
                  className="w-full pl-10 pr-4 py-3 rounded-small border-2 border-primary/10 focus:border-primary outline-none transition-all disabled:opacity-50 font-bold"
                  value={formData.email} onChange={handleChange}
                />
              </div>
              {view === 'register' && !emailVerified && (
                <button type="button" onClick={handleSendOTP} disabled={loading || !formData.email} className="btn btn-outline text-[10px] font-black uppercase px-4 whitespace-nowrap">
                  {t('send_otp')}
                </button>
              )}
              {view === 'register' && emailVerified && (
                <div className="btn text-white bg-success px-4 flex items-center justify-center cursor-default pointer-events-none"><CheckCircle className="w-5 h-5"/></div>
              )}
            </div>

            {view === 'register' && otpSent && !emailVerified && (
              <div className="p-3 bg-bg rounded-small border border-primary/20 flex gap-2 animate-in slide-in-from-top-2 duration-300">
                <input name="otp" type="text" placeholder="OTP" maxLength="6" className="flex-grow pl-3 py-2 rounded-small border border-primary/10 focus:border-primary tracking-[0.5em] font-black text-center outline-none" value={formData.otp} onChange={handleChange} />
                <button type="button" onClick={handleVerifyOTP} disabled={loading || !formData.otp} className="btn btn-primary px-6 whitespace-nowrap text-xs font-black uppercase">{t('verify_otp')}</button>
              </div>
            )}

            {view === 'register' && (
              <>
                <div className="relative">
                  <Phone className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/60" />
                  <input name="phone" placeholder={t('phone_number')} required className="w-full pl-10 pr-4 py-3 rounded-small border-2 border-primary/10 focus:border-primary outline-none transition-all font-bold" value={formData.phone} onChange={handleChange} />
                </div>
                <div className="relative">
                  <MapPin className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/60" />
                  <input name="location" placeholder={t('location')} required className="w-full pl-10 pr-4 py-3 rounded-small border-2 border-primary/10 focus:border-primary outline-none transition-all font-bold" value={formData.location} onChange={handleChange} />
                </div>
              </>
            )}

            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/60" />
              <input 
                name="password" type="password" placeholder={t('password_label')} required minLength="6"
                className="w-full pl-10 pr-4 py-3 rounded-small border-2 border-primary/10 focus:border-primary outline-none transition-all font-bold"
                value={formData.password} onChange={handleChange}
              />
            </div>

            {view === 'login' && (
              <div className="text-right">
                <a href="#" className="text-xs text-primary font-bold hover:underline" onClick={(e) => { e.preventDefault(); setView('forgot'); clearMessages(); }}>{t('forgot_password')}</a>
              </div>
            )}

            <button type="submit" disabled={loading || (view === 'register' && !emailVerified)} className="w-full btn btn-primary py-4 mt-4 font-black uppercase tracking-widest items-center justify-center gap-2 flex disabled:opacity-50 text-base shadow-hard">
              {loading ? 'Processing...' : view === 'login' ? t('login_btn') : t('create_account')} <ArrowRight className="w-6 h-6" />
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default Login;
