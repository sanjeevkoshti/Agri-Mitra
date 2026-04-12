import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Lock, Mail, Phone, MapPin, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { useI18n } from '../context/I18nContext';
import loginHeroImg from '../assets/login-hero.png';

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
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-primary/20 blur-[120px] mix-blend-multiply animate-pulse-slow pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-accent/20 blur-[120px] mix-blend-multiply animate-pulse-slow pointer-events-none" style={{ animationDelay: '2s' }}></div>

      {/* LEFT SIDE: Visual Hero */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900 justify-center">
        <div className="absolute inset-0 z-0">
          <img 
            src={loginHeroImg} 
            alt="Modern Agriculture" 
            className="w-full h-full object-cover opacity-60 mix-blend-overlay hover:scale-110 transition-transform duration-[20s] ease-in-out" 
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-primary-dark/95 via-primary-dark/60 to-transparent"></div>
        </div>

        <div className="relative z-10 w-full max-w-lg flex flex-col justify-center p-12 pt-28 h-full">
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 w-fit">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent"></span>
            </span>
            <span className="text-white text-xs font-bold uppercase tracking-widest">{t('welcome_to')} Agri-Mitra</span>
          </div>
          
          <h1 className="text-5xl xl:text-7xl font-sans font-black text-white leading-[1.1] mb-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 flex flex-col">
            <span>Digitalizing</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-yellow-200 mt-1 pb-2">Agriculture.</span>
          </h1>
          
          <p className="text-lg text-white/80 mb-12 leading-relaxed font-medium max-w-md animate-in fade-in slide-in-from-bottom-12 duration-700 delay-200">
            Connecting farmers directly with retailers. Fair prices, reduced waste, and a technology-driven marketplace for the next generation.
          </p>

          <div className="flex gap-6 mt-auto animate-in fade-in slide-in-from-bottom-12 duration-700 delay-300">
            <div className="group relative bg-white/5 backdrop-blur-xl rounded-[2rem] p-6 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all w-40 flex flex-col justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <p className="text-4xl font-black text-white tracking-tight">5k<span className="text-accent">+</span></p>
              <p className="text-xs text-white/60 uppercase tracking-widest font-bold mt-2 group-hover:text-white/80 transition-colors">Active Farmers</p>
            </div>
            <div className="group relative bg-white/5 backdrop-blur-xl rounded-[2rem] p-6 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all w-40 flex flex-col justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <p className="text-4xl font-black text-white tracking-tight">100<span className="text-accent">t+</span></p>
              <p className="text-xs text-white/60 uppercase tracking-widest font-bold mt-2 group-hover:text-white/80 transition-colors">Monthly Trade</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Authentication Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 relative z-10">
        <div className="w-full max-w-[28rem]">
          <div className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] border border-white/80 p-8 sm:p-10 animate-in fade-in slide-in-from-bottom-8 duration-700 relative overflow-hidden">
            {/* Subtle glow inside the form card */}
            <div className="absolute top-[-30%] left-[-30%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-white to-transparent opacity-80 mix-blend-overlay pointer-events-none"></div>

            <div className="text-center mb-10 relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-light rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20 rotate-3 hover:rotate-0 transition-transform duration-300 border border-white/20">
                <span className="text-3xl text-white">🌾</span>
              </div>
              <h2 className="text-3xl font-heading font-black text-slate-800 mb-2 tracking-tight">
                {view === 'login' ? (t('tab_login') || 'Welcome Back') : view === 'forgot' ? (t('reset_password') || 'Reset Password') : (t('create_account') || 'Join the Community')}
              </h2>
              <p className="text-slate-500 font-medium">{t('login_subtitle') || 'Enter your details to access your portal'}</p>
            </div>

            {error && (
              <div className="relative z-10 p-4 mb-6 rounded-2xl bg-red-50/90 backdrop-blur-md text-red-600 text-sm font-bold border border-red-100/50 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0"></div>
                {error}
              </div>
            )}
            {success && (
              <div className="relative z-10 p-4 mb-6 rounded-2xl bg-emerald-50/90 backdrop-blur-md text-emerald-600 text-sm font-bold border border-emerald-100/50 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>
                {success}
              </div>
            )}

            {view !== 'forgot' && (
              <div className="flex relative z-10 bg-slate-100/50 backdrop-blur-md p-1.5 rounded-2xl mb-8 border border-white/60">
                <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-0.375rem)] bg-white rounded-xl shadow-sm transition-transform duration-300 ease-out border border-slate-100 ${view === 'register' ? 'translate-x-[calc(100%+0.375rem)]' : 'translate-x-[0]'}`}></div>
                <button 
                  type="button"
                  className={`relative z-10 flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-colors duration-300 ${view === 'login' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                  onClick={() => { setView('login'); clearMessages(); }}
                >
                  {t('tab_login')}
                </button>
                <button 
                  type="button"
                  className={`relative z-10 flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-colors duration-300 ${view === 'register' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                  onClick={() => { setView('register'); clearMessages(); }}
                >
                  {t('tab_register')}
                </button>
              </div>
            )}

            {/* FORGOT PASSWORD FORM */}
            {view === 'forgot' && (
              <form onSubmit={handleForgot} noValidate className="space-y-5 relative z-10 animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('email_label')}</label>
                  <div className="relative group">
                    <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input 
                      name="email" type="email" placeholder="example@email.com" required
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-white/60 bg-white/50 focus:bg-white focus:border-primary/40 focus:ring-4 focus:ring-primary/10 outline-none transition-all font-semibold text-slate-700 shadow-sm backdrop-blur-sm"
                      value={formData.email} onChange={handleChange}
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-primary to-primary-light text-white py-4 mt-6 rounded-2xl text-[13px] font-black uppercase tracking-widest shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all active:translate-y-0 disabled:opacity-50">
                  {loading ? (t('processing') || 'Sending...') : t('send_link')}
                </button>
                <p className="text-center mt-6">
                  <a href="#" className="text-sm font-bold text-slate-400 hover:text-primary transition-colors flex items-center justify-center gap-2 group" onClick={(e) => { e.preventDefault(); setView('login'); }}>
                    <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                    {t('back_to_login')}
                  </a>
                </p>
              </form>
            )}

            {/* MAIN FORM */}
            {view !== 'forgot' && (
              <form onSubmit={view === 'login' ? handleLogin : handleRegister} noValidate className="space-y-4 relative z-10 animate-in fade-in slide-in-from-left-4 duration-500">
                {view === 'register' && (
                  <div className="space-y-2 mb-6">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('i_am_a') || 'Choose your role'}</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        type="button" 
                        className={`group relative flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all duration-300 overflow-hidden ${role === 'farmer' ? 'border-primary/30 bg-primary/5 shadow-[0_0_20px_-5px_rgba(26,107,74,0.15)] ring-1 ring-primary/20' : 'border-white/60 bg-white/50 hover:bg-white hover:border-slate-200 hover:shadow-sm'}`} 
                        onClick={() => setRole('farmer')}
                      >
                        <span className="text-2xl relative z-10 group-hover:scale-110 transition-transform">🌱</span>
                        <span className={`text-[11px] font-black uppercase tracking-widest relative z-10 ${role === 'farmer' ? 'text-primary' : 'text-slate-400'}`}>{t('farmer')}</span>
                      </button>
                      <button 
                        type="button" 
                        className={`group relative flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all duration-300 overflow-hidden ${role === 'retailer' ? 'border-primary/30 bg-primary/5 shadow-[0_0_20px_-5px_rgba(26,107,74,0.15)] ring-1 ring-primary/20' : 'border-white/60 bg-white/50 hover:bg-white hover:border-slate-200 hover:shadow-sm'}`} 
                        onClick={() => setRole('retailer')}
                      >
                        <span className="text-2xl relative z-10 group-hover:scale-110 transition-transform">🛒</span>
                        <span className={`text-[11px] font-black uppercase tracking-widest relative z-10 ${role === 'retailer' ? 'text-primary' : 'text-slate-400'}`}>{t('retailer')}</span>
                      </button>
                    </div>
                  </div>
                )}

                {view === 'register' && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('full_name')}</label>
                    <div className="relative group">
                      <User className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${fieldErrors.name ? 'text-red-400' : 'text-slate-400 group-focus-within:text-primary'}`} />
                      <input 
                        name="name" placeholder="John Doe" required 
                        className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border outline-none transition-all font-semibold text-slate-800 shadow-sm backdrop-blur-sm ${fieldErrors.name ? 'border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-4 focus:ring-red-100' : 'border-white/60 bg-white/50 focus:bg-white focus:border-primary/40 focus:ring-4 focus:ring-primary/10'}`} 
                        value={formData.name} 
                        onChange={(e) => { handleChange(e); if (fieldErrors.name) setFieldErrors({...fieldErrors, name: null}); }} 
                      />
                    </div>
                    {fieldErrors.name && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-widest pl-2">{fieldErrors.name}</p>}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('email_label')}</label>
                  <div className="relative group">
                    <Mail className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${fieldErrors.email ? 'text-red-400' : 'text-slate-400 group-focus-within:text-primary'}`} />
                    <input 
                      name="email" type="email" placeholder="example@email.com" required
                      className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border outline-none transition-all font-semibold text-slate-800 shadow-sm backdrop-blur-sm ${fieldErrors.email ? 'border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-4 focus:ring-red-100' : 'border-white/60 bg-white/50 focus:bg-white focus:border-primary/40 focus:ring-4 focus:ring-primary/10'}`}
                      value={formData.email} 
                      onChange={(e) => { handleChange(e); if (fieldErrors.email) setFieldErrors({...fieldErrors, email: null}); }}
                    />
                  </div>
                  {fieldErrors.email && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-widest pl-2">{fieldErrors.email}</p>}
                </div>

                {view === 'register' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('phone_number')}</label>
                      <div className="relative group">
                        <Phone className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${fieldErrors.phone ? 'text-red-400' : 'text-slate-400 group-focus-within:text-primary'}`} />
                        <input 
                          name="phone" placeholder="9876543210" required 
                          className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border outline-none transition-all font-semibold text-slate-800 shadow-sm backdrop-blur-sm ${fieldErrors.phone ? 'border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-4 focus:ring-red-100' : 'border-white/60 bg-white/50 focus:bg-white focus:border-primary/40 focus:ring-4 focus:ring-primary/10'}`} 
                          value={formData.phone} 
                          onChange={(e) => { handleChange(e); if (fieldErrors.phone) setFieldErrors({...fieldErrors, phone: null}); }} 
                        />
                      </div>
                      {fieldErrors.phone && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-widest pl-2">{fieldErrors.phone}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('location')}</label>
                      <div className="relative group">
                        <MapPin className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${fieldErrors.location ? 'text-red-400' : 'text-slate-400 group-focus-within:text-primary'}`} />
                        <input 
                          name="location" placeholder="Karnataka, India" required 
                          className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border outline-none transition-all font-semibold text-slate-800 shadow-sm backdrop-blur-sm ${fieldErrors.location ? 'border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-4 focus:ring-red-100' : 'border-white/60 bg-white/50 focus:bg-white focus:border-primary/40 focus:ring-4 focus:ring-primary/10'}`} 
                          value={formData.location} 
                          onChange={(e) => { handleChange(e); if (fieldErrors.location) setFieldErrors({...fieldErrors, location: null}); }} 
                        />
                      </div>
                      {fieldErrors.location && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-widest pl-2">{fieldErrors.location}</p>}
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">{t('password_label')}</label>
                    {view === 'login' && (
                      <button type="button" className="text-[10px] text-primary font-black uppercase tracking-widest hover:text-primary-dark transition-colors" onClick={(e) => { e.preventDefault(); setView('forgot'); clearMessages(); }}>{t('forgot_password')}</button>
                    )}
                  </div>
                  <div className="relative group">
                    <Lock className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${fieldErrors.password ? 'text-red-400' : 'text-slate-400 group-focus-within:text-primary'}`} />
                    <input 
                      name="password" type="password" placeholder="••••••••" required minLength="6"
                      className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border outline-none transition-all font-semibold text-slate-800 shadow-sm backdrop-blur-sm ${fieldErrors.password ? 'border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-4 focus:ring-red-100' : 'border-white/60 bg-white/50 focus:bg-white focus:border-primary/40 focus:ring-4 focus:ring-primary/10'}`}
                      value={formData.password} 
                      onChange={(e) => { handleChange(e); if (fieldErrors.password) setFieldErrors({...fieldErrors, password: null}); }}
                    />
                  </div>
                  {fieldErrors.password && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-widest pl-2">{fieldErrors.password}</p>}
                </div>

                <div className="pt-2">
                  <button type="submit" disabled={loading} className="group w-full bg-gradient-to-r from-primary to-primary-dark text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-70 text-[13px] shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all active:translate-y-0">
                    {loading ? (t('processing') || 'Processing...') : view === 'login' ? t('login_btn') : t('create_account')} 
                    <ArrowRight className={`w-5 h-5 ${loading ? 'animate-pulse' : 'group-hover:translate-x-1 transition-transform'}`} />
                  </button>
                </div>
                
                <div className="pt-6 mt-2 text-center">
                  <p className="text-[11px] font-bold text-slate-400 flex items-center justify-center gap-1.5 uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    {t('secure_auth_msg') || 'Secured & Encrypted Connection'}
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
