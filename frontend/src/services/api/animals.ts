import { apiRequest } from './client';
import { AnimalRecord } from '../../types';

export async function getAnimals(params?: {
  status?: string;
  species?: string;
}): Promise<AnimalRecord[]> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.species) query.append('species', params.species);
  const qs = query.toString();
  return apiRequest<AnimalRecord[]>(`/api/animals${qs ? `?${qs}` : ''}`);
}

export async function getAnimalById(id: number): Promise<AnimalRecord> {
  return apiRequest<AnimalRecord>(`/api/animals/${id}`);
}

export async function createAnimal(payload: {
  tag_number?: string;
  species: 'Cattle' | 'Buffalo';
  breed: string;
  predicted_breed?: string;
  confidence_score?: number;
  is_human_verified?: number;
  age_months?: number;
  lactation_cycle?: number;
  daily_milk_yield_litres?: number;
  photo_url?: string;
  health_status?: string;
  status?: 'IN_HERD' | 'FOR_SALE' | 'SOLD';
}): Promise<AnimalRecord> {
  return apiRequest<AnimalRecord>('/api/animals', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAnimal(
  id: number,
  payload: Partial<AnimalRecord>
): Promise<AnimalRecord> {
  return apiRequest<AnimalRecord>(`/api/animals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteAnimal(id: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/api/animals/${id}`, {
    method: 'DELETE',
  });
}

export async function verifyAnimal(
  id: number,
  verifiedBreed: string
): Promise<AnimalRecord> {
  return apiRequest<AnimalRecord>(`/api/animals/${id}/verify`, {
    method: 'POST',
    body: JSON.stringify({ verified_breed: verifiedBreed }),
  });
}
