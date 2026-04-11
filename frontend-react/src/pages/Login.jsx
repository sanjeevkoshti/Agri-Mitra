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
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 overflow-hidden">
      {/* LEFT SIDE: Visual Hero */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary-dark items-center justify-center p-12 overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="hero-blob w-[500px] h-[500px] bg-primary top-[-10% ] left-[-10%] animate-pulse-slow"></div>
        <div className="hero-blob w-[400px] h-[400px] bg-accent bottom-[-5%] right-[-5%] animate-float"></div>
        
        <div className="relative z-10 w-full max-w-lg">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse"></span>
            <span className="text-white/80 text-xs font-bold uppercase tracking-widest">{t('welcome_to')} Mandi-Connect</span>
          </div>
          
          <h1 className="text-5xl xl:text-6xl font-black text-white leading-tight mb-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            Digitalizing <span className="text-accent underline decoration-white/20 underline-offset-8 italic">Agriculture</span> for the Next Gen.
          </h1>
          
          <p className="text-lg text-white/70 mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-700 delay-200">
            Connecting farmers directly with retailers, ensuring fair prices and reducing waste through technology-driven marketplace.
          </p>

          <div className="relative rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-1000 delay-300">
            <img 
              src="/src/assets/login-hero.png" 
              alt="Modern Agriculture" 
              className="w-full h-[400px] object-cover hover:scale-105 transition-transform duration-700" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary-dark/80 to-transparent flex items-bottom p-8">
              <div className="mt-auto">
                <div className="flex gap-4">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                    <p className="text-3xl font-black text-white">5k+</p>
                    <p className="text-xs text-white/60 uppercase tracking-tighter">Active Farmers</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                    <p className="text-3xl font-black text-white">100t+</p>
                    <p className="text-xs text-white/60 uppercase tracking-tighter">Monthly Trade</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Authentication Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative bg-white lg:bg-transparent">
        {/* Subtle background for form side on desktop */}
        <div className="absolute inset-0 bg-slate-50 -z-10"></div>
        
        <div className="w-full max-w-md">
          <div className="glass-card w-full animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3 hover:rotate-0 transition-transform duration-300 shadow-lg shadow-primary/5">
                <span className="text-4xl">🌾</span>
              </div>
              <h2 className="text-3xl font-heading font-black text-slate-900 mb-2">
                {view === 'login' ? (t('tab_login') || 'Welcome Back') : view === 'forgot' ? (t('reset_password') || 'Reset Password') : (t('create_account') || 'Join the Community')}
              </h2>
              <p className="text-slate-500 font-medium">{t('login_subtitle') || 'Enter your details to access your portal'}</p>
            </div>

            {error && (
              <div className="p-4 mb-6 rounded-2xl bg-red-50 text-red-600 text-sm font-bold border border-red-100 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                {error}
              </div>
            )}
            {success && (
              <div className="p-4 mb-6 rounded-2xl bg-emerald-50 text-emerald-600 text-sm font-bold border border-emerald-100 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                {success}
              </div>
            )}

            {view !== 'forgot' && (
              <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
                <button 
                  className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${view === 'login' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary'}`}
                  onClick={() => { setView('login'); clearMessages(); }}
                >
                  {t('tab_login')}
                </button>
                <button 
                  className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${view === 'register' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary'}`}
                  onClick={() => { setView('register'); clearMessages(); }}
                >
                  {t('tab_register')}
                </button>
              </div>
            )}

            {/* FORGOT PASSWORD FORM */}
            {view === 'forgot' && (
              <form onSubmit={handleForgot} noValidate className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">{t('email_label')}</label>
                  <div className="relative group">
                    <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input 
                      name="email" type="email" placeholder="example@email.com" required
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-primary/30 focus:bg-white bg-slate-50 outline-none transition-all font-bold text-slate-700"
                      value={formData.email} onChange={handleChange}
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full btn btn-primary py-5 mt-4 text-lg font-black uppercase tracking-widest shadow-xl shadow-primary/20">
                  {loading ? (t('processing') || 'Sending...') : t('send_link')}
                </button>
                <p className="text-center mt-6">
                  <a href="#" className="font-bold text-primary hover:text-primary-dark transition-colors flex items-center justify-center gap-2 group underline underline-offset-4 decoration-primary/20" onClick={() => setView('login')}>
                    <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                    {t('back_to_login')}
                  </a>
                </p>
              </form>
            )}

            {/* MAIN FORM */}
            {view !== 'forgot' && (
              <form onSubmit={view === 'login' ? handleLogin : handleRegister} noValidate className="space-y-5">
                {view === 'register' && (
                  <div className="space-y-2 mb-6">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">{t('i_am_a') || 'Choose your role'}</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        type="button" 
                        className={`flex flex-col items-center gap-2 py-5 rounded-2xl border-2 transition-all duration-300 ${role === 'farmer' ? 'border-primary bg-primary/5 shadow-inner-lg' : 'border-slate-100 hover:border-slate-200 bg-white'}`} 
                        onClick={() => setRole('farmer')}
                      >
                        <span className="text-2xl">🌱</span>
                        <span className={`text-xs font-black uppercase tracking-widest ${role === 'farmer' ? 'text-primary' : 'text-slate-400'}`}>{t('farmer')}</span>
                      </button>
                      <button 
                        type="button" 
                        className={`flex flex-col items-center gap-2 py-5 rounded-2xl border-2 transition-all duration-300 ${role === 'retailer' ? 'border-primary bg-primary/5 shadow-inner-lg' : 'border-slate-100 hover:border-slate-200 bg-white'}`} 
                        onClick={() => setRole('retailer')}
                      >
                        <span className="text-2xl">🛒</span>
                        <span className={`text-xs font-black uppercase tracking-widest ${role === 'retailer' ? 'text-primary' : 'text-slate-400'}`}>{t('retailer')}</span>
                      </button>
                    </div>
                  </div>
                )}

                {view === 'register' && (
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">{t('full_name')}</label>
                    <div className="relative group">
                      <User className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                      <input 
                        name="name" placeholder="John Doe" required 
                        className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 ${fieldErrors.name ? 'border-red-300 bg-red-50/50' : 'border-slate-100 bg-slate-50'} focus:border-primary/30 outline-none transition-all font-bold text-slate-700`} 
                        value={formData.name} 
                        onChange={(e) => { handleChange(e); if (fieldErrors.name) setFieldErrors({...fieldErrors, name: null}); }} 
                      />
                    </div>
                    {fieldErrors.name && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-widest pl-2">{fieldErrors.name}</p>}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">{t('email_label')}</label>
                  <div className="relative group">
                    <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input 
                      name="email" type="email" placeholder="example@email.com" required
                      className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 ${fieldErrors.email ? 'border-red-300 bg-red-50/50' : 'border-slate-100 bg-slate-50'} focus:border-primary/30 outline-none transition-all font-bold text-slate-700`}
                      value={formData.email} 
                      onChange={(e) => { handleChange(e); if (fieldErrors.email) setFieldErrors({...fieldErrors, email: null}); }}
                    />
                  </div>
                  {fieldErrors.email && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-widest pl-2">{fieldErrors.email}</p>}
                </div>

                {view === 'register' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">{t('phone_number')}</label>
                      <div className="relative group">
                        <Phone className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input 
                          name="phone" placeholder="9876543210" required 
                          className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 ${fieldErrors.phone ? 'border-red-300 bg-red-50/50' : 'border-slate-100 bg-slate-50'} focus:border-primary/30 outline-none transition-all font-bold text-slate-700`} 
                          value={formData.phone} 
                          onChange={(e) => { handleChange(e); if (fieldErrors.phone) setFieldErrors({...fieldErrors, phone: null}); }} 
                        />
                      </div>
                      {fieldErrors.phone && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-widest pl-2">{fieldErrors.phone}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">{t('location')}</label>
                      <div className="relative group">
                        <MapPin className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input 
                          name="location" placeholder="Karnataka, India" required 
                          className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 ${fieldErrors.location ? 'border-red-300 bg-red-50/50' : 'border-slate-100 bg-slate-50'} focus:border-primary/30 outline-none transition-all font-bold text-slate-700`} 
                          value={formData.location} 
                          onChange={(e) => { handleChange(e); if (fieldErrors.location) setFieldErrors({...fieldErrors, location: null}); }} 
                        />
                      </div>
                      {fieldErrors.location && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-widest pl-2">{fieldErrors.location}</p>}
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">{t('password_label')}</label>
                    {view === 'login' && (
                      <button type="button" className="text-[10px] text-primary font-black uppercase tracking-widest hover:underline" onClick={(e) => { e.preventDefault(); setView('forgot'); clearMessages(); }}>{t('forgot_password')}</button>
                    )}
                  </div>
                  <div className="relative group">
                    <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input 
                      name="password" type="password" placeholder="••••••••" required minLength="6"
                      className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 ${fieldErrors.password ? 'border-red-300 bg-red-50/50' : 'border-slate-100 bg-slate-50'} focus:border-primary/30 outline-none transition-all font-bold text-slate-700`}
                      value={formData.password} 
                      onChange={(e) => { handleChange(e); if (fieldErrors.password) setFieldErrors({...fieldErrors, password: null}); }}
                    />
                  </div>
                  {fieldErrors.password && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-widest pl-2">{fieldErrors.password}</p>}
                </div>

                <button type="submit" disabled={loading} className="w-full btn btn-primary py-5 mt-4 font-black uppercase tracking-widest items-center justify-center gap-2 flex disabled:opacity-50 text-lg shadow-xl shadow-primary/20 hover:-translate-y-1 transition-transform active:translate-y-0">
                  {loading ? (t('processing') || 'Processing...') : view === 'login' ? t('login_btn') : t('create_account')} 
                  <ArrowRight className="w-6 h-6 animate-pulse" />
                </button>
                
                <div className="pt-6 border-t border-slate-100 text-center">
                  <p className="text-sm font-medium text-slate-500 flex items-center justify-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    {t('secure_auth_msg') || 'Your connection is encrypted and secure'}
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
