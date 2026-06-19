/**
 * Typed wrapper for the admin business-analytics endpoint (GET /admin/analytics).
 * Read-only aggregates for the dashboard charts — no new backend table.
 */
import api from './api';

export type Analytics = {
  /** payement_status → customer count (e.g. { actif, suspended }). */
  payment_status: Record<string, number>;
  signups_by_week: { week: string; count: number }[];
  active_users: number;
  inactive_users: number;
  /** Bucketed zones-per-customer ("0" | "1" | "2-3" | "4+"). */
  zones_per_user: Record<string, number>;
  alerts_by_type: { type: string; count: number }[];
  devices: { total: number; stale: number; online: number };
};

export const adminAnalyticsApi = {
  get: async (): Promise<Analytics> => {
    const res = await api.get<Analytics>('/admin/analytics');
    return res.data;
  },
};
