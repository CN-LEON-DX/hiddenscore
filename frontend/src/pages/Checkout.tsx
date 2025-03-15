import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { FaApple, FaGoogle, FaCreditCard, FaShoppingCart } from 'react-icons/fa';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { StripeCardElement } from '@stripe/stripe-js';

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
}

const API_URL = import.meta.env.VITE_API_URL;

const stripePromise = loadStripe('your-publishable-key-here');

const CheckoutForm = () => {
    const stripe = useStripe();
    const elements = useElements();
    const [paymentDetails, setPaymentDetails] = useState({
        cardHolderName: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPaymentDetails(prevDetails => ({ ...prevDetails, [name]: value }));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement || !(cardElement as StripeCardElement)) {
            console.error('Card Element not found or not a valid StripeCardElement');
            return;
        }

        const { error, paymentMethod } = await stripe.createPaymentMethod({
            type: 'card',
            card: cardElement,
            billing_details: {
                name: paymentDetails.cardHolderName,
            },
        });

        if (error) {
            console.error(error);
        } else {
            console.log(paymentMethod);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Card Holder Name</label>
                <input
                    type="text"
                    name="cardHolderName"
                    value={paymentDetails.cardHolderName}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                />
            </div>
            <CardElement className="my-4 p-4 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            <button
                type="submit"
                disabled={!stripe}
                className="w-full mt-4 bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors"
            >
                Pay
            </button>
        </form>
    );
};

const Checkout = () => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [totalPrice, setTotalPrice] = useState<number>(0);
    const [shippingCost, setShippingCost] = useState<number>(5);
    const [paymentMethod, setPaymentMethod] = useState<string>('card');
    const [shippingDetails, setShippingDetails] = useState({
        fullName: '',
        email: '',
        address: '',
        city: '',
        country: '',
        zipCode: ''
    });
    const [paymentDetails, setPaymentDetails] = useState({
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

    const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setShippingDetails(prevDetails => ({ ...prevDetails, [name]: value }));
    };

    const handlePaymentMethodChange = (method: string) => {
        setPaymentMethod(method);
    };

    const handleCheckout = async () => {
        try {
            const response = await fetch(`${API_URL}/cart/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    cartItems, 
                    paymentDetails, 
                    paymentMethod,
                    shippingDetails
                }),
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
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 flex items-center">
                        <FaShoppingCart className="mr-3" />
                        Checkout
                    </h1>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Your Items</h2>
                                {cartItems.length > 0 ? (
                                    cartItems.map(item => (
                                        <div key={item.id} className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center">
                                                <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg" />
                                                <div className="ml-4">
                                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                                                    <p className="text-gray-500 dark:text-gray-400">Quantity: {item.quantity}</p>
                                                </div>
                                            </div>
                                            <p className="text-lg font-medium text-gray-900 dark:text-white">${(item.price * item.quantity).toFixed(2)}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400">Your cart is empty.</p>
                                )}
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Shipping Information</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={shippingDetails.fullName}
                                            onChange={handleShippingChange}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={shippingDetails.email}
                                            onChange={handleShippingChange}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                                            required
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address</label>
                                        <input
                                            type="text"
                                            name="address"
                                            value={shippingDetails.address}
                                            onChange={handleShippingChange}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">City</label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={shippingDetails.city}
                                            onChange={handleShippingChange}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Zip Code</label>
                                        <input
                                            type="text"
                                            name="zipCode"
                                            value={shippingDetails.zipCode}
                                            onChange={handleShippingChange}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Country</label>
                                        <select
                                            name="country"
                                            value={shippingDetails.country}
                                            onChange={handleShippingChange}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                                            required
                                        >
                                            <option value="">Select Country</option>
                                            <option value="US">United States</option>
                                            <option value="VN">Vietnam</option>
                                            <option value="UK">United Kingdom</option>
                                            <option value="CA">Canada</option>
                                            <option value="AU">Australia</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-1">
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sticky top-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Order Summary</h2>
                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                                        <span className="text-gray-900 dark:text-white">${totalPrice.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                                        <span className="text-gray-900 dark:text-white">${shippingCost.toFixed(2)}</span>
                                    </div>
                                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                        <div className="flex justify-between">
                                            <span className="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
                                            <span className="text-lg font-semibold text-gray-900 dark:text-white">${(totalPrice + shippingCost).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Payment Method</h2>
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <button 
                                            onClick={() => handlePaymentMethodChange('apple')}
                                            className={`flex items-center justify-center p-4 rounded-lg border-2 transition-all ${
                                                paymentMethod === 'apple' 
                                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                                                : 'border-gray-300 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-500'
                                            }`}
                                        >
                                            <FaApple className="w-6 h-6 mr-2" />
                                            <span className="font-medium">Apple Pay</span>
                                        </button>
                                        <button 
                                            onClick={() => handlePaymentMethodChange('google')}
                                            className={`flex items-center justify-center p-4 rounded-lg border-2 transition-all ${
                                                paymentMethod === 'google' 
                                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                                                : 'border-gray-300 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-500'
                                            }`}
                                        >
                                            <FaGoogle className="w-6 h-6 mr-2" />
                                            <span className="font-medium">Google Pay</span>
                                        </button>
                                        <button 
                                            onClick={() => handlePaymentMethodChange('card')}
                                            className={`flex items-center justify-center p-4 rounded-lg border-2 transition-all col-span-2 ${
                                                paymentMethod === 'card' 
                                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                                                : 'border-gray-300 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-500'
                                            }`}
                                        >
                                            <FaCreditCard className="w-6 h-6 mr-2" />
                                            <span className="font-medium">Credit Card</span>
                                        </button>
                                    </div>

                                    {paymentMethod === 'card' && (
                                        <Elements stripe={stripePromise}>
                                            <CheckoutForm />
                                        </Elements>
                                    )}

                                    <button
                                        onClick={handleCheckout}
                                        className="w-full mt-8 bg-indigo-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors"
                                    >
                                        Complete Order
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Checkout;