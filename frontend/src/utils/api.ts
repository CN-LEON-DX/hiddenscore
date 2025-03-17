import axios from 'axios';

const apiUrl = import.meta.env.VITE_BACKEND_API;

const api = axios.create({
  baseURL: apiUrl, 
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, 
});

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Try to refresh user data and auth state if we get a 401
    if (error.response?.status === 401) {
      // Only handle 401 errors on non-auth routes 
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/signup') &&
          !window.location.pathname.includes('/auth/google') &&
          !window.location.pathname.includes('/admin/login')) {
        
        // Check if we might be able to recover
        const token = localStorage.getItem('auth_token');
        if (token && error.config && !error.config._retry) {
          try {
            // Try to get current user
            const response = await axios.get(`${apiUrl}/user/me`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            // If successful, update user data and retry the original request
            if (response.data) {
              localStorage.setItem('user', JSON.stringify(response.data));
              error.config._retry = true;
              return api(error.config);
            }
          } catch (refreshError) {
            console.error('Session refresh failed:', refreshError);
            // If refresh failed, clear local data
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            window.location.href = '/login?error=session_expired';
          }
        } else {
          // No token or already retried, clear local data
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          window.location.href = '/login?error=session_expired';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

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
      
      if (response.data?.token) {
        localStorage.setItem('auth_token', response.data.token);
      }
      
      if (response.data?.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      console.error("Login error occurred");
      throw error;
    }
  },
  
  googleLogin: () => {
    window.location.href = `${apiUrl}/auth/google/login`;
  },
  
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  },
  
  getCurrentUser: async () => {
    return api.get('/user/me');
  },
  
  forgotPassword: async (email: string) => {
    return api.post('/auth/forgot-password', { email: email.trim() });
  },
  
  changePassword: async (currentPassword: string, newPassword: string) => {
    return api.post('/auth/change-password', { currentPassword, newPassword });
  }
};

function maskEmail(email: string): string {
  if (!email) return '';
  
  const parts = email.split('@');
  if (parts.length !== 2) return '[invalid email format]';
  
  const name = parts[0];
  const domain = parts[1];
  
  const maskedName = name.length <= 2 
    ? '*'.repeat(name.length) 
    : `${name.charAt(0)}${'*'.repeat(name.length - 2)}${name.charAt(name.length - 1)}`;
    
  return `${maskedName}@${domain}`;
}

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

// Admin API Services
export const adminApi = {
  // Dashboard
  getDashboardStats: () => api.get('/admin/dashboard'),
  
  // User Management
  getAllUsers: () => api.get('/admin/users'),
  getUserById: (id: number) => api.get(`/admin/users/${id}`),
  updateUserRole: (id: number, role: string) => api.put(`/admin/users/${id}/role`, { role }),
  
  // Product Management
  createProduct: (productData: any) => api.post('/admin/products', productData),
  updateProduct: (id: number, productData: any) => api.put(`/admin/products/${id}`, productData),
  deleteProduct: (id: number) => api.delete(`/admin/products/${id}`),
  
  // Order Management
  getAllOrders: () => api.get('/admin/orders'),
  getOrderById: (id: number) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id: number, status: number) => api.put(`/admin/orders/${id}/status`, { status })
};
