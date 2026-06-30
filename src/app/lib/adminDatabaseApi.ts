/**
 * Typed wrapper for the generic admin "database" API (/admin/db/*).
 *
 * Drives the schema-introspected CRUD UI: list every table, read a model's
 * field schema, and list/create/update/delete arbitrary rows — no per-table
 * code. The backend (agri-api `router_db.py`) is staff-guarded.
 */
import api from './api';

export type DbTable = {
  key: string; // "app_label.modelname"
  app_label: string;
  model_name: string;
  verbose_name: string;
  verbose_name_plural: string;
  count: number | null;
};

export type DbFieldType =
  | 'string'
  | 'text'
  | 'integer'
  | 'float'
  | 'decimal'
  | 'boolean'
  | 'datetime'
  | 'date'
  | 'time'
  | 'json'
  | 'fk';

export type DbFieldChoice = { value: string | number | boolean; label: string };

export type DbField = {
  name: string; // column / attname (FK -> "<name>_id")
  label: string;
  type: DbFieldType;
  required: boolean;
  editable: boolean;
  primary_key: boolean;
  nullable: boolean;
  help_text: string;
  choices?: DbFieldChoice[];
  relation?: { to: string; to_label: string };
  max_length?: number;
};

export type DbSchema = {
  key: string;
  app_label: string;
  model_name: string;
  verbose_name: string;
  verbose_name_plural: string;
  pk_field: string;
  fields: DbField[];
};

export type DbRow = Record<string, unknown> & {
  __pk__: string | number;
  __str__: string;
};

export type DbRowsPage = {
  count: number;
  page: number;
  page_size: number;
  results: DbRow[];
};

export type DbRowsParams = {
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
};

const base = (key: string) => `/admin/db/tables/${encodeURIComponent(key)}`;
const rowUrl = (key: string, pk: string | number) =>
  `${base(key)}/rows/${encodeURIComponent(String(pk))}`;

export const adminDatabaseApi = {
  tables: () => api.get<DbTable[]>('/admin/db/tables').then((r) => r.data),

  schema: (key: string) =>
    api.get<DbSchema>(`${base(key)}/schema`).then((r) => r.data),

  rows: (key: string, params: DbRowsParams = {}) =>
    api.get<DbRowsPage>(`${base(key)}/rows`, { params }).then((r) => r.data),

  retrieve: (key: string, pk: string | number) =>
    api.get<DbRow>(rowUrl(key, pk)).then((r) => r.data),

  create: (key: string, body: Record<string, unknown>) =>
    api.post<DbRow>(`${base(key)}/rows`, body).then((r) => r.data),

  update: (key: string, pk: string | number, body: Record<string, unknown>) =>
    api.patch<DbRow>(rowUrl(key, pk), body).then((r) => r.data),

  remove: (key: string, pk: string | number) =>
    api.delete<void>(rowUrl(key, pk)).then((r) => r.data),
};

export default adminDatabaseApi;
