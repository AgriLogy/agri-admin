'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  App,
  Button,
  Checkbox,
  Drawer,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
} from 'antd';
import { PageInfoBar } from '@/app/components/layout/PageInfoBar';
import {
  adminDeviceApi,
  type AdminDevice,
  type AdminDeviceWritePayload,
  type DeviceType,
} from '@/app/lib/adminDeviceApi';
import { adminZoneApi, type AdminZone } from '@/app/lib/adminZoneApi';
import { adminUserApi } from '@/app/lib/adminUserApi';
import DeviceSensorsDrawer from '@/app/components/admin/DeviceSensorsDrawer';

const DEVICE_TYPES: DeviceType[] = ['dragon', 'lora', 'bivocom'];

type FormValues = {
  device_type: DeviceType;
  serial: string;
  name?: string;
  username: string;
  zone_id?: number | null;
  is_active: boolean;
  backfill?: boolean;
};

/**
 * Searchable account picker (reused by the register drawer + the bulk-assign
 * modal). Queries GET /users?search= with a small debounce; keeps the current
 * value selectable even before it appears in a search result.
 */
const AccountSelect: React.FC<{
  value?: string;
  onChange?: (value?: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder }) => {
  const [options, setOptions] = useState<{ value: string; label: string }[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = (q: string) => {
    setLoading(true);
    adminUserApi
      .list(q || undefined)
      .then((rows) =>
        setOptions(
          rows.map((u) => {
            const full = `${u.firstname} ${u.lastname}`.trim();
            return {
              value: u.username,
              label: full ? `${u.username} — ${full}` : u.username,
            };
          })
        )
      )
      .catch(() => setOptions([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    doSearch('');
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onSearch = (q: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => doSearch(q), 300);
  };

  const merged =
    value && !options.some((o) => o.value === value)
      ? [{ value, label: value }, ...options]
      : options;

  return (
    <Select
      showSearch
      allowClear
      style={{ width: '100%' }}
      value={value}
      placeholder={placeholder}
      filterOption={false}
      onSearch={onSearch}
      onChange={onChange}
      loading={loading}
      options={merged}
      notFoundContent={loading ? <Spin size="small" /> : null}
    />
  );
};

const DevicesMain: React.FC = () => {
  const t = useTranslations();
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [devices, setDevices] = useState<AdminDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<AdminDevice | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [zones, setZones] = useState<AdminZone[]>([]);
  const [sensorsDevice, setSensorsDevice] = useState<AdminDevice | null>(null);

  // Multi-select bulk attribution.
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignUsername, setAssignUsername] = useState<string | undefined>();
  const [assignZones, setAssignZones] = useState<AdminZone[]>([]);
  const [assignZoneId, setAssignZoneId] = useState<number | undefined>();
  const [assignBackfill, setAssignBackfill] = useState(false);
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  const refresh = () => {
    setLoading(true);
    adminDeviceApi
      .list()
      .then(setDevices)
      .catch(() => message.error(t('admin.devices.loadError')))
      .finally(() => setLoading(false));
  };

  useEffect(refresh, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadZonesFor = (username?: string) => {
    if (!username) {
      setZones([]);
      return;
    }
    adminZoneApi
      .list(username)
      .then(setZones)
      .catch(() => setZones([]));
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ device_type: 'lora', is_active: true });
    setZones([]);
    setDrawerOpen(true);
  };

  const openEdit = (d: AdminDevice) => {
    setEditing(d);
    form.setFieldsValue({
      device_type: d.device_type,
      serial: d.serial,
      name: d.name,
      username: d.user ?? '',
      zone_id: d.zone,
      is_active: d.is_active,
      backfill: false,
    });
    loadZonesFor(d.user ?? undefined);
    setDrawerOpen(true);
  };

  const submit = async (values: FormValues) => {
    setSubmitting(true);
    const payload: AdminDeviceWritePayload = {
      device_type: values.device_type,
      serial: values.serial.trim(),
      name: (values.name ?? '').trim(),
      username: values.username.trim(),
      zone_id: values.zone_id ?? null,
      is_active: values.is_active,
    };
    try {
      if (editing) {
        await adminDeviceApi.update(editing.id, {
          ...payload,
          backfill: values.backfill ?? false,
        });
        message.success(t('admin.devices.updated'));
      } else {
        await adminDeviceApi.create(payload);
        message.success(t('admin.devices.created'));
      }
      setDrawerOpen(false);
      refresh();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      message.error(detail || t('admin.devices.saveError'));
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: number) => {
    try {
      await adminDeviceApi.remove(id);
      message.success(t('admin.devices.deleted'));
      refresh();
    } catch {
      message.error(t('admin.devices.saveError'));
    }
  };

  const openAssign = () => {
    setAssignUsername(undefined);
    setAssignZones([]);
    setAssignZoneId(undefined);
    setAssignBackfill(false);
    setAssignOpen(true);
  };

  const onAssignAccountChange = (username?: string) => {
    setAssignUsername(username);
    setAssignZoneId(undefined);
    if (username) {
      adminZoneApi
        .list(username)
        .then(setAssignZones)
        .catch(() => setAssignZones([]));
    } else {
      setAssignZones([]);
    }
  };

  const submitAssign = async () => {
    if (!assignUsername || assignZoneId == null) {
      message.warning(t('admin.devices.assign.needAccountZone'));
      return;
    }
    setAssignSubmitting(true);
    try {
      const res = await adminDeviceApi.bulkAssign({
        device_ids: selectedRowKeys.map(Number),
        username: assignUsername,
        zone_id: assignZoneId,
        backfill: assignBackfill,
      });
      message.success(
        t('admin.devices.assign.success', {
          assigned: res.assigned.length,
          failed: res.failed.length,
        })
      );
      setAssignOpen(false);
      setSelectedRowKeys([]);
      refresh();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      message.error(detail || t('admin.devices.assign.error'));
    } finally {
      setAssignSubmitting(false);
    }
  };

  const columns = [
    {
      title: t('admin.devices.col.type'),
      dataIndex: 'device_type',
      render: (v: DeviceType) => <Tag color="blue">{v}</Tag>,
    },
    { title: t('admin.devices.col.serial'), dataIndex: 'serial' },
    { title: t('admin.devices.col.name'), dataIndex: 'name' },
    { title: t('admin.devices.col.owner'), dataIndex: 'user' },
    {
      title: t('admin.devices.col.zone'),
      dataIndex: 'zone',
      render: (z: number | null) => z ?? '—',
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
      render: (_: unknown, row: AdminDevice) => (
        <Space>
          <Button size="small" onClick={() => setSensorsDevice(row)}>
            {t('admin.devices.sensors.manage')}
          </Button>
          <Button size="small" onClick={() => openEdit(row)}>
            {t('admin.devices.edit')}
          </Button>
          <Popconfirm
            title={t('admin.devices.confirmDelete')}
            onConfirm={() => remove(row.id)}
          >
            <Button size="small" danger>
              {t('admin.devices.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const dataSource = unassignedOnly
    ? devices.filter((d) => d.zone === null)
    : devices;

  return (
    <div style={{ padding: 16 }}>
      <PageInfoBar
        title={t('admin.devices.title')}
        subtitle={t('admin.devices.subtitle')}
      />
      <Space style={{ marginBottom: 12 }} wrap>
        <Button type="primary" onClick={openCreate}>
          {t('admin.devices.register')}
        </Button>
        <Button disabled={selectedRowKeys.length === 0} onClick={openAssign}>
          {t('admin.devices.assignSelected', { count: selectedRowKeys.length })}
        </Button>
        <Checkbox
          checked={unassignedOnly}
          onChange={(e) => setUnassignedOnly(e.target.checked)}
        >
          {t('admin.devices.unassignedOnly')}
        </Checkbox>
      </Space>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={dataSource}
        columns={columns}
        pagination={{ pageSize: 20 }}
        scroll={{ x: true }}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
      />

      <Drawer
        title={
          editing ? t('admin.devices.editTitle') : t('admin.devices.newTitle')
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnHidden
        footer={
          <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => setDrawerOpen(false)} disabled={submitting}>
              {t('admin.devices.cancel')}
            </Button>
            <Button
              type="primary"
              loading={submitting}
              onClick={() => form.submit()}
            >
              {editing ? t('admin.devices.update') : t('admin.devices.create')}
            </Button>
          </Space>
        }
      >
        <Form<FormValues>
          form={form}
          layout="vertical"
          onFinish={submit}
          onValuesChange={(changed) => {
            if ('username' in changed) {
              form.setFieldValue('zone_id', undefined);
              loadZonesFor(changed.username);
            }
          }}
        >
          <Form.Item
            name="device_type"
            label={t('admin.devices.col.type')}
            rules={[{ required: true }]}
          >
            <Select
              options={DEVICE_TYPES.map((d) => ({ value: d, label: d }))}
            />
          </Form.Item>
          <Form.Item
            name="serial"
            label={t('admin.devices.serialLabel')}
            rules={[{ required: true }]}
          >
            <Input placeholder={t('admin.devices.serialPlaceholder')} />
          </Form.Item>
          <Form.Item name="name" label={t('admin.devices.col.name')}>
            <Input />
          </Form.Item>
          <Form.Item
            name="username"
            label={t('admin.devices.ownerLabel')}
            rules={[{ required: true }]}
          >
            <AccountSelect
              placeholder={t('admin.devices.ownerSearchPlaceholder')}
            />
          </Form.Item>
          <Form.Item name="zone_id" label={t('admin.devices.zoneLabel')}>
            <Select
              allowClear
              placeholder={t('admin.devices.zonePlaceholder')}
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
          {editing && (
            <Form.Item
              name="backfill"
              label={t('admin.devices.assign.backfill')}
              valuePropName="checked"
              extra={t('admin.devices.assign.backfillHint')}
            >
              <Switch />
            </Form.Item>
          )}
        </Form>
      </Drawer>

      <Modal
        title={t('admin.devices.assign.title', {
          count: selectedRowKeys.length,
        })}
        open={assignOpen}
        onCancel={() => setAssignOpen(false)}
        onOk={submitAssign}
        okText={t('admin.devices.assign.submit')}
        cancelText={t('admin.devices.cancel')}
        confirmLoading={assignSubmitting}
        okButtonProps={{ disabled: !assignUsername || assignZoneId == null }}
        destroyOnHidden
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <div style={{ marginBottom: 4 }}>
              {t('admin.devices.assign.account')}
            </div>
            <AccountSelect
              value={assignUsername}
              placeholder={t('admin.devices.ownerSearchPlaceholder')}
              onChange={onAssignAccountChange}
            />
          </div>
          <div>
            <div style={{ marginBottom: 4 }}>
              {t('admin.devices.assign.zone')}
            </div>
            <Select
              style={{ width: '100%' }}
              value={assignZoneId}
              disabled={!assignUsername}
              placeholder={t('admin.devices.assign.zonePlaceholder')}
              onChange={(v) => setAssignZoneId(v)}
              options={assignZones.map((z) => ({
                value: z.id,
                label: `${z.name} (#${z.id})`,
              }))}
            />
          </div>
          <Checkbox
            checked={assignBackfill}
            onChange={(e) => setAssignBackfill(e.target.checked)}
          >
            {t('admin.devices.assign.backfill')}
          </Checkbox>
          <div style={{ fontSize: 12, opacity: 0.65 }}>
            {t('admin.devices.assign.backfillHint')}
          </div>
        </Space>
      </Modal>

      <DeviceSensorsDrawer
        device={sensorsDevice}
        open={sensorsDevice !== null}
        onClose={() => setSensorsDevice(null)}
      />
    </div>
  );
};

export default DevicesMain;
