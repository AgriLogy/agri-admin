'use client';

import { App, Form, Input, InputNumber, Select } from 'antd';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { AdminEntityDrawer } from '@/app/components/admin/_shared/AdminEntityDrawer';
import {
  adminAlertApi,
  type AlertConsoleRow,
  type AlertCreatePayload,
} from '@/app/lib/adminAlertApi';

/** Alert `type` enum — mirrors apps/alerts/models.py ALERT_CHOICES. */
const ALERT_TYPES = [
  'Pressure',
  'Flow',
  'Weather Temperature',
  'Wind Speed',
  'Rain Fall',
  'Periodic maintenance',
  'EC (Electrical Conductivity)',
  'pH Level',
  'Humidity',
  'Soil Temperature',
];

type FormValues = {
  username: string;
  name: string;
  type: string;
  condition: string;
  condition_nbr: number;
  sensor_key?: string;
  description?: string;
  zone_id?: number | null;
};

export type AlertCreateDrawerProps = {
  open: boolean;
  onClose: () => void;
  onSaved: (row: AlertConsoleRow) => void;
};

export function AlertCreateDrawer({
  open,
  onClose,
  onSaved,
}: AlertCreateDrawerProps) {
  const t = useTranslations();
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    let values: FormValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    setSubmitting(true);
    try {
      const payload: AlertCreatePayload = {
        ...values,
        zone_id: values.zone_id ?? null,
      };
      const saved = await adminAlertApi.create(payload);
      message.success(t('admin.alertCreate.success'));
      onSaved(saved);
      form.resetFields();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      message.error(detail || t('admin.alertCreate.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminEntityDrawer
      open={open}
      onClose={() => {
        if (submitting) return;
        form.resetFields();
        onClose();
      }}
      onSubmit={handleSubmit}
      title={t('admin.alertCreate.title')}
      submitting={submitting}
      submitLabel={t('admin.alertCreate.create')}
      cancelLabel={t('admin.alertCreate.cancel')}
    >
      <Form<FormValues>
        form={form}
        layout="vertical"
        initialValues={{ condition: '>', is_active: true }}
        onFinish={handleSubmit}
      >
        <Form.Item
          label={t('admin.alertCreate.field.username')}
          name="username"
          rules={[
            {
              required: true,
              message: t('admin.alertCreate.validation.required'),
            },
          ]}
        >
          <Input autoComplete="off" />
        </Form.Item>
        <Form.Item
          label={t('admin.alertCreate.field.name')}
          name="name"
          rules={[
            {
              required: true,
              message: t('admin.alertCreate.validation.required'),
            },
          ]}
        >
          <Input autoComplete="off" />
        </Form.Item>
        <Form.Item
          label={t('admin.alertCreate.field.type')}
          name="type"
          rules={[
            {
              required: true,
              message: t('admin.alertCreate.validation.required'),
            },
          ]}
        >
          <Select
            options={ALERT_TYPES.map((v) => ({ label: v, value: v }))}
            showSearch
          />
        </Form.Item>
        <Form.Item
          label={t('admin.alertCreate.field.condition')}
          name="condition"
          rules={[{ required: true }]}
        >
          <Select
            options={[
              { label: '> ' + t('admin.alertCreate.cond.gt'), value: '>' },
              { label: '< ' + t('admin.alertCreate.cond.lt'), value: '<' },
              { label: '= ' + t('admin.alertCreate.cond.eq'), value: '=' },
            ]}
          />
        </Form.Item>
        <Form.Item
          label={t('admin.alertCreate.field.threshold')}
          name="condition_nbr"
          rules={[
            {
              required: true,
              message: t('admin.alertCreate.validation.required'),
            },
          ]}
        >
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          label={t('admin.alertCreate.field.sensorKey')}
          name="sensor_key"
          tooltip={t('admin.alertCreate.field.sensorKeyHint')}
        >
          <Input autoComplete="off" placeholder="temperature_weather" />
        </Form.Item>
        <Form.Item
          label={t('admin.alertCreate.field.zoneId')}
          name="zone_id"
          tooltip={t('admin.alertCreate.field.zoneIdHint')}
        >
          <InputNumber style={{ width: '100%' }} min={1} />
        </Form.Item>
        <Form.Item
          label={t('admin.alertCreate.field.description')}
          name="description"
        >
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </AdminEntityDrawer>
  );
}

export default AlertCreateDrawer;
