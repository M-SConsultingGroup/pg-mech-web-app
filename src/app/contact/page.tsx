"use client";

import { getLogger } from '@/lib/logger';
import { Autocomplete } from '@react-google-maps/api';
import { getCorrelationId } from '@/utils/helpers';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { toast } from 'react-hot-toast';
import ReCAPTCHA from 'react-google-recaptcha';
import MaskedInput from 'react-text-mask';

export default function Contact() {
    const pathname = usePathname();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        serviceAddress: '',
        workOrderDescription: '',
        tenantName: '',
        timeAvailability: ''
    });
    const [loading, setLoading] = useState(false);
    const [disclaimer, setDisclaimer] = useState(false);
    const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const recaptchaRef = useRef<ReCAPTCHA | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value
        }));
    };

    useEffect(() => {
        // Reset ReCAPTCHA when route changes
        recaptchaRef.current?.reset();
    }, [pathname]);

    const handlePlaceChanged = () => {
        if (autocompleteRef.current) {
            const place = autocompleteRef.current.getPlace();
            setFormData((prevData) => ({
                ...prevData,
                serviceAddress: place.formatted_address || ''
            }));
        }
    };

    const handleRecaptchaChange = (token: string | null) => {
        if (!token) {
            setRecaptchaToken(null);
            recaptchaRef.current?.reset(); // Reset ReCAPTCHA if token is null
        } else {
            setRecaptchaToken(token);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        if (!disclaimer) {
            toast.error('You must agree to the disclaimer before submitting the form.');
            return;
        }
        if (!recaptchaToken) {
            toast.error('Please complete the reCAPTCHA.');
            return;
        }
        if (formData.phoneNumber.replace(/\D/g, '').length !== 10) {
            toast.error('Phone number must be exactly ten digits.');
            return;
        }
        setLoading(true);

        const correlationId = getCorrelationId();
        const logger = getLogger().child({ correlationId });

        try {
            const response = await fetch('/api/tickets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...formData, recaptchaToken })
            });
            setLoading(false);
            if (response.ok) {
                const responseData = await response.json();
                const ticketId = responseData._id;

                toast.success('Ticket submitted successfully', {
                    className: 'text-xl'
                });

                // Send email with reschedule link
                const rescheduleLink = `${window.location.origin}/reschedule/${ticketId}`;
                const emailResponse = await fetch('/api/send-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        to: formData.email,
                        subject: 'Ticket Submission Confirmation',
                        message: `Hi ${formData.name},\n
            Thank you for submitting a ticket. Our Technician will contact you soon. 
            If you need to reschedule or cancel to avoid the tech visitation fee of $79, 
            please use the following link: ${rescheduleLink}
            \nBest regards,\nPG Mechanical Support`
                    }),
                });

                const emailData = await emailResponse.json();
                if (emailData.success) {
                    logger.info('Email sent successfully.');
                } else {
                    logger.error(`Email sending failed: ${emailData.error}`);
                }
                setFormData({
                    name: '',
                    email: '',
                    phoneNumber: '',
                    serviceAddress: '',
                    workOrderDescription: '',
                    tenantName: '',
                    timeAvailability: ''
                });
                setDisclaimer(false);
                setRecaptchaToken(null);
                recaptchaRef.current?.reset();
            } else {
                const errorData = await response.json();
                throw new Error(`Failed to submit ticket: ${response.status} - ${errorData.error || response.statusText}`);
            }
        } catch (error) {
            logger.error('Ticket submission error:', error);
            toast.error('An error occurred, please try again later', {
                className: 'text-xl'
            });
        }
    };

    return (

        <section className="min-h-screen bg-gray-100">

            <div className="p-8 pb-20 flex flex-col items-center justify-center bg-gray-100">
                <h1 className="text-3xl font-bold mb-6 text-gray-800">Submit a Ticket</h1>
                <form onSubmit={handleSubmit} className="w-full max-w-lg bg-white p-8 rounded-lg shadow-lg relative">
                    <div className="mb-4">
                        <label className="block mb-2 text-gray-700">Name</label>
                        <input
                            type="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Name will be used for billing"
                            className="border p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
                            required
                            name="name"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-2 text-gray-700">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="Your Primary Email Address"
                            className="border p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
                            required
                            name="email"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-2 text-gray-700">Phone Number</label>
                        <div className="flex items-center">
                            <span className="mr-2 border p-2 rounded">+1</span>
                            <MaskedInput
                                mask={[
                                    '(',
                                    /[2-9]/, // First digit of area code must be 2-9
                                    /\d/,    // Second digit of area code
                                    /\d/,    // Third digit of area code
                                    ')',
                                    ' ',     // Ensures a space after the area code
                                    /\d/,    // First digit of exchange code
                                    /\d/,    // Second digit of exchange code
                                    /\d/,    // Third digit of exchange code
                                    '-',
                                    /\d/,    // First digit of line number
                                    /\d/,    // Second digit of line number
                                    /\d/,    // Third digit of line number
                                    /\d/     // Fourth digit of line number
                                ]}
                                value={formData.phoneNumber}
                                onChange={handleInputChange}
                                placeholder="(123) 456-7890"
                                className="border p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
                                required
                                name="phoneNumber"
                                inputMode="tel"
                            />
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block mb-2 text-gray-700">Service Address</label>
                        <Autocomplete
                            onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
                            onPlaceChanged={handlePlaceChanged}
                        >
                            <input
                                type="text"
                                name="serviceAddress"
                                value={formData.serviceAddress}
                                onChange={handleInputChange}
                                className="border p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
                                required
                            />
                        </Autocomplete>
                    </div>
                    <div className="mb-4">
                        <label className="block mb-2 text-gray-700">Work Order Description</label>
                        <textarea
                            name="workOrderDescription"
                            value={formData.workOrderDescription}
                            onChange={handleInputChange}
                            placeholder="Describe your problem"
                            className="border p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-2 text-gray-700">If Rental, add Tenant name and phone number</label>
                        <textarea
                            name="tenantName"
                            value={formData.tenantName}
                            onChange={handleInputChange}
                            className="border p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-2 text-gray-700">Time Availability</label>
                        <textarea
                            name="timeAvailability"
                            value={formData.timeAvailability}
                            onChange={handleInputChange}
                            placeholder={`When would you like for our technician to visit?\n(e.g. Monday 12-4 PM) at least 4 hour window`}
                            className="border p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600 whitespace-pre-wrap resize-none max-h-20 min-h-20"
                            rows={2}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-2 text-gray-700">
                            <input
                                type="checkbox"
                                checked={disclaimer}
                                onChange={() => setDisclaimer(!disclaimer)}
                                className="mr-2"
                                required
                            />
                            I understand that there will be a minimum service fee of $79.
                        </label>
                    </div>
                    <div className="mb-4">
                        <ReCAPTCHA
                            ref={recaptchaRef}
                            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''}
                            onChange={handleRecaptchaChange}
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-green-600 hover:bg-green-700 text-white p-3 rounded shadow-lg transition duration-300 w-full"
                    >
                        Submit
                    </button>
                    {loading && (
                        <div className="loader-container">
                            <div className="loader"></div>
                        </div>
                    )}
                </form>
            </div>
        </section>
    );
}