// frontend/src/services/productService.ts
import axios from 'axios';

// Use direct endpoint path for proxy
export const getProducts = async () => {
    try {
        const response = await axios.get('/products');
        
        if (response.data && Array.isArray(response.data)) {
            return response.data;
        } else if (response.data && response.data.products && Array.isArray(response.data.products)) {
            return response.data.products;
        } else {
            console.error('Invalid products data format:', response.data);
            return []; 
        }
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
};
