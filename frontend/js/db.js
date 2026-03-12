/**
 * IndexedDB utility wrapper for Mandi-Connect
 * Stores offline crop submissions and order submissions
 */

const DB_NAME = 'mandi-connect-db';
const DB_VERSION = 1;

let dbInstance = null;

function openDatabase() {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('offline-crops')) {
        db.createObjectStore('offline-crops', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('offline-orders')) {
        db.createObjectStore('offline-orders', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('session')) {
        db.createObjectStore('session', { keyPath: 'key' });
      }
    };

    req.onsuccess = e => {
      dbInstance = e.target.result;
      resolve(dbInstance);
    };

    req.onerror = e => reject(e.target.error);
  });
}

// Save a crop locally (offline)
async function saveOfflineCrop(cropData) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline-crops', 'readwrite');
    const store = tx.objectStore('offline-crops');
    const req = store.add({ data: cropData, timestamp: Date.now() });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Get all offline crops
async function getOfflineCrops() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline-crops', 'readonly');
    const store = tx.objectStore('offline-crops');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Delete an offline crop by ID
async function deleteOfflineCrop(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline-crops', 'readwrite');
    const store = tx.objectStore('offline-crops');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Save session data (for persistent login)
async function saveSession(sessionData) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('session', 'readwrite');
    const store = tx.objectStore('session');
    const req = store.put({ key: 'current', ...sessionData });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Get session data
async function getSession() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('session', 'readonly');
    const store = tx.objectStore('session');
    const req = store.get('current');
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

// Clear session
async function clearSession() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('session', 'readwrite');
    const store = tx.objectStore('session');
    const req = store.delete('current');
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Save offline order
async function saveOfflineOrder(orderData) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline-orders', 'readwrite');
    const store = tx.objectStore('offline-orders');
    const req = store.add({ data: orderData, timestamp: Date.now() });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Sync offline crops to server
async function syncOfflineCropsToServer() {
  const offlineCrops = await getOfflineCrops();
  if (offlineCrops.length === 0) return 0;

  let synced = 0;
  for (const crop of offlineCrops) {
    try {
      const res = await fetch('/api/crops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(crop.data)
      });
      if (res.ok) {
        await deleteOfflineCrop(crop.id);
        synced++;
      }
    } catch (e) {
      // Still offline, stop trying
      break;
    }
  }
  return synced;
}
