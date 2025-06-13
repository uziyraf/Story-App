import CONFIG from '../config';
import { getAccessToken } from '../utils/auth';

const ENDPOINTS = {
  REGISTER: `${CONFIG.BASE_URL}/register`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
  STORIES: `${CONFIG.BASE_URL}/stories`,
  STORIES_GUEST: `${CONFIG.BASE_URL}/stories/guest`,
  NOTIFICATIONS_SUBSCRIBE: `${CONFIG.BASE_URL}/notifications/subscribe`,
};

export async function registerUser({ name, email, password }) {
  const response = await fetch(ENDPOINTS.REGISTER, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, password }),
  });
  return response.json();
}

export async function loginUser({ email, password }) {
  const response = await fetch(ENDPOINTS.LOGIN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const json = await response.json();

  return {
    ...json,
    ok: response.ok,
  };
}

export async function addNewStory({ token, description, photo, lat, lon }) {
  const formData = new FormData();
  formData.append('description', description);
  formData.append('photo', photo);
  if (lat !== undefined) formData.append('lat', lat);
  if (lon !== undefined) formData.append('lon', lon);

  const response = await fetch(ENDPOINTS.STORIES, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  return response.json();
}

export async function addNewStoryGuest({ description, photo, lat, lon }) {
  const formData = new FormData();
  formData.append('description', description);
  formData.append('photo', photo);
  if (lat !== undefined) formData.append('lat', lat);
  if (lon !== undefined) formData.append('lon', lon);

  const response = await fetch(ENDPOINTS.STORIES_GUEST, {
    method: 'POST',
    body: formData,
  });
  return response.json();
}

export async function getAllStories({ token, page, size, location = 0 }) {
  const params = new URLSearchParams();
  if (page !== undefined) params.append('page', page);
  if (size !== undefined) params.append('size', size);
  params.append('location', location);

  const url = `${ENDPOINTS.STORIES}?${params.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
}

export async function getStoryDetail({ token, id }) {
  const url = `${ENDPOINTS.STORIES}/${id}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
}

export async function subscribeNotification({ endpoint, keys }) {
  // Pastikan parameter yang diterima sesuai format
  if (!endpoint || !keys) {
    console.error('Invalid subscription parameters:', { endpoint, keys });
    throw new Error('Invalid subscription parameters');
  }
  
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('User is not authenticated');
  }
  
  // Format body sesuai dengan yang diharapkan API
  const body = {
    endpoint,
    keys
  };
  
  console.log('Sending subscription to server:', body);

  try {
    const response = await fetch(ENDPOINTS.NOTIFICATIONS_SUBSCRIBE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    
    const responseData = await response.json();
    console.log('Server response data:', responseData);
    
    return {
      ...responseData,
      error: false,
      ok: response.ok,
      status: response.status,
    };
  } catch (error) {
    console.error('Error in subscribeNotification:', error);
    return {
      error: true,
      message: error.message || 'Network error',
    };
  }
}

export async function unsubscribeNotification({ endpoint }) {
  if (!endpoint) {
    console.error('Invalid unsubscribe parameter: endpoint is missing');
    throw new Error('Invalid unsubscribe parameter');
  }
  
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('User is not authenticated');
  }
  
  const body = { endpoint };
  console.log('Sending unsubscribe request:', body);

  try {
    const response = await fetch(ENDPOINTS.NOTIFICATIONS_SUBSCRIBE, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const json = await response.json();
    return {
      ...json,
      error: false,
      ok: response.ok,
    };
  } catch (error) {
    console.error('Error in unsubscribeNotification:', error);
    return {
      error: true,
      message: error.message || 'Network error',
    };
  }
}



