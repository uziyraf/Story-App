import { addNewStory } from '../../data/api';

export default class AddStoryPresenter {
  constructor(view) {
    this.view = view;
  }

  async addNewStory(formData, token) {
    try {
      const description = formData.get('description');
      const photo = formData.get('photo');
      const lat = formData.get('lat');
      const lon = formData.get('lon');

      const response = await addNewStory({
        token,
        description,
        photo,
        lat,
        lon,
      });
      if (response.error) {
        throw new Error(response.message || 'Failed to add story');
      }
      return response;
    } catch (error) {
      throw error;
    }
  }
}
