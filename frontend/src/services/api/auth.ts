import { apiRequest, setAuthToken } from './client';
import { AuthResponse, User } from '../../types';
import { setItem, removeItem } from '../../components/adapters/storage';

export async function login(email: string, password: string): Promise<AuthResponse> {
  const data = await apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      phone_or_email: email,
      email: email,
      password: password,
    }),
  });
  if (data.access_token) {
    setAuthToken(data.access_token);
    await setItem('vetra_auth_token', data.access_token);
    await setItem('vetra_user', JSON.stringify(data.user));
  }
  return data;
}

export async function register(payload: {
  email: string;
  password: string;
  name: string;
  role: 'FARMER' | 'MIDDLEMAN' | 'ADMIN';
  phone?: string;
  district?: string;
  state?: string;
}): Promise<AuthResponse> {
  const data = await apiRequest<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (data.access_token) {
    setAuthToken(data.access_token);
    await setItem('vetra_auth_token', data.access_token);
    await setItem('vetra_user', JSON.stringify(data.user));
  }
  return data;
}

export async function getMe(): Promise<User> {
  return apiRequest<User>('/api/auth/me');
}

export async function logout(): Promise<void> {
  try {
    await apiRequest('/api/auth/logout', { method: 'POST' });
  } catch {
    // ignore
  }
  setAuthToken(null);
  await removeItem('vetra_auth_token');
  await removeItem('vetra_user');
}
