'use client';

import {
  App,
  Card,
  Col,
  Input,
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { useLocale, useTranslations } from 'next-intl';

import { AdminCrudTable } from '@/app/components/admin/_shared/AdminCrudTable';
import { AdminConfirmDelete } from '@/app/components/admin/_shared/AdminConfirmDelete';
import { ExportCsvButton } from '@/app/components/admin/_shared/ExportCsvButton';
import { PageInfoBar } from '@/app/components/layout/PageInfoBar';
import {
  adminAlertApi,
  type AlertAnalytics,
  type AlertConsoleRow,
} from '@/app/lib/adminAlertApi';

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

const AlertsConsoleMain = () => {
  const t = useTranslations();
  const tag = localeTag(useLocale());
  const { message } = App.useApp();

  const [rows, setRows] = useState<AlertConsoleRow[]>([]);
  const [stats, setStats] = useState<AlertAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters (client holds the inputs; the active filter applies on the server).
  const [username, setUsername] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'active' | 'inactive'
  >('all');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [list, analytics] = await Promise.all([
        adminAlertApi.listAll({
          username: username.trim() || undefined,
          type: typeFilter,
          is_active:
            activeFilter === 'all' ? undefined : activeFilter === 'active',
        }),
        adminAlertApi.analytics(),
      ]);
      setRows(list);
      setStats(analytics);
    } catch {
      message.error(t('admin.common.loadError'));
    } finally {
      setLoading(false);
    }
  }, [username, typeFilter, activeFilter, message, t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const typeOptions = useMemo(
    () => (stats?.by_type ?? []).map((r) => ({ label: r.type, value: r.type })),
    [stats]
  );

  const toggleActive = async (row: AlertConsoleRow, next: boolean) => {
    try {
      await adminAlertApi.setActive(row.id, next);
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, is_active: next } : r))
      );
    } catch {
      message.error(t('admin.common.saveError'));
    }
  };

  const removeAlert = async (id: number) => {
    await adminAlertApi.remove(id);
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const columns: ColumnsType<AlertConsoleRow> = [
    {
      title: t('admin.alertsConsole.col.user'),
      dataIndex: 'username',
      key: 'username',
      render: (v: string | null) => v ?? '—',
    },
    {
      title: t('admin.alertsConsole.col.name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('admin.alertsConsole.col.type'),
      dataIndex: 'type',
      key: 'type',
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: t('admin.alertsConsole.col.sensor'),
      dataIndex: 'sensor_key',
      key: 'sensor_key',
    },
    {
      title: t('admin.alertsConsole.col.condition'),
      key: 'condition',
      render: (_v, r) => `${r.condition} ${r.condition_nbr}`,
    },
    {
      title: t('admin.alertsConsole.col.lastTriggered'),
      dataIndex: 'last_triggered_at',
      key: 'last_triggered_at',
      render: (iso: string | null) => fmtDateTime(iso, tag),
    },
    {
      title: t('admin.alertsConsole.col.active'),
      key: 'is_active',
      align: 'center',
      render: (_v, r) => (
        <Switch
          checked={r.is_active}
          size="small"
          onChange={(next) => void toggleActive(r, next)}
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      render: (_v, r) => (
        <AdminConfirmDelete onConfirm={() => removeAlert(r.id)} />
      ),
    },
  ];

  const csvHeaders = [
    { label: t('admin.alertsConsole.col.user'), key: 'username' },
    { label: t('admin.alertsConsole.col.name'), key: 'name' },
    { label: t('admin.alertsConsole.col.type'), key: 'type' },
    { label: t('admin.alertsConsole.col.sensor'), key: 'sensor_key' },
    { label: t('admin.alertsConsole.col.condition'), key: 'condition' },
    { label: t('admin.alertsConsole.col.condition_nbr'), key: 'condition_nbr' },
    { label: t('admin.alertsConsole.col.active'), key: 'is_active' },
    {
      label: t('admin.alertsConsole.col.lastTriggered'),
      key: 'last_triggered_at',
    },
  ];

  return (
    <Box px={{ base: 3, md: 4 }} py={{ base: 3, md: 4 }}>
      <PageInfoBar
        title={t('admin.alertsConsole.title')}
        subtitle={t('admin.alertsConsole.subtitle')}
        actions={
          <ExportCsvButton<AlertConsoleRow>
            data={rows}
            headers={csvHeaders}
            filename="alerts"
          />
        }
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title={t('admin.alertsConsole.stat.total')}
              value={stats?.total ?? 0}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title={t('admin.alertsConsole.stat.active')}
              value={stats?.active ?? 0}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title={t('admin.alertsConsole.stat.inactive')}
              value={stats?.inactive ?? 0}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title={t('admin.alertsConsole.stat.triggered')}
              value={stats?.triggered_ever ?? 0}
            />
          </Card>
        </Col>
      </Row>

      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder={t('admin.alertsConsole.filter.username')}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onSearch={() => void refresh()}
          style={{ width: 220 }}
        />
        <Select
          allowClear
          placeholder={t('admin.alertsConsole.filter.type')}
          options={typeOptions}
          value={typeFilter}
          onChange={(v) => setTypeFilter(v)}
          style={{ width: 200 }}
        />
        <Select
          value={activeFilter}
          onChange={(v) => setActiveFilter(v)}
          style={{ width: 160 }}
          options={[
            { label: t('admin.alertsConsole.filter.all'), value: 'all' },
            {
              label: t('admin.alertsConsole.filter.activeOnly'),
              value: 'active',
            },
            {
              label: t('admin.alertsConsole.filter.inactiveOnly'),
              value: 'inactive',
            },
          ]}
        />
      </Space>

      <AdminCrudTable<AlertConsoleRow>
        rowKey="id"
        columns={columns}
        data={rows}
        loading={loading}
        emptyDescription={t('admin.alertsConsole.empty')}
      />
    </Box>
  );
};

export default AlertsConsoleMain;
