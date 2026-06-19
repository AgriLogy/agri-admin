'use client';

import { App, Input, Space, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { useLocale, useTranslations } from 'next-intl';

import { AdminCrudTable } from '@/app/components/admin/_shared/AdminCrudTable';
import { ExportCsvButton } from '@/app/components/admin/_shared/ExportCsvButton';
import { PageInfoBar } from '@/app/components/layout/PageInfoBar';
import { adminAuditApi, type AuditEvent } from '@/app/lib/adminAuditApi';

const localeTag = (l: string) =>
  l === 'ar' ? 'ar' : l === 'en' ? 'en-GB' : 'fr-FR';
const fmt = (iso: string | null, tag: string) =>
  iso ? new Date(iso).toLocaleString(tag) : '—';

const AuditMain = () => {
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
      title: t('admin.audit.col.when'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v: string | null) => fmt(v, tag),
    },
    {
      title: t('admin.audit.col.actor'),
      dataIndex: 'actor',
      key: 'actor',
      render: (v: string | null) => v ?? '—',
    },
    {
      title: t('admin.audit.col.action'),
      dataIndex: 'action',
      key: 'action',
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: t('admin.audit.col.target'),
      key: 'target',
      render: (_v, r) =>
        r.target_type ? `${r.target_type}#${r.target_id}` : '—',
    },
    {
      title: t('admin.audit.col.changes'),
      dataIndex: 'changes',
      key: 'changes',
      render: (v: Record<string, unknown>) => {
        const s = JSON.stringify(v ?? {});
        return s === '{}' ? '—' : s.length > 60 ? `${s.slice(0, 60)}…` : s;
      },
    },
  ];

  const csvHeaders = [
    { label: t('admin.audit.col.when'), key: 'created_at' },
    { label: t('admin.audit.col.actor'), key: 'actor' },
    { label: t('admin.audit.col.action'), key: 'action' },
    { label: t('admin.audit.col.target'), key: 'target_type' },
    { label: 'target_id', key: 'target_id' },
  ];

  return (
    <Box px={{ base: 3, md: 4 }} py={{ base: 3, md: 4 }}>
      <PageInfoBar
        title={t('admin.audit.title')}
        subtitle={t('admin.audit.subtitle')}
        actions={
          <ExportCsvButton<AuditEvent>
            data={rows}
            headers={csvHeaders}
            filename="audit"
          />
        }
      />
      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder={t('admin.audit.filter.actor')}
          value={actor}
          onChange={(e) => setActor(e.target.value)}
          onSearch={() => void refresh()}
          style={{ width: 200 }}
        />
        <Input.Search
          allowClear
          placeholder={t('admin.audit.filter.action')}
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
        emptyDescription={t('admin.audit.empty')}
      />
    </Box>
  );
};

export default AuditMain;
