'use client';

import { App, Input, Select, Space, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Box } from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { AdminCrudTable } from '@/app/components/admin/_shared/AdminCrudTable';
import { ExportCsvButton } from '@/app/components/admin/_shared/ExportCsvButton';
import { PageInfoBar } from '@/app/components/layout/PageInfoBar';
import MonitoringNav from '@/app/components/admin/monitoring/MonitoringNav';
import {
  adminMonitoringApi,
  type DeliveryLog,
} from '@/app/lib/adminMonitoringApi';
import { fmtDateTime, localeTag } from '@/app/lib/datetime';

const statusColor = (s: string): string =>
  s === 'sent' ? 'green' : s === 'failed' ? 'volcano' : 'default';

const MonitoringDeliveriesMain = () => {
  const t = useTranslations();
  const tag = localeTag(useLocale());
  const { message } = App.useApp();

  const [rows, setRows] = useState<DeliveryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [channel, setChannel] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await adminMonitoringApi.deliveries({
        username: username.trim() || undefined,
        channel,
        status,
      });
      setRows(list);
    } catch {
      message.error(t('admin.common.loadError'));
    } finally {
      setLoading(false);
    }
  }, [username, channel, status, message, t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const columns: ColumnsType<DeliveryLog> = [
    {
      title: t('admin.monitoring.deliveries.col.channel'),
      dataIndex: 'channel',
      key: 'channel',
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: t('admin.monitoring.deliveries.col.kind'),
      dataIndex: 'kind',
      key: 'kind',
      render: (v: string) => v || '—',
    },
    {
      title: t('admin.monitoring.deliveries.col.recipient'),
      dataIndex: 'recipient',
      key: 'recipient',
    },
    {
      title: t('admin.monitoring.deliveries.col.user'),
      dataIndex: 'username',
      key: 'username',
      render: (v: string | null) => v ?? '—',
    },
    {
      title: t('admin.monitoring.deliveries.col.status'),
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => (
        <Tag color={statusColor(v)}>
          {t(`admin.monitoring.deliveries.status.${v}`)}
        </Tag>
      ),
    },
    {
      title: t('admin.monitoring.deliveries.col.error'),
      dataIndex: 'error',
      key: 'error',
      ellipsis: true,
      render: (v: string) => v || '—',
    },
    {
      title: t('admin.monitoring.deliveries.col.at'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (iso: string | null) => fmtDateTime(iso, tag),
    },
  ];

  const csvHeaders = [
    { label: t('admin.monitoring.deliveries.col.channel'), key: 'channel' },
    { label: t('admin.monitoring.deliveries.col.kind'), key: 'kind' },
    { label: t('admin.monitoring.deliveries.col.recipient'), key: 'recipient' },
    { label: t('admin.monitoring.deliveries.col.user'), key: 'username' },
    { label: t('admin.monitoring.deliveries.col.status'), key: 'status' },
    { label: t('admin.monitoring.deliveries.col.error'), key: 'error' },
    { label: t('admin.monitoring.deliveries.col.at'), key: 'created_at' },
  ];

  return (
    <Box px={{ base: 3, md: 4 }} py={{ base: 3, md: 4 }}>
      <PageInfoBar
        title={t('admin.monitoring.deliveries.title')}
        subtitle={t('admin.monitoring.deliveries.subtitle')}
        actions={
          <ExportCsvButton<DeliveryLog>
            data={rows}
            headers={csvHeaders}
            filename="deliveries"
          />
        }
      />
      <MonitoringNav />

      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder={t('admin.monitoring.deliveries.filter.username')}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onSearch={() => void refresh()}
          style={{ width: 220 }}
        />
        <Select
          allowClear
          placeholder={t('admin.monitoring.deliveries.filter.channel')}
          value={channel}
          onChange={(v) => setChannel(v)}
          style={{ width: 160 }}
          options={[
            { label: 'email', value: 'email' },
            { label: 'sms', value: 'sms' },
            { label: 'whatsapp', value: 'whatsapp' },
          ]}
        />
        <Select
          allowClear
          placeholder={t('admin.monitoring.deliveries.filter.status')}
          value={status}
          onChange={(v) => setStatus(v)}
          style={{ width: 160 }}
          options={[
            { label: t('admin.monitoring.deliveries.status.sent'), value: 'sent' },
            { label: t('admin.monitoring.deliveries.status.failed'), value: 'failed' },
            { label: t('admin.monitoring.deliveries.status.skipped'), value: 'skipped' },
          ]}
        />
      </Space>

      <AdminCrudTable<DeliveryLog>
        rowKey="id"
        columns={columns}
        data={rows}
        loading={loading}
        emptyDescription={t('admin.monitoring.deliveries.empty')}
      />
    </Box>
  );
};

export default MonitoringDeliveriesMain;
