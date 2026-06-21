import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8080/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (data) => API.post('/auth/login', data),
  register: (data) => API.post('/auth/register', data),
};

export const productAPI = {
  getAll: () => API.get('/products'),
  getById: (id) => API.get(`/products/${id}`),
  search: (keyword) => API.get(`/products/search?keyword=${keyword}`),
  getByCategory: (cat) => API.get(`/products/category/${cat}`),
  create: (data) => API.post('/products', data),
  update: (id, data) => API.put(`/products/${id}`, data),
  delete: (id) => API.delete(`/products/${id}`),
};

export const orderAPI = {
  place: (userId, data) => API.post(`/orders/place?userId=${userId}`, data),
  getMyOrders: (userId) => API.get(`/orders/user/${userId}`),
  updateStatus: (orderId, status) =>
    API.patch(`/orders/${orderId}/status?status=${status}`),
};

export const userAPI = {
  getById: (id) => API.get(`/users/${id}`),
};

export default API;