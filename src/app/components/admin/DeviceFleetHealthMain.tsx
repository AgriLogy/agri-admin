'use client';

import {
  App,
  Button,
  Card,
  Col,
  Row,
  Select,
  Space,
  Statistic,
  Tag,
} from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { useLocale, useTranslations } from 'next-intl';

import { AdminCrudTable } from '@/app/components/admin/_shared/AdminCrudTable';
import { ExportCsvButton } from '@/app/components/admin/_shared/ExportCsvButton';
import { PageInfoBar } from '@/app/components/layout/PageInfoBar';
import {
  adminDeviceHealthApi,
  type FleetDevice,
  type FleetDeviceStatus,
  type FleetSummary,
} from '@/app/lib/adminDeviceHealthApi';

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

const STATUS_COLOR: Record<FleetDeviceStatus, string> = {
  online: 'green',
  stale: 'orange',
  offline: 'red',
};

const num = (v: number | null, suffix = ''): string =>
  v == null ? '—' : `${v}${suffix}`;

const DeviceFleetHealthMain = () => {
  const t = useTranslations();
  const tag = localeTag(useLocale());
  const { message } = App.useApp();

  const [devices, setDevices] = useState<FleetDevice[]>([]);
  const [summary, setSummary] = useState<FleetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<FleetDeviceStatus | 'all'>(
    'all'
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminDeviceHealthApi.health();
      setDevices(data.devices);
      setSummary(data.summary);
    } catch {
      message.error(t('admin.common.loadError'));
    } finally {
      setLoading(false);
    }
  }, [message, t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const rows = useMemo(
    () =>
      statusFilter === 'all'
        ? devices
        : devices.filter((d) => d.status === statusFilter),
    [devices, statusFilter]
  );

  const columns: ColumnsType<FleetDevice> = [
    {
      title: t('admin.fleet.col.devEui'),
      dataIndex: 'dev_eui',
      key: 'dev_eui',
    },
    {
      title: t('admin.fleet.col.name'),
      dataIndex: 'device_name',
      key: 'device_name',
      render: (v: string) => v || '—',
    },
    {
      title: t('admin.fleet.col.status'),
      dataIndex: 'status',
      key: 'status',
      render: (s: FleetDeviceStatus) => (
        <Tag color={STATUS_COLOR[s]}>{t(`admin.fleet.status.${s}`)}</Tag>
      ),
    },
    {
      title: t('admin.fleet.col.lastSeen'),
      dataIndex: 'last_seen',
      key: 'last_seen',
      render: (iso: string | null) => fmtDateTime(iso, tag),
    },
    {
      title: t('admin.fleet.col.battery'),
      dataIndex: 'battery_v',
      key: 'battery_v',
      render: (v: number | null) => num(v, ' V'),
    },
    {
      title: t('admin.fleet.col.rssi'),
      dataIndex: 'rssi',
      key: 'rssi',
      render: (v: number | null) => num(v, ' dBm'),
    },
    {
      title: t('admin.fleet.col.snr'),
      dataIndex: 'snr',
      key: 'snr',
      render: (v: number | null) => num(v, ' dB'),
    },
    {
      title: t('admin.fleet.col.uplinks24h'),
      dataIndex: 'uplinks_24h',
      key: 'uplinks_24h',
    },
  ];

  const csvHeaders = [
    { label: t('admin.fleet.col.devEui'), key: 'dev_eui' },
    { label: t('admin.fleet.col.name'), key: 'device_name' },
    { label: t('admin.fleet.col.status'), key: 'status' },
    { label: t('admin.fleet.col.lastSeen'), key: 'last_seen' },
    { label: t('admin.fleet.col.battery'), key: 'battery_v' },
    { label: t('admin.fleet.col.rssi'), key: 'rssi' },
    { label: t('admin.fleet.col.snr'), key: 'snr' },
    { label: t('admin.fleet.col.uplinks24h'), key: 'uplinks_24h' },
  ];

  return (
    <Box px={{ base: 3, md: 4 }} py={{ base: 3, md: 4 }}>
      <PageInfoBar
        title={t('admin.fleet.title')}
        subtitle={t('admin.fleet.subtitle')}
        actions={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => void refresh()}>
              {t('admin.fleet.refresh')}
            </Button>
            <ExportCsvButton<FleetDevice>
              data={rows}
              headers={csvHeaders}
              filename="device-fleet-health"
            />
          </Space>
        }
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title={t('admin.fleet.stat.total')}
              value={summary?.total ?? 0}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title={t('admin.fleet.status.online')}
              value={summary?.online ?? 0}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title={t('admin.fleet.status.stale')}
              value={summary?.stale ?? 0}
              valueStyle={{ color: '#d46b08' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title={t('admin.fleet.status.offline')}
              value={summary?.offline ?? 0}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Space wrap style={{ marginBottom: 16 }}>
        <Select
          value={statusFilter}
          onChange={(v) => setStatusFilter(v)}
          style={{ width: 180 }}
          options={[
            { label: t('admin.fleet.filter.all'), value: 'all' },
            { label: t('admin.fleet.status.online'), value: 'online' },
            { label: t('admin.fleet.status.stale'), value: 'stale' },
            { label: t('admin.fleet.status.offline'), value: 'offline' },
          ]}
        />
      </Space>

      <AdminCrudTable<FleetDevice>
        rowKey="dev_eui"
        columns={columns}
        data={rows}
        loading={loading}
        searchable
        searchKeys={['dev_eui', 'device_name']}
        emptyDescription={t('admin.fleet.empty')}
      />
    </Box>
  );
};

export default DeviceFleetHealthMain;
