const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const keyPrefix = process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.substring(0, 7) : "MISSING";
console.log(`[GROQ] Service initialized with API Key: ${keyPrefix}...`);

/**
 * Predict crop prices and trends using Groq (Llama 3).
 * @param {string} crop - Name of the crop to predict.
 */
async function predictCropPrice(crop, role = 'farmer') {
  try {
    const roleInstructions = role === 'retailer' 
      ? `You are advising a RETAILER (Buyer). Focus on Procurement & Demand. Provide actionable advice for a retailer looking to buy.`
      : `You are advising a FARMER (Seller). Focus on Profit Maximization. Provide actionable advice for a farmer looking to sell.`;

    const prompt = `You are an expert agricultural economist specializing in Indian Mandi markets.
    Analyze the crop: "${crop}" and provide a HIGHLY SPECIFIC market report for this exact crop only.
    ${roleInstructions}

    STRICT RULES FOR market_factors:
    - Each factor MUST be SPECIFIC to "${crop}" — not generic agriculture factors.
    - DO NOT use generic labels like "Monsoon Impact", "Government Policy", or "Export Demand" as defaults for every crop.
    - Examples of GOOD crop-specific factors:
        * For Tomato: "Summer Oversupply in Maharashtra", "Cold Chain Shortage in Karnataka", "Festival Demand Spike"
        * For Onion: "Rabi Harvest Arrival", "Bangladesh Export Ban Lifted", "Storage Stock Depletion"
        * For Wheat: "MSP Revision by FCI", "Punjab Harvesting Season Peak", "Global Wheat Shortage"
    - Each detail must be 1 factual sentence explaining the specific impact on ${crop} prices right now.

    Return a strict JSON object:
    {
      "current_market_price": number (INR per kg, realistic for ${crop}),
      "predicted_price": number (INR per kg, next week estimate),
      "trend": "up" | "down" | "stable",
      "volatility": "Low" | "Medium" | "High",
      "confidence": "string like 87%",
      "recommendation": "string — specific, actionable advice for ${crop} only",
      "forecast_chart": [
        {"day": 1, "price": number},
        {"day": 2, "price": number},
        {"day": 3, "price": number},
        {"day": 4, "price": number},
        {"day": 5, "price": number},
        {"day": 6, "price": number},
        {"day": 7, "price": number}
      ],
      "market_factors": [
        {
          "label": "UNIQUE factor label specific to ${crop} (NOT generic)",
          "impact": "positive" | "negative" | "neutral",
          "detail": "One factual sentence about how THIS factor affects ${crop} prices specifically."
        },
        {
          "label": "Second UNIQUE factor for ${crop}",
          "impact": "positive" | "negative" | "neutral",
          "detail": "One factual sentence."
        },
        {
          "label": "Third UNIQUE factor for ${crop}",
          "impact": "positive" | "negative" | "neutral",
          "detail": "One factual sentence."
        }
      ],
      "mandi_comparison": [
        {"city": "Real Indian city name near major ${crop} growing/trading hub", "price": number, "distance": "XX km"},
        {"city": "Second Indian city", "price": number, "distance": "XX km"},
        {"city": "Third Indian city", "price": number, "distance": "XX km"}
      ]
    }
    Return ONLY the JSON object. No extra text.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.4,
      response_format: { type: "json_object" },
    });

    const text = chatCompletion.choices[0].message.content;
    return JSON.parse(text);
  } catch (error) {
    console.error("Groq Prediction Error:", error);
    throw error;
  }
}

/**
 * Chat with Raitha Mithra AI Assistant using Groq (Llama 3).
 * @param {string} message - User's query.
 * @param {string} lang - Language (en, hi, kn).
 */
async function chatAssistant(message, lang, context = null) {
  try {
    const contextStr = context ? `
    STRICT USER CONTEXT (USE THIS DATA TO ANSWER):
    Account Role: ${context.role}
    Active Listings: ${context.active_crops?.join(', ') || 'No active listings'}
    Orders (Total): ${context.orders?.total || 0}
    Orders Breakdown: 
      - Pending: ${context.orders?.pending || 0}
      - Accepted: ${context.orders?.accepted || 0}
      - Paid: ${context.orders?.paid || 0}
      - Delivered: ${context.orders?.delivered || 0}
    Retailer Orders: ${context.my_orders?.join(', ') || 'No purchase history'}
    ` : 'No user-specific data available yet. Greet the user normally.';

    const prompt = `You are "Raitha Mithra", a premier digital farming advisor for Agri Mitra.
    LANGUAGE: ${lang}
    
    SYSTEM CONTEXT:
    ${contextStr}
    
    USER QUERY: "${message}"
    
    INSTRUCTIONS:
    1. If the user asks about their own business, status, or counts, you MUST use the "STRICT USER CONTEXT" above. Do not guess.
    2. If the user is a Farmer and has "Pending" orders, mention them!
    3. If the user is a Retailer and has orders, acknowledge their purchase history.
    4. Be specific. Instead of "You have crops", say "You have 500kg of Tomato listed".
    5. Always be polite, helpful, and supportive.
    6. For non-English languages (Hindi/Kannada), use SIMPLE, CONVERSATIONAL phrasing that avoids overly technical Sanskritized words. This helps with better Text-to-Speech (TTS) pronunciation.
    7. In Kannada, use common regional conversational tone (Sanchari/Vahini style) instead of formal literary Kannada.
    8. **ROLE-BASED NAVIGATION (STRICT RULE):**
       - If role is "farmer": ONLY navigate to /add-crop, /farmer-dash, /ai-predictor, /orders, or /spoilage-rescue.
       - If role is "retailer": ONLY navigate to /marketplace, /orders, or /spoilage-rescue.
       - NEVER send a Retailer to /add-crop or /farmer-dash. Redirect them to /marketplace if they want to buy.
       - NEVER send a Farmer to /marketplace. Redirect them to /add-crop if they want to sell.
    
    OUTPUT FORMAT (JSON ONLY):
    {
      "reply": "Your personalized response in ${lang}",
      "action": {
        "type": "navigate" | null,
        "url": "/marketplace" | "/add-crop" | "/orders" | "/spoilage-rescue" | "/farmer-dash" | "/ai-predictor" | null
      }
    }
    Only pick an action if intent is clearly stated. Only return JSON.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.1-8b-instant",
      response_format: { type: "json_object" },
    });

    const text = chatCompletion.choices[0].message.content;
    return JSON.parse(text);
  } catch (error) {
    console.error("Groq Chat Error:", error);
    throw error;
  }
}

/**
 * Fetches real-time trending insights for 4 dynamic crops in the Indian market.
 */
async function fetchTrendingInsights() {
  try {
    const prompt = `You are a real-time agricultural market analyst for India. 
    Select the top 4 trending crops today based on seasonality, price spikes, or market demand.
    For each crop, provide current Mandi price, next-week forecast, trend, and a brief recommendation.
    
    Format your response as a strict JSON object:
    {
      "trending": [
        {
          "name": "Crop Name",
          "current": number (INR/kg),
          "predicted": number (INR/kg),
          "trend": "up" | "down" | "stable",
          "change": number (e.g. 5.2 for 5.2%),
          "confidence": "string (e.g. 94%)",
          "recommended": "string (e.g. Hold & Sell)",
          "recommendation_detail": "string (brief context)"
        }
      ]
    }
    Base your selection on realistic Indian agricultural trends. Return ONLY the JSON object.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const text = chatCompletion.choices[0].message.content;
    const data = JSON.parse(text);
    return data.trending;
  } catch (error) {
    console.error("Groq Trending Error:", error);
    // Fallback to basic trending if AI fails
    return [
      { name: "Tomato", current: 18, predicted: 15, trend: "down", change: 15, confidence: "95%", recommended: "Sell Now" },
      { name: "Onion", current: 38, predicted: 42, trend: "up", change: 12, confidence: "85%", recommended: "Hold & Sell" },
      { name: "Wheat", current: 25, predicted: 26, trend: "up", change: 5, confidence: "92%", recommended: "Hold & Sell" },
      { name: "Rice", current: 42, predicted: 42, trend: "stable", change: 0, confidence: "88%", recommended: "Stable" }
    ];
  }
}

module.exports = {
  predictCropPrice,
  chatAssistant,
  fetchTrendingInsights
};
