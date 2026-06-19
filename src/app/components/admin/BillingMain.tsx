'use client';

import {
  App,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Tabs,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { useLocale, useTranslations } from 'next-intl';

import { AdminCrudTable } from '@/app/components/admin/_shared/AdminCrudTable';
import { AdminConfirmDelete } from '@/app/components/admin/_shared/AdminConfirmDelete';
import { PageInfoBar } from '@/app/components/layout/PageInfoBar';
import {
  adminBillingApi,
  type Invoice,
  type Plan,
  type Subscription,
} from '@/app/lib/adminBillingApi';

const localeTag = (l: string) =>
  l === 'ar' ? 'ar' : l === 'en' ? 'en-GB' : 'fr-FR';
const fmt = (iso: string | null, tag: string) =>
  iso ? new Date(iso).toLocaleString(tag) : '—';

const BillingMain = () => {
  const t = useTranslations();
  const tag = localeTag(useLocale());
  const { message } = App.useApp();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const [planModal, setPlanModal] = useState<Plan | 'new' | null>(null);
  const [subModal, setSubModal] = useState(false);
  const [invModal, setInvModal] = useState(false);
  const [planForm] = Form.useForm();
  const [subForm] = Form.useForm();
  const [invForm] = Form.useForm();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [p, s, i] = await Promise.all([
        adminBillingApi.listPlans(),
        adminBillingApi.listSubscriptions(),
        adminBillingApi.listInvoices(),
      ]);
      setPlans(p);
      setSubs(s);
      setInvoices(i);
    } catch {
      message.error(t('admin.common.loadError'));
    } finally {
      setLoading(false);
    }
  }, [message, t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // --- plans ---
  const savePlan = async () => {
    const v = await planForm.validateFields();
    try {
      if (planModal === 'new') await adminBillingApi.createPlan(v);
      else if (planModal) await adminBillingApi.updatePlan(planModal.id, v);
      setPlanModal(null);
      planForm.resetFields();
      void refresh();
    } catch {
      message.error(t('admin.common.saveError'));
    }
  };

  const planCols: ColumnsType<Plan> = [
    { title: t('admin.billing.plan.name'), dataIndex: 'name', key: 'name' },
    {
      title: t('admin.billing.plan.price'),
      dataIndex: 'price_dh',
      key: 'price_dh',
      render: (v: number) => `${v} DH`,
    },
    {
      title: t('admin.billing.plan.interval'),
      dataIndex: 'interval',
      key: 'interval',
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: t('admin.billing.plan.active'),
      dataIndex: 'is_active',
      key: 'is_active',
      align: 'center',
      render: (v: boolean) => (v ? <Tag color="green">✓</Tag> : <Tag>—</Tag>),
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      render: (_v, r) => (
        <Space>
          <Button
            size="small"
            onClick={() => {
              setPlanModal(r);
              planForm.setFieldsValue(r);
            }}
          >
            {t('admin.common.edit')}
          </Button>
          <AdminConfirmDelete
            onConfirm={async () => {
              await adminBillingApi.deletePlan(r.id);
              void refresh();
            }}
          />
        </Space>
      ),
    },
  ];

  // --- subscriptions ---
  const assignSub = async () => {
    const v = await subForm.validateFields();
    try {
      await adminBillingApi.createSubscription(v);
      setSubModal(false);
      subForm.resetFields();
      void refresh();
    } catch {
      message.error(t('admin.common.saveError'));
    }
  };

  const subCols: ColumnsType<Subscription> = [
    {
      title: t('admin.billing.sub.user'),
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: t('admin.billing.sub.plan'),
      dataIndex: 'plan_name',
      key: 'plan_name',
      render: (v: string | null) => v ?? '—',
    },
    {
      title: t('admin.billing.sub.status'),
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => (
        <Tag color={v === 'active' ? 'green' : 'default'}>{v}</Tag>
      ),
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      render: (_v, r) =>
        r.status === 'active' ? (
          <Button
            size="small"
            danger
            onClick={async () => {
              await adminBillingApi.cancelSubscription(r.id);
              void refresh();
            }}
          >
            {t('admin.billing.sub.cancel')}
          </Button>
        ) : null,
    },
  ];

  // --- invoices ---
  const createInv = async () => {
    const v = await invForm.validateFields();
    try {
      await adminBillingApi.createInvoice(v);
      setInvModal(false);
      invForm.resetFields();
      void refresh();
    } catch {
      message.error(t('admin.common.saveError'));
    }
  };

  const invCols: ColumnsType<Invoice> = [
    { title: '#', dataIndex: 'id', key: 'id' },
    {
      title: t('admin.billing.inv.sub'),
      dataIndex: 'subscription_id',
      key: 'subscription_id',
    },
    {
      title: t('admin.billing.inv.amount'),
      dataIndex: 'amount_dh',
      key: 'amount_dh',
      render: (v: number) => `${v} DH`,
    },
    {
      title: t('admin.billing.inv.status'),
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => (
        <Tag color={v === 'paid' ? 'green' : 'orange'}>{v}</Tag>
      ),
    },
    {
      title: t('admin.billing.inv.paidAt'),
      dataIndex: 'paid_at',
      key: 'paid_at',
      render: (v: string | null) => fmt(v, tag),
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      render: (_v, r) =>
        r.status !== 'paid' ? (
          <Button
            size="small"
            type="primary"
            onClick={async () => {
              await adminBillingApi.markInvoicePaid(r.id);
              void refresh();
            }}
          >
            {t('admin.billing.inv.markPaid')}
          </Button>
        ) : null,
    },
  ];

  return (
    <Box px={{ base: 3, md: 4 }} py={{ base: 3, md: 4 }}>
      <PageInfoBar
        title={t('admin.billing.title')}
        subtitle={t('admin.billing.subtitle')}
      />
      <Tabs
        defaultActiveKey="plans"
        items={[
          {
            key: 'plans',
            label: t('admin.billing.tab.plans'),
            children: (
              <>
                <Space style={{ marginBottom: 12 }}>
                  <Button
                    type="primary"
                    onClick={() => {
                      setPlanModal('new');
                      planForm.resetFields();
                    }}
                  >
                    {t('admin.billing.plan.new')}
                  </Button>
                </Space>
                <AdminCrudTable<Plan>
                  rowKey="id"
                  columns={planCols}
                  data={plans}
                  loading={loading}
                />
              </>
            ),
          },
          {
            key: 'subs',
            label: t('admin.billing.tab.subscriptions'),
            children: (
              <>
                <Space style={{ marginBottom: 12 }}>
                  <Button type="primary" onClick={() => setSubModal(true)}>
                    {t('admin.billing.sub.assign')}
                  </Button>
                </Space>
                <AdminCrudTable<Subscription>
                  rowKey="id"
                  columns={subCols}
                  data={subs}
                  loading={loading}
                />
              </>
            ),
          },
          {
            key: 'invoices',
            label: t('admin.billing.tab.invoices'),
            children: (
              <>
                <Space style={{ marginBottom: 12 }}>
                  <Button type="primary" onClick={() => setInvModal(true)}>
                    {t('admin.billing.inv.new')}
                  </Button>
                </Space>
                <AdminCrudTable<Invoice>
                  rowKey="id"
                  columns={invCols}
                  data={invoices}
                  loading={loading}
                />
              </>
            ),
          },
        ]}
      />

      <Modal
        open={planModal !== null}
        title={t('admin.billing.plan.new')}
        onOk={savePlan}
        onCancel={() => setPlanModal(null)}
        destroyOnClose
      >
        <Form
          form={planForm}
          layout="vertical"
          initialValues={{ interval: 'monthly', is_active: true, price_dh: 0 }}
        >
          <Form.Item
            name="name"
            label={t('admin.billing.plan.name')}
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="price_dh" label={t('admin.billing.plan.price')}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="interval" label={t('admin.billing.plan.interval')}>
            <Select
              options={[
                { label: t('admin.billing.plan.monthly'), value: 'monthly' },
                { label: t('admin.billing.plan.yearly'), value: 'yearly' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="is_active"
            label={t('admin.billing.plan.active')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={subModal}
        title={t('admin.billing.sub.assign')}
        onOk={assignSub}
        onCancel={() => setSubModal(false)}
        destroyOnClose
      >
        <Form form={subForm} layout="vertical">
          <Form.Item
            name="username"
            label={t('admin.billing.sub.user')}
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="plan_id"
            label={t('admin.billing.sub.plan')}
            rules={[{ required: true }]}
          >
            <Select
              options={plans.map((p) => ({ label: p.name, value: p.id }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={invModal}
        title={t('admin.billing.inv.new')}
        onOk={createInv}
        onCancel={() => setInvModal(false)}
        destroyOnClose
      >
        <Form form={invForm} layout="vertical">
          <Form.Item
            name="subscription_id"
            label={t('admin.billing.inv.sub')}
            rules={[{ required: true }]}
          >
            <Select
              options={subs.map((s) => ({
                label: `#${s.id} — ${s.username}`,
                value: s.id,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="amount_dh"
            label={t('admin.billing.inv.amount')}
            rules={[{ required: true }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </Box>
  );
};

export default BillingMain;
