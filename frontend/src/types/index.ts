export type AnimalType = 'Cattle' | 'Buffalo';
export type ConfidenceTier = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
export type VerificationStatus = 'Human Verified' | 'Overridden' | 'Manual Review';
export type UserRole = 'FARMER' | 'MIDDLEMAN' | 'ADMIN';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  district?: string;
  state?: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface AnimalRecord {
  id: number;
  farmer_id: number;
  tag_number?: string;
  species: 'Cattle' | 'Buffalo';
  breed: string;
  predicted_breed?: string;
  confidence_score?: number;
  is_human_verified: number;
  age_months?: number;
  lactation_cycle?: number;
  daily_milk_yield_litres?: number;
  photo_url?: string;
  health_status: string;
  status: 'IN_HERD' | 'FOR_SALE' | 'SOLD';
  created_at: string;
}

export interface MarketplaceListing {
  id: number;
  animal_id: number;
  seller_id: number;
  asking_price: number;
  negotiable: number;
  title: string;
  description?: string;
  location_district?: string;
  location_state?: string;
  status: 'ACTIVE' | 'PENDING' | 'SOLD';
  views_count: number;
  created_at: string;
  // Joined fields
  breed?: string;
  species?: string;
  photo_url?: string;
  daily_milk_yield_litres?: number;
  age_months?: number;
  confidence_score?: number;
  is_human_verified?: number;
  seller_name?: string;
  seller_phone?: string;
  is_saved?: boolean;
}

export interface SavedAnimal {
  id: number;
  user_id: number;
  listing_id: number;
  notes?: string;
  created_at: string;
  listing?: MarketplaceListing;
}

export interface Enquiry {
  id: number;
  listing_id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  offered_price?: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  created_at: string;
  listing_title?: string;
  sender_name?: string;
  sender_phone?: string;
  receiver_name?: string;
}

export interface VetService {
  id: number;
  name: string;
  category: string;
  address: string;
  district: string;
  state: string;
  phone: string;
  emergency_phone?: string;
  latitude: number;
  longitude: number;
  is_emergency_24x7: number;
  distance_km?: number;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  body: string;
  notification_type: string;
  is_read: number;
  created_at: string;
}

export interface FarmerDashboardData {
  total_animals: number;
  for_sale_count: number;
  pending_enquiries: number;
  recent_animals: AnimalRecord[];
  active_listings: MarketplaceListing[];
}

export interface MiddlemanDashboardData {
  active_listings_count: number;
  saved_animals_count: number;
  pending_enquiries_count: number;
  recent_listings: MarketplaceListing[];
}

export interface AdminDashboardData {
  total_users: number;
  farmers_count: number;
  middlemen_count: number;
  total_animals: number;
  verified_percentage: number;
  active_listings: number;
  total_enquiries: number;
  model_inference_count: number;
  avg_inference_latency_ms: number;
}

export interface PredictionItem {
  breed: string;
  confidence: number;
  percentage: number;
  animal_type: AnimalType;
}

export interface TopPrediction {
  breed: string;
  confidence: number;
  animal_type: AnimalType;
}

export interface PredictResponse {
  status: string;
  predictions: PredictionItem[];
  top_prediction: TopPrediction;
  confidence_level: ConfidenceTier;
  recommendation: string;
  model_version: string;
  architecture: string;
  animal_type: AnimalType;
  device: string;
  inference_time_ms: number;
}

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
  model_version: string;
  classes: number;
  device: string;
  architecture: string;
  top1_accuracy?: number;
  top3_accuracy?: number;
  macro_f1?: number;
}

export interface BreedItem {
  breed: string;
  display_name: string;
  animal_type: AnimalType;
  region?: string;
  characteristics?: string;
  purpose?: string;
  horn_type?: string;
  coat_color?: string;
}

export interface RecordCreate {
  predicted_breed: string;
  predicted_confidence: number;
  verified_breed: string;
  verification_status: VerificationStatus;
  animal_identifier?: string;
  animal_type?: AnimalType;
  notes?: string;
  model_version?: string;
  top3_data?: any[];
  inference_time_ms?: number;
}

export interface RecordResponse {
  id: number;
  animal_identifier?: string;
  animal_type: AnimalType;
  predicted_breed: string;
  predicted_confidence: number;
  verified_breed: string;
  verification_status: VerificationStatus;
  notes?: string;
  model_version: string;
  is_demo: number;
  created_at: string;
}

export interface DashboardResponse {
  total_records: number;
  verified_records: number;
  overridden_records: number;
  manual_review_records: number;
  verification_rate: number;
  average_confidence: number;
  top_breeds: { breed: string; count: number }[];
  species_counts: { type: string; count: number }[];
  confidence_distribution: {
    high: number;
    medium: number;
    low: number;
  };
}

export type ScreenName =
  | 'home'
  | 'scan'
  | 'results'
  | 'verify'
  | 'history'
  | 'library'
  | 'breeds'
  | 'dashboard'
  | 'system_info'
  | 'my_livestock'
  | 'animal_detail'
  | 'add_animal'
  | 'farmer_marketplace'
  | 'farmer_enquiries'
  | 'middleman_home'
  | 'middleman_marketplace'
  | 'marketplace'
  | 'listing_detail'
  | 'saved_animals'
  | 'compare_animals'
  | 'middleman_enquiries'
  | 'vets'
  | 'admin'
  | 'login'
  | 'register';
