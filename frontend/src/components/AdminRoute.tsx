import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { authAPI } from '../utils/api';

const AdminRoute: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      // Check for auth token
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.log('[ADMIN ROUTE] No auth token found, redirecting to login');
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // First check if we have user data in localStorage with admin role
      const storedUserString = localStorage.getItem('user');
      if (storedUserString) {
        try {
          const storedUser = JSON.parse(storedUserString);
          if (storedUser && storedUser.role === 'admin') {
            console.log('[ADMIN ROUTE] Admin role found in stored user data');
            setIsAdmin(true);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error('[ADMIN ROUTE] Error parsing stored user data:', e);
        }
      }

      // If no valid stored user with admin role, verify with API
      try {
        console.log('[ADMIN ROUTE] Calling getCurrentUser API to check admin status');
        const response = await authAPI.getCurrentUser();
        const user = response.data;
        
        console.log('[ADMIN ROUTE] User data received:', user);
        console.log('[ADMIN ROUTE] User role:', user?.role);
        
        // Update localStorage with the latest user data
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        }
        
        if (user && user.role === 'admin') {
          console.log('[ADMIN ROUTE] Admin access granted for user:', user.email);
          setIsAdmin(true);
        } else {
          console.log('[ADMIN ROUTE] Admin access denied - User does not have admin role');
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('[ADMIN ROUTE] Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return isAdmin ? <Outlet /> : <Navigate to="/admin/login" replace />;
};

export default AdminRoute; 