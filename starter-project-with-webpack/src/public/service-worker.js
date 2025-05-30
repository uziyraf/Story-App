const CACHE_VERSION = 'v1.0.1';
const CACHE_NAME = `app-cache-${CACHE_VERSION}`;

const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/styles/styles.css',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// Instalasi: Cache aset statis
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_CACHE_URLS))
      .then(() => self.skipWaiting())
      .catch(err => console.error('[ServiceWorker] Caching failed:', err))
  );
});

// Aktivasi: Hapus cache lama
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            console.log('[ServiceWorker] Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Strategi Cache First
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const network = await fetch(request);
    if (network && network.status === 200) {
      cache.put(request, network.clone());
    }
    return network;
  } catch (err) {
    return caches.match('/offline.html');
  }
}

// Strategi Network First untuk API
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    return cached || new Response('Offline data not available', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

// Cek tipe resource
function isStaticAsset(url) {
  return /\.(?:css|js|png|jpg|jpeg|gif|svg|ico|woff2?)$/.test(url.pathname);
}

function isApiRequest(url) {
  return url.pathname.startsWith('/api/') || url.hostname.includes('api');
}

// Fetch Event Handler
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || !url.protocol.startsWith('http')) return;

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
  } else if (isApiRequest(url)) {
    event.respondWith(networkFirst(request));
  } else {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, networkResponse.clone());
            });
          }
          return networkResponse;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});

// Push Notification Handler
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push event received');

  let data = {
    title: 'New Notification',
    body: 'You have new content!',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'general-notification',
    requireInteraction: false,
    data: { url: '/' }
  };

  if (event.data) {
    try {
      const json = event.data.json();
      data = { ...data, ...json };
      if (!data.data) data.data = { url: data.url || '/' };
    } catch (err) {
      data.body = event.data.text(); // fallback untuk plain text
    }
  }

  event.waitUntil(
    (async () => {
      try {
        await self.registration.showNotification(data.title, {
          body: data.body,
          icon: data.icon,
          badge: data.badge,
          tag: data.tag,
          requireInteraction: data.requireInteraction,
          data: data.data,
          actions: data.actions || [],
        });
      } catch (err) {
        console.warn('[ServiceWorker] Notification error:', err.message);
      }
    })()
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  if (event.action === 'close') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientsArr => {
      for (const client of clientsArr) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// Message listener (e.g. skipWaiting)
self.addEventListener('message', (event) => {
  if (!event.data) return;
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    default:
      break;
  }
});
