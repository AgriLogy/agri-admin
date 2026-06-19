/**
 * Typed wrapper for the global admin crop-calendar (Kc) endpoints
 * (/admin/kc). Staff-only cross-user management; the owner-facing /kc router
 * stays caller-scoped.
 */
import api from './api';

export type KcPeriod = {
  id?: number;
  period_name: string;
  start_date: string;
  end_date: string;
  kc_value: number;
};

export type KcRow = {
  id: number;
  username: string | null;
  name: string;
  plant_name: string;
  zone_id: number | null;
  zone_name: string | null;
  number_of_periods: number;
  periods: KcPeriod[];
};

export type KcCreatePayload = {
  username: string;
  name: string;
  plant_name: string;
  zone_id?: number | null;
  periods: KcPeriod[];
};

export type KcUpdatePayload = Omit<KcCreatePayload, 'username'>;

export const adminKcApi = {
  list: (filters?: { username?: string; zone_id?: number }) =>
    api.get<KcRow[]>('/admin/kc', { params: filters }).then((r) => r.data),
  create: (payload: KcCreatePayload) =>
    api.post<KcRow>('/admin/kc', payload).then((r) => r.data),
  update: (id: number, payload: KcUpdatePayload) =>
    api.put<KcRow>(`/admin/kc/${id}`, payload).then((r) => r.data),
  remove: (id: number) =>
    api.delete(`/admin/kc/${id}`).then((r) => r.data),
};
