'use client';

import toast from 'react-hot-toast';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ITicket } from '@/common/interfaces';
import { useAuth } from '@/context/AuthContext';
import { getLogger } from '@/lib/logger';
import { getCorrelationId } from '@/utils/helpers';

const TicketDetails = () => {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.ticketId;
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<string[]>([]);
  const [ticket, setTicket] = useState<ITicket | null>(null);
  const [editedTicket, setEditedTicket] = useState<Partial<ITicket>>({});
  const [image, setImage] = useState<File | null>(null);

  useEffect(() => {
    if (ticketId) {
      const correlationId = getCorrelationId();
      const logger = getLogger().child({ correlationId });
      const fetchData = async () => {
        const authToken = localStorage.getItem('token');
        if (!authToken) {
          return;
        }
  
        try {
          const [ticketResponse, usersResponse] = await Promise.all([
            fetch(`/api/tickets?id=${ticketId}`, {
              headers: {
                'Authorization': `Bearer ${authToken}`,
              },
            }),
            fetch('/api/users/getAllUsers', {
              headers: {
                'Authorization': `Bearer ${authToken}`,
              },
            })
          ]);
  
          if (ticketResponse.ok && usersResponse.ok) {
            const ticketData = await ticketResponse.json();
            const usersData = await usersResponse.json();
  
            setTicket(ticketData);
            setEditedTicket(ticketData);
            setUsers(usersData.map((user: { username: string }) => user.username));
          } else {
            if (!ticketResponse.ok) {
              toast.error('Failed to fetch ticket details');
            }
          }
        } catch (error) {
          logger.error('Error fetching data:', error);
        }
      };
  
      fetchData();
    }
  }, [ticketId]);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedTicket((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSaveClick = async () => {
    const authToken = localStorage.getItem('token');
    if (!authToken) {
      return;
    }

    const updatedTicket = {
      ...editedTicket,
      partsUsed: editedTicket.partsUsed?.map(part => part.trim()),
    };

    const response = await fetch(`/api/tickets?id=${ticketId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(updatedTicket),
    });

    if (response.ok) {
      router.push('/tickets');
    } else {
      toast.error('Failed to update ticket ... Try again later');
    }
  };

  const handleCancel = () => {
    router.push('/tickets');
  };

  return (
    <div className="min-h-screen p-4 pb-10 flex flex-col items-center justify-center bg-gray-100">
      <div className="flex items-center mb-4">
        <button onClick={() => router.push('/tickets')} className="mr-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-6 h-6 text-gray-800"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Edit Ticket</h1>
      </div>
      <form className="w-full max-w-lg bg-white p-4 rounded-lg shadow-lg">
        <div className="mb-2">
          <label className="block mb-1 text-gray-700">Ticket Number</label>
          <input
            type="text"
            name="ticketNumber"
            value={editedTicket.ticketNumber || ''}
            onChange={handleInputChange}
            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600 bg-gray-100"
            disabled
          />
        </div>
        <div className="mb-2">
          <label className="block mb-1 text-gray-700">Name</label>
          <input
            type="text"
            name="name"
            value={editedTicket.name || ''}
            onChange={handleInputChange}
            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600 bg-gray-100"
            disabled
          />
        </div>
        <div className="mb-2">
          <label className="block mb-1 text-gray-700">Service Address</label>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(editedTicket.serviceAddress || '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600 text-blue-600 underline bg-gray-100"
          >
            {editedTicket.serviceAddress || ''}
          </a>
        </div>
        <div className="mb-2">
          <label className="block mb-1 text-gray-700">Email</label>
          <input
            type="email"
            name="email"
            value={editedTicket.email || ''}
            onChange={handleInputChange}
            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600 bg-gray-100"
            disabled
          />
        </div>
        <div className="mb-2">
          <label className="block mb-1 text-gray-700">Phone Number</label>
          <a
            href={`tel:${editedTicket.phoneNumber}`}
            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600 text-blue-600 underline bg-gray-100"
          >
            {editedTicket.phoneNumber || ''}
          </a>
        </div>
        <div className="mb-2">
          <label className="block mb-1 text-gray-700">Work Order Description</label>
          <textarea
            name="workOrderDescription"
            value={editedTicket.workOrderDescription || ''}
            onChange={handleInputChange}
            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600 bg-gray-100"
            disabled
          />
        </div>
        <div className="mb-2">
          <label className="block mb-1 text-gray-700">Time Availability</label>
          <input
            type="text"
            name="timeAvailability"
            value={editedTicket.timeAvailability || ''}
            onChange={handleInputChange}
            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600 bg-gray-100"
            disabled
          />
        </div>
        <div className="mb-2">
          <label className="block mb-1 text-gray-700">Parts Used</label>
          <input
            type="text"
            name="partsUsed"
            value={editedTicket.partsUsed?.join(', ') || ''}
            onChange={handleInputChange}
            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div className="mb-2">
          <label className="block mb-1 text-gray-700">Services Delivered</label>
          <input
            type="text"
            name="servicesDelivered"
            value={editedTicket.servicesDelivered || ''}
            onChange={handleInputChange}
            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div className="mb-2">
          <label className="block mb-1 text-gray-700">Additional Notes</label>
          <textarea
            name="additionalNotes"
            value={editedTicket.additionalNotes || ''}
            onChange={handleInputChange}
            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div className="mb-2">
          <label className="block mb-1 text-gray-700">Amount Billed</label>
          <input
            type="number"
            name="amountBilled"
            value={editedTicket.amountBilled || ''}
            onChange={handleInputChange}
            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div className="mb-2">
          <label className="block mb-1 text-gray-700">Amount Paid</label>
          <input
            type="number"
            name="amountPaid"
            value={editedTicket.amountPaid || ''}
            onChange={handleInputChange}
            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div className="mb-2">
          <label className="block mb-1 text-gray-700">Upload Image</label>
          <input
            type="file"
            name="image"
            onChange={handleImageChange}
            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={handleSaveClick}
            className="bg-green-600 hover:bg-green-700 text-white p-2 rounded shadow-lg transition duration-300 w-full"
          >
            Save
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded shadow-lg transition duration-300 w-full"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default TicketDetails;