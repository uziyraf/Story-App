import { loginUser } from '../../../data/api';

class LoginPresenter {
  constructor(view) {
    this.view = view;
  }

  async login({ email, password }) {
    try {
      this.view.showLoading();
      const response = await loginUser({ email, password });
      if (response.error) {
        this.view.showError(response.message || 'Login failed');
      } else {
        // Save token to localStorage with key 'accessToken' to match app.js
        if (response.loginResult && response.loginResult.token) {
          localStorage.setItem('accessToken', response.loginResult.token);
          localStorage.setItem('userName', response.loginResult.name);
        }
        this.view.showSuccess();
        // Notify app or redirect can be handled here if needed
        window.location.hash = '#/';
      }
    } catch (error) {
      this.view.showError(error.message || 'An error occurred');
    }
  }
}

export default LoginPresenter;
