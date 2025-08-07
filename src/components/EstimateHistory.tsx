import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { apiFetch } from '@/lib/api';
import { EstimateFile, Ticket } from '@/common/interfaces';
import { IoCloseCircle } from "react-icons/io5";
import { FiMail } from "react-icons/fi";

export const EstimateHistory = ({ ticketData }: { ticketData: Ticket }) => {
	const [pdfList, setPdfList] = useState<{ index: number, name: string; url: string; }[]>([]);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isSendingEmail, setIsSendingEmail] = useState(false);

	useEffect(() => {
		const fetchEstimates = async () => {
			const authToken = localStorage.getItem('token');
			if (!authToken) {
				toast.error('Authentication required. Please login again.');
				return;
			}

			setIsLoading(true);
			try {
				const res = await apiFetch(`/api/tickets/${ticketData.id}/estimates`, 'GET', undefined, authToken);
				if (!res.ok) {
					throw new Error(`HTTP error! status: ${res.status}`);
				}
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
				toast.error(`Failed to fetch estimates: ${err instanceof Error ? err.message : String(err)}`);
			} finally {
				setIsLoading(false);
			}
		};

		fetchEstimates();
	}, [ticketData.id]);

	const handleSendEmail = async () => {
		const authToken = localStorage.getItem('token');
		if (!authToken) {
			toast.error('Authentication required. Please login again.');
			return;
		}

		if (pdfList.length === 0) {
			toast.error('No estimates to email');
			return;
		}

		setIsSendingEmail(true);
		try {
			const response = await apiFetch(
				`/api/tickets/${ticketData.id}/email-estimates`,
				'POST',
				{
					subject: 'Your Estimates from PG Mechanical',
					message: '<p>Please find your estimates attached.</p>',
				},
				authToken
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();
			if (result.success) {
				toast.success('Estimates emailed successfully!');
			} else {
				throw new Error(result.message || 'Failed to send email');
			}
		} catch (err) {
			console.error('Error sending email:', err);
			toast.error(`Failed to send email: ${err instanceof Error ? err.message : String(err)}`);
		} finally {
			setIsSendingEmail(false);
		}
	};

	const handleIframeError = (pdfUrl: string) => {
		console.error(`Failed to load PDF document: ${pdfUrl}`);
	};

	const revokeObjectUrls = () => {
		pdfList.forEach(pdf => {
			URL.revokeObjectURL(pdf.url);
		});
	};

	useEffect(() => {
		return () => {
			revokeObjectUrls();
		};
	}, [pdfList]);

	return (
		<div className="p-4">
			{isLoading ? (
				<div className="flex justify-center items-center h-32">
					<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
				</div>
			) : pdfList.length === 0 ? (
				<p className="text-gray-500 text-center py-8">No estimates found.</p>
			) : (
				<div className="flex flex-col space-y-4">
					<button
						onClick={handleSendEmail}
						disabled={isSendingEmail}
						className={`flex items-center justify-center gap-2 bg-blue-600 text-white p-2 rounded self-center hover:bg-blue-700 transition-colors ${isSendingEmail ? 'opacity-70 cursor-not-allowed' : ''
							}`}
					>
						{isSendingEmail ? (
							<>
								<span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
								Sending...
							</>
						) : (
							<>
								<FiMail className="inline" />
								Email Estimates
							</>
						)}
					</button>

					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
						{pdfList.map((pdf) => (
							<div
								key={pdf.index}
								className="border rounded-lg shadow-md cursor-pointer hover:shadow-lg transition overflow-hidden"
								onClick={() => setPreviewUrl(pdf.url)}
							>
								<div className="h-48 bg-gray-100 flex items-center justify-center">
									<iframe
										src={pdf.url}
										className="w-full h-full"
										onError={() => handleIframeError(pdf.url)}
										title={`PDF Preview ${pdf.index}`}
									/>
								</div>
								<p className="p-2 text-center text-sm truncate" title={pdf.name}>
									{pdf.name}
								</p>
							</div>
						))}
					</div>
				</div>
			)}

			{previewUrl && (
				<div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
					<div className="bg-white p-4 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col relative">
						<button
							className="absolute top-4 right-4 hover:bg-gray-100 p-1 rounded-full"
							onClick={() => setPreviewUrl(null)}
							aria-label="Close preview"
						>
							<IoCloseCircle size={24} className="text-red-500" />
						</button>
						<div className="flex-grow">
							<iframe
								src={previewUrl}
								className="w-full h-full min-h-[70vh]"
								onError={() => {
									console.error(`Failed to load PDF document in preview: ${previewUrl}`);
									toast.error('Failed to load PDF preview');
									setPreviewUrl(null);
								}}
								title="PDF Preview"
							/>
						</div>
						<div className="pt-2 text-sm text-gray-500 text-center">
							Click outside or press ESC to close
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
