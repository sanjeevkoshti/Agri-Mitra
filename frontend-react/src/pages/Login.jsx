import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Lock, Mail, Phone, MapPin, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { useI18n } from '../context/I18nContext';

const Login = () => {
  const { t } = useI18n();
  const [view, setView] = useState('login'); // 'login', 'register', 'forgot'
  const [role, setRole] = useState('farmer');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', location: '', password: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Registration States
  const [fieldErrors, setFieldErrors] = useState({});

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

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
    const errors = {};
    if (!validateEmail(formData.email)) errors.email = t('err_invalid_email') || 'Invalid email format.';
    if (!formData.password || formData.password.length < 6) errors.password = t('err_pass_length') || 'Password must be 6+ chars.';
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    const res = await api.login(formData.email, formData.password);
    setLoading(false);
    
    if (res.success) {
      const user = { ...res.user, name: res.user.full_name || res.user.name };
      localStorage.setItem('mc_profile', JSON.stringify(user));
      localStorage.setItem('mc_token', res.token);
      setSuccess((t('success_label') || 'Login successful') + '! ' + (t('redirecting') || 'Redirecting...'));
      setTimeout(() => {
        navigate(user.role === 'farmer' ? '/farmer-dash' : '/marketplace');
      }, 1000);
    } else {
      setError(res.error || t('err_login_failed') || 'Login failed.');
      if (res.error?.toLowerCase().includes('email')) setFieldErrors({ email: res.error });
      if (res.error?.toLowerCase().includes('password')) setFieldErrors({ password: res.error });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.name) errors.name = 'Full name is required.';
    if (!validateEmail(formData.email)) errors.email = 'Invalid email.';
    if (!formData.phone || formData.phone.length < 10) errors.phone = 'Invalid phone number.';
    if (!formData.location) errors.location = 'Location is required.';
    if (formData.password.length < 6) errors.password = 'Password must be at least 6 characters.';
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
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
      localStorage.setItem('mc_token', res.token);
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
      setSuccess(t('reset_success_msg') || 'Reset link sent! Please check your email.');
      setTimeout(() => setView('login'), 3000);
    } else {
      setError(res.error || t('err_send_link') || 'Error sending link.');
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
          <form onSubmit={handleForgot} noValidate className="space-y-4">
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
          <form onSubmit={view === 'login' ? handleLogin : handleRegister} noValidate className="space-y-4">
            {view === 'register' && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button type="button" className={`py-4 rounded-small border-2 font-black uppercase text-xs tracking-widest transition-all ${role === 'farmer' ? 'border-primary bg-primary/5 text-primary' : 'border-primary/10 text-text-muted hover:border-primary/30'}`} onClick={() => setRole('farmer')}>🌱 {t('farmer')}</button>
                <button type="button" className={`py-4 rounded-small border-2 font-black uppercase text-xs tracking-widest transition-all ${role === 'retailer' ? 'border-primary bg-primary/5 text-primary' : 'border-primary/10 text-text-muted hover:border-primary/30'}`} onClick={() => setRole('retailer')}>🛒 {t('retailer')}</button>
              </div>
            )}

            {view === 'register' && (
              <div className="relative">
                <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/60" />
                <input 
                  name="name" placeholder={t('full_name')} required 
                  className={`w-full pl-10 pr-4 py-3 rounded-small border-2 ${fieldErrors.name ? 'border-red-500' : 'border-primary/10'} focus:border-primary outline-none transition-all font-bold`} 
                  value={formData.name} 
                  onChange={(e) => { handleChange(e); if (fieldErrors.name) setFieldErrors({...fieldErrors, name: null}); }} 
                />
                {fieldErrors.name && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-widest pl-2">{fieldErrors.name}</p>}
              </div>
            )}

            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/60" />
              <input 
                name="email" type="email" placeholder={t('email_label')} required
                className={`w-full pl-10 pr-4 py-3 rounded-small border-2 ${fieldErrors.email ? 'border-red-500' : 'border-primary/10'} focus:border-primary outline-none transition-all font-bold`}
                value={formData.email} 
                onChange={(e) => { handleChange(e); if (fieldErrors.email) setFieldErrors({...fieldErrors, email: null}); }}
              />
            </div>
            {fieldErrors.email && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-widest pl-2">{fieldErrors.email}</p>}
            {view === 'register' && (
              <>
                <div className="relative">
                  <Phone className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/60" />
                  <input 
                    name="phone" placeholder={t('phone_number')} required 
                    className={`w-full pl-10 pr-4 py-3 rounded-small border-2 ${fieldErrors.phone ? 'border-red-500' : 'border-primary/10'} focus:border-primary outline-none transition-all font-bold`} 
                    value={formData.phone} 
                    onChange={(e) => { handleChange(e); if (fieldErrors.phone) setFieldErrors({...fieldErrors, phone: null}); }} 
                  />
                  {fieldErrors.phone && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-widest pl-2">{fieldErrors.phone}</p>}
                </div>
                <div className="relative">
                  <MapPin className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/60" />
                  <input 
                    name="location" placeholder={t('location')} required 
                    className={`w-full pl-10 pr-4 py-3 rounded-small border-2 ${fieldErrors.location ? 'border-red-500' : 'border-primary/10'} focus:border-primary outline-none transition-all font-bold`} 
                    value={formData.location} 
                    onChange={(e) => { handleChange(e); if (fieldErrors.location) setFieldErrors({...fieldErrors, location: null}); }} 
                  />
                  {fieldErrors.location && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-widest pl-2">{fieldErrors.location}</p>}
                </div>
              </>
            )}

            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/60" />
              <input 
                name="password" type="password" placeholder={t('password_label')} required minLength="6"
                className={`w-full pl-10 pr-4 py-3 rounded-small border-2 ${fieldErrors.password ? 'border-red-500' : 'border-primary/10'} focus:border-primary outline-none transition-all font-bold`}
                value={formData.password} 
                onChange={(e) => { handleChange(e); if (fieldErrors.password) setFieldErrors({...fieldErrors, password: null}); }}
              />
              {fieldErrors.password && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-widest pl-2">{fieldErrors.password}</p>}
            </div>

            {view === 'login' && (
              <div className="text-right">
                <a href="#" className="text-xs text-primary font-bold hover:underline" onClick={(e) => { e.preventDefault(); setView('forgot'); clearMessages(); }}>{t('forgot_password')}</a>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full btn btn-primary py-4 mt-4 font-black uppercase tracking-widest items-center justify-center gap-2 flex disabled:opacity-50 text-base shadow-hard">
              {loading ? (t('processing') || 'Processing...') : view === 'login' ? t('login_btn') : t('create_account')} <ArrowRight className="w-6 h-6" />
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default Login;
