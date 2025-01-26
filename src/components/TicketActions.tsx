import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Ticket } from '@/common/interfaces';

interface TicketActionsProps {
  ticket: Ticket;
  isAdmin: boolean;
  handleStartClick: (ticket: Ticket) => void;
  handleStopClick: (ticket: Ticket) => void;
  handlePhoneClick: (phoneNumber: string, serviceAddress: string) => void;
  handleRowDelete: (id: string) => void;
}

const TicketActions: React.FC<TicketActionsProps> = ({ ticket, isAdmin, handleStartClick, handleStopClick, handlePhoneClick, handleRowDelete }) => {
  const router = useRouter();

  return (
    <>
      {ticket.inProgress ? (
        <button onClick={() => handleStopClick(ticket)} className="outline-2 outline p-1 rounded flex">
          <Image src="/stop-sign.svg" alt="Stop" width={25} height={25} />
        </button>
      ) : (
        <button onClick={() => handleStartClick(ticket)} className="outline-2 outline p-1 rounded flex">
          <Image src="/play-button.svg" alt="Start" width={25} height={25} />
        </button>
      )}
      <button onClick={() => router.push(`/tickets/${ticket._id}`)} className="bg-yellow-500 p-1 rounded flex">
        <Image src="/edit-pen.svg" alt="Edit" width={25} height={25} />
      </button>
      <button onClick={() => handlePhoneClick(ticket.phoneNumber, ticket.serviceAddress)} className="bg-gray-500 p-1 rounded flex">
        <Image src="/phone-call.svg" alt="Phone" width={25} height={25} />
      </button>
      {isAdmin && (
        <button onClick={() => handleRowDelete(ticket._id || '')} className="border border-gray-500 p-1 rounded flex">
          <Image src="/trash-bin-red.svg" alt="Delete" width={25} height={25} />
        </button>
      )}
    </>
  );
};

export default TicketActions;