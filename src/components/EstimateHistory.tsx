import { useEffect, useState } from 'react';

export const EstimateHistory = ({ ticketId }: { ticketId: string }) => {
	const [pdfList, setPdfList] = useState<string[]>([]);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);

	useEffect(() => {
		const fetchEstimates = async () => {
			const authToken = localStorage.getItem('token');
			if (!authToken) return;

			try {
				const res = await fetch(`/api/tickets/${ticketId}/estimates`, {
					headers: {
						Authorization: `Bearer ${authToken}`,
					},
				});
				const data = await res.json(); // Assuming it returns array of file URLs or names
				setPdfList(data.files || []);
			} catch (err) {
				console.error('Failed to fetch estimates:', err);
			}
		};

		fetchEstimates();
	}, [ticketId]);

	return (
		<div>
			<h2 className="text-xl font-bold mb-4">Estimate History</h2>
			{pdfList.length === 0 ? (
				<p>No estimates found.</p>
			) : (
				<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
					{pdfList.map((fileUrl, index) => (
						<div
							key={index}
							className="border rounded shadow cursor-pointer hover:shadow-lg transition"
							onClick={() => setPreviewUrl(fileUrl)}
						>
							<embed
								src={fileUrl}
								type="application/pdf"
								className="w-full h-48 object-cover"
							/>
							<p className="p-2 text-center text-sm break-all">{fileUrl.split('/').pop()}</p>
						</div>
					))}
				</div>
			)}

			{previewUrl && (
				<div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
					<div className="bg-white p-4 rounded-lg max-w-3xl w-full relative">
						<button
							className="absolute top-2 right-2 text-gray-600 hover:text-black"
							onClick={() => setPreviewUrl(null)}
						>
							✕
						</button>
						<embed src={previewUrl} type="application/pdf" className="w-full h-[80vh]" />
					</div>
				</div>
			)}
		</div>
	);
};
