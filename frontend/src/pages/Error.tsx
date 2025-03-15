import { useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { FaExclamationTriangle, FaHome } from 'react-icons/fa';

const Error = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const errorMessage = searchParams.get('message') || 'An unexpected error occurred';

  return (
    <>
      <Helmet>
        <title>Error - Hidden Score</title>
      </Helmet>
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          <div className="mb-8">
            <FaExclamationTriangle className="mx-auto h-16 w-16 text-red-500" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Error</h1>
          <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
            <p className="text-gray-800 mb-4 whitespace-pre-wrap">{errorMessage}</p>
          </div>
          <div className="space-y-4">
            <Link
              to="/"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
            >
              <FaHome className="mr-2" />
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Error; 