'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import Papa from 'papaparse';
import toast from 'react-hot-toast';
import { Ticket } from '@/common/interfaces';

interface EstimateItem {
	id: string;
	name: string;
	description?: string;
	price: number;
	quantity: number;
}

interface AddOnItem {
	id: string;
	name: string;
	price: number;
	included: boolean;
}

const EstimatePage = () => {
	const router = useRouter();
	const params = useParams();
	const ticketId = params.ticketId;
	const [estimate, setestimate] = useState<Ticket | null>(null);
	const [loading, setLoading] = useState(false);
	const [items, setItems] = useState<EstimateItem[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<any[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [saveStatus, setSaveStatus] = useState('');
	const [csvData, setCsvData] = useState<any[]>([]);
	const [addOns, setAddOns] = useState<AddOnItem[]>([]);
	const [selectedAddOnIds, setSelectedAddOnIds] = useState<Set<string>>(new Set());
	const [showCustomItem, setShowCustomItem] = useState(false);
	const [customItem, setCustomItem] = useState({
		name: '',
		price: 0,
		quantity: 1,
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
					const estimateResponse = await apiFetch(`/api/tickets/${ticketId}`, 'GET', undefined, authToken);
					if (estimateResponse.ok) {
						const estimateData = await estimateResponse.json();
						setestimate(estimateData);
					}
				} catch (error) {
					console.error('Failed to fetch estimate details:', error);
				} finally {
					setLoading(false);
				}
			};
			fetchData();
		}
	}, [ticketId]);

	useEffect(() => {
		fetch('/Pricing sheet 2025 - v1 - AddOns.csv')
			.then((res) => res.text())
			.then((csvText) => {
				const result = Papa.parse(csvText, {
					header: true,
					skipEmptyLines: true,
					transformHeader: header => header.trim(),
					transform: value => value.trim(),
				});
				const addOnsData = result.data.map((item: any) => ({
					id: `addon-${item.Name.replace(/\s+/g, '-').toLowerCase()}`,
					name: item.Name,
					price: parseFloat(item.Pricing) || 0,
					included: parseFloat(item.Pricing) === 0,
				}));
				setAddOns(addOnsData);

				// Auto-select included items
				const includedIds = new Set(
					addOnsData
						.filter(addOn => addOn.included)
						.map(addOn => addOn.id)
				);
				setSelectedAddOnIds(includedIds);

				// Add included items to the estimate
				setItems(prev => [
					...prev,
					...addOnsData
						.filter(addOn => addOn.included)
						.map(addOn => ({
							id: addOn.id,
							name: addOn.name,
							description: 'Included',
							price: addOn.price,
							quantity: 1
						}))
				]);
			})
			.catch(() => toast.error('Failed to load add-ons data'));
	}, []);

	const toggleAddOn = (addOnId: string) => {
		setSelectedAddOnIds(prev => {
			const newSelected = new Set(prev);
			if (newSelected.has(addOnId)) {
				newSelected.delete(addOnId);
				// Remove from items
				setItems(prevItems => prevItems.filter(item => item.id !== addOnId));
			} else {
				newSelected.add(addOnId);
				// Only add if not already in items
				setItems(prevItems => {
					if (prevItems.some(item => item.id === addOnId)) {
						return prevItems;
					}
					const addOn = addOns.find(a => a.id === addOnId);
					if (addOn) {
						return [
							...prevItems,
							{
								id: addOn.id,
								name: addOn.name,
								description: addOn.included ? 'Included' : undefined,
								price: addOn.price,
								quantity: 1
							}
						];
					}
					return prevItems;
				});
			}
			return newSelected;
		});
	};

	useEffect(() => {
		fetch('/Pricing sheet 2025 - v1 - Model Pricing.csv')
			.then((res) => res.text())
			.then((csvText) => {
				const result = Papa.parse(csvText, {
					header: true,
					skipEmptyLines: true,
					transformHeader: header => header.trim(),
					transform: value => value.trim(),
				});
				setCsvData(result.data as any[]);
			})
			.catch(() => toast.error('Failed to load pricing data'));
	}, []);

	const addCustomItem = () => {
		if (!customItem.name.trim()) {
			toast.error('Please enter a name for the custom item');
			return;
		}

		setItems(prev => [
			...prev,
			{
				id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				name: customItem.name,
				price: customItem.price,
				quantity: customItem.quantity,
			},
		]);
		setCustomItem({ name: '', price: 0, quantity: 1 });
		setShowCustomItem(false);
	};

	const handleSearch = async () => {
		if (!searchQuery.trim()) {
			setSearchResults([]);
			return;
		}

		setIsSearching(true);

		try {
			const filtered = csvData.filter(item =>
				item['Model']?.toLowerCase().includes(searchQuery.toLowerCase())
			);

			setSearchResults(filtered.map((item, index) => ({
				id: `csv-${index}`,
				name: item['Model'],
				description: item['Model Number'] || '',
				price: parseFloat(item['New Price']) || 0
			})));
		} catch (error) {
			console.error(error);
			toast.error('Search failed');
		} finally {
			setIsSearching(false);
		}
	};

	const addItem = (product: any) => {
		setItems(prev => [
			...prev,
			{
				id: product.id,
				name: product.name,
				description: product.description,
				price: product.price,
				quantity: 1
			}
		]);
		setSearchQuery('');
		setSearchResults([]);
	};

	const updateItem = (index: number, field: keyof EstimateItem, value: any) => {
		setItems(prev => {
			const newItems = [...prev];
			newItems[index] = { ...newItems[index], [field]: value };
			return newItems;
		});
	};

	const removeItem = (index: number) => {
		setItems(prev => prev.filter((_, i) => i !== index));
	};

	const calculateTotal = () => {
		return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
	};

	if (loading) return <div className="text-center py-8">Loading...</div>;
	if (!estimate) return <div className="text-center py-8">estimate not found</div>;

	return (
		<div className="min-h-screen p-4 bg-white print:p-0">
			<div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg print:shadow-none">
				{/* Header with back button (hidden when printing) */}
				<div className="flex items-center mb-6 print:hidden">
					<button
						onClick={() => router.push(`/estimates`)}
						className="mr-4 p-2 rounded-full hover:bg-gray-100"
					>
						← Back
					</button>
					<h1 className="text-2xl font-bold">Estimate</h1>
				</div>

				{/* Estimate Header */}
				<div className="flex justify-between mb-8 border-b pb-4">
					<div>
						<h2 className="text-xl font-semibold">PG Mechanical LLC</h2>
						<p>1111 Saddlebrook Dr.</p>
						<p>Murphy, TX 75087</p>
						<p>Phone: (469) 274-6462</p>
					</div>
					<div className="text-right">
						<h2 className="text-xl font-semibold">ESTIMATE</h2>
						<p>Date: {new Date().toLocaleDateString()}</p>
						<p>Estimate #: {estimate.ticketNumber}</p>
						<p>LIC#TACLB51418C</p>
					</div>
				</div>

				{/* Customer Information */}
				<div className="mb-8 border-b pb-4">
					<h3 className="text-lg font-semibold mb-2">Bill To:</h3>
					<p>{estimate.name}</p>
					<p>{estimate.serviceAddress}</p>
					<p>{estimate.email}</p>
					<p>{estimate.phoneNumber}</p>
				</div>

				{/* Item Search */}
				<div className="mb-6 print:hidden">
					<h3 className="text-lg font-semibold mb-2">Add Items</h3>
					<div className="flex gap-2 mb-2">
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search products..."
							className="flex-1 border rounded p-2"
							onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
						/>
						<button
							onClick={handleSearch}
							disabled={isSearching}
							className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-blue-400"
						>
							{isSearching ? 'Searching...' : 'Search'}
						</button>
					</div>

					{/* Search Results */}
					{searchResults.length > 0 && (
						<div className="border rounded p-2 max-h-60 overflow-y-auto">
							{searchResults.map((product, index) => (
								<div
									key={product.id}
									className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
									onClick={() => addItem(product)}
								>
									<div className="font-medium">{product.name}</div>
									<div className="text-sm text-gray-600">
										{product.description.split('; ').map((model: string, i: number) => (
											<div key={i}>• {model.trim()}</div>
										))}
									</div>
									<div className="text-sm font-medium">${product.price.toFixed(2)}</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Add Add-Ons Section */}
				<div className="mb-6 print:hidden">
					<h3 className="text-lg font-semibold mb-2">Add-Ons</h3>
					<div className="border rounded p-4 mb-4">
						{addOns.map((addOn) => (
							<div key={addOn.id} className="flex items-center mb-2">
								<input
									type="checkbox"
									id={`addon-${addOn.id}`}
									checked={selectedAddOnIds.has(addOn.id)}
									onChange={() => toggleAddOn(addOn.id)}
									className="mr-2"
								/>
								<label htmlFor={`addon-${addOn.id}`} className="flex-1">
									{addOn.name}
									<span className="text-sm text-gray-600 ml-2">
										{addOn.included ? '(Included)' : `($${addOn.price.toFixed(2)})`}
									</span>
								</label>
							</div>
						))}
					</div>

					{/* Custom Item Section */}
					<div className="border rounded p-4">
						<button
							onClick={() => setShowCustomItem(!showCustomItem)}
							className="text-blue-600 hover:text-blue-800 mb-2"
						>
							{showCustomItem ? 'Cancel' : '+ Add Custom Item'}
						</button>

						{showCustomItem && (
							<div className="mt-2 space-y-2">
								<input
									type="text"
									value={customItem.name}
									onChange={(e) => setCustomItem({ ...customItem, name: e.target.value })}
									placeholder="Item name"
									className="w-full border rounded p-2"
								/>
								<div className="flex gap-2">
									<input
										type="number"
										min="0"
										step="0.01"
										value={customItem.price}
										onChange={(e) => setCustomItem({ ...customItem, price: parseFloat(e.target.value) || 0 })}
										placeholder="Price"
										className="flex-1 border rounded p-2"
									/>
									<input
										type="number"
										min="1"
										value={customItem.quantity}
										onChange={(e) => setCustomItem({ ...customItem, quantity: parseInt(e.target.value) || 1 })}
										placeholder="Qty"
										className="w-20 border rounded p-2"
									/>
								</div>
								<button
									onClick={addCustomItem}
									className="bg-green-600 text-white px-4 py-2 rounded"
								>
									Add Custom Item
								</button>
							</div>
						)}
					</div>
				</div>

				{/* Items Table */}
				<div className="mb-8">
					<h3 className="text-lg font-semibold mb-4">Estimate Items</h3>
					<table className="w-full border-collapse">
						<thead>
							<tr className="bg-gray-100">
								<th className="p-2 text-left border">Item</th>
								<th className="p-2 text-right border">Price</th>
								<th className="p-2 text-right border">Qty</th>
								<th className="p-2 text-right border">Total</th>
								<th className="p-2 text-right border print:hidden">Action</th>
							</tr>
						</thead>
						<tbody>
							{items.length === 0 ? (
								<tr>
									<td colSpan={5} className="p-4 text-center text-gray-500">
										No items added yet
									</td>
								</tr>
							) : (
								items.map((item, index) => (
									<tr key={index} className="border-b">
										<td className="p-2 border">
											<div className="font-medium">{item.name}</div>
											{item.description && (
												<div className="text-sm text-gray-600">
													{item.description.split('; ').map((model, i) => (
														<div key={i}>• {model.trim()}</div>
													))}
												</div>
											)}
										</td>
										<td className="p-2 border text-right">
											<input
												type="number"
												min="0"
												step="0.01"
												value={item.price}
												onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
												className="w-24 text-right border rounded p-1 print:border-none print:bg-transparent"
											/>
										</td>
										<td className="p-2 border text-right">
											<input
												type="number"
												min="1"
												value={item.quantity}
												onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
												className="w-16 text-right border rounded p-1 print:border-none print:bg-transparent"
											/>
										</td>
										<td className="p-2 border text-right">${(item.price * item.quantity).toFixed(2)}</td>
										<td className="p-2 border text-right print:hidden">
											<button
												onClick={() => removeItem(index)}
												className="text-red-600 hover:text-red-800"
											>
												Remove
											</button>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				{/* Totals */}
				<div className="ml-auto w-64 border-t-2 pt-4">
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

				{/* Print and Save Buttons */}
				<div className="mt-8 text-center print:hidden">
					<button
						onClick={() => window.print()}
						className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded mr-4"
					>
						Print Estimate
					</button>
					<button
						onClick={window.print}
						disabled={isSaving || items.length === 0}
						className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded disabled:bg-green-400"
					>
						{isSaving ? 'Saving...' : 'Save Estimate'}
					</button>
				</div>
				{saveStatus && (
					<div className={`mt-4 text-center ${saveStatus.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
						{saveStatus}
					</div>
				)}
			</div>
		</div>
	);
};

export default EstimatePage;