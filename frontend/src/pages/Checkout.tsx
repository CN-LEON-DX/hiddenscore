import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
}

const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

const Checkout = () => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [totalPrice, setTotalPrice] = useState<number>(0);
    const [paymentDetails, setPaymentDetails] = useState({
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardHolderName: ''
    });

    useEffect(() => {
        const storedCartItems = JSON.parse(sessionStorage.getItem('cart') || '[]');
        setCartItems(storedCartItems);
        calculateTotalPrice(storedCartItems);
    }, []);

    const calculateTotalPrice = (items: CartItem[]) => {
        const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        setTotalPrice(total);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPaymentDetails(prevDetails => ({ ...prevDetails, [name]: value }));
    };

    const handleCheckout = async () => {
        try {
            const response = await fetch(`${API_URL}/cart/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ cartItems, paymentDetails }),
            });

            if (!response.ok) {
                throw new Error('Failed to proceed to checkout');
            }

            // Handle successful checkout (e.g., clear cart, show success message)
            sessionStorage.removeItem('cart');
            setCartItems([]);
            setTotalPrice(0);
            alert('Checkout successful!');
        } catch (error) {
            console.error('Error during checkout:', error);
            alert('Checkout failed. Please try again.');
        }
    };

    return (
        <>
            <Helmet>
                <title>Checkout - V Diamond</title>
            </Helmet>
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Checkout</h1>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        {cartItems.length > 0 ? (
                            cartItems.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-4 border-b border-gray-200">
                                    <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg" />
                                    <div className="flex-1 ml-4">
                                        <h2 className="text-lg font-semibold text-gray-900">{item.name}</h2>
                                        <p className="text-gray-500">${item.price.toFixed(2)}</p>
                                        <p className="text-gray-500">Quantity: {item.quantity}</p>
                                    </div>
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
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Details</h2>
                        <div className="mb-4">
                            <label className="block text-gray-700">Card Number</label>
                            <input
                                type="text"
                                name="cardNumber"
                                value={paymentDetails.cardNumber}
                                onChange={handleInputChange}
                                className="w-full text-black border border-gray-300 rounded-md p-2"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700">Expiry Date</label>
                            <input
                                type="text"
                                name="expiryDate"
                                value={paymentDetails.expiryDate}
                                onChange={handleInputChange}
                                className="w-full text-black border border-gray-300 rounded-md p-2"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700">CVV</label>
                            <input
                                type="text"
                                name="cvv"
                                value={paymentDetails.cvv}
                                onChange={handleInputChange}
                                className="w-full border text-black border-gray-300 rounded-md p-2"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700">Card Holder Name</label>
                            <input
                                type="text"
                                name="cardHolderName"
                                value={paymentDetails.cardHolderName}
                                onChange={handleInputChange}
                                className="w-full border text-black border-gray-300 rounded-md p-2"
                            />
                        </div>
                        <button
                            onClick={handleCheckout}
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

export default Checkout;