'use client';

/**
 * Assistant knowledge base (AgriLogy/agri-api#461 phase 2): staff write
 * agronomy articles, send them for review, approve and archive them. Only
 * approved articles are searched by the Agrogo assistant and cited to farmers.
 */
import {
  Alert,
  App,
  Button,
  DatePicker,
  Form,
  Input,
  Segmented,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Box } from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { AdminConfirmDelete } from '@/app/components/admin/_shared/AdminConfirmDelete';
import { AdminCrudTable } from '@/app/components/admin/_shared/AdminCrudTable';
import { AdminEntityDrawer } from '@/app/components/admin/_shared/AdminEntityDrawer';
import { PageInfoBar } from '@/app/components/layout/PageInfoBar';
import {
  KNOWLEDGE_LANGUAGES,
  KNOWLEDGE_STATUSES,
  adminKnowledgeApi,
  approvalBlocker,
  articleToFormValues,
  buildKnowledgePayload,
  isRtl,
  statusActions,
  type KnowledgeArticle,
  type KnowledgeFormValues,
  type KnowledgeLanguage,
  type KnowledgeList,
  type KnowledgeStatus,
} from '@/app/lib/adminKnowledgeApi';

const STATUS_COLOR: Record<KnowledgeStatus, string> = {
  draft: 'default',
  review: 'gold',
  approved: 'green',
  archived: 'purple',
};

const DEFAULT_TOPICS = [
  'irrigation',
  'crops',
  'soil',
  'nutrition',
  'weather',
  'crop_problems',
  'equipment',
  'other',
];

type StatusFilter = KnowledgeStatus | 'all';

const serverDetail = (err: unknown): string | undefined => {
  const data = (err as { response?: { data?: { detail?: unknown } } })?.response
    ?.data;
  return typeof data?.detail === 'string' ? data.detail : undefined;
};

const KnowledgeMain = () => {
  const t = useTranslations('admin.knowledge');
  const tc = useTranslations('admin.common');
  const { message } = App.useApp();
  const [form] = Form.useForm<KnowledgeFormValues>();

  const [list, setList] = useState<KnowledgeList | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [topic, setTopic] = useState<string | undefined>();
  const [language, setLanguage] = useState<KnowledgeLanguage | undefined>();
  const [query, setQuery] = useState('');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<KnowledgeArticle | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const formLanguage = Form.useWatch('language', form);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setList(
        await adminKnowledgeApi.list({
          status: status === 'all' ? undefined : status,
          topic,
          language,
          q: query.trim() || undefined,
        })
      );
    } catch {
      message.error(tc('loadError'));
    } finally {
      setLoading(false);
    }
    // `query` is applied on search/enter, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, topic, language, message, tc]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const topics = list?.topics?.length ? list.topics : DEFAULT_TOPICS;
  const counts = list?.counts ?? {};
  const total = KNOWLEDGE_STATUSES.reduce((n, s) => n + (counts[s] ?? 0), 0);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ language: 'fr', topic: 'irrigation', sources: [] });
    setDrawerOpen(true);
  };

  const openEdit = (row: KnowledgeArticle) => {
    setEditing(row);
    form.resetFields();
    form.setFieldsValue(articleToFormValues(row));
    setDrawerOpen(true);
  };

  const submit = async (sendForReview = false) => {
    const values = await form.validateFields();
    const payload = buildKnowledgePayload(values);
    setSubmitting(true);
    try {
      if (editing) {
        const saved = await adminKnowledgeApi.update(editing.id, payload);
        message.success(
          editing.status === 'approved' && saved.status === 'review'
            ? t('backToReview')
            : t('updated')
        );
      } else {
        await adminKnowledgeApi.create({
          ...payload,
          status: sendForReview ? 'review' : 'draft',
        });
        message.success(t('created'));
      }
      setDrawerOpen(false);
      await refresh();
    } catch (err) {
      message.error(serverDetail(err) ?? tc('saveError'));
    } finally {
      setSubmitting(false);
    }
  };

  const changeStatus = async (row: KnowledgeArticle, next: KnowledgeStatus) => {
    try {
      await adminKnowledgeApi.setStatus(row.id, next);
      message.success(t(`statusChanged.${next}`));
      await refresh();
    } catch (err) {
      message.error(serverDetail(err) ?? tc('saveError'));
    }
  };

  const remove = async (id: number) => {
    await adminKnowledgeApi.remove(id);
    await refresh();
  };

  const columns: ColumnsType<KnowledgeArticle> = useMemo(
    () => [
      {
        title: t('col.title'),
        dataIndex: 'title',
        key: 'title',
        render: (_v, r) => (
          <span dir={isRtl(r.language) ? 'rtl' : 'auto'}>{r.title}</span>
        ),
      },
      {
        title: t('col.language'),
        dataIndex: 'language',
        key: 'language',
        render: (v: KnowledgeLanguage) => <Tag>{t(`language.${v}`)}</Tag>,
      },
      {
        title: t('col.topic'),
        dataIndex: 'topic',
        key: 'topic',
        render: (v: string) => t(`topic.${v}`),
      },
      {
        title: t('col.status'),
        dataIndex: 'status',
        key: 'status',
        render: (v: KnowledgeStatus) => (
          <Tag color={STATUS_COLOR[v]}>{t(`status.${v}`)}</Tag>
        ),
      },
      {
        title: t('col.reviewDue'),
        dataIndex: 'review_due',
        key: 'review_due',
        render: (v: string | null, r) =>
          v ? (
            r.review_overdue ? (
              <Tooltip title={t('overdueHelp')}>
                <Tag color="red" data-testid="overdue">
                  {v}
                </Tag>
              </Tooltip>
            ) : (
              v
            )
          ) : (
            '—'
          ),
      },
      {
        title: t('col.sources'),
        key: 'sources',
        render: (_v, r) => r.sources.length,
      },
      {
        title: '',
        key: 'actions',
        align: 'right',
        render: (_v, r) => (
          <Space size="small" wrap>
            {statusActions(r.status).map((next) => {
              const blocked = next === 'approved' && approvalBlocker(r);
              return (
                <Tooltip
                  key={next}
                  title={blocked ? t('approveNeedsSource') : undefined}
                >
                  <Button
                    size="small"
                    type={next === 'approved' ? 'primary' : 'default'}
                    disabled={!!blocked}
                    onClick={() => void changeStatus(r, next)}
                  >
                    {t(`action.${next}`)}
                  </Button>
                </Tooltip>
              );
            })}
            <Button type="link" size="small" onClick={() => openEdit(r)}>
              {tc('edit')}
            </Button>
            <AdminConfirmDelete onConfirm={() => remove(r.id)} />
          </Space>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, tc]
  );

  const rtl = formLanguage ? isRtl(formLanguage) : false;

  return (
    <Box px={{ base: 3, md: 4 }} py={{ base: 3, md: 4 }}>
      <PageInfoBar
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <Button
            type="primary"
            onClick={openCreate}
            disabled={list?.available === false}
          >
            {t('new')}
          </Button>
        }
      />

      {list?.available === false && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={t('unavailable')}
          description={list.detail}
        />
      )}

      <Space wrap style={{ marginBottom: 16 }}>
        <Segmented<StatusFilter>
          value={status}
          onChange={setStatus}
          options={[
            { value: 'all', label: `${t('status.all')} (${total})` },
            ...KNOWLEDGE_STATUSES.map((s) => ({
              value: s,
              label: `${t(`status.${s}`)} (${counts[s] ?? 0})`,
            })),
          ]}
        />
        <Select
          allowClear
          placeholder={t('col.topic')}
          value={topic}
          onChange={setTopic}
          style={{ width: 180 }}
          options={topics.map((v) => ({ value: v, label: t(`topic.${v}`) }))}
        />
        <Select
          allowClear
          placeholder={t('col.language')}
          value={language}
          onChange={setLanguage}
          style={{ width: 160 }}
          options={KNOWLEDGE_LANGUAGES.map((v) => ({
            value: v,
            label: t(`language.${v}`),
          }))}
        />
        <Input.Search
          allowClear
          placeholder={t('searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onSearch={() => void refresh()}
          style={{ width: 240 }}
        />
      </Space>

      <AdminCrudTable<KnowledgeArticle>
        rowKey="id"
        columns={columns}
        data={list?.items ?? []}
        loading={loading}
        emptyDescription={t('empty')}
      />

      <AdminEntityDrawer
        open={drawerOpen}
        title={editing ? t('editTitle') : t('new')}
        onClose={() => setDrawerOpen(false)}
        onSubmit={() => void submit(false)}
        submitting={submitting}
        submitLabel={editing ? undefined : t('saveDraft')}
        width={720}
      >
        {editing?.status === 'approved' && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message={t('editApprovedWarning')}
          />
        )}
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label={t('field.title')}
            rules={[{ required: true, whitespace: true, max: 200 }]}
          >
            <Input dir="auto" />
          </Form.Item>
          <Space wrap>
            <Form.Item
              name="language"
              label={t('field.language')}
              rules={[{ required: true }]}
            >
              <Select
                style={{ width: 200 }}
                options={KNOWLEDGE_LANGUAGES.map((v) => ({
                  value: v,
                  label: t(`language.${v}`),
                }))}
              />
            </Form.Item>
            <Form.Item
              name="topic"
              label={t('field.topic')}
              rules={[{ required: true }]}
            >
              <Select
                style={{ width: 200 }}
                options={topics.map((v) => ({
                  value: v,
                  label: t(`topic.${v}`),
                }))}
              />
            </Form.Item>
            <Form.Item name="review_due" label={t('field.reviewDue')}>
              <DatePicker />
            </Form.Item>
          </Space>
          <Form.Item
            name="crops"
            label={t('field.crops')}
            extra={t('field.cropsHelp')}
          >
            <Select mode="tags" tokenSeparators={[',']} open={false} />
          </Form.Item>
          <Form.Item
            name="keywords"
            label={t('field.keywords')}
            extra={t('field.keywordsHelp')}
          >
            <Input.TextArea dir="auto" autoSize={{ minRows: 2, maxRows: 4 }} />
          </Form.Item>
          <Form.Item
            name="body"
            label={t('field.body')}
            extra={t('field.bodyHelp')}
            rules={[{ required: true, whitespace: true, max: 20000 }]}
          >
            <Input.TextArea
              dir={rtl ? 'rtl' : 'auto'}
              autoSize={{ minRows: 10, maxRows: 24 }}
            />
          </Form.Item>

          <Typography.Text strong>{t('field.sources')}</Typography.Text>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
            {t('field.sourcesHelp')}
          </Typography.Paragraph>
          <Form.List name="sources">
            {(fields, { add, remove: rm }) => (
              <Space direction="vertical" style={{ width: '100%' }}>
                {fields.map((field) => (
                  <Space key={field.key} align="baseline" wrap>
                    <Form.Item
                      name={[field.name, 'title']}
                      rules={[{ required: true, whitespace: true, max: 200 }]}
                      style={{ marginBottom: 8 }}
                    >
                      <Input
                        placeholder={t('field.sourceTitle')}
                        style={{ width: 260 }}
                      />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, 'url']}
                      rules={[{ type: 'url', max: 500 }]}
                      style={{ marginBottom: 8 }}
                    >
                      <Input placeholder="https://…" style={{ width: 280 }} />
                    </Form.Item>
                    <Button type="link" danger onClick={() => rm(field.name)}>
                      {tc('delete')}
                    </Button>
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} block>
                  {t('addSource')}
                </Button>
              </Space>
            )}
          </Form.List>

          {!editing && (
            <Button
              style={{ marginTop: 16 }}
              onClick={() => void submit(true)}
              loading={submitting}
            >
              {t('saveAndSubmit')}
            </Button>
          )}
        </Form>
      </AdminEntityDrawer>
    </Box>
  );
};

export default KnowledgeMain;
