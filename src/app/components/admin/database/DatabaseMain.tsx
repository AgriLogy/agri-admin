'use client';

import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  Input,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  adminDatabaseApi,
  type DbField,
  type DbRow,
  type DbSchema,
  type DbTable,
} from '@/app/lib/adminDatabaseApi';
import RowFormDrawer from './RowFormDrawer';

const PAGE_SIZE = 25;
/** Columns to surface in the grid (full record is still editable in the drawer). */
const MAX_GRID_COLS = 8;

function renderCell(value: unknown): React.ReactNode {
  if (value === null || value === undefined)
    return <Typography.Text type="secondary">—</Typography.Text>;
  if (typeof value === 'boolean') return value ? '✓' : '✗';
  if (typeof value === 'object') return JSON.stringify(value);
  const s = String(value);
  return s.length > 80 ? `${s.slice(0, 80)}…` : s;
}

export function DatabaseMain() {
  const t = useTranslations();
  const { message } = App.useApp();

  const [tables, setTables] = useState<DbTable[]>([]);
  const [tableKey, setTableKey] = useState<string | null>(null);
  const [schema, setSchema] = useState<DbSchema | null>(null);

  const [rows, setRows] = useState<DbRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [ordering, setOrdering] = useState('');
  const [loading, setLoading] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<DbRow | null>(null);

  // Load the table catalogue once.
  useEffect(() => {
    adminDatabaseApi
      .tables()
      .then(setTables)
      .catch(() => message.error(t('admin.database.loadTablesError')));
  }, [message, t]);

  // Load schema when the selected table changes.
  useEffect(() => {
    if (!tableKey) {
      setSchema(null);
      return;
    }
    setSchema(null);
    adminDatabaseApi
      .schema(tableKey)
      .then(setSchema)
      .catch(() => message.error(t('admin.database.loadSchemaError')));
  }, [tableKey, message, t]);

  const loadRows = useCallback(async () => {
    if (!tableKey) return;
    setLoading(true);
    try {
      const data = await adminDatabaseApi.rows(tableKey, {
        search,
        ordering,
        page,
        page_size: PAGE_SIZE,
      });
      setRows(data.results);
      setTotal(data.count);
    } catch {
      message.error(t('admin.database.loadRowsError'));
    } finally {
      setLoading(false);
    }
  }, [tableKey, search, ordering, page, message, t]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const tableOptions = useMemo(
    () =>
      tables.map((tb) => ({
        value: tb.key,
        label: `${tb.app_label} · ${tb.verbose_name}${
          tb.count !== null ? ` (${tb.count})` : ''
        }`,
      })),
    [tables]
  );

  const handleDelete = async (row: DbRow) => {
    if (!tableKey) return;
    try {
      await adminDatabaseApi.remove(tableKey, row.__pk__);
      message.success(t('admin.database.deleted'));
      void loadRows();
    } catch (err) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? t('admin.database.deleteError');
      message.error(detail);
    }
  };

  const columns: ColumnsType<DbRow> = useMemo(() => {
    if (!schema) return [];
    const gridFields: DbField[] = schema.fields.slice(0, MAX_GRID_COLS);
    const cols: ColumnsType<DbRow> = gridFields.map((f) => ({
      title: f.label || f.name,
      dataIndex: f.name,
      key: f.name,
      sorter: true,
      ellipsis: true,
      render: (v: unknown) => renderCell(v),
    }));
    cols.push({
      title: t('admin.database.col.actions'),
      key: '__actions__',
      fixed: 'right',
      width: 120,
      render: (_: unknown, row: DbRow) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingRow(row);
              setDrawerOpen(true);
            }}
          />
          <Popconfirm
            title={t('admin.database.confirmDelete')}
            okText={t('admin.database.confirmDeleteOk')}
            okButtonProps={{ danger: true }}
            cancelText={t('admin.database.cancel')}
            onConfirm={() => handleDelete(row)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    });
    return cols;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema, t]);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Typography.Title level={3} style={{ marginBottom: 4 }}>
          {t('admin.database.title')}
        </Typography.Title>
        <Typography.Text type="secondary">
          {t('admin.database.subtitle')}
        </Typography.Text>
      </div>

      <Space wrap>
        <Select
          showSearch
          placeholder={t('admin.database.selectTable')}
          options={tableOptions}
          value={tableKey ?? undefined}
          onChange={(v) => {
            setTableKey(v);
            setPage(1);
            setSearch('');
            setOrdering('');
          }}
          optionFilterProp="label"
          style={{ minWidth: 360 }}
        />
        {schema && (
          <Tag color="blue">
            {schema.key} · {total} {t('admin.database.rows')}
          </Tag>
        )}
      </Space>

      {schema && (
        <Card
          size="small"
          title={
            <Space>
              <Input.Search
                allowClear
                placeholder={t('admin.database.searchPlaceholder')}
                onSearch={(v) => {
                  setSearch(v);
                  setPage(1);
                }}
                style={{ width: 280 }}
              />
            </Space>
          }
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingRow(null);
                setDrawerOpen(true);
              }}
            >
              {t('admin.database.newRow')}
            </Button>
          }
        >
          <Table<DbRow>
            rowKey={(r) => String(r.__pk__)}
            columns={columns}
            dataSource={rows}
            loading={loading}
            size="small"
            scroll={{ x: 'max-content' }}
            pagination={{
              current: page,
              pageSize: PAGE_SIZE,
              total,
              showSizeChanger: false,
            }}
            onChange={(pg, _filters, sorter) => {
              const s = Array.isArray(sorter) ? sorter[0] : sorter;
              if (s && s.field && s.order) {
                const prefix = s.order === 'descend' ? '-' : '';
                setOrdering(`${prefix}${String(s.field)}`);
              } else {
                setOrdering('');
              }
              setPage(pg.current ?? 1);
            }}
          />
        </Card>
      )}

      {schema && (
        <RowFormDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onSaved={loadRows}
          schema={schema}
          row={editingRow}
        />
      )}
    </Space>
  );
}

export default DatabaseMain;
