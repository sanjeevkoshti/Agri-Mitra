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
async function predictCropPrice(crop) {
  try {
    const prompt = `You are an expert agricultural economist specializing in Indian Mandi markets. 
    Provide a detailed market analysis for the crop: "${crop}". 
    Format your response as a strict JSON object with the following fields:
    {
      "current_market_price": number (average price in INR per kg),
      "predicted_price": number (estimated price next week in INR per kg),
      "trend": "up" | "down" | "stable",
      "volatility": string (e.g. "5%"),
      "confidence": string (e.g. "85%"),
      "recommendation": string (actionable advice for a farmer),
      "forecast_chart": [
        {"day": 1, "price": number},
        {"day": 2, "price": number},
        {"day": 3, "price": number},
        {"day": 4, "price": number},
        {"day": 5, "price": number},
        {"day": 6, "price": number},
        {"day": 7, "price": number}
      ]
    }
    Ensure the data reflects current market sentiments and use exact historical pricing. Base your response on real-world Indian agricultural data. 
    Only return the JSON object, no other text.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
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

    const prompt = `You are "Raitha Mithra", a premier digital farming advisor for Mandi-Connect.
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
    
    OUTPUT FORMAT (JSON ONLY):
    {
      "reply": "Your personalized response in ${lang}",
      "action": {
        "type": "navigate" | null,
        "url": "/add-crop" | "/ai-predictor" | "/marketplace" | "/orders" | "/farmer-dash" | null
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

module.exports = {
  predictCropPrice,
  chatAssistant
};
