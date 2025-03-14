import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import NotificationSuccess from '../hooks/notificationSuccess';

interface Product {
    id: string;
    name: string;
    description: string;
    image_url: string;
    price: string;
    color: string;
    carat: string;
    clarity: string;
    cut: string;
    certification: string;
}

interface CartItem {
    id: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
}

const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

const ProductDetail = () => {
    const { productId } = useParams<{ productId: string }>();
    const [product, setProduct] = useState<Product | null>(null);
    const [showNotification, setShowNotification] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await fetch(API_URL + `/products/detail/${productId}`);
                const data = await response.json();
                setProduct(data);
            } catch (error) {
                console.error('Error fetching product:', error);
            }
        };

        fetchProduct();
    }, [productId]);

    const addToCart = () => {
        if (!product) return;

        const cart: CartItem[] = JSON.parse(sessionStorage.getItem('cart') || '[]');
        const existingItemIndex = cart.findIndex(item => item.id === productId);

        if (existingItemIndex !== -1) {
            cart[existingItemIndex].quantity += 1;
        } else {
            cart.push({
                id: productId,
                name: product.name,
                image: product.image_url,
                price: parseFloat(product.price),
                quantity: 1
            });
        }

        sessionStorage.setItem('cart', JSON.stringify(cart));
        setShowNotification(true);
    };

    return (
        <>
            <Helmet>
                <title>{product ? product.name : 'Loading...'}</title>
            </Helmet>
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <img src={product?.image_url} alt={product?.name} className="rounded-lg w-full h-auto object-cover" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{product?.name}</h1>
                        <p className="mt-4 text-gray-500">{product?.description}</p>
                        <p className="mt-4 text-xl font-semibold text-gray-900">{product?.price}</p>
                        <div className="mt-4">
                            <h2 className="text-lg font-medium text-gray-900">Product Details</h2>
                            <ul className="mt-2 text-gray-500">
                                <li><strong>Color:</strong> {product?.color || 'Yellow'}</li>
                                <li><strong>Carat:</strong> {product?.carat || 10}</li>
                                <li><strong>Clarity:</strong> {product?.clarity || 10}</li>
                                <li><strong>Cut:</strong> {product?.cut || 'HEART'}</li>
                                <li><strong>Certification:</strong> {product?.certification || "USA"}</li>
                            </ul>
                        </div>
                        <div className="mt-6">
                            <button
                                onClick={addToCart}
                                className="inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                            >
                                Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {showNotification && <NotificationSuccess message="Product added to cart!" />}
        </>
    );
};

export default ProductDetail;