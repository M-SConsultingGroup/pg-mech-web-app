"use client";

import { useState, useEffect } from 'react';
import { ITicket } from '@/common/interfaces';

export default function Tickets() {
  const [tickets, setTickets] = useState<ITicket[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    serviceAddress: '',
    workOrderDescription: '',
    timeAvailability: '',
  });

  useEffect(() => {
    const fetchTickets = async () => {
      const response = await fetch('/api/tickets');
      const data = await response.json();
      setTickets(data);
    };

    fetchTickets();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch('/api/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      const newTicket = await response.json();
      setTickets((prevTickets) => [...prevTickets, newTicket]);
      setShowForm(false);
      setFormData({
        name: '',
        email: '',
        phoneNumber: '',
        serviceAddress: '',
        workOrderDescription: '',
        timeAvailability: '',
      });
    } else {
      const data = await response.json();
      alert(data.error);
    }
  };

  return (
    <div className="min-h-screen p-8 pb-20">
      <h1 className="text-2xl font-bold mb-4">Tickets</h1>
      <button
        onClick={() => setShowForm(!showForm)}
        className="bg-blue-500 text-white p-2 rounded mb-4"
      >
        {showForm ? 'Cancel' : 'Create New Ticket'}
      </button>
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="mb-2">
            <label className="block mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="border p-2 rounded w-full"
              required
            />
          </div>
          <div className="mb-2">
            <label className="block mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="border p-2 rounded w-full"
              required
            />
          </div>
          <div className="mb-2">
            <label className="block mb-1">Phone Number</label>
            <input
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              className="border p-2 rounded w-full"
              required
            />
          </div>
          <div className="mb-2">
            <label className="block mb-1">Service Address</label>
            <input
              type="text"
              name="serviceAddress"
              value={formData.serviceAddress}
              onChange={handleInputChange}
              className="border p-2 rounded w-full"
              required
            />
          </div>
          <div className="mb-2">
            <label className="block mb-1">Work Order Description</label>
            <textarea
              name="workOrderDescription"
              value={formData.workOrderDescription}
              onChange={handleInputChange}
              className="border p-2 rounded w-full"
              required
            />
          </div>
          <div className="mb-2">
            <label className="block mb-1">Time Availability</label>
            <input
              type="text"
              name="timeAvailability"
              value={formData.timeAvailability}
              onChange={handleInputChange}
              className="border p-2 rounded w-full"
              required
            />
          </div>
          <button type="submit" className="bg-green-500 text-white p-2 rounded">
            Submit
          </button>
        </form>
      )}
      <table className="min-w-full border-collapse border border-gray-400">
        <thead>
          <tr>
            <th className="border border-gray-400 p-2">Ticket Number</th>
            <th className="border border-gray-400 p-2">Name</th>
            <th className="border border-gray-400 p-2">Email</th>
            <th className="border border-gray-400 p-2">Phone Number</th>
            <th className="border border-gray-400 p-2">Service Address</th>
            <th className="border border-gray-400 p-2">Work Order Description</th>
            <th className="border border-gray-400 p-2">Time Availability</th>
            <th className="border border-gray-400 p-2">Status</th>
            <th className="border border-gray-400 p-2">Created At</th>
            <th className="border border-gray-400 p-2">Updated At</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket: ITicket) => (
            <tr key={ticket._id}>
              <td className="border border-gray-400 p-2">{ticket.ticketNumber}</td>
              <td className="border border-gray-400 p-2">{ticket.name}</td>
              <td className="border border-gray-400 p-2">{ticket.email}</td>
              <td className="border border-gray-400 p-2">{ticket.phoneNumber}</td>
              <td className="border border-gray-400 p-2">{ticket.serviceAddress}</td>
              <td className="border border-gray-400 p-2">{ticket.workOrderDescription}</td>
              <td className="border border-gray-400 p-2">{ticket.timeAvailability}</td>
              <td className="border border-gray-400 p-2">{ticket.status}</td>
              <td className="border border-gray-400 p-2">{new Date(ticket.createdAt).toLocaleString()}</td>
              <td className="border border-gray-400 p-2">{new Date(ticket.updatedAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}