import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Ticket } from '@/common/interfaces';

interface TicketActionsProps {
  ticket: Ticket;
  isAdmin: boolean;
  handlePhoneClick: (phoneNumber: string, serviceAddress: string) => void;
  handleRowDelete: (ticket: Ticket) => void;
}

const TicketActions: React.FC<TicketActionsProps> = ({ ticket, isAdmin, handlePhoneClick, handleRowDelete }) => {
  const router = useRouter();

  return (
    <>
      <button onClick={() => router.push(`/tickets/${ticket.id}`)} className="bg-yellow-500 p-1 rounded flex">
        <Image src="/edit-pen.svg" alt="Edit" width={25} height={25} />
      </button>
      <button onClick={() => handlePhoneClick(ticket.phoneNumber, ticket.serviceAddress)} className="bg-gray-500 p-1 rounded flex">
        <Image src="/phone-call.svg" alt="Phone" width={25} height={25} />
      </button>
      {isAdmin && (
        <button onClick={() => handleRowDelete(ticket)} className="border border-gray-500 p-1 rounded flex">
          <Image src="/trash-bin-red.svg" alt="Delete" width={25} height={25} />
        </button>
      )}
    </>
  );
};

export default TicketActions;