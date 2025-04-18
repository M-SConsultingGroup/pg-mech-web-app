const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function apiFetch(endpoint: string, requestType: "GET"| "POST" | "DELETE", token: string, body?: object) {
  const url = `${BASE_URL}${endpoint}`;

	const options = {
		body: body ? JSON.stringify(body) : null,
		method: requestType,
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
	};
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response;
}