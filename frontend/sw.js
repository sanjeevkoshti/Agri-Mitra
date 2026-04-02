// Mandi-Connect Service Worker
const CACHE_NAME = 'mandi-connect-v6';
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
  '/js/auth.js',
  '/js/db.js',
  '/js/api.js'
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

  // Skip non-GET for caching
  if (request.method !== 'GET') return;

  // For API requests: network first, no cache fallback
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase.co')) {
    // Only intercept if it's our own domain's API
    if (url.origin === location.origin) {
      event.respondWith(
        fetch(request).catch(() => {
          return new Response(JSON.stringify({ success: false, error: 'You are offline' }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
      );
      return;
    }
  }

  // For navigation requests: load from cache, fallback to offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const offline = await caches.match(OFFLINE_URL);
        if (offline) return offline;
        // Absolute fallback if everything fails
        return new Response('<h1>Offline</h1><p>Please check your connection.</p>', {
          headers: { 'Content-Type': 'text/html' }
        });
      })
    );
    return;
  }

  // For everything else: cache first
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        // Only cache successful local responses
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      });
    }).catch(async () => {
      const offline = await caches.match(OFFLINE_URL);
      return offline || new Response('Offline resource not available');
    })
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
        const res = await fetch(`http://localhost:3002/api/crops`, {
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
        const res = await fetch(`http://localhost:3002/api/orders`, {
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
