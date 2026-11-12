'use client';

/**
 * Sensor-feed freshness card for the monitoring overview (agri-api #429/#490):
 * when each feed (LoRa uplinks, router weather readings) last received data,
 * how many rows arrived in the last hour, and whether a "no data" alert email
 * is armed. Polls every minute so a feed coming back shows up without a reload.
 *
 * Fetches on its own: a backend without the endpoint (older deploy) hides the
 * card instead of breaking the overview.
 */
import { Card, Skeleton, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Box } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import {
  adminMonitoringApi,
  type IngestFeed,
  type IngestStatus,
} from '@/app/lib/adminMonitoringApi';
import { fmtDateTime, localeTag } from '@/app/lib/datetime';

export const INGEST_POLL_MS = 60_000;

const STATUS_COLOR: Record<IngestFeed['status'], string> = {
  ok: 'green',
  stale: 'red',
  no_data: 'default',
};

const IngestFeedsCard = () => {
  const t = useTranslations('admin.monitoring.ingest');
  const tag = localeTag(useLocale());
  const [data, setData] = useState<IngestStatus | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'hidden'>('loading');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await adminMonitoringApi.ingest();
        if (!cancelled) {
          setData(res);
          setState('ready');
        }
      } catch {
        // Older backend (404) or a transient error on the first load: hide
        // rather than block the overview; later polls keep the last data.
        if (!cancelled) setState((s) => (s === 'ready' ? s : 'hidden'));
      }
    };
    void load();
    const id = setInterval(() => void load(), INGEST_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (state === 'hidden') return null;

  const columns: ColumnsType<IngestFeed> = [
    { title: t('feed'), dataIndex: 'label', key: 'label' },
    {
      title: t('status'),
      key: 'status',
      render: (_: unknown, f: IngestFeed) => (
        <Tag color={STATUS_COLOR[f.status]} data-testid={`ingest-${f.key}`}>
          {f.status === 'stale'
            ? t('stale', { h: f.hours_silent ?? 0 })
            : t(f.status)}
        </Tag>
      ),
    },
    {
      title: t('latest'),
      dataIndex: 'latest_at',
      key: 'latest_at',
      render: (iso: string | null) => fmtDateTime(iso, tag),
    },
    {
      title: t('lastHour'),
      dataIndex: 'last_hour_count',
      key: 'last_hour_count',
      align: 'right',
    },
    {
      title: t('alert'),
      key: 'alert',
      render: (_: unknown, f: IngestFeed) =>
        f.alert_active ? (
          <Tooltip title={t('alertArmedHint')}>
            <Tag color="volcano">{t('alertArmed')}</Tag>
          </Tooltip>
        ) : (
          '—'
        ),
    },
  ];

  return (
    <Card
      size="small"
      title={t('title')}
      style={{ marginBottom: 16 }}
      data-testid="ingest-feeds-card"
    >
      {state === 'loading' || !data ? (
        <Skeleton active paragraph={{ rows: 2 }} />
      ) : (
        <>
          <Table<IngestFeed>
            rowKey="key"
            columns={columns}
            dataSource={data.feeds}
            size="small"
            pagination={false}
          />
          <Box mt={2} fontSize="xs" color="gray.500">
            {t('footer', {
              h: data.threshold_hours,
              r: data.recipients,
              n: data.renotify_hours,
            })}
          </Box>
        </>
      )}
    </Card>
  );
};

export default IngestFeedsCard;
