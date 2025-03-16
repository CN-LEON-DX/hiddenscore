import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import api from '../utils/api';

type SettingsFormData = {
  language: string;
  darkMode: boolean;
  notifications: boolean;
  emailUpdates: boolean;
};

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState<SettingsFormData>({
    language: 'english',
    darkMode: true,
    notifications: true,
    emailUpdates: false,
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    setIsLoading(true);
    
    setTimeout(() => {
      setFormData({
        language: 'english',
        darkMode: true,
        notifications: true,
        emailUpdates: false,
      });
      setIsLoading(false);
    }, 500);
    
  }, [user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
    
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setSuccess('Settings updated successfully');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update settings');
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
        <title>Account Settings</title>
      </Helmet>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Account Settings</h1>
          
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
              className="px-4 py-2 text-center text-gray-200 bg-gray-800 rounded-md border border-gray-700 hover:bg-gray-700"
            >
              Change Password
            </Link>
            <Link
              to="/settings"
              className="px-4 py-2 text-center text-white bg-indigo-600 rounded-md border border-indigo-700 hover:bg-indigo-700"
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
              <label htmlFor="language" className="block text-sm font-medium text-gray-200">
                Language
              </label>
              <select
                id="language"
                name="language"
                value={formData.language}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 py-2 px-3 text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              >
                <option value="english">English</option>
                <option value="vietnamese">Vietnamese</option>
                <option value="spanish">Spanish</option>
                <option value="french">French</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="darkMode"
                name="darkMode"
                checked={formData.darkMode}
                onChange={handleInputChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-600 rounded"
              />
              <label htmlFor="darkMode" className="ml-3 block text-sm font-medium text-gray-200">
                Dark Mode
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="notifications"
                name="notifications"
                checked={formData.notifications}
                onChange={handleInputChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-600 rounded"
              />
              <label htmlFor="notifications" className="ml-3 block text-sm font-medium text-gray-200">
                Enable Notifications
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="emailUpdates"
                name="emailUpdates"
                checked={formData.emailUpdates}
                onChange={handleInputChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-600 rounded"
              />
              <label htmlFor="emailUpdates" className="ml-3 block text-sm font-medium text-gray-200">
                Receive Email Updates
              </label>
            </div>

            <div className="pt-4 border-t border-gray-700">
              <h3 className="text-lg font-medium text-gray-100 mb-4">Connected Accounts</h3>
              
              <div className="flex items-center justify-between py-3 px-4 bg-gray-700 rounded-md">
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z"></path>
                  </svg>
                  <span className="ml-3 text-gray-200">Twitter</span>
                </div>
                <button 
                  type="button"
                  className="text-gray-200 hover:text-white text-sm font-medium"
                >
                  Connect
                </button>
              </div>
              
              <div className="flex items-center justify-between py-3 px-4 bg-gray-700 rounded-md mt-3">
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"></path>
                  </svg>
                  <span className="ml-3 text-gray-200">Facebook</span>
                </div>
                <button 
                  type="button"
                  className="text-gray-200 hover:text-white text-sm font-medium"
                >
                  Connect
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-700">
              <h3 className="text-lg font-medium text-gray-100 mb-4">Delete Account</h3>
              <p className="text-gray-300 text-sm mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button
                type="button"
                className="px-4 py-2 border border-red-600 text-red-500 rounded-md hover:bg-red-900 hover:bg-opacity-20 focus:outline-none"
              >
                Delete Account
              </button>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-700">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
} 