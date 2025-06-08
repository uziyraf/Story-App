import { getAllReports, deleteReport } from '../../data/database';

class SavedStoryPresenter {
  constructor(view) {
    this.view = view;
  }

  async loadSavedStories() {
    try {
      const savedStories = await getAllReports();
      this.view.renderSavedStories(savedStories);
      this._setupDeleteButtons();
    } catch (error) {
      console.error('Failed to load saved stories:', error);
      this.view.renderSavedStories([]);
    }
  }

  _setupDeleteButtons() {
    const deleteButtons = document.querySelectorAll('.delete-saved-story-button');
    deleteButtons.forEach(button => {
      button.addEventListener('click', async (event) => {
        const id = event.target.getAttribute('data-id');
        try {
          await deleteReport(id);
          await this.loadSavedStories(); // Refresh list after deletion
        } catch (error) {
          console.error('Failed to delete saved story:', error);
          alert('Failed to delete saved story.');
        }
      });
    });
  }
}

export default SavedStoryPresenter;
