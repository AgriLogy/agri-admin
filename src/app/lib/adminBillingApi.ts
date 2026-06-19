/**
 * Typed wrapper for the admin billing endpoints (/admin/billing/*).
 */
import api from './api';

export type Plan = {
  id: number;
  name: string;
  price_dh: number;
  interval: string;
  features: string[];
  is_active: boolean;
};

export type PlanPayload = {
  name: string;
  price_dh: number;
  interval: string;
  features?: string[];
  is_active?: boolean;
};

export type Subscription = {
  id: number;
  username: string | null;
  plan_id: number | null;
  plan_name: string | null;
  status: string;
  period_start: string | null;
  period_end: string | null;
};

export type Invoice = {
  id: number;
  subscription_id: number;
  amount_dh: number;
  status: string;
  issued_at: string | null;
  paid_at: string | null;
};

export const adminBillingApi = {
  listPlans: () => api.get<Plan[]>('/admin/billing/plans').then((r) => r.data),
  createPlan: (payload: PlanPayload) =>
    api.post<Plan>('/admin/billing/plans', payload).then((r) => r.data),
  updatePlan: (id: number, payload: PlanPayload) =>
    api.put<Plan>(`/admin/billing/plans/${id}`, payload).then((r) => r.data),
  deletePlan: (id: number) =>
    api.delete(`/admin/billing/plans/${id}`).then((r) => r.data),

  listSubscriptions: (username?: string) =>
    api
      .get<Subscription[]>('/admin/billing/subscriptions', {
        params: username ? { username } : undefined,
      })
      .then((r) => r.data),
  createSubscription: (payload: {
    username: string;
    plan_id: number;
    period_start?: string | null;
    period_end?: string | null;
  }) =>
    api
      .post<Subscription>('/admin/billing/subscriptions', payload)
      .then((r) => r.data),
  cancelSubscription: (id: number) =>
    api
      .post<Subscription>(`/admin/billing/subscriptions/${id}/cancel`, {})
      .then((r) => r.data),

  listInvoices: (filters?: { username?: string; subscription_id?: number }) =>
    api
      .get<Invoice[]>('/admin/billing/invoices', { params: filters })
      .then((r) => r.data),
  createInvoice: (payload: { subscription_id: number; amount_dh: number }) =>
    api.post<Invoice>('/admin/billing/invoices', payload).then((r) => r.data),
  markInvoicePaid: (id: number) =>
    api
      .post<Invoice>(`/admin/billing/invoices/${id}/mark-paid`, {})
      .then((r) => r.data),
};
