import {
  HealthResponse,
  PredictResponse,
  BreedItem,
  RecordCreate,
  RecordResponse,
  DashboardResponse,
} from '../types';
import { getApiBaseUrl, apiRequest } from './api/client';

export * from './api/client';
export * from './api/auth';
export * from './api/animals';
export * from './api/marketplace';
export * from './api/enquiries';
export * from './api/vets';
export * from './api/dashboard';
export * from './api/notifications';

export async function checkHealth(): Promise<HealthResponse> {
  return apiRequest<HealthResponse>('/api/health');
}

export async function getBreeds(): Promise<BreedItem[]> {
  return apiRequest<BreedItem[]>('/api/breeds');
}

export async function getBreedByName(breedName: string): Promise<BreedItem> {
  return apiRequest<BreedItem>(`/api/breeds/${encodeURIComponent(breedName)}`);
}

export async function predictImage(
  imageFile: File | Blob | any,
  filename = 'cattle_photo.jpg'
): Promise<PredictResponse> {
  const baseUrl = getApiBaseUrl();
  const formData = new FormData();

  // If running on React Native with URI object
  if (imageFile && typeof imageFile === 'object' && 'uri' in imageFile) {
    formData.append('image', imageFile as any);
  } else {
    formData.append('image', imageFile, filename);
  }

  const res = await fetch(`${baseUrl}/api/predict`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    let errorDetail = 'Prediction failed';
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {
      errorDetail = res.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export async function saveRecord(payload: RecordCreate): Promise<RecordResponse> {
  return apiRequest<RecordResponse>('/api/records', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getRecords(
  params?: {
    search?: string;
    status?: string;
    limit?: number;
    offset?: number;
  },
  options?: RequestInit
): Promise<RecordResponse[]> {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.status && params.status !== 'All') query.append('status', params.status);
  if (params?.limit) query.append('limit', String(params.limit));
  if (params?.offset) query.append('offset', String(params.offset));

  const qs = query.toString();
  return apiRequest<RecordResponse[]>(`/api/records${qs ? `?${qs}` : ''}`, options);
}

export async function getDashboardStats(): Promise<DashboardResponse> {
  return apiRequest<DashboardResponse>('/api/dashboard/stats');
}
