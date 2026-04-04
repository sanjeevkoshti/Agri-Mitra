const express = require('express');
const router = express.Router();

// Mock AI Assistant Logic for "Raitha Mithra"
// In a real app, this would use Gemini or OpenAI API
const responses = {
  en: {
    greeting: "Hello! I am Raitha Mithra, your digital farming assistant. How can I help you today?",
    unknown: "I'm not sure I understand. You can ask me to 'sell crops', 'check prices', or 'report spoilage'.",
    navigate_sell: "I'll take you to the Add Crop page. You can list your harvest there.",
    navigate_dashboard: "Going back to your main dashboard.",
    navigate_predict: "Let's check the market trends using our AI Predictor.",
    navigate_rescue: "Opening the Spoilage Rescue Network. We'll help you find urgent buyers.",
    navigate_orders: "Opening your orders page to check pending requests."
  },
  kn: { // Kannada
    greeting: "ನಮಸ್ಕಾರ! ನಾನು ರೈತ ಮಿತ್ರ, ನಿಮ್ಮ ಡಿಜಿಟಲ್ ಕೃಷಿ ಸಹಾಯಕ. ಇವತ್ತು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
    unknown: "ಕ್ಷಮಿಸಿ, ನನಗೆ ಅರ್ಥವಾಗಲಿಲ್ಲ. ನೀವು 'ಬೆಳೆ ಮಾರಿ', 'ಬೆಲೆ ನೋಡಿ' ಅಥವಾ 'ಸಹಾಯ ಬೇಕು' ಎಂದು ಕೇಳಬಹುದು.",
    navigate_sell: "ಬೆಳೆ ಸೇರಿಸುವ ಪುಟಕ್ಕೆ ಹೋಗೋಣ.",
    navigate_dashboard: "ಮುಖ್ಯ ಪುಟಕ್ಕೆ ಹಿಂತಿರುಗುತ್ತಿದ್ದೇವೆ."
  },
  hi: { // Hindi
    greeting: "नमस्ते! मैं रायथ मित्र हूँ, आपका डिजिटल खेती सहायक। आज मैं आपकी क्या मदद कर सकता हूँ?",
    unknown: "क्षमा करें, मुझे समझ नहीं आया। आप 'फसल बेचें', 'कीमतें देखें' या 'मदद चाहिए' पूछ सकते हैं।"
  }
};

const { chatAssistant } = require('../services/aiService');

router.post('/', async (req, res) => {
  try {
    const { message, lang = 'en', context = null } = req.body;
    
    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    // Call real Gemini AI
    const result = await chatAssistant(message, lang, context);

    res.json({
      success: true,
      reply: result.reply,
      action: result.action
    });

  } catch (err) {
    console.error('Chat AI Error:', err.message);
    
    // Fallback if AI fails
    res.json({
      success: true,
      reply: "I'm having a bit of trouble connecting to my brain right now. How can I help you manually?",
      action: null
    });
  }
});

module.exports = router;
