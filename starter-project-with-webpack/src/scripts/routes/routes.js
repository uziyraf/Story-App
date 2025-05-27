const routes = {
  '/': async () => {
    const module = await import('../pages/home/home-page.js');
    return new module.default();
  },
  '/about': async () => {
    const module = await import('../pages/about/about-page.js');
    return new module.default();
  },
  '/login': async () => {
    const module = await import('../pages/auth/login/login-page.js');
    return new module.default();
  },
  '/register': async () => {
    const module = await import('../pages/auth/register/register-page.js');
    return new module.default();
  },
  '/addstory': async () => {
    const pageModule = await import('../pages/addStory/addstory-page.js');
    const presenterModule = await import('../pages/addStory/addStory-presenter.js');
    const page = new pageModule.default();
    const presenter = new presenterModule.default(page);
    page.setPresenter(presenter);
    return page;
  },
};

export default routes;
