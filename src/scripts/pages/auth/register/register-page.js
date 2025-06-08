import RegisterPresenter from './register-presenter';

class RegisterPage {
  #presenter;

  constructor() {
    this.#presenter = new RegisterPresenter(this);
    this.root = document.createElement('div');
    this.root.className = 'register-container';
  }

  render() {
    this.root.innerHTML =
      '<h2>Register</h2>' +
      '<form id="register-form">' +
      '<label for="name">Name:</label>' +
      '<input type="text" id="name" name="name" required />' +
      '<br/>' +
      '<label for="email">Email:</label>' +
      '<input type="email" id="email" name="email" required />' +
      '<br/>' +
      '<label for="password">Password:</label>' +
      '<input type="password" id="password" name="password" required minlength="8" />' +
      '<br/>' +
      '<button type="submit">Register</button>' +
      '</form>' +
      '<div id="message"></div>';

    this.form = this.root.querySelector('#register-form');
    this.message = this.root.querySelector('#message');

    this.form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.message.textContent = '';
      const name = this.form.name.value;
      const email = this.form.email.value;
      const password = this.form.password.value;
      this.#presenter.register({ name, email, password });
    });

    return this.root;
  }

  afterRender() {
    // No additional actions after render for now
  }

  showLoading() {
    this.message.textContent = 'Registering...';
  }

  showError(error) {
    this.message.textContent = 'Error: ' + error;
  }

  showSuccess() {
    this.message.textContent = 'Registration successful!';
  }
}

export default RegisterPage;
