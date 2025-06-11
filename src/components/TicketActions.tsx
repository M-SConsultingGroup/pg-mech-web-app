import React from 'react';
import { useRouter } from 'next/navigation';
import { Ticket } from '@/common/interfaces';
import { FaEdit, FaTrash, FaPrint } from 'react-icons/fa';
import { MdFindInPage } from 'react-icons/md';

interface TicketActionsProps {
  ticket: Ticket;
  isAdmin: boolean;
  handleRowDelete: (ticket: Ticket) => void;
}

const TicketActions: React.FC<TicketActionsProps> = ({ ticket, isAdmin, handleRowDelete }) => {
  const router = useRouter();

  return (
    <div className="flex space-x-2">
      <button
        onClick={() => router.push(`/tickets/${ticket.id}`)}
        className="bg-yellow-500 p-1 rounded flex items-center justify-center text-white hover:bg-yellow-600 transition-colors"
        aria-label="Edit ticket"
      >
        <FaEdit size={16} />
      </button>
      <button
        onClick={() => router.push(`/invoice/${ticket.id}`)}
        className="bg-blue-500 p-1 rounded flex items-center justify-center text-white hover:bg-blue-600 transition-colors"
        aria-label="Print invoice"
      >
        <FaPrint size={16} />
      </button>
      <button
        onClick={() => router.push(`/estimate/${ticket.id}`)}
        className="bg-slate-500 p-1 rounded flex items-center justify-center text-white hover:bg-blue-600 transition-colors"
        aria-label="Print invoice"
      >
        <MdFindInPage size={16} />
      </button>
      {isAdmin && (
        <button
          onClick={() => handleRowDelete(ticket)}
          className="border border-red-500 p-1 rounded flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
          aria-label="Delete ticket"
        >
          <FaTrash size={16} />
        </button>
      )}
    </div>
  );
};

export default TicketActions;