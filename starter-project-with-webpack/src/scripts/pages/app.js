import routes from '../routes/routes';
import { getActiveRoute } from '../routes/url-parser';

import {
  subscribeUserToPush,
  unsubscribeUserFromPush,
} from './notifications/notification-manager';

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

    this._initPushSubscription();
  }

  async _initPushSubscription() {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await subscribeUserToPush();
      }
    } catch (error) {
      console.error('Push subscription failed:', error);
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

    this.#content.classList.remove('fade-out');
    this.#content.classList.add('fade-in');

    await page.afterRender();
    this._renderNavbar();
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
    const token = localStorage.getItem('token');
    navList.innerHTML = '';

    if (token) {
      navList.innerHTML = `
        <li><a href="#/">Home</a></li>
        <li><a href="#/addstory">Add Story</a></li>
        <li><a href="#/about">About</a></li>
        <li><a href="#/logout" id="logout-link">Logout</a></li>
      `;
      const logoutLink = navList.querySelector('#logout-link');
      logoutLink.addEventListener('click', (event) => {
        event.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('userName');
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
}

export default App;
