import { getStoryDetail } from '../../data/api';

class StoryDetailPresenter {
  constructor(view) {
    this.view = view;
  }

  async loadStoryDetail(id, token) {
    try {
      const response = await getStoryDetail({ id, token });
      if (response.error) {
        this.view.showError(response.message);
        return;
      }
      this.view.showStoryDetail(response.story);
    } catch (error) {
      this.view.showError(error.message);
    }
  }
}

export default StoryDetailPresenter;
