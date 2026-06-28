'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  App,
  Button,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
} from 'antd';
import {
  adminDeviceApi,
  type AdminDevice,
  type DeviceSensor,
  type DeviceSensorWritePayload,
  type SensorKeyCatalogEntry,
} from '@/app/lib/adminDeviceApi';
import { adminZoneApi, type AdminZone } from '@/app/lib/adminZoneApi';

type FormValues = {
  tag_name: string;
  sensor_key: string;
  zone_id?: number | null;
  is_active: boolean;
};

type Props = {
  device: AdminDevice | null;
  open: boolean;
  onClose: () => void;
};

/**
 * Manage the sensors a router carries: each row maps the device's wire tag
 * (e.g. a Bivocom Modbus tag) to a sensor_key + farm zone, so the ingest can
 * route the device's readings with no per-device code.
 */
const DeviceSensorsDrawer: React.FC<Props> = ({ device, open, onClose }) => {
  const t = useTranslations();
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [sensors, setSensors] = useState<DeviceSensor[]>([]);
  const [catalog, setCatalog] = useState<SensorKeyCatalogEntry[]>([]);
  const [zones, setZones] = useState<AdminZone[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<DeviceSensor | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(() => {
    if (!device) return;
    setLoading(true);
    adminDeviceApi.sensors
      .list(device.id)
      .then(setSensors)
      .catch(() => message.error(t('admin.devices.sensors.loadError')))
      .finally(() => setLoading(false));
  }, [device, message, t]);

  useEffect(() => {
    if (!open || !device) return;
    refresh();
    adminDeviceApi
      .sensorKeyCatalog()
      .then(setCatalog)
      .catch(() => setCatalog([]));
    if (device.user) {
      adminZoneApi
        .list(device.user)
        .then(setZones)
        .catch(() => setZones([]));
    } else {
      setZones([]);
    }
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ is_active: true });
  }, [open, device, refresh, form]);

  const startEdit = (s: DeviceSensor) => {
    setEditing(s);
    form.setFieldsValue({
      tag_name: s.tag_name,
      sensor_key: s.sensor_key,
      zone_id: s.zone,
      is_active: s.is_active,
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ is_active: true });
  };

  const submit = async (values: FormValues) => {
    if (!device) return;
    setSubmitting(true);
    const payload: DeviceSensorWritePayload = {
      tag_name: values.tag_name.trim(),
      sensor_key: values.sensor_key,
      zone_id: values.zone_id ?? null,
      is_active: values.is_active,
    };
    try {
      if (editing) {
        await adminDeviceApi.sensors.update(device.id, editing.id, payload);
        message.success(t('admin.devices.sensors.updated'));
      } else {
        await adminDeviceApi.sensors.create(device.id, payload);
        message.success(t('admin.devices.sensors.added'));
      }
      cancelEdit();
      refresh();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      message.error(detail || t('admin.devices.sensors.saveError'));
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (s: DeviceSensor) => {
    if (!device) return;
    try {
      await adminDeviceApi.sensors.remove(device.id, s.id);
      message.success(t('admin.devices.sensors.deleted'));
      if (editing?.id === s.id) cancelEdit();
      refresh();
    } catch {
      message.error(t('admin.devices.sensors.saveError'));
    }
  };

  const keyLabel = (key: string) => {
    const meta = catalog.find((c) => c.key === key);
    return meta ? `${meta.label} (${key})` : key;
  };

  const columns = [
    { title: t('admin.devices.sensors.tag'), dataIndex: 'tag_name' },
    {
      title: t('admin.devices.sensors.sensorKey'),
      dataIndex: 'sensor_key',
      render: (v: string) => keyLabel(v),
    },
    {
      title: t('admin.devices.sensors.zone'),
      dataIndex: 'zone',
      render: (z: number | null) =>
        z ?? <em>{t('admin.devices.sensors.inheritZone')}</em>,
    },
    {
      title: t('admin.devices.col.status'),
      dataIndex: 'is_active',
      render: (a: boolean) => (
        <Tag color={a ? 'green' : 'red'}>
          {a ? t('admin.devices.active') : t('admin.devices.inactive')}
        </Tag>
      ),
    },
    {
      title: t('admin.devices.col.actions'),
      key: 'actions',
      render: (_: unknown, row: DeviceSensor) => (
        <Space>
          <Button size="small" onClick={() => startEdit(row)}>
            {t('admin.devices.edit')}
          </Button>
          <Popconfirm
            title={t('admin.devices.sensors.confirmDelete')}
            onConfirm={() => remove(row)}
          >
            <Button size="small" danger>
              {t('admin.devices.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Drawer
      title={
        device
          ? t('admin.devices.sensors.title', { serial: device.serial })
          : ''
      }
      open={open}
      onClose={onClose}
      width={680}
      destroyOnHidden
    >
      <Table
        size="small"
        rowKey="id"
        loading={loading}
        dataSource={sensors}
        columns={columns}
        pagination={false}
        style={{ marginBottom: 20 }}
      />

      <h4>
        {editing
          ? t('admin.devices.sensors.editHeading')
          : t('admin.devices.sensors.addHeading')}
      </h4>
      <Form<FormValues> form={form} layout="vertical" onFinish={submit}>
        <Form.Item
          name="tag_name"
          label={t('admin.devices.sensors.tag')}
          rules={[{ required: true }]}
        >
          <Input placeholder={t('admin.devices.sensors.tagPlaceholder')} />
        </Form.Item>
        <Form.Item
          name="sensor_key"
          label={t('admin.devices.sensors.sensorKey')}
          rules={[{ required: true }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            placeholder={t('admin.devices.sensors.sensorKeyPlaceholder')}
            options={catalog.map((c) => ({
              value: c.key,
              label: `${c.label} (${c.key})`,
            }))}
          />
        </Form.Item>
        <Form.Item
          name="zone_id"
          label={t('admin.devices.sensors.zone')}
          tooltip={t('admin.devices.sensors.zoneHint')}
        >
          <Select
            allowClear
            placeholder={t('admin.devices.sensors.inheritZone')}
            options={zones.map((z) => ({
              value: z.id,
              label: `${z.name} (#${z.id})`,
            }))}
          />
        </Form.Item>
        <Form.Item
          name="is_active"
          label={t('admin.devices.activeLabel')}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
        <Space>
          <Button
            type="primary"
            loading={submitting}
            onClick={() => form.submit()}
          >
            {editing
              ? t('admin.devices.update')
              : t('admin.devices.sensors.add')}
          </Button>
          {editing && (
            <Button onClick={cancelEdit} disabled={submitting}>
              {t('admin.devices.cancel')}
            </Button>
          )}
        </Space>
      </Form>
    </Drawer>
  );
};

export default DeviceSensorsDrawer;
