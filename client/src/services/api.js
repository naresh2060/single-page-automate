import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 12000
});

// Response interceptor for consistent data extraction and error messages
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    let message = 'Network error or backend is not responding';

    if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.message) {
      message = error.message;
    }

    const customError = new Error(message);
    customError.statusCode = error.response?.status || 500;
    customError.details = error.response?.data;

    return Promise.reject(customError);
  }
);

export default api;
