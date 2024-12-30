"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { getLogger } from '@/lib/logger';

export default function Reschedule() {
  const router = useRouter();
  const { ticketId } = router.query;

  const [newTimeAvailability, setNewTimeAvailability] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ticketId) {
      toast.error('Ticket ID is missing.');
      router.push('/');
    }
  }, [ticketId, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    if (name === 'newTimeAvailability') {
      setNewTimeAvailability(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);

    const logger = getLogger();

    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ timeAvailability: newTimeAvailability })
      });
      setLoading(false);
      if (response.ok) {
        toast.success('Ticket rescheduled successfully', {
          className: 'text-xl'
        });
        setNewTimeAvailability('');
      } else {
        const errorData = await response.json();
        throw new Error(`Failed to reschedule ticket: ${response.status} - ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      logger.error('Ticket rescheduling error:', error);
      toast.error('An error occurred, please try again later', {
        className: 'text-xl'
      });
    }
  };

  return (
    <div className="min-h-screen p-8 pb-20 flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Reschedule a Ticket</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-lg bg-white p-8 rounded-lg shadow-lg relative">
        <div className="mb-4">
          <label className="block mb-2 text-gray-700">New Time Availability</label>
          <input
            type="text"
            name="newTimeAvailability"
            value={newTimeAvailability}
            onChange={handleInputChange}
            placeholder="Enter new time availability"
            className="border p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>
        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white p-3 rounded shadow-lg transition duration-300 w-full"
        >
          Reschedule
        </button>
        {loading && (
          <div className="loader-container">
            <div className="loader"></div>
          </div>
        )}
      </form>
    </div>
  );
}