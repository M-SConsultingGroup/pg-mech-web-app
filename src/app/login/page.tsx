"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

export default function Login() {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const router = useRouter();
	const { login } = useAuth();

	useEffect(() => {
		const token = localStorage.getItem('token');
		if (token) {
			router.push('/tickets');
		}
	}, [router]);

	const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);
		const response = await fetch('/api/users/login', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ username, password }),
		});

		const data = await response.json();
		
		if (response.ok) {
			login(data.username, data.token);
			toast.success('Login successful', {
				className: 'text-xl',
			});
			router.push('/tickets');
		} else {
			toast.error(data.error || 'Login failed', {
				className: 'text-xl',
			});
		}
		setLoading(false);
	};

	return (
		<div className="min-h-screen p-8 pb-20 flex flex-col items-center justify-center bg-gray-100 relative">
			<button
				onClick={() => router.push('/')}
				className="absolute top-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded shadow-lg transition duration-300"
			>
				Home
			</button>
			<div className="w-full max-w-lg bg-white p-8 rounded-lg shadow-lg relative">
				<Image
					className="mb-8"
					src="/next.svg"
					alt="Next.js logo"
					width={180}
					height={38}
					priority
				/>
				<form onSubmit={handleLogin} className="flex flex-col gap-4">
					<div className="mb-4">
						<label className="block mb-2 text-gray-700">Username</label>
						<input
							type="text"
							placeholder="Username"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							className="border p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
							required
						/>
					</div>
					<div className="mb-4">
						<label className="block mb-2 text-gray-700">Password</label>
						<input
							type="password"
							placeholder="Password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="border p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
							required
						/>
					</div>
					<button
						type="submit"
						className="bg-blue-500 hover:bg-blue-700 text-white p-3 rounded shadow-lg transition duration-300 w-full"
					>
						Login
					</button>
					{loading && (
						<div className="absolute inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-10">
							<div className="loader"></div>
						</div>
					)}
				</form>
			</div>
			<Toaster />
		</div>
	);
}