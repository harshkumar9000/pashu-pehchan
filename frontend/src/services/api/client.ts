import { getItem, removeItem } from '../../components/adapters/storage';

export const getApiBaseUrl = (): string => {
  // Support both Expo and Vite environment variables
  if (typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_URL) {
    return (import.meta as any).env.VITE_API_URL;
  }
  return 'http://localhost:8000';
};

// In-memory active auth token for instant synchronous access across API client calls
let activeAuthToken: string | null = null;

export const setAuthToken = (token: string | null): void => {
  activeAuthToken = token;
};

export const getAuthToken = (): string | null => {
  return activeAuthToken;
};

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Attach auth token if available (check in-memory first, then storage)
  let token = activeAuthToken;
  if (!token) {
    token = await getItem('vetra_auth_token');
    if (token) {
      activeAuthToken = token;
    }
  }

  if (
    token &&
    token !== 'null' &&
    token !== 'undefined' &&
    typeof token === 'string' &&
    token.trim().length > 0 &&
    !headers['Authorization']
  ) {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  }

  // Auto-set Content-Type for non-FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type'] && options.body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // Intercept 401 Unauthorized globally
    if (response.status === 401) {
      activeAuthToken = null;
      try {
        await removeItem('vetra_auth_token');
        await removeItem('vetra_user');
      } catch (e) {
        // ignore storage removal errors
      }

      // If it's a login attempt with bad credentials, show the backend message
      if (path.includes('/api/auth/login')) {
        let errorDetail = 'Invalid phone/email or password.';
        try {
          const errJson = await response.json();
          errorDetail = errJson.detail || errorDetail;
        } catch {}
        throw new Error(errorDetail);
      }

      // Protected routes: show standard session expired message
      throw new Error('Your session has expired or is no longer valid. Please log in again.');
    }

    let errorDetail = `Request failed: ${response.statusText}`;
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return response.json();
}
