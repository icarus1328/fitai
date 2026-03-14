import axios from 'axios';
import Cookies from 'js-cookie';

let API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

if (typeof window !== 'undefined') {
  if (window.location.hostname.includes('loca.lt')) {
    API_URL = 'https://breezy-moles-stay.loca.lt/api';
  } else if (!process.env.NEXT_PUBLIC_API_URL) {
    API_URL = `${window.location.protocol}//${window.location.hostname}:5001/api`;
  }
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Bypass localtunnel warning intercept
    if (config.headers) {
      config.headers['Bypass-Tunnel-Reminder'] = 'true';
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
