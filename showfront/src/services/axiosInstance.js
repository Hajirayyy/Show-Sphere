// axiosInstance.js
import axios from 'axios';

const instance = axios.create({
    baseURL: '/api',
    withCredentials: true // Send cookies automatically
  });

export default instance;
