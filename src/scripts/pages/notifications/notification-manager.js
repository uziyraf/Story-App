import { subscribeNotification, unsubscribeNotification } from '../../data/api';

export async function subscribeUserToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push notifications are not supported in this browser.');
  }

  // Periksa izin notifikasi terlebih dahulu
  if (Notification.permission !== 'granted') {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    try {
      // Gunakan VAPID key baru yang Anda hasilkan
      const vapidPublicKey = 'BJIVNSQvd6RuIrezyIQWddiE0CtDUZaJ02ZC5yTWjn202tc6juMTs3zMCb4A73pt2m-3eenY6RlxKXcmUoicBUg';
      
      console.log('VAPID Public Key:', vapidPublicKey);
      
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
    } catch (error) {
      console.error('Error subscribing to push:', error);
      throw error;
    }
  }

  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('User is not authenticated.');
  }

  if (!subscription) {
    console.error('Subscription is null or undefined:', subscription);
    throw new Error('Push subscription is null.');
  }

  let subscriptionJson;
  try {
    subscriptionJson = subscription.toJSON();
    console.log('subscriptionJson:', subscriptionJson);
  } catch (error) {
    console.error('Error calling subscription.toJSON():', error);
    throw error;
  }

  if (!subscriptionJson || !subscriptionJson.endpoint || !subscriptionJson.keys) {
    console.error('Invalid subscription object:', subscriptionJson);
    throw new Error('Invalid subscription object.');
  }

  try {
    // Kirim data dengan format yang benar
    const response = await subscribeNotification({
      endpoint: subscriptionJson.endpoint,
      keys: subscriptionJson.keys
    });
    
    console.log('Subscribe response:', response);
    
    if (response.error === true) {
      throw new Error(response.message || 'Failed to subscribe to push notifications');
    }
    
    // Jika berhasil, simpan status berlangganan
    localStorage.setItem('isSubscribed', 'true');
    return true;
  } catch (error) {
    console.error('Error in subscribeNotification:', error);
    throw error;
  }
}

export async function unsubscribeUserFromPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push notifications are not supported in this browser.');
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    throw new Error('No push subscription found.');
  }

  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('User is not authenticated.');
  }

  const subscriptionJson = subscription.toJSON();
  const response = await unsubscribeNotification({
    endpoint: subscriptionJson.endpoint,
  });

  await subscription.unsubscribe();

  return response;
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  // Pastikan string tidak kosong
  if (!base64String) {
    throw new Error('VAPID key is empty');
  }
  
  // Hapus whitespace jika ada
  const trimmedBase64 = base64String.trim();
  
  // Tambahkan padding jika diperlukan
  const padding = '='.repeat((4 - (trimmedBase64.length % 4)) % 4);
  const base64 = (trimmedBase64 + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  // Decode base64
  try {
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  } catch (error) {
    console.error('Error converting base64 to Uint8Array:', error);
    throw new Error('Failed to convert VAPID key: ' + error.message);
  }
}





