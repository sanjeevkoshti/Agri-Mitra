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

  const lineColor = trend === 'down' ? '#f43f5e' : '#10b981';
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
    <div className="w-full bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-3 relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.35" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        
        {/* Y-axis price labels */}
        {yTicks.map((t, i) => (
          <text key={i} x={padX - 6} y={t.y + 4} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.35)" fontWeight="bold">
            ₹{t.price}
          </text>
        ))}

        {/* Horizontal grid lines */}
        {yTicks.map((t, i) => (
          <line key={i} x1={padX} y1={t.y} x2={width - padX * 0.5} y2={t.y} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
        ))}

        {/* Vertical dashed drop lines */}
        {pts.map((p, i) => (
          <line key={`v-${i}`} x1={p.x} y1={p.y} x2={p.x} y2={height - padY}
            stroke={lineColor} strokeWidth="1" strokeOpacity="0.2" strokeDasharray="4 4"/>
        ))}

        {/* Area fill */}
        <path d={areaD} fill="url(#areaGrad)" />
        
        {/* Line */}
        <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />

        {/* Points + labels */}
        {pts.map((p, i) => (
          <g key={i}>
            {/* Glow circle */}
            <circle cx={p.x} cy={p.y} r="7" fill={lineColor} fillOpacity="0.15"/>
            {/* Solid dot */}
            <circle cx={p.x} cy={p.y} r="4" fill={lineColor} stroke="#0a0c10" strokeWidth="1.5"/>
            {/* Price label above */}
            <text x={p.x} y={p.y - 13} textAnchor="middle" fontSize="9.5" fontWeight="900" fill="white">
              ₹{data[i].price}
            </text>
            {/* Day label below */}
            <text x={p.x} y={height - padY + 18} textAnchor="middle" fontSize="8.5" fontWeight="700"
              fill="rgba(255,255,255,0.5)" letterSpacing="0.05em">
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
    if (impact === 'positive') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (impact === 'negative') return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white pb-24">
      
      {/* ── Hero Header ─────────────────────────────────────────────── */}
      <div className="relative pt-16 pb-28 px-4 bg-gradient-to-b from-primary/10 via-transparent to-transparent">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-primary mb-6 animate-in fade-in slide-in-from-top-4 duration-700">
            <Sparkles className="w-4 h-4 fill-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('ai_powered_insights') || 'AI-Powered Insights'}</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-heading font-black mb-4 bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent leading-tight">
            {t('predictor_title')}
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 font-medium">
            {t('predictor_subtitle')}
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative z-30">
            <form onSubmit={handlePredict} noValidate className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-emerald-400 rounded-full blur opacity-25 group-focus-within:opacity-60 transition duration-500" />
              <div className="relative flex items-center bg-[#1a1c23] border border-white/10 rounded-full overflow-hidden p-1">
                <Search className={`w-6 h-6 ml-6 flex-shrink-0 ${error ? 'text-red-500' : 'text-gray-500'}`} />
                <input 
                  className="flex-grow bg-transparent px-4 py-4 outline-none font-bold text-white placeholder:text-gray-600"
                  placeholder={t('select_crop_placeholder')}
                  value={crop}
                  onChange={(e) => { setCrop(e.target.value); setShowDropdown(true); if (error) setError(false); }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                />
                <button type="submit" disabled={loading}
                  className="bg-primary hover:bg-emerald-600 text-white h-12 px-8 rounded-full font-black text-sm flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 flex-shrink-0">
                  {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><Zap className="w-4 h-4 fill-white" />{t('generate_pred_btn') || 'Analyze'}</>}
                </button>
              </div>
              {showDropdown && filteredCrops.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-[#1a1c23]/98 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-2 max-h-56 overflow-y-auto">
                    {filteredCrops.map(c => (
                      <div key={c} className="px-5 py-3 hover:bg-white/5 rounded-xl cursor-pointer font-bold transition-colors text-gray-400 hover:text-white flex items-center justify-between group"
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
            <div className="h-2 w-48 bg-white/5 rounded-full mb-10 mx-auto animate-pulse" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-72 rounded-[40px] bg-white/5 animate-pulse" />
                <div className="h-40 rounded-[40px] bg-white/5 animate-pulse" />
              </div>
              <div className="space-y-4">
                <div className="h-56 rounded-[40px] bg-white/5 animate-pulse" />
                <div className="h-48 rounded-[40px] bg-white/5 animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {/* ── Trending Section ──────────────────────────────────────── */}
        {!prediction && !loading && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-500 mb-6 flex items-center gap-3">
              <span className="w-8 h-[1px] bg-gray-800" />
              {t('trending_market_insights') || 'Trending Market Insights'}
              <span className="w-8 h-[1px] bg-gray-800" />
            </h2>

            {trendingLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1,2,3,4].map(i => <div key={i} className="h-44 rounded-3xl bg-white/5 animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {trending.map((item, idx) => (
                  <div key={idx} onClick={() => handlePredict(null, item.name)}
                    className="group bg-white/5 backdrop-blur-md border border-white/5 p-6 rounded-3xl hover:border-primary/30 transition-all cursor-pointer hover:bg-white/[0.08] hover:-translate-y-1 duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <span className="font-heading font-black text-xl">{getTranslatedCrop(item.name)}</span>
                      <div className={`p-2 rounded-xl ${item.trend === 'up' ? 'bg-emerald-500/10 text-emerald-500' : item.trend === 'down' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
                        {item.trend === 'up' ? <ArrowUpRight className="w-4 h-4"/> : item.trend === 'down' ? <ArrowDownRight className="w-4 h-4"/> : <Minus className="w-4 h-4"/>}
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-2xl font-black">₹{item.current}</span>
                      <span className={`text-[11px] font-bold ${item.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {item.trend === 'up' ? '+' : item.trend === 'down' ? '-' : ''}{item.change}%
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-600 font-bold mb-4">Confidence: {item.confidence}</div>
                    <div className="flex items-center gap-2 pt-4 border-t border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-primary transition-colors">
                      {item.recommended} <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Prediction Dashboard ──────────────────────────────────── */}
        {prediction && !loading && (
          <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000 space-y-8">
            
            {/* Back + Crop Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button onClick={() => { setPrediction(null); setCrop(''); }}
                  className="flex items-center gap-2 text-gray-500 hover:text-white text-sm font-bold transition-colors">
                  <RotateCcw className="w-4 h-4" /> New Search
                </button>
                <span className="text-gray-700">|</span>
                <h2 className="text-2xl font-heading font-black flex items-center gap-3">
                  {getTranslatedCrop(prediction.cropName)}
                  {prediction.is_live_ai ? (
                    <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-500/20">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      LIVE AI
                    </div>
                  ) : (
                    <div className="bg-amber-500/20 text-amber-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-amber-500/20">ESTIMATED</div>
                  )}
                </h2>
              </div>
              <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">{t('market_analysis_for_week')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* ── Left Column ──────────────────────────────────────── */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Price Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-6 rounded-[28px] bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-colors">
                    <span className="text-[9px] font-black uppercase text-gray-500 tracking-[0.2em] block mb-3">{t('current_avg_price')}</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black">₹{prediction.current_market_price}</span>
                      <span className="text-xs text-gray-600 font-bold">/kg</span>
                    </div>
                  </div>
                  <div className="p-6 rounded-[28px] bg-primary/10 border border-primary/20">
                    <span className="text-[9px] font-black uppercase text-primary/60 tracking-[0.2em] block mb-3">{t('predicted_target')}</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-primary">₹{prediction.predicted_price}</span>
                      <span className="text-xs text-primary/60 font-bold">/kg</span>
                    </div>
                  </div>
                  <div className={`p-6 rounded-[28px] border ${prediction.trend === 'up' ? 'bg-emerald-500/10 border-emerald-500/20' : prediction.trend === 'down' ? 'bg-rose-500/10 border-rose-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                    <span className="text-[9px] font-black uppercase text-gray-500 tracking-[0.2em] block mb-3">{t('trend_strength')}</span>
                    <div className="flex items-center gap-2">
                      {prediction.trend === 'up' ? <TrendingUp className="text-emerald-500 w-7 h-7"/> : prediction.trend === 'down' ? <TrendingDown className="text-rose-500 w-7 h-7"/> : <Activity className="text-amber-500 w-7 h-7"/>}
                      <div>
                        <div className={`text-lg font-black ${prediction.trend === 'up' ? 'text-emerald-500' : prediction.trend === 'down' ? 'text-rose-500' : 'text-amber-500'}`}>{prediction.confidence}</div>
                        <div className="text-[9px] font-black uppercase text-gray-600">{t('confidence_score')}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chart */}
                <PriceAreaChart data={prediction.forecast_chart} trend={prediction.trend} />

                {/* Market Factors / Drivers */}
                {prediction.market_factors && prediction.market_factors.length > 0 && (
                  <div className="bg-white/5 backdrop-blur-xl rounded-[32px] border border-white/10 p-7">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-6 flex items-center gap-2">
                      <BarChart2 className="w-4 h-4" /> Why This Prediction?
                    </h3>
                    <div className="space-y-4">
                      {prediction.market_factors.map((f, i) => (
                        <div key={i} className={`flex items-start gap-4 p-4 rounded-2xl border ${impactColor(f.impact)}`}>
                          <div className="mt-0.5 flex-shrink-0"><ImpactIcon impact={f.impact}/></div>
                          <div>
                            <div className="font-black text-sm text-white mb-1">{f.label}</div>
                            <div className="text-xs text-gray-400 leading-relaxed">{f.detail}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nearby Mandi Comparison */}
                {prediction.mandi_comparison && prediction.mandi_comparison.length > 0 && (
                  <div className="bg-white/5 backdrop-blur-xl rounded-[32px] border border-white/10 p-7">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-6 flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> Nearby Mandi Prices
                    </h3>
                    <div className="space-y-3">
                      {prediction.mandi_comparison.map((m, i) => {
                        const diff = m.price - prediction.current_market_price;
                        const better = diff > 0;
                        return (
                          <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/[0.08] transition-colors border border-white/5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <MapPin className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <div className="font-black text-sm">{m.city}</div>
                                <div className="text-[10px] text-gray-600 font-bold">{m.distance} away</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-black text-lg">₹{m.price}</div>
                              <div className={`text-[10px] font-black ${better ? 'text-emerald-400' : 'text-rose-400'}`}>
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
              <div className="space-y-6">
                
                {/* AI Recommendation Card */}
                <div className="bg-primary rounded-[40px] p-8 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500">
                  <Sparkles className="w-32 h-32 absolute -right-8 -bottom-8 opacity-20 rotate-12 group-hover:rotate-45 transition-transform duration-1000" />
                  <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                    <Lightbulb className="text-white fill-white" />
                  </div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-4">{t('ai_recommendation')}</h3>
                  <p className="text-lg font-bold leading-relaxed text-white">{prediction.recommendation}</p>
                </div>

                {/* Action Dashboard */}
                <div className="bg-white/5 backdrop-blur-xl rounded-[40px] border border-white/10 p-8">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-6 flex items-center gap-2">
                    <Target className="w-4 h-4" /> Take Action Now
                  </h3>
                  <div className="space-y-3">
                    {isFarmer ? (
                      <>
                        <button onClick={() => navigate('/add-crop')}
                          className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary font-black text-sm transition-all group">
                          <div className="flex items-center gap-3">
                            <PlusCircle className="w-5 h-5 flex-shrink-0" />
                            <span>List This Crop</span>
                          </div>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button onClick={() => navigate('/marketplace')}
                          className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black text-sm transition-all group">
                          <div className="flex items-center gap-3">
                            <ShoppingCart className="w-5 h-5 flex-shrink-0 text-gray-400" />
                            <span>View Marketplace</span>
                          </div>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-gray-500" />
                        </button>
                      </>
                    ) : (
                      <button onClick={() => navigate('/marketplace')}
                        className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary font-black text-sm transition-all group">
                        <div className="flex items-center gap-3">
                          <ShoppingCart className="w-5 h-5 flex-shrink-0" />
                          <span>Buy From Marketplace</span>
                        </div>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    )}
                    <button className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-gray-500 font-black text-sm transition-all group cursor-not-allowed">
                      <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 flex-shrink-0" />
                        <span>Price Alert (Soon)</span>
                      </div>
                      <span className="text-[9px] bg-white/5 border border-white/10 px-2 py-1 rounded-full uppercase tracking-widest">Beta</span>
                    </button>
                  </div>
                </div>

                {/* Data Metrics Card */}
                <div className="bg-white/5 backdrop-blur-xl rounded-[40px] border border-white/10 p-8">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-6 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> {t('data_metrics')}
                  </h3>
                  <div className="space-y-5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                          <Activity className="w-4 h-4 text-gray-400" />
                        </div>
                        <span className="text-sm font-bold text-gray-400">{t('volatility')}</span>
                      </div>
                      <span className="font-black text-amber-500">{prediction.volatility || 'Low'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                          <Info className="w-4 h-4 text-gray-400" />
                        </div>
                        <span className="text-sm font-bold text-gray-400">{t('data_source')}</span>
                      </div>
                      <span className="font-black text-emerald-500">AGMARKNET</span>
                    </div>
                  </div>
                  <div className="mt-8 p-5 rounded-2xl bg-white/5 border border-white/5 text-[10px] text-gray-500 leading-relaxed font-bold italic">
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
