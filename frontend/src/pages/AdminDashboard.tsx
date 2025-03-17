import React, { useEffect, useState } from 'react';
import { adminApi } from '../utils/api';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  user_count: number;
  product_count: number;
  order_count: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const response = await adminApi.getDashboardStats();
        setStats(response.data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching dashboard stats:', err);
        if (err.response?.status === 403) {
          setError('You are not authorized to access this page');
        } else {
          setError('Cannot load dashboard data');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  if (loading) {
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
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Return to home page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="bg-white rounded-lg shadow-md p-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* User Stats Card */}
          <div className="bg-blue-50 rounded-lg p-6 shadow-sm border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-700">Total users</h2>
                <p className="text-3xl font-bold text-blue-600">{stats?.user_count || 0}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <button 
              onClick={() => navigate('/admin/users')}
              className="mt-4 w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Manage users
            </button>
          </div>
          
          {/* Product Stats Card */}
          <div className="bg-green-50 rounded-lg p-6 shadow-sm border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-700">Total products</h2>
                <p className="text-3xl font-bold text-green-600">{stats?.product_count || 0}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
            <button 
              onClick={() => navigate('/admin/products')}
              className="mt-4 w-full py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
            >
              Manage products
            </button>
          </div>
          
          {/* Order Stats Card */}
          <div className="bg-purple-50 rounded-lg p-6 shadow-sm border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-700">Total orders</h2>
                <p className="text-3xl font-bold text-purple-600">{stats?.order_count || 0}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <button 
              onClick={() => navigate('/admin/orders')}
              className="mt-4 w-full py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition"
            >
              Manage orders
            </button>
          </div>
        </div>
        
        <div className="flex justify-center mt-8">
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition mr-4"
          >
            Return to home page
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 