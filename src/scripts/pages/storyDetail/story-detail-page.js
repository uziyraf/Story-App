class StoryDetailPage {
  constructor() {
    this.modal = null;
    this.closeButton = null;
    this.storyDetailContainer = null;
    this.modalContent = null;
  }

  render() {
    return `
      <div id="story-detail-modal" class="modal" style="view-transition-name: story-detail-modal">
        <div class="modal-content" id="modal-content" style="view-transition-name: story-detail-content">
          <span id="close-modal" class="close-button">&times;</span><br>
          <div id="story-detail-container"></div>
          <div id="story-map" style="height: 300px; margin-top: 10px;"></div>
          <button id="save-story-button" class="save-story-button">Save Story</button>
        </div>
      </div>
    `;
  }

  afterRender() {
    this.modal = document.getElementById('story-detail-modal');
    this.closeButton = document.getElementById('close-modal');
    this.storyDetailContainer = document.getElementById(
      'story-detail-container'
    );
    this.modalContent = document.querySelector('.modal-content');

    this.closeButton.addEventListener('click', () => {
      this.hideWithTransition();
    });

    window.addEventListener('click', (event) => {
      if (event.target === this.modal) {
        this.hideWithTransition();
      }
    });
  }

  show() {
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        this.modal.classList.add('show');
        this.modalContent.classList.remove('closing');
      });
    } else {
      this.modal.classList.add('show');
      this.modalContent.classList.remove('closing');
    }
  }

  hide() {
    this.modal.classList.remove('show');
  }

  hideWithTransition() {
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        this.modalContent.classList.add('closing');
        setTimeout(() => {
          this.modal.classList.remove('show');
          this.modalContent.classList.remove('closing');
        }, 300);
      });
    } else {
      this.modal.classList.remove('show');
    }
  }

  async showStoryDetail(story) {
    this.storyDetailContainer.innerHTML = `
    <div class="story-detail-photo-container">
      <img src="${story.photoUrl}" alt="Photo of ${story.name}" class="story-detail-photo" />
    </div>
    <div class="story-detail-content">
      <h2 class="story-detail-title">${story.name}</h2>
      <p class="story-detail-description">${story.description}</p>
      <p class="location" style="flex-direction: row;">
      <span class="location-item"><span class="location-icon">📍</span> Latitude: ${String(story.lat).slice(0,10)}</span>
      <span class="location-item"><span class="location-icon">🧭</span> Longitude: ${String(story.lon).slice(0,10)}</span>
      </p>
      <small>Created at: ${new Date(story.createdAt).toLocaleString()}</small>
    </div>
    `;

    if (story.lat && story.lon) {
      if (!this.map) {
        const Map = (await import('../../utils/maps')).default;
        this.map = new Map('story-map');
        this.map.initMap([story.lat, story.lon], 13);
        this.markers = [];
      } else {
        this.map.setView([story.lat, story.lon], 13);
        this.markers.forEach(marker => this.map.map.removeLayer(marker));
        this.markers = [];
      }
      const marker = this.map.addMarker([story.lat, story.lon], { title: story.name });
      this.markers.push(marker);
    }
  }
}

export default StoryDetailPage;
