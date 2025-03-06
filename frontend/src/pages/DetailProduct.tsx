import { useParams } from 'react-router-dom';
import Header from '../components/Header.tsx';
import Footer from '../components/Footer.tsx';
import { Helmet } from 'react-helmet';

const ProductDetail = () => {
    const { productId } = useParams<{ productId: string }>();

    // Fetch product details based on productId
    // For demonstration, using a static product detail
    const product = {
        id: productId,
        name: 'The Blue Hope Diamond',
        description: 'A rare blue diamond with a rich history and exceptional beauty.',
        image: '/1.png',
        price: '$250,000'
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
                        <img src={product.image} alt={product.name} className="rounded-lg" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                        <p className="mt-4 text-gray-500">{product.description}</p>
                        <p className="mt-4 text-xl font-semibold text-gray-900">{product.price}</p>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default ProductDetail;