import { getAuth } from 'firebase/auth';

async function makeRequest(endpoint: string, options: RequestInit = {}) {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const token = await user.getIdToken();
  
  // Don't set Content-Type for FormData, let the browser set it with boundary
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    ...options.headers as Record<string, string>,
  };

  // Only set Content-Type to application/json if body is not FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export const apiClient = {
  async get(endpoint: string, options: RequestInit = {}) {
    return makeRequest(endpoint, { ...options, method: 'GET' });
  },

  async post(endpoint: string, data: any, options: RequestInit = {}) {
    return makeRequest(endpoint, {
      ...options,
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  },

  async put(endpoint: string, data: any, options: RequestInit = {}) {
    return makeRequest(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(endpoint: string, options: RequestInit = {}) {
    return makeRequest(endpoint, { ...options, method: 'DELETE' });
  },
};
