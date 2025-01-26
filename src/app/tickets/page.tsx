"use client";
import { useAuth } from '@/context/AuthContext';
import { Ticket, Priority, priorityMap, ModalType } from '@/common/interfaces';
import { TICKET_STATUSES } from '@/common/constants';
import UnifiedModal from '@/components/UnifiedModal';
import TicketActions from '@/components/TicketActions';
import { useRouter } from 'next/navigation';
import { Loader } from '@googlemaps/js-api-loader';
import toast from 'react-hot-toast';
import Modal from 'react-modal';
import React, { useState, useEffect } from 'react';

export default function Tickets() {
  const router = useRouter();
  const { username, isAdmin } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<string | null>('priority');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filter, setFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>(isAdmin ? 'New' : 'Open');
  const [assignedToFilter, setAssignedToFilter] = useState<string>('');
  const [assignedUsers, setAssignedUsers] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [modalProps, setModalProps] = useState<{
    modalType: ModalType;
    isOpen: boolean;
    onSelectPriority?: (priority: Priority) => void;
    onSaveNotes?: (notes: string) => void;
    phoneNumber?: string;
    onConfirm?: () => void;
    message?: string;
    onRequestClose?: () => void;
  }>({
    modalType: 'none',
    isOpen: false,
  });

  let googleMapsLoader: Loader | null = null;
  let googleMaps: google.maps.Map | null = null;

  useEffect(() => {
    Modal.setAppElement('#table');
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchTickets = async () => {
      const response = await fetch('/api/tickets', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setTickets(data);
    };

    const fetchUsers = async () => {
      const response = await fetch('/api/users/getAllUsers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setUsers(data.map((user: { username: string }) => user.username));
    };

    const fetchData = async () => {
      await Promise.all([fetchTickets(), fetchUsers()]);
    };

    fetchData();
  }, [router]);

  const handleClosePopup = () => {
    setModalProps({
      modalType: 'none',
      isOpen: false,
    });
  };

  const handlePhoneClick = async (phoneNumber: string) => {
    setModalProps({
      modalType: 'popup',
      isOpen: true,
      phoneNumber,
      message: 'Do you want to call or text this number?',
    });
  };

  const handleStopClick = (ticket: Ticket) => {
    setCurrentTicket(ticket);
    setModalProps({
      modalType: 'notes',
      isOpen: true,
      message: 'Why do you want to stop this ticket?',
      onSaveNotes: handleSaveNotes,
    });
  };

  const handleSaveNotes = async (notes: string) => {
    if (!currentTicket) return;

    const authToken = localStorage.getItem('token');
    if (!authToken) {
      toast.error('You must be logged in to stop a ticket');
      return;
    }

    setLoading(true);

    try {
      const updatedTicket = {
        ...currentTicket,
        inProgress: false,
        additionalNotes: notes,
      };

      const ticketUpdatePromise = fetch(`/api/tickets?id=${currentTicket._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(updatedTicket),
      });

      const timeEntryUpdatePromise = fetch('/api/time-entry', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          ticket: currentTicket.ticketNumber,
          user: currentTicket.assignedTo,
          endTime: new Date(),
        }),
      });

      const [ticketResponse, timeEntryResponse] = await Promise.all([ticketUpdatePromise, timeEntryUpdatePromise]);

      if (ticketResponse.ok && timeEntryResponse.ok) {
        setTickets((prev) =>
          prev.map((ticket) =>
            ticket._id === currentTicket._id ? updatedTicket : ticket
          )
        );
        toast.success('Ticket updated successfully');
      } else {
        toast.error('Failed to update ticket');
      }
    } catch (error) {
      toast.error('Failed to update ticket');
    } finally {
      setLoading(false);
      setModalProps({
        modalType: 'none',
        isOpen: false,
      });
      setCurrentTicket(null);
    }
  };

  const initializeGoogleMaps = async () => {
    if (!googleMapsLoader) {
      googleMapsLoader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        version: 'weekly',
      });
    }
    if (!googleMaps) {
      await googleMapsLoader.importLibrary('maps');
      googleMaps = new google.maps.Map(document.createElement('div'));
    }
  };

  const calculateETA = async (destination: string) => {
    await initializeGoogleMaps();
    if (!googleMaps) {
      throw new Error('Google Maps is not initialized');
    }
    const directionsService = new google.maps.DirectionsService();

    return new Promise<string>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const origin = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        const request = {
          origin,
          destination,
          travelMode: google.maps.TravelMode.DRIVING,
        };

        directionsService.route(request, (result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            const eta = result.routes[0] && result.routes[0].legs[0] && result.routes[0].legs[0].duration ? result.routes[0].legs[0].duration.text : '';
            resolve(eta);
          }
        });
      });
    });
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

  const handleSort = (field: string) => {
    const order = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(order);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  const handleAssignedToFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAssignedToFilter(e.target.value);
  };

  const handleRowDelete = async (ticketId: string) => {
    setModalProps({
      modalType: 'confirmation',
      isOpen: true,
      message: 'Are you sure you want to delete this ticket?',
      onConfirm: async () => {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/tickets?id=${ticketId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          setTickets((prev) => prev.filter((ticket) => ticket._id !== ticketId));
          toast.success('Ticket deleted successfully');
        } else {
          toast.error('Failed to delete ticket');
        }
        setModalProps({
          modalType: 'none',
          isOpen: false,
        });
      },
    });
  };

  const openPriorityModal = (): Promise<Priority | null> => {
    return new Promise((resolve) => {
      const handleCloseModal = () => {
        resolve(null);
        setModalProps({
          modalType: 'none',
          isOpen: false,
        });
      };

      setModalProps({
        modalType: 'priority',
        isOpen: true,
        onSelectPriority: (priority: Priority) => {
          resolve(priority);
          setModalProps({
            modalType: 'none',
            isOpen: false,
          });
        },
        message: 'Select a priority for this ticket',
        onRequestClose: handleCloseModal,
      });
    });
  };

  const handleAssignedUserChange = async (ticketId: string, selectedUser: string, currentStatus: string, currentPriority: string) => {
    const previousUser = assignedUsers[ticketId] || '';
    const token = localStorage.getItem('token');
    let status = '';
    let priority = '';
    if (currentStatus === 'New' && selectedUser !== 'Unassigned') {
      status = 'Open';
      const selectedPriority = await openPriorityModal();
      if (selectedPriority) {
        priority = selectedPriority;
      } else {
        return;
      }
    }

    setAssignedUsers((prev) => ({
      ...prev,
      [ticketId]: selectedUser,
    }));

    const body = {
      ticketId,
      assignedTo: selectedUser,
      priority: priority === '' ? currentPriority : priority,
      status: status === '' ? currentStatus : status
    };
    const response = await fetch(`/api/tickets?id=${ticketId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    if (response.ok) {
      const updatedTicket = await response.json();
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket._id === ticketId ? updatedTicket : ticket
        )
      );
      toast.success('Ticket updated successfully');
    } else {
      setAssignedUsers((prev) => ({
        ...prev,
        [ticketId]: previousUser,
      }));
      toast.error('Failed to update ticket');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Highest':
        return 'bg-red-400';
      case 'High':
        return 'bg-yellow-300';
      case 'Medium':
        return 'bg-yellow-500';
      case 'Low':
        return 'bg-green-300';
      case 'Lowest':
        return 'bg-green-500';
      default:
        return '';
    }
  };

  const handleStartClick = async (ticket: Ticket) => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You must be logged in to start a ticket');
      setLoading(false);
      return;
    }
    if (!ticket.assignedTo || ticket.assignedTo === 'Unassigned') {
      toast.error('No user assigned to ticket');
      setLoading(false);
      return;
    }

    const startTime = new Date().toISOString();

    // Update the ticket to set inProgress to true
    const updatedTicket = {
      ...ticket,
      inProgress: true,
    };

    const response = await fetch(`/api/tickets?id=${ticket._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updatedTicket),
    });

    if (!response.ok) {
      const errorData = await response.json();
      toast.error(errorData.message);
      setLoading(false);
      return;
    }

    // Update the local state with the updated ticket
    setTickets((prev) =>
      prev.map((t) => (t._id === ticket._id ? updatedTicket : t))
    );

    // Send the time entry request asynchronously
    fetch('/api/time-entry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        user: ticket.assignedTo,
        ticket: ticket.ticketNumber,
        startTime,
        endTime: null,
      }),
    }).then(response => {
      if (!response.ok) {
        response.json().then(errorData => {
          toast.error(errorData.message);
        });
      }
    }).catch(error => {
      toast.error('An error occurred while creating the time entry');
    });

    // Wait for the calculateETA function
    try {
      const eta = await calculateETA(ticket.serviceAddress);
      setLoading(false);
      window.location.href = `sms:${ticket.phoneNumber}?body=Hi,%20This%20is%20your%20technician%20from%20PG%20Mech,%20I%20am%20on%20my%20way.%20Please%20be%20ready.%20My%20ETA%20is%20${eta}`;
    } catch (error) {
      setLoading(false);
      toast.error('An error occurred while calculating the ETA');
    }
  };

  const filteredTickets = tickets
    .filter((ticket) =>
      ticket.name.toLowerCase().includes(filter.toLowerCase()) ||
      ticket.serviceAddress.toLowerCase().includes(filter.toLowerCase())
    )
    .filter((ticket) =>
      statusFilter ? ticket.status === statusFilter : true
    )
    .filter((ticket) =>
      assignedToFilter ? ticket.assignedTo === assignedToFilter : true
    )
    .sort((a, b) => {
      if (!sortField) return 0;
      const aValue = a[sortField as keyof Ticket];
      const bValue = b[sortField as keyof Ticket];


      if (sortField === 'priority') {
        const aPriority = priorityMap[a.priority as Priority] ?? 0;
        const bPriority = priorityMap[b.priority as Priority] ?? 0;
        if (aPriority < bPriority) return sortOrder === 'asc' ? -1 : 1;
        if (aPriority > bPriority) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      }

      if (aValue !== undefined && bValue !== undefined) {
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });

  const displayedTickets = isAdmin
    ? filteredTickets
    : filteredTickets.filter((ticket) => ticket.assignedTo === username);

  return (
    <div id="table" className="min-h-screen p-4 pb-10 flex flex-col items-center bg-gray-100 space-y-2">
      {/* Overview */}{isAdmin && (
        <div className="w-full bg-white p-2 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-gray-800">Overview</h1>
          <div className="mt-1">
            <p className="text-lg text-gray-800">Total New Tickets: <span className="font-bold text-gray-800">{tickets.filter(ticket => ticket.status === 'New').length}</span></p>
          </div>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {users.map((user) => {
              const userTickets = tickets.filter((ticket) => ticket.assignedTo === user);
              const totalTickets = userTickets.length;
              const openTickets = userTickets.filter((ticket) => ticket.status === 'Open').length;
              const closedTickets = userTickets.filter((ticket) => ticket.status === 'Closed').length;

              return (
                <div key={user} className={`p-1 rounded-lg shadow-md ${assignedToFilter === user ? 'bg-gray-300' : 'bg-gray-100'}`} onClick={() => { setStatusFilter(''); setAssignedToFilter(user); }}>
                  <h2 className={`text-base font-semibold text-gray-800 ${assignedToFilter === user ? 'text-xl' : ''}`}>{user}</h2>
                  <div className="mt-1">
                    <p className="text-sm text-gray-600">Total: <span className="font-bold text-gray-800">{totalTickets}</span></p>
                    <p className="text-sm text-gray-600">Open: <span className="font-bold text-gray-800">{openTickets}</span></p>
                    <p className="text-sm text-gray-600">Closed: <span className="font-bold text-gray-800">{closedTickets}</span></p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div className="w-full bg-white p-4 rounded-lg shadow-lg">
        {/* Filters */}<div className="filter-buttons flex flex-col md:flex-row flex-wrap justify-between items-center mb-2 space-y-2 md:space-y-0">
          <h1 className="text-3xl font-bold text-gray-800 text-center">{`${statusFilter} ${assignedToFilter === '' ? assignedToFilter : assignedToFilter + '\'s'} Tickets`}</h1>
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
            <input
              type="text"
              placeholder="Filter by name or address"
              value={filter}
              onChange={handleFilterChange}
              className="border p-1 rounded"
            />
            <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="border p-1 rounded"
            >
              <option value="">All Statuses</option>
              {TICKET_STATUSES.map((status: string) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            {isAdmin && (
              <>
                <select
                  value={assignedToFilter}
                  onChange={handleAssignedToFilterChange}
                  className="border p-1 rounded"
                >
                  <option value="">All Users</option>
                  {users.map((user) => (
                    <option key={user} value={user}>
                      {user}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleSort('priority')}
                  className="bg-blue-500 hover:bg-blue-700 text-white p-1 rounded shadow-lg transition duration-300"
                >
                  Sort by Priority
                </button>
                <button
                  onClick={() => handleSort('name')}
                  className="bg-blue-500 hover:bg-blue-700 text-white p-1 rounded shadow-lg transition duration-300"
                >
                  Sort by Name
                </button>
                <button
                  onClick={() => handleSort('serviceAddress')}
                  className="bg-blue-500 hover:bg-blue-700 text-white p-1 rounded shadow-lg transition duration-300"
                >
                  Sort by Address
                </button>
              </>
            )}
          </div>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="min border-collapse border border-gray-400 w-full">
            <thead>
              <tr>
                <th className="border border-gray-400 p-2 hidden md:table-cell">Ticket Number</th>
                <th className="border border-gray-400 p-2">Priority</th>
                <th className="border border-gray-400 p-2">Name</th>
                <th className="border border-gray-400 p-2">Service Address</th>
                {isAdmin && <th className="border border-gray-400 p-2 hidden md:table-cell">Email</th>}
                <th className="border border-gray-400 p-2 hidden md:table-cell">Phone Number</th>
                <th className="border border-gray-400 p-2 hidden md:table-cell">Work Order Description</th>
                <th className="border border-gray-400 p-2 hidden md:table-cell">Time Availability</th>
                <th className="border border-gray-400 p-2 hidden md:table-cell">Status</th>
                {isAdmin && <th className="border border-gray-400 p-2 hidden md:table-cell">Assigned To</th>}
                <th className="border border-gray-400 p-2 hidden md:table-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedTickets.map((ticket: Ticket, index) => (
                <React.Fragment key={ticket._id}>
                  <tr onClick={() => handleRowToggle(ticket._id!)}>
                    <td className="border border-gray-400 p-2 hidden md:table-cell">{ticket.ticketNumber}</td>
                    {/* Priority */}<td className="border border-gray-400 p-2">
                      <div className="flex items-center justify-center">
                        <span className={`flex w-6 h-6 rounded-full mr-2 outline-1 items-center justify-center font-bold ${ticket.priority === '' ? 'outline-dashed' : getPriorityColor(ticket.priority || '')}`}>
                          {priorityMap[ticket.priority || '']}
                        </span>
                      </div>
                    </td>
                    <td className="border border-gray-400 p-2">{ticket.name}</td>
                    {/* Service Address */}<td className="border border-gray-400 p-2">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ticket.serviceAddress)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600 text-blue-600 underline break-words whitespace-normal"
                      >
                        {ticket.serviceAddress}
                      </a>
                    </td>
                    {isAdmin && <td className="border border-gray-400 p-2 hidden md:table-cell">{ticket.email}</td>}
                    {/* Phone Number */}<td className="border border-gray-400 p-2 hidden md:table-cell">
                      <button
                        onClick={() => handlePhoneClick(ticket.phoneNumber)}
                        className="block border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600 text-blue-600 underline bg-gray-100 whitespace-nowrap"
                      >
                        {ticket.phoneNumber.replace(/\s+/g, '') || ''}
                      </button>
                    </td>
                    <td className="border border-gray-400 p-2 hidden md:table-cell">{ticket.workOrderDescription}</td>
                    <td className="border border-gray-400 p-2 hidden md:table-cell">{ticket.timeAvailability}</td>
                    <td className="border border-gray-400 p-2 hidden md:table-cell">{ticket.status}</td>
                    {/* Assigned To */}{isAdmin && (<td className="border border-gray-400 p-2 hidden md:table-cell">
                      <select
                        value={assignedUsers[ticket._id!] || ticket.assignedTo || "Unassigned"}
                        onChange={(e) => handleAssignedUserChange(ticket._id!, e.target.value, ticket.status, ticket?.priority || '')}
                        className="border p-1 rounded"
                      >
                        <option value="Unassigned">Unassigned</option>
                        {users.map((user) => (
                          <option key={user} value={user}>
                            {user}
                          </option>
                        ))}
                      </select>
                    </td>
                    )}
                    {/* Actions */}<td className="border justify-center border-gray-400 p-2 hidden md:table-cell">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <TicketActions
                          ticket={ticket}
                          isAdmin={isAdmin}
                          handleStartClick={handleStartClick}
                          handleStopClick={handleStopClick}
                          handlePhoneClick={handlePhoneClick}
                          handleRowDelete={handleRowDelete}
                        />
                      </div>
                    </td>
                  </tr>
                  {/* Hidden rows */}{expandedRows.has(ticket._id!) && (
                    <tr className="md:hidden">
                      <td colSpan={3} className="border border-gray-400 space-y-1">
                        <div><strong>Email:</strong> {ticket.email}</div>
                        <div><strong>Phone Number:</strong> {ticket.phoneNumber}</div>
                        <div><strong>Work Order Description:</strong> {ticket.workOrderDescription}</div>
                        <div><strong>Time Availability:</strong> {ticket.timeAvailability}</div>
                        <div><strong>Status:</strong> {ticket.status}</div>
                        {/* Assigned To */} {isAdmin && (
                          <div>
                            <strong>Assigned To:</strong>
                            <select
                              value={assignedUsers[ticket._id!] || ticket.assignedTo || 'Unassigned'}
                              onChange={(e) => handleAssignedUserChange(ticket._id!, e.target.value, ticket.status, ticket?.priority || '')}
                              className="border p-1 rounded"
                            >
                              <option value="Unassigned">Unassigned</option>
                              {users.map((user) => (
                                <option key={user} value={user}>
                                  {user}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        {/* Actions */}<div className="flex items-center justify-center space-x-4 p-2">
                          <TicketActions
                            ticket={ticket}
                            isAdmin={isAdmin}
                            handleStartClick={handleStartClick}
                            handleStopClick={handleStopClick}
                            handlePhoneClick={handlePhoneClick}
                            handleRowDelete={handleRowDelete}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          {loading && (
            <div className="loader-container">
              <div className="loader"></div>
            </div>
          )}
        </div>
        <UnifiedModal
          isOpen={modalProps.isOpen}
          modalType={modalProps.modalType}
          onRequestClose={() => setModalProps({ modalType: 'none', isOpen: false })}
          onSelectPriority={modalProps.onSelectPriority}
          onSaveNotes={modalProps.onSaveNotes}
          phoneNumber={modalProps.phoneNumber}
          onConfirm={modalProps.onConfirm}
          message={modalProps.message}
        />
      </div>
    </div>
  );
}