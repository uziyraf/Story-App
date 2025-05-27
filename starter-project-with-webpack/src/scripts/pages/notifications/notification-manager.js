import { subscribeNotification, unsubscribeNotification } from '../../data/api';

export async function subscribeUserToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('not supported in this browser.');
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        'BGSOTpGVEz5ZljZPWMXyS54XAViqWCtA6xGYBv2Th7l3859cu6EmIWcetZARB0YJffpOe9UqzIxz5ehYjXxy3sQ'
      ),
    });
  }

  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('User is not authenticated.');
  }

  const subscriptionJson = subscription.toJSON();
  const response = await subscribeNotification({
    token,
    subscription: subscriptionJson,
  });
  return response;
}

export async function unsubscribeUserFromPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error(' not supported in this browser.');
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    throw new Error('No push subscription found.');
  }

  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('User is not authenticated.');
  }

  const subscriptionJson = subscription.toJSON();
  const response = await unsubscribeNotification({
    token,
    endpoint: subscriptionJson.endpoint,
  });

  await subscription.unsubscribe();

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
