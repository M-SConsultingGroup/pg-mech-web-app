'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { apiFetch } from '@/lib/api';
import { Ticket } from '@/common/interfaces';
import { TicketTabs } from '@/components/TicketTabs';

const InvoicePage = () => {
	const router = useRouter();
	const params = useParams();
	const ticketId = params.ticketId;
	const [ticket, setTicket] = useState<Ticket | null>(null);
	const [loading, setLoading] = useState(false);
	const [partPrices, setPartPrices] = useState<Record<string, number>>({});
	const [laborCost, setLaborCost] = useState(0);
	const [isSendingToSquare, setIsSendingToSquare] = useState(false);
	const [squareStatus, setSquareStatus] = useState('');
	const [paymentMethods, setPaymentMethods] = useState({
		card: true,
		bankAccount: false
	});
	const [warranties, setWarranties] = useState({
		labor: false,
		manufacture: false
	});

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

	const handlePrint = () => {
		window.print();
	};

	const sendToSquare = async () => {
		setIsSendingToSquare(true);
		setSquareStatus('Saving to Square as draft...');

		try {
			const authToken = localStorage.getItem('token');
			if (!authToken) {
				throw new Error('Not authenticated');
			}

			if (!ticket?.servicesDelivered || ticket.servicesDelivered.trim() === '') {
				toast.error('Please add services delivered before saving to Square');
				return;
			}

			const invoiceData = {
				ticket,
				lineItems: [
					...(ticket?.partsUsed?.map(part => ({
						name: part,
						quantity: 1,
						price: partPrices[part] || 0
					})) || []),
					...(warranties.labor ? [{
						name: 'Labor Warranty',
						quantity: 1,
						price: 0,
						notes: '1 Year Labor Warranty Included'
					}] : []),
					...(warranties.manufacture ? [{
						name: 'Manufacture Warranty',
						quantity: 1,
						price: 0,
						notes: 'Please Register Warranty on the following link: \n pgmechanical.us/warranty'
					}] : [])
				],
				payment: paymentMethods,
			};

			const response = await apiFetch('/api/square/create-invoice', 'POST', invoiceData, authToken);

			if (response.ok) {
				const result = await response.json();
				setSquareStatus(`Invoice saved as draft in Square successfully with Invoice Number: ${result.invoiceNumber}`);

				if (result.invoiceNumber) {
					try {
						const updateResponse = await apiFetch(`/api/tickets/${ticketId}`, 'POST', { status: 'Closed', invoiceNumber: `SQ_${result.invoiceNumber}` }, authToken);

						if (!updateResponse.ok) {
							toast.error('Failed to update ticket with invoice number');
						}
					} catch (updateError) {
						console.error('Error updating ticket:', updateError);
					}
				}
			} else {
				const error = await response.json();
				throw new Error(error.message || 'Failed to save to Square');
			}
		} catch (error) {
			console.error('Error saving to Square:', error);
			setSquareStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
		} finally {
			setIsSendingToSquare(false);
		}
	};

	if (loading) return <div className="text-center py-8">Loading...</div>;
	if (!ticket) return <div className="text-center py-8">Ticket not found</div>;

	return (
		<div className="min-h-screen p-4 bg-white print:p-0">
			<TicketTabs ticketId={ticket.id!} ticketNumber={ticket.ticketNumber!} activeTab="invoice" />
			<div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg print:shadow-none">
				<div className="flex justify-between mb-8 border-b pb-4">
					<div>
						<h2 className="text-xl font-semibold">PG Mechanical LLC</h2>
						<p>1111 Saddlebrook Dr.</p>
						<p>Murphy, TX 75087</p>
						<p>Phone: (469) 274-6424</p>
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

				{/* Payment Methods */}
				<div className="mb-4">
					<h3 className="text-lg font-semibold mb-2">Accepted Payment Methods</h3>
					<div className="flex space-x-4">
						<label className="flex items-center">
							<input
								type="checkbox"
								checked={paymentMethods.card}
								onChange={(e) => setPaymentMethods({ ...paymentMethods, card: e.target.checked })}
								className="mr-2"
							/>
							Credit/Debit Card
						</label>
						<label className="flex items-center">
							<input
								type="checkbox"
								checked={paymentMethods.bankAccount}
								onChange={(e) => setPaymentMethods({ ...paymentMethods, bankAccount: e.target.checked })}
								className="mr-2"
							/>
							Bank Account
						</label>
					</div>
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

				{/* Warranties Section */}
				<div className="mb-8">
					<h3 className="text-lg font-semibold mb-2">Warranties</h3>
					<div className="space-y-2">
						<label className="flex items-center">
							<input
								type="checkbox"
								checked={warranties.labor}
								onChange={(e) => setWarranties({ ...warranties, labor: e.target.checked })}
								className="mr-2"
							/>
							Add Labor Warranty
						</label>
						<label className="flex items-center">
							<input
								type="checkbox"
								checked={warranties.manufacture}
								onChange={(e) => setWarranties({ ...warranties, manufacture: e.target.checked })}
								className="mr-2"
							/>
							Add Manufacture Warranty
						</label>
					</div>
				</div>

				{/* Totals (simplified without tax) */}
				<div className="ml-auto w-64 border-t-2 pt-4">
					<div className="flex justify-between text-lg font-bold">
						<span>Total:</span>
						<span>${calculateSubtotal().toFixed(2)}</span>
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

				{/* Print and Save Buttons */}
				<div className="mt-8 text-center print:hidden">
					<button
						onClick={handlePrint}
						className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded mr-4"
					>
						Print Invoice
					</button>
					<button
						onClick={sendToSquare}
						disabled={isSendingToSquare}
						className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded disabled:bg-green-400"
					>
						{isSendingToSquare ? 'Saving...' : 'Save to Square as Draft'}
					</button>
				</div>
				{squareStatus && (
					<div className={`mt-4 text-center ${squareStatus.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
						{squareStatus}
					</div>
				)}
			</div>
		</div>
	);
};

export default InvoicePage;