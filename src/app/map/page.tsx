'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { renderToStaticMarkup } from 'react-dom/server';
import { FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { apiFetch } from '@/lib/api';
import { Ticket } from '@/common/interfaces';

interface GeocodedTicket extends Ticket {
	coordinates: [number, number];
}

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
	const [geocodedTickets, setGeocodedTickets] = useState<GeocodedTicket[]>([]);
	const [isGeocoding, setIsGeocoding] = useState(false);
	const [assignedUsers, setAssignedUsers] = useState<{ [key: string]: string }>({});
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

	const handleAssignedUserChange = async (ticket: Ticket, selectedUser: string) => {
		const previousUser = assignedUsers[ticket.id!];
		let status = ticket.status;
		let selectedPriority = ticket.priority;

		if (ticket.status === 'New' && selectedUser !== 'Unassigned' && previousUser != '') {
			status = 'Open';
			selectedPriority = 'Highest';
			if (!selectedPriority) return;
		}

		setAssignedUsers((prev) => ({ ...prev, [ticket.id!]: selectedUser }));

		updateTicketMutation.mutate({
			ticketId: ticket.id!,
			assignedTo: selectedUser,
			priority: selectedPriority!,
			status,
		});
	};

	useEffect(() => {
		const geocodeTickets = async () => {
			if (tickets.length === 0) return;

			setIsGeocoding(true);
			try {
				const results = await Promise.all(
					tickets
						.filter(ticket => ticket.serviceAddress)
						.map(async (ticket) => {
							const coordinates = await getCoordinatesForAddress(ticket.serviceAddress);
							return {
								...ticket,
								coordinates
							};
						})
				);
				setGeocodedTickets(results.filter(ticket => ticket.coordinates !== null));
			} catch (error) {
				console.error('Geocoding error:', error);
				toast.error('Error geocoding addresses');
			} finally {
				setIsGeocoding(false);
			}
		};

		geocodeTickets();
	}, [tickets]);

	// Function to geocode addresses using OpenStreetMap Nominatim
	const getCoordinatesForAddress = async (address: string): Promise<[number, number]> => {
		try {
			const response = await fetch(
				`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
			);

			if (!response.ok) {
				throw new Error('Geocoding failed');
			}

			const data = await response.json();

			if (data.length === 0) {
				console.warn('No coordinates found for address:', address);
				return [0, 0];
			}

			// Return the first result's coordinates
			return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
		} catch (error) {
			console.error('Error geocoding address:', address, error);
			return [0, 0];
		}
	};

	if (isTicketsLoading || isGeocoding) {
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
				<button
					onClick={() => router.push('/tickets')}
					className="mr-2 p-1 rounded hover:bg-gray-200 transition-colors"
				>
					<FiArrowLeft className="w-6 h-6 text-gray-800" />
				</button>
				<h1 className="text-2xl font-bold text-gray-800">Service Tickets Map</h1>
			</div>

			<div className="w-full mx-auto bg-white p-6 rounded-lg shadow-lg">
				{geocodedTickets.length === 0 ? (
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
							{geocodedTickets.map((ticket) => (
								<Marker key={ticket.id} position={ticket.coordinates} icon={markerIcon('red')}>
									<Popup>
										<div className="space-y-2 min-w-[250px]">
											<h3 className="font-bold text-lg">{ticket.name}</h3>
											<p><span className="font-semibold">Ticket #:</span> {ticket.ticketNumber}</p>
											<p><span className="font-semibold">Address:</span> {ticket.serviceAddress}</p>
											<p><span className="font-semibold">Description:</span> {ticket.workOrderDescription}</p>
											<p>
												<span className="font-semibold">Status:</span>{' '}
												<span className={'px-2 py-1 rounded-full text-xs bg-green-100 text-green-800'}>
													{ticket.status}
												</span>
											</p>
											<div className="flex items-center">
												<span className="font-semibold mr-2">Assigned To:</span>
												<select
													value={assignedUsers[ticket.id!] || ticket.assignedTo || "Unassigned"}
													onChange={(e) => handleAssignedUserChange(ticket, e.target.value)}
													className="border p-1 rounded text-sm"
												>
													<option value="Unassigned">Unassigned</option>
													{users.map((user) => (
														<option key={user} value={user}>
															{user}
														</option>
													))}
												</select>
											</div>
											<p><span className="font-semibold">Priority:</span> {ticket.priority || 'Not set'}</p>
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

			{/* {isMounted && (
				<UnifiedModal
					isOpen={modalProps.isOpen}
					modalType={modalProps.modalType}
					onRequestClose={() => setModalProps({ modalType: 'none', isOpen: false })}
					onSelectPriority={modalProps.onSelectPriority}
					phoneNumber={modalProps.phoneNumber}
					onConfirm={modalProps.onConfirm}
					message={modalProps.message}
				/>
			)} */}
		</div>
	);
};

export default TicketMap;