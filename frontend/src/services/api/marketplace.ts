import { apiRequest } from './client';
import { MarketplaceListing, SavedAnimal } from '../../types';

export async function getListings(params?: {
  breed?: string;
  species?: string;
  min_price?: number;
  max_price?: number;
  district?: string;
  limit?: number;
  offset?: number;
}): Promise<MarketplaceListing[]> {
  const query = new URLSearchParams();
  if (params?.breed) query.append('breed', params.breed);
  if (params?.species) query.append('species', params.species);
  if (params?.min_price !== undefined) query.append('min_price', String(params.min_price));
  if (params?.max_price !== undefined) query.append('max_price', String(params.max_price));
  if (params?.district) query.append('district', params.district);
  if (params?.limit) query.append('limit', String(params.limit));
  if (params?.offset) query.append('offset', String(params.offset));

  const qs = query.toString();
  return apiRequest<MarketplaceListing[]>(`/api/listings${qs ? `?${qs}` : ''}`);
}

export async function getListingById(id: number): Promise<MarketplaceListing> {
  return apiRequest<MarketplaceListing>(`/api/listings/${id}`);
}

export async function createListing(payload: {
  animal_id: number;
  asking_price?: number;
  price?: number;
  negotiable?: number;
  title: string;
  description?: string;
  contact_phone?: string;
  district?: string;
  location_district?: string;
  location_state?: string;
}): Promise<MarketplaceListing> {
  const body = {
    animal_id: payload.animal_id,
    title: payload.title,
    price: payload.price !== undefined ? payload.price : (payload.asking_price || 0),
    description: payload.description,
    contact_phone: payload.contact_phone,
    district: payload.district || payload.location_district || 'Anand',
  };
  return apiRequest<MarketplaceListing>('/api/listings', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateListing(
  id: number,
  payload: Partial<MarketplaceListing>
): Promise<MarketplaceListing> {
  return apiRequest<MarketplaceListing>(`/api/listings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function getSavedListings(): Promise<SavedAnimal[]> {
  return apiRequest<SavedAnimal[]>('/api/saved');
}

export async function saveListing(listingId: number, notes?: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/api/saved/${listingId}`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });
}

export async function unsaveListing(listingId: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/api/saved/${listingId}`, {
    method: 'DELETE',
  });
}
