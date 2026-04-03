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
async function chatAssistant(message, lang) {
  try {
    const prompt = `You are "Raitha Mithra", a friendly and expert digital farming assistant for the Mandi-Connect platform in India.
    Current Language: ${lang}
    
    User Query: "${message}"
    
    Your goal is to help Indian farmers and retailers. 
    - Be supportive, knowledgeable, and professional.
    - If the user wants to sell crops or add a listing, suggest they visit the "Add Crop" page.
    - If they want to buy crops, suggest the "Marketplace".
    - If they have orders, suggest "Orders".
    
    IMPORTANT: You must output your response as a JSON object:
    {
      "reply": "your helpful response in ${lang}",
      "action": {
        "type": "navigate" | null,
        "url": "/add-crop" | "/ai-predictor" | "/marketplace" | "/orders" | "/farmer-dash" | null
      }
    }
    Only pick an action if the user clearly expresses intent to perform that task.
    Otherwise, set action to null.
    Only return the JSON object.`;

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
