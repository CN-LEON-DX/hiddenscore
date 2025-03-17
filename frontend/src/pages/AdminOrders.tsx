import React, { useEffect, useState } from 'react';
import { adminApi } from '../utils/api';
import { useNavigate } from 'react-router-dom';

interface CartItem {
  id: number;
  product: {
    id: number;
    name: string;
    price: number;
    image_url: string;
  };
  quantity: number;
  subtotal: number;
}

interface Order {
  id: number;
  user_id: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
  status: number;
  created_at: string;
  updated_at: string;
  cart_items: CartItem[];
}

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAllOrders();
      setOrders(response.data.orders);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      if (err.response?.status === 403) {
        setError('Bạn không có quyền truy cập trang quản lý đơn hàng');
      } else {
        setError('Không thể tải danh sách đơn hàng');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (orderId: number) => {
    try {
      setLoading(true);
      const response = await adminApi.getOrderById(orderId);
      setSelectedOrder(response.data.order);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching order details:', err);
      setError('Không thể tải chi tiết đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: number, status: number) => {
    try {
      setLoading(true);
      await adminApi.updateOrderStatus(orderId, status);
      
      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status } : order
      ));
      
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status });
      }
      
      setError(null);
    } catch (err: any) {
      console.error('Error updating order status:', err);
      setError('Không thể cập nhật trạng thái đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 1: return { label: 'Đang xử lý', color: 'bg-yellow-100 text-yellow-800' };
      case 2: return { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800' };
      case 3: return { label: 'Đang giao hàng', color: 'bg-purple-100 text-purple-800' };
      case 4: return { label: 'Đã giao hàng', color: 'bg-green-100 text-green-800' };
      case 5: return { label: 'Đã hủy', color: 'bg-red-100 text-red-800' };
      default: return { label: 'Không xác định', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const calculateOrderTotal = (items: CartItem[]) => {
    return items.reduce((total, item) => total + (item.quantity * item.product.price), 0);
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Lỗi</h1>
          <p className="text-gray-700">{error}</p>
          <button 
            onClick={() => navigate('/admin')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Quay lại bảng điều khiển
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="bg-white rounded-lg shadow-md p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Quản lý đơn hàng</h1>
          <button 
            onClick={() => navigate('/admin')}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Quay lại
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`lg:col-span-${selectedOrder ? '1' : '3'}`}>
            <h2 className="text-xl font-semibold mb-4">Danh sách đơn hàng</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-3 px-4 text-left border-b">ID</th>
                    <th className="py-3 px-4 text-left border-b">Khách hàng</th>
                    <th className="py-3 px-4 text-left border-b">Ngày đặt</th>
                    <th className="py-3 px-4 text-left border-b">Trạng thái</th>
                    <th className="py-3 px-4 text-left border-b">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className={`hover:bg-gray-50 ${selectedOrder?.id === order.id ? 'bg-blue-50' : ''}`}>
                      <td className="py-3 px-4 border-b">{order.id}</td>
                      <td className="py-3 px-4 border-b">
                        <div className="font-medium">{order.user.name}</div>
                        <div className="text-sm text-gray-500">{order.user.email}</div>
                      </td>
                      <td className="py-3 px-4 border-b">
                        {new Date(order.created_at).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-3 px-4 border-b">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusLabel(order.status).color}`}>
                          {getStatusLabel(order.status).label}
                        </span>
                      </td>
                      <td className="py-3 px-4 border-b">
                        <button 
                          onClick={() => handleViewDetails(order.id)}
                          className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {orders.length === 0 && !loading && (
              <div className="text-center py-8">
                <p className="text-gray-500">Không có đơn hàng nào</p>
              </div>
            )}
          </div>
          
          {selectedOrder && (
            <div className="lg:col-span-2">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Chi tiết đơn hàng #{selectedOrder.id}</h2>
                  <button 
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-medium text-gray-700 mb-2">Thông tin khách hàng</h3>
                  <p><span className="font-medium">Tên:</span> {selectedOrder.user.name}</p>
                  <p><span className="font-medium">Email:</span> {selectedOrder.user.email}</p>
                  <p><span className="font-medium">Ngày đặt:</span> {new Date(selectedOrder.created_at).toLocaleString('vi-VN')}</p>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-medium text-gray-700 mb-2">Trạng thái đơn hàng</h3>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusLabel(selectedOrder.status).color}`}>
                      {getStatusLabel(selectedOrder.status).label}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    <button 
                      onClick={() => handleUpdateStatus(selectedOrder.id, 1)}
                      className={`px-2 py-1 text-xs rounded ${selectedOrder.status === 1 ? 'bg-yellow-500 text-white' : 'bg-yellow-100 text-yellow-800'}`}
                    >
                      Đang xử lý
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(selectedOrder.id, 2)}
                      className={`px-2 py-1 text-xs rounded ${selectedOrder.status === 2 ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-800'}`}
                    >
                      Đã xác nhận
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(selectedOrder.id, 3)}
                      className={`px-2 py-1 text-xs rounded ${selectedOrder.status === 3 ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-800'}`}
                    >
                      Đang giao hàng
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(selectedOrder.id, 4)}
                      className={`px-2 py-1 text-xs rounded ${selectedOrder.status === 4 ? 'bg-green-500 text-white' : 'bg-green-100 text-green-800'}`}
                    >
                      Đã giao hàng
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(selectedOrder.id, 5)}
                      className={`px-2 py-1 text-xs rounded ${selectedOrder.status === 5 ? 'bg-red-500 text-white' : 'bg-red-100 text-red-800'}`}
                    >
                      Hủy đơn hàng
                    </button>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Sản phẩm</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="py-2 px-3 text-left border-b text-xs">Sản phẩm</th>
                          <th className="py-2 px-3 text-right border-b text-xs">Giá</th>
                          <th className="py-2 px-3 text-right border-b text-xs">SL</th>
                          <th className="py-2 px-3 text-right border-b text-xs">Tổng</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.cart_items?.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="py-2 px-3 border-b">
                              <div className="flex items-center">
                                <img 
                                  src={item.product.image_url} 
                                  alt={item.product.name} 
                                  className="w-10 h-10 object-cover rounded mr-2"
                                />
                                <span className="text-sm">{item.product.name}</span>
                              </div>
                            </td>
                            <td className="py-2 px-3 border-b text-right text-sm">
                              {item.product.price.toLocaleString('vi-VN')} VND
                            </td>
                            <td className="py-2 px-3 border-b text-right text-sm">
                              {item.quantity}
                            </td>
                            <td className="py-2 px-3 border-b text-right text-sm font-medium">
                              {(item.quantity * item.product.price).toLocaleString('vi-VN')} VND
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50">
                          <td colSpan={3} className="py-2 px-3 text-right font-medium">Tổng cộng:</td>
                          <td className="py-2 px-3 text-right font-bold">
                            {calculateOrderTotal(selectedOrder.cart_items || []).toLocaleString('vi-VN')} VND
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOrders; 