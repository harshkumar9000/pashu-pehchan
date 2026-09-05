import { apiRequest } from './client';
import { VetService } from '../../types';

export async function getVets(params?: {
  district?: string;
  category?: string;
  lat?: number;
  lng?: number;
}): Promise<VetService[]> {
  const query = new URLSearchParams();
  if (params?.district) query.append('district', params.district);
  if (params?.category) query.append('category', params.category);
  if (params?.lat !== undefined) query.append('lat', String(params.lat));
  if (params?.lng !== undefined) query.append('lng', String(params.lng));

  const qs = query.toString();
  return apiRequest<VetService[]>(`/api/vets${qs ? `?${qs}` : ''}`);
}

export async function getVetById(id: number): Promise<VetService> {
  return apiRequest<VetService>(`/api/vets/${id}`);
}
