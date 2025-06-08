import { getAllStories } from '../../data/api';

class HomePresenter {
  constructor(view) {
    this.view = view;
    this.page = 1;
    this.size = 10;
  }

  async loadStories() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      this.view.showMessage('Please login to see stories.');
      return;
    }

    try {
      const response = await getAllStories({
        token,
        page: this.page,
        size: this.size,
        location: 0,
      });
      if (response.error) {
        this.view.showMessage(`Error: ${response.message}`);
        return;
      }
      this.view.showStories(response.listStory);
    } catch (error) {
      this.view.showMessage(`Error: ${error.message}`);
    }
  }
}

export default HomePresenter;
