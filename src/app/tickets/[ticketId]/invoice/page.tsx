'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Ticket } from '@/common/interfaces';
import { apiFetch } from '@/lib/api';

const InvoicePage = () => {
	const router = useRouter();
	const params = useParams();
	const ticketId = params.ticketId;
	const [ticket, setTicket] = useState<Ticket | null>(null);
	const [loading, setLoading] = useState(false);
	const [partPrices, setPartPrices] = useState<Record<string, number>>({});
	const [laborCost, setLaborCost] = useState(0);
	const [taxRate, setTaxRate] = useState(0.0825); // 8.25% tax

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
					const ticketResponse = await apiFetch(`/api/tickets/${ticketId}`, 'GET', undefined, authToken);
					if (ticketResponse.ok) {
						const ticketData = await ticketResponse.json();
						setTicket(ticketData);
						// Initialize part prices with 0
						const initialPrices: Record<string, number> = {};
						ticketData.partsUsed?.forEach((part: string) => {
							initialPrices[part] = 0;
						});
						setPartPrices(initialPrices);
					}
				} catch (error) {
					console.error('Failed to fetch ticket details:', error);
				} finally {
					setLoading(false);
				}
			};
			fetchData();
		}
	}, [ticketId]);

	const handlePartPriceChange = (part: string, value: number) => {
		setPartPrices(prev => ({
			...prev,
			[part]: value
		}));
	};

	const calculateSubtotal = () => {
		const partsTotal = Object.values(partPrices).reduce((sum, price) => sum + price, 0);
		return partsTotal + laborCost;
	};

	const calculateTax = () => {
		return calculateSubtotal() * taxRate;
	};

	const calculateTotal = () => {
		return calculateSubtotal() + calculateTax();
	};

	const handlePrint = () => {
		window.print();
	};

	if (loading) return <div className="text-center py-8">Loading...</div>;
	if (!ticket) return <div className="text-center py-8">Ticket not found</div>;

	return (
		<div className="min-h-screen p-4 bg-white print:p-0">
			<div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg print:shadow-none">
				{/* Header with back button (hidden when printing) */}
				<div className="flex items-center mb-6 print:hidden">
					<button
						onClick={() => router.push(`/tickets`)}
						className="mr-4 p-2 rounded-full hover:bg-gray-100"
					>
						← Back
					</button>
					<h1 className="text-2xl font-bold">Invoice</h1>
				</div>

				{/* Invoice Header */}
				<div className="flex justify-between mb-8 border-b pb-4">
					<div>
						<h2 className="text-xl font-semibold">PG Mechanical LLC</h2>
						<p>1111 Saddlebrook Dr.</p>
						<p>Murphy, TX 75087</p>
						<p>Phone: (469) 274-6462</p>
					</div>
					<div className="text-right">
						<h2 className="text-xl font-semibold">INVOICE</h2>
						<p>Date: {new Date().toLocaleDateString()}</p>
						<p>Invoice #: {ticket.ticketNumber}</p>
					</div>
				</div>

				{/* Customer Information */}
				<div className="mb-8 border-b pb-4">
					<h3 className="text-lg font-semibold mb-2">Bill To:</h3>
					<p>{ticket.name}</p>
					<p>{ticket.serviceAddress}</p>
					<p>{ticket.email}</p>
					<p>{ticket.phoneNumber}</p>
				</div>

				{/* Service Details */}
				<div className="mb-6">
					<h3 className="text-lg font-semibold mb-2">Service Details</h3>
					<p className="mb-2"><span className="font-medium">Work Description:</span> {ticket.workOrderDescription}</p>
					<p className="mb-2"><span className="font-medium">Services Delivered:</span> {ticket.servicesDelivered}</p>
					<p><span className="font-medium">Additional Notes:</span> {ticket.additionalNotes}</p>
				</div>

				{/* Parts and Labor */}
				<div className="mb-8">
					<h3 className="text-lg font-semibold mb-4">Parts & Labor</h3>
					<table className="w-full border-collapse">
						<thead>
							<tr className="bg-gray-100">
								<th className="p-2 text-left border">Item</th>
								<th className="p-2 text-right border">Price</th>
							</tr>
						</thead>
						<tbody>
							{ticket.partsUsed?.map((part, index) => (
								<tr key={index} className="border-b">
									<td className="p-2 border">{part}</td>
									<td className="p-2 border text-right">
										<input
											type="number"
											min="0"
											step="0.01"
											value={partPrices[part] || 0}
											onChange={(e) => handlePartPriceChange(part, parseFloat(e.target.value))}
											className="w-24 text-right border rounded p-1 print:border-none print:bg-transparent"
										/>
									</td>
								</tr>
							))}
							<tr className="border-b">
								<td className="p-2 border font-medium">Labor</td>
								<td className="p-2 border text-right">
									<input
										type="number"
										min="0"
										step="0.01"
										value={laborCost}
										onChange={(e) => setLaborCost(parseFloat(e.target.value))}
										className="w-24 text-right border rounded p-1 print:border-none print:bg-transparent"
									/>
								</td>
							</tr>
						</tbody>
					</table>
				</div>

				{/* Totals */}
				<div className="ml-auto w-64 border-t-2 pt-4">
					<div className="flex justify-between mb-2">
						<span className="font-medium">Subtotal:</span>
						<span>${calculateSubtotal().toFixed(2)}</span>
					</div>
					<div className="flex justify-between mb-2">
						<span className="font-medium">Tax ({taxRate * 100}%):</span>
						<span>${calculateTax().toFixed(2)}</span>
					</div>
					<div className="flex justify-between text-lg font-bold">
						<span>Total:</span>
						<span>${calculateTotal().toFixed(2)}</span>
					</div>
				</div>

				{/* Signature */}
				<div className="mt-12 pt-8 border-t">
					<div className="flex justify-between">
						<div>
							<p className="mb-1">Technician Signature:</p>
							<div className="h-16 w-48 border-b border-black"></div>
						</div>
						<div>
							<p className="mb-1">Customer Signature:</p>
							<div className="h-16 w-48 border-b border-black"></div>
						</div>
					</div>
				</div>

				{/* Print Button (hidden when printing) */}
				<div className="mt-8 text-center print:hidden">
					<button
						onClick={handlePrint}
						className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
					>
						Print Invoice
					</button>
				</div>
			</div>
		</div>
	);
};

export default InvoicePage;