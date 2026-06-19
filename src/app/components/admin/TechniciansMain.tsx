'use client';

import {
  KeyOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { App, Badge, Button, Form, Input, Space, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Box } from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { PageInfoBar } from '@/app/components/layout/PageInfoBar';
import { AdminCrudTable } from '@/app/components/admin/_shared/AdminCrudTable';
import { AdminEntityDrawer } from '@/app/components/admin/_shared/AdminEntityDrawer';
import { AdminConfirmDelete } from '@/app/components/admin/_shared/AdminConfirmDelete';
import { ExportCsvButton } from '@/app/components/admin/_shared/ExportCsvButton';
import { TechnicianScopeBuilder } from './TechnicianScopeBuilder';
import {
  technicianApi,
  type Technician,
  type ZoneScope,
} from '@/app/lib/technicianApi';

type CreateForm = {
  username: string;
  password: string;
  firstname?: string;
  lastname?: string;
  email?: string;
};

const TechniciansMain = () => {
  const t = useTranslations();
  const { message, modal } = App.useApp();
  const [data, setData] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm<CreateForm>();

  // Create drawer + its scope state.
  const [createOpen, setCreateOpen] = useState(false);
  const [createScope, setCreateScope] = useState<ZoneScope[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Edit-scope drawer.
  const [scopeTarget, setScopeTarget] = useState<Technician | null>(null);
  const [editScope, setEditScope] = useState<ZoneScope[]>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setData(await technicianApi.list());
    } catch {
      message.error(t('admin.technicians.loadError'));
    } finally {
      setLoading(false);
    }
  }, [message, t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openCreate = () => {
    form.resetFields();
    setCreateScope([]);
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    let values: CreateForm;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    setSubmitting(true);
    try {
      await technicianApi.create({ ...values, scope: createScope });
      message.success(t('admin.technicians.created'));
      setCreateOpen(false);
      void refresh();
    } catch {
      message.error(t('admin.technicians.createError'));
    } finally {
      setSubmitting(false);
    }
  };

  const openEditScope = (tech: Technician) => {
    setScopeTarget(tech);
    setEditScope(tech.scope ?? []);
  };

  const submitEditScope = async () => {
    if (!scopeTarget) return;
    setSubmitting(true);
    try {
      await technicianApi.setScope(scopeTarget.id, editScope);
      message.success(t('admin.technicians.scopeSaved'));
      setScopeTarget(null);
      void refresh();
    } catch {
      message.error(t('admin.technicians.scopeError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = useCallback(
    (tech: Technician) => {
      modal.confirm({
        title: t('admin.technicians.resetConfirmTitle', {
          username: tech.username,
        }),
        content: t('admin.technicians.resetConfirmContent'),
        okText: t('admin.technicians.reset'),
        cancelText: t('admin.technicians.cancel'),
        onOk: async () => {
          try {
            const { password } = await technicianApi.resetPassword(tech.id);
            modal.info({
              title: t('admin.technicians.newPasswordTitle'),
              content: (
                <Space direction="vertical">
                  <span>{t('admin.technicians.newPasswordHint')}</span>
                  <code
                    style={{
                      background: 'rgba(0,0,0,0.06)',
                      padding: '4px 8px',
                      borderRadius: 4,
                      userSelect: 'all',
                    }}
                  >
                    {password}
                  </code>
                </Space>
              ),
              okText: t('admin.technicians.close'),
            });
          } catch {
            message.error(t('admin.technicians.resetError'));
          }
        },
      });
    },
    [modal, message, t]
  );

  const columns = useMemo<ColumnsType<Technician>>(
    () => [
      {
        title: t('admin.technicians.col.user'),
        dataIndex: 'username',
        key: 'username',
        sorter: (a, b) => a.username.localeCompare(b.username),
        render: (text: string, row) => (
          <Space direction="vertical" size={0}>
            <strong>{text}</strong>
            <span style={{ fontSize: 12, opacity: 0.7 }}>
              {row.firstname} {row.lastname}
            </span>
          </Space>
        ),
      },
      {
        title: t('admin.technicians.col.email'),
        dataIndex: 'email',
        key: 'email',
      },
      {
        title: t('admin.technicians.col.status'),
        dataIndex: 'is_active',
        key: 'is_active',
        render: (active: boolean) => (
          <Badge
            status={active ? 'success' : 'error'}
            text={
              active
                ? t('admin.technicians.status.active')
                : t('admin.technicians.status.inactive')
            }
          />
        ),
      },
      {
        title: t('admin.technicians.col.zones'),
        key: 'zones',
        align: 'right',
        sorter: (a, b) => (a.scope?.length ?? 0) - (b.scope?.length ?? 0),
        render: (_v, row) => row.scope?.length ?? 0,
      },
      {
        title: t('admin.technicians.col.actions'),
        key: 'actions',
        align: 'right',
        render: (_v, row) => (
          <Space>
            <Tooltip title={t('admin.technicians.action.editScope')}>
              <Button
                icon={<SafetyCertificateOutlined />}
                onClick={() => openEditScope(row)}
                aria-label={t('admin.technicians.action.editScopeAria', {
                  username: row.username,
                })}
              />
            </Tooltip>
            <Tooltip title={t('admin.technicians.action.resetPassword')}>
              <Button
                icon={<KeyOutlined />}
                onClick={() => handleResetPassword(row)}
                aria-label={t('admin.technicians.action.resetAria', {
                  username: row.username,
                })}
              />
            </Tooltip>
            <AdminConfirmDelete
              title={t('admin.technicians.revokeConfirm', {
                username: row.username,
              })}
              successMessage={t('admin.technicians.revoked')}
              onConfirm={async () => {
                await technicianApi.revoke(row.id);
                void refresh();
              }}
              trigger={(busy) => (
                <Tooltip title={t('admin.technicians.action.revoke')}>
                  <Button danger loading={busy}>
                    {t('admin.technicians.action.revoke')}
                  </Button>
                </Tooltip>
              )}
            />
          </Space>
        ),
      },
    ],
    [handleResetPassword, refresh, t]
  );

  const csvHeaders = [
    { label: t('admin.technicians.col.user'), key: 'username' },
    { label: t('admin.technicians.csv.firstname'), key: 'firstname' },
    { label: t('admin.technicians.csv.lastname'), key: 'lastname' },
    { label: t('admin.technicians.col.email'), key: 'email' },
    { label: t('admin.technicians.col.status'), key: 'is_active' },
    { label: t('admin.technicians.col.zones'), key: 'zones_count' },
  ];
  const csvData = data.map((row) => ({
    ...row,
    zones_count: row.scope?.length ?? 0,
  }));

  return (
    <Box px={{ base: 3, md: 4 }} py={{ base: 3, md: 4 }}>
      <PageInfoBar
        title={t('admin.technicians.title')}
        subtitle={t('admin.technicians.subtitle')}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            {t('admin.technicians.newTechnician')}
          </Button>
        }
      />

      <Box
        bg="app.surface"
        borderWidth="1px"
        borderColor="app.border"
        borderRadius="lg"
        px={{ base: 3, md: 4 }}
        py={{ base: 3, md: 4 }}
        minW={0}
      >
        <AdminCrudTable<Technician>
          rowKey="id"
          columns={columns}
          data={data}
          loading={loading}
          searchable
          searchKeys={['username', 'email', 'firstname', 'lastname']}
          searchPlaceholder={t('admin.technicians.searchPlaceholder')}
          emptyDescription={t('admin.technicians.empty')}
          toolbar={
            <ExportCsvButton
              data={csvData}
              headers={csvHeaders}
              filename="technicians"
            />
          }
        />
      </Box>

      {/* Create */}
      <AdminEntityDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={submitCreate}
        submitting={submitting}
        title={t('admin.technicians.newTechnician')}
        submitLabel={t('admin.technicians.create')}
        cancelLabel={t('admin.technicians.cancel')}
        width={560}
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            name="username"
            label={t('admin.technicians.form.username')}
            rules={[{ required: true }]}
          >
            <Input autoComplete="off" />
          </Form.Item>
          <Form.Item
            name="password"
            label={t('admin.technicians.form.password')}
            rules={[{ required: true, min: 6 }]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Space style={{ display: 'flex' }} size="middle">
            <Form.Item
              name="firstname"
              label={t('admin.technicians.form.firstname')}
              style={{ flex: 1 }}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="lastname"
              label={t('admin.technicians.form.lastname')}
              style={{ flex: 1 }}
            >
              <Input />
            </Form.Item>
          </Space>
          <Form.Item
            name="email"
            label={t('admin.technicians.form.email')}
            rules={[{ type: 'email' }]}
          >
            <Input />
          </Form.Item>
        </Form>
        <strong>{t('admin.technicians.form.scope')}</strong>
        <Box mt={2}>
          <TechnicianScopeBuilder
            value={createScope}
            onChange={setCreateScope}
          />
        </Box>
      </AdminEntityDrawer>

      {/* Edit scope */}
      <AdminEntityDrawer
        open={scopeTarget !== null}
        onClose={() => setScopeTarget(null)}
        onSubmit={submitEditScope}
        submitting={submitting}
        title={t('admin.technicians.editScopeTitle', {
          username: scopeTarget?.username ?? '',
        })}
        submitLabel={t('admin.technicians.save')}
        cancelLabel={t('admin.technicians.cancel')}
        width={560}
      >
        <TechnicianScopeBuilder value={editScope} onChange={setEditScope} />
      </AdminEntityDrawer>
    </Box>
  );
};

export default TechniciansMain;
