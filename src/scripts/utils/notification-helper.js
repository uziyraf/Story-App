import CONFIG from '../config';
import { subscribeNotification, unsubscribeNotification } from '../data/api';

function urlBase64ToUint8Array(base64String) {
  // Pastikan string tidak kosong atau undefined
  if (!base64String || typeof base64String !== 'string') {
    console.error('Invalid base64 string:', base64String);
    throw new Error('Invalid VAPID key format');
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
    
    // Verifikasi panjang array (harus 65 byte untuk VAPID key)
    if (outputArray.length !== 65) {
      console.warn('Converted applicationServerKey length:', outputArray.length, 'Expected: 65');
    }
    
    return outputArray;
  } catch (error) {
    console.error('Error converting base64 to Uint8Array:', error);
    throw new Error('Failed to convert VAPID key');
  }
}

export function isNotificationAvailable() {
    return 'Notification' in window;
}
   
export function isNotificationGranted() {
    return Notification.permission === 'granted';
}

export async function requestNotificationPermission() {
    if (!isNotificationAvailable()) {
      console.error('Notification API unsupported.');
      alert('Browser Anda tidak mendukung notifikasi.');
      return false;
    }
   
    if (isNotificationGranted()) {
      console.log('Notification permission already granted');
      return true;
    }
   
    console.log('Requesting notification permission...');
    
    try {
      const status = await Notification.requestPermission();
      console.log('Notification permission status:', status);
      
      if (status === 'denied') {
        console.warn('Notification permission denied');
        alert('Izin notifikasi ditolak. Silakan aktifkan notifikasi di pengaturan browser Anda.');
        return false;
      }
      
      if (status === 'default') {
        console.warn('Notification permission prompt closed');
        alert('Izin notifikasi ditutup atau diabaikan. Silakan coba lagi.');
        return false;
      }
  
      console.log('Notification permission granted');
      return true;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      alert('Terjadi kesalahan saat meminta izin notifikasi: ' + error.message);
      return false;
    }
}

export async function getPushSubscription() {
    const registration = await navigator.serviceWorker.getRegistration();
    return await registration.pushManager.getSubscription();
}

export async function isCurrentPushSubscriptionAvailable() {
    return !!(await getPushSubscription());
}

export function generateSubscribeOptions() {
  // Gunakan VAPID key baru yang Anda hasilkan
  const vapidKey = 'BJIVNSQvd6RuIrezyIQWddiE0CtDUZaJ02ZC5yTWjn202tc6juMTs3zMCb4A73pt2m-3eenY6RlxKXcmUoicBUg';
  console.log('Original VAPID key:', vapidKey);
  
  try {
    // Konversi VAPID key
    const applicationServerKey = urlBase64ToUint8Array(vapidKey);
    console.log('Converted applicationServerKey:', applicationServerKey);
    console.log('applicationServerKey length:', applicationServerKey.length);
    
    return {
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey,
    };
  } catch (error) {
    console.error('Error generating subscribe options:', error);
    throw error;
  }
}
   
export async function subscribe(token) {
  console.log('Starting subscription process...');
  
  try {
    // Request notification permission first
    const permissionGranted = await requestNotificationPermission();
    if (!permissionGranted) {
      console.log('Permission not granted, aborting subscription');
      return false;
    }
    
    console.log('Permission granted, checking current subscription...');
    
    // Check if already subscribed
    if (await isCurrentPushSubscriptionAvailable()) {
      console.log('Already subscribed to push notifications');
      alert('Anda sudah berlangganan notifikasi push.');
      return true;
    }
    
    console.log('Starting push notification subscription...');
    
    // Verifikasi VAPID key
    if (!CONFIG.VAPID_PUBLIC_KEY) {
      console.error('VAPID_PUBLIC_KEY is missing in CONFIG');
      alert('Konfigurasi VAPID key tidak ditemukan.');
      return false;
    }
    
    console.log('VAPID key:', CONFIG.VAPID_PUBLIC_KEY);
    
    // Generate subscribe options
    let subscribeOptions;
    try {
      subscribeOptions = generateSubscribeOptions();
      console.log('Subscribe options:', subscribeOptions);
    } catch (error) {
      console.error('Failed to generate subscribe options:', error);
      alert('Gagal membuat opsi langganan: ' + error.message);
      return false;
    }

    const failureSubscribeMessage = 'Gagal mengaktifkan notifikasi push.';
    const successSubscribeMessage = 'Notifikasi push berhasil diaktifkan!';

    let pushSubscription;

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;
    if (!registration) {
      console.error('No service worker registration found');
      alert('Service worker tidak terdaftar. Silakan muat ulang halaman.');
      return false;
    }
    
    console.log('Service worker registration:', registration);
    console.log('Push manager:', registration.pushManager);
    
    // Subscribe to push
    try {
      pushSubscription = await registration.pushManager.subscribe(subscribeOptions);
      console.log('Push subscription successful:', pushSubscription);
    } catch (subscribeError) {
      console.error('Error subscribing to push:', subscribeError);
      alert('Gagal berlangganan push: ' + subscribeError.message);
      return false;
    }
    
    const subscription = pushSubscription.toJSON();
    console.log('Subscription JSON:', subscription);
    
    // Send subscription to server
    const response = await subscribeNotification({ subscription });
    console.log('Server response:', response);

    if (response.error !== false) {
      console.error('subscribe: response:', response);
      alert(failureSubscribeMessage);
      // Undo subscribe to push notification
      await pushSubscription.unsubscribe();
      return false;
    }

    alert(successSubscribeMessage);
    return true;
  } catch (error) {
    console.error('subscribe: error:', error);
    alert('Gagal mengaktifkan notifikasi push: ' + (error.message || ''));

    if (pushSubscription) {
      try {
        await pushSubscription.unsubscribe();
      } catch (unsubError) {
        console.error('Error unsubscribing after failure:', unsubError);
      }
    }
    return false;
  }
}

export async function unsubscribe(token) {
    const failureUnsubscribeMessage = 'Langganan push notification gagal dinonaktifkan.';
    const successUnsubscribeMessage = 'Langganan push notification berhasil dinonaktifkan.';
    try {
      const pushSubscription = await getPushSubscription();
      if (!pushSubscription) {
        alert('Tidak bisa memutus langganan push notification karena belum berlangganan sebelumnya.');
        return false;
      }
      const subscription = pushSubscription.toJSON();
      const response = await unsubscribeNotification({ subscription });
      console.log('unsubscribe: response:', response);
      if (response.error !== false) {
        alert(failureUnsubscribeMessage);
        console.error('unsubscribe: response not ok:', response);
        return false;
      }

      const unsubscribed = await pushSubscription.unsubscribe();
      console.log('unsubscribe: unsubscribed:', unsubscribed);
      if (!unsubscribed) {
        alert(failureUnsubscribeMessage);
        await subscribeNotification({ token, subscription });
        return false;
      }
      alert(successUnsubscribeMessage);
      return true;
    } catch (error) {
      alert(failureUnsubscribeMessage);
      console.error('unsubscribe: error:', error);
      return false;
    }
}













