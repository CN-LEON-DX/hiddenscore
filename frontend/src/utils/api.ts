import axios from 'axios';

// Create a centralized API client with default configurations
const api = axios.create({
  baseURL: '/api', // Use the /api prefix for all requests
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies/auth
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response || error);
    
    // You can handle specific error cases here
    if (error.response?.status === 401) {
      // Handle unauthorized errors
      // Could redirect to login: window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;

// Helper functions for common API operations
export const fetchProducts = async () => {
  try {
    const response = await api.get('/products');
    
    // Handle different response formats
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && response.data.products && Array.isArray(response.data.products)) {
      return response.data.products;
    } else {
      console.error('Invalid products data format:', response.data);
      return []; // Return empty array as fallback
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

export const fetchProductDetail = async (productId: number) => {
  try {
    const response = await api.get(`/products/detail/${productId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching product ${productId}:`, error);
    throw error;
  }
};

export const searchProducts = async (query: string) => {
  try {
    const response = await api.post('/products/search/', { query });
    return response.data;
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
};
