'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { renderToStaticMarkup } from 'react-dom/server';
import { FiArrowLeft, FiStar, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { apiFetch } from '@/lib/api';
import { Priority, priorityMap, Ticket } from '@/common/interfaces';

const markerIcon = (color: string) => {
	const iconSvg = renderToStaticMarkup(
		<div style={{ color, fontSize: '24px', transform: 'translateY(-12px)' }}>
			<FaMapMarkerAlt />
		</div>
	);

	return new L.DivIcon({
		html: iconSvg,
		className: 'custom-icon',
		iconSize: [24, 24],
		iconAnchor: [12, 24],
	});
};

const TicketMap = () => {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [assignedUsers, setAssignedUsers] = useState<{ [key: string]: string }>({});
	const [editedTicket, setEditedTicket] = useState<Partial<Ticket>>({});

	const { data: users = [] } = useQuery<string[]>({
		queryKey: ['users'],
		queryFn: async () => {
			const token = localStorage.getItem('token');
			if (!token) return [];
			const response = await apiFetch('/api/users/all', 'GET', undefined, token);
			return await response.json();
		},
	});

	const { data: tickets = [], isLoading: isTicketsLoading } = useQuery<Ticket[]>({
		queryKey: ['tickets'],
		queryFn: async () => {
			const token = localStorage.getItem('token');
			if (!token) {
				router.push('/login');
				return [];
			}

			try {
				const response = await apiFetch(
					'/api/tickets/all?status=New',
					'GET',
					undefined,
					token
				);
				if (!response.ok) {
					throw new Error('Failed to fetch tickets');
				}
				return await response.json();
			} catch (error) {
				toast.error('Failed to fetch tickets');
				throw error;
			}
		},
	});

	const updateTicketMutation = useMutation({
		mutationFn: async (body: {
			ticketId: string;
			assignedTo: string;
			priority: string;
			status: string;
		}) => {
			const token = localStorage.getItem('token');
			if (!token) throw new Error("Unauthorized");
			return apiFetch(`/api/tickets/${body.ticketId}`, 'POST', body, token);
		},
		onSuccess: () => {
			toast.success("Ticket updated successfully");
			queryClient.invalidateQueries({ queryKey: ['tickets'] });
		},
		onError: () => {
			toast.error("Failed to update ticket");
		},
	});

	const handleAssignedUserChange = async (ticket: Ticket) => {
		const updatedTicket = {
			...ticket,
			assignedTo: assignedUsers[ticket.id!] || ticket.assignedTo,
			priority: editedTicket.priority || ticket.priority,
			status: ticket.status === 'New' && (assignedUsers[ticket.id!] || ticket.assignedTo) !== 'Unassigned'
				? 'Open'
				: ticket.status
		};

		try {
			const token = localStorage.getItem('token');
			if (!token) {
				router.push('/login');
				return;
			}

			const response = await apiFetch(
				`/api/tickets/${ticket.id}`,
				'POST',
				updatedTicket,
				token
			);

			if (response.ok) {
				toast.success('Ticket updated successfully');
				queryClient.invalidateQueries({ queryKey: ['tickets'] });
			} else {
				toast.error('Failed to update ticket');
			}
		} catch (error) {
			toast.error('Error updating ticket');
			console.error('Update error:', error);
		}
	};

	if (isTicketsLoading) {
		return (
			<div className="min-h-screen p-4 pb-10 bg-gray-100 relative">
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
				</div>
			</div>
		);
	}

	return (
		<div id='map' className="min-h-screen p-4 pb-10 bg-gray-100 relative">
			<div className="flex items-center mb-4">
				<button onClick={() => router.push('/tickets')} className="mr-2 p-1 rounded hover:bg-gray-200 transition-colors">
					<FiArrowLeft className="w-6 h-6 text-gray-800" />
				</button>
				<h1 className="text-2xl font-bold text-gray-800">Service Tickets Map</h1>
			</div>
			<div className="w-full mx-auto bg-white p-6 rounded-lg shadow-lg">
				{tickets.length === 0 ? (
					<div className="w-full h-[500px] flex items-center justify-center bg-gray-100 rounded-lg">
						<p className="text-gray-600">No tickets with valid addresses to display on map.</p>
					</div>
				) : (
					<div className="h-[600px] rounded-lg overflow-hidden">
						<MapContainer
							center={[32.779167, -96.808891]} // Default center coordinates (Dallas, TX)
							zoom={10}
							style={{ height: '100%', width: '100%' }}
						>
							<TileLayer
								url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
								attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
							/>
							{tickets.map((ticket) => (
								<Marker key={ticket.id} position={[ticket?.coordinates?.latitude, ticket?.coordinates?.longitude]} icon={markerIcon('red')}>
									<Popup>
										<div className="space-y-2 min-w-[250px]">
											<h3 className="font-bold text-lg">{ticket.name}</h3>
											<p><span className="font-semibold">Ticket #:</span> {ticket.ticketNumber}</p>
											<p><span className="font-semibold">Address:</span> {ticket.serviceAddress}</p>
											<p><span className="font-semibold">Description:</span> {ticket.workOrderDescription}</p>
											<p>
												<span className="font-semibold">Status:</span>{' '}
												<span className={`px-2 py-1 rounded-full text-xs ${ticket.status === 'completed' ? 'bg-green-100 text-green-800' :
													ticket.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
														'bg-yellow-100 text-yellow-800'
													}`}>
													{ticket.status}
												</span>
											</p>

											<div className="space-y-2">
												<div className="flex items-center">
													<FiUser className="mr-2 text-gray-600" />
													<select
														value={assignedUsers[ticket.id!] || ticket.assignedTo || "Unassigned"}
														onChange={(e) => setAssignedUsers(prev => ({ ...prev, [ticket.id!]: e.target.value }))}
														className="border p-1 rounded text-sm flex-1"
													>
														<option value="Unassigned">Unassigned</option>
														{users.map((user) => (
															<option key={user} value={user}>
																{user}
															</option>
														))}
													</select>
												</div>

												<div className="flex items-center">
													<FiStar className="mr-2 text-gray-600" />
													<select
														value={ticket.priority || ""}
														onChange={(e) => setEditedTicket(prev => ({ ...prev, priority: e.target.value as Priority }))}
														className="border p-1 rounded text-sm flex-1"
													>
														<option value="">Select Priority</option>
														{Object.keys(priorityMap).map((priority) => (
															<option key={priority} value={priority}>
																{priority}
															</option>
														))}
													</select>
												</div>

												<button
													onClick={() => handleAssignedUserChange(ticket)}
													className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded text-sm flex items-center justify-center"
												>
													Update Ticket
												</button>
											</div>
											<p><span className="font-semibold">Availability:</span> {ticket.timeAvailability}</p>
											<p><span className="font-semibold">Contact:</span> {ticket.phoneNumber} | {ticket.email}</p>
										</div>
									</Popup>
								</Marker>
							))}
						</MapContainer>
					</div>
				)}
			</div>
		</div>
	);
};

export default TicketMap;