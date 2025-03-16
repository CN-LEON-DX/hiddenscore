import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import api from '../utils/api';

interface User {
  id: number;
  email: string;
  name: string;
  picture?: string | null;
}

const useAuth = () => {
  const [user, setUser] = useState<User | null>(() => {
    // Try to load user from localStorage first
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated
  const isAuthenticated = !!localStorage.getItem('auth_token');

  // Load user data if we have a token but no user data
  const loadUserData = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      setLoading(false);
      return;
    }
    
    if (!user) {
      setLoading(true);
      try {
        // Use the API utility with the base URL and credentials
        const response = await api.get('/user/me');
        
        if (response.data) {
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
        }
      } catch (error: any) {
        console.error('Error loading user data:', error);
        setError(error.message || 'Failed to load user data');
        
        // If unauthorized, clear token
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
        }
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const logout = async () => {
    try {
      // Call logout endpoint
      await api.post('/auth/logout');
    } catch (error) {
      console.error("Error calling logout API:", error);
    } finally {
      // Always clear local storage regardless of API response
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      setUser(null);
      
      // Redirect to home after logout
      window.location.href = '/';
    }
  };

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