/**
 * Typed wrapper for the admin device/router registry (/devices).
 */
import api from './api';

export type DeviceType = 'dragon' | 'lora' | 'bivocom';

export type AdminDevice = {
  id: number;
  device_type: DeviceType;
  serial: string;
  name: string;
  user: string | null;
  zone: number | null;
  is_active: boolean;
  created_at: string | null;
};

export type AdminDeviceWritePayload = {
  device_type?: DeviceType;
  serial?: string;
  name?: string;
  username?: string;
  zone_id?: number | null;
  is_active?: boolean;
};

/** Attribute many devices to one account + zone in a single call. */
export type BulkAssignPayload = {
  device_ids: number[];
  username: string;
  zone_id: number;
};

export type BulkAssignResult = {
  assigned: number[];
  failed: { id: number; reason: string }[];
};

/** One sensor carried by a device: maps a wire tag → sensor_key + optional zone. */
export type DeviceSensor = {
  id: number;
  device: number;
  tag_name: string;
  sensor_key: string;
  zone: number | null;
  is_active: boolean;
  created_at: string | null;
};

export type DeviceSensorWritePayload = {
  tag_name?: string;
  sensor_key?: string;
  zone_id?: number | null;
  is_active?: boolean;
};

/** Entry from the sensor-key catalog (GET /sensors), for the sensor_key picker. */
export type SensorKeyCatalogEntry = {
  key: string;
  unit: string;
  label: string;
  type: string | null;
};

export const adminDeviceApi = {
  list: (username?: string) =>
    api
      .get<AdminDevice[]>('/devices', {
        params: username ? { username } : undefined,
      })
      .then((r) => r.data),

  create: (payload: AdminDeviceWritePayload) =>
    api.post<AdminDevice>('/devices', payload).then((r) => r.data),

  update: (id: number, payload: AdminDeviceWritePayload) =>
    api.patch<AdminDevice>(`/devices/${id}`, payload).then((r) => r.data),

  remove: (id: number) =>
    api.delete<void>(`/devices/${id}`).then((r) => r.data),

  bulkAssign: (payload: BulkAssignPayload) =>
    api
      .post<BulkAssignResult>('/devices/bulk-assign', payload)
      .then((r) => r.data),

  // --- Sensor attachments (/devices/{id}/sensors) ---------------------------
  sensors: {
    list: (deviceId: number) =>
      api
        .get<DeviceSensor[]>(`/devices/${deviceId}/sensors`)
        .then((r) => r.data),

    create: (deviceId: number, payload: DeviceSensorWritePayload) =>
      api
        .post<DeviceSensor>(`/devices/${deviceId}/sensors`, payload)
        .then((r) => r.data),

    update: (
      deviceId: number,
      sensorId: number,
      payload: DeviceSensorWritePayload
    ) =>
      api
        .patch<DeviceSensor>(
          `/devices/${deviceId}/sensors/${sensorId}`,
          payload
        )
        .then((r) => r.data),

    remove: (deviceId: number, sensorId: number) =>
      api
        .delete<void>(`/devices/${deviceId}/sensors/${sensorId}`)
        .then((r) => r.data),
  },

  /** Sensor-key catalog for the picker. */
  sensorKeyCatalog: () =>
    api
      .get<{ keys: SensorKeyCatalogEntry[] }>('/sensors')
      .then((r) => r.data.keys),
};
