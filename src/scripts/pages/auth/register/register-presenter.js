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
        // Save token to localStorage if available
        if (response.registerResult && response.registerResult.token) {
          localStorage.setItem('accessToken', response.registerResult.token);
          localStorage.setItem('userName', response.registerResult.name);
        }
        this.view.showSuccess();
        // Redirect to login or home page after registration
        window.location.hash = '#/login';
      }
    } catch (error) {
      this.view.showError(error.message || 'An error occurred');
    }
  }
}

export default RegisterPresenter;
