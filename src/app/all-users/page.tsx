'use client';
import { User } from '@/common/interfaces';
import React, { useEffect, useState } from 'react';

export default function AllUsersPage() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const fetchUsers = async () => {
      const response = await fetch('/api/users/getAllUsers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setUsers(data);
    };

    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen p-8 pb-20 flex flex-col items-center bg-gray-100">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Non-Admin Users</h1>
      <table className="min border-collapse border border-gray-400 w-full">
        <thead>
          <tr>
            <th className="border border-gray-400 p-2 pr-4">Username</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.username}>
              <td className="border border-gray-400 p-2 pr-4">{user.username}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}