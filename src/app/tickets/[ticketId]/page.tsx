'use client';

import imageCompression from 'browser-image-compression';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { FiX } from 'react-icons/fi';
import { MdFindInPage } from 'react-icons/md';
import { FaPrint } from 'react-icons/fa';
import { FaArrowLeftLong } from "react-icons/fa6";
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Ticket } from '@/common/interfaces';
import { TICKET_STATUSES } from '@/common/constants';
import partsData from '@/common/partslist.json' assert { type: 'json' };
import { apiFetch } from '@/lib/api';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

const TicketDetails = () => {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.ticketId;
  const [ , setTicket] = useState<Ticket | null>(null);
  const [editedTicket, setEditedTicket] = useState<Partial<Ticket>>({});
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredParts, setFilteredParts] = useState<string[]>([]);
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const filteredStatuses = TICKET_STATUSES.filter(status => status !== 'New');

  useEffect(() => {
    if (searchQuery) {
      const filtered = partsData.TotalParts.filter(part =>
        part.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredParts(filtered);
    } else {
      setFilteredParts([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isModalOpen) {
        if (e.key === 'ArrowRight') handleNextImage();
        if (e.key === 'ArrowLeft') handlePrevImage();
        if (e.key === 'Escape') setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, currentImageIndex, selectedImages.length]);

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
            setEditedTicket(ticketData);
            setSelectedImages(ticketData.images || []);
            setSelectedParts(ticketData.partsUsed || []);
          } else {
            toast.error('Failed to fetch ticket details');
          }
        } catch (error) {
          throw new Error('Failed to fetch ticket details:');
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

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prevImages) => {
      const updated = prevImages.filter((_, i) => i !== index);
      setEditedTicket((prev) => ({
        ...prev,
        images: updated.filter((img) => typeof img === 'string'),
      }));
      return updated;
    });
  };

  const handleImageClick = async (image: string, index: number) => {
    const decompressedImage = await fetch(image).then(res => res.blob());
    const imageUrl = URL.createObjectURL(decompressedImage);
    setCurrentImageIndex(index);
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
        partsUsed: selectedParts,
        images: [...(editedTicket?.images || []), ...base64Images],
      };

      const response = await apiFetch(`/api/tickets/${ticketId}`, 'POST', updatedTicket, authToken);
      if (response.ok) {
        setLoading(false);
        toast.success('Ticket updated successfully');
        router.push('/tickets');
      } else {
        toast.error('Failed to update ticket ... Try again later');
      }
    } catch (error) {
      toast.error('Failed to update ticket ... Try again later');
    }
  };

  const ImageModal = ({ images, currentIndex, onClose, onNext, onPrev }:
    {
      images: (string | File)[];
      currentIndex: number;
      onClose: () => void;
      onNext: () => void;
      onPrev: () => void;
    }) => {
    const currentImage = images[currentIndex];
    const imageUrl =
      typeof currentImage === 'string'
        ? currentImage
        : URL.createObjectURL(currentImage);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div className="relative max-w-full max-h-full">
          <button
            type="button"
            onClick={onClose}
            className="absolute z-10 top-0 right-0 bg-red-600 text-white w-6 h-6 flex items-center justify-center rounded-full transform translate-x-1/2 -translate-y-1/2 hover:bg-red-700 transition-colors"
          >
            <FiX className="w-4 h-4" />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={onPrev}
                disabled={currentIndex === 0}
                className={`absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full z-50 ${currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-70'
                  }`}
              >
                &larr;
              </button>
              <button
                onClick={onNext}
                disabled={currentIndex === images.length - 1}
                className={`absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full z-50 ${currentIndex === images.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-70'
                  }`}
              >
                &rarr;
              </button>
            </>
          )}

          <TransformWrapper
            initialScale={1}
            minScale={1}
            maxScale={3}
            centerOnInit
            wheel={{ disabled: false }}
            doubleClick={{ disabled: true }}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                <div className="absolute bottom-6 right-6 z-50 flex gap-2">
                  <button
                    onClick={() => zoomOut()}
                    className="bg-white px-3 py-1 rounded shadow text-xl"
                  >
                    −
                  </button>
                  <button
                    onClick={() => zoomIn()}
                    className="bg-white px-3 py-1 rounded shadow text-xl"
                  >
                    +
                  </button>
                  <button
                    onClick={() => resetTransform()}
                    className="bg-white px-3 py-1 rounded shadow text-sm"
                  >
                    Reset
                  </button>
                </div>


                <TransformComponent>
                  <Image
                    src={imageUrl}
                    alt={`Zoomable image ${currentIndex + 1}`}
                    width={800}
                    height={600}
                    className="object-contain max-h-[90vh] select-none"
                    loading="eager"
                    draggable={false}
                  />
                </TransformComponent>
              </>
            )}
          </TransformWrapper>

          {/* 🔢 Image counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 text-center text-white">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % selectedImages.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + selectedImages.length) % selectedImages.length);
  };

  return (
    <div className="min-h-screen p-4 pb-10 bg-gray-100 relative">
      <div className="flex items-center mb-4">
        <button onClick={() => router.back()} className="mr-2">
          <FaArrowLeftLong />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Edit Ticket #{editedTicket.ticketNumber}</h1>
        <div className="ml-auto gap-2 flex">
          <button
            onClick={() => router.push(`/estimate/${ticketId}`)}
            className="bg-cyan-400 text-white px-4 py-2 rounded-lg hover:bg-cyan-600 transition-colors items-center flex gap-2"
          >
            <MdFindInPage size={20} /> <span>Generate Estimate</span>
          </button>
          <button
            onClick={() => router.push(`/invoice/${ticketId}`)}
            className="bg-emerald-400 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors items-center flex gap-2"
          >
            <FaPrint size={16} /> <span>Print Invoice</span>
          </button>
        </div>
      </div>

      <div className="w-full mx-auto bg-white p-6 rounded-lg shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label className="block mb-1 text-gray-700 font-medium">Customer Information</label>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-lg font-semibold">{editedTicket.name}</p>
                <p>{editedTicket.serviceAddress}</p>
                <p>{editedTicket.email}</p>
                <p>{editedTicket.phoneNumber}</p>
              </div>
            </div>

            <div>
              <label className="block mb-1 text-gray-700 font-medium">Work Description</label>
              <textarea
                name="workOrderDescription"
                value={editedTicket.workOrderDescription || ''}
                onChange={handleInputChange}
                className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600 bg-gray-100"
                disabled
                rows={4}
              />
            </div>

            <div>
              <label className="block mb-1 text-gray-700 font-medium">Time Availability</label>
              <input
                type="text"
                name="timeAvailability"
                value={editedTicket.timeAvailability || ''}
                onChange={handleInputChange}
                className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600 bg-gray-100"
              />
            </div>

            <div>
              <label className="block mb-1 text-gray-700 font-medium">Images</label>
              <div className="flex flex-wrap gap-2">
                {selectedImages.map((image, index) => (
                  <div key={index} className="relative">
                    <Image
                      src={typeof image === 'string' ? image : URL.createObjectURL(image)}
                      alt={`Uploaded ${index}`}
                      width={100}
                      height={100}
                      className="object-cover cursor-pointer rounded"
                      onClick={() => handleImageClick(typeof image === 'string' ? image : URL.createObjectURL(image), index)}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-0 right-0 bg-red-600 text-white w-6 h-6 flex items-center justify-center rounded-full transform translate-x-1/2 -translate-y-1/2 hover:bg-red-700 transition-colors"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-gray-700 font-medium">Status</label>
                <select
                  name="status"
                  value={editedTicket.status || ''}
                  onChange={handleInputChange}
                  className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {filteredStatuses.map(status => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 text-gray-700 font-medium">Invoice Number</label>
                <input
                  type="text"
                  name="squareInvoiceNumber"
                  value={editedTicket.invoiceNumber || ''}
                  onChange={handleInputChange}
                  className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Square Invoice #"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 text-gray-700 font-medium">Services Delivered</label>
              <input
                type="text"
                name="servicesDelivered"
                value={editedTicket.servicesDelivered || ''}
                onChange={handleInputChange}
                className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block mb-1 text-gray-700 font-medium">Parts Used</label>
              <input
                type="text"
                name="partsUsed"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Search for parts"
              />
              {filteredParts.length > 0 && (
                <ul className="border rounded mt-2 max-h-40 overflow-y-auto">
                  {filteredParts.map((part, index) => (
                    <li
                      key={index}
                      onClick={() => {
                        setSelectedParts((prev) => [...prev, part]);
                        setSearchQuery('');
                        setFilteredParts([]);
                      }}
                      className="p-2 cursor-pointer hover:bg-gray-200"
                    >
                      {part}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedParts.map((part, index) => (
                  <span
                    key={index}
                    className="inline-block bg-gray-200 px-3 py-1 rounded-full text-sm"
                  >
                    {part}
                    <button
                      type="button"
                      onClick={() => setSelectedParts(prev => prev.filter(p => p !== part))}
                      className="ml-1 text-gray-600 hover:text-red-600"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-gray-700 font-medium">Amount Billed ($)</label>
                <input
                  type="number"
                  name="amountBilled"
                  value={editedTicket.amountBilled || ''}
                  onChange={handleInputChange}
                  className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block mb-1 text-gray-700 font-medium">Amount Paid ($)</label>
                <input
                  type="number"
                  name="amountPaid"
                  value={editedTicket.amountPaid || ''}
                  onChange={handleInputChange}
                  className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 text-gray-700 font-medium">Additional Notes</label>
              <textarea
                name="additionalNotes"
                value={editedTicket.additionalNotes || ''}
                onChange={handleInputChange}
                className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
                rows={4}
              />
            </div>

          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={handleSaveClick}
            className="bg-green-600 hover:bg-green-800 text-white px-6 py-2 rounded shadow-lg transition duration-300"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {isModalOpen && (
        <ImageModal
          images={selectedImages}
          currentIndex={currentImageIndex}
          onClose={() => setIsModalOpen(false)}
          onNext={handleNextImage}
          onPrev={handlePrevImage}
        />
      )}
    </div>
  );
};

export default TicketDetails;