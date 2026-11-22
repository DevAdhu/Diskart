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

const hasValue = (value) => value !== '' && value !== null && value !== undefined;

export const productAPI = {
  getAll: () => API.get('/products'),
  getById: (id) => API.get(`/products/${id}`),
  // Paged / sorted / filtered catalogue used by Home.
  // `brand` is sent as a comma-separated list so a single query parameter can
  // carry every selected brand checkbox (Spring binds it to a List<String>).
  getPaged: ({
    page = 0,
    size = 12,
    sort = 'name,asc',
    keyword = '',
    category = '',
    minPrice = '',
    maxPrice = '',
    brand = '',
    minRating = '',
  } = {}) =>
    API.get('/products/paged', {
      params: {
        page,
        size,
        sort,
        ...(hasValue(keyword) ? { keyword } : {}),
        ...(hasValue(category) ? { category } : {}),
        ...(hasValue(minPrice) ? { minPrice } : {}),
        ...(hasValue(maxPrice) ? { maxPrice } : {}),
        ...(hasValue(brand) ? { brand } : {}),
        ...(hasValue(minRating) ? { minRating } : {}),
      },
    }),
  search: (keyword) => API.get('/products/search', { params: { keyword } }),
  getByCategory: (cat) => API.get(`/products/category/${encodeURIComponent(cat)}`),
  // Distinct brand names used by the Home filter sidebar.
  brands: () => API.get('/products/brands'),
  // Type-ahead suggestions for the Home search box.
  suggest: (q, limit = 8) =>
    API.get('/products/suggest', { params: { q, limit } }),
  // "Customers also bought" strip on the product detail page.
  recommendations: (id, limit = 6) =>
    API.get(`/products/${id}/recommendations`, { params: { limit } }),
  create: (data) => API.post('/products', data),
  update: (id, data) => API.put(`/products/${id}`, data),
  delete: (id) => API.delete(`/products/${id}`),
  // Backend expects a raw JSON array of URL strings, not an object wrapper.
  uploadImages: (id, urls) => API.post(`/products/${id}/images`, urls),
};

export const orderAPI = {
  // The backend derives the customer from the JWT — no userId in the request.
  // Legacy direct-placement path is kept for backwards compatibility; the UI
  // now checks out through Razorpay (see paymentAPI).
  place: (data) => API.post('/orders/place', data),
  getMyOrders: () => API.get('/orders/mine'),
  getAllOrders: () => API.get('/orders'),
  getById: (id) => API.get(`/orders/${id}`),
  updateStatus: (orderId, status) =>
    API.patch(`/orders/${orderId}/status`, null, { params: { status } }),
  // Customer-facing tracking timeline for a single order.
  history: (id) => API.get(`/orders/${id}/history`),
  // Customer-initiated cancellation (PENDING/CONFIRMED only on the backend).
  cancel: (id) => API.post(`/orders/${id}/cancel`),
};

// Wishlist is shared client-side. Logged-in users get the server list; guests
// keep a local-only copy (see WishlistContext) so the heart still works.
export const wishlistAPI = {
  list: () => API.get('/wishlist'),
  add: (productId) => API.post(`/wishlist/${productId}`),
  remove: (productId) => API.delete(`/wishlist/${productId}`),
};

// Saved shipping addresses for the logged-in user.
export const addressAPI = {
  list: () => API.get('/addresses'),
  create: (data) => API.post('/addresses', data),
  update: (id, data) => API.put(`/addresses/${id}`, data),
  remove: (id) => API.delete(`/addresses/${id}`),
};

// Razorpay checkout: create an order, verify a successful payment, or record a
// failure/dismiss. Amounts sent to Razorpay are in paise.
export const paymentAPI = {
  createRazorpayOrder: (data) => API.post('/payments/razorpay/order', data),
  verify: (data) => API.post('/payments/razorpay/verify', data),
  failure: (data) => API.post('/payments/razorpay/failure', data),
};

// Product reviews (public read, authenticated write).
export const reviewAPI = {
  list: (productId) => API.get(`/products/${productId}/reviews`),
  add: (productId, data) => API.post(`/products/${productId}/reviews`, data),
  remove: (productId, reviewId) =>
    API.delete(`/products/${productId}/reviews/${reviewId}`),
};

export const userAPI = {
  getById: (id) => API.get(`/users/${id}`),
};

export default API;
