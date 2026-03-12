# Mandi-Connect 🌾

> **Farm-to-Retail Marketplace** — Low-bandwidth, Offline-First PWA for rural India

## Quick Start

### 1. Start the Backend
```bash
cd backend
npm install
npm start
```
The API server will run on **http://localhost:3001**

### 2. Serve the Frontend
```bash
cd frontend
npx serve .
```
The app will open on **http://localhost:3000**
> Or use VS Code Live Server pointing to `frontend/`

---

## Project Structure
```
mandi-connect/
├── backend/
│   ├── index.js              # Express server
│   ├── supabase.js           # Supabase client
│   ├── .env                  # API keys  
│   └── routes/
│       ├── crops.js          # Crop listing endpoints
│       ├── orders.js         # Order management endpoints
│       └── payments.js       # UPI payment endpoints
│
└── frontend/
    ├── index.html            # Landing page
    ├── login.html            # Login / Register
    ├── farmer-dashboard.html # Farmer home
    ├── add-crop.html         # Add crop listing (offline-first)
    ├── marketplace.html      # Retailer marketplace
    ├── order-management.html # Orders (farmer + retailer)
    ├── payment.html          # UPI payment + QR
    ├── tracking.html         # Order tracking
    ├── offline.html          # Offline fallback page
    ├── manifest.json         # PWA manifest
    ├── sw.js                 # Service Worker
    ├── css/style.css         # Global stylesheet
    └── js/
        ├── api.js            # Backend API client
        ├── auth.js           # Supabase auth + session
        └── db.js             # IndexedDB offline storage
```

## Features
| Feature | Status |
|---------|--------|
| Farmer/Retailer Auth (Supabase) | ✅ |
| Add Crop Listing | ✅ |
| Offline Crop Submission (IndexedDB) | ✅ |
| Background Sync (Service Worker) | ✅ |
| Retailer Marketplace with Search | ✅ |
| Place Bulk Orders | ✅ |
| Accept/Reject Orders (Farmer) | ✅ |
| UPI QR Code Payment | ✅ |
| Order Tracking with Steps | ✅ |
| Logistics Details | ✅ |
| PWA / Installable | ✅ |
| Mobile-First Responsive | ✅ |
| Offline Fallback Page | ✅ |

## Tech Stack
- **Frontend**: HTML5 · Vanilla CSS · Vanilla JS · PWA
- **Backend**: Node.js · Express.js
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Offline**: IndexedDB + Service Worker + Background Sync
- **Payments**: UPI QR (qrcodejs) + UPI Deep Links

## Supabase Config
- **Project**: mandi-connect (`oxmphzgfwylhifoqwslg`)
- **Region**: ap-south-1 (Mumbai)
- **URL**: https://oxmphzgfwylhifoqwslg.supabase.co

---
Built for Hackathon Demo 🏆 | © 2026 Mandi-Connect
