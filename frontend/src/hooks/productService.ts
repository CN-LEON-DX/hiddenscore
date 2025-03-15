
import axios from 'axios';


export const getProducts = async () => {
    try {
        const response = await axios.get('/products');
<<<<<<< HEAD

        if (response.data && Array.isArray(response.data)) {
            return response.data;
        } else if (response.data && response.data.products && Array.isArray(response.data.products)) {
       
=======
        
        if (response.data && Array.isArray(response.data)) {
            return response.data;
        } else if (response.data && response.data.products && Array.isArray(response.data.products)) {
>>>>>>> 01776ea3755c094f167d344026f8f22c5cc936ba
            return response.data.products;
        } else {
            console.error('Invalid products data format:', response.data);
            return []; 
        }
    } catch (error) {
        console.error('Error fetching products:', error);
<<<<<<< HEAD
      
=======
>>>>>>> 01776ea3755c094f167d344026f8f22c5cc936ba
        return [];
    }
};
