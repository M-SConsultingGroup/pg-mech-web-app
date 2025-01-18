'use client';
import { User } from '@/common/interfaces';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';

export default function AllUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [passwords, setPasswords] = useState<{ [key: string]: string }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [userToUpdate, setUserToUpdate] = useState<string | null>(null);

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

  const handlePasswordChange = (username: string, password: string) => {
    setPasswords((prev) => ({ ...prev, [username]: password }));
  };

  const handleUpdatePassword = async () => {
    if (!userToUpdate) return;

    const token = localStorage.getItem('token');
    const password = passwords[userToUpdate];
    if (!password) {
      toast.error('Password cannot be empty');
      return;
    }

    const response = await fetch('/api/users/updatePassword', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ username: userToUpdate, password })
    });

    if (response.ok) {
      toast.success('Password updated successfully');
    } else {
      toast.error('Failed to update password');
    }

    setIsModalOpen(false);
    setUserToUpdate(null);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    const token = localStorage.getItem('token');
    const response = await fetch(`/api/users/deleteUser?username=${userToDelete}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      setUsers((prev) => prev.filter((user) => user.username !== userToDelete));
      toast.success('User deleted successfully');
    } else {
      toast.error('Failed to delete user');
    }

    setIsModalOpen(false);
    setUserToDelete(null);
  };

  const openDeleteModal = (username: string) => {
    setUserToDelete(username);
    setModalMessage('Are you sure you want to delete this user?');
    setConfirmAction(() => handleDeleteUser);
    setIsModalOpen(true);
  };

  const openUpdateModal = (username: string) => {
    setUserToUpdate(username);
    setModalMessage('Are you sure you want to update the password for this user?');
    setConfirmAction(() => handleUpdatePassword);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setUserToDelete(null);
    setUserToUpdate(null);
  };

  return (
    <div className="min-h-screen p-8 pb-20 flex flex-col items-center bg-gray-100">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Non-Admin Users</h1>
      <div className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-lg">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 p-2 text-left">Username</th>
              <th className="border border-gray-300 p-2 text-left">Password</th>
              <th className="border border-gray-300 p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.username}>
                <td className="border border-gray-300 p-2">{user.username}</td>
                <td className="border border-gray-300 p-2">
                  <div className="flex items-center">
                    <input
                      type="password"
                      value={passwords[user.username] || ''}
                      onChange={(e) => handlePasswordChange(user.username, e.target.value)}
                      className="border p-2 rounded w-full mr-2"
                    />
                    <button
                      onClick={() => openUpdateModal(user.username)}
                      className="bg-blue-500 hover:bg-blue-700 text-white p-2 rounded"
                    >
                      Update
                    </button>
                  </div>
                </td>
                <td className="border border-gray-300 p-2">
                  <button
                    onClick={() => openDeleteModal(user.username)}
                    className="bg-red-500 hover:bg-red-700 text-white p-2 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmationModal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        onConfirm={confirmAction}
        message={modalMessage}
      />
    </div>
  );
}