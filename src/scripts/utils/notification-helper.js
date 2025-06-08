import { convertBase64ToUint8Array } from './index';
import CONFIG from '../config';
import { subscribeNotification, unsubscribeNotification } from '../data/api';

export function isNotificationAvailable() {
    return 'Notification' in window;
}
   
export function isNotificationGranted() {
    return Notification.permission === 'granted';
}

export async function requestNotificationPermission() {
    if (!isNotificationAvailable()) {
      console.error('Notification API unsupported.');
      return false;
    }
   
    if (isNotificationGranted()) {
      return true;
    }
   
    const status = await Notification.requestPermission();
   
    if (status === 'denied') {
      alert('Izin notifikasi ditolak.');
      return false;
    }
   
    if (status === 'default') {
      alert('Izin notifikasi ditutup atau diabaikan.');
      return false;
    }
   
    return true;
}

export async function getPushSubscription() {
    const registration = await navigator.serviceWorker.getRegistration();
    return await registration.pushManager.getSubscription();
}

export async function isCurrentPushSubscriptionAvailable() {
    return !!(await getPushSubscription());
}

export function generateSubscribeOptions() {
    return {
      userVisibleOnly: true,
      applicationServerKey: convertBase64ToUint8Array(CONFIG.VAPID_PUBLIC_KEY),
    };
}
   
export async function subscribe(token) {
    if (!(await requestNotificationPermission())) {
      return false;
    }
   
    if (await isCurrentPushSubscriptionAvailable()) {
      alert('Sudah berlangganan push notification.');
      // Return true here to indicate subscription is active, so UI updates button
      return true;
    }
   
    console.log('Mulai berlangganan push notification...');

    const failureSubscribeMessage = 'Langganan push notification gagal diaktifkan.';
    const successSubscribeMessage = 'Langganan push notification berhasil diaktifkan.';

    let pushSubscription;

    try {
        const registration = await navigator.serviceWorker.getRegistration();
        pushSubscription = await registration.pushManager.subscribe(generateSubscribeOptions());
        const subscription = pushSubscription.toJSON();
        const response = await subscribeNotification({ subscription });

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
        alert(failureSubscribeMessage);

        if (pushSubscription) {
          await pushSubscription.unsubscribe();
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
