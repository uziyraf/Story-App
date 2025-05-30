import { subscribeNotification, unsubscribeNotification } from '../../data/api';
import { openDB } from 'idb';

const DB_NAME = 'push_db';
const STORE_NAME = 'subscriptions';

// Setup IndexedDB dan object store
async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'endpoint' });
      }
    },
  });
}

// Simpan subscription ke IndexedDB
async function saveSubscriptionToDB(subscription) {
  const db = await getDB();
  await db.put(STORE_NAME, subscription.toJSON());
}

// Dapatkan subscription dari IndexedDB berdasarkan endpoint
async function getSubscriptionFromDB(endpoint) {
  const db = await getDB();
  return await db.get(STORE_NAME, endpoint);
}

// Hapus subscription dari IndexedDB
async function deleteSubscriptionFromDB(endpoint) {
  const db = await getDB();
  await db.delete(STORE_NAME, endpoint);
}

// Fungsi subscribe user ke push
export async function subscribeUserToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push not supported.');
  }

  if (Notification.permission !== 'granted') {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied.');
    }
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (subscription && subscription.expirationTime && subscription.expirationTime < Date.now()) {
    await subscription.unsubscribe();
    subscription = null;
  }

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        'BNoEf6-3VYZuTNo4qflAP8HzD9x-BGSOTpGVEz5ZljZPWMXyS54XAViqWCtA6xGYBv2Th7l3859cu6EmIWcetZARB0YJffpOe9UqzIxz5ehYjXxy3sQ'
      ),
    });
  }

  // Cek dulu di IndexedDB apakah sudah ada subscription ini
  const existingSub = await getSubscriptionFromDB(subscription.endpoint);
  if (!existingSub) {
    await saveSubscriptionToDB(subscription);
  }

  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('User not authenticated.');
  }

  const subscriptionJson = subscription.toJSON();
  const response = await subscribeNotification({
    token,
    subscription: subscriptionJson,
  });
  return response;
}

// Fungsi unsubscribe user dari push
export async function unsubscribeUserFromPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push not supported.');
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    throw new Error('No push subscription found.');
  }

  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('User not authenticated.');
  }

  const subscriptionJson = subscription.toJSON();

  const response = await unsubscribeNotification({
    token,
    endpoint: subscriptionJson.endpoint,
  });

  await subscription.unsubscribe();

  // Hapus juga dari IndexedDB
  await deleteSubscriptionFromDB(subscriptionJson.endpoint);

  return response;
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
