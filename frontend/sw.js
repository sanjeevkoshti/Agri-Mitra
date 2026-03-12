// Mandi-Connect Service Worker
const CACHE_NAME = 'mandi-connect-v1';
const OFFLINE_URL = '/offline.html';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/login.html',
  '/farmer-dashboard.html',
  '/add-crop.html',
  '/marketplace.html',
  '/order-management.html',
  '/payment.html',
  '/tracking.html',
  '/offline.html',
  '/manifest.json',
  '/css/style.css',
  '/js/app.js',
  '/js/auth.js',
  '/js/db.js',
  '/js/api.js',
  '/js/marketplace.js',
  '/js/farmer-dashboard.js',
  '/js/orders.js',
  '/js/payment.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
];

// Install: cache all static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' }))).catch(err => {
        console.warn('Some assets failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: delete old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network first, fallback to cache
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET for caching (let them pass through for BG sync)
  if (request.method !== 'GET') return;

  // For API requests: network first, no cache fallback
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase.co')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(JSON.stringify({ success: false, error: 'You are offline' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // For navigation requests: load from cache, fallback to offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then(cached => cached || caches.match(OFFLINE_URL))
      )
    );
    return;
  }

  // For everything else: cache first
  event.respondWith(
    caches.match(request).then(cached => {
      return cached || fetch(request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        return response;
      });
    }).catch(() => caches.match(OFFLINE_URL))
  );
});

// Background Sync for offline crop submissions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-crops') {
    event.waitUntil(syncOfflineCrops());
  }
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOfflineOrders());
  }
});

async function syncOfflineCrops() {
  try {
    const db = await openDB();
    const tx = db.transaction('offline-crops', 'readonly');
    const store = tx.objectStore('offline-crops');
    const crops = await getAllItems(store);

    for (const crop of crops) {
      try {
        const res = await fetch('/api/crops', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(crop.data)
        });
        if (res.ok) {
          const delTx = db.transaction('offline-crops', 'readwrite');
          delTx.objectStore('offline-crops').delete(crop.id);
        }
      } catch (e) {
        console.error('Failed to sync crop:', e);
      }
    }
  } catch (e) {
    console.error('Sync failed:', e);
  }
}

async function syncOfflineOrders() {
  try {
    const db = await openDB();
    const tx = db.transaction('offline-orders', 'readonly');
    const store = tx.objectStore('offline-orders');
    const orders = await getAllItems(store);

    for (const order of orders) {
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order.data)
        });
        if (res.ok) {
          const delTx = db.transaction('offline-orders', 'readwrite');
          delTx.objectStore('offline-orders').delete(order.id);
        }
      } catch (e) {
        console.error('Failed to sync order:', e);
      }
    }
  } catch (e) {
    console.error('Sync failed:', e);
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('mandi-connect-db', 1);
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('offline-crops')) {
        db.createObjectStore('offline-crops', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('offline-orders')) {
        db.createObjectStore('offline-orders', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getAllItems(store) {
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
}
