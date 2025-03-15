import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const GoogleCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get error from URL if any
        const searchParams = new URLSearchParams(location.search);
        const error = searchParams.get('error');
        
        if (error) {
          // If there's an error in the URL, redirect to error page
          navigate(`/error?message=${encodeURIComponent(error)}`);
          return;
        }

        // If no error but response has error message
        const response = await fetch('/api/auth/google/callback' + location.search);
        const data = await response.json();
        
        if (!response.ok) {
          if (data.error?.includes('duplicate key value')) {
            navigate('/error?message=This email is already registered. Please try logging in with your password.');
            return;
          }
          throw new Error(data.error || 'Failed to authenticate with Google');
        }

        // If successful, redirect to home
        navigate('/');
      } catch (error) {
        console.error('Error in Google callback:', error);
        navigate('/error?message=Authentication failed. Please try again.');
      }
    };

    handleCallback();
  }, [location, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );
};

export default GoogleCallback; 