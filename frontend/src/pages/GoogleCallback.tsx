import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

const GoogleCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const searchParams = new URLSearchParams(location.search);
        const token = searchParams.get('token');
        const code = searchParams.get('code');
        const errorParam = searchParams.get('error');
        
        if (errorParam) {
          setError(`Authentication error: ${errorParam}`);
          navigate(`/login?error=${encodeURIComponent(errorParam)}`);
          return;
        }
        
        if (token) {
          // Save token immediately
          localStorage.setItem('auth_token', token);
          
          // Clear any previous errors
          localStorage.removeItem('auth_error');
          
          // Navigate immediately without delay
          navigate('/');
          return;
        }
        
        // If we have a code but no token, we need to exchange it
        if (code) {
          try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/auth/google/callback?code=${code}`, {
              method: 'GET',
              credentials: 'include',
            });
            
            if (!response.ok) {
              throw new Error('Failed to exchange code for token');
            }
            
            const data = await response.json();
            
            if (data.token) {
              localStorage.setItem('auth_token', data.token);
              navigate('/');
            } else {
              throw new Error('No token received from server');
            }
          } catch (exchangeError: any) {
            console.error('Error exchanging code for token:', exchangeError);
            setError(`Authentication error: ${exchangeError.message}`);
            navigate('/login?error=auth_failed');
          }
        } else {
          setError('Missing authentication data');
          navigate('/login?error=missing_auth_data');
        }
      } catch (error: any) {
        console.error('Authentication error:', error);
        setError(`Authentication error: ${error.message}`);
        navigate('/login?error=auth_failed');
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [location, navigate]);

  // Simplified loading UI
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-700 dark:text-gray-300">Processing login...</p>
      </div>
    );
  }

  // Show error if there's one
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-md">
          <p className="text-red-500 font-medium mb-2">Login Error</p>
          <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/login')}
            className="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // If neither loading nor error, render nothing (redirect should happen)
  return null;
};

export default GoogleCallback; 