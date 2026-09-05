import { apiRequest } from './client';
import { NotificationItem } from '../../types';

export async function getNotifications(): Promise<NotificationItem[]> {
  return apiRequest<NotificationItem[]>('/api/notifications');
}

export async function markNotificationAsRead(id: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/api/notifications/${id}/read`, {
    method: 'PUT',
  });
}
