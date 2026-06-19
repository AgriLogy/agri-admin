/**
 * Typed wrapper for the admin records endpoints (/admin/*): notification
 * snapshots, assistant conversations, the proactive-notice ledger, and the
 * GLOBAL technician-grant view.
 */
import api from './api';

export type NotificationRow = {
  id: number;
  username: string | null;
  today_temperature: number | null;
  today_humidity: number | null;
  ET0: number | null;
  soil_humidity: number | null;
  perfect_irrigation_period: string;
  last_irrigation_date: string | null;
  notification_date: string | null;
};

export type ConversationRow = {
  id: number;
  username: string | null;
  client_id: string;
  title: string;
  message_count: number;
  created_at: string | null;
  updated_at: string | null;
};

export type ConversationMessage = {
  role?: string;
  content?: string;
  [k: string]: unknown;
};

export type ConversationDetail = ConversationRow & {
  messages: ConversationMessage[];
};

export type ProactiveRow = {
  id: number;
  username: string | null;
  last_sent: string | null;
};

export type GrantRow = {
  id: number;
  technician: string | null;
  owner: string | null;
  is_active: boolean;
  created_at: string | null;
};

export type GrantDetail = GrantRow & {
  scope: { zone_id: number; allowed_graphs: string[] }[];
};

export const adminRecordsApi = {
  notifications: (username?: string) =>
    api
      .get<NotificationRow[]>('/admin/notifications', {
        params: username ? { username } : undefined,
      })
      .then((r) => r.data),
  deleteNotification: (id: number) =>
    api.delete(`/admin/notifications/${id}`).then((r) => r.data),

  conversations: (username?: string) =>
    api
      .get<ConversationRow[]>('/admin/conversations', {
        params: username ? { username } : undefined,
      })
      .then((r) => r.data),
  conversation: (id: number) =>
    api
      .get<ConversationDetail>(`/admin/conversations/${id}`)
      .then((r) => r.data),
  deleteConversation: (id: number) =>
    api.delete(`/admin/conversations/${id}`).then((r) => r.data),

  proactiveNotices: () =>
    api.get<ProactiveRow[]>('/admin/proactive-notices').then((r) => r.data),
  resetProactive: (id: number) =>
    api.delete(`/admin/proactive-notices/${id}`).then((r) => r.data),

  grants: (filters?: { owner?: string; technician?: string }) =>
    api
      .get<GrantRow[]>('/admin/technician-grants', { params: filters })
      .then((r) => r.data),
  grant: (id: number) =>
    api.get<GrantDetail>(`/admin/technician-grants/${id}`).then((r) => r.data),
  setGrantActive: (id: number, is_active: boolean) =>
    api
      .patch<GrantDetail>(`/admin/technician-grants/${id}`, { is_active })
      .then((r) => r.data),
  revokeGrant: (id: number) =>
    api.delete(`/admin/technician-grants/${id}`).then((r) => r.data),
};
