import HomePresenter from './home-presenter';
import StoryDetailPage from '../storyDetail/story-detail-page';
import StoryDetailPresenter from '../storyDetail/story-detail-presenter';

export default class HomePage {
  constructor() {
    this.presenter = new HomePresenter(this);
    this.storyDetailPage = new StoryDetailPage();
    this.storyDetailPresenter = new StoryDetailPresenter(this.storyDetailPage);
  }

  async render() {
    const token = localStorage.getItem('token');
    return `
      <section class="container">
        <h1>Home Page</h1>
        ${token ? '<a href="#/addstory" id="add-story-button" class="add-story-button" title="Add Story">+</a><div id="map-container" style="height: 400px; margin-bottom: 20px;"></div>' : ''}
        <div id="loading" class="loading-spinner"></div>
        <div id="stories-container" class="stories-container" style="display:none;"></div>
        ${this.storyDetailPage.render()}
      </section>
    `;
  }

  async afterRender() {
    this.storyDetailPage.afterRender();
    this.showLoading();

    setTimeout(() => {
      this.presenter.loadStories();
    }, 2000);

    const storiesContainer = document.getElementById('stories-container');

    if (storiesContainer) {
      storiesContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('details-btn')) {
          const storyId = event.target.getAttribute('data-id');
          const token = localStorage.getItem('token');
          if (storyId && token) {
            this.storyDetailPresenter.loadStoryDetail(storyId, token);
            this.storyDetailPage.show();
          }
        }
      });
    }

    const token = localStorage.getItem('token');
    if (token && !this.map) {
      const Map = (await import('../../utils/maps')).default;
      this.map = new Map('map-container');
      this.map.initMap([0, 0], 2);
      this.markers = [];
    }
  }

  showLoading() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('stories-container').style.display = 'none';
  }

  hideLoading() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('stories-container').style.display = 'grid';
  }

  showStories(stories) {
    this.hideLoading();
    const storiesContainer = document.getElementById('stories-container');
    storiesContainer.innerHTML = '';

    if (this.markers) {
      this.markers.forEach(marker => this.map.map.removeLayer(marker));
      this.markers = [];
    }

    stories.forEach((story) => {
      const card = document.createElement('div');
      card.className = 'story-card view-transition-enter';
      card.innerHTML = `
        <img src="${story.photoUrl}" alt="Photo of ${story.name}" class="story-photo" />
        <h3 class="story-title">${story.name}</h3>
        <p class="story-description location" style="flex-direction: column;">
        <span class="location-item"><span class="location-icon">📍</span> Latitude: ${String(story.lat).slice(0,10)}</span>
        <span class="location-item"><span class="location-icon">🧭</span> Longitude: ${String(story.lon).slice(0,10)}</span>
        </p>
        <small>Created at: ${new Date(story.createdAt).toLocaleString()}</small>
        <button class="details-btn" data-id="${story.id}">Detail</button>
      `;
      storiesContainer.appendChild(card);

      if (this.map && story.lat && story.lon) {
        const marker = this.map.addMarker([story.lat, story.lon], { title: story.name });
        marker.on('click', () => {
          const token = localStorage.getItem('token');
          if (token) {
            this.storyDetailPresenter.loadStoryDetail(story.id, token);
            this.storyDetailPage.show();
          }
        });
        this.markers.push(marker);
      }
      card.addEventListener('animationend', () => {
        card.classList.remove('view-transition-enter');
      });
    });
  }

  showMessage(message) {
    this.hideLoading();
    const storiesContainer = document.getElementById('stories-container');
    storiesContainer.innerHTML = `<p>${message}</p>`;
    storiesContainer.style.display = 'block';
  }
}
