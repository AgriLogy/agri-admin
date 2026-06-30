'use client';

import {
  App,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
} from 'antd';
import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { AdminEntityDrawer } from '@/app/components/admin/_shared/AdminEntityDrawer';
import {
  adminDatabaseApi,
  type DbField,
  type DbRow,
  type DbSchema,
} from '@/app/lib/adminDatabaseApi';

export type RowFormDrawerProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  schema: DbSchema;
  /** null => create mode; a row => edit mode. */
  row: DbRow | null;
};

const DATE_FMT = 'YYYY-MM-DD';

/** Fields the form should render: editable, not the primary key. */
function editableFields(schema: DbSchema): DbField[] {
  return schema.fields.filter((f) => f.editable && !f.primary_key);
}

/** Async, searchable Select backed by the related table's rows. */
function ForeignKeySelect({
  relationTo,
  value,
  onChange,
  allowClear,
}: {
  relationTo: string;
  value?: number | string | null;
  onChange?: (v: number | string | null) => void;
  allowClear?: boolean;
}) {
  const t = useTranslations();
  const [options, setOptions] = useState<
    { value: number | string; label: string }[]
  >([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (search: string) => {
      setLoading(true);
      try {
        const page = await adminDatabaseApi.rows(relationTo, {
          search,
          page_size: 50,
        });
        setOptions(
          page.results.map((r) => ({
            value: r.__pk__,
            label: `${r.__str__} (#${r.__pk__})`,
          }))
        );
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    },
    [relationTo]
  );

  useEffect(() => {
    void load('');
  }, [load]);

  // Ensure the currently-selected value is always shown even if not in the
  // first page of options.
  const mergedOptions = useMemo(() => {
    if (
      value !== undefined &&
      value !== null &&
      !options.some((o) => o.value === value)
    ) {
      return [{ value, label: `#${value}` }, ...options];
    }
    return options;
  }, [options, value]);

  return (
    <Select
      showSearch
      allowClear={allowClear}
      loading={loading}
      value={value ?? undefined}
      placeholder={t('admin.database.form.fkPlaceholder')}
      filterOption={false}
      onSearch={(s) => void load(s)}
      onChange={(v) => onChange?.(v ?? null)}
      options={mergedOptions}
      style={{ width: '100%' }}
    />
  );
}

function FieldWidget({ field }: { field: DbField }) {
  if (field.choices && field.choices.length > 0) {
    return (
      <Select
        allowClear={field.nullable}
        options={field.choices.map((c) => ({
          value: c.value as string | number,
          label: c.label,
        }))}
        style={{ width: '100%' }}
      />
    );
  }
  switch (field.type) {
    case 'boolean':
      return <Switch />;
    case 'text':
    case 'json':
      return <Input.TextArea rows={field.type === 'json' ? 6 : 3} />;
    case 'integer':
      return <InputNumber style={{ width: '100%' }} step={1} precision={0} />;
    case 'float':
    case 'decimal':
      return <InputNumber style={{ width: '100%' }} />;
    case 'date':
      return <DatePicker style={{ width: '100%' }} format={DATE_FMT} />;
    case 'datetime':
      return <DatePicker style={{ width: '100%' }} showTime />;
    case 'fk':
      return (
        <ForeignKeySelect
          relationTo={field.relation?.to ?? ''}
          allowClear={field.nullable}
        />
      );
    default:
      return <Input maxLength={field.max_length} />;
  }
}

/** Convert an API row value into a form-field value. */
function toFormValue(field: DbField, raw: unknown) {
  if (raw === null || raw === undefined) return undefined;
  if (field.type === 'date' || field.type === 'datetime') {
    const d = dayjs(raw as string);
    return d.isValid() ? d : undefined;
  }
  if (field.type === 'json') {
    try {
      return JSON.stringify(raw, null, 2);
    } catch {
      return String(raw);
    }
  }
  return raw;
}

/** Convert a form-field value into the API payload value. */
function toApiValue(field: DbField, value: unknown) {
  if (value === undefined) return field.nullable ? null : undefined;
  if (value === null) return null;
  if (field.type === 'date') return (value as dayjs.Dayjs).format(DATE_FMT);
  if (field.type === 'datetime') return (value as dayjs.Dayjs).toISOString();
  if (field.type === 'json') {
    if (typeof value === 'string' && value.trim() === '')
      return field.nullable ? null : value;
    return JSON.parse(value as string);
  }
  return value;
}

export function RowFormDrawer({
  open,
  onClose,
  onSaved,
  schema,
  row,
}: RowFormDrawerProps) {
  const t = useTranslations();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const fields = useMemo(() => editableFields(schema), [schema]);
  const isEdit = row !== null;

  useEffect(() => {
    if (!open) return;
    const initial: Record<string, unknown> = {};
    for (const f of fields) {
      initial[f.name] = row ? toFormValue(f, row[f.name]) : undefined;
    }
    form.setFieldsValue(initial);
  }, [open, row, fields, form]);

  const handleSubmit = async () => {
    let values: Record<string, unknown>;
    try {
      values = await form.validateFields();
    } catch {
      return; // antd shows field errors
    }
    const body: Record<string, unknown> = {};
    try {
      for (const f of fields) {
        const v = toApiValue(f, values[f.name]);
        if (v !== undefined) body[f.name] = v;
      }
    } catch {
      message.error(t('admin.database.form.jsonError'));
      return;
    }
    setSubmitting(true);
    try {
      if (isEdit) {
        await adminDatabaseApi.update(schema.key, row!.__pk__, body);
      } else {
        await adminDatabaseApi.create(schema.key, body);
      }
      message.success(t('admin.database.form.saved'));
      onSaved();
      onClose();
    } catch (err) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? t('admin.database.form.saveError');
      message.error(detail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminEntityDrawer
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={submitting}
      title={
        isEdit
          ? t('admin.database.form.editTitle', { table: schema.verbose_name })
          : t('admin.database.form.createTitle', { table: schema.verbose_name })
      }
      submitLabel={t('admin.database.form.save')}
      cancelLabel={t('admin.database.form.cancel')}
      width={520}
    >
      <Form form={form} layout="vertical" requiredMark>
        {fields.map((f) => (
          <Form.Item
            key={f.name}
            name={f.name}
            label={f.label || f.name}
            valuePropName={f.type === 'boolean' ? 'checked' : 'value'}
            tooltip={f.help_text || undefined}
            extra={f.relation ? `→ ${f.relation.to}` : undefined}
            rules={
              f.required
                ? [
                    {
                      required: true,
                      message: t('admin.database.form.required'),
                    },
                  ]
                : undefined
            }
          >
            <FieldWidget field={f} />
          </Form.Item>
        ))}
      </Form>
    </AdminEntityDrawer>
  );
}

export default RowFormDrawer;
