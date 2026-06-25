'use client';

import { Alert, Card, Empty, Select, Skeleton, Space } from 'antd';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  adminSensorDataApi,
  type SensorCatalogEntry,
} from '@/app/lib/adminSensorDataApi';
import { adminZoneApi, type AdminZone } from '@/app/lib/adminZoneApi';
import {
  filterCatalogByGroup,
  isoDaysAgo,
  toChartSeries,
  type SensorGroup,
} from '@/app/lib/sensorChartGroups';

export type SensorChartPanelProps = {
  username: string;
  group: SensorGroup;
};

const RANGE_DAYS = [1, 7, 30, 90] as const;
const LOCALE_TAG: Record<string, string> = {
  fr: 'fr-FR',
  ar: 'ar-MA',
  en: 'en-US',
};

/**
 * Admin read-only inline time-series chart for one user's soil or station
 * sensors (agrilogy-front #47). Replaces the old link-out to the user web app:
 * pick a zone + sensor + period and the readings are charted in place, sourced
 * from the generic `/admin/sensor-data` explorer endpoint.
 */
export function SensorChartPanel({ username, group }: SensorChartPanelProps) {
  const t = useTranslations();
  const locale = useLocale();

  const [zones, setZones] = useState<AdminZone[]>([]);
  const [zoneId, setZoneId] = useState<number | null>(null);
  const [sensors, setSensors] = useState<SensorCatalogEntry[]>([]);
  const [sensor, setSensor] = useState<string | null>(null);
  const [days, setDays] = useState<number>(7);

  const [rows, setRows] = useState<
    Awaited<ReturnType<typeof adminSensorDataApi.list>>['rows']
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Zones + the group's sensor catalog, once per user.
  useEffect(() => {
    let alive = true;
    void Promise.all([
      adminZoneApi.list(username),
      adminSensorDataApi.catalog(),
    ]).then(([zoneRows, catalog]) => {
      if (!alive) return;
      setZones(zoneRows);
      if (zoneRows.length > 0) setZoneId(zoneRows[0].id);
      const grouped = filterCatalogByGroup(catalog, group);
      setSensors(grouped);
      if (grouped.length > 0) setSensor(grouped[0].slug);
    });
    return () => {
      alive = false;
    };
  }, [username, group]);

  const load = useCallback(async () => {
    if (zoneId === null || !sensor) return;
    setLoading(true);
    setError(false);
    try {
      const res = await adminSensorDataApi.list({
        sensor,
        username,
        zone_id: zoneId,
        from: isoDaysAgo(days),
        limit: 2000,
      });
      setRows(res.rows);
    } catch {
      setError(true);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [zoneId, sensor, username, days]);

  useEffect(() => {
    void load();
  }, [load]);

  const series = useMemo(() => toChartSeries(rows), [rows]);

  const fmtTick = (label: string) => {
    const d = new Date(label);
    return Number.isNaN(d.getTime())
      ? ''
      : d.toLocaleDateString(LOCALE_TAG[locale] ?? 'fr-FR', {
          month: 'short',
          day: 'numeric',
        });
  };
  const fmtTooltip = (label: string) => {
    const d = new Date(label);
    return Number.isNaN(d.getTime())
      ? label
      : d.toLocaleString(LOCALE_TAG[locale] ?? 'fr-FR');
  };

  if (zones.length === 0) {
    return (
      <Empty
        description={t(
          group === 'soil'
            ? 'admin.soilDataTab.noZonesCreateInTab'
            : 'admin.stationData.noZones'
        )}
      />
    );
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Space wrap>
        <Space>
          <span>{t('admin.sensorChart.zoneLabel')}</span>
          <Select<number>
            value={zoneId ?? undefined}
            onChange={setZoneId}
            options={zones.map((z) => ({ value: z.id, label: z.name }))}
            style={{ minWidth: 200 }}
          />
        </Space>
        <Space>
          <span>{t('admin.sensorChart.sensorLabel')}</span>
          <Select<string>
            value={sensor ?? undefined}
            onChange={setSensor}
            placeholder={t('admin.sensorChart.pickSensor')}
            options={sensors.map((s) => ({ value: s.slug, label: s.label }))}
            style={{ minWidth: 220 }}
            showSearch
            optionFilterProp="label"
            notFoundContent={t('admin.sensorChart.noSensors')}
          />
        </Space>
        <Space>
          <span>{t('admin.sensorChart.rangeLabel')}</span>
          <Select<number>
            value={days}
            onChange={setDays}
            options={RANGE_DAYS.map((d) => ({
              value: d,
              label: t(`admin.sensorChart.range.d${d}`),
            }))}
            style={{ minWidth: 120 }}
          />
        </Space>
      </Space>

      <Card size="small" styles={{ body: { height: 320 } }}>
        {loading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : error ? (
          <Alert
            type="error"
            showIcon
            message={t('admin.sensorChart.loadError')}
          />
        ) : series.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('admin.sensorChart.noData')}
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={series}
              margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="label" tickFormatter={fmtTick} minTickGap={32} />
              <YAxis allowDecimals width={48} />
              <Tooltip labelFormatter={(l) => fmtTooltip(l as string)} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#16a34a"
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>
    </Space>
  );
}

export default SensorChartPanel;
