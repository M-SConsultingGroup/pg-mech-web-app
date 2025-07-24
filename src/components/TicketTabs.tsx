'use client';

import { useRouter } from 'next/navigation';
import { FaTicketAlt } from 'react-icons/fa';
import { FaFileInvoice, FaFileInvoiceDollar, FaArrowLeftLong } from 'react-icons/fa6';

interface TicketTabsProps {
	ticketId: string;
	ticketNumber: string;
	activeTab: 'details' | 'estimate' | 'invoice';
}

export const TicketTabs = ({ ticketId, ticketNumber, activeTab }: TicketTabsProps) => {
	const router = useRouter();

	const tabs = [
		{
			id: 'details',
			label: 'Details',
			icon: FaTicketAlt,
			path: `/tickets/${ticketId}`,
		},
		{
			id: 'estimate',
			label: 'Estimate',
			icon: FaFileInvoiceDollar,
			path: `/estimate/${ticketId}`,
		},
		{
			id: 'invoice',
			label: 'Invoice',
			icon: FaFileInvoice,
			path: `/invoice/${ticketId}`,
		},
	];

	return (
		<div className="mb-2 print:hidden">
			<div className="flex items-center justify-between border-b border-gray-200">
				{/* Left-aligned back button and ticket number */}
				<div className="flex items-center">
					<button
						onClick={() => router.back()}
						className="mr-2 p-1 rounded hover:bg-gray-100"
					>
						<FaArrowLeftLong />
					</button>
					<span className="text-lg font-semibold text-gray-700">
						Ticket #{ticketNumber}
					</span>
				</div>

				{/* Centered tabs */}
				<div className="flex -mb-px">
					{tabs.map((tab) => {
						const Icon = tab.icon;
						const isActive = activeTab === tab.id;
						return (
							<button
								key={tab.id}
								onClick={() => router.push(tab.path)}
								disabled={isActive}
								className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors ${isActive
										? 'border-blue-500 text-blue-600 cursor-default'
										: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-600'
									}`}
							>
								<Icon className="text-sm" />
								<span>{tab.label}</span>
							</button>
						);
					})}
				</div>
				<div className="w-64"></div>
			</div>
		</div>
	);
};