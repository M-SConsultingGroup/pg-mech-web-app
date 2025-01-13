'use client';

import imageCompression from 'browser-image-compression';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ITicket } from '@/common/interfaces';
import { getLogger } from '@/lib/logger';
import { getCorrelationId } from '@/utils/helpers';
import { TICKET_STATUSES } from '@/common/constants';
import PartsModal from '@/components/PartsModal';
import partsData from '@/common/partslist.json';

let logger = getLogger();
const correlationId = getCorrelationId();
logger = logger.child({ correlationId });

const TicketDetails = () => {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.ticketId;
  const [ticket, setTicket] = useState<ITicket | null>(null);
  const [editedTicket, setEditedTicket] = useState<Partial<ITicket>>({});
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPartsModalOpen, setIsPartsModalOpen] = useState(false);

  const filteredStatuses = TICKET_STATUSES.filter(status => status !== 'New');

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
          const ticketResponse = await fetch(`/api/tickets?id=${ticketId}`, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
            },
          });

          if (ticketResponse.ok) {
            const ticketData = await ticketResponse.json();
            setTicket(ticketData);
            setEditedTicket(ticketData);
            setSelectedImages(ticketData.images || []);
          } else {
            toast.error('Failed to fetch ticket details');
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [ticketId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedTicket((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedImages((prevImages) => [...prevImages, ...Array.from(e.target.files || [])]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prevImages) => prevImages.filter((_, i) => i !== index));
  };

  const handleImageClick = async (image: string) => {
    const decompressedImage = await fetch(image).then(res => res.blob());
    const imageUrl = URL.createObjectURL(decompressedImage);
    setSelectedImage(imageUrl);
    setIsModalOpen(true);
  };

  const handleSaveClick = async () => {
    const authToken = localStorage.getItem('token');
    if (!authToken) {
      return;
    }

    setLoading(true);

    try {
      const compressedImages = await Promise.all(
        selectedImages.map(async (image) => {
          if (image instanceof File) {
            const options = {
              maxSizeMB: 1,
              maxWidthOrHeight: 1920,
              useWebWorker: true,
            };
            const compressedImage = await imageCompression(image, options);
            return compressedImage;
          }
          return image;
        })
      );

      const base64Images = await Promise.all(
        compressedImages
          .filter((image) => image instanceof Blob)
          .map((image) => {
            return new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsDataURL(image);
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = (error) => reject(error);
            });
          })
      );

      const updatedTicket = {
        ...editedTicket,
        partsUsed: editedTicket.partsUsed?.map(part => part.trim()),
        images: [...(editedTicket.images || []), ...base64Images],
      };

      const response = await fetch(`/api/tickets?id=${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(updatedTicket),
      });

      if (response.ok) {
        setLoading(false);
        toast.success('Ticket updated successfully');
        router.push('/tickets');
      } else {
        toast.error('Failed to update ticket ... Try again later');
        logger.error('Error saving ticket:', response);
      }
    } catch (error) {
      toast.error('Failed to update ticket ... Try again later');
      logger.error('Error saving ticket:', error);
    }
  };

  const ImageModal = ({ image, onClose }: { image: string, onClose: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="relative max-w-full max-h-full">
        <Image
          src={image}
          alt="Expanded"
          layout="responsive"
          width={800}
          height={600}
          className="object-contain"
        />
        <button
          onClick={onClose}
          className="absolute top-0 right-0 bg-red-600 text-white p-2 rounded-full"
        >
          &times;
        </button>
      </div>
    </div>
  );

  const handlePartsModalDone = (selectedParts: string[]) => {
    setEditedTicket((prev) => ({
      ...prev,
      partsUsed: [...(prev.partsUsed || []), ...selectedParts],
    }));
  };

  return (
    <div className="min-h-screen p-4 pb-10 flex flex-col items-center justify-center bg-gray-100 relative">
      <div className="flex items-center mb-4">
        <button onClick={() => router.push('/tickets')} className="mr-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-6 h-6 text-gray-800"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Edit Ticket</h1>
      </div>
      <form className="w-full max-w-lg bg-white p-4 rounded-lg shadow-lg">
        <div className="mb-2">
          <label className="block mb-1 text-gray-700">Ticket Number</label>
          <input
            type="text"
            name="ticketNumber"
            value={editedTicket.ticketNumber || ''}
            onChange={handleInputChange}
            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600 bg-gray-100"
            disabled
          />
        </div>
        <div className="mb-2">
          <label className="block mb-1 text-gray-700">Name</label>
          <input
            type="text"
            name="name"
            value={editedTicket.name || ''}
            onChange={handleInputChange}
            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600 bg-gray-100"
            disabled
          />
        </div>
        <div className="mb-2">
          <label className="block mb-1 text-gray-700">Service Address</label>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(editedTicket.serviceAddress || '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600 text-blue-600 underline bg-gray-100"
          >
            {editedTicket.serviceAddress || ''}
          </a>
        </div>
        <div className="mb-2">
          <label className="block mb-1 text-gray-700">Email</label>
          <input
            type="email"
            name="email"
            value={editedTicket.email || ''}
            onChange={handleInputChange}
            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600 bg-gray-100"
            disabled
          />
        </div>
        <div className="mb-2">
          <label className="block mb-1 text-gray-700">Phone Number</label>
          <a
            href={`tel:${editedTicket.phoneNumber}`}
            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600 text-blue-600 underline bg-gray-100"
          >
            {editedTicket.phoneNumber || ''}
          </a>
        </div>
        <div className="mb-2">
          <label className="block mb-1 text-gray-700">Work Order Description</label>
          <textarea
            name="workOrderDescription"
            value={editedTicket.workOrderDescription || ''}
            onChange={handleInputChange}
            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600 bg-gray-100"
            disabled
          />
        </div>
        <div className="mb-2">
          <label className="block mb-1 text-gray-700">Time Availability</label>
          <input
            type="text"
            name="timeAvailability"
            value={editedTicket.timeAvailability || ''}
            onChange={handleInputChange}
            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600 bg-gray-100"
            disabled
          />
        </div>
        <div className="mb-2">
          <label className="block mb-1 text-gray-700">Parts Used</label>
          <input
            type="text"
            name="partsUsed"
            value={editedTicket.partsUsed?.join(', ') || ''}
            onChange={handleInputChange}
            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <button
            type="button"
            onClick={() => setIsPartsModalOpen(true)}
            className="bg-blue-500 hover:bg-blue-700 text-white p-2 rounded mt-2"
          >
            Select Parts
          </button>
        </div>
        <div className="mb-2">
          <label className="block mb-1 text-gray-700">Services Delivered</label>
          <input
            type="text"
            name="servicesDelivered"
            value={editedTicket.servicesDelivered || ''}
            onChange={handleInputChange}
            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div className="mb-2">
          <label className="block mb-1 text-gray-700">Additional Notes</label>
          <textarea
            name="additionalNotes"
            value={editedTicket.additionalNotes || ''}
            onChange={handleInputChange}
            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div className="mb-2">
          <label className="block mb-1 text-gray-700">Status</label>
          <select
            name="status"
            value={editedTicket.status || ''}
            onChange={handleInputChange}
            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600 bg-gray-100"
          >
            {filteredStatuses.map(status => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-2">
          <label className="block mb-1 text-gray-700">Amount Billed</label>
          <input
            type="number"
            name="amountBilled"
            value={editedTicket.amountBilled || ''}
            onChange={handleInputChange}
            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div className="mb-2">
          <label className="block mb-1 text-gray-700">Amount Paid</label>
          <input
            type="number"
            name="amountPaid"
            value={editedTicket.amountPaid || ''}
            onChange={handleInputChange}
            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div className="mb-2">
          <label className="block mb-1 text-gray-700">Upload Images</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            className="mb-2"
          />
          <div className="flex flex-wrap justify-center">
            {selectedImages.map((image, index) => (
              <div key={index} className="relative m-2">
                <Image
                  src={typeof image === 'string' ? image : URL.createObjectURL(image)}
                  alt={`Uploaded ${index}`}
                  width={128}
                  height={128}
                  className="object-cover cursor-pointer"
                  onClick={() => handleImageClick(typeof image === 'string' ? image : URL.createObjectURL(image))}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-0 right-0 bg-red-600 text-white p-1 rounded-full"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={handleSaveClick}
            className="bg-green-600 hover:bg-green-700 text-white p-2 rounded shadow-lg transition duration-300 w-full"
          >
            Save
          </button>
        </div>
      </form>
      {loading && (
        <div className="loader-container">
          <div className="loader"></div>
        </div>
      )}
      {isModalOpen && selectedImage && (
        <ImageModal image={selectedImage} onClose={() => setIsModalOpen(false)} />
      )}
      <PartsModal
        parts={partsData.TotalParts}
        isOpen={isPartsModalOpen}
        onClose={() => setIsPartsModalOpen(false)}
        onDone={handlePartsModalDone}
      />
    </div>
  );
};

export default TicketDetails;