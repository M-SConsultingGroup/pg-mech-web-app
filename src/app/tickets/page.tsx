"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ITicket } from '@/common/interfaces';

export default function Tickets() {
  const [tickets, setTickets] = useState<ITicket[]>([]);
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [editedTicket, setEditedTicket] = useState<Partial<ITicket>>({});
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    const fetchTickets = async () => {
      const response = await fetch('/api/tickets');
      const data = await response.json();
      setTickets(data);
    };

    fetchTickets();
  }, []);

  const handleEditClick = (ticket: ITicket) => {
    setEditingTicketId(ticket._id || null);
    setEditedTicket(ticket);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedTicket((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveClick = async (ticketId: string) => {
    const response = await fetch(`/api/tickets?id=${ticketId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(editedTicket),
    });

    if (response.ok) {
      const updatedTicket = await response.json();
      setTickets((prev) =>
        prev.map((ticket) => (ticket._id === ticketId ? updatedTicket : ticket))
      );
      setEditingTicketId(null);
    } else {
      // Handle error
      console.error('Failed to update ticket');
    }
  };

  const handleRowToggle = (ticketId: string) => {
    setExpandedRows((prev) => {
      const newExpandedRows = new Set(prev);
      if (newExpandedRows.has(ticketId)) {
        newExpandedRows.delete(ticketId);
      } else {
        newExpandedRows.add(ticketId);
      }
      return newExpandedRows;
    });
  };

  return (
    <div className="min-h-screen p-8 pb-20">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Tickets</h1>
        <button
          onClick={() => router.push('/')}
          className="bg-blue-500 text-white p-2 rounded"
        >
          + NEW
        </button>
      </div>
      <table className="min-w-full border-collapse border border-gray-400">
        <thead>
          <tr>
            <th className="border border-gray-400 p-2 pr-4">Ticket Number</th>
            <th className="border border-gray-400 p-2 pr-4">Name</th>
            <th className="border border-gray-400 p-2 pr-4">Service Address</th>
            <th className="border border-gray-400 p-2 pr-4 hidden md:table-cell">Email</th>
            <th className="border border-gray-400 p-2 pr-4 hidden md:table-cell">Phone Number</th>
            <th className="border border-gray-400 p-2 pr-4 hidden md:table-cell">Work Order Description</th>
            <th className="border border-gray-400 p-2 pr-4 hidden md:table-cell">Time Availability</th>
            <th className="border border-gray-400 p-2 pr-4 hidden md:table-cell">Status</th>
            <th className="border border-gray-400 p-2 pr-4 hidden md:table-cell">Created At</th>
            <th className="border border-gray-400 p-2 pr-4 hidden md:table-cell">Updated At</th>
            <th className="border border-gray-400 p-2 pr-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket: ITicket) => (
            <React.Fragment key={ticket._id}>
              <tr>
                <td className="border border-gray-400 p-2 pr-4">{ticket.ticketNumber}</td>
                <td className="border border-gray-400 p-2 pr-4">{ticket.name}</td>
                <td className="border border-gray-400 p-2 pr-4">{ticket.serviceAddress}</td>
                <td className="border border-gray-400 p-2 pr-4 hidden md:table-cell">{ticket.email}</td>
                <td className="border border-gray-400 p-2 pr-4 hidden md:table-cell">{ticket.phoneNumber}</td>
                <td className="border border-gray-400 p-2 pr-4 hidden md:table-cell">{ticket.workOrderDescription}</td>
                <td className="border border-gray-400 p-2 pr-4 hidden md:table-cell">{ticket.timeAvailability}</td>
                <td className="border border-gray-400 p-2 pr-4 hidden md:table-cell">
                  {editingTicketId === ticket._id ? (
                    <select
                      name="status"
                      value={editedTicket.status}
                      onChange={handleInputChange}
                      className="border p-2 rounded"
                    >
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="closed">Closed</option>
                    </select>
                  ) : (
                    ticket.status
                  )}
                </td>
                <td className="border border-gray-400 p-2 pr-4 hidden md:table-cell">{new Date(ticket.createdAt).toLocaleString()}</td>
                <td className="border border-gray-400 p-2 pr-4 hidden md:table-cell">{new Date(ticket.updatedAt).toLocaleString()}</td>
                <td className="border border-gray-400 p-2 pr-4">
                  <div className="flex items-center">
                    {editingTicketId === ticket._id ? (
                      <button
                        onClick={() => handleSaveClick(ticket._id!)}
                        className="bg-green-500 text-white p-2 rounded"
                      >
                        Save
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEditClick(ticket)}
                        className="bg-yellow-500 text-white p-2 rounded"
                      >
                        <img src="/edit-pen.svg" alt="Edit" className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleRowToggle(ticket._id!)}
                      className="ml-2 bg-gray-500 text-white p-2 rounded md:hidden w-4"
                    >
                      {expandedRows.has(ticket._id!) ? '▲' : '▼'}
                    </button>
                  </div>
                </td>
              </tr>
              {expandedRows.has(ticket._id!) && (
                <tr className="md:hidden">
                  <td colSpan={4} className="border border-gray-400">
                    <div><strong>Email:</strong> {ticket.email}</div>
                    <div><strong>Phone Number:</strong> {ticket.phoneNumber}</div>
                    <div><strong>Work Order Description:</strong> {ticket.workOrderDescription}</div>
                    <div><strong>Time Availability:</strong> {ticket.timeAvailability}</div>
                    <div><strong>Status:</strong> {ticket.status}</div>
                    <div><strong>Created At:</strong> {new Date(ticket.createdAt).toLocaleString()}</div>
                    <div><strong>Updated At:</strong> {new Date(ticket.updatedAt).toLocaleString()}</div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}