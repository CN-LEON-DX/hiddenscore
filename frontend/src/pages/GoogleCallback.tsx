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
        setLoading(true);
        const searchParams = new URLSearchParams(location.search);
        const token = searchParams.get('token');
        const code = searchParams.get('code');
        const errorParam = searchParams.get('error');
        
        console.log("GoogleCallback params:", { token, code, error: errorParam, path: location.pathname, search: location.search });
        
        if (errorParam) {
          setError(`Authentication error: ${errorParam}`);
          navigate(`/login?error=${encodeURIComponent(errorParam)}`);
          return;
        }
        
        if (token) {
          console.log("Token found in URL, storing and redirecting to home");
          localStorage.setItem('auth_token', token);
          
          // Clear any previous errors from localStorage
          localStorage.removeItem('auth_error');
          
          // Short delay before redirect to ensure token is saved
          setTimeout(() => {
            navigate('/');
          }, 100);
          return;
        }
        
        if (code) {
          console.log("Code found, calling backend...");
          
          try {
            // Use the full URL to avoid CORS issues with different ports
            const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';
            const response = await fetch(`${backendUrl}/auth/google/callback${location.search}`, {
              method: 'GET',
              credentials: 'include',
              headers: {
                'Accept': 'application/json',
              },
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              
              if (errorData.code === 'EMAIL_ALREADY_EXISTS') {
                navigate('/login?error=email_exists');
                return;
              }
              
              throw new Error(errorData.error || errorData.message || 'Failed to authenticate with Google');
            }
            
            // If we get here with code but no redirect happened,
            // the server might have returned JSON instead of a redirect
            try {
              const data = await response.json();
              
              if (data.token) {
                localStorage.setItem('auth_token', data.token);
                navigate('/');
              } else if (data.redirect_to) {
                window.location.href = data.redirect_to;
              } else {
                throw new Error('Invalid response from server');
              }
            } catch (jsonError) {
              // Response might not be JSON, which is okay if it was a redirect
              console.log('Response was not JSON, but might be a redirect');
              
              // If we're still on the callback page, something went wrong
              if (window.location.pathname.includes('/auth/google')) {
                setError('Authentication failed: No redirect occurred');
                navigate('/login?error=auth_failed');
              }
            }
          } catch (fetchError: any) {
            console.error('Fetch error in Google callback:', fetchError);
            setError(`Authentication failed: ${fetchError.message}`);
            toast.error('Login failed. Please try again.', {
              position: "top-right",
              autoClose: 3000
            });
            navigate('/login?error=auth_failed');
          }
        } else {
          console.error("No token or code found in callback URL");
          setError('Missing authentication data');
          navigate('/login?error=missing_auth_data');
        }
      } catch (error: any) {
        console.error('Error in Google callback:', error);
        setError(`Authentication error: ${error.message}`);
        toast.error('Login failed. Please try again.', {
          position: "top-right",
          autoClose: 3000
        });
        navigate('/login?error=auth_failed');
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [location, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
          <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">Processing your login...</p>
        </>
      ) : error ? (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
          <p className="text-red-500 text-lg mb-4">Authentication Error</p>
          <p className="text-gray-700 dark:text-gray-300">{error}</p>
          <button 
            onClick={() => navigate('/login')}
            className="mt-6 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
          >
            Return to Login
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default GoogleCallback; 