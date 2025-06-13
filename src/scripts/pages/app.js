import routes from '../routes/routes';
import { getActiveRoute } from '../routes/url-parser';

// Perbaiki path import - hapus 'scripts/' dari path
import { subscribeUserToPush, unsubscribeUserFromPush } from '../pages/notifications/notification-manager';
import {
  generateSubscribeButtonTemplate,
  generateUnsubscribeButtonTemplate
} from '../template';

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;
  #currentPage = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this._setupDrawer();
    this._renderNavbar();
    
    // Test notification support
    this._testNotificationSupport();
    
    // Initialize push subscription when app starts
    this._initPushSubscription();
  }

  async _testNotificationSupport() {
    console.log('Testing notification support...');
    
    // Check if Notification API is supported
    if (!('Notification' in window)) {
      console.error('Notification API not supported');
      alert('Browser Anda tidak mendukung notifikasi.');
      return;
    }
    console.log('Notification API is supported');
    
    // Check if Service Worker API is supported
    if (!('serviceWorker' in navigator)) {
      console.error('Service Worker API not supported');
      alert('Browser Anda tidak mendukung Service Worker.');
      return;
    }
    console.log('Service Worker API is supported');
    
    // Check if Push API is supported
    if (!('PushManager' in window)) {
      console.error('Push API not supported');
      alert('Browser Anda tidak mendukung Push API.');
      return;
    }
    console.log('Push API is supported');
    
    // Check current notification permission
    console.log('Current notification permission:', Notification.permission);
    
    // Check service worker registration
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      console.log('Service worker registration:', registration);
      
      if (registration) {
        // Check current push subscription
        const subscription = await registration.pushManager.getSubscription();
        console.log('Current push subscription:', subscription);
      } else {
        console.warn('No service worker registered');
      }
    } catch (error) {
      console.error('Error checking service worker:', error);
    }
  }

  async _initPushSubscription() {
    try {
      if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('Push notifications not supported');
        return;
      }
      
      // Check if user is logged in
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.log('User not logged in, skipping push subscription check');
        return;
      }
      
      // Check current subscription status
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      // Update localStorage based on actual subscription status
      if (subscription) {
        localStorage.setItem('isSubscribed', 'true');
      } else {
        localStorage.setItem('isSubscribed', 'false');
      }
      
      // Update UI
      this._renderNavbar();
    } catch (error) {
      console.error('Error initializing push subscription:', error);
    }
  }

  _setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      this.#navigationDrawer.classList.toggle('open');
    });

    document.body.addEventListener('click', (event) => {
      if (
        !this.#navigationDrawer.contains(event.target) &&
        !this.#drawerButton.contains(event.target)
      ) {
        this.#navigationDrawer.classList.remove('open');
      }

      this.#navigationDrawer.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove('open');
        }
      });
    });
  }

  async renderPage() {
    if (this.#currentPage && typeof this.#currentPage.cleanup === 'function') {
      this.#currentPage.cleanup();
    }

    const url = getActiveRoute();
    const pageLoader = routes[url];
    if (!pageLoader) {
      this.#content.innerHTML = '<h2>Page Not Found</h2>';
      return;
    }

    // Add fade-out class and wait for animation to finish
    this.#content.classList.add('fade-out');
    await new Promise((resolve) => {
      this.#content.addEventListener('animationend', resolve, { once: true });
    });

    const page = await pageLoader();

    const rendered = await page.render();
    if (typeof rendered === 'string') {
      this.#content.innerHTML = rendered;
    } else if (rendered instanceof HTMLElement) {
      this.#content.innerHTML = '';
      this.#content.appendChild(rendered);
    } else {
      this.#content.innerHTML = '';
    }

    // Remove fade-out and add fade-in class
    this.#content.classList.remove('fade-out');
    this.#content.classList.add('fade-in');

    await page.afterRender();
    this._renderNavbar();
    this._initPushSubscription();


    // Remove fade-in class after animation
    this.#content.addEventListener(
      'animationend',
      () => {
        this.#content.classList.remove('fade-in');
      },
      { once: true }
    );

    this.#currentPage = page;
  }

  _renderNavbar() {
    const navList = this.#navigationDrawer.querySelector('#nav-list');
    const token = localStorage.getItem('accessToken');
    navList.innerHTML = '';

    if (token) {
      // User is logged in
      navList.innerHTML = `
        <li><a href="#/">Beranda</a></li>
        <li><a href="#/about">About</a></li>
        <li><a href="#/savedstory">Saved Story</a></li>
        <li id="subscribe-container"></li>
        <li><a href="#/logout" id="logout-link">Logout</a></li>
      `;

      const subscribeContainer = navList.querySelector('#subscribe-container');
      const isSubscribed = localStorage.getItem('isSubscribed') === 'true';

      const renderSubscribeButton = () => {
        subscribeContainer.innerHTML = generateSubscribeButtonTemplate();
        const subscribeButton = subscribeContainer.querySelector('#subscribe-button');
        subscribeButton.addEventListener('click', async () => {
          try {
            console.log('Subscribe button clicked');
            
            // Minta izin notifikasi terlebih dahulu
            console.log('Requesting notification permission...');
            const granted = await this._requestNotificationPermission();
            console.log('Notification permission granted:', granted);
            
            if (!granted) {
              this.showNotification('Anda harus mengizinkan notifikasi untuk berlangganan.', false);
              return;
            }
            
            // Gunakan subscribeUserToPush
            console.log('Calling subscribeUserToPush...');
            const success = await subscribeUserToPush();
            console.log('subscribeUserToPush result:', success);
            
            if (success) {
              localStorage.setItem('isSubscribed', 'true');
              renderUnsubscribeButton();
              this.showNotification('Berhasil berlangganan notifikasi!', true);
            }
          } catch (error) {
            console.error('Subscribe failed:', error);
            this.showNotification('Gagal berlangganan: ' + error.message, false);
          }
        });
      };

      const renderUnsubscribeButton = () => {
        subscribeContainer.innerHTML = generateUnsubscribeButtonTemplate();
        const unsubscribeButton = subscribeContainer.querySelector('#unsubscribe-button');
          unsubscribeButton.addEventListener('click', async () => {
            try {
              // Use unsubscribeUserFromPush instead of unsubscribe
              const success = await unsubscribeUserFromPush();
              if (success) {
                localStorage.setItem('isSubscribed', 'false');
                renderSubscribeButton();
                this.showNotification('Berhasil berhenti berlangganan notifikasi!', true);
              }
            } catch (error) {
              console.error('Unsubscribe failed:', error);
              this.showNotification('Gagal berhenti berlangganan: ' + error.message, false);
            }
          });
      };

      if (isSubscribed) {
        renderUnsubscribeButton();
      } else {
        renderSubscribeButton();
      }

      const logoutLink = navList.querySelector('#logout-link');
      logoutLink.addEventListener('click', (event) => {
        event.preventDefault();
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userName');
        localStorage.removeItem('isSubscribed');
        this._renderNavbar();
        window.location.hash = '#/login';
      });
    } else {
      // User is not logged in
      navList.innerHTML = `
        <li><a href="#/login">Login</a></li>
        <li><a href="#/register">Register</a></li>
      `;
    }
  }

  async _requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.error('Notification API not supported');
      alert('Browser Anda tidak mendukung notifikasi.');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      console.log('Notification permission already granted');
      return true;
    }
    
    try {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  showNotification(message, isSuccess = true) {
    // Tambahkan overlay latar belakang
    const overlay = document.createElement('div');
    overlay.className = 'notification-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.zIndex = '9999';
    document.body.appendChild(overlay);
    
    // Buat notifikasi
    const notificationElement = document.createElement('div');
    notificationElement.className = `notification ${isSuccess ? 'success' : 'error'}`;
    notificationElement.innerHTML = `
      <div class="notification-content">
        <span>${message}</span>
        <button class="close-notification">×</button>
      </div>
    `;
    
    document.body.appendChild(notificationElement);
    
    // Tambahkan event listener untuk tombol close
    const closeButton = notificationElement.querySelector('.close-notification');
    closeButton.addEventListener('click', () => {
      notificationElement.classList.add('fade-out');
      overlay.classList.add('fade-out');
      setTimeout(() => {
        if (document.body.contains(notificationElement)) {
          document.body.removeChild(notificationElement);
        }
        if (document.body.contains(overlay)) {
          document.body.removeChild(overlay);
        }
      }, 300);
    });
    
    // Otomatis hilangkan notifikasi setelah 3 detik
    setTimeout(() => {
      if (document.body.contains(notificationElement)) {
        notificationElement.classList.add('fade-out');
        overlay.classList.add('fade-out');
        setTimeout(() => {
          if (document.body.contains(notificationElement)) {
            document.body.removeChild(notificationElement);
          }
          if (document.body.contains(overlay)) {
            document.body.removeChild(overlay);
          }
        }, 300);
      }
    }, 3000);
  }
}

export default App;











