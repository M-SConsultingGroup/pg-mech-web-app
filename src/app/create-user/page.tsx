'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { apiFetch } from '@/lib/api';

export default function CreateUser() {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You are not authorized to view this page');
      return;
    }
    setLoading(true);
    const response = await apiFetch('/api/users/create', 'POST', { username, password, isAdmin }, token);
    setLoading(false);
    if (response.ok) {
      toast.success('User created successfully');
      router.push('/tickets');
    } else {
      const data = await response.json();
      toast.error(data.error || 'Failed to create user');
    }
  };

  const handleCancel = () => {
    router.push('/tickets');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-6">Create User</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mt-1"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mt-1"
              required
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
              className="mr-2"
            />
            <label className="text-gray-700">Admin</label>
          </div>
          <div className="flex space-x-4">
            <button
              type="submit"
              className="w-full bg-blue-500 text-white p-2 rounded mt-4"
            >
              Create User
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="w-full bg-gray-500 text-white p-2 rounded mt-4"
            >
              Cancel
            </button>
          </div>
          {loading && (
            <div className="loader-container">
              <div className="loader"></div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}