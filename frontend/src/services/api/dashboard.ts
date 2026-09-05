import { apiRequest } from './client';
import {
  FarmerDashboardData,
  MiddlemanDashboardData,
  AdminDashboardData,
  DashboardResponse,
} from '../../types';

export async function getFarmerDashboard(): Promise<FarmerDashboardData> {
  return apiRequest<FarmerDashboardData>('/api/dashboard/farmer');
}

export async function getMiddlemanDashboard(): Promise<MiddlemanDashboardData> {
  return apiRequest<MiddlemanDashboardData>('/api/dashboard/middleman');
}

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  return apiRequest<AdminDashboardData>('/api/dashboard/admin');
}

export async function getStats(): Promise<DashboardResponse> {
  return apiRequest<DashboardResponse>('/api/dashboard/stats');
}
