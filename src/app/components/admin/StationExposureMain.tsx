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
  Tooltip,
  Typography,
} from 'antd';
import { ReloadOutlined, SyncOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { useLocale, useTranslations } from 'next-intl';

import { AdminCrudTable } from '@/app/components/admin/_shared/AdminCrudTable';
import { PageInfoBar } from '@/app/components/layout/PageInfoBar';
import {
  adminStationsApi,
  SENSOR_KEYS,
  summarizeStations,
  type Detected,
  type ExposureSignal,
  type Placement,
  type SensorVerdict,
  type StationRow,
} from '@/app/lib/adminStationsApi';

const localeTag = (locale: string): string =>
  locale === 'ar' ? 'ar' : locale === 'en' ? 'en-GB' : 'fr-FR';

const fmtDateTime = (iso: string | null | undefined, tag: string): string => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(tag);
  } catch {
    return iso;
  }
};

const DETECTED_COLOR: Record<Detected, string> = {
  outdoor: 'green',
  indoor: 'red',
  uncertain: 'orange',
  unknown: 'default',
};

const SENSOR_COLOR: Record<SensorVerdict, string> = {
  ok: 'green',
  sheltered: 'red',
  not_checked: 'default',
};

const PLACEMENTS: Placement[] = ['auto', 'outdoor', 'indoor'];

const StationExposureMain = () => {
  const t = useTranslations();
  const tag = localeTag(useLocale());
  const { message } = App.useApp();

  const [rows, setRows] = useState<StationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [windowHours, setWindowHours] = useState(24);
  const [busy, setBusy] = useState<Record<number, boolean>>({});

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminStationsApi.list();
      setRows(data.stations);
      setWindowHours(data.window_hours);
    } catch {
      message.error(t('admin.common.loadError'));
    } finally {
      setLoading(false);
    }
  }, [message, t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const withBusy = async (id: number, fn: () => Promise<void>) => {
    setBusy((b) => ({ ...b, [id]: true }));
    try {
      await fn();
    } finally {
      setBusy((b) => ({ ...b, [id]: false }));
    }
  };

  const changePlacement = (row: StationRow, placement: Placement) =>
    withBusy(row.device_id, async () => {
      try {
        await adminStationsApi.setPlacement(row.device_id, placement);
        message.success(t('admin.stations.placementSaved'));
        await refresh();
      } catch {
        message.error(t('admin.stations.saveError'));
      }
    });

  const checkNow = (row: StationRow) =>
    withBusy(row.device_id, async () => {
      try {
        const report = await adminStationsApi.checkNow(row.device_id);
        setRows((all) =>
          all.map((r) => (r.device_id === row.device_id ? { ...r, report } : r))
        );
        message.success(
          t('admin.stations.checked', {
            status: t(`admin.stations.status.${report.status}`),
          })
        );
      } catch {
        message.error(t('admin.stations.checkError'));
      }
    });

  const signalText = (s: ExposureSignal): string =>
    t(`admin.stations.signal.${s.code}`, s.detail);

  const summary = useMemo(() => summarizeStations(rows), [rows]);

  const columns: ColumnsType<StationRow> = [
    {
      title: t('admin.stations.col.station'),
      key: 'device',
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{r.device}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {[r.serial, r.username].filter(Boolean).join(' · ')}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: t('admin.stations.col.lastReading'),
      dataIndex: 'last_reading',
      key: 'last_reading',
      render: (iso: string | null) => fmtDateTime(iso, tag),
    },
    {
      title: (
        <Tooltip title={t('admin.stations.placementHelp')}>
          {t('admin.stations.col.placement')}
        </Tooltip>
      ),
      key: 'placement',
      render: (_, r) => (
        <Tooltip
          title={
            r.placement_updated_by
              ? t('admin.stations.placementBy', {
                  user: r.placement_updated_by,
                  at: fmtDateTime(r.placement_updated_at, tag),
                })
              : undefined
          }
        >
          <Select<Placement>
            size="small"
            value={r.placement}
            style={{ width: 150 }}
            disabled={busy[r.device_id]}
            onChange={(v) => void changePlacement(r, v)}
            options={PLACEMENTS.map((p) => ({
              value: p,
              label: t(`admin.stations.placement.${p}`),
            }))}
          />
        </Tooltip>
      ),
    },
    {
      title: t('admin.stations.col.detected'),
      key: 'detected',
      render: (_, r) => {
        if (!r.report) return <Tag>{t('admin.stations.notCheckedYet')}</Tag>;
        const detected = r.report.detected ?? 'unknown';
        return (
          <Space size={4} wrap>
            <Tooltip title={t(`admin.stations.status.${r.report.status}`)}>
              <Tag color={DETECTED_COLOR[detected]}>
                {t(`admin.stations.detected.${detected}`)}
              </Tag>
            </Tooltip>
            {r.report.mismatch && (
              <Tooltip title={t('admin.stations.mismatchHelp')}>
                <Tag color="volcano">{t('admin.stations.mismatch')}</Tag>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: t('admin.stations.col.sensors'),
      key: 'sensors',
      render: (_, r) => {
        const sensors = r.report?.sensors;
        if (!sensors || Object.keys(sensors).length === 0) return '—';
        return (
          <Space size={4} wrap>
            {SENSOR_KEYS.map((k) => {
              const v = sensors[k] ?? 'not_checked';
              return (
                <Tooltip key={k} title={t(`admin.stations.verdict.${v}`)}>
                  <Tag color={SENSOR_COLOR[v]}>
                    {t(`admin.stations.sensor.${k}`)}
                  </Tag>
                </Tooltip>
              );
            })}
          </Space>
        );
      },
    },
    {
      title: t('admin.stations.col.why'),
      key: 'signals',
      render: (_, r) =>
        r.report && r.report.signals.length > 0 ? (
          <ul style={{ margin: 0, paddingInlineStart: 16, fontSize: 12 }}>
            {r.report.signals.map((s) => (
              <li key={s.code}>{signalText(s)}</li>
            ))}
          </ul>
        ) : (
          '—'
        ),
    },
    {
      title: t('admin.stations.col.checkedAt'),
      key: 'checked_at',
      render: (_, r) => fmtDateTime(r.report?.checked_at, tag),
    },
    {
      title: '',
      key: 'actions',
      render: (_, r) => (
        <Button
          size="small"
          icon={<SyncOutlined />}
          loading={busy[r.device_id]}
          onClick={() => void checkNow(r)}
        >
          {t('admin.stations.checkNow')}
        </Button>
      ),
    },
  ];

  return (
    <Box px={{ base: 3, md: 4 }} py={{ base: 3, md: 4 }}>
      <PageInfoBar
        title={t('admin.stations.title')}
        subtitle={t('admin.stations.subtitle', { hours: windowHours })}
        actions={
          <Button icon={<ReloadOutlined />} onClick={() => void refresh()}>
            {t('admin.stations.refresh')}
          </Button>
        }
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title={t('admin.stations.stat.total')}
              value={summary.total}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title={t('admin.stations.stat.sheltered')}
              value={summary.sheltered}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title={t('admin.stations.stat.mismatch')}
              value={summary.mismatch}
              valueStyle={{ color: '#d46b08' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title={t('admin.stations.stat.declaredIndoor')}
              value={summary.declaredIndoor}
            />
          </Card>
        </Col>
      </Row>

      <AdminCrudTable<StationRow>
        rowKey="device_id"
        columns={columns}
        data={rows}
        loading={loading}
        searchable
        searchKeys={['device', 'serial', 'username']}
        emptyDescription={t('admin.stations.empty')}
      />
    </Box>
  );
};

export default StationExposureMain;
