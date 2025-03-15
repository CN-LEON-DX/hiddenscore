import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { FaHome, FaExclamationTriangle } from 'react-icons/fa';

const Error404 = () => {
  return (
    <>
      <Helmet>
        <title>404 - Page Not Found</title>
      </Helmet>
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          <div className="mb-8">
            <FaExclamationTriangle className="mx-auto h-16 w-16 text-yellow-500" />
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-3xl font-semibold text-gray-800 mb-4">Page Not Found</h2>
          <p className="text-gray-600 mb-8">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
          <div className="space-y-4">
            <Link
              to="/"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
            >
              <FaHome className="mr-2" />
              Go back home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Error404; 