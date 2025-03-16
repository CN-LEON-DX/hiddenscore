import axios from 'axios';

// Use environment variable for API URL or fall back to default
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';

const api = axios.create({
  baseURL: apiUrl, 
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies
});

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    
    if (error.response?.status === 401) {
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/signup') &&
          !window.location.pathname.includes('/auth/google')) {
        
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        
        window.location.href = '/login?error=session_expired';
      }
    }
    
    return Promise.reject(error);
  }
);

// Request interceptor to add authentication token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

// Centralized authentication API methods
export const authAPI = {
  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { 
        email: email.trim(), 
        password 
      });
      
      // Store token if present in response
      if (response.data?.token) {
        localStorage.setItem('auth_token', response.data.token);
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  googleLogin: () => {
    // Redirect to the Google OAuth endpoint
    window.location.href = `${apiUrl}/auth/google/login`;
  },
  
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      // Always clear local storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  },
  
  getCurrentUser: async () => {
    // Use the correct path that matches the backend
    return api.get('/user/me');
  }
};

// Re-export existing API functions
export const fetchProducts = async () => {
  try {
    const response = await api.get('/products');
    
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && response.data.products && Array.isArray(response.data.products)) {
      return response.data.products;
    } else {
      return []; 
    }
  } catch (error) {
    return [];
  }
};

export const fetchProductDetail = async (productId: number) => {
  try {
    const response = await api.get(`/products/detail/${productId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const searchProducts = async (query: string) => {
  try {
    const response = await api.post('/products/search/', { query });
    return response.data;
  } catch (error) {
    return [];
  }
};

// Cart API functions
export const cartAPI = {
  getCart: async () => {
    try {
      const response = await api.get('/cart');
      return response.data;
    } catch (error) {
      return { cart: null, items: [] };
    }
  },
  
  addToCart: async (productId: number, quantity: number) => {
    return api.post('/cart/add', { product_id: productId, quantity });
  },
  
  removeFromCart: async (itemId: number) => {
    return api.post('/cart/remove', { item_id: itemId });
  },
  
  updateCartItem: async (itemId: number, quantity: number) => {
    return api.post('/cart/update', { item_id: itemId, quantity });
  }
};
