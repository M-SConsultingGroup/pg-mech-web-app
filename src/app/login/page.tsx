"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { getLogger } from '@/lib/logger';
import { getCorrelationId } from '@/utils/helpers';

const logger = getLogger();

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/tickets');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
  
    const correlationId = getCorrelationId();
    const loggerWithCorrelationId = logger.child({ correlationId });
  
    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
  
      const data = await response.json();
      setLoading(false);
      if (response.ok) {
        loggerWithCorrelationId.debug('Login successful : ', data.username);
        login(data.username, data.token);
        toast.success('Login successful', {
          className: 'text-xl',
        });
        router.push('/tickets');
      } else {
        loggerWithCorrelationId.warn('Login failed', data);
        throw new Error(data.error);
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid credentials') {
        toast.error('Invalid Username or Password', {
          className: 'text-xl',
        });
      } else {
        loggerWithCorrelationId.error('Login error:', error);
        toast.error('An error occurred, please try again', {
          className: 'text-xl',
        });
      }
    }
  };

  return (
    <div className="min-h-screen p-8 pb-20 flex flex-col items-center justify-center bg-gray-100 relative">
      <div className="w-full max-w-lg bg-white p-8 rounded-lg shadow-lg relative">
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="mb-4">
            <label className="block mb-2 text-gray-700">Username</label>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2 text-gray-700">Password</label>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white p-3 rounded shadow-lg transition duration-300 w-full"
          >
            Login
          </button>
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