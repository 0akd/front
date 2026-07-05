// src/movies/lib/api.ts
const PUBLIC_API_URL = "https://backendwebsite.atrikumar31.workers.dev/api/movies";

export async function makeApiRequest(endpoint: string, method: string, body?: any) {
  try {
    const cleanEndpoint = endpoint === '/' ? '' : endpoint;
    const targetUrl = `${PUBLIC_API_URL}${cleanEndpoint}`;
    
    console.log(`[API Request] ${method} ${targetUrl}`);

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const options: RequestInit = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(targetUrl, options);
    
    if (!res.ok) {
      console.error(`[API Error] ${res.status}: ${await res.text()}`);
      return null;
    }
    
    return await res.json();
  } catch (e) {
    console.error("[API Network Error]:", e);
    return null;
  }
}