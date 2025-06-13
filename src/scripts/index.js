// Import regenerator-runtime untuk async/await support
import 'regenerator-runtime/runtime';

// CSS imports
import '../styles/styles.css';

import App from './pages/app';
import { registerServiceWorker } from './utils';

const initializeApp = async () => {
  try {
    // Register service worker first
    await registerServiceWorker();

    // Initialize main app
    const app = new App({
      content: document.querySelector('#main-content'),
      drawerButton: document.querySelector('#drawer-button'),
      navigationDrawer: document.querySelector('#navigation-drawer'),
    });

    // Render initial page
    await app.renderPage();

    // Setup skip link handler
    setupSkipLink();

    // Setup hash change listener
    window.addEventListener('hashchange', async () => {
      try {
        await app.renderPage();
      } catch (error) {
        console.error('Error rendering page:', error);
      }
    });

  } catch (error) {
    console.error('Failed to initialize app:', error);
  }
};

const setupSkipLink = () => {
  const skipLink = document.querySelector('.skipToContent');
  if (skipLink) {
    skipLink.addEventListener('click', (event) => {
      event.preventDefault();
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        mainContent.setAttribute('tabindex', '-1');
        mainContent.focus();
        window.scrollTo({
          top: mainContent.offsetTop,
          behavior: 'smooth'
        });
      }
    });
  }
};

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}