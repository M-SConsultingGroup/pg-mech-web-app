'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { CreateEstimate } from '@/components/EstimateCreate';
import { EstimateHistory } from '@/components/EstimateHistory';
import { TicketTabs } from '@/components/TicketTabs';
import { Ticket } from '@/common/interfaces';
import { apiFetch } from '@/lib/api';

const EstimatePage = () => {
	const router = useRouter();
	const params = useParams();
	const ticketId = params.ticketId;
	const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
	const [ticketData, setTicketData] = useState<Ticket | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (ticketId) {
			const fetchData = async () => {
				setLoading(true);
				const authToken = localStorage.getItem('token');
				if (!authToken) {
					setLoading(false);
					return;
				}

				try {
					const ticketRes = await apiFetch(`/api/tickets/${ticketId}`, 'GET', undefined, authToken);
					if (ticketRes.ok) {
						const ticketData = await ticketRes.json();
						setTicketData(ticketData);
					}
				} catch (error) {
					console.error('Failed to fetch ticket details');
				} finally {
					setLoading(false);
				}
			};
			fetchData();
		}
	}, [ticketId]);

	return (
		<div className="min-h-screen p-4 bg-white">
			<TicketTabs ticketId={ticketId as string} ticketNumber={ticketData?.ticketNumber as string} activeTab="estimate" />
			<div className="flex gap-2 border-b border-gray-300">
				{['create', 'history'].map((tab) => (
					<button
						key={tab}
						onClick={() => setActiveTab(tab as 'create' | 'history')}
						className={`relative px-4 py-2 text-sm font-medium transition-colors duration-300 ${activeTab === tab ? 'text-blue-600' : 'text-gray-600 hover:text-blue-500'}`}
					>
						{tab === 'create' ? 'Create Estimate' : 'Estimate History'}
						{activeTab === tab && (
							<span className="absolute left-0 bottom-0 w-full h-[2px] bg-blue-600 rounded-full transition-all duration-300"></span>
						)}
					</button>
				))}
			</div>

			{/* Tab Content */}
			<div>
				{loading && <div className="text-center text-gray-500">Loading...</div>}
				{!loading && !ticketData && <div className="text-center text-red-500">Ticket not found</div>}
				{ticketData && (
					<>
						{ activeTab === 'create' && <CreateEstimate ticketData={ticketData} /> }
						{ activeTab === 'history' && <EstimateHistory ticketData={ticketData} /> }
					</>
				)}
			</div>
		</div>
	)
};

export default EstimatePage;