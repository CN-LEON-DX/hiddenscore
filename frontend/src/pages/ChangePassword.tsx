import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { authAPI } from '../utils/api';

export default function ChangePassword() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const validateForm = () => {
    setError('');
    
    if (!currentPassword) {
      setError('Please enter your current password');
      return false;
    }
    
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return false;
    }
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await authAPI.changePassword(currentPassword, newPassword);
      setSuccess('Your password has been changed successfully');
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to change password';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <Helmet>
        <title>Change Password</title>
      </Helmet>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Change Password</h1>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 rounded-md border border-red-200">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-4 bg-green-50 rounded-md border border-green-200">
              <p className="text-green-700">{success}</p>
            </div>
          )}
          
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <Link
              to="/profile"
              className="px-4 py-2 text-center text-gray-200 bg-gray-800 rounded-md border border-gray-700 hover:bg-gray-700"
            >
              Profile
            </Link>
            <Link
              to="/change-password"
              className="px-4 py-2 text-center text-white bg-indigo-600 rounded-md border border-indigo-700 hover:bg-indigo-700"
            >
              Change Password
            </Link>
            <Link
              to="/settings"
              className="px-4 py-2 text-center text-gray-200 bg-gray-800 rounded-md border border-gray-700 hover:bg-gray-700"
            >
              Settings
            </Link>
            <Link
              to="/order-history"
              className="px-4 py-2 text-center text-gray-200 bg-gray-800 rounded-md border border-gray-700 hover:bg-gray-700"
            >
              Order History
            </Link>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6 bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-200">
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 py-2 px-3 text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-200">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 py-2 px-3 text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                required
                minLength={8}
              />
              <p className="mt-1 text-sm text-gray-400">
                Password must be at least 8 characters long
              </p>
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-200">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 py-2 px-3 text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                required
              />
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isLoading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
} 