"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { getLogger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

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

  const getCorrelationId = () => {
    let correlationId = localStorage.getItem('correlationId');
    if (!correlationId) {
      correlationId = uuidv4();
      localStorage.setItem('correlationId', correlationId);
    }
    return correlationId;
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
  
    const correlationId = getCorrelationId();
    const loggerWithCorrelationId = logger.child({ correlationId });
  
    loggerWithCorrelationId.debug('Starting login process');
  
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
        loggerWithCorrelationId.debug('Login successful');
        login(data.username, data.token);
        toast.success('Login successful', {
          className: 'text-xl',
        });
        router.push('/tickets');
      } else {
        loggerWithCorrelationId.warn('Login failed', data);
        throw new Error(data.message || 'Invalid Username or Password');
      }
    } catch (error) {
      loggerWithCorrelationId.error('Login error:', error);
      if (error instanceof Error && error.message === 'Invalid Username or Password') {
        toast.error('Invalid Username or Password', {
          className: 'text-xl',
        });
      } else {
        toast.error('An error occurred, please try again', {
          className: 'text-xl',
        });
      }
    }
  };

  return (
    <div className="min-h-screen p-8 pb-20 flex flex-col items-center justify-center bg-gray-100 relative">
      <button
        onClick={() => router.push('/')}
        className="absolute top-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded shadow-lg transition duration-300"
      >
        Home
      </button>
      <div className="w-full max-w-lg bg-white p-8 rounded-lg shadow-lg relative">
        <Image
          className="mb-8"
          src="/next-button.svg"
          alt="Next.js logo"
          width={64}
          height={64}
          priority
        />
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
            <div className="absolute inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-10">
              <div className="loader"></div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}