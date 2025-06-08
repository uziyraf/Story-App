import { subscribeNotification, unsubscribeNotification } from '../../data/api';

export async function subscribeUserToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push notifications are not supported in this browser.');
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        'BNoEf6-3VYZuTNo4qflAP8HzD9x-BGSOTpGVEz5ZljZPWMXyS54XAViqWCtA6xGYBv2Th7l3859cu6EmIWcetZARB0YJffpOe9UqzIxz5ehYjXxy3sQ'
      ),
    });
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

  let response;
  try {
    response = await subscribeNotification({
      endpoint: subscriptionJson.endpoint,
      keys: subscriptionJson.keys,
    });
  } catch (error) {
    console.error('Error in subscribeNotification:', error);
    throw error;
  }
  return response;
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
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
