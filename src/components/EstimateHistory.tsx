import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { apiFetch } from '@/lib/api';
import { EstimateFile, Ticket } from '@/common/interfaces';
import { IoCloseCircle } from "react-icons/io5";

export const EstimateHistory = ({ ticketData }: { ticketData: Ticket }) => {
	const [pdfList, setPdfList] = useState<{ index: number, name: string; url: string; }[]>([]);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);

	useEffect(() => {
		const fetchEstimates = async () => {
			const authToken = localStorage.getItem('token');
			if (!authToken) return;

			try {
				const res = await apiFetch(`/api/tickets/${ticketData.id}/estimates`, 'GET', undefined, authToken);
				const data: EstimateFile[] = await res.json();
				const pdfs = data.map((file, index) => {
					const byteArray = new Uint8Array(file.data.data);
					const blob = new Blob([byteArray], { type: file.contentType });
					const url = URL.createObjectURL(blob);
					return {
						index: file.index,
						name: file.fileName,
						url,
					};
				});
				setPdfList(pdfs ?? []);
			} catch (err) {
				toast.error(`Failed to fetch estimates: + ${err}`);
			}
		};

		fetchEstimates();
	}, [ticketData.id]);

	const handleSendEmail = async () => {
		const authToken = localStorage.getItem('token');
		if (!authToken) {
			toast.error('Not authenticated, Login again to send email.');
			return;
		}
		const response = await apiFetch(`/api/tickets/${ticketData.id}/email-estimates`, 'POST',
			{
				subject: 'Your Estimates from PG Mechanical',
				message: '<p>Please find your estimates attached.</p>',
			},
			authToken);

		const result = await response.json();
		if (result.success) {
			toast.success('Estimates emailed successfully!');
		} else {
			toast.error('Failed to send email.');
		}
	};

	return (
		<div>
			{pdfList.length === 0 ? <p>No estimates found.</p> : (
				<div className="flex flex-col">
					<button
						onClick={handleSendEmail}
						className="bg-blue-600 text-white p-2 m-2 rounded self-center hover:bg-blue-700 transition-colors"
					>
						Email Estimates
					</button>
					<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
						{pdfList.map((pdf) => (
							<div
								key={pdf.index}
								className="border rounded shadow cursor-pointer hover:shadow-lg transition"
								onClick={() => setPreviewUrl(pdf.url)}
							>
								<embed src={pdf.url} type="application/pdf" className="w-full h-48 object-cover" />
								<p className="p-2 text-center text-sm break-all">{pdf.url.split('/').pop()}</p>
							</div>
						))}
					</div>
				</div>
			)}

			{previewUrl && (
				<div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
					<div className="bg-white p-4 rounded-lg max-w-3xl w-full relative">
						<button className="absolute top-5 right-5" onClick={() => setPreviewUrl(null)}>
							<IoCloseCircle size={30} color='red' />
						</button>
						<embed src={previewUrl} type="application/pdf" className="w-full h-[80vh]" />
					</div>
				</div>
			)}
		</div>
	);
};
