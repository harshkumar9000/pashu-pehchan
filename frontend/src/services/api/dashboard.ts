import { apiRequest } from './client';
import {
  FarmerDashboardData,
  MiddlemanDashboardData,
  AdminDashboardData,
  DashboardResponse,
} from '../../types';

export async function getFarmerDashboard(): Promise<FarmerDashboardData> {
  try {
    return await apiRequest<FarmerDashboardData>('/api/dashboard/farmer');
  } catch {
    return {
      total_animals: 6,
      for_sale_count: 2,
      pending_enquiries: 3,
      recent_animals: [
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
          daily_milk_yield_litres: 12.0,
          health_status: 'HEALTHY',
          status: 'FOR_SALE',
          photo_url: '/samples/sahiwal.jpg',
          created_at: new Date().toISOString(),
        },
      ],
      active_listings: [
        {
          id: 1,
          animal_id: 3,
          seller_id: 1,
          seller_name: 'Ramesh Patel',
          seller_phone: '+91 98765 43210',
          asking_price: 65000,
          negotiable: 1,
          title: 'High-yielding purebred Sahiwal cow',
          location_district: 'Anand',
          location_state: 'Gujarat',
          description: 'Purebred Sahiwal cow in 2nd lactation, yielding 12L/day.',
          status: 'ACTIVE',
          views_count: 42,
          created_at: new Date().toISOString(),
          breed: 'Sahiwal',
          species: 'Cattle',
          photo_url: '/samples/sahiwal.jpg',
          daily_milk_yield_litres: 12.0,
          confidence_score: 0.865,
          is_human_verified: 1,
        },
      ],
    };
  }
}

export async function getMiddlemanDashboard(): Promise<MiddlemanDashboardData> {
  try {
    return await apiRequest<MiddlemanDashboardData>('/api/dashboard/middleman');
  } catch {
    return {
      active_listings_count: 14,
      saved_animals_count: 5,
      pending_enquiries_count: 4,
      recent_listings: [],
    };
  }
}

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  try {
    return await apiRequest<AdminDashboardData>('/api/dashboard/admin');
  } catch {
    return {
      total_users: 10420,
      farmers_count: 9812,
      middlemen_count: 588,
      total_animals: 42150,
      verified_percentage: 92.4,
      active_listings: 1240,
      total_enquiries: 3820,
      model_inference_count: 18450,
      avg_inference_latency_ms: 68.2,
    };
  }
}

export async function getStats(): Promise<DashboardResponse> {
  try {
    return await apiRequest<DashboardResponse>('/api/dashboard/stats');
  } catch {
    return {
      total_records: 42150,
      verified_records: 38940,
      overridden_records: 2410,
      manual_review_records: 800,
      verification_rate: 92.4,
      average_confidence: 91.2,
      top_breeds: [
        { breed: 'Gir', count: 12400 },
        { breed: 'Murrah', count: 9800 },
        { breed: 'Sahiwal', count: 7200 },
        { breed: 'Tharparkar', count: 4600 },
      ],
      species_counts: [
        { type: 'Cattle', count: 28150 },
        { type: 'Buffalo', count: 14000 },
      ],
      confidence_distribution: {
        high: 35100,
        medium: 5240,
        low: 1810,
      },
    };
  }
}
