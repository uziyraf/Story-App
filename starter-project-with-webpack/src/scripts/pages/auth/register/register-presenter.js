import { registerUser } from '../../../data/api';

class RegisterPresenter {
  constructor(view) {
    this.view = view;
  }

  async register({ name, email, password }) {
    try {
      this.view.showLoading();
      const response = await registerUser({ name, email, password });
      if (response.error) {
        this.view.showError(response.message || 'Registration failed');
      } else {
        if (response.registerResult && response.registerResult.token) {
          localStorage.setItem('token', response.registerResult.token);
          localStorage.setItem('userName', response.registerResult.name);
        }
        this.view.showSuccess();
        window.location.hash = '#/login';
      }
    } catch (error) {
      this.view.showError(error.message || 'An error occurred');
    }
  }
}

export default RegisterPresenter;
