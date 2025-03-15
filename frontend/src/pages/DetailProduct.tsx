import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import NotificationSuccess from '../hooks/notificationSuccess';
import api from '../utils/api';

interface Product {
    id: number;
    name: string;
    description: string;
    image_url: string;
    price: number;
    // Optional fields that might not be in backend
    color?: string;
    carat?: string;
    clarity?: string;
    cut?: string;
    certification?: string;
    stock?: number;
    created_at?: string;
    updated_at?: string;
}

interface CartItem {
    id: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
}

const API_URL = import.meta.env.VITE_API_URL || '';

const ProductDetail = () => {
    const { productId } = useParams<{ productId: string }>();
    const [product, setProduct] = useState<Product | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showNotification, setShowNotification] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            try {
                let response;
                try {
                    response = await api.get(`/products/detail/${productId}`);
                } catch (firstErr) {
                    console.log("First attempt failed:", firstErr);
                    try {
                        response = await fetch(`${API_URL}/products/detail/${productId}`);
                        if (!response.ok) throw new Error(`Status: ${response.status}`);
                        return await response.json();
                    } catch (secondErr) {
                        console.log("Second attempt failed:", secondErr);
                        response = await api.get(`/products/${productId}`);
                    }
                }
                
                console.log("Product data response:", response);
                
                // Use data from whichever request succeeded
                const data = response.data;
                console.log("Product data:", data);
                
                setProduct(data);
            } catch (err) {
                console.error('Error fetching product:', err);
                setError('Failed to load product. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        if (productId) {
            fetchProduct();
        } else {
            setError("No product ID provided");
            setLoading(false);
        }
    }, [productId]);

    // Fetch related products
    useEffect(() => {
        const fetchRelatedProducts = async () => {
            try {
                // Try to get all products
                const response = await api.get('/products');
                if (response.data && Array.isArray(response.data)) {
                    // Filter out the current product and limit to 4 items
                    const filtered = response.data
                        .filter((p: Product) => p.id !== parseInt(productId || '0'))
                        .slice(0, 4);
                    setRelatedProducts(filtered);
                }
            } catch (err) {
                console.error('Error fetching related products:', err);
                // Use fallback data for development if needed
                setRelatedProducts([
                    {
                        id: 1,
                        name: "Diamond Ring",
                        description: "Beautiful diamond ring",
                        image_url: "https://hiddenscore.s3.ap-southeast-2.amazonaws.com/images/public/ls1.png",
                        price: 1500,
                    },
                    {
                        id: 2,
                        name: "Gold Necklace",
                        description: "Elegant gold necklace",
                        image_url: "https://hiddenscore.s3.ap-southeast-2.amazonaws.com/images/public/ls2.png",
                        price: 1200,
                    },
                    {
                        id: 3,
                        name: "Sapphire Earrings",
                        description: "Stunning sapphire earrings",
                        image_url: "https://hiddenscore.s3.ap-southeast-2.amazonaws.com/images/public/ls5.png",
                        price: 950,
                    },
                    {
                        id: 4,
                        name: "Ruby Bracelet",
                        description: "Luxurious ruby bracelet",
                        image_url: "https://hiddenscore.s3.ap-southeast-2.amazonaws.com/images/public/ls8.png",
                        price: 1100,
                    }
                ]);
            }
        };

        if (!loading && product) {
            fetchRelatedProducts();
        }
    }, [loading, product, productId]);

    const addToCart = () => {
        if (!product || !productId) return;

        const cart: CartItem[] = JSON.parse(sessionStorage.getItem('cart') || '[]');
        const existingItemIndex = cart.findIndex(item => item.id === productId);

        if (existingItemIndex !== -1) {
            cart[existingItemIndex].quantity += 1;
        } else {
            cart.push({
                id: productId,
                name: product.name,
                image: product.image_url,
                price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
                quantity: 1
            });
        }

        sessionStorage.setItem('cart', JSON.stringify(cart));
        setShowNotification(true);
        
        // Auto-hide notification after 3 seconds
        setTimeout(() => {
            setShowNotification(false);
        }, 3000);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="text-center text-white">
                    <h2 className="text-2xl font-bold">Error</h2>
                    <p className="mt-2">{error || 'Product not found'}</p>
                    <Link to="/products" className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-md">
                        Back to Products
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <>
            <Helmet>
                <title>{product.name}</title>
            </Helmet>
            <div className="min-h-screen bg-black text-white">
                <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                    {/* Product Detail Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
                        <div>
                            <img 
                                src={product.image_url} 
                                alt={product.name} 
                                className="rounded-lg w-full h-auto object-cover"
                            />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-6">{product.name}</h1>
                            <p className="text-gray-300 mb-6">{product.description}</p>
                            <p className="text-2xl font-semibold text-indigo-400 mb-8">
                                ${typeof product.price === 'string' ? product.price : product.price.toFixed(2)}
                            </p>
                            
                            <div className="mb-8">
                                <h2 className="text-xl font-bold mb-4">Product Details</h2>
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-gray-400">Color:</span> {product.color || 'Yellow'}
                                    </div>
                                    <div>
                                        <span className="text-gray-400">Carat:</span> {product.carat || '10'}
                                    </div>
                                    <div>
                                        <span className="text-gray-400">Clarity:</span> {product.clarity || '10'}
                                    </div>
                                    <div>
                                        <span className="text-gray-400">Cut:</span> {product.cut || 'HEART'}
                                    </div>
                                    <div>
                                        <span className="text-gray-400">Certification:</span> {product.certification || 'USA'}
                                    </div>
                                    {product.stock !== undefined && (
                                        <div>
                                            <span className="text-gray-400">Stock:</span> {product.stock}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <button
                                onClick={addToCart}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-md text-center font-medium transition duration-200"
                            >
                                Add to Cart
                            </button>
                        </div>
                    </div>

                    {/* Related Products Section */}
                    {relatedProducts.length > 0 && (
                        <div className="mt-16">
                            <h2 className="text-2xl font-bold mb-8 text-white">Suit for you</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {relatedProducts.map((relatedProduct) => (
                                    <div key={relatedProduct.id} className="bg-gray-900 rounded-lg overflow-hidden hover:bg-gray-800 transition-colors">
                                        <Link to={`/products/detail/${relatedProduct.id}`}>
                                            <div className="relative pb-[100%]">
                                                <img 
                                                    src={relatedProduct.image_url} 
                                                    alt={relatedProduct.name} 
                                                    className="absolute inset-0 w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="p-4">
                                                <h3 className="text-lg font-medium text-white mb-2">{relatedProduct.name}</h3>
                                                <p className="text-indigo-400 font-semibold">
                                                    ${typeof relatedProduct.price === 'string' 
                                                        ? relatedProduct.price 
                                                        : relatedProduct.price.toFixed(2)}
                                                </p>
                                            </div>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {showNotification && <NotificationSuccess message="Product added to cart!" />}
        </>
    );
};

export default ProductDetail;