/**
 * Typed wrapper for the admin system-settings endpoint (/admin/settings).
 */
import api from './api';

export type SettingRow = { key: string; value: unknown };
/** Settings grouped by category. */
export type SettingsGrouped = Record<string, SettingRow[]>;

export const adminSettingsApi = {
  get: () => api.get<SettingsGrouped>('/admin/settings').then((r) => r.data),
  patch: (values: Record<string, unknown>) =>
    api
      .patch<SettingsGrouped>('/admin/settings', { values })
      .then((r) => r.data),
  create: (payload: { key: string; value: unknown; category: string }) =>
    api.post<SettingsGrouped>('/admin/settings', payload).then((r) => r.data),
  remove: (key: string) =>
    api
      .delete<SettingsGrouped>(`/admin/settings/${encodeURIComponent(key)}`)
      .then((r) => r.data),
};
