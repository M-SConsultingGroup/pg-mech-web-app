const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function apiFetch(endpoint: string, requestType: "GET" | "POST" | "DELETE", body?: object, token?: string,) {
	const url = `${BASE_URL}${endpoint}`;

	const options = {
		body: body ? JSON.stringify(body) : null,
		method: requestType,
		headers: {
			'Content-Type': 'application/json',
			Authorization: token? `Bearer ${token}` : '',
		},
	};

	return await fetch(url, options);
}