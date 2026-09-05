import { apiRequest } from './client';
import { AnimalRecord } from '../../types';

export const FALLBACK_ANIMALS: AnimalRecord[] = [
  {
    id: 1,
    farmer_id: 1,
    tag_number: 'PB-48201',
    breed: 'Gir',
    predicted_breed: 'Gir',
    confidence_score: 0.932,
    is_human_verified: 1,
    species: 'Cattle',
    age_months: 36,
    lactation_cycle: 2,
    daily_milk_yield_litres: 14.5,
    health_status: 'HEALTHY',
    status: 'IN_HERD',
    photo_url: '/samples/gir.jpg',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    farmer_id: 1,
    tag_number: 'PB-55092',
    breed: 'Murrah',
    predicted_breed: 'Murrah',
    confidence_score: 0.894,
    is_human_verified: 1,
    species: 'Buffalo',
    age_months: 42,
    lactation_cycle: 3,
    daily_milk_yield_litres: 18.0,
    health_status: 'HEALTHY',
    status: 'IN_HERD',
    photo_url: '/samples/murrah.jpg',
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    farmer_id: 1,
    tag_number: 'PB-12903',
    breed: 'Sahiwal',
    predicted_breed: 'Sahiwal',
    confidence_score: 0.865,
    is_human_verified: 1,
    species: 'Cattle',
    age_months: 28,
    lactation_cycle: 1,
    daily_milk_yield_litres: 12.0,
    health_status: 'HEALTHY',
    status: 'FOR_SALE',
    photo_url: '/samples/sahiwal.jpg',
    created_at: new Date().toISOString(),
  },
];

export async function getAnimals(params?: {
  status?: string;
  species?: string;
}): Promise<AnimalRecord[]> {
  try {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.species) query.append('species', params.species);
    const qs = query.toString();
    const data = await apiRequest<AnimalRecord[]>(`/api/animals${qs ? `?${qs}` : ''}`);
    if (Array.isArray(data) && data.length > 0) return data;
    return FALLBACK_ANIMALS;
  } catch {
    return FALLBACK_ANIMALS;
  }
}

export async function getAnimalById(id: number): Promise<AnimalRecord> {
  try {
    return await apiRequest<AnimalRecord>(`/api/animals/${id}`);
  } catch {
    const found = FALLBACK_ANIMALS.find((a) => a.id === id);
    return found || FALLBACK_ANIMALS[0];
  }
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
  try {
    return await apiRequest<AnimalRecord>('/api/animals', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch {
    const newAnimal: AnimalRecord = {
      id: Date.now(),
      farmer_id: 1,
      tag_number: payload.tag_number || `PB-${Math.floor(10000 + Math.random() * 90000)}`,
      species: payload.species,
      breed: payload.breed,
      predicted_breed: payload.predicted_breed,
      confidence_score: payload.confidence_score || 0.9,
      is_human_verified: payload.is_human_verified || 1,
      age_months: payload.age_months || 30,
      lactation_cycle: payload.lactation_cycle || 1,
      daily_milk_yield_litres: payload.daily_milk_yield_litres || 12,
      photo_url: payload.photo_url || '/samples/gir.jpg',
      health_status: payload.health_status || 'HEALTHY',
      status: payload.status || 'IN_HERD',
      created_at: new Date().toISOString(),
    };
    return newAnimal;
  }
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
