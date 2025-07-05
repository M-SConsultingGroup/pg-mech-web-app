'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { FaArrowLeftLong } from 'react-icons/fa6';
import { CreateEstimate } from '@/components/EstimateCreate';
import { EstimateHistory } from '@/components/EstimateHistory';

const EstimatePage = () => {
	const router = useRouter();
	const params = useParams();
	const ticketId = params.ticketId;
	const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');

	return (
		<div className="min-h-screen p-4 bg-white">
			{/* Back Button Header */}
			<div className="flex items-center mb-6 print:hidden">
				<button
					onClick={() => router.back()}
					className="mr-4 p-2 rounded-full hover:bg-gray-100 transition"
				>
					<FaArrowLeftLong size={18} />
				</button>
				<h1 className="text-2xl font-bold">Estimate</h1>
			</div>

			{/* Tab Navigation */}
			<div className="flex gap-2 mb-6 border-b border-gray-300">
				{['create', 'history'].map((tab) => (
					<button
						key={tab}
						onClick={() => setActiveTab(tab as 'create' | 'history')}
						className={`relative px-4 py-2 text-sm font-medium transition-colors duration-300
            ${activeTab === tab
								? 'text-blue-600'
								: 'text-gray-600 hover:text-blue-500'
							}`}
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
				{activeTab === 'create' && <CreateEstimate ticketId={ticketId as string} />}
				{activeTab === 'history' && <EstimateHistory ticketId={ticketId as string} />}
			</div>
		</div>
	)
};

export default EstimatePage;