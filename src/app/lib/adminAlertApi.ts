/**
 * Typed wrapper for admin alert override endpoints.
 */
import api from './api';

export type AdminAlertRow = {
  id: number;
  name: string;
  type: string;
  description: string;
  condition: string;
  condition_nbr: string;
  sensor_key: string;
  zone: number | null;
  is_active: boolean;
  last_triggered_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  user: number | null;
};

/** A global-console alert row: the override row + the owner's username. */
export type AlertConsoleRow = AdminAlertRow & { username: string | null };

export type AlertCreatePayload = {
  username: string;
  name: string;
  type: string;
  condition: string;
  condition_nbr: number;
  sensor_key?: string;
  description?: string;
  zone_id?: number | null;
  is_active?: boolean;
};

export type AlertConsoleFilters = {
  username?: string;
  type?: string;
  sensor_key?: string;
  is_active?: boolean;
  zone_id?: number;
};

export type AlertAnalytics = {
  total: number;
  active: number;
  inactive: number;
  triggered_ever: number;
  by_type: { type: string; count: number }[];
  by_sensor: { sensor_key: string; count: number }[];
  recently_triggered: AlertConsoleRow[];
};

const unwrap = <T>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (
    data &&
    typeof data === 'object' &&
    Array.isArray((data as Record<string, unknown>).results)
  ) {
    return (data as { results: T[] }).results;
  }
  return [];
};

export const adminAlertApi = {
  listForUser: async (username: string): Promise<AdminAlertRow[]> => {
    const res = await api.get(`/users/${encodeURIComponent(username)}/alerts`);
    return unwrap<AdminAlertRow>(res.data);
  },
  /** Cross-user alert list with optional filters (admin console). */
  listAll: async (
    filters: AlertConsoleFilters = {}
  ): Promise<AlertConsoleRow[]> => {
    const params: Record<string, string | number | boolean> = {};
    if (filters.username) params.username = filters.username;
    if (filters.type) params.type = filters.type;
    if (filters.sensor_key) params.sensor_key = filters.sensor_key;
    if (filters.is_active !== undefined) params.is_active = filters.is_active;
    if (filters.zone_id !== undefined) params.zone_id = filters.zone_id;
    const res = await api.get('/admin/alerts', { params });
    return unwrap<AlertConsoleRow>(res.data);
  },
  analytics: async (): Promise<AlertAnalytics> => {
    const res = await api.get<AlertAnalytics>('/admin/alert-analytics');
    return res.data;
  },
  setActive: async (pk: number, isActive: boolean): Promise<AdminAlertRow> => {
    const res = await api.patch<AdminAlertRow>(`/admin/alerts/${pk}`, {
      is_active: isActive,
    });
    return res.data;
  },
  remove: async (pk: number): Promise<void> => {
    await api.delete(`/admin/alerts/${pk}`);
  },
  create: async (payload: AlertCreatePayload): Promise<AlertConsoleRow> => {
    const res = await api.post<AlertConsoleRow>('/admin/alerts', payload);
    return res.data;
  },
};
