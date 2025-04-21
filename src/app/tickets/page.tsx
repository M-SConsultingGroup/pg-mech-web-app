"use client";
import { useAuth } from '@/context/AuthContext';
import { Ticket, Priority, priorityMap, ModalType, UserStats } from '@/common/interfaces';
import { TICKET_STATUSES } from '@/common/constants';
import UnifiedModal from '@/components/UnifiedModal';
import TicketActions from '@/components/TicketActions';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Modal from 'react-modal';
import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export default function Tickets() {
  const router = useRouter();
  const { username, isAdmin, isPermissionsLoading } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [stats, setStats] = useState<{ [key: string]: number }>({ total: 0 });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<string | null>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filter, setFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [assignedToFilter, setAssignedToFilter] = useState<string | undefined>(undefined);
  const [assignedUsers, setAssignedUsers] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [modalProps, setModalProps] = useState<{
    modalType: ModalType;
    isOpen: boolean;
    onSelectPriority?: (priority: Priority) => void;
    phoneNumber?: string;
    onConfirm?: () => void;
    message?: string;
    onRequestClose?: () => void;
  }>({
    modalType: 'none',
    isOpen: false,
  });

  useEffect(() => {
    if (!isPermissionsLoading) {
      setStatusFilter(isAdmin ? 'New' : 'Open');
      setAssignedToFilter(isAdmin ? '' : username);
      setSortField(isAdmin ? 'createdAt' : 'priority');
      setSortOrder(isAdmin ? 'desc' : 'asc');
    }
  }, [isPermissionsLoading, isAdmin, username]);

  useEffect(() => {
    Modal.setAppElement('#table');
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [usersResponse, statsResponse] = await Promise.all([
          apiFetch('/api/users/all', 'GET', undefined, token),
          apiFetch('/api/tickets/stats', 'GET', undefined, token)
        ]);

        setUsers(await usersResponse.json());
        setStats(await statsResponse.json());
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [router]);

  useEffect(() => {
    if (statusFilter === undefined || assignedToFilter === undefined) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const fetchTickets = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (statusFilter) queryParams.append('status', statusFilter);
        if (assignedToFilter) queryParams.append('user', assignedToFilter);

        const response = await apiFetch(
          `/api/tickets/all?${queryParams.toString()}`,
          'GET',
          undefined,
          token
        );
        setTickets(await response.json());
      } catch (error) {
        console.error('Error fetching tickets:', error);
        toast.error('Failed to load tickets');
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchTickets, 300);
    return () => clearTimeout(debounceTimer);
  }, [statusFilter, assignedToFilter, assignedUsers]);

  const handlePhoneClick = async (phoneNumber: string) => {
    setModalProps({
      modalType: 'popup',
      isOpen: true,
      phoneNumber,
      message: 'Do you want to call or text this number?',
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

  const handleRowDelete = async (ticket: Ticket) => {
    const message = ticket.inProgress ? `This ticket is in-progress by ${ticket.assignedTo}, are you sure? `
      : 'Are you sure you want to delete this ticket?';
    console.log(message);
    setModalProps({
      modalType: 'confirmation',
      isOpen: true,
      message: message,
      onConfirm: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('You are not authorized to view this page');
          return;
        }
        const response = await apiFetch(`/api/tickets/${ticket.id}`, 'DELETE', undefined, token);

        if (response.ok) {
          setTickets((prev) => prev.filter((a) => a.id !== ticket.id));
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

  const openPriorityModal = (): Promise<Priority> => {
    return new Promise((resolve) => {
      const handleCloseModal = () => {
        resolve('Medium');
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

  const handleAssignedUserChange = async (ticket: Ticket, selectedUser: string) => {
    const previousUser = assignedUsers[ticket.id];
    const token = localStorage.getItem('token');
    let status = '';
    let selectedPriority = '';

    if (ticket.status === 'New' && selectedUser !== 'Unassigned') {
      status = 'Open';
      selectedPriority = await openPriorityModal();
      console.log(selectedPriority);
      if (selectedPriority === '') {
        return;
      }
    }

    setAssignedUsers((prev) => ({
      ...prev,
      [ticket.id]: selectedUser,
    }));

    const body = {
      ticketId: ticket.id,
      assignedTo: selectedUser,
      priority: selectedPriority === '' ? ticket.priority : selectedPriority,
      status: status === '' ? ticket.status : status
    };

    if (!token) {
      toast.error('You are not authorized to view this page');
      return;
    }

    const response = await apiFetch(`/api/tickets/${ticket.id}`, 'POST', body, token);
    if (response.ok) {
      const updatedTicket = await response.json();
      setTickets((prev) =>
        prev.map((currentTicket) =>
          currentTicket.id === ticket.id ? updatedTicket : currentTicket
        )
      );
      toast.success('Ticket updated successfully');
    } else {
      setAssignedUsers((prev) => ({
        ...prev,
        [ticket.id]: previousUser,
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

  const filteredTickets = tickets
    .filter((ticket) =>
      ticket.name.toLowerCase().includes(filter.toLowerCase()) ||
      ticket.serviceAddress.toLowerCase().includes(filter.toLowerCase())
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
        <div className="w-full bg-white p-4 rounded-lg shadow-lg mb-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Dashboard Overview</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Total Tickets Card */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="text-lg font-semibold text-blue-800">Total Tickets</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
            </div>

            {/* New Tickets Card */}
            <div
              className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 cursor-pointer"
              onClick={() => {
                setStatusFilter('New');
                setAssignedToFilter('');
              }}
            >
              <h3 className="text-lg font-semibold text-yellow-800">New Tickets</h3>
              <p className="text-3xl font-bold text-yellow-600">{stats.new || 0}</p>
            </div>

            {/* Open Tickets Card */}
            <div
              className="bg-orange-50 p-4 rounded-lg border border-orange-100 cursor-pointer"
              onClick={() => {
                setStatusFilter('Open');
                setAssignedToFilter('');
              }}
            >
              <h3 className="text-lg font-semibold text-orange-800">Open Tickets</h3>
              <p className="text-3xl font-bold text-orange-600">{stats.open || 0}</p>
            </div>

            {/* Team Stats - now spans all columns on larger screens */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-100 col-span-1 sm:col-span-2 lg:col-span-3">
              <h3 className="text-lg font-semibold text-green-800 mb-2">Team Stats</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {Object.entries(stats).map(([key, value]) => {
                  // Skip non-user stats (total, new, open)
                  if (['total', 'new', 'open'].includes(key) || typeof value !== 'object') return null;

                  const userStats = value as UserStats;
                  const openTickets = userStats.open || 0;
                  const newTickets = userStats.new || 0;

                  return (
                    <div
                      key={key}
                      className={`p-2 rounded cursor-pointer transition-colors ${assignedToFilter === key
                        ? 'bg-green-200 border-green-300'
                        : 'bg-white hover:bg-green-100 border-green-100'
                        }`}
                      onClick={() => {
                        setStatusFilter('');
                        setAssignedToFilter(assignedToFilter === key ? '' : key);
                      }}
                    >
                      <p className="font-medium text-sm truncate">{key}</p>
                      <p className="text-xs text-gray-600">
                        <span className="font-semibold">{userStats.total}</span> tickets
                      </p>
                      {newTickets > 0 && (
                        <p className="text-xs text-yellow-600">
                          <span className="font-semibold">{newTickets}</span> new
                        </p>
                      )}
                      {openTickets > 0 && (
                        <p className="text-xs text-orange-600">
                          <span className="font-semibold">{openTickets}</span> open
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
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
              {displayedTickets.map((ticket: Ticket) => (
                <React.Fragment key={ticket.id}>
                  <tr onClick={() => handleRowToggle(ticket.id!)}>
                    <td className="border border-gray-400 p-2 hidden md:table-cell">{ticket.ticketNumber}</td>
                    {/* Priority */}<td className="border border-gray-400 p-2">
                      <div className="flex items-center justify-center">
                        <span className={`flex w-6 h-6 rounded-full mr-2 outline-1 justify-center font-bold ${ticket.priority === '' ? 'outline-dashed' : getPriorityColor(ticket.priority || '')}`}>
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
                        value={assignedUsers[ticket.id!] || ticket.assignedTo || "Unassigned"}
                        onChange={(e) => handleAssignedUserChange(ticket, e.target.value)}
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
                          handleRowDelete={handleRowDelete}
                        />
                      </div>
                    </td>
                  </tr>
                  {/* Hidden rows */}{expandedRows.has(ticket.id!) && (
                    <tr className="md:hidden">
                      <td colSpan={3} className="border border-gray-400 space-y-1 p-2">
                        <div><strong>Ticket Number:</strong> {ticket.ticketNumber}</div>
                        <div><strong>Email:</strong> {ticket.email}</div>
                        <div><strong>Phone Number:</strong> {ticket.phoneNumber}</div>
                        <div><strong>Work Order Description:</strong> {ticket.workOrderDescription}</div>
                        <div><strong>Time Availability:</strong> {ticket.timeAvailability}</div>
                        <div><strong>Status:</strong> {ticket.status}</div>
                        <div><strong>Notes:</strong> {ticket.additionalNotes}</div>
                        {/* Assigned To */} {isAdmin && (
                          <div>
                            <strong>Assigned To:</strong>
                            <select
                              value={assignedUsers[ticket.id!] || ticket.assignedTo || 'Unassigned'}
                              onChange={(e) => handleAssignedUserChange(ticket, e.target.value)}
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
          phoneNumber={modalProps.phoneNumber}
          onConfirm={modalProps.onConfirm}
          message={modalProps.message}
        />
      </div>
    </div>
  );
}