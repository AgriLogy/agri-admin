'use client';

import {
  App,
  Alert,
  Button,
  Card,
  Descriptions,
  Empty,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
} from 'antd';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  adminZoneApi,
  type AdminZone,
  type BackfillResult,
  type BackfillStatus,
} from '@/app/lib/adminZoneApi';

export type BackfillTabProps = { username: string };

const INTERVALS = [15, 30, 60];

export function BackfillTab({ username }: BackfillTabProps) {
  const t = useTranslations();
  const { message, modal } = App.useApp();

  const [zones, setZones] = useState<AdminZone[]>([]);
  const [zoneId, setZoneId] = useState<number | null>(null);
  const [status, setStatus] = useState<BackfillStatus | null>(null);
  const [interval, setInterval] = useState(60);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<BackfillResult | null>(null);

  useEffect(() => {
    adminZoneApi
      .list(username)
      .then((rows) => {
        setZones(rows);
        if (rows.length > 0) setZoneId(rows[0].id);
      })
      .catch(() => message.error(t('admin.backfill.listError')))
      .finally(() => setLoading(false));
  }, [username, message, t]);

  const loadStatus = useCallback(async () => {
    if (zoneId === null) return;
    setStatus(null);
    setResult(null);
    try {
      setStatus(await adminZoneApi.backfill.status(username, zoneId));
    } catch {
      message.error(t('admin.backfill.statusError'));
    }
  }, [username, zoneId, message, t]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const run = useCallback(
    async (dryRun: boolean) => {
      if (zoneId === null) return;
      setRunning(true);
      try {
        const res = await adminZoneApi.backfill.run(username, zoneId, {
          interval_minutes: interval,
          dry_run: dryRun,
        });
        setResult(res);
        if (dryRun) {
          message.info(
            t('admin.backfill.previewMsg', { rows: res.rows_created })
          );
        } else {
          message.success(
            t('admin.backfill.doneMsg', { rows: res.rows_created })
          );
          void loadStatus();
        }
      } catch (err) {
        const detail =
          (err as { response?: { data?: { detail?: string } } })?.response?.data
            ?.detail ?? t('admin.backfill.runError');
        message.error(detail);
      } finally {
        setRunning(false);
      }
    },
    [username, zoneId, interval, message, t, loadStatus]
  );

  const confirmRun = () => {
    modal.confirm({
      title: t('admin.backfill.confirmTitle'),
      content: t('admin.backfill.confirmBody', { interval }),
      okText: t('admin.backfill.confirmOk'),
      cancelText: t('admin.backfill.cancel'),
      onOk: () => run(false),
    });
  };

  const perSeriesRows = useMemo(
    () =>
      result
        ? Object.entries(result.per_series).map(([key, count]) => ({
            key,
            count,
          }))
        : [],
    [result]
  );

  const isCurrent = status?.gap_hours !== null && (status?.gap_hours ?? 0) < 1;

  if (loading) return null;
  if (zones.length === 0) {
    return <Empty description={t('admin.backfill.noZones')} />;
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message={t('admin.backfill.title')}
        description={t('admin.backfill.subtitle')}
      />

      <Space wrap align="end">
        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            {t('admin.backfill.zoneLabel')}
          </div>
          <Select<number>
            value={zoneId ?? undefined}
            onChange={setZoneId}
            options={zones.map((z) => ({ value: z.id, label: z.name }))}
            style={{ minWidth: 220 }}
          />
        </div>
        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            {t('admin.backfill.intervalLabel')}
          </div>
          <Select<number>
            value={interval}
            onChange={setInterval}
            options={INTERVALS.map((m) => ({
              value: m,
              label: t('admin.backfill.everyMinutes', { m }),
            }))}
            style={{ minWidth: 160 }}
          />
        </div>
      </Space>

      {status && (
        <Card size="small">
          <Descriptions column={{ xs: 1, sm: 2, md: 3 }} size="small">
            <Descriptions.Item label={t('admin.backfill.lastData')}>
              {status.last_data_at
                ? new Date(status.last_data_at).toLocaleString()
                : t('admin.backfill.never')}
            </Descriptions.Item>
            <Descriptions.Item label={t('admin.backfill.gap')}>
              {status.gap_hours === null ? (
                '—'
              ) : isCurrent ? (
                <Tag color="green">{t('admin.backfill.upToDate')}</Tag>
              ) : (
                <Tag color="orange">
                  {t('admin.backfill.hoursBehind', {
                    h: status.gap_hours,
                  })}
                </Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label={t('admin.backfill.series')}>
              {status.series_with_data} / {status.series_total}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      <Space>
        <Button
          onClick={() => run(true)}
          loading={running}
          disabled={zoneId === null}
        >
          {t('admin.backfill.preview')}
        </Button>
        <Button
          type="primary"
          onClick={confirmRun}
          loading={running}
          disabled={zoneId === null}
        >
          {t('admin.backfill.fillToNow')}
        </Button>
      </Space>

      {result && (
        <Card
          size="small"
          title={
            result.dry_run
              ? t('admin.backfill.previewTitle')
              : t('admin.backfill.resultTitle')
          }
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Statistic
              title={t('admin.backfill.rowsCreated')}
              value={result.rows_created}
            />
            {perSeriesRows.length > 0 ? (
              <Table
                size="small"
                rowKey="key"
                pagination={false}
                dataSource={perSeriesRows}
                columns={[
                  {
                    title: t('admin.backfill.seriesCol'),
                    dataIndex: 'key',
                  },
                  {
                    title: t('admin.backfill.rowsCol'),
                    dataIndex: 'count',
                    width: 120,
                  },
                ]}
              />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t('admin.backfill.nothingToDo')}
              />
            )}
          </Space>
        </Card>
      )}
    </Space>
  );
}

export default BackfillTab;
