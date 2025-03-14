// frontend/src/services/productService.ts
import axios from 'axios';

// Use direct endpoint path for proxy
export const getProducts = async () => {
    try {
        const response = await axios.get('/products');
        
        // Make sure we're getting an array
        if (response.data && Array.isArray(response.data)) {
            return response.data;
        } else if (response.data && response.data.products && Array.isArray(response.data.products)) {
            // If data is wrapped in a 'products' property
            return response.data.products;
        } else {
            console.error('Invalid products data format:', response.data);
            return []; // Return empty array as fallback
        }
    } catch (error) {
        console.error('Error fetching products:', error);
        // Return empty array on error to prevent map errors
        return [];
    }
};