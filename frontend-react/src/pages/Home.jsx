import React from 'react';
import { Sprout, ShoppingBag, Smartphone, Truck, Bot, ArrowRight, ShieldCheck, Zap, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../context/I18nContext';

const Home = () => {
  const { t } = useI18n();

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20 pb-32">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/hero_bg_farming_1775384457320.png" 
            alt="Sustainable Farming" 
            className="w-full h-full object-cover blur-[1.5px] scale-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary-dark/40 via-transparent to-transparent" />
        </div>

        {/* Animated Blobs */}
        <div className="hero-blob w-[500px] h-[500px] bg-primary top-[-10%] right-[-10%] animate-pulse-slow" />
        <div className="hero-blob w-[400px] h-[400px] bg-accent bottom-[-5%] left-[-5%] animate-float" />

        {/* Hero Content */}
        <div className="container relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
            <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
            {t('nav_smart_farming') || 'Revolutionizing Agriculture'}
          </div>
          
          <h1 className="text-5xl md:text-7xl font-heading font-extrabold mb-6 text-white leading-[1.1] animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
            {t('hero_title')} <br />
            <span className="text-accent underline decoration-accent/30 decoration-8 underline-offset-8">
              {t('hero_subtitle')}
            </span>
          </h1>
          
          <p className="text-xl text-white max-w-2xl mx-auto mb-12 font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
            {t('hero_desc')}
          </p>
          
          <div className="flex flex-wrap justify-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
            <Link to="/login?role=farmer" className="group btn btn-accent px-10 py-4 text-lg shadow-xl shadow-accent/20">
              <Sprout className="w-6 h-6 mr-2 transition-transform group-hover:rotate-12" /> 
              {t('iam_farmer')}
              <ArrowRight className="w-5 h-5 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </Link>
            <Link to="/login?role=retailer" className="group btn btn-outline border-white/30 text-white hover:bg-white hover:text-primary-dark px-10 py-4 text-lg backdrop-blur-sm">
              <ShoppingBag className="w-6 h-6 mr-2 transition-transform group-hover:scale-110" /> 
              {t('iam_retailer')}
            </Link>
          </div>
        </div>

        {/* Wave Transition Divider */}
        <div className="absolute bottom-[-1px] left-0 w-full overflow-hidden leading-[0] transform rotate-180">
          <svg className="relative block w-[calc(100%+1.3px)] h-[80px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#eff6f1"></path>
          </svg>
        </div>
      </section>

      {/* Trust Section */}
      <section className="pt-20 pb-16 bg-[#eff6f1] border-b border-primary/5">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16 px-4">
            <StatCard value="0%" label={t('commission_charged')} icon={<TrendingUp className="w-6 h-6" />} />
            <StatCard value="UPI" label={t('instant_payments')} icon={<Zap className="w-6 h-6" />} />
            <StatCard value="24/7" label="AI Assistance" icon={<Bot className="w-6 h-6" />} />
          </div>

          <p className="text-center text-primary-dark/40 uppercase tracking-[0.2em] font-bold text-xs mb-12">
            Trusted by modern agricultural communities
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
            <div className="text-2xl font-black text-primary-dark/30">AGROTEK</div>
            <div className="text-2xl font-black text-primary-dark/30">FARMHUB</div>
            <div className="text-2xl font-black text-primary-dark/30">AGRI MITRA</div>
            <div className="text-2xl font-black text-primary-dark/30">GREENPAY</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-4 relative overflow-hidden">
        <div className="container">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-heading font-extrabold mb-4 text-gradient">
              {t('features_title')}
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              {t('features_subtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Sprout className="w-8 h-8" />}
              title={t('feat_list_title')}
              desc={t('feat_list_desc')}
              color="bg-green-100 text-green-600"
            />
            <FeatureCard 
              icon={<ShoppingBag className="w-8 h-8" />}
              title={t('feat_browse_title')}
              desc={t('feat_browse_desc')}
              color="bg-orange-100 text-orange-600"
            />
            <FeatureCard 
              icon={<Smartphone className="w-8 h-8" />}
              title={t('feat_upi_title')}
              desc={t('feat_upi_desc')}
              color="bg-blue-100 text-blue-600"
            />
            <FeatureCard 
              icon={<Truck className="w-8 h-8" />}
              title={t('feat_track_title')}
              desc={t('feat_track_desc')}
              color="bg-purple-100 text-purple-600"
            />
            <FeatureCard 
              icon={<Bot className="w-8 h-8" />}
              title={t('feat_ai_title')}
              desc={t('feat_ai_desc')}
              color="bg-indigo-100 text-indigo-600"
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-8 h-8" />}
              title="Secured Trade"
              desc="Built-in verify checks ensuring safety for both parties in every single transaction."
              color="bg-teal-100 text-teal-600"
            />
          </div>
        </div>
      </section>

      {/* Spoilage Rescue Teaser */}
      <section className="py-20">
        <div className="container">
          <div className="glass-card bg-primary-dark/5 border-primary/10 flex flex-col md:flex-row items-center gap-12 p-12">
            <div className="flex-1">
              <span className="text-red-500 font-bold uppercase tracking-wider text-sm flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                Special Feature
              </span>
              <h2 className="text-3xl md:text-4xl font-heading mb-6">Spoilage Rescue</h2>
              <p className="text-slate-600 text-lg mb-8">
                Don't let your yield go to waste. Report crops nearing expiry and connect with retailers willing to purchase at discounted rates. Reduce food waste and recover costs.
              </p>
              <Link to="/spoilage-rescue" className="btn btn-primary">
                Learn More <ArrowRight className="w-5 h-5 ml-1" />
              </Link>
            </div>
            <div className="flex-1 relative">
              <div className="w-64 h-64 bg-accent/20 rounded-full blur-3xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              <img 
                src="https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&q=80&w=800" 
                alt="Fresh produce" 
                className="relative z-10 rounded-3xl shadow-2xl skew-y-3 hover:skew-y-0 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary-dark -z-10" />
        <div className="hero-blob w-[600px] h-[600px] bg-primary-light top-[-20%] left-[-10%] opacity-10" />
        <div className="container text-center text-white">
          <h2 className="text-4xl md:text-5xl font-heading font-extrabold mb-6">
            {t('cta_title')}
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-12">
            Join thousands of farmers and retailers already transforming the agricultural supply chain.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/login" className="btn btn-accent px-12 py-4 text-xl">
              {t('get_started')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

const StatCard = ({ value, label, icon }) => (
  <div className="glass-card !p-6 flex items-center gap-5 hover:translate-y-[-8px]">
    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
      {icon}
    </div>
    <div>
      <div className="text-3xl font-black text-primary-dark leading-tight">{value}</div>
      <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{label}</div>
    </div>
  </div>
);

const FeatureCard = ({ icon, title, desc, color }) => (
  <div className="glass-card group hover:bg-white">
    <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}>
      {icon}
    </div>
    <h3 className="text-2xl font-bold mb-4 text-primary-dark group-hover:text-primary transition-colors">{title}</h3>
    <p className="text-slate-500 leading-relaxed font-medium">{desc}</p>
  </div>
);

export default Home;


