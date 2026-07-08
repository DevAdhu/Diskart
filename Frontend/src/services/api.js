import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// Request Interceptor
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      alert('Your session has expired. Please login again.');

      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// Continue with your APIs
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