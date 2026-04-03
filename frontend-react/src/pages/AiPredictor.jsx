import React, { useState } from 'react';
import { api } from '../services/api';
import { Bot, TrendingUp, TrendingDown, Search, ArrowRight, Lightbulb, LineChart as ChartIcon } from 'lucide-react';
import { useI18n } from '../context/I18nContext';

const AiPredictor = () => {
  const { t } = useI18n();
  const [crop, setCrop] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const commonCrops = [ 

    "Wheat", "Rice", "Tomato", "Onion", "Potato", "Sugarcane", 
    "Cotton", "Maize", "Soybean", "Mustard", "Chana", "Bajra", 
    "Jowar", "Turmeric", "Moong Dal", "Groundnut", "Chilli",
    "Ragi", "Jowar", "Paddy (Rice)", "Maize", "Sugarcane", "Cotton", 
    "Groundnut", "Toor Dal", "Coffee", "Arecanut", "Coconut", 
    "Turmeric", "Onion", "Tomato", "Chilli", "Sunflower", "Soybean", 
    "Bengal Gram (Chana)"
    
  ];

  const filteredCrops = commonCrops.filter(c => c.toLowerCase().includes(crop.toLowerCase()));

  const handlePredict = async (e) => {
    e.preventDefault();
    if (!crop) return;
    setLoading(true);
    const res = await api.getPrediction(crop);
    setLoading(false);
    if (res.success) setPrediction({ ...res.prediction, is_live_ai: res.is_live_ai });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-12">
        <div className="inline-flex p-4 bg-primary/10 rounded-full mb-4">
          <Bot className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-4xl font-heading font-black text-primary-dark uppercase tracking-tight">{t('predictor_title')}</h1>
        <p className="text-text-muted max-w-lg mx-auto">{t('predictor_subtitle')}</p>
      </div>

      <div className="max-w-2xl mx-auto mb-12">
        <form onSubmit={handlePredict} className="flex gap-4">
          <div className="relative flex-grow">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/60" />
            <input 
              className="w-full pl-12 pr-4 py-4 rounded-full border-2 border-primary/20 focus:border-primary shadow-soft outline-none transition-all font-bold"
              placeholder={t('select_crop_placeholder')}
              value={crop}
              onChange={(e) => {
                setCrop(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            />
            {showDropdown && filteredCrops.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border-2 border-primary/10 shadow-large overflow-hidden z-20 max-h-56 overflow-y-auto">
                {filteredCrops.map(c => (
                  <div
                    key={c}
                    className="px-6 py-3 hover:bg-primary/5 cursor-pointer font-bold text-text-dark border-b border-gray-100 last:border-none"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setCrop(c);
                      setShowDropdown(false);
                    }}
                  >
                    {t(`data.${c}`) !== `data.${c}` ? t(`data.${c}`) : c}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary px-8 rounded-full font-black text-lg">
            {loading ? (t('analyzing_data') || 'Analyzing...') : (t('generate_pred_btn') || 'Predict')}
          </button>
        </form>
      </div>

      {prediction && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
          <div className="card space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-heading font-black flex items-center gap-2 uppercase tracking-wide">
                <TrendingUp className="w-6 h-6 text-primary" /> {t('market_analysis')}
              </h2>
              {prediction.is_live_ai ? (
                <span className="bg-success/20 text-success text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1"><Bot className="w-3 h-3" /> {t('live_ai') || 'Live AI'}</span>
              ) : (
                <span className="bg-accent/20 text-accent-dark text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">{t('simulated') || '⚙️ Simulated'}</span>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-bg rounded-large border border-primary/5">
                <span className="text-[10px] font-black uppercase opacity-60 block mb-1">{t('current_avg_price')}</span>
                <span className="text-2xl font-black text-primary-dark">₹{(Number(prediction.current_market_price) || 0).toFixed(2)}</span>
              </div>
              <div className="p-4 bg-primary/5 rounded-large border border-primary/10">
                <span className="text-[10px] font-black uppercase opacity-60 block mb-1">{t('forecast_next_week')}</span>
                <span className="text-2xl font-black text-primary">₹{(Number(prediction.predicted_price) || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className={`p-4 rounded-large flex items-center gap-4 ${prediction.trend === 'up' ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'}`}>
              {prediction.trend === 'up' ? <TrendingUp className="w-10 h-10" /> : <TrendingDown className="w-10 h-10" />}
              <div>
                <div className="font-black uppercase text-xs tracking-widest">{t('price_trend_7day')}</div>
                <div className="font-bold">
                  {prediction.trend === 'up' ? t('trending_up') : prediction.trend === 'down' ? t('trending_down') : t('stable_trend')}
                  {'. '} {t('confidence_label')} {prediction.confidence}
                </div>
              </div>
            </div>

            <div className="p-6 bg-primary-dark text-white rounded-large relative overflow-hidden">
              <Lightbulb className="w-12 h-12 absolute -right-2 -bottom-2 opacity-10 rotate-12" />
              <h3 className="font-black uppercase text-xs tracking-widest text-accent mb-2">{t('smart_recommendation')}</h3>
              <p className="text-sm font-medium leading-relaxed">{t(`data.${prediction.recommendation}`) || prediction.recommendation}</p>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-heading font-black flex items-center gap-2 uppercase tracking-wide mb-6">
              <ChartIcon className="w-6 h-6 text-primary" /> {t('price_trend_7day')}
            </h2>
            <div className="space-y-4">
              {prediction.forecast_chart ? (
                prediction.forecast_chart.map((point, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="w-12 text-[10px] font-black text-text-muted uppercase">{t('day_label') || 'Day'} {point.day}</span>
                    <div className="flex-grow h-3 bg-bg rounded-full overflow-hidden border border-primary/5">
                      <div 
                        className="h-full bg-primary transition-all duration-1000" 
                        style={{ width: `${(point.price / (prediction.current_market_price * 1.5)) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-black text-primary-dark">₹{point.price}</span>
                  </div>
                ))
              ) : (
                [...Array(7)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="w-12 text-[10px] font-black text-text-muted uppercase">{t('day_label') || 'Day'} {i+1}</span>
                    <div className="flex-grow h-3 bg-bg rounded-full overflow-hidden border border-primary/5">
                      <div 
                        className="h-full bg-primary transition-all duration-1000" 
                        style={{ width: `${60 + (Math.random() * 20)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-black text-primary-dark">₹{((Number(prediction.current_market_price) || 0) * (1 + (Math.random() * 0.1))).toFixed(1)}</span>
                  </div>
                ))
              )}
            </div>
            <p className="text-[10px] text-text-muted mt-8 text-center font-bold italic">{t('ai_note') || 'Note: AI predictions are based on historical trends and current market arrivals. Actual prices may vary.'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiPredictor;
