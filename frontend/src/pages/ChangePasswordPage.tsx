// ===== File: frontend/src/pages/ChangePasswordPage.tsx (FIXED) =====

import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import { useAuth } from '../context/AuthContext';

export const ChangePasswordPage = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Redirect when password reset requirement is removed
  useEffect(() => {
    if (user && !user.force_password_reset) {
      navigate('/'); // Redirect to main dashboard
    }
  }, [user, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/api/users/change-password', { new_password: newPassword });
      setMessage('Password changed successfully! Refresh the page to log in with the new password.');

      const token = localStorage.getItem('authToken');
      if (token) {
        login(token); // This will update user state in context
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-2 text-center text-gray-800 dark:text-gray-200">
          Change Your Password
        </h2>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
          For security, you must change your default password before you can proceed.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-gray-700 dark:text-gray-300 font-bold mb-2">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-gray-700 dark:text-gray-300 font-bold mb-2">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          {error && <p className="text-red-500 text-xs italic">{error}</p>}
          {message && <p className="text-green-500 text-xs italic">{message}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-blue-300"
          >
            {isSubmitting ? 'Saving...' : 'Set New Password'}
          </button>
        </form>
      </div>
    </div>
  );
};
