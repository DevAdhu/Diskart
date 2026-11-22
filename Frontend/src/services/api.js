import axios from 'axios';

const API = axios.create({
  // Falls back to a local Spring Boot API when the env var is not set.
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
  timeout: 10000,
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
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401 || status === 403) {
      const wasLoggedIn = Boolean(localStorage.getItem('token'));

      // Always clean up stored credentials.
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Gentle handling: no hard window.location redirect (which loops on
      // protected pages). Let the app react to the event instead. AuthContext
      // clears its user state, so ProtectedRoute sends the user to /login,
      // and ToastContext shows a single non-blocking message.
      if (wasLoggedIn && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => API.post('/auth/login', data),
  register: (data) => API.post('/auth/register', data),
};

export const productAPI = {
  getAll: () => API.get('/products'),
  getById: (id) => API.get(`/products/${id}`),
  // Paged / sorted / filtered catalogue used by Home.
  getPaged: ({ page = 0, size = 12, sort = 'name,asc', keyword = '', category = '' } = {}) =>
    API.get('/products/paged', {
      params: {
        page,
        size,
        sort,
        ...(keyword ? { keyword } : {}),
        ...(category ? { category } : {}),
      },
    }),
  search: (keyword) => API.get('/products/search', { params: { keyword } }),
  getByCategory: (cat) => API.get(`/products/category/${encodeURIComponent(cat)}`),
  create: (data) => API.post('/products', data),
  update: (id, data) => API.put(`/products/${id}`, data),
  delete: (id) => API.delete(`/products/${id}`),
  // Backend expects a raw JSON array of URL strings, not an object wrapper.
  uploadImages: (id, urls) => API.post(`/products/${id}/images`, urls),
};

export const orderAPI = {
  // The backend derives the customer from the JWT — no userId in the request.
  place: (data) => API.post('/orders/place', data),
  getMyOrders: () => API.get('/orders/mine'),
  getAllOrders: () => API.get('/orders'),
  updateStatus: (orderId, status) =>
    API.patch(`/orders/${orderId}/status`, null, { params: { status } }),
};

export const userAPI = {
  getById: (id) => API.get(`/users/${id}`),
};

export default API;
