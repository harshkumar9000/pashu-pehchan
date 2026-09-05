import { apiRequest } from './client';
import { Enquiry } from '../../types';

export async function getEnquiries(): Promise<Enquiry[]> {
  return apiRequest<Enquiry[]>('/api/enquiries');
}

export async function createEnquiry(payload: {
  listing_id: number;
  message: string;
  offered_price?: number;
}): Promise<Enquiry> {
  return apiRequest<Enquiry>('/api/enquiries', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateEnquiryStatus(
  id: number,
  status: 'ACCEPTED' | 'REJECTED'
): Promise<Enquiry> {
  return apiRequest<Enquiry>(`/api/enquiries/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}
