const express = require('express');
const router = express.Router();

// Mock AI Prediction Data
// In a real scenario, this would call a Python/ML service or an OpenAI/Gemini API
const cropPriceData = {
  "Wheat": { current: 25, trend: "up", change: 5, recommendation: "Hold for 2 weeks for 10% higher price." },
  "Rice": { current: 40, trend: "stable", change: 1, recommendation: "Sell now at current market rates." },
  "Tomato": { current: 20, trend: "down", change: 15, recommendation: "Sell immediately before prices drop further." },
  "Onion": { current: 35, trend: "up", change: 12, recommendation: "Wait for 1 month for peak seasonal price." },
  "Potato": { current: 18, trend: "stable", change: 2, recommendation: "Market is saturated, look for bulk buyers." },
  "Sugarcane": { current: 310, trend: "up", change: 3, unit: "ton", recommendation: "Factory demand is high, negotiate better rates." }
};

const { predictCropPrice } = require('../services/aiService');

// GET /api/ai/predict?crop=Wheat
router.get('/predict', async (req, res) => {
  try {
    const { crop } = req.query;
    
    if (!crop) {
      return res.status(400).json({ success: false, error: 'Crop name is required' });
    }

    // Call real Gemini AI
    const prediction = await predictCropPrice(crop);

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
        forecast_chart: prediction.forecast_chart
      }
    });

  } catch (err) {
    console.error('AI Prediction Error:', err.message);
    
    // Fuzzy match or exact match from our mock table as a better fallback
    const cropName = Object.keys(cropPriceData).find(c => c.toLowerCase() === (req.query.crop || '').toLowerCase());
    const data = cropName ? cropPriceData[cropName] : { current: 25, trend: "stable", change: 0, recommendation: "Gemini AI is currently busy. Showing estimated rates." };

    res.json({
      success: true,
      is_live_ai: false,
      crop: req.query.crop || 'Unknown',
      prediction: {
        current_market_price: data.current,
        predicted_price: (data.current * (data.trend === 'up' ? 1.05 : 0.95)).toFixed(2),
        trend: data.trend,
        volatility: (data.change || 5) + "%",
        confidence: "80% (Fallback)",
        recommendation: data.recommendation || "Market is stable. Monitor local Mandi rates.",
        forecast_chart: null
      }
    });
  }
});

function generateMockChartData(data) {
  const points = [];
  let basePrice = data.current - 5;
  for (let i = 0; i < 7; i++) {
    basePrice += Math.random() * 2;
    points.push({ day: i + 1, price: basePrice.toFixed(2) });
  }
  return points;
}

module.exports = router;
