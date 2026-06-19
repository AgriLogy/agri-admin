'use client';

import { App, Input, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Box } from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { AdminCrudTable } from '@/app/components/admin/_shared/AdminCrudTable';
import { AdminConfirmDelete } from '@/app/components/admin/_shared/AdminConfirmDelete';
import { ExportCsvButton } from '@/app/components/admin/_shared/ExportCsvButton';
import { PageInfoBar } from '@/app/components/layout/PageInfoBar';
import RecordsNav from '@/app/components/admin/records/RecordsNav';
import { fmtDateTime, localeTag } from '@/app/components/admin/records/recordsFmt';
import {
  adminRecordsApi,
  type NotificationRow,
} from '@/app/lib/adminRecordsApi';

const RecordsNotificationsMain = () => {
  const t = useTranslations();
  const tag = localeTag(useLocale());
  const { message } = App.useApp();

  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await adminRecordsApi.notifications(username.trim() || undefined));
    } catch {
      message.error(t('admin.common.loadError'));
    } finally {
      setLoading(false);
    }
  }, [username, message, t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const remove = async (id: number) => {
    await adminRecordsApi.deleteNotification(id);
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const columns: ColumnsType<NotificationRow> = [
    {
      title: t('admin.records.notifications.col.user'),
      dataIndex: 'username',
      key: 'username',
      render: (v: string | null) => v ?? '—',
    },
    {
      title: t('admin.records.notifications.col.date'),
      dataIndex: 'notification_date',
      key: 'notification_date',
      render: (iso: string | null) => fmtDateTime(iso, tag),
    },
    {
      title: t('admin.records.notifications.col.temp'),
      dataIndex: 'today_temperature',
      key: 'today_temperature',
      render: (v: number | null) => (v == null ? '—' : `${v} °C`),
    },
    {
      title: t('admin.records.notifications.col.humidity'),
      dataIndex: 'today_humidity',
      key: 'today_humidity',
      render: (v: number | null) => (v == null ? '—' : `${v} %`),
    },
    {
      title: t('admin.records.notifications.col.et0'),
      dataIndex: 'ET0',
      key: 'ET0',
      render: (v: number | null) => (v == null ? '—' : v),
    },
    {
      title: t('admin.records.notifications.col.period'),
      dataIndex: 'perfect_irrigation_period',
      key: 'perfect_irrigation_period',
      render: (v: string) => v || '—',
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      render: (_v, r) => <AdminConfirmDelete onConfirm={() => remove(r.id)} />,
    },
  ];

  const csvHeaders = [
    { label: t('admin.records.notifications.col.user'), key: 'username' },
    { label: t('admin.records.notifications.col.date'), key: 'notification_date' },
    { label: t('admin.records.notifications.col.temp'), key: 'today_temperature' },
    { label: t('admin.records.notifications.col.humidity'), key: 'today_humidity' },
    { label: t('admin.records.notifications.col.et0'), key: 'ET0' },
    { label: t('admin.records.notifications.col.period'), key: 'perfect_irrigation_period' },
  ];

  return (
    <Box px={{ base: 3, md: 4 }} py={{ base: 3, md: 4 }}>
      <PageInfoBar
        title={t('admin.records.notifications.title')}
        subtitle={t('admin.records.notifications.subtitle')}
        actions={
          <ExportCsvButton<NotificationRow>
            data={rows}
            headers={csvHeaders}
            filename="notifications"
          />
        }
      />
      <RecordsNav />
      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder={t('admin.records.notifications.col.user')}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onSearch={() => void refresh()}
          style={{ width: 220 }}
        />
      </Space>
      <AdminCrudTable<NotificationRow>
        rowKey="id"
        columns={columns}
        data={rows}
        loading={loading}
        emptyDescription={t('admin.records.notifications.empty')}
      />
    </Box>
  );
};

export default RecordsNotificationsMain;
