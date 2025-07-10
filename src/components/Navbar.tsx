"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { FiMenu, FiX, FiUser, FiLogOut, FiClock, FiUsers, FiPlus, FiTruck, FiMap } from 'react-icons/fi';

const Navbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isLoggedIn, username, logout, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSignOut = () => {
    logout();
    localStorage.removeItem('token');
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

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: 'Tickets', path: '/tickets', icon: <FiTruck className="mr-2" /> },
    ...(isAdmin ? [
      { name: 'Map', path: '/map', icon: <FiMap className="mr-2" /> },
      { name: 'Create User', path: '/create-user', icon: <FiPlus className="mr-2" /> },
      { name: 'Time Logs', path: '/time-logs', icon: <FiClock className="mr-2" /> },
      { name: 'All Users', path: '/all-users', icon: <FiUsers className="mr-2" /> },
    ] : []),
  ];

  return (
    <nav className="bg-blue-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0 cursor-pointer" onClick={() => router.push('/')}>
              <Image
                src="/logo.png"
                alt="PG Mechanical Logo"
                width={48}
                height={48}
                className="h-12 w-12"
              />
            </div>
            <h1 className="text-xl font-bold ml-2 hidden sm:block">PG Mechanical</h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              {navLinks.map((link) => (
                <button
                  key={link.path}
                  onClick={() => router.push(link.path)}
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${pathname === link.path ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-700 hover:text-white'} `}
                >
                  {link.icon}
                  {link.name}
                </button>
              ))}
            </div>
          </div>

          {/* User controls */}
          <div className="flex items-center">
            <div className="relative ml-4" ref={dropdownRef}>
              {isLoggedIn ? (
                <>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center text-sm rounded-full focus:outline-none"
                  >
                    <div className="w-8 h-8 flex items-center justify-center bg-blue-700 rounded-full text-white">
                      {username ? username.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="ml-2 hidden md:inline">{username}</span>
                  </button>

                  {dropdownOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                      <div className="py-1">
                        <button
                          onClick={handleSignOut}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <FiLogOut className="mr-2" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={() => router.push('/login')}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded shadow-lg transition duration-300 flex items-center"
                >
                  <FiUser className="mr-2" />
                  Sign In
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden ml-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-blue-200 hover:text-white hover:bg-blue-700 focus:outline-none"
              >
                {mobileMenuOpen ? (
                  <FiX className="h-6 w-6" />
                ) : (
                  <FiMenu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-blue-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => router.push(link.path)}
                className={`w-full text-left px-3 py-2 rounded-md text-base font-medium flex items-center ${pathname === link.path
                  ? 'bg-blue-700 text-white'
                  : 'text-blue-200 hover:bg-blue-700 hover:text-white'
                  }`}
              >
                {link.icon}
                {link.name}
              </button>
            ))}
          </div>
          {isLoggedIn && (
            <div className="px-2 pt-2 pb-3 border-t border-blue-700">
              <button
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-blue-200 hover:bg-blue-700 hover:text-white flex items-center"
              >
                <FiLogOut className="mr-2" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;