'use client';

import { App, Button, Drawer, Input, List, Space, Tabs, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Box } from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { AdminCrudTable } from '@/app/components/admin/_shared/AdminCrudTable';
import { AdminConfirmDelete } from '@/app/components/admin/_shared/AdminConfirmDelete';
import { PageInfoBar } from '@/app/components/layout/PageInfoBar';
import RecordsNav from '@/app/components/admin/records/RecordsNav';
import { fmtDateTime, localeTag } from '@/app/components/admin/records/recordsFmt';
import {
  adminRecordsApi,
  type ConversationDetail,
  type ConversationRow,
  type ProactiveRow,
} from '@/app/lib/adminRecordsApi';

const ConversationsTab = () => {
  const t = useTranslations();
  const tag = localeTag(useLocale());
  const { message } = App.useApp();

  const [rows, setRows] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await adminRecordsApi.conversations(username.trim() || undefined));
    } catch {
      message.error(t('admin.common.loadError'));
    } finally {
      setLoading(false);
    }
  }, [username, message, t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const view = async (id: number) => {
    try {
      setDetail(await adminRecordsApi.conversation(id));
      setOpen(true);
    } catch {
      message.error(t('admin.common.loadError'));
    }
  };

  const remove = async (id: number) => {
    await adminRecordsApi.deleteConversation(id);
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const columns: ColumnsType<ConversationRow> = [
    {
      title: t('admin.records.conversations.col.user'),
      dataIndex: 'username',
      key: 'username',
      render: (v: string | null) => v ?? '—',
    },
    {
      title: t('admin.records.conversations.col.title'),
      dataIndex: 'title',
      key: 'title',
      render: (v: string) => v || '—',
    },
    {
      title: t('admin.records.conversations.col.messages'),
      dataIndex: 'message_count',
      key: 'message_count',
    },
    {
      title: t('admin.records.conversations.col.updated'),
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (iso: string | null) => fmtDateTime(iso, tag),
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      render: (_v, r) => (
        <Space size="small">
          <a onClick={() => void view(r.id)}>
            {t('admin.records.conversations.view')}
          </a>
          <AdminConfirmDelete onConfirm={() => remove(r.id)} />
        </Space>
      ),
    },
  ];

  return (
    <>
      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder={t('admin.records.conversations.col.user')}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onSearch={() => void refresh()}
          style={{ width: 220 }}
        />
      </Space>
      <AdminCrudTable<ConversationRow>
        rowKey="id"
        columns={columns}
        data={rows}
        loading={loading}
        emptyDescription={t('admin.records.conversations.empty')}
      />
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        width={520}
        title={detail?.title || t('admin.records.conversations.transcript')}
      >
        {detail && (
          <List
            dataSource={detail.messages}
            renderItem={(m, i) => (
              <List.Item key={i}>
                <Box>
                  <Tag color={m.role === 'user' ? 'blue' : 'green'}>
                    {m.role ?? '—'}
                  </Tag>
                  <Box mt={1} whiteSpace="pre-wrap">
                    {String(m.content ?? '')}
                  </Box>
                </Box>
              </List.Item>
            )}
          />
        )}
      </Drawer>
    </>
  );
};

const ProactiveTab = () => {
  const t = useTranslations();
  const tag = localeTag(useLocale());
  const { message } = App.useApp();

  const [rows, setRows] = useState<ProactiveRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await adminRecordsApi.proactiveNotices());
    } catch {
      message.error(t('admin.common.loadError'));
    } finally {
      setLoading(false);
    }
  }, [message, t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const reset = async (id: number) => {
    await adminRecordsApi.resetProactive(id);
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const columns: ColumnsType<ProactiveRow> = [
    {
      title: t('admin.records.proactive.col.user'),
      dataIndex: 'username',
      key: 'username',
      render: (v: string | null) => v ?? '—',
    },
    {
      title: t('admin.records.proactive.col.lastSent'),
      dataIndex: 'last_sent',
      key: 'last_sent',
      render: (iso: string | null) => fmtDateTime(iso, tag),
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      render: (_v, r) => (
        <AdminConfirmDelete
          onConfirm={() => reset(r.id)}
          title={t('admin.records.proactive.resetConfirm')}
          trigger={(loading) => (
            <Button danger size="small" loading={loading}>
              {t('admin.records.proactive.reset')}
            </Button>
          )}
        />
      ),
    },
  ];

  return (
    <AdminCrudTable<ProactiveRow>
      rowKey="id"
      columns={columns}
      data={rows}
      loading={loading}
      emptyDescription={t('admin.records.proactive.empty')}
    />
  );
};

const RecordsConversationsMain = () => {
  const t = useTranslations();
  return (
    <Box px={{ base: 3, md: 4 }} py={{ base: 3, md: 4 }}>
      <PageInfoBar
        title={t('admin.records.conversations.title')}
        subtitle={t('admin.records.conversations.subtitle')}
      />
      <RecordsNav />
      <Tabs
        items={[
          {
            key: 'conversations',
            label: t('admin.records.conversations.tab.conversations'),
            children: <ConversationsTab />,
          },
          {
            key: 'proactive',
            label: t('admin.records.conversations.tab.proactive'),
            children: <ProactiveTab />,
          },
        ]}
      />
    </Box>
  );
};

export default RecordsConversationsMain;
