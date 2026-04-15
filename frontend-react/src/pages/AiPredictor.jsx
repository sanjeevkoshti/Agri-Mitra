import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, TrendingUp, TrendingDown, Search, ArrowRight, Lightbulb, 
  Zap, ShieldCheck, Info, Sparkles, ArrowUpRight, ArrowDownRight, 
  Activity, MapPin, ThumbsUp, ThumbsDown, Minus, ShoppingCart,
  PlusCircle, Bell, RotateCcw, ChevronRight, Target, BarChart2
} from 'lucide-react';
import { useI18n } from '../context/I18nContext';

/* ─── SVG Area Chart ──────────────────────────────────────────────── */
const PriceAreaChart = ({ data, trend }) => {
  if (!data || data.length === 0) return null;
  
  const width = 620;
  const height = 260;
  const padX = 50;
  const padY = 45;
  
  const prices = data.map(d => d.price);
  const minPrice = Math.min(...prices) * 0.92;
  const maxPrice = Math.max(...prices) * 1.08;
  const priceRange = maxPrice - minPrice || 1;
  
  const pts = data.map((d, i) => ({
    x: padX + (i * (width - 2 * padX) / (data.length - 1)),
    y: height - padY - ((d.price - minPrice) / priceRange * (height - 2 * padY))
  }));

  const lineColor = trend === 'down' ? '#e53e3e' : '#1a6b4a';
  const pathD = `M ${pts[0].x} ${pts[0].y} ` + pts.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${pts[pts.length-1].x} ${height - padY} L ${pts[0].x} ${height - padY} Z`;

  // Y-axis price ticks
  const yTicks = [0, 1, 2, 3].map(i => {
    const ratio = i / 3;
    const price = maxPrice - ratio * priceRange;
    const y = padY + ratio * (height - 2 * padY);
    return { price: price.toFixed(0), y };
  });

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200 p-2 relative shadow-sm overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        
        {/* Y-axis price labels */}
        {yTicks.map((t, i) => (
          <text key={i} x={padX - 8} y={t.y + 3} textAnchor="end" fontSize="9" fill="#94a3b8" fontWeight="600">
            ₹{t.price}
          </text>
        ))}

        {/* Horizontal grid lines */}
        {yTicks.map((t, i) => (
          <line key={i} x1={padX} y1={t.y} x2={width - padX * 0.5} y2={t.y} stroke="#f1f5f9" strokeWidth="1"/>
        ))}

        {/* Vertical dashed drop lines */}
        {pts.map((p, i) => (
          <line key={`v-${i}`} x1={p.x} y1={p.y} x2={p.x} y2={height - padY}
            stroke={lineColor} strokeWidth="1" strokeOpacity="0.1" strokeDasharray="3 3"/>
        ))}

        {/* Area fill */}
        <path d={areaD} fill="url(#areaGrad)" />
        
        {/* Line */}
        <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" />

        {/* Points + labels */}
        {pts.map((p, i) => (
          <g key={i}>
            {/* Solid dot */}
            <circle cx={p.x} cy={p.y} r="4" fill={lineColor} stroke="white" strokeWidth="2"/>
            {/* Price label above */}
            <text x={p.x} y={p.y - 12} textAnchor="middle" fontSize="10" fontWeight="800" fill="#1e293b">
              ₹{data[i].price}
            </text>
            {/* Day label below */}
            <text x={p.x} y={height - padY + 18} textAnchor="middle" fontSize="9" fontWeight="600"
              fill="#64748b" letterSpacing="0.02em">
              {i === 0 ? 'TODAY' : `Day ${data[i].day}`}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

/* ─── Impact Icon ─────────────────────────────────────────────────── */
const ImpactIcon = ({ impact }) => {
  if (impact === 'positive') return <ThumbsUp className="w-3.5 h-3.5 text-emerald-400"/>;
  if (impact === 'negative') return <ThumbsDown className="w-3.5 h-3.5 text-rose-400"/>;
  return <Minus className="w-3.5 h-3.5 text-amber-400"/>;
};

/* ─── Main Component ──────────────────────────────────────────────── */
const AiPredictor = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [crop, setCrop] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState(false);
  const [trending, setTrending] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  
  const profile = JSON.parse(localStorage.getItem('mc_profile') || '{}');
  const isFarmer = (profile.role || 'farmer') === 'farmer';

  const commonCrops = [
    "Arecanut", "Bajra", "Bengal Gram", "Chana", "Chilli",
    "Coconut", "Coffee", "Cotton", "Groundnut", "Jowar",
    "Maize", "Moong Dal", "Mustard", "Onion", "Paddy",
    "Potato", "Ragi", "Rice", "Soybean", "Sugarcane",
    "Sunflower", "Tomato", "Toor Dal", "Turmeric", "Wheat"
  ];

  useEffect(() => {
    const fetchTrending = async () => {
      setTrendingLoading(true);
      const res = await api.getTrending();
      if (res.success) setTrending(res.trending);
      setTrendingLoading(false);
    };
    fetchTrending();
  }, []);

  // MUST be defined before filteredCrops uses it
  const getTranslatedCrop = (name) => {
    const key = `data.${name}`;
    const translated = t(key);
    // If i18n returns the key back unchanged, fallback to the English name
    return (translated && translated !== key) ? translated : name;
  };

  // Filter by English name OR translated name so user can type in any language
  const filteredCrops = commonCrops.filter(c => {
    const query = crop.toLowerCase();
    if (!query) return true;
    return (
      c.toLowerCase().includes(query) ||
      getTranslatedCrop(c).toLowerCase().includes(query)
    );
  });

  const handlePredict = async (e, selectedCrop = null) => {
    if (e) e.preventDefault();
    const targetCrop = selectedCrop || crop;
    if (!targetCrop || targetCrop.trim() === '') { setError(true); return; }
    setError(false);
    setLoading(true);
    setCrop(targetCrop);
    setPrediction(null);
    const res = await api.getPrediction(targetCrop, profile.role || 'farmer');
    setLoading(false);
    if (res.success) setPrediction({ ...res.prediction, cropName: targetCrop, is_live_ai: res.is_live_ai });
  };

  const impactColor = (impact) => {
    if (impact === 'positive') return 'text-success bg-success/5 border-success/10';
    if (impact === 'negative') return 'text-danger bg-danger/5 border-danger/10';
    return 'text-warning bg-warning/5 border-warning/10';
  };

  return (
    <div className="min-h-screen text-text pb-24">
      
      {/* ── Hero Header ─────────────────────────────────────────────── */}
      <div className="relative pt-16 pb-28 px-4 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-primary/5 blur-[120px] rounded-full -z-10" />
        <div className="hero-blob w-96 h-96 bg-primary/10 top-20 -left-20" />
        <div className="hero-blob w-80 h-80 bg-accent/5 bottom-0 -right-20" />
        
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary mb-6 animate-in fade-in slide-in-from-top-4 duration-700">
            <Sparkles className="w-3.5 h-3.5 fill-primary/20" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('ai_powered_insights') || 'AI-Powered Insights'}</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-heading font-black mb-6 text-gradient leading-tight">
            {t('predictor_title')}
          </h1>
          <p className="text-lg text-text-muted max-w-2xl mx-auto mb-10 font-medium">
            {t('predictor_subtitle')}
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative z-30">
            <form onSubmit={handlePredict} noValidate className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-primary-light/30 rounded-full blur opacity-50 group-focus-within:opacity-100 transition duration-500" />
              <div className="relative flex items-center bg-white border border-slate-200 rounded-full shadow-premium overflow-hidden p-1.5 focus-within:border-primary transition-all">
                <Search className={`w-6 h-6 ml-6 flex-shrink-0 ${error ? 'text-danger' : 'text-slate-400'}`} />
                <input 
                  className="flex-grow bg-transparent px-4 py-4 outline-none font-bold text-text placeholder:text-slate-400"
                  placeholder={t('select_crop_placeholder')}
                  value={crop}
                  onChange={(e) => { setCrop(e.target.value); setShowDropdown(true); if (error) setError(false); }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                />
                <button type="submit" disabled={loading}
                  className="btn btn-primary h-12 px-8 rounded-full flex items-center gap-2">
                  {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><Zap className="w-4 h-4 fill-white" />{t('generate_pred_btn') || 'Analyze'}</>}
                </button>
              </div>
              {showDropdown && filteredCrops.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-2 max-h-56 overflow-y-auto">
                    {filteredCrops.map(c => (
                      <div key={c} className="px-5 py-3 hover:bg-primary/5 rounded-xl cursor-pointer font-bold transition-colors text-slate-500 hover:text-primary-dark flex items-center justify-between group"
                        onMouseDown={(e) => { e.preventDefault(); handlePredict(null, c); setShowDropdown(false); }}>
                        {getTranslatedCrop(c)}
                        <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all text-primary" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-12 relative z-20 space-y-10">

        {/* ── Loading Skeleton ──────────────────────────────────────── */}
        {loading && (
          <div className="animate-in fade-in duration-300">
            <div className="h-2 w-48 bg-slate-200 rounded-full mb-10 mx-auto animate-pulse" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-72 rounded-[40px] bg-white border border-slate-100 animate-pulse" />
                <div className="h-40 rounded-[40px] bg-white border border-slate-100 animate-pulse" />
              </div>
              <div className="space-y-4">
                <div className="h-56 rounded-[40px] bg-white border border-slate-100 animate-pulse" />
                <div className="h-48 rounded-[40px] bg-white border border-slate-100 animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {/* ── Trending Section ──────────────────────────────────────── */}
        {!prediction && !loading && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-text-muted mb-8 flex items-center gap-4">
              <span className="w-12 h-[1.5px] bg-primary/20" />
              {t('trending_market_insights') || 'Trending Market Insights'}
              <span className="w-12 h-[1.5px] bg-primary/20" />
            </h2>

            {trendingLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1,2,3,4].map(i => <div key={i} className="h-44 rounded-3xl bg-white border border-slate-100 animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {trending.map((item, idx) => (
                  <div key={idx} onClick={() => handlePredict(null, item.name)}
                    className="card p-6 border-slate-200/60 hover:border-primary/40 cursor-pointer group">
                    <div className="flex justify-between items-start mb-4">
                      <span className="font-heading font-black text-xl text-primary-dark">{getTranslatedCrop(item.name)}</span>
                      <div className={`p-2 rounded-xl ${item.trend === 'up' ? 'bg-success/10 text-success' : item.trend === 'down' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>
                        {item.trend === 'up' ? <ArrowUpRight className="w-4 h-4"/> : item.trend === 'down' ? <ArrowDownRight className="w-4 h-4"/> : <Minus className="w-4 h-4"/>}
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-2xl font-black text-text">₹{item.current}</span>
                      <span className={`text-[11px] font-bold ${item.trend === 'up' ? 'text-success' : 'text-danger'}`}>
                        {item.trend === 'up' ? '+' : item.trend === 'down' ? '-' : ''}{item.change}%
                      </span>
                    </div>
                    <div className="text-[10px] text-text-muted font-bold mb-4">Confidence: {item.confidence}</div>
                    <div className="flex items-center gap-2 pt-4 border-t border-slate-100 text-[10px] font-black uppercase tracking-widest text-text-muted group-hover:text-primary transition-colors">
                      {item.recommended} <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Prediction Dashboard ──────────────────────────────────── */}
        {prediction && !loading && (
          <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000 space-y-8 pb-12">
            
            {/* Back + Crop Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button onClick={() => { setPrediction(null); setCrop(''); }}
                  className="flex items-center gap-2 text-text-muted hover:text-primary text-sm font-bold transition-colors">
                  <RotateCcw className="w-4 h-4" /> New Search
                </button>
                <span className="text-slate-200">|</span>
                <h2 className="text-2xl font-heading font-black flex items-center gap-3 text-primary-dark">
                  {getTranslatedCrop(prediction.cropName)}
                  {prediction.is_live_ai ? (
                    <div className="flex items-center gap-2 bg-success/10 text-success text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-success/10">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                      </span>
                      LIVE AI
                    </div>
                  ) : (
                    <div className="bg-warning/10 text-warning text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-warning/10">ESTIMATED</div>
                  )}
                </h2>
              </div>
              <p className="text-xs text-text-muted font-bold uppercase tracking-widest">{t('market_analysis_for_week')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* ── Left Column ──────────────────────────────────────── */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Price Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="card p-6 border-slate-100">
                    <span className="text-[9px] font-black uppercase text-text-muted tracking-[0.2em] block mb-3">{t('current_avg_price')}</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-text">₹{prediction.current_market_price}</span>
                      <span className="text-xs text-text-muted font-bold">/kg</span>
                    </div>
                  </div>
                  <div className="card p-6 border-primary/20 bg-primary/[0.02]">
                    <span className="text-[9px] font-black uppercase text-primary tracking-[0.2em] block mb-3">{t('predicted_target')}</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-primary">₹{prediction.predicted_price}</span>
                      <span className="text-xs text-primary/60 font-bold">/kg</span>
                    </div>
                  </div>
                  <div className={`card p-6 border-slate-100 ${prediction.trend === 'up' ? 'border-success/20 bg-success/[0.02]' : prediction.trend === 'down' ? 'border-danger/20 bg-danger/[0.02]' : 'border-warning/20 bg-warning/[0.02]'}`}>
                    <span className="text-[9px] font-black uppercase text-text-muted tracking-[0.2em] block mb-3">{t('trend_strength')}</span>
                    <div className="flex items-center gap-3">
                      {prediction.trend === 'up' ? <TrendingUp className="text-success w-7 h-7"/> : prediction.trend === 'down' ? <TrendingDown className="text-danger w-7 h-7"/> : <Activity className="text-warning w-7 h-7"/>}
                      <div>
                        <div className={`text-xl font-black ${prediction.trend === 'up' ? 'text-success' : prediction.trend === 'down' ? 'text-danger' : 'text-warning'}`}>{prediction.confidence}</div>
                        <div className="text-[9px] font-black uppercase text-text-muted">{t('confidence_score')}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chart */}
                <PriceAreaChart data={prediction.forecast_chart} trend={prediction.trend} />

                {/* Market Factors / Drivers */}
                {prediction.market_factors && prediction.market_factors.length > 0 && (
                  <div className="card p-8 border-slate-100">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-muted mb-8 flex items-center gap-2">
                       Why This Prediction?
                    </h3>
                    <div className="space-y-4">
                      {prediction.market_factors.map((f, i) => (
                        <div key={i} className={`flex items-start gap-5 p-5 rounded-2xl border ${impactColor(f.impact)}`}>
                          <div className="mt-0.5 flex-shrink-0"><ImpactIcon impact={f.impact}/></div>
                          <div>
                            <div className="font-black text-sm text-primary-dark mb-1">{f.label}</div>
                            <div className="text-xs text-text-muted leading-relaxed font-medium">{f.detail}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nearby Mandi Comparison */}
                {prediction.mandi_comparison && prediction.mandi_comparison.length > 0 && (
                  <div className="card p-8 border-slate-100">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-muted mb-8 flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> Nearby Mandi Prices
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {prediction.mandi_comparison.map((m, i) => {
                        const diff = m.price - prediction.current_market_price;
                        const better = diff > 0;
                        return (
                          <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary/20 transition-all group">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <MapPin className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <div className="font-black text-sm text-primary-dark">{m.city}</div>
                                <div className="text-[10px] text-text-muted font-bold">{m.distance} away</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-black text-lg text-text">₹{m.price}</div>
                              <div className={`text-[10px] font-black ${better ? 'text-success' : 'text-danger'}`}>
                                {better ? `+₹${diff.toFixed(1)} better` : `₹${Math.abs(diff).toFixed(1)} lower`}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Right Sidebar ─────────────────────────────────────── */}
              <div className="space-y-8">
                
                {/* AI Recommendation Card */}
                <div className="bg-primary rounded-[40px] p-8 relative overflow-hidden group shadow-premium hover:shadow-hover transition-all duration-500">
                  <Sparkles className="w-32 h-32 absolute -right-8 -bottom-8 opacity-10 rotate-12 group-hover:rotate-45 transition-transform duration-1000" />
                  <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                    <Lightbulb className="text-white fill-white" />
                  </div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-4">{t('ai_recommendation')}</h3>
                  <p className="text-lg font-bold leading-relaxed text-white">{prediction.recommendation}</p>
                </div>

                {/* Take Action Card */}
                <div className="glass-card !p-8 shadow-premium">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-8 flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" /> Take Action Now
                  </h3>
                  <div className="space-y-4">
                    {isFarmer ? (
                      <>
                        <button onClick={() => navigate('/add-crop')}
                          className="w-full flex items-center justify-between gap-3 p-5 rounded-2xl bg-primary/5 hover:bg-primary/10 border border-primary/10 text-primary font-black text-sm transition-all group">
                          <div className="flex items-center gap-3">
                            <PlusCircle className="w-5 h-5 flex-shrink-0" />
                            <span>List This Crop</span>
                          </div>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button onClick={() => navigate('/marketplace')}
                          className="w-full flex items-center justify-between gap-3 p-5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-100 text-text font-black text-sm transition-all group">
                          <div className="flex items-center gap-3">
                            <ShoppingCart className="w-5 h-5 flex-shrink-0 text-text-muted" />
                            <span>View Marketplace</span>
                          </div>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-text-muted" />
                        </button>
                      </>
                    ) : (
                      <button onClick={() => navigate('/marketplace')}
                        className="w-full flex items-center justify-between gap-3 p-5 rounded-2xl bg-primary/5 hover:bg-primary/10 border border-primary/10 text-primary font-black text-sm transition-all group">
                        <div className="flex items-center gap-3">
                          <ShoppingCart className="w-5 h-5 flex-shrink-0" />
                          <span>Buy From Marketplace</span>
                        </div>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    )}
                    <button className="w-full flex items-center justify-between gap-3 p-5 rounded-2xl bg-slate-50/50 text-slate-400 font-black text-sm transition-all grayscale cursor-not-allowed">
                      <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 flex-shrink-0" />
                        <span>Price Alert</span>
                      </div>
                      <span className="text-[9px] bg-slate-100 border border-slate-200 px-2 py-1 rounded-full uppercase tracking-widest">Soon</span>
                    </button>
                  </div>
                </div>

                {/* Data Metrics */}
                <div className="card !p-8 border-slate-100">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-8 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary" /> {t('data_metrics')}
                  </h3>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center">
                          <Activity className="w-4 h-4 text-text-muted" />
                        </div>
                        <span className="text-sm font-bold text-text-muted">{t('volatility')}</span>
                      </div>
                      <span className="font-black text-warning">{prediction.volatility || 'Low'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center">
                          <Info className="w-4 h-4 text-text-muted" />
                        </div>
                        <span className="text-sm font-bold text-text-muted">{t('data_source')}</span>
                      </div>
                      <span className="font-black text-success">AGMARKNET</span>
                    </div>
                  </div>
                  <div className="mt-8 p-5 rounded-2xl bg-slate-50 border border-slate-100 text-[10px] text-text-muted leading-relaxed font-bold italic">
                    {t('ai_note')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


export default AiPredictor;
