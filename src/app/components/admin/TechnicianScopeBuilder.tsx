'use client';

import { Button, Empty, Select, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { adminUserApi, type AdminUserRow } from '@/app/lib/adminUserApi';
import { adminZoneApi, type AdminZone } from '@/app/lib/adminZoneApi';
import { GRAPH_GROUPS, GRAPH_KEYS } from '@/app/lib/graphCatalog';
import type { ZoneScope } from '@/app/lib/technicianApi';

export type TechnicianScopeBuilderProps = {
  value: ZoneScope[];
  onChange: (next: ZoneScope[]) => void;
};

/**
 * Builds a technician's `ZoneScope[]` (which zones + which graphs they may see).
 * Zones are picked by first choosing a customer, then one of that customer's
 * zones (zone ids are global, so a technician can be scoped across customers).
 * Each added zone defaults to all graphs; the graph set is then editable.
 */
export function TechnicianScopeBuilder({
  value,
  onChange,
}: TechnicianScopeBuilderProps) {
  const t = useTranslations();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [zones, setZones] = useState<AdminZone[]>([]);
  const [zonesLoading, setZonesLoading] = useState(false);
  const [zoneToAdd, setZoneToAdd] = useState<number | null>(null);
  const [zoneNames, setZoneNames] = useState<Record<number, string>>({});

  useEffect(() => {
    void adminUserApi
      .list()
      .then(setUsers)
      .catch(() => setUsers([]));
  }, []);

  useEffect(() => {
    if (!selectedUser) {
      setZones([]);
      setZoneToAdd(null);
      return;
    }
    let cancelled = false;
    setZonesLoading(true);
    adminZoneApi
      .list(selectedUser)
      .then((rows) => {
        if (cancelled) return;
        setZones(rows);
        setZoneNames((prev) => {
          const next = { ...prev };
          rows.forEach((z) => {
            next[z.id] = z.name;
          });
          return next;
        });
      })
      .catch(() => !cancelled && setZones([]))
      .finally(() => !cancelled && setZonesLoading(false));
    return () => {
      cancelled = true;
    };
  }, [selectedUser]);

  const graphOptions = useMemo(
    () =>
      GRAPH_GROUPS.map((g) => ({
        label: t(g.titleKey),
        title: t(g.titleKey),
        options: g.keys.map((k) => ({
          value: k,
          label: t(`admin.graphsTab.fields.${k}`),
        })),
      })),
    [t]
  );

  const addableZones = useMemo(
    () => zones.filter((z) => !value.some((s) => s.zone_id === z.id)),
    [zones, value]
  );

  const addZone = () => {
    if (zoneToAdd == null || value.some((s) => s.zone_id === zoneToAdd)) return;
    onChange([
      ...value,
      { zone_id: zoneToAdd, allowed_graphs: [...GRAPH_KEYS] },
    ]);
    setZoneToAdd(null);
  };

  const removeZone = (zoneId: number) =>
    onChange(value.filter((s) => s.zone_id !== zoneId));

  const setGraphs = (zoneId: number, graphs: string[]) =>
    onChange(
      value.map((s) =>
        s.zone_id === zoneId ? { ...s, allowed_graphs: graphs } : s
      )
    );

  const columns: ColumnsType<ZoneScope> = [
    {
      title: t('admin.technicians.scope.zone'),
      key: 'zone',
      width: 160,
      render: (_v, s) =>
        zoneNames[s.zone_id] ??
        t('admin.technicians.scope.zoneFallback', { id: s.zone_id }),
    },
    {
      title: t('admin.technicians.scope.graphs'),
      key: 'graphs',
      render: (_v, s) => (
        <Select
          mode="multiple"
          value={s.allowed_graphs}
          onChange={(g) => setGraphs(s.zone_id, g)}
          options={graphOptions}
          maxTagCount="responsive"
          placeholder={t('admin.technicians.scope.graphsPlaceholder')}
          style={{ width: '100%', minWidth: 240 }}
        />
      ),
    },
    {
      title: '',
      key: 'remove',
      width: 48,
      align: 'right',
      render: (_v, s) => (
        <Button
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => removeZone(s.zone_id)}
          aria-label={t('admin.technicians.scope.remove')}
        />
      ),
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Space wrap>
        <Select
          showSearch
          placeholder={t('admin.technicians.scope.selectUser')}
          value={selectedUser ?? undefined}
          onChange={setSelectedUser}
          optionFilterProp="label"
          options={users.map((u) => ({
            value: u.username,
            label: u.username,
          }))}
          style={{ minWidth: 200 }}
        />
        <Select<number>
          placeholder={t('admin.technicians.scope.selectZone')}
          loading={zonesLoading}
          disabled={!selectedUser}
          value={zoneToAdd ?? undefined}
          onChange={setZoneToAdd}
          options={addableZones.map((z) => ({ value: z.id, label: z.name }))}
          notFoundContent={
            selectedUser ? t('admin.technicians.scope.noZones') : null
          }
          style={{ minWidth: 200 }}
        />
        <Button
          icon={<PlusOutlined />}
          onClick={addZone}
          disabled={zoneToAdd == null}
        >
          {t('admin.technicians.scope.add')}
        </Button>
      </Space>

      {value.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t('admin.technicians.scope.empty')}
        />
      ) : (
        <Table<ZoneScope>
          rowKey="zone_id"
          size="small"
          columns={columns}
          dataSource={value}
          pagination={false}
        />
      )}
    </Space>
  );
}

export default TechnicianScopeBuilder;
