'use client';

import {
  App,
  Button,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Box } from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { AdminCrudTable } from '@/app/components/admin/_shared/AdminCrudTable';
import { ExportCsvButton } from '@/app/components/admin/_shared/ExportCsvButton';
import { PageInfoBar } from '@/app/components/layout/PageInfoBar';
import { adminUserApi, type AdminUserRow } from '@/app/lib/adminUserApi';
import { adminZoneApi, type AdminZone } from '@/app/lib/adminZoneApi';
import {
  adminSensorDataApi,
  type SensorCatalogEntry,
  type SensorReading,
} from '@/app/lib/adminSensorDataApi';

const localeTag = (locale: string): string =>
  locale === 'ar' ? 'ar' : locale === 'en' ? 'en-GB' : 'fr-FR';

const fmtDateTime = (iso: string | null, tag: string): string => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(tag);
  } catch {
    return iso;
  }
};

const SensorDataExplorerMain = () => {
  const t = useTranslations();
  const tag = localeTag(useLocale());
  const { message } = App.useApp();

  const [catalog, setCatalog] = useState<SensorCatalogEntry[]>([]);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [zones, setZones] = useState<AdminZone[]>([]);

  const [sensor, setSensor] = useState<string | undefined>();
  const [username, setUsername] = useState<string | undefined>();
  const [zoneId, setZoneId] = useState<number | undefined>();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [rows, setRows] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<SensorReading | null>(null);
  const [editValue, setEditValue] = useState<number | null>(null);

  // Load the sensor catalog + user list once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cat, us] = await Promise.all([
          adminSensorDataApi.catalog(),
          adminUserApi.list(),
        ]);
        if (!cancelled) {
          setCatalog(cat);
          setUsers(us);
        }
      } catch {
        if (!cancelled) message.error(t('admin.common.loadError'));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [message, t]);

  // Load the selected user's zones whenever the user changes.
  useEffect(() => {
    setZoneId(undefined);
    setZones([]);
    if (!username) return;
    let cancelled = false;
    (async () => {
      try {
        const z = await adminZoneApi.list(username);
        if (!cancelled) setZones(z);
      } catch {
        /* zone load failure is non-fatal for the explorer */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [username]);

  const load = useCallback(async () => {
    if (!sensor) {
      message.warning(t('admin.sensorData.pickSensor'));
      return;
    }
    setLoading(true);
    try {
      const res = await adminSensorDataApi.list({
        sensor,
        username,
        zone_id: zoneId,
        from: from || undefined,
        to: to || undefined,
      });
      setRows(res.rows);
    } catch {
      message.error(t('admin.common.loadError'));
    } finally {
      setLoading(false);
    }
  }, [sensor, username, zoneId, from, to, message, t]);

  const saveEdit = async () => {
    if (!editing || !sensor) return;
    try {
      await adminSensorDataApi.patch(sensor, editing.id, editValue);
      setRows((prev) =>
        prev.map((r) => (r.id === editing.id ? { ...r, value: editValue } : r))
      );
      setEditing(null);
      message.success(t('admin.sensorData.saved'));
    } catch {
      message.error(t('admin.common.saveError'));
    }
  };

  const removeRow = async (id: number) => {
    if (!sensor) return;
    try {
      await adminSensorDataApi.remove(sensor, id);
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch {
      message.error(t('admin.common.saveError'));
    }
  };

  const canRangeDelete = Boolean(sensor && zoneId && (from || to));

  const rangeDelete = async () => {
    if (!sensor || !zoneId) return;
    try {
      const res = await adminSensorDataApi.removeRange(sensor, {
        zone_id: zoneId,
        from: from || undefined,
        to: to || undefined,
        username,
      });
      message.success(t('admin.sensorData.rangeDeleted', { n: res.deleted }));
      void load();
    } catch {
      message.error(t('admin.common.saveError'));
    }
  };

  const columns: ColumnsType<SensorReading> = [
    {
      title: t('admin.sensorData.col.timestamp'),
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (iso: string | null) => fmtDateTime(iso, tag),
    },
    {
      title: t('admin.sensorData.col.value'),
      dataIndex: 'value',
      key: 'value',
      render: (v: number | null) => (v == null ? '—' : v),
    },
    {
      title: t('admin.sensorData.col.zone'),
      dataIndex: 'zone_id',
      key: 'zone_id',
      render: (v: number | null) => v ?? '—',
    },
    {
      title: t('admin.sensorData.col.user'),
      dataIndex: 'username',
      key: 'username',
      render: (v: string | null) => v ?? '—',
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      render: (_v, r) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            disabled={r.value === null}
            onClick={() => {
              setEditing(r);
              setEditValue(r.value);
            }}
          >
            {t('admin.common.edit')}
          </Button>
          <Popconfirm
            title={t('admin.sensorData.confirmDelete')}
            onConfirm={() => removeRow(r.id)}
          >
            <Button type="link" size="small" danger>
              {t('common.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const csvHeaders = [
    { label: t('admin.sensorData.col.timestamp'), key: 'timestamp' },
    { label: t('admin.sensorData.col.value'), key: 'value' },
    { label: t('admin.sensorData.col.zone'), key: 'zone_id' },
    { label: t('admin.sensorData.col.user'), key: 'username' },
  ];

  return (
    <Box px={{ base: 3, md: 4 }} py={{ base: 3, md: 4 }}>
      <PageInfoBar
        title={t('admin.sensorData.title')}
        subtitle={t('admin.sensorData.subtitle')}
        actions={
          <ExportCsvButton<SensorReading>
            data={rows}
            headers={csvHeaders}
            filename="sensor-data"
          />
        }
      />

      <Space wrap style={{ marginBottom: 16 }}>
        <Select
          showSearch
          allowClear
          placeholder={t('admin.sensorData.filter.sensor')}
          value={sensor}
          onChange={(v) => setSensor(v)}
          style={{ width: 220 }}
          optionFilterProp="label"
          options={catalog.map((c) => ({ label: c.label, value: c.slug }))}
        />
        <Select
          showSearch
          allowClear
          placeholder={t('admin.sensorData.filter.user')}
          value={username}
          onChange={(v) => setUsername(v)}
          style={{ width: 200 }}
          optionFilterProp="label"
          options={users.map((u) => ({ label: u.username, value: u.username }))}
        />
        <Select
          allowClear
          placeholder={t('admin.sensorData.filter.zone')}
          value={zoneId}
          onChange={(v) => setZoneId(v)}
          style={{ width: 180 }}
          disabled={!username}
          options={zones.map((z) => ({ label: z.name, value: z.id }))}
        />
        <Input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          style={{ width: 160 }}
          aria-label={t('admin.sensorData.filter.from')}
        />
        <Input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          style={{ width: 160 }}
          aria-label={t('admin.sensorData.filter.to')}
        />
        <Button type="primary" onClick={() => void load()}>
          {t('admin.sensorData.load')}
        </Button>
        <Popconfirm
          title={t('admin.sensorData.confirmRangeDelete')}
          onConfirm={rangeDelete}
          disabled={!canRangeDelete}
        >
          <Button danger disabled={!canRangeDelete}>
            {t('admin.sensorData.rangeDelete')}
          </Button>
        </Popconfirm>
      </Space>

      <AdminCrudTable<SensorReading>
        rowKey="id"
        columns={columns}
        data={rows}
        loading={loading}
        emptyDescription={t('admin.sensorData.empty')}
      />

      <Modal
        open={editing !== null}
        title={t('admin.sensorData.editTitle')}
        onCancel={() => setEditing(null)}
        onOk={saveEdit}
        okText={t('common.save')}
        cancelText={t('shell.admin.cancel')}
        destroyOnHidden
      >
        <InputNumber
          value={editValue}
          onChange={(v) => setEditValue(v)}
          style={{ width: '100%' }}
        />
      </Modal>
    </Box>
  );
};

export default SensorDataExplorerMain;
