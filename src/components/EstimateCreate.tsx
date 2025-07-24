import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import toast from 'react-hot-toast';
import { apiFetch } from '@/lib/api';
import { Ticket } from '@/common/interfaces';
import { IoCloseCircle } from "react-icons/io5";
import { FaChevronRight } from 'react-icons/fa6';

const html2pdf = typeof window !== 'undefined' ? require('html2pdf.js') : null;

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

export const CreateEstimate = ({ ticketData }: { ticketData: Ticket }) => {

	const [isAddOnsOpen, setIsAddOnsOpen] = useState(true)
	const [items, setItems] = useState<EstimateItem[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<EstimateItem[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [saveStatus, setSaveStatus] = useState('');
	const [csvData, setCsvData] = useState<any[]>([]);
	const [addOns, setAddOns] = useState<AddOnItem[]>([]);
	const [, setSelectedAddOnIds] = useState<Set<string>>(new Set());
	const [showCustomItem, setShowCustomItem] = useState(false);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [customItem, setCustomItem] = useState({
		name: '',
		price: 0,
		quantity: 1,
	});

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
			})
			.catch(() => toast.error('Failed to load add-ons data'));
	}, []);

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

	const toggleAddOn = (addOnId: string) => {
		setSelectedAddOnIds(prev => {
			const newSelected = new Set(prev);
			if (newSelected.has(addOnId)) {
				newSelected.delete(addOnId);
				setItems(prevItems => prevItems.filter(item => item.id !== addOnId));
			} else {
				newSelected.add(addOnId);
				setItems(prevItems => {
					if (prevItems.some(item => item.id === addOnId)) return prevItems;
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
		try {
			const filtered = csvData.filter(item =>
				item['Model']?.toLowerCase().includes(searchQuery.toLowerCase())
			);

			setSearchResults(filtered.map((item, index) => ({
				id: `csv-${index}`,
				name: item['Model'],
				description: item['Model Number'] || '',
				price: parseFloat(item['New Price']) || 0,
				quantity: 1
			})));
		} catch (error) {
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

	const handleSave = async () => {
		const element = document.getElementById('estimate-page');
		if (isSaving || items.length === 0 || !ticketData || !element) return;

		setIsSaving(true);
		setSaveStatus('');

		const opt = {
			margin: 0.2,
			filename: 'estimate.pdf',
			image: { type: 'jpeg', quality: 0.98 },
			html2canvas: { scale: 2, ignoreElements: (el: HTMLElement) => el.classList.contains('print:hidden') },
			pagebreak: { mode: ['avoid-all'] },
			jsPDF: { unit: 'in', format: 'A4', orientation: 'portrait' },
			enableLinks: true,
		};

		const pdfBlob = await html2pdf().from(element).set(opt).outputPdf('blob');
		const previewBlobUrl = URL.createObjectURL(pdfBlob);
		setPreviewUrl(previewBlobUrl);
	};

	const handleConfirmSave = async () => {
		try {
			if (!previewUrl || !ticketData) return;
			setIsSaving(true);

			const res = await fetch(previewUrl);
			const pdfBlob = await res.blob();

			const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
				const reader = new FileReader();
				reader.onloadend = () => {
					if (reader.result instanceof ArrayBuffer) {
						resolve(Buffer.from(reader.result));
					} else {
						reject(new Error('Failed to convert PDF to Buffer'));
					}
				};
				reader.onerror = reject;
				reader.readAsArrayBuffer(pdfBlob);
			});

			const authToken = localStorage.getItem('token');
			if (!authToken) throw new Error('Not authenticated');

			const index = ticketData.estimateFiles?.length ? ticketData.estimateFiles.length + 1 : 1;

			console.log(pdfBuffer, 'PDF Buffer to be saved');
			await apiFetch(`/api/tickets/${ticketData.id}/estimates`, 'POST',
				{
					index,
					fileName: `estimate-${ticketData.ticketNumber}-${index}.pdf`,
					data: pdfBuffer,
				},
				authToken
			);

			toast.success('Estimate saved successfully!');
			setPreviewUrl(null);
		} catch (err) {
			toast.error('Failed to save estimate');
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="min-h-screen p-4 bg-white print:p-0">
			<div id='estimate-page' className="max-w-5xl mx-auto bg-white p-6 rounded-lg shadow-lg print:shadow-none">

				{/* Estimate Header */}
				<div className="flex justify-between mb-8 border-b pb-4">
					<div>
						<h2 className="text-xl font-semibold">PG Mechanical LLC</h2>
						<p>1111 Saddlebrook Dr.</p>
						<p>Murphy, TX 75087</p>
						<p>Phone: (469) 274-6424</p>
					</div>
					<div className="text-right">
						<h2 className="text-xl font-semibold">ESTIMATE</h2>
						<p>Date: {new Date().toLocaleDateString()}</p>
						<p>Estimate #: {ticketData.ticketNumber}</p>
						<p>LIC#TACLB51418C</p>
					</div>
				</div>

				{/* Customer Information */}
				<div className="mb-8 border-b pb-4">
					<h3 className="text-lg font-semibold mb-2">Bill To:</h3>
					<p>{ticketData.name}</p>
					<p>{ticketData.serviceAddress}</p>
					<p>{ticketData.email}</p>
					<p>{ticketData.phoneNumber}</p>
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
										{product.description?.split('; ').map((model: string, i: number) => (
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

					{/* Custom Item Section */}
					<div className="border rounded p-4">
						<button onClick={() => setShowCustomItem(!showCustomItem)} className="text-blue-600 hover:text-blue-800">
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
											{item.description ? (
												<div className="text-sm text-gray-600">
													{item.description.split('; ').map((model, i) => (
														<div key={i}>• {model.trim()}</div>
													))}
												</div>
											) : (<input
												type="text"
												defaultValue={item.description || ''}
												onKeyDown={(e) => {
													if (e.key === 'Enter') {
														updateItem(index, 'description', (e.target as HTMLInputElement).value);
														e.preventDefault();
													}
												}}
												className="w-48 my-2 text-left border rounded p-1 print:border-none print:bg-transparent"
												placeholder="Description"
											/>)}
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

				{/* Note */}
				<div className="mt-4 p-3 bg-gray-50 rounded border-l-4 border-gray-400">
					<p className="text-gray-600 italic">
						Note: This estimate is valid for 30 days from the date shown above.
					</p>
					<span className="text-gray-600 text-xs mt-2 block">
						Regulated by the Texas Department of Licensing and Regulation<br />
						P.O. BOX 1215 AUSTIN, TX 78711<br />
						1-800-803-9202 | 512-463-6599<br />
						www.tdlr.texas.gov
					</span>
				</div>

				{/* Print and Send Buttons */}
				<div className="mt-8 text-center print:hidden">
					<button
						onClick={() => window.print()}
						className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded mr-4"
					>
						Print Estimate
					</button>
					<button
						onClick={handleSave}
						disabled={isSaving || items.length === 0}
						className={`bg-green-600 hover:bg-green-800 text-white px-6 py-2 rounded ${isSaving ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
					>
						{isSaving ? 'Saving ...' : 'Save Estimate'}
					</button>
				</div>
				{saveStatus && (
					<div className={`mt-4 text-center ${saveStatus.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
						{saveStatus}
					</div>
				)}
			</div>

			<div className={`fixed max-h-100 top-1/2 right-0 -translate-y-1/4 z-20 w-80 print:hidden rounded-lg bg-white shadow-lg transition-all duration-300 ease-in-out ${isAddOnsOpen ? 'translate-x-0' : 'translate-x-72'}`}>
				<div className="overflow-y-auto p-2">
					<div className="flex justify-between items-center mb-2">
						{isAddOnsOpen ? (
							<button onClick={() => setIsAddOnsOpen(false)} className="text-gray-500 hover:text-gray-700">
								<FaChevronRight size={20} />
							</button>
						) : (
							<button onClick={() => setIsAddOnsOpen(true)} className="text-gray-500 hover:text-gray-700">
								<FaChevronRight size={20} className="transform rotate-180" />
							</button>
						)}
						<h2 className="text-xl font-bold">Add-Ons</h2>
					</div>
					<div className='pl-6'>
						{addOns.map((addOn) => (
							<div key={addOn.id} className="flex items-center hover:bg-gray-50 rounded">
								<input
									type="checkbox"
									id={`addon-${addOn.id}`}
									onChange={() => toggleAddOn(addOn.id)}
									className="mr-2"
								/>
								<label htmlFor={`addon-${addOn.id}`} className="flex-1">
									<div className="font-medium">{addOn.name}</div>
									<div className="text-sm text-gray-600">
										{addOn.included ? 'Included' : `$${addOn.price.toFixed(2)}`}
									</div>
								</label>
							</div>
						))}
					</div>
				</div>
			</div>

			{previewUrl && (
				<div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center">
					<div className="relative bg-gray-600 p-2 rounded shadow-xl max-w-4xl w-full h-[85vh]">
						<button
							className="absolute -top-5 -right-5 text-gray-500 hover:text-black"
							onClick={() => { setPreviewUrl(null); setIsSaving(false); }}
						>
							<IoCloseCircle size={30} color='red' />
						</button>
						<embed src={previewUrl} type="application/pdf" className="w-full h-full rounded" />
						<div className="m-6 flex justify-end gap-2">
							<button onClick={() => { setPreviewUrl(null); setIsSaving(false); }} className="bg-gray-200 hover:bg-gray-300 text-black px-4 py-2 rounded">
								Cancel
							</button>
							<button onClick={handleConfirmSave} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
								Confirm & Save
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
};