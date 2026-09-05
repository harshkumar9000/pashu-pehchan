import { apiRequest } from './client';
import { VetService } from '../../types';

export const FALLBACK_VETS: VetService[] = [
  {
    id: 1,
    name: 'District Veterinary Polyclinic & Hospital',
    category: 'GOVERNMENT_HOSPITAL',
    address: 'Near Dairy Circle, Anand-Vidyanagar Road',
    district: 'Anand',
    state: 'Gujarat',
    phone: '+91 2692 261400',
    emergency_phone: '+91 98250 11223',
    latitude: 22.5645,
    longitude: 72.9289,
    is_emergency_24x7: 1,
  },
  {
    id: 2,
    name: 'National Dairy Research Institute (NDRI) Vet Clinic',
    category: 'SPECIALIST',
    address: 'GT Road, Near Model Town',
    district: 'Karnal',
    state: 'Haryana',
    phone: '+91 184 2259002',
    emergency_phone: '+91 94160 55667',
    latitude: 29.6857,
    longitude: 76.9905,
    is_emergency_24x7: 1,
  },
  {
    id: 3,
    name: 'Pashu Aarogya Kendra (Mobile AI Unit)',
    category: 'MOBILE_VET',
    address: 'Station Road, Mathura Rural Circle',
    district: 'Mathura',
    state: 'Uttar Pradesh',
    phone: '+91 98370 99881',
    latitude: 27.4924,
    longitude: 77.6737,
    is_emergency_24x7: 0,
  },
];

export async function getVets(params?: {
  district?: string;
  category?: string;
  lat?: number;
  lng?: number;
}): Promise<VetService[]> {
  try {
    const query = new URLSearchParams();
    if (params?.district) query.append('district', params.district);
    if (params?.category) query.append('category', params.category);
    if (params?.lat !== undefined) query.append('lat', String(params.lat));
    if (params?.lng !== undefined) query.append('lng', String(params.lng));

    const qs = query.toString();
    const data = await apiRequest<VetService[]>(`/api/vets${qs ? `?${qs}` : ''}`);
    if (Array.isArray(data) && data.length > 0) return data;
    return FALLBACK_VETS;
  } catch {
    return FALLBACK_VETS;
  }
}

export async function getVetById(id: number): Promise<VetService> {
  try {
    return await apiRequest<VetService>(`/api/vets/${id}`);
  } catch {
    const found = FALLBACK_VETS.find((v) => v.id === id);
    return found || FALLBACK_VETS[0];
  }
}
