import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';

// Pastikan CONFIG tersedia atau buat fallback
const CONFIG = {
  BASE_URL: 'https://story-api.dicoding.dev/v1',
};

// Precache dan route file-file static
precacheAndRoute(self.__WB_MANIFEST || []);

// Cache API responses dengan fallback
registerRoute(
  ({ request, url }) => {
    const baseUrl = new URL(CONFIG.BASE_URL);
    return baseUrl.origin === url.origin && request.destination !== 'image';
  },
  new NetworkFirst({
    cacheName: 'story-api',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
    networkTimeoutSeconds: 3, // Timeout setelah 3 detik
  })
);

// Cache images
registerRoute(
  ({ request, url }) => {
    const baseUrl = new URL(CONFIG.BASE_URL);
    return baseUrl.origin === url.origin && request.destination === 'image';
  },
  new StaleWhileRevalidate({
    cacheName: 'story-api-images',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Cache halaman dan aset statis
registerRoute(
  ({ request }) => request.destination === 'document' || 
                   request.destination === 'style' || 
                   request.destination === 'script' || 
                   request.destination === 'font',
  new StaleWhileRevalidate({
    cacheName: 'static-resources',
  })
);

// Cache gambar
registerRoute(
  ({ request }) => request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'images',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('Service worker received push event');

  const chainPromise = async () => {
    try {
      if (!event.data) {
        console.log('No data in push event');
        // Show a default notification
        await self.registration.showNotification('New Notification', {
          body: 'You received a new notification',
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          tag: 'story-app-notification',
          data: {
            url: '#/home'
          },
          requireInteraction: true,
        });
        return;
      }

      let data;
      let textData;
      
      try {
        // Try to parse as JSON
        textData = event.data.text();
        console.log('Raw push data:', textData);
        
        try {
          // Try to parse the text as JSON
          data = JSON.parse(textData);
          console.log('Push data parsed as JSON:', data);
        } catch (jsonError) {
          console.log('Push data is not valid JSON, using as text');
          // Create a simple data object
          data = {
            title: 'New Notification',
            body: textData,
          };
        }
      } catch (error) {
        console.error('Error getting push data:', error);
        // Create a default data object
        data = {
          title: 'New Notification',
          body: 'You received a new notification',
        };
      }
      
      await self.registration.showNotification(data.title || 'New Story', {
        body: data.options?.body || data.body || 'Someone posted a new story!',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'story-app-notification',
        data: {
          url: data.url || '#/home'
        },
        requireInteraction: true,
      });
    } catch (error) {
      console.error('Error handling push event:', error);
      
      // Show a fallback notification in case of error
      try {
        await self.registration.showNotification('New Notification', {
          body: 'You received a new notification',
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          tag: 'story-app-notification',
          data: {
            url: '#/home'
          },
          requireInteraction: true,
        });
      } catch (notificationError) {
        console.error('Error showing fallback notification:', notificationError);
      }
    }
  };

  event.waitUntil(chainPromise());
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '#/home';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(urlToOpen);
            return;
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  event.waitUntil(self.clients.claim());
});

// Fallback untuk API yang tidak tersedia offline
self.addEventListener('fetch', (event) => {
  // Hanya tangani permintaan ke API
  if (event.request.url.includes(CONFIG.BASE_URL)) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              
              // Jika tidak ada cache, kembalikan respons fallback
              return new Response(
                JSON.stringify({
                  error: true,
                  message: 'Anda sedang offline. Silakan coba lagi nanti.',
                  listStory: [] // Kembalikan array kosong untuk listStory
                }),
                {
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            });
        })
    );
  }
});

