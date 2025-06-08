import { getStoryDetail } from '../../data/api';
import { saveReport } from '../../data/database';

class StoryDetailPresenter {
  constructor(view) {
    this.view = view;
    this.currentStory = null;
  }

  async loadStoryDetail(id, token) {
    try {
      const response = await getStoryDetail({ id, token });
      if (response.error) {
        this.view.showError(response.message);
        return;
      }
      this.currentStory = response.story;
      this.view.showStoryDetail(this.currentStory);
      this._setupSaveButton();
    } catch (error) {
      this.view.showError(error.message);
    }
  }

  _setupSaveButton() {
    const saveButton = document.getElementById('save-story-button');
    if (saveButton) {
      saveButton.addEventListener('click', async () => {
        try {
          await saveReport(this.currentStory);
          alert('Story saved successfully!');
        } catch (error) {
          console.error('Failed to save story:', error);
          alert('Failed to save story.');
        }
      });
    }
  }
}

export default StoryDetailPresenter;
