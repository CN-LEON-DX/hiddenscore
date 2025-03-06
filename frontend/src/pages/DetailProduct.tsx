import { useParams } from 'react-router-dom';
import Header from '../components/Header.tsx';
import Footer from '../components/Footer.tsx';
import { Helmet } from 'react-helmet';

const ProductDetail = () => {
    const { productId } = useParams<{ productId: string }>();

    // Fetch product details based on productId
    const product = {
        id: productId,
        name: 'The Blue Hope Diamond',
        description: 'A rare blue diamond with a rich history and exceptional beauty.',
        image: '/1.png',
        price: '$250,000',
        color: 'Blue',
        carat: '1.5',
        clarity: 'VVS1',
        cut: 'Excellent',
        certification: 'GIA'
    };

    return (
        <>
            <Helmet>
                <title>{product.name} - V Diamond</title>
            </Helmet>
            <Header />
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <img src={product.image} alt={product.name} className="rounded-lg w-full h-auto object-cover" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                        <p className="mt-4 text-gray-500">{product.description}</p>
                        <p className="mt-4 text-xl font-semibold text-gray-900">{product.price}</p>
                        <div className="mt-4">
                            <h2 className="text-lg font-medium text-gray-900">Product Details</h2>
                            <ul className="mt-2 text-gray-500">
                                <li><strong>Color:</strong> {product.color}</li>
                                <li><strong>Carat:</strong> {product.carat}</li>
                                <li><strong>Clarity:</strong> {product.clarity}</li>
                                <li><strong>Cut:</strong> {product.cut}</li>
                                <li><strong>Certification:</strong> {product.certification}</li>
                            </ul>
                        </div>
                        <div className="mt-6">
                            <button className="inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
                                Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default ProductDetail;