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

import { predictImageClient } from './clientPredictor';
import { FALLBACK_BREEDS } from '../data/breedsFallback';

export async function checkHealth(): Promise<HealthResponse> {
  try {
    return await apiRequest<HealthResponse>('/api/health');
  } catch {
    return {
      status: 'online',
      model_loaded: true,
      model_version: '2.0.0-client',
      classes: 41,
      device: 'Browser WebAssembly (ONNX)',
      architecture: 'efficientnet_b0',
    };
  }
}

export async function getBreeds(): Promise<BreedItem[]> {
  try {
    const breeds = await apiRequest<BreedItem[]>('/api/breeds');
    if (Array.isArray(breeds) && breeds.length > 0) return breeds;
    return FALLBACK_BREEDS;
  } catch (err) {
    console.log('[API] Backend unreachable, using ICAR breed library fallback');
    return FALLBACK_BREEDS;
  }
}

export async function getBreedByName(breedName: string): Promise<BreedItem> {
  try {
    return await apiRequest<BreedItem>(`/api/breeds/${encodeURIComponent(breedName)}`);
  } catch {
    const found = FALLBACK_BREEDS.find(
      (b) =>
        b.breed.toLowerCase() === breedName.toLowerCase() ||
        b.display_name.toLowerCase() === breedName.toLowerCase()
    );
    if (found) return found;
    return FALLBACK_BREEDS[0];
  }
}

export async function predictImage(
  imageFile: File | Blob | any,
  filename = 'cattle_photo.jpg'
): Promise<PredictResponse> {
  const baseUrl = getApiBaseUrl();

  // 1. If backend URL is set, try backend prediction first
  if (baseUrl) {
    try {
      const formData = new FormData();
      if (imageFile && typeof imageFile === 'object' && 'uri' in imageFile) {
        formData.append('image', imageFile as any);
      } else {
        formData.append('image', imageFile, filename);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${baseUrl}/api/predict`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        return await res.json();
      }
    } catch (backendErr) {
      console.warn('[Predict] Backend offline or unreachable, switching to Client ONNX model:', backendErr);
    }
  }

  // 2. Client-Side Inference using the Trained PyTorch / ONNX Model in browser
  return predictImageClient(imageFile, filename);
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
