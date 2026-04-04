import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Globe, LogIn } from 'lucide-react';
import { useI18n } from '../context/I18nContext';

const Navbar = () => {
  const { lang, setLanguage, t } = useI18n();
  const location = useLocation();
  const profile = JSON.parse(localStorage.getItem('mc_profile') || 'null');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('mc_profile');
    window.location.href = '/login';
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <nav className="navbar bg-primary-dark text-white py-3 sticky top-0 z-50 shadow-hard">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="navbar-brand text-xl font-heading font-extrabold flex items-center gap-2">
          🌾 Mandi<span className="text-accent">Connect</span>
        </Link>
        <div className="navbar-links flex items-center gap-4">
          <div className="relative group">
            <select 
              value={lang} 
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-white/10 text-white border border-white/30 rounded px-2 py-1 text-sm outline-none cursor-pointer focus:border-accent appearance-none pr-8"
            >
              <option value="en" className="text-black">English</option>
              <option value="hi" className="text-black">हिन्दी</option>
              <option value="kn" className="text-black">ಕನ್ನಡ</option>
            </select>
            <Globe className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-70" />
          </div>
          
          {profile ? (
            <div className="flex items-center gap-6">
              {/* Role-based Links */}
              {profile.role === 'farmer' ? (
                <>
                  <Link to="/farmer-dash" className="text-sm font-bold hover:text-accent transition-colors uppercase tracking-wider">{t('dashboard')}</Link>
                  <Link to="/add-crop" className="text-sm font-bold hover:text-accent transition-colors uppercase tracking-wider">{t('add_crop_btn')}</Link>
                  <Link to="/spoilage-rescue" className="text-sm font-bold hover:text-accent transition-colors uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />🆘 Rescue
                  </Link>
                  <Link to="/ai-predictor" className="text-sm font-bold hover:text-accent transition-colors uppercase tracking-wider">{t('ai_predictor')}</Link>
                  <Link to="/orders" className="text-sm font-bold hover:text-accent transition-colors uppercase tracking-wider">{t('orders')}</Link>
                </>
              ) : (
                <>
                  <Link to="/marketplace" className="text-sm font-bold hover:text-accent transition-colors uppercase tracking-wider">{t('marketplace')}</Link>
                  <Link to="/spoilage-rescue" className="text-sm font-bold hover:text-accent transition-colors uppercase tracking-wider">{t('rescue')}</Link>
                  <Link to="/ai-predictor" className="text-sm font-bold hover:text-accent transition-colors uppercase tracking-wider">{t('ai_predictor')}</Link>
                  <Link to="/orders" className="text-sm font-bold hover:text-accent transition-colors uppercase tracking-wider">{t('my_orders') || 'My Orders'}</Link>
                </>
              )}
              
              <div className="relative ml-2" ref={dropdownRef}>
                <button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-10 h-10 rounded-full bg-accent/20 border-2 border-accent text-accent font-black tracking-widest flex items-center justify-center hover:bg-accent hover:text-primary-dark transition-all"
                  title={profile.full_name || profile.name}
                >
                  {getInitials(profile.full_name || profile.name)}
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-large shadow-hard border border-primary/10 overflow-hidden z-[100] animate-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 bg-primary/5 border-b border-primary/10 flex flex-col">
                      <span className="font-bold text-primary-dark truncate text-sm">{profile.full_name || profile.name}</span>
                      <span className="text-[10px] uppercase tracking-widest font-black text-text-muted mt-0.5">{profile.role}</span>
                    </div>
                    <div className="p-2">
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-sm font-bold text-danger hover:bg-danger/10 rounded-md transition-colors"
                      >
                        {t('sign_out') || 'Sign Out'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Link to="/login" className="btn btn-accent btn-sm">
              <LogIn className="w-4 h-4" /> {t('login_register') || 'Login / Register'}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

const Footer = () => {
  const { t } = useI18n();
  return (
    <footer className="bg-[#0a2a1e] text-white/60 text-center py-6 text-sm">
      <div className="container mx-auto">
        <p>{t('footer_text') || '© 2026 Mandi-Connect · Built for rural India 🇮🇳'}</p>
      </div>
    </footer>
  );
};

export { Navbar, Footer };
