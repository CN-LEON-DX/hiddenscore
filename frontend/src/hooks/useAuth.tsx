import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import api from '../utils/api';

interface User {
  id: number;
  email: string;
  name: string;
  picture?: string | null;
  role?: string;
}

const useAuth = () => {
  const [user, setUser] = useState<User | null>(() => {
    // Try to load user from localStorage first
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);

  // Check if user is authenticated
  const isAuthenticated = !!localStorage.getItem('auth_token');

  // Load user data if we have a token but no user data
  const loadUserData = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      setLoading(false);
      return;
    }
    
    // Prevent multiple simultaneous calls
    if (isLoadingRef.current) {
      return;
    }
    
    if (!user) {
      setLoading(true);
      isLoadingRef.current = true;
      
      try {
        // Use the API utility with the base URL and credentials
        const response = await api.get('/user/me');
        
        if (response.data) {
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
        }
      } catch (error: any) {
        setError(error.message || 'Failed to load user data');
        
        // If unauthorized, clear token
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
        }
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    } else {
      setLoading(false);
    }
  }, [user]);

  // Only load user data once on initial mount
  useEffect(() => {
    if (isAuthenticated && !user && !isLoadingRef.current) {
      loadUserData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, loadUserData, user]);

  const logout = useCallback(async () => {
    try {
      // Call logout endpoint only if we're authenticated
      if (isAuthenticated) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      // Silent fail - continue with local logout
    } finally {
      // Always clear local storage regardless of API response
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      setUser(null);
      
      // Redirect to home after logout
      window.location.href = '/';
    }
  }, [isAuthenticated]);

  return { 
    user, 
    setUser,
    loading, 
    error, 
    isAuthenticated, 
    logout,
    loadUserData
  };
};

export default useAuth;