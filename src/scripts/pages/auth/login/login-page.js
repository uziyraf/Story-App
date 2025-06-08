import LoginPresenter from './login-presenter';

class LoginPage {
  #presenter;

  constructor() {
    this.#presenter = new LoginPresenter(this);
    this.root = document.createElement('div');
    this.root.className = 'login-container';
  }

  render() {
    this.root.innerHTML = `
      <h2>Login</h2>
      <form id="login-form">
        <label for="email">Email:</label>
        <input type="email" id="email" name="email" required />
        <br/>
        <label for="password">Password:</label>
        <input type="password" id="password" name="password" required minlength="8" />
        <br/>
        <button type="submit">Login</button>
      </form>
      <div id="message"></div>
    `;

    this.form = this.root.querySelector('#login-form');
    this.message = this.root.querySelector('#message');

    this.form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.message.textContent = '';
      const email = this.form.email.value;
      const password = this.form.password.value;
      this.#presenter.login({ email, password });
    });

    return this.root;
  }

  afterRender() {
    // No additional actions after render for now
  }

  showLoading() {
    this.message.textContent = 'Logging in...';
  }

  showError(error) {
    this.message.textContent = `Error: ${error}`;
  }

  showSuccess() {
    this.message.textContent = 'Login successful!';
  }
}

export default LoginPage;
