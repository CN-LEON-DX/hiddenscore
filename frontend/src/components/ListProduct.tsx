import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProducts as fetchProductsAPI } from '../utils/api';

interface Product {
    ID: number;
    image_url: string;
    name: string;
    price: string;
    discount?: number;
}

export default function ListProduct() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const loadProducts = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await fetchProductsAPI();
                setProducts(data || []);
            } catch (error) {
                console.error('Error fetching products:', error);
                setError('Failed to load products. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        loadProducts();
    }, []);

    const handleProductClick = (productId: number) => {
        navigate(`/products/detail/${productId}`);
    };

    if (loading) {
        return (
            <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
                <div className="text-center p-4 bg-red-50 rounded-md">
                    <p className="text-red-700">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!products || products.length === 0) {
        return (
            <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Exquisite Diamond Jewelry</h2>
                <div className="mt-6 text-center p-8">
                    <p className="text-gray-500">No products available at the moment.</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Exquisite Diamond Jewelry</h2>

                <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
                    {products.map((product) => (
                        <div key={product.ID} className="group relative">
                            <img
                                src={product.image_url}
                                loading="lazy"
                                alt={product.name}
                                className="aspect-square w-full rounded-md bg-gray-200 object-cover group-hover:opacity-75 lg:aspect-auto lg:h-80"
                            />
                            <div className="mt-4 flex justify-between">
                                <div>
                                    <h3 className="text-sm text-gray-700">
                                        <a href="#" onClick={(e) => {
                                            e.preventDefault();
                                            handleProductClick(product.ID);
                                        }}>
                                            <span aria-hidden="true" className="absolute inset-0" />
                                            {product.name}
                                        </a>
                                    </h3>
                                </div>
                                <p className="text-sm font-medium text-gray-900">{product.price} $</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}