import axios from 'axios';
import { SafeStorage } from '../app/utils/storage';

const axiosInstance = axios.create({
  baseURL: 'http://192.168.0.54:8081/api',
  headers: {
    'Content-Type': 'application/json',
  },
});


axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const session = await SafeStorage.getItem('user_session');
      if (session) {
        const { token } = JSON.parse(session);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.warn('[autofusion] Error attaching token to request', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
