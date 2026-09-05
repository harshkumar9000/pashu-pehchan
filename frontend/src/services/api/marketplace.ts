import { apiRequest } from './client';
import { MarketplaceListing, SavedAnimal } from '../../types';

export const FALLBACK_LISTINGS: MarketplaceListing[] = [
  {
    id: 101,
    animal_id: 1,
    seller_id: 1,
    asking_price: 65000,
    negotiable: 1,
    title: 'High-Yield Pure Gir Cow (3rd Lactation)',
    description: 'Pedigree Gir cow from Anand district. 15 Litres/day verified yield, gentle temperament.',
    location_district: 'Anand',
    location_state: 'Gujarat',
    status: 'ACTIVE',
    views_count: 142,
    created_at: new Date().toISOString(),
    breed: 'Gir',
    species: 'Cattle',
    photo_url: '/samples/gir.jpg',
    daily_milk_yield_litres: 15,
    age_months: 38,
    confidence_score: 0.94,
    is_human_verified: 1,
    seller_name: 'Ramesh Patel',
    seller_phone: '+91 98765 43210',
  },
  {
    id: 102,
    animal_id: 2,
    seller_id: 1,
    asking_price: 85000,
    negotiable: 1,
    title: 'Champion Murrah Buffalo (18 L/Day Yield)',
    description: 'Top-quality Murrah dairy buffalo with curled horns, vaccinated, high fat milk production.',
    location_district: 'Rohtak',
    location_state: 'Haryana',
    status: 'ACTIVE',
    views_count: 218,
    created_at: new Date().toISOString(),
    breed: 'Murrah',
    species: 'Buffalo',
    photo_url: '/samples/murrah.jpg',
    daily_milk_yield_litres: 18,
    age_months: 44,
    confidence_score: 0.91,
    is_human_verified: 1,
    seller_name: 'Kishore Verma',
    seller_phone: '+91 98111 22334',
  },
  {
    id: 103,
    animal_id: 3,
    seller_id: 2,
    asking_price: 58000,
    negotiable: 0,
    title: 'Healthy Sahiwal Cow (1st Lactation)',
    description: 'Young Sahiwal heifer ready for dairy farming. Excellent heat tolerance and tick resistance.',
    location_district: 'Mathura',
    location_state: 'Uttar Pradesh',
    status: 'ACTIVE',
    views_count: 95,
    created_at: new Date().toISOString(),
    breed: 'Sahiwal',
    species: 'Cattle',
    photo_url: '/samples/sahiwal.jpg',
    daily_milk_yield_litres: 12,
    age_months: 29,
    confidence_score: 0.88,
    is_human_verified: 1,
    seller_name: 'Dinesh Kumar',
    seller_phone: '+91 98333 44556',
  },
];

export async function getListings(params?: {
  breed?: string;
  species?: string;
  min_price?: number;
  max_price?: number;
  district?: string;
  limit?: number;
  offset?: number;
}): Promise<MarketplaceListing[]> {
  try {
    const query = new URLSearchParams();
    if (params?.breed) query.append('breed', params.breed);
    if (params?.species) query.append('species', params.species);
    if (params?.min_price !== undefined) query.append('min_price', String(params.min_price));
    if (params?.max_price !== undefined) query.append('max_price', String(params.max_price));
    if (params?.district) query.append('district', params.district);
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.offset) query.append('offset', String(params.offset));

    const qs = query.toString();
    const data = await apiRequest<MarketplaceListing[]>(`/api/listings${qs ? `?${qs}` : ''}`);
    if (Array.isArray(data) && data.length > 0) return data;
    return FALLBACK_LISTINGS;
  } catch {
    return FALLBACK_LISTINGS;
  }
}

export async function getListingById(id: number): Promise<MarketplaceListing> {
  try {
    return await apiRequest<MarketplaceListing>(`/api/listings/${id}`);
  } catch {
    const found = FALLBACK_LISTINGS.find((l) => l.id === id);
    return found || FALLBACK_LISTINGS[0];
  }
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
