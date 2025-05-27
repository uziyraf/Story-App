import '../styles/styles.css';
import App from './pages/app';

// Service Worker Registration Function
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      console.log('Registering service worker...');
      
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });
      
      console.log('Service Worker registered successfully:', registration);
      
      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker is available
            console.log('New service worker available');
            
            // Optional: Show update notification to user
            const userWantsUpdate = confirm('A new version of the app is available. Update now?');
            if (userWantsUpdate) {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              navigator.serviceWorker.addEventListener('controllerchange', () => {
                window.location.reload();
              });
            }
          }
        });
      });
      
      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('Message from service worker:', event.data);
      });
      
      return registration;
      
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  } else {
    console.log('Service Worker not supported in this browser');
  }
}

// Check for service worker updates
function checkForUpdates() {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration) {
        registration.update();
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize your app
  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
  });
  await app.renderPage();

  // Skip link functionality
  const skipLink = document.querySelector('.skipToContent');
  if (skipLink) {
    skipLink.addEventListener('click', (event) => {
      event.preventDefault();
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        mainContent.setAttribute('tabindex', '-1');
        mainContent.focus();
        window.scrollTo(0, mainContent.offsetTop);
      }
    });
  }

  // Handle hash changes
  window.addEventListener('hashchange', async () => {
    await app.renderPage();
  });

  // Register service worker after app is loaded
  try {
    await registerServiceWorker();
    
    // Check for updates every 30 minutes
    setInterval(checkForUpdates, 30 * 60 * 1000);
    
    // Check for updates when page becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        checkForUpdates();
      }
    });
    
  } catch (error) {
    console.error('Failed to register service worker:', error);
  }

   // 1. Minta izin notifikasi
   if ('Notification' in window && Notification.permission === 'default') {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // 2. Jika user izinkan, langsung subscribe push notification
        try {
          await subscribeUserToPush();
          console.log('Push subscription successful');
        } catch (error) {
          console.error('Failed to subscribe to push', error);
        }
      } else {
        console.log('User denied push notification permission');
      }
    } catch (error) {
      console.error('Notification permission request failed', error);
    }
  } else if (Notification.permission === 'granted') {
    // Jika sudah granted sebelumnya, bisa langsung subscribe
    try {
      await subscribeUserToPush();
      console.log('Push subscription successful');
    } catch (error) {
      console.error('Failed to subscribe to push', error);
    }
  } else {
    console.log('Push notification permission:', Notification.permission);
  }
});

// Your existing push notification functions
import { subscribeNotification, unsubscribeNotification } from './data/api';

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