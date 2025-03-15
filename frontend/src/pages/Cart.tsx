import { Helmet } from 'react-helmet';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
}
interface Cart {
    id: string;
    cartItems: CartItem[];
    totalPrice: number;
}

const Cart = () => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [totalPrice, setTotalPrice] = useState<number>(0);
    const navigate = useNavigate();

    useEffect(() => {
        const storedCartItems = JSON.parse(sessionStorage.getItem('cart') || '[]');
        setCartItems(storedCartItems);
        calculateTotalPrice(storedCartItems);
    }, []);

    const calculateTotalPrice = (items: CartItem[]) => {
        const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        setTotalPrice(total);
    };

    const handleRemoveItem = (itemId: string) => {
        const updatedCartItems = cartItems.filter(item => item.id !== itemId);
        setCartItems(updatedCartItems);
        sessionStorage.setItem('cart', JSON.stringify(updatedCartItems));
        calculateTotalPrice(updatedCartItems);
    };

    const handleQuantityChange = (itemId: string, quantity: number) => {
        const updatedCartItems = cartItems.map(item =>
            item.id === itemId ? { ...item, quantity } : item
        );
        setCartItems(updatedCartItems);
        sessionStorage.setItem('cart', JSON.stringify(updatedCartItems));
        calculateTotalPrice(updatedCartItems);
    };

    const handleProceedToCheckout = () => {
        navigate('/checkout');
    };

    return (
        <>
            <Helmet>
                <title>Shopping Cart - V Diamond</title>
            </Helmet>
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
                                            <label htmlFor={`quantity-${item.id}`} className="mr-2 text-sm text-gray-600">Quantity:</label>
                                            <input
                                                type="number"
                                                id={`quantity-${item.id}`}
                                                value={item.quantity}
                                                onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))}
                                                className="w-16 p-2 text-center text-white bg-white rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                                                min="1"
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
                        <button
                            onClick={handleProceedToCheckout}
                            className="w-full mt-4 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-500"
                        >
                            Proceed to Checkout
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Cart;