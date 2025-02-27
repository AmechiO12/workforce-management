import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:5000', // Ensure this matches Flask server
  withCredentials: true,            // For JWT handling
});

export default api;
