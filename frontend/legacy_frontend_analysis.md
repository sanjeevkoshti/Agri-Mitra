# Mandi-Connect: Legacy Frontend Analysis (Feature & Functionality Report)

This document provides a comprehensive overview of the features and underlying functions implemented in the legacy (HTML/JS) frontend of the Mandi-Connect platform.

## 🏗️ Core Infrastructure Systems

### 1. Unified API Library (`js/api.js`)
The central hub for all backend communication.
- **`fetchWithTimeout`**: Ensures the UI doesn't hang on slow rural networks (default 10s timeout).
- **`getCrops(query)`**: Filters crops by name for the marketplace.
- **`placeOrder(orderData)`**: Submits bulk orders with quantity, pickup, and delivery details.
- **`getPrediction(crop)`**: Fetches 7-day AI forecast data for a specific crop.
- **`raithaMithraChat(msg, lang)`**: Connects to the AI assistant backend.
- **Format Helpers**: `formatCurrency`, `formatDate`, and `timeAgo` for consistent UI data rendering.

### 2. Multi-Layer Authentication & Session (`js/auth.js`)
- **`requireAuth(role)`**: A route guard that redirects unauthenticated users or users with incorrect roles to their respective landing pages.
- **Email OTP Flow**:
    - **`apiSendOTP(email)`**: Triggers backend Nodemailer to send a 6-digit code.
    - **`apiVerifyOTP(email, otp)`**: Validates the code to enable registration or password reset.
- **Session Persistence**: Uses `localStorage` (`mc_profile`) to keep users logged in across sessions.

### 3. Internationalization (i18n) Engine (`js/i18n.js`)
Designed for rural accessibility in 🇮🇳 India.
- **`loadLanguage(lang)`**: Asynchronously fetches JSON locale files (English, Hindi, Kannada).
- **`translatePage()`**: Scans the DOM for `data-i18n` attributes and injects translations.
- **`getDataT(val)`**: A specific function to translate dynamic data coming from the database (e.g., "Tomato" -> "टमाटर").

---

## 🤖 AI & Decision Support Layer

### 4. Raitha Mithra (AI Assistant) (`js/raitha-mithra.js`)
A floating assistant accessible from every page.
- **Voice Support**: 
    - **`SpeechRecognition`**: Converts farmer's speech (Kan/Hin/Eng) into text.
    - **`speechSynthesis`**: Reads AI responses aloud for accessibility.
- **Navigation Logic**: If the AI suggests a page (e.g., "Check your orders"), it sends a `navigate` action that automatically redirects the user.
- **Persistence**: Remembers chat history for up to 1 hour via `localStorage`.

### 5. Market Price Predictor (`ai-predictor.html`)
Empowers farmers to decide *when* to sell.
- **`renderPrediction()`**: Generates a 7-day forecast chart using raw CSS/DOM elements (height-based bar chart).
- **Trend Analysis**: Categorizes market outlook into "Trending Up", "Trending Down", or "Stable".
- **Smart Recommendations**: Suggests whether to "List Now" or "Hold Stock" for a week.

---

## 🌾 Farmer Module

### 6. Dashboard & Listing Management (`farmer-dashboard.html`)
- **Real-time Stats**: Shows active listing counts and pending order counts.
- **Listing Management**:
    - **`renderCrops()`**: Displays the farmer's active inventory.
    - **`deleteCropListing()`**: Removes inventory from the public marketplace.
    - **`openEditModal()`**: Allows updating quantity or price of an existing listing without re-creating it.

### 7. Add Crop Wizard (`add-crop.html`)
- **Image Handling**: Supports Base64 image previews before uploading to Supabase Storage.
- **Location Auto-fill**: Pulls the farmer's registered location as the default pickup point.

---

## 🛒 Retailer Module

### 8. Direct Marketplace (`marketplace.html`)
- **Search & Filter**: Clientside filtering and API-based search for crop types.
- **Order Modal**:
    - **Live Totaling**: Calculates `qty * price` dynamically as the user types.
    - **Stock Validation**: Prevents ordering more than the available quantity.

### 9. Fulfillment & Logistics (`order-management.html`)
Shared view with role-specific logic.
- **Farmer Actions**:
    - **`Accept / Reject`**: Updates order state via PATCH.
    - **`Mark In-Transit`**: Triggers the logistics flow.
    - **`Mark Delivered`**: Finalizes the lifecycle.
- **Retailer Actions**:
    - **Track Order**: Links to a visual status tracker.
    - **Pay Now**: Directs to the UPI checkout.

### 10. UPI Payment Gateway (`payment.html`)
- **QR Generation**: Uses `qrcode.js` to build a valid UPI transaction QR code (e.g., `upi://pay?...`).
- **Deep Linking**: Includes an "Open UPI App" button that works on mobile devices to launch PhonePe/GPay/Paytm directly.
- **Transaction Mocking**: Allows confirming payments manually for hackathon demos.

---

## 🎨 UI/UX Design tokens
- **Colors**: Primary Forest Green (`#0f3d2e`), Accent Gold (`#f5a623`).
- **Responsive**: "Mobile-first" design with a fixed bottom navigation bar on all core pages.
- **Feedback**: A toast system (`showAlert`) provides instant validation and error messaging.
