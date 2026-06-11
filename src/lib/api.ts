const PUBLIC_API_URL = "https://backendwebsite.atrikumar31.workers.dev/todos";

export async function makeApiRequest(endpoint: string, method: string, body?: any) {
  try {
    // CRITICAL FIX: Hono will 404 if we send /todos/ instead of /todos
    const cleanEndpoint = endpoint === '/' ? '' : endpoint;
    const targetUrl = `${PUBLIC_API_URL}${cleanEndpoint}`;
    
    console.log(`[API Request] ${method} ${targetUrl}`);

    const options: RequestInit = { 
      method,
      headers: { "Content-Type": "application/json" }
    };
    
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