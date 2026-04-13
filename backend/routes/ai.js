const express = require('express');
const router = express.Router();

// Mock AI Prediction Data
// In a real scenario, this would call a Python/ML service or an OpenAI/Gemini API
const { predictCropPrice, fetchTrendingInsights } = require('../services/aiService');

// Simple In-Memory Cache
let trendingCache = {
  data: null,
  timestamp: 0,
  TTL: 1000 * 60 * 60 * 4 // 4 Hours
};

// GET /api/ai/trending
router.get('/trending', async (req, res) => {
  try {
    const now = Date.now();
    
    // Return cached data if valid
    if (trendingCache.data && (now - trendingCache.timestamp) < trendingCache.TTL) {
      console.log('[AI] Serving trending insights from cache');
      return res.json({ success: true, trending: trendingCache.data });
    }

    console.log('[AI] Fetching fresh dynamic trending insights...');
    const trending = await fetchTrendingInsights();
    
    // Update cache
    trendingCache = {
      data: trending,
      timestamp: now,
      TTL: trendingCache.TTL
    };

    res.json({ success: true, trending });
  } catch (err) {
    console.error('Trending Route Error:', err);
    res.json({ success: false, error: 'Could not fetch insights' });
  }
});

// GET /api/ai/predict?crop=Wheat
router.get('/predict', async (req, res) => {
  try {
    const { crop, role = 'farmer' } = req.query;
    
    if (!crop) {
      return res.status(400).json({ success: false, error: 'Crop name is required' });
    }

    // Check if we have consistent data for this crop in the CURRENT dynamic trending list
    const trendingMatch = trendingCache.data?.find(c => c.name.toLowerCase() === crop.toLowerCase());
    
    if (trendingMatch) {
      console.log(`[AI] Using consistent cache data for trending crop: ${crop}`);
      return res.json({
        success: true,
        is_live_ai: true,
        crop: trendingMatch.name,
        prediction: {
          current_market_price: trendingMatch.current,
          predicted_price: trendingMatch.predicted,
          trend: trendingMatch.trend,
          volatility: trendingMatch.change > 10 ? "High" : trendingMatch.change > 5 ? "Medium" : "Low",
          confidence: trendingMatch.confidence,
          recommendation: trendingMatch.recommendation_detail || trendingMatch.recommended,
          forecast_chart: generateDynamicChartData(trendingMatch.current, trendingMatch.trend),
          market_factors: trendingMatch.market_factors || [],
          mandi_comparison: trendingMatch.mandi_comparison || []
        }
      });
    }

    // If not in trending list, call real Gemini/Groq AI for deep analysis
    const prediction = await predictCropPrice(crop, role);

    res.json({
      success: true,
      is_live_ai: true,
      crop: crop,
      prediction: {
        current_market_price: prediction.current_market_price,
        predicted_price: prediction.predicted_price,
        trend: prediction.trend,
        volatility: prediction.volatility,
        confidence: prediction.confidence,
        recommendation: prediction.recommendation,
        forecast_chart: prediction.forecast_chart,
        market_factors: prediction.market_factors || [],
        mandi_comparison: prediction.mandi_comparison || []
      }
    });

  } catch (err) {
    console.error('AI Prediction Error:', err.message);
    
    res.json({
      success: true,
      is_live_ai: false,
      crop: req.query.crop || 'Unknown',
      prediction: {
        current_market_price: 25,
        predicted_price: 26,
        trend: "stable",
        volatility: "Low",
        confidence: "70% (Fallback)",
        recommendation: "Market connection issue. Please check local Mandi rates.",
        forecast_chart: generateDynamicChartData(25, "stable")
      }
    });
  }
});

function generateDynamicChartData(base, trend) {
  const points = [];
  const trendMult = trend === 'up' ? 0.8 : trend === 'down' ? -0.8 : 0.2;
  
  for (let i = 0; i < 7; i++) {
    const noise = (Math.random() - 0.5) * (base * 0.05);
    const price = (base + (i * trendMult) + noise).toFixed(2);
    points.push({ day: i + 1, price: parseFloat(price) });
  }
  return points;
}

module.exports = router;


