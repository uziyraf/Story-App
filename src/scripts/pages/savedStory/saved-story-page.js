import Map from '../../utils/maps.js';

class SavedStoryPage {
  constructor() {
    this.savedStoriesContainer = null;
    this.presenter = null;
    this.mapInstances = {};
  }


  setPresenter(presenter) {
    this.presenter = presenter;
  }

  render() {
    return `
      <section class="saved-stories">
        <h1 style="text-align: center; margin-bottom: 24px;">Saved Stories</h2>
        <div id="saved-stories-container" class="saved-stories-container"></div>
      </section>
    `;
  }




  afterRender() {
    this.savedStoriesContainer = document.getElementById('saved-stories-container');
    if (this.presenter && typeof this.presenter.loadSavedStories === 'function') {
      this.presenter.loadSavedStories();
    }
  }



    renderSavedStories(stories) {
    if (!this.savedStoriesContainer) {
      console.error('savedStoriesContainer is null');
      return;
    }

    if (!stories || stories.length === 0) {
      this.savedStoriesContainer.innerHTML = '<p>No saved stories found.</p>';
      return;
    }

    this.savedStoriesContainer.innerHTML = stories.map(story => {
      return `
      <div class="story-card" data-id="${story.id}" style="border: 1px solid #ccc; border-radius: 8px; padding: 12px; box-sizing: border-box;">
        <img src="${story.photoUrl || (story.photo && story.photo.url) || ''}" alt="Photo of ${story.name || story.title || 'No Title'}" class="story-photo" />
        <h3 class="story-title">${story.name || story.title || 'No Title'}</h3>
        <p class="story-description location" style="flex-direction: column;">
          <span class="location-item"><span class="location-icon">📍</span> Latitude: ${String(story.lat || story.latitude).slice(0,10)}</span>
          <span class="location-item"><span class="location-icon">🧭</span> Longitude: ${String(story.lon || story.longitude).slice(0,10)}</span>
        </p>
        <div id="map-${story.id}" class="saved-story-map" style="height: 150px; border-radius: 8px; margin-top: 8px;"></div>
        <button class="delete-saved-story-button" data-id="${story.id}" style="background-color: #790707; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; margin-top: 8px; font-size: 0.875rem;">Delete</button>
      </div>
      `;
    }).join('');

    // Initialize maps for each story card
    stories.forEach(story => {
      const lat = story.lat || story.latitude;
      const lon = story.lon || story.longitude;
      if (lat != null && lon != null) {
        const mapId = `map-${story.id}`;
        if (!this.mapInstances[mapId]) {
          const mapInstance = new Map(mapId);
          mapInstance.initMap([lat, lon], 13);
          mapInstance.addMarker([lat, lon], { title: story.name || story.title || 'No Title' });
          this.mapInstances[mapId] = mapInstance;
        }
      }
    });
  }

}

export default SavedStoryPage;
