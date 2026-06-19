/**
 * Typed wrapper for the admin audit-log endpoint (/admin/audit).
 */
import api from './api';

export type AuditEvent = {
  id: number;
  actor: string | null;
  action: string;
  target_type: string;
  target_id: string;
  changes: Record<string, unknown>;
  created_at: string | null;
};

export type AuditFilters = {
  actor?: string;
  action?: string;
  target_type?: string;
  limit?: number;
};

export const adminAuditApi = {
  list: (filters?: AuditFilters) =>
    api
      .get<AuditEvent[]>('/admin/audit', { params: filters })
      .then((r) => r.data),
};
