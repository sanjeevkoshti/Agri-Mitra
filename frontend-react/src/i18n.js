import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "app_name": "Agri-Mitra",
      "app_subtitle": "Farmer to Retailer Direct",
      "hero_title": "Sell Crops.",
      "hero_subtitle": "No Middlemen.",
      "hero_desc": "Agri-Mitra bridges farmers directly to retailers across India. Get fair prices and track orders.",
      "iam_farmer": "I'm a Farmer",
      "iam_retailer": "I'm a Retailer",
      "commission_charged": "Commission Charged",
      "instant_payments": "Instant Payments",
      "features_title": "Everything you need to trade directly",
      "features_subtitle": "Designed for rural India — simple and direct.",
      "list_crops": "List Your Crops",
      "list_crops_desc": "Farmers add crop listings with price, quantity, and harvest date.",
      "browse_order": "Browse & Order",
      "browse_order_desc": "Retailers browse listings, filter by crop type, and place bulk orders directly.",
      "upi_payments": "UPI Payments",
      "upi_payments_desc": "Pay instantly using any UPI app via QR code or payment link.",
      "track_orders": "Track Orders",
      "track_orders_desc": "Follow every order from placement to delivery with real-time status updates.",
      "ai_predictor": "AI Price Predictor",
      "ai_predictor_desc": "Predict market trends and get recommendations on when to sell your crops.",
      "cta_title": "Ready to trade without middlemen?",
      "cta_subtitle": "Join thousands of farmers and retailers already using Agri-Mitra.",
      "get_started": "Get Started Free →",
      "nav_home": "Home",
      "nav_marketplace": "Marketplace",
      "nav_dashboard": "Dashboard",
      "nav_orders": "Orders",
      "nav_login": "Login",
      "footer_text": "Empowering Indian Farmers through Direct Trade.",
      "raitha_mithra": "Raitha Mithra",
      "raitha_mithra_greeting": "Namaste! I am Raitha Mithra. How can I help you today?",
      "spoilage_rescue": "Agri-Mitra Rescue",
      "spoilage_rescue_desc": "Reduce waste by selling at-risk crops to nearby retailers quickly."
    }
  },
  hi: {
    translation: {
      "app_name": "Agri-Mitra",
      "hero_title": "फसलें बेचें।",
      "hero_subtitle": "बिचौलियों से मुक्ति",
      "hero_desc": "Agri-Mitra के माध्यम से किसानों को खुदरा विक्रेताओं से जोड़ना। उचित मूल्य, तत्काल भुगतान और शून्य बिचौलिये।",
      "iam_farmer": "मैं एक किसान हूँ",
      "iam_retailer": "मैं एक खुदरा विक्रेता हूँ",
      "commission_charged": "कमीशन लिया गया",
      "instant_payments": "नकद भुगतान",
      "features_title": "सीधे व्यापार करने के लिए आवश्यक सब कुछ",
      "features_subtitle": "Agri-Mitra ग्रामीण भारत के लिए — सरल और सीधा।",
      "list_crops": "अपनी फसलें सूचीबद्ध करें",
      "list_crops_desc": "किसान मूल्य, मात्रा और कटाई की तारीख के साथ फसल लिस्टिंग जोड़ते हैं।",
      "browse_order": "ब्राउज़ करें और ऑर्डर करें",
      "browse_order_desc": "खुदरा विक्रेता लिस्टिंग ब्राउज़ करते हैं, फसल के प्रकार से फ़िल्टर करते हैं, और सीधे थोक ऑर्डर देते हैं।",
      "upi_payments": "UPI भुगतान",
      "upi_payments_desc": "किसी भी UPI ऐप का उपयोग करके QR कोड या भुगतान लिंक के माध्यम से तुरंत भुगतान करें।",
      "track_orders": "ऑर्डर ट्रैक करें",
      "track_orders_desc": "रीयल-टाइम स्थिति अपडेट के साथ प्लेसमेंट से लेकर डिलीवरी तक हर ऑर्डर का पालन करें।",
      "ai_predictor": "AI मूल्य भविष्यवक्ता",
      "ai_predictor_desc": "बाजार के रुझानों की भविष्यवाणी करें और अपनी फसल कब बेचनी है, इस पर सिफारिशें प्राप्त करें।",
      "cta_title": "बिचौलियों के बिना व्यापार करने के लिए तैयार हैं?",
      "cta_subtitle": "Agri-Mitra का उपयोग करने वाले हजारों किसानों और खुदरा विक्रेताओं से जुड़ें।",
      "get_started": "मुफ्त में शुरू करें →",
      "nav_home": "होम",
      "nav_marketplace": "बाज़ार",
      "nav_dashboard": "डैशबोर्ड",
      "nav_orders": "ऑर्डर",
      "nav_login": "लॉगिन",
      "footer_text": "प्रत्यक्ष व्यापार के माध्यम से भारतीय किसानों को सशक्त बनाना।",
      "raitha_mithra": "रयता मित्रा",
      "raitha_mithra_greeting": "नमस्ते! मैं रयता मित्रा हूँ। आज मैं आपकी क्या मदद कर सकता हूँ?",
      "spoilage_rescue": "खराब होने से बचाव",
      "spoilage_rescue_desc": "खतरे वाली फसलों को पास के खुदरा विक्रेताओं को जल्दी बेचकर बर्बादी कम करें।"
    }
  },
  kn: {
    translation: {
      "app_name": "Agri-Mitra",
      "hero_title": "ಬೆಳೆಗಳನ್ನು ಮಾರಿ.",
      "hero_subtitle": "ಮಧ್ಯವರ್ತಿಗಳಿಲ್ಲ.",
      "hero_desc": "Agri-Mitra ಭಾರತದಾದ್ಯಂತ ರೈತರನ್ನು ನೇರವಾಗಿ ಚಿಲ್ಲರೆ ವ್ಯಾಪಾರಿಗಳಿಗೆ ಸಂಪರ್ಕಿಸುತ್ತದೆ. ನ್ಯಾಯಯುತ ಬೆಲೆ ಪಡೆಯಿರಿ ಮತ್ತು ಆರ್ಡರ್ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ.",
      "iam_farmer": "ನಾನು ರೈತ",
      "iam_retailer": "ನಾನು ಚಿಲ್ಲರೆ ವ್ಯಾಪಾರಿ",
      "commission_charged": "ಕಮಿಷನ್ ವಿಧಿಸಲಾಗಿದೆ",
      "instant_payments": "ತತ್ಕ್ಷಣ ಪಾವತಿ",
      "features_title": "ನೇರ ವ್ಯಾಪಾರಕ್ಕೆ ಬೇಕಾದ ಎಲ್ಲಾ ಸೌಲಭ್ಯಗಳು",
      "features_subtitle": "ಗ್ರಾಮೀಣ ಭಾರತಕ್ಕಾಗಿ ವಿನ್ಯಾಸಗೊಳಿಸಲಾಗಿದೆ — ಸರಳ ಮತ್ತು ನೇರ.",
      "list_crops": "ನಿಮ್ಮ ಬೆಳೆಗಳನ್ನು ಪಟ್ಟಿ ಮಾಡಿ",
      "list_crops_desc": "ರೈತರು ಬೆಲೆ, ಪ್ರಮಾಣ ಮತ್ತು ಕೊಯ್ಲು ದಿನಾಂಕದೊಂದಿಗೆ ಬೆಳೆ ಪಟ್ಟಿಗಳನ್ನು ಸೇರಿಸುತ್ತಾರೆ.",
      "browse_order": "ಬ್ರೌಸ್ ಮಾಡಿ ಮತ್ತು ಆರ್ಡರ್ ಮಾಡಿ",
      "browse_order_desc": "ಚಿಲ್ಲರೆ ವ್ಯಾಪಾರಿಗಳು ಪಟ್ಟಿಗಳನ್ನು ಬ್ರೌಸ್ ಮಾಡುತ್ತಾರೆ ಮತ್ತು ನೇರವಾಗಿ ಆರ್ಡರ್ ಮಾಡುತ್ತಾರೆ.",
      "upi_payments": "UPI ಪಾವತಿಗಳು",
      "upi_payments_desc": "ಯಾವುದೇ UPI ಆ್ಯಪ್ ಬಳಸಿ QR ಕೋಡ್ ಮೂಲಕ ತಕ್ಷಣ ಪಾವತಿಸಿ.",
      "track_orders": "ಆರ್ಡರ್ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ",
      "track_orders_desc": "ಆರ್ಡರ್ ಹಂತ ಹಂತವಾಗಿ ಎಲ್ಲಿದೆ ಎಂಬ ಮಾಹಿತಿಯನ್ನು ಪಡೆಯಿರಿ.",
      "ai_predictor": "AI ಬೆಲೆ ಮುನ್ಸೂಚನೆ",
      "ai_predictor_desc": "ಮಾರುಕಟ್ಟೆ ಪ್ರವೃತ್ತಿಗಳನ್ನು ಊಹಿಸಿ ಮತ್ತು ಬೆಳೆ ಮಾರಾಟದ ಬಗ್ಗೆ ಸಲಹೆ ಪಡೆಯಿರಿ.",
      "cta_title": "ಮಧ್ಯವರ್ತಿಗಳಿಲ್ಲದೆ ವ್ಯಾಪಾರ ಮಾಡಲು ಸಿದ್ಧರಿದ್ದೀರಾ?",
      "cta_subtitle": "ಸಾವಿರಾರು ರೈತರು ಮತ್ತು ಚಿಲ್ಲರೆ ವ್ಯಾಪಾರಿಗಳು ಈಗಾಗಲೇ Agri-Mitra ಬಳಸುತ್ತಿದ್ದಾರೆ.",
      "get_started": "ಉಚಿತವಾಗಿ ಆರಂಭಿಸಿ →",
      "nav_home": "ಮುಖಪುಟ",
      "nav_marketplace": "ಮಾರುಕಟ್ಟೆ",
      "nav_dashboard": "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
      "nav_orders": "ಆರ್ಡರ್‌ಗಳು",
      "nav_login": "ಲಾಗಿನ್",
      "footer_text": "ನೇರ ವ್ಯಾಪಾರದ ಮೂಲಕ ಭಾರತೀಯ ರೈತರ ಸಬಲೀಕರಣ.",
      "raitha_mithra": "ರೈತ ಮಿತ್ರ",
      "raitha_mithra_greeting": "ನಮಸ್ಕಾರ! ನಾನು ರೈತ ಮಿತ್ರ. ಇವತ್ತು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
      "spoilage_rescue": "ಬೆಳೆ ರಕ್ಷಣೆ",
      "spoilage_rescue_desc": "ಬೆಳೆಗಳು ಹಾಳಾಗುವ ಮುನ್ನ ಹತ್ತಿರದ ಚಿಲ್ಲರೆ ವ್ಯಾಪಾರಿಗಳಿಗೆ ಮಾರಿ ನಷ್ಟ ತಪ್ಪಿಸಿ."
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    detection: {
      order: ['queryString', 'cookie', 'localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage', 'cookie'],
    },
  });

export default i18n;
