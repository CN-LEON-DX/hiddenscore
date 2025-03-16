import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import api from '../utils/api';

// Định nghĩa kiểu dữ liệu cho đơn hàng
type OrderItem = {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
};

type Order = {
  id: number;
  created_at: string;
  status: string;
  total: number;
  items: OrderItem[];
};

export default function OrderHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Fetch order history
    const fetchOrders = async () => {
      try {
        const response = await api.get('/user/orders');
        setOrders(response.data || []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load order history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [user, navigate]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Toggle order details
  const toggleOrderDetails = (orderId: number) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Order History</title>
      </Helmet>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Order History</h1>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 rounded-md border border-red-200">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <Link
              to="/profile"
              className="px-4 py-2 text-center text-gray-200 bg-gray-800 rounded-md border border-gray-700 hover:bg-gray-700"
            >
              Profile
            </Link>
            <Link
              to="/change-password"
              className="px-4 py-2 text-center text-gray-200 bg-gray-800 rounded-md border border-gray-700 hover:bg-gray-700"
            >
              Change Password
            </Link>
            <Link
              to="/settings"
              className="px-4 py-2 text-center text-gray-200 bg-gray-800 rounded-md border border-gray-700 hover:bg-gray-700"
            >
              Settings
            </Link>
            <Link
              to="/order-history"
              className="px-4 py-2 text-center text-white bg-indigo-600 rounded-md border border-indigo-700 hover:bg-indigo-700"
            >
              Order History
            </Link>
          </div>
          
          {orders.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
              <p className="text-gray-500 mb-4">You haven't placed any orders yet.</p>
              <Link 
                to="/products" 
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">Order #{order.id}</h2>
                      <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="mt-2 sm:mt-0 flex items-center">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                      <span className="ml-4 text-lg font-medium text-gray-900">${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => toggleOrderDetails(order.id)}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
                  >
                    {expandedOrder === order.id ? 'Hide Details' : 'View Details'}
                    <svg 
                      className={`ml-1.5 h-4 w-4 transition-transform ${expandedOrder === order.id ? 'rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {expandedOrder === order.id && (
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Order Items</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Product
                              </th>
                              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Quantity
                              </th>
                              <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Price
                              </th>
                              <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {order.items.map((item) => (
                              <tr key={item.id}>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <Link to={`/products/detail/${item.product_id}`} className="hover:text-indigo-600">
                                    {item.product_name}
                                  </Link>
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {item.quantity}
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                  ${item.price.toFixed(2)}
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                  ${item.total.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
} 