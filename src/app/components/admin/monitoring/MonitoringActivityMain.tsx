'use client';

import { App, Input, Select, Space, Tabs, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Box } from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { AdminCrudTable } from '@/app/components/admin/_shared/AdminCrudTable';
import { PageInfoBar } from '@/app/components/layout/PageInfoBar';
import MonitoringNav from '@/app/components/admin/monitoring/MonitoringNav';
import {
  adminMonitoringApi,
  type LoginEvent,
} from '@/app/lib/adminMonitoringApi';
import { adminAuditApi, type AuditEvent } from '@/app/lib/adminAuditApi';
import { fmtDateTime, localeTag } from '@/app/lib/datetime';

const LoginsTab = () => {
  const t = useTranslations();
  const tag = localeTag(useLocale());
  const { message } = App.useApp();

  const [rows, setRows] = useState<LoginEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [outcome, setOutcome] = useState<'all' | 'ok' | 'fail'>('all');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await adminMonitoringApi.logins({
        username: username.trim() || undefined,
        success: outcome === 'all' ? undefined : outcome === 'ok',
      });
      setRows(list);
    } catch {
      message.error(t('admin.common.loadError'));
    } finally {
      setLoading(false);
    }
  }, [username, outcome, message, t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const columns: ColumnsType<LoginEvent> = [
    {
      title: t('admin.monitoring.activity.login.user'),
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: t('admin.monitoring.activity.login.outcome'),
      dataIndex: 'success',
      key: 'success',
      render: (v: boolean) => (
        <Tag color={v ? 'green' : 'volcano'}>
          {v
            ? t('admin.monitoring.activity.login.ok')
            : t('admin.monitoring.activity.login.fail')}
        </Tag>
      ),
    },
    {
      title: t('admin.monitoring.activity.login.ip'),
      dataIndex: 'ip',
      key: 'ip',
    },
    {
      title: t('admin.monitoring.activity.login.agent'),
      dataIndex: 'user_agent',
      key: 'user_agent',
      ellipsis: true,
      render: (v: string) => v || '—',
    },
    {
      title: t('admin.monitoring.activity.login.at'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (iso: string | null) => fmtDateTime(iso, tag),
    },
  ];

  return (
    <>
      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder={t('admin.monitoring.activity.login.user')}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onSearch={() => void refresh()}
          style={{ width: 220 }}
        />
        <Select
          value={outcome}
          onChange={(v) => setOutcome(v)}
          style={{ width: 160 }}
          options={[
            { label: t('admin.monitoring.activity.login.all'), value: 'all' },
            { label: t('admin.monitoring.activity.login.ok'), value: 'ok' },
            { label: t('admin.monitoring.activity.login.fail'), value: 'fail' },
          ]}
        />
      </Space>
      <AdminCrudTable<LoginEvent>
        rowKey="id"
        columns={columns}
        data={rows}
        loading={loading}
        emptyDescription={t('admin.monitoring.activity.login.empty')}
      />
    </>
  );
};

const AuditTab = () => {
  const t = useTranslations();
  const tag = localeTag(useLocale());
  const { message } = App.useApp();

  const [rows, setRows] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [actor, setActor] = useState('');
  const [action, setAction] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await adminAuditApi.list({
        actor: actor.trim() || undefined,
        action: action.trim() || undefined,
      });
      setRows(list);
    } catch {
      message.error(t('admin.common.loadError'));
    } finally {
      setLoading(false);
    }
  }, [actor, action, message, t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const columns: ColumnsType<AuditEvent> = [
    {
      title: t('admin.monitoring.activity.audit.actor'),
      dataIndex: 'actor',
      key: 'actor',
      render: (v: string | null) => v ?? '—',
    },
    {
      title: t('admin.monitoring.activity.audit.action'),
      dataIndex: 'action',
      key: 'action',
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: t('admin.monitoring.activity.audit.target'),
      key: 'target',
      render: (_v, r) =>
        `${r.target_type}${r.target_id ? ` #${r.target_id}` : ''}`,
    },
    {
      title: t('admin.monitoring.activity.audit.at'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (iso: string | null) => fmtDateTime(iso, tag),
    },
  ];

  return (
    <>
      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder={t('admin.monitoring.activity.audit.actor')}
          value={actor}
          onChange={(e) => setActor(e.target.value)}
          onSearch={() => void refresh()}
          style={{ width: 200 }}
        />
        <Input.Search
          allowClear
          placeholder={t('admin.monitoring.activity.audit.action')}
          value={action}
          onChange={(e) => setAction(e.target.value)}
          onSearch={() => void refresh()}
          style={{ width: 200 }}
        />
      </Space>
      <AdminCrudTable<AuditEvent>
        rowKey="id"
        columns={columns}
        data={rows}
        loading={loading}
        emptyDescription={t('admin.monitoring.activity.audit.empty')}
      />
    </>
  );
};

const MonitoringActivityMain = () => {
  const t = useTranslations();

  return (
    <Box px={{ base: 3, md: 4 }} py={{ base: 3, md: 4 }}>
      <PageInfoBar
        title={t('admin.monitoring.activity.title')}
        subtitle={t('admin.monitoring.activity.subtitle')}
      />
      <MonitoringNav />
      <Tabs
        items={[
          {
            key: 'logins',
            label: t('admin.monitoring.activity.tab.logins'),
            children: <LoginsTab />,
          },
          {
            key: 'audit',
            label: t('admin.monitoring.activity.tab.audit'),
            children: <AuditTab />,
          },
        ]}
      />
    </Box>
  );
};

export default MonitoringActivityMain;
