'use client';

import { App, Card, Empty, Select, Space, Switch } from 'antd';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import {
  adminZoneApi,
  type ActiveGraphRecord,
  type AdminZone,
} from '@/app/lib/adminZoneApi';
import { GRAPH_GROUPS as FIELD_GROUPS } from '@/app/lib/graphCatalog';

export type GraphsTabProps = { username: string };

export function GraphsTab({ username }: GraphsTabProps) {
  const t = useTranslations();
  const { message } = App.useApp();
  const [zones, setZones] = useState<AdminZone[]>([]);
  const [zoneId, setZoneId] = useState<number | null>(null);
  const [status, setStatus] = useState<ActiveGraphRecord>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

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
        const data = await adminZoneApi.activeGraph.get(username, zoneId);
        setStatus(data);
      } catch {
        message.error(t('admin.graphsTab.readError'));
      }
    };
    void loadStatus();
  }, [message, username, zoneId, t]);

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
    </Space>
  );
}

export default GraphsTab;
