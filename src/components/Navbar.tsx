// components/Navbar.tsx

"use client";

import Link from 'next/link';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

const Navbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { isLoggedIn, username, logout, isAdmin } = useAuth();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSignOut = () => {
    logout();
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    router.push('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-blue-900 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Image
            src="/logo.png"
            alt="Logo"
            width={64}
            height={64}
            className="w-16 h-16 cursor-pointer"
            onClick={() => router.push('/')}
          />
          <h1 className="text-2xl font-bold ml-2">PG Mechanical</h1>
        </div>
        <div className="relative flex items-center" ref={dropdownRef}>
          {isLoggedIn ? (
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded shadow-lg transition duration-300"
            >
              <span className="w-8 h-8 flex items-center justify-center bg-gray-500 rounded-full text-white">
                {username ? username.charAt(0).toUpperCase() : 'U'}
              </span>
            </button>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded shadow-lg transition duration-300"
            >
              Sign In
            </button>
          )}
          {dropdownOpen && isLoggedIn && (
            <div className="absolute top-12 right-0 mt-2 w-48 bg-white border border-gray-300 rounded shadow-lg z-50">
              {isAdmin && (
                <>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      router.push('/create-user');
                    }}
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    Create User
                  </button>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      router.push('/time-logs');
                    }}
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    Time Logs
                  </button>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      router.push('/all-users');
                    }}
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    All Users
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  router.push('/tickets');
                }}
                className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                Tickets
              </button>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  handleSignOut();
                }}
                className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
