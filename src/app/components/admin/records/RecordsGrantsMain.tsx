'use client';

import { App, Input, Space, Switch } from 'antd';
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
import { adminRecordsApi, type GrantRow } from '@/app/lib/adminRecordsApi';

const RecordsGrantsMain = () => {
  const t = useTranslations();
  const tag = localeTag(useLocale());
  const { message } = App.useApp();

  const [rows, setRows] = useState<GrantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [owner, setOwner] = useState('');
  const [technician, setTechnician] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRows(
        await adminRecordsApi.grants({
          owner: owner.trim() || undefined,
          technician: technician.trim() || undefined,
        })
      );
    } catch {
      message.error(t('admin.common.loadError'));
    } finally {
      setLoading(false);
    }
  }, [owner, technician, message, t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggle = async (row: GrantRow, next: boolean) => {
    try {
      await adminRecordsApi.setGrantActive(row.id, next);
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, is_active: next } : r))
      );
    } catch {
      message.error(t('admin.common.saveError'));
    }
  };

  const revoke = async (id: number) => {
    await adminRecordsApi.revokeGrant(id);
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const columns: ColumnsType<GrantRow> = [
    {
      title: t('admin.records.grants.col.technician'),
      dataIndex: 'technician',
      key: 'technician',
      render: (v: string | null) => v ?? '—',
    },
    {
      title: t('admin.records.grants.col.owner'),
      dataIndex: 'owner',
      key: 'owner',
      render: (v: string | null) => v ?? '—',
    },
    {
      title: t('admin.records.grants.col.created'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (iso: string | null) => fmtDateTime(iso, tag),
    },
    {
      title: t('admin.records.grants.col.active'),
      key: 'is_active',
      align: 'center',
      render: (_v, r) => (
        <Switch
          checked={r.is_active}
          size="small"
          onChange={(next) => void toggle(r, next)}
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      render: (_v, r) => <AdminConfirmDelete onConfirm={() => revoke(r.id)} />,
    },
  ];

  const csvHeaders = [
    { label: t('admin.records.grants.col.technician'), key: 'technician' },
    { label: t('admin.records.grants.col.owner'), key: 'owner' },
    { label: t('admin.records.grants.col.created'), key: 'created_at' },
    { label: t('admin.records.grants.col.active'), key: 'is_active' },
  ];

  return (
    <Box px={{ base: 3, md: 4 }} py={{ base: 3, md: 4 }}>
      <PageInfoBar
        title={t('admin.records.grants.title')}
        subtitle={t('admin.records.grants.subtitle')}
        actions={
          <ExportCsvButton<GrantRow>
            data={rows}
            headers={csvHeaders}
            filename="technician-grants"
          />
        }
      />
      <RecordsNav />
      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder={t('admin.records.grants.col.owner')}
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          onSearch={() => void refresh()}
          style={{ width: 200 }}
        />
        <Input.Search
          allowClear
          placeholder={t('admin.records.grants.col.technician')}
          value={technician}
          onChange={(e) => setTechnician(e.target.value)}
          onSearch={() => void refresh()}
          style={{ width: 200 }}
        />
      </Space>
      <AdminCrudTable<GrantRow>
        rowKey="id"
        columns={columns}
        data={rows}
        loading={loading}
        emptyDescription={t('admin.records.grants.empty')}
      />
    </Box>
  );
};

export default RecordsGrantsMain;
