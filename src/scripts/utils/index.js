export function showFormattedDate(date, locale = 'en-US', options = {}) {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
}

export function sleep(time = 1000) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export function isServiceWorkerAvailable() {
  return 'serviceWorker' in navigator;
}
 
export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not supported in the browser');
    return null;
  }

  try {
    // Ubah path agar berfungsi di Netlify
    const swPath = '/sw.bundle.js';
    console.log('Registering service worker at path:', swPath);
    
    // Tambahkan scope eksplisit
    const registration = await navigator.serviceWorker.register(swPath, {
      scope: '/'
    });
    console.log('Service worker registered successfully:', registration);
    
    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;
    console.log('Service worker is ready');
    
    // Handle update
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          console.log('Service worker state changed to:', newWorker.state);
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('New service worker available');
            if (confirm('New version available! Reload to update?')) {
              window.location.reload();
            }
          }
        });
      }
    });
    
    return registration;
  } catch (error) {
    console.error('Failed to register service worker:', error);
    return null;
  }
};

export function convertBase64ToUint8Array(base64String) {
  // First, ensure we're working with a proper base64 string
  // by replacing web-safe characters with standard base64 characters
  const normalizedBase64 = base64String.replace(/-/g, '+').replace(/_/g, '/');
  
  // Add padding if needed
  const padding = '='.repeat((4 - (normalizedBase64.length % 4)) % 4);
  const base64 = normalizedBase64 + padding;
  
  // Convert base64 to binary string
  const rawData = window.atob(base64);
  
  // Convert binary string to Uint8Array
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}








