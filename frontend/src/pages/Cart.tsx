import Header from '../components/Header.tsx';
import Footer from '../components/Footer.tsx';
import { Helmet } from 'react-helmet';
import { useState } from 'react';

interface CartItem {
    id: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
}

const Cart = () => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [totalPrice, setTotalPrice] = useState<number>(0);

    // useEffect(() => {
    //     // Fetch cart items from API or session
    //     fetch('/api/cart')
    //         .then(response => response.json())
    //         .then(data => {
    //             setCartItems(data.cartItems);
    //             calculateTotalPrice(data.cartItems);
    //         })
    //         .catch(error => console.error('Error fetching cart items:', error));
    // }, []);

    const calculateTotalPrice = (items: CartItem[]) => {
        const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        setTotalPrice(total);
    };

    const handleRemoveItem = (itemId: string) => {
        setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
    };

    const handleQuantityChange = (itemId: string, quantity: number) => {
        setCartItems(prevItems =>
            prevItems.map(item =>
                item.id === itemId ? { ...item, quantity } : item
            )
        );
        calculateTotalPrice(cartItems);
    };

    return (
        <>
            <Helmet>
                <title>Shopping Cart - V Diamond</title>
            </Helmet>
            <Header />
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Shopping Cart</h1>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        {cartItems.length > 0 ? (
                            cartItems.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-4 border-b border-gray-200">
                                    <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg" />
                                    <div className="flex-1 ml-4">
                                        <h2 className="text-lg font-semibold text-gray-900">{item.name}</h2>
                                        <p className="text-gray-500">${item.price.toFixed(2)}</p>
                                        <div className="flex items-center mt-2">
                                            <label htmlFor={`quantity-${item.id}`} className="mr-2 text-sm text-gray-600">Qty:</label>
                                            <input
                                                type="number"
                                                id={`quantity-${item.id}`}
                                                value={item.quantity}
                                                onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))}
                                                className="w-16 border border-gray-300 rounded-md text-center"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveItem(item.id)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500">Your cart is empty.</p>
                        )}
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
                        <div className="flex justify-between mb-2">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="text-gray-900">${totalPrice.toFixed(2)}</span>
                        </div>
                        <button className="w-full mt-4 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-500">
                            Proceed to Checkout
                        </button>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default Cart;