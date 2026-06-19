'use client';

import {
  App,
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { Box } from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import { AdminCrudTable } from '@/app/components/admin/_shared/AdminCrudTable';
import { AdminConfirmDelete } from '@/app/components/admin/_shared/AdminConfirmDelete';
import { AdminEntityDrawer } from '@/app/components/admin/_shared/AdminEntityDrawer';
import { ExportCsvButton } from '@/app/components/admin/_shared/ExportCsvButton';
import { PageInfoBar } from '@/app/components/layout/PageInfoBar';
import { adminKcApi, type KcRow } from '@/app/lib/adminKcApi';
import { adminUserApi } from '@/app/lib/adminUserApi';
import { adminZoneApi, type AdminZone } from '@/app/lib/adminZoneApi';

type PeriodForm = {
  period_name: string;
  range: [dayjs.Dayjs, dayjs.Dayjs];
  kc_value: number;
};

type KcFormValues = {
  username: string;
  name: string;
  plant_name: string;
  zone_id?: number | null;
  periods: PeriodForm[];
};

const KcMain = () => {
  const t = useTranslations();
  const { message } = App.useApp();
  const [form] = Form.useForm<KcFormValues>();

  const [rows, setRows] = useState<KcRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [usernameFilter, setUsernameFilter] = useState('');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<KcRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [usernames, setUsernames] = useState<string[]>([]);
  const [zones, setZones] = useState<AdminZone[]>([]);
  const watchedUser = Form.useWatch('username', form);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await adminKcApi.list({
        username: usernameFilter.trim() || undefined,
      });
      setRows(list);
    } catch {
      message.error(t('admin.common.loadError'));
    } finally {
      setLoading(false);
    }
  }, [usernameFilter, message, t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    adminUserApi
      .list()
      .then((us) => setUsernames(us.map((u) => u.username)))
      .catch(() => undefined);
  }, []);

  // Load the selected user's zones for the zone picker.
  useEffect(() => {
    if (!watchedUser) {
      setZones([]);
      return;
    }
    adminZoneApi
      .list(watchedUser)
      .then(setZones)
      .catch(() => setZones([]));
  }, [watchedUser]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ periods: [] });
    setDrawerOpen(true);
  };

  const openEdit = (row: KcRow) => {
    setEditing(row);
    form.setFieldsValue({
      username: row.username ?? '',
      name: row.name,
      plant_name: row.plant_name,
      zone_id: row.zone_id ?? undefined,
      periods: row.periods.map((p) => ({
        period_name: p.period_name,
        range: [dayjs(p.start_date), dayjs(p.end_date)],
        kc_value: p.kc_value,
      })),
    });
    setDrawerOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    const periods = (values.periods ?? []).map((p) => ({
      period_name: p.period_name,
      start_date: p.range[0].format('YYYY-MM-DD'),
      end_date: p.range[1].format('YYYY-MM-DD'),
      kc_value: p.kc_value,
    }));
    setSubmitting(true);
    try {
      if (editing) {
        await adminKcApi.update(editing.id, {
          name: values.name,
          plant_name: values.plant_name,
          zone_id: values.zone_id ?? null,
          periods,
        });
        message.success(t('admin.kc.updated'));
      } else {
        await adminKcApi.create({
          username: values.username,
          name: values.name,
          plant_name: values.plant_name,
          zone_id: values.zone_id ?? null,
          periods,
        });
        message.success(t('admin.kc.created'));
      }
      setDrawerOpen(false);
      await refresh();
    } catch {
      message.error(t('admin.common.saveError'));
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: number) => {
    await adminKcApi.remove(id);
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const columns: ColumnsType<KcRow> = [
    { title: t('admin.kc.col.user'), dataIndex: 'username', key: 'username', render: (v) => v ?? '—' },
    { title: t('admin.kc.col.name'), dataIndex: 'name', key: 'name' },
    { title: t('admin.kc.col.plant'), dataIndex: 'plant_name', key: 'plant_name' },
    { title: t('admin.kc.col.zone'), dataIndex: 'zone_name', key: 'zone_name', render: (v) => v ?? '—' },
    {
      title: t('admin.kc.col.periods'),
      dataIndex: 'number_of_periods',
      key: 'number_of_periods',
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      render: (_v, r) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => openEdit(r)}>
            {t('admin.common.edit')}
          </Button>
          <AdminConfirmDelete onConfirm={() => remove(r.id)} />
        </Space>
      ),
    },
  ];

  const csvHeaders = [
    { label: t('admin.kc.col.user'), key: 'username' },
    { label: t('admin.kc.col.name'), key: 'name' },
    { label: t('admin.kc.col.plant'), key: 'plant_name' },
    { label: t('admin.kc.col.zone'), key: 'zone_name' },
    { label: t('admin.kc.col.periods'), key: 'number_of_periods' },
  ];

  return (
    <Box px={{ base: 3, md: 4 }} py={{ base: 3, md: 4 }}>
      <PageInfoBar
        title={t('admin.kc.title')}
        subtitle={t('admin.kc.subtitle')}
        actions={
          <Space>
            <ExportCsvButton<KcRow>
              data={rows}
              headers={csvHeaders}
              filename="crop-calendars"
            />
            <Button type="primary" onClick={openCreate}>
              {t('admin.kc.new')}
            </Button>
          </Space>
        }
      />

      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder={t('admin.kc.filter.username')}
          value={usernameFilter}
          onChange={(e) => setUsernameFilter(e.target.value)}
          onSearch={() => void refresh()}
          style={{ width: 220 }}
        />
      </Space>

      <AdminCrudTable<KcRow>
        rowKey="id"
        columns={columns}
        data={rows}
        loading={loading}
        emptyDescription={t('admin.kc.empty')}
      />

      <AdminEntityDrawer
        open={drawerOpen}
        title={editing ? t('admin.kc.editTitle') : t('admin.kc.new')}
        onClose={() => setDrawerOpen(false)}
        onSubmit={() => void submit()}
        submitting={submitting}
        width={560}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="username"
            label={t('admin.kc.field.username')}
            rules={[{ required: true }]}
          >
            <Select
              showSearch
              disabled={!!editing}
              placeholder={t('admin.kc.field.username')}
              options={usernames.map((u) => ({ label: u, value: u }))}
            />
          </Form.Item>
          <Form.Item
            name="name"
            label={t('admin.kc.field.name')}
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="plant_name"
            label={t('admin.kc.field.plant')}
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="zone_id" label={t('admin.kc.field.zone')}>
            <Select
              allowClear
              placeholder={t('admin.kc.field.zone')}
              options={zones.map((z) => ({ label: z.name, value: z.id }))}
            />
          </Form.Item>

          <Form.List name="periods">
            {(fields, { add, remove: rm }) => (
              <Space direction="vertical" style={{ width: '100%' }}>
                {fields.map((field) => (
                  <Space key={field.key} align="baseline" wrap>
                    <Form.Item
                      name={[field.name, 'period_name']}
                      rules={[{ required: true }]}
                      style={{ marginBottom: 8 }}
                    >
                      <Input placeholder={t('admin.kc.field.periodName')} style={{ width: 130 }} />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, 'range']}
                      rules={[{ required: true }]}
                      style={{ marginBottom: 8 }}
                    >
                      <DatePicker.RangePicker />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, 'kc_value']}
                      rules={[{ required: true }]}
                      style={{ marginBottom: 8 }}
                    >
                      <InputNumber step={0.05} placeholder="Kc" style={{ width: 80 }} />
                    </Form.Item>
                    <Button type="link" danger onClick={() => rm(field.name)}>
                      {t('admin.common.delete')}
                    </Button>
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} block>
                  {t('admin.kc.addPeriod')}
                </Button>
              </Space>
            )}
          </Form.List>
        </Form>
      </AdminEntityDrawer>
    </Box>
  );
};

export default KcMain;
