/**
 * Typed wrapper for the admin device fleet-health endpoint
 * (GET /admin/devices/health) — LoRaWAN uplink-derived health per device.
 */
import api from './api';

export type FleetDeviceStatus = 'online' | 'stale' | 'offline';

export type FleetDevice = {
  dev_eui: string;
  device_name: string;
  last_seen: string | null;
  battery_v: number | null;
  rssi: number | null;
  snr: number | null;
  uplinks_24h: number;
  status: FleetDeviceStatus;
};

export type FleetSummary = {
  total: number;
  online: number;
  stale: number;
  offline: number;
};

export type FleetHealth = {
  devices: FleetDevice[];
  summary: FleetSummary;
};

export const adminDeviceHealthApi = {
  health: () =>
    api.get<FleetHealth>('/admin/devices/health').then((r) => r.data),
};
