import Map from '../../utils/maps';
import Camera from '../../utils/camera';

export default class AddStoryPage {
  #takenDocumentations = [];

  constructor() {
    this.map = null;
    this.selectedLatLng = null;
    this.marker = null;
    this.defaultLatLng = [-2.5489, 118.0149]; // Indonesia center
    this.camera = null;
  }

  cleanup() {
    if (this.camera) {
      this.camera.stop();
      import('../../utils/camera').then(({ default: Camera }) => {
        Camera.stopAllStreams();
      });
    }
  }

  render() {
    return `
      <section class="container">
        <h1>Add New Story</h1>
        <form id="add-story-form">

          <label for="description">Description:</label>
          <textarea id="description" name="description" required></textarea>

          <label for="photo">Photo:</label>
          <input type="file" id="photo" name="photo" accept="image/*" required />

          <div id="camera-section" style="margin-top: 10px;">
            <button type="button" id="open-camera-btn">Open Camera</button>
            <button type="button" id="close-camera-btn" style="display:none; margin-left: 10px;">Close Camera</button>
            <select id="camera-select" style="display:none; margin-left: 10px;"></select>
            <button type="button" id="capture-btn" style="display:none; margin-left: 10px;">Capture</button>
            <button type="button" id="retake-btn" style="display:none; margin-left: 10px;">Retake</button>
            <div style="margin-top: 10px;">
              <video id="camera-preview" autoplay playsinline style="max-width: 100%; display:none; border: 1px solid #ccc;"></video>
              <canvas id="camera-canvas" style="display:none; border: 1px solid #ccc; margin-top: 10px;"></canvas>
            </div>
          </div>

          <label>Location (optional):</label>
          <div id="map" style="height: 300px; margin-bottom: 10px;"></div>
          <input type="text" id="lat" name="lat" placeholder="Latitude" readonly />
          <input type="text" id="lon" name="lon" placeholder="Longitude" readonly />

          <button type="submit">Submit</button>
        </form>
        <div id="message"></div>
      </section>
    `;
  }

  async afterRender() {
    this.initMap();
    var videoElement = document.getElementById('camera-preview');
    var canvasElement = document.getElementById('camera-canvas');
    var cameraSelect = document.getElementById('camera-select');
    var openCameraBtn = document.getElementById('open-camera-btn');
    var closeCameraBtn = document.getElementById('close-camera-btn');
    var captureBtn = document.getElementById('capture-btn');
    var retakeBtn = document.getElementById('retake-btn');
    var photoInput = document.getElementById('photo');

    this.camera = new Camera({
      video: videoElement,
      cameraSelect: cameraSelect,
      canvas: canvasElement,
    });

    openCameraBtn.addEventListener('click', async () => {
      try {
        await this.camera.launch();
        videoElement.style.display = 'block';
        captureBtn.style.display = 'inline-block';
        cameraSelect.style.display = 'inline-block';
        openCameraBtn.style.display = 'none';
        closeCameraBtn.style.display = 'inline-block';
        retakeBtn.style.display = 'none';
      } catch (error) {
        this.showMessage('Camera access denied or not available.');
      }
    });

    closeCameraBtn.addEventListener('click', () => {
      this.camera.stop();
      Camera.stopAllStreams();
      videoElement.style.display = 'none';
      canvasElement.style.display = 'none';
      openCameraBtn.style.display = 'inline-block';
      closeCameraBtn.style.display = 'none';
      captureBtn.style.display = 'none';
      cameraSelect.style.display = 'none';
      retakeBtn.style.display = 'none';
    });

    cameraSelect.addEventListener('change', async () => {
      await this.camera.launch();
    });

    captureBtn.addEventListener('click', async () => {
      var blob = await this.camera.takePicture();
      if (blob) {
        var file = new File([blob], 'captured-image.png', {
          type: 'image/png',
        });
        var dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        photoInput.files = dataTransfer.files;

        var url = URL.createObjectURL(blob);
        var context = canvasElement.getContext('2d');
        var img = new Image();
        img.onload = function () {
          canvasElement.width = img.width;
          canvasElement.height = img.height;
          context.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
        };
        img.src = url;

        canvasElement.style.display = 'block';
        videoElement.style.display = 'none';
        captureBtn.style.display = 'none';
        cameraSelect.style.display = 'none';
        openCameraBtn.style.display = 'inline-block';
        closeCameraBtn.style.display = 'none';
        retakeBtn.style.display = 'inline-block';
      }

      this.camera.stop();
      Camera.stopAllStreams();
    });

    retakeBtn.addEventListener('click', async () => {
      canvasElement.style.display = 'none';
      videoElement.style.display = 'block';
      captureBtn.style.display = 'inline-block';
      cameraSelect.style.display = 'inline-block';
      openCameraBtn.style.display = 'none';
      closeCameraBtn.style.display = 'inline-block';
      retakeBtn.style.display = 'none';
      photoInput.value = '';
      await this.camera.launch();
    });

    var form = document.getElementById('add-story-form');
    form.addEventListener(
      'submit',
      function (event) {
        event.preventDefault();
        this.handleSubmit();
      }.bind(this)
    );
  }

  initMap() {
    this.map = new Map('map');
    this.map.initMap(this.defaultLatLng, 5);

    this.map.map.on('click', (e) => {
      this.selectedLatLng = e.latlng;
      if (this.marker) {
        this.map.map.removeLayer(this.marker);
      }
      this.marker = this.map.addMarker(this.selectedLatLng);
      document.getElementById('lat').value = this.selectedLatLng.lat.toFixed(6);
      document.getElementById('lon').value = this.selectedLatLng.lng.toFixed(6);
    });
  }

  async handleSubmit() {
    var description = document.getElementById('description').value;
    var photoInput = document.getElementById('photo');
    var lat = document.getElementById('lat').value;
    var lon = document.getElementById('lon').value;

    if (photoInput.files.length === 0) {
      this.showMessage('Please select a photo.');
      return;
    }

    var photo = photoInput.files[0];
    var token = localStorage.getItem('accessToken');

    if (!token) {
      this.showMessage('You must be logged in to add a story.');
      return;
    }

    var formData = new FormData();
    formData.append('description', description);
    formData.append('photo', photo);
    if (lat) formData.append('lat', lat);
    if (lon) formData.append('lon', lon);

    try {
      await this.presenter.addNewStory(formData, token);
      const title = 'Story berhasil dibuat';
      const body =
        'Anda telah membuat story baru dengan deskripsi: ' + description;
      this.showModal(title + '\n' + body);
      setTimeout(function () {
        window.location.hash = '#/';
      }, 1500);
      document.getElementById('add-story-form').reset();
      document.getElementById('lat').value = '';
      document.getElementById('lon').value = '';
      this.selectedLatLng = null;
      if (this.marker) {
        this.map.map.removeLayer(this.marker);
        this.marker = null;
      }
      this.map.setView(this.defaultLatLng, 5);
      var videoElement = document.getElementById('camera-preview');
      var canvasElement = document.getElementById('camera-canvas');
      var openCameraBtn = document.getElementById('open-camera-btn');
      var closeCameraBtn = document.getElementById('close-camera-btn');
      var captureBtn = document.getElementById('capture-btn');
      var retakeBtn = document.getElementById('retake-btn');
      var cameraSelect = document.getElementById('camera-select');

      videoElement.style.display = 'none';
      canvasElement.style.display = 'none';
      openCameraBtn.style.display = 'inline-block';
      closeCameraBtn.style.display = 'none';
      captureBtn.style.display = 'none';
      retakeBtn.style.display = 'none';
      cameraSelect.style.display = 'none';
      this.camera.stop();
      Camera.stopAllStreams();
    } catch (error) {
      this.showMessage('Error: ' + error.message);
    }
  }

  showModal(message) {
    var modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '1000';

    var modalContent = document.createElement('div');
    modalContent.style.backgroundColor = '#fff';
    modalContent.style.padding = '20px 40px';
    modalContent.style.borderRadius = '8px';
    modalContent.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
    modalContent.style.fontSize = '18px';
    modalContent.textContent = message;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // modal.addEventListener('click', function() {
    //   document.body.removeChild(modal);
    // });

    setTimeout(() => {
      document.body.removeChild(modal);
    }, 1500);
  }

  setPresenter(presenter) {
    this.presenter = presenter;
  }

  showMessage(message) {
    var messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
  }
}
