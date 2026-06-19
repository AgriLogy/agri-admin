'use client';

import { App, Button, Card, Col, Empty, Input, Row, Select, Space, Switch } from 'antd';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import {
  adminZoneApi,
  type ActiveGraphRecord,
  type AdminZone,
  type ConfigRecord,
} from '@/app/lib/adminZoneApi';
import { GRAPH_GROUPS as FIELD_GROUPS } from '@/app/lib/graphCatalog';

export type GraphsTabProps = { username: string };

export function GraphsTab({ username }: GraphsTabProps) {
  const t = useTranslations();
  const { message } = App.useApp();
  const [zones, setZones] = useState<AdminZone[]>([]);
  const [zoneId, setZoneId] = useState<number | null>(null);
  const [status, setStatus] = useState<ActiveGraphRecord>({});
  const [labels, setLabels] = useState<ConfigRecord>({});
  const [colors, setColors] = useState<ConfigRecord>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savingLabels, setSavingLabels] = useState(false);
  const [savingColors, setSavingColors] = useState(false);

  const loadZones = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await adminZoneApi.list(username);
      setZones(rows);
      if (rows.length > 0) setZoneId(rows[0].id);
    } catch {
      message.error(t('admin.graphsTab.listError'));
    } finally {
      setLoading(false);
    }
  }, [message, username, t]);

  useEffect(() => {
    void loadZones();
  }, [loadZones]);

  useEffect(() => {
    const loadStatus = async () => {
      if (zoneId === null) return;
      try {
        const [ag, gn, sc] = await Promise.all([
          adminZoneApi.activeGraph.get(username, zoneId),
          adminZoneApi.graphNames.get(username, zoneId),
          adminZoneApi.sensorColors.get(username, zoneId),
        ]);
        setStatus(ag);
        setLabels(gn);
        setColors(sc);
      } catch {
        message.error(t('admin.graphsTab.readError'));
      }
    };
    void loadStatus();
  }, [message, username, zoneId, t]);

  const saveLabels = async () => {
    if (zoneId === null) return;
    setSavingLabels(true);
    try {
      const updated = await adminZoneApi.graphNames.patch(username, zoneId, labels);
      setLabels(updated);
      message.success(t('admin.graphsTab.saved'));
    } catch {
      message.error(t('admin.graphsTab.updateError'));
    } finally {
      setSavingLabels(false);
    }
  };

  const saveColors = async () => {
    if (zoneId === null) return;
    setSavingColors(true);
    try {
      const updated = await adminZoneApi.sensorColors.patch(username, zoneId, colors);
      setColors(updated);
      message.success(t('admin.graphsTab.saved'));
    } catch {
      message.error(t('admin.graphsTab.updateError'));
    } finally {
      setSavingColors(false);
    }
  };

  const handleToggle = async (key: string, value: boolean) => {
    if (zoneId === null) return;
    setSavingKey(key);
    const optimistic = { ...status, [key]: value };
    setStatus(optimistic);
    try {
      const updated = await adminZoneApi.activeGraph.patch(username, zoneId, {
        [key]: value,
      });
      setStatus((prev) => ({ ...prev, ...updated }));
    } catch {
      setStatus(status); // rollback
      message.error(t('admin.graphsTab.updateError'));
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) return null;
  if (zones.length === 0) {
    return <Empty description={t('admin.graphsTab.noZones')} />;
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Space>
        <span>{t('admin.graphsTab.zoneLabel')}</span>
        <Select<number>
          value={zoneId ?? undefined}
          onChange={setZoneId}
          options={zones.map((z) => ({ value: z.id, label: z.name }))}
          style={{ minWidth: 220 }}
        />
      </Space>

      {FIELD_GROUPS.map((group) => (
        <Card
          key={group.id}
          title={`${group.emoji} ${t(group.titleKey)}`}
          size="small"
        >
          <Space wrap size="middle">
            {group.keys.map((key) => (
              <Space key={key} size="small">
                <Switch
                  checked={Boolean(status[key])}
                  loading={savingKey === key}
                  onChange={(v) => handleToggle(key, v)}
                  size="small"
                />
                <span>{t(`admin.graphsTab.fields.${key}`)}</span>
              </Space>
            ))}
          </Space>
        </Card>
      ))}

      {Object.keys(labels).length > 0 && (
        <Card
          title={t('admin.graphsTab.labelsTitle')}
          size="small"
          extra={
            <Button
              type="primary"
              size="small"
              loading={savingLabels}
              onClick={() => void saveLabels()}
            >
              {t('admin.graphsTab.save')}
            </Button>
          }
        >
          <Row gutter={[12, 12]}>
            {Object.keys(labels)
              .sort()
              .map((key) => (
                <Col xs={24} md={12} lg={8} key={key}>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>{key}</div>
                  <Input
                    value={labels[key]}
                    onChange={(e) =>
                      setLabels((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                  />
                </Col>
              ))}
          </Row>
        </Card>
      )}

      {Object.keys(colors).length > 0 && (
        <Card
          title={t('admin.graphsTab.colorsTitle')}
          size="small"
          extra={
            <Button
              type="primary"
              size="small"
              loading={savingColors}
              onClick={() => void saveColors()}
            >
              {t('admin.graphsTab.save')}
            </Button>
          }
        >
          <Row gutter={[12, 12]}>
            {Object.keys(colors)
              .sort()
              .map((key) => (
                <Col xs={12} md={8} lg={6} key={key}>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>{key}</div>
                  <Space>
                    <input
                      type="color"
                      value={colors[key] || '#000000'}
                      onChange={(e) =>
                        setColors((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      style={{ width: 36, height: 28, border: 'none', background: 'none' }}
                    />
                    <Input
                      value={colors[key]}
                      onChange={(e) =>
                        setColors((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      style={{ width: 90 }}
                    />
                  </Space>
                </Col>
              ))}
          </Row>
        </Card>
      )}
    </Space>
  );
}

export default GraphsTab;
