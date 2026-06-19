/**
 * Typed wrapper for the admin sensor-data explorer (/admin/sensor-data/*).
 * Generic browse / correct / range-delete over the 45 sensor reading models.
 */
import api from './api';

export type SensorCatalogEntry = { slug: string; label: string };

export type SensorReading = {
  id: number;
  value: number | null;
  timestamp: string | null;
  zone_id: number | null;
  username: string | null;
};

export type SensorReadingsResponse = {
  sensor: string;
  count: number;
  rows: SensorReading[];
};

export type SensorDataFilters = {
  sensor: string;
  username?: string;
  zone_id?: number;
  from?: string;
  to?: string;
  limit?: number;
};

export const adminSensorDataApi = {
  catalog: () =>
    api
      .get<{ sensors: SensorCatalogEntry[] }>('/admin/sensor-data/catalog')
      .then((r) => r.data.sensors),

  list: (filters: SensorDataFilters) =>
    api
      .get<SensorReadingsResponse>('/admin/sensor-data', { params: filters })
      .then((r) => r.data),

  patch: (sensor: string, id: number, value: number | null) =>
    api
      .patch<SensorReading>(`/admin/sensor-data/${sensor}/${id}`, { value })
      .then((r) => r.data),

  remove: (sensor: string, id: number) =>
    api.delete(`/admin/sensor-data/${sensor}/${id}`).then((r) => r.data),

  removeRange: (
    sensor: string,
    params: { zone_id: number; from?: string; to?: string; username?: string }
  ) =>
    api
      .delete<{ status: string; deleted: number }>(
        `/admin/sensor-data/${sensor}`,
        { params }
      )
      .then((r) => r.data),
};
