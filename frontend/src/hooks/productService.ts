// frontend/src/services/productService.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

export const getProducts = async () => {
    try {
        const response = await axios.get(`${API_URL}/products`);
        return response.data;
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
};