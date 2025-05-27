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
        if (response.loginResult && response.loginResult.token) {
          localStorage.setItem('token', response.loginResult.token);
          localStorage.setItem('userName', response.loginResult.name);
        }
        this.view.showSuccess();
        window.location.hash = '#/';
      }
    } catch (error) {
      this.view.showError(error.message || 'An error occurred');
    }
  }
}

export default LoginPresenter;
