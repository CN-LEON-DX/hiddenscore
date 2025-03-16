import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import api from '../utils/api';

type ProfileFormData = {
  name: string;
  email: string;
  phone?: string;
  address?: string;
};

export default function Profile() {
  const { user, loadUserData } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  // Load user data when component mounts
  useEffect(() => {
    if (!user) {
      // Redirect to login if not authenticated
      navigate('/login');
      return;
    }

    setIsLoading(true);
    // Initialize form with current user data
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: (user as any).phone || '',
      address: (user as any).address || '',
    });
    setIsLoading(false);
  }, [user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear messages when user types
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      // Call API to update profile
      await api.put('/user/profile', formData);
      setSuccess('Profile updated successfully');
      
      // Reload user data to update the app state
      await loadUserData();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Profile Settings</title>
      </Helmet>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Profile Settings</h1>
          
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
              className="px-4 py-2 text-center text-white bg-indigo-600 rounded-md border border-indigo-700 hover:bg-indigo-700"
            >
              Profile
            </Link>
            <Link
              to="/change-password"
              className="px-4 py-2 text-center text-gray-200 bg-gray-800 rounded-md border border-gray-700 hover:bg-gray-700"
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
              <label htmlFor="name" className="block text-sm font-medium text-gray-200">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 py-2 px-3 text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-200">
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                disabled // Email cannot be changed
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-600 py-2 px-3 text-gray-300 shadow-sm"
              />
              <p className="mt-1 text-sm text-gray-400">Email cannot be changed.</p>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-200">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                id="phone"
                value={formData.phone || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 py-2 px-3 text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-200">
                Address
              </label>
              <input
                type="text"
                name="address"
                id="address"
                value={formData.address || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 py-2 px-3 text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
} 