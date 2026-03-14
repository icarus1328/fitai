import axios from 'axios';
import Cookies from 'js-cookie';

let API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

if (typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_API_URL) {
  // If we are served over a localtunnel, ngrok, or local IP, automatically resolve to port 5001 OR the assigned tunnel.
  // Because tunnels route port 80/443 directly to 5001, we drop the :5001 port if it's not a local network IP.
  const isLocalNetwork = window.location.hostname.match(/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|localhost)/);
  if (isLocalNetwork) {
    API_URL = `${window.location.protocol}//${window.location.hostname}:5001/api`;
  } else {
    // If it's a tunnel (like loca.lt), the API tunnel is running on a different URL, but we need HTTPS!
    // Since dealing with multiple tunnels breaks CORS, we strongly recommend Vercel.
    API_URL = `${window.location.protocol}//${window.location.hostname}/api`;
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
