import '../styles/styles.css';
import App from './pages/app';
import { subscribeNotification, unsubscribeNotification } from './data/api';

const VAPID_PUBLIC_KEY = 'BGSOTpGVEz5ZljZPWMXyS54XAViqWCtA6xGYBv2Th7l3859cu6EmIWcetZARB0YJffpOe9UqzIxz5ehYjXxy3sQ';

// (fungsi requestNotificationPermission, registerServiceWorker, checkForUpdates, subscribeUserToPush, unsubscribeUserFromPush, dll tetap sama seperti milikmu)

document.addEventListener('DOMContentLoaded', async () => {
  await requestNotificationPermission();

  // Tangkap elemen yang diperlukan untuk App
  const content = document.querySelector('#main-content');
  const drawerButton = document.querySelector('#drawer-button');
  const navigationDrawer = document.querySelector('#navigation-drawer');
  const toggleNotification = document.querySelector('#toggle-notification');


  if (!content || !drawerButton || !navigationDrawer) {
    console.error('Element untuk App tidak ditemukan. Pastikan #main-content, #drawer-button, dan #navigation-drawer ada di DOM.');
    return;
  }

  // Inisialisasi App dengan elemen drawer dan content
  const app = new App({
    content,
    drawerButton,
    navigationDrawer,
    toggleNotification,
  });

  // Render halaman awal
  await app.renderPage();

  // Setup "Skip to Content" link accessibility
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

  // Hash change untuk SPA routing
  window.addEventListener('hashchange', async () => {
    await app.renderPage();
  });

  // Register dan inisialisasi service worker
  try {
    console.log('Initializing service worker...');
    await registerServiceWorker();

    setInterval(checkForUpdates, 30 * 60 * 1000); // cek update tiap 30 menit

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        checkForUpdates();
      }
    });

    console.log('Service worker initialized successfully');
  } catch (error) {
    console.error('Service worker initialization failed:', error);
  }

  // Setup Push Notifications
  console.log('Setting up push notifications...');
  try {
    if (Notification.permission === 'granted') {
      await subscribeUserToPush();
      console.log('✅ Push notifications setup completed');
    } else if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await subscribeUserToPush();
        console.log('✅ Push notifications setup completed');
      } else {
        console.log('❌ User denied notification permission');
      }
    } else {
      console.log('❌ Push notifications blocked:', Notification.permission);
    }
  } catch (error) {
    console.error('Push notification setup failed:', error);
  }

  // Debug tools untuk push notifications
  window.pushDebug = {
    subscribe: subscribeUserToPush,
    unsubscribe: unsubscribeUserFromPush,
    checkStatus: checkPushSubscriptionStatus,
    permission: () => Notification.permission,
  };

  console.log('🔔 Push notification debug tools available:');
  console.log('  - window.pushDebug.subscribe()');
  console.log('  - window.pushDebug.unsubscribe()');
  console.log('  - window.pushDebug.checkStatus()');
  console.log('  - window.pushDebug.permission()');
});
