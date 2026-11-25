/**
 * Typed wrapper for the weather-station exposure endpoints
 * (agri-api /admin/monitoring/stations): is each station measuring the field
 * (outdoors) or sitting sheltered / indoors, and where is it declared to be.
 */
import api from './api';

export type Placement = 'auto' | 'outdoor' | 'indoor';
export type Detected = 'outdoor' | 'indoor' | 'uncertain' | 'unknown';
export type SensorVerdict = 'ok' | 'sheltered' | 'not_checked';
export type SensorKey = 'solar' | 'wind' | 'temperature';
export type ExposureStatus =
  | 'ok'
  | 'suspect'
  | 'sheltered'
  | 'insufficient_data'
  | 'no_location'
  | 'no_reference'
  | 'no_readings';

export type ExposureSignal = {
  code: 'no_sun' | 'no_wind' | 'damped_temperature' | 'warm_nights';
  detail: Record<string, number>;
};

export type ExposureReport = {
  device_id: number;
  device: string;
  checked_at: string;
  window_hours: number;
  status: ExposureStatus;
  hours_compared: number;
  signals: ExposureSignal[];
  checked?: string[];
  sensors?: Partial<Record<SensorKey, SensorVerdict>>;
  placement?: Placement;
  detected?: Detected;
  mismatch?: boolean;
};

export type StationRow = {
  device_id: number;
  device: string;
  serial: string | null;
  zone_id: number | null;
  user_id: number | null;
  username: string | null;
  placement: Placement;
  placement_updated_at: string | null;
  placement_updated_by: string | null;
  last_reading: string | null;
  report: ExposureReport | null;
};

export type StationsResponse = {
  stations: StationRow[];
  placements: Placement[];
  window_hours: number;
};

export const SENSOR_KEYS: SensorKey[] = ['solar', 'wind', 'temperature'];

/** Counts for the summary cards. */
export const summarizeStations = (rows: StationRow[]) => ({
  total: rows.length,
  sheltered: rows.filter((r) => r.report?.detected === 'indoor').length,
  mismatch: rows.filter((r) => r.report?.mismatch).length,
  declaredIndoor: rows.filter((r) => r.placement === 'indoor').length,
});

export const adminStationsApi = {
  list: () =>
    api.get<StationsResponse>('/admin/monitoring/stations').then((r) => r.data),
  setPlacement: (deviceId: number, placement: Placement) =>
    api
      .put<{
        device_id: number;
        placement: Placement;
        updated_at: string;
        updated_by: string;
      }>(`/admin/monitoring/stations/${deviceId}/placement`, { placement })
      .then((r) => r.data),
  checkNow: (deviceId: number) =>
    api
      .post<ExposureReport>(`/admin/monitoring/stations/${deviceId}/check`)
      .then((r) => r.data),
};
