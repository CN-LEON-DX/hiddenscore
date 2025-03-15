import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import TopProduct from '../components/TopProduct';
import DiamondSearchFilter from '../components/Search';
import {SetStateAction, useState, useEffect } from 'react';
import Carousel from '../components/Carousel';
import ListProduct from '../components/ListProduct';
import PaginationTemp from '../components/PaginationTemp';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import { FaShoppingCart } from 'react-icons/fa';

const diamondCollection = [
    { name: 'The Blue Hope Diamond', description: 'A rare blue diamond with a rich history and exceptional beauty.' },
    { name: 'The Pink Star Diamond', description: 'A stunning pink diamond known for its size and vibrant color.' },
    { name: 'The Cullinan Diamond', description: 'The largest gem-quality rough diamond ever found.' },
    { name: 'The Koh-i-Noor Diamond', description: 'A diamond with a long and storied history, part of the British Crown Jewels.' },
    { name: 'The Regent Diamond', description: 'A diamond with a brilliant cut and a fascinating history.' },
];

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
}

export default function Products() {
    const [currentPage, setCurrentPage] = useState(1);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { addToCart } = useCart();

    const handlePageChange = (pageNumber: SetStateAction<number>) => {
        setCurrentPage(pageNumber);
    };

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await api.get('/products');
                setProducts(response.data);
            } catch (err) {
                setError('Failed to load products');
                console.error('Error fetching products:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const handleAddToCart = (product: Product) => {
        addToCart({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: product.image
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900">Error</h2>
                    <p className="mt-2 text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Helmet>
                <title>Products - Hidden Score</title>
            </Helmet>
            <TopProduct />
            <DiamondSearchFilter onSearch={() => {}} />
            <div>
                <div className="mx-auto grid max-w-2xl grid-cols-1 items-center gap-x-8 gap-y-16 px-4 py-24 sm:px-6 sm:py-32 lg:max-w-7xl lg:grid-cols-2 lg:px-8">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Exclusive Diamond Collection</h2>
                        <p className="mt-4 text-gray-500">
                            Discover our exclusive collection of the world's most valuable and rare diamonds. Each diamond has a unique story and unparalleled beauty.
                        </p>

                        <dl className="mt-16 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 sm:gap-y-16 lg:gap-x-8">
                            {diamondCollection.map((diamond) => (
                                <div key={diamond.name} className="border-t border-gray-200 pt-4">
                                    <dt className="font-medium text-gray-900">
                                        <Link to={`/product/${diamond.name}`}>{diamond.name}</Link>
                                    </dt>
                                    <dd className="mt-2 text-sm text-gray-500">{diamond.description}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                    <div className="grid grid-cols-2 grid-rows-2 gap-4 sm:gap-6 lg:gap-8">
                        <img alt="The Blue Hope Diamond" src="https://hiddenscore.s3.ap-southeast-2.amazonaws.com/images/public/ls8.png" className="rounded-lg bg-gray-100" />
                        <img alt="The Pink Star Diamond" src="https://hiddenscore.s3.ap-southeast-2.amazonaws.com/images/public/ls5.png" className="rounded-lg bg-gray-100" />
                        <img alt="The Cullinan Diamond" src="https://hiddenscore.s3.ap-southeast-2.amazonaws.com/images/public/ls2.png" className="rounded-lg bg-gray-100" />
                        <img alt="The Koh-i-Noor Diamond" src="https://hiddenscore.s3.ap-southeast-2.amazonaws.com/images/public/ls1.png" className="rounded-lg bg-gray-100" />
                    </div>
                </div>
            </div>
            <div className="mx-auto items-center px-4 py-24 sm:px-6 sm:py-32 lg:max-w-7xl lg:px-8">
                <Carousel />
            </div>
            <ListProduct />
            <PaginationTemp totalPages={10} currentPage={currentPage} step={1} onPageChange={handlePageChange} />
        </>
    );
}