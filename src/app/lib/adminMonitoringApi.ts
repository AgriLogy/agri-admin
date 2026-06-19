/**
 * Typed wrapper for the admin monitoring endpoints (/admin/monitoring/*).
 * Read-only observability for the back-office: automated-action history,
 * notification deliveries and sign-in events.
 */
import api from './api';

export type MonitoringOverview = {
  window_hours: number;
  tasks: {
    total: number;
    failures: number;
    success_rate: number;
    by_task: {
      task_name: string;
      runs: number;
      failures: number;
      success_rate: number;
    }[];
  };
  deliveries: {
    total: number;
    failed: number;
    error_rate: number;
    by_channel: {
      channel: string;
      total: number;
      failed: number;
      error_rate: number;
    }[];
  };
  logins: { total: number; failed: number; unique_users: number };
  fleet: {
    total: number;
    offline: number;
    online: number;
    offline_pct: number;
  };
  recent_failures: {
    type: string;
    name: string;
    error: string;
    at: string | null;
  }[];
};

export type TaskRun = {
  id: number;
  task_name: string;
  status: string;
  runtime_ms: number | null;
  result: Record<string, unknown>;
  error: string;
  finished_at: string | null;
  created_at: string | null;
};

export type TaskAggregate = {
  task_name: string;
  runs: number;
  failures: number;
  success_rate: number;
  last_run: string | null;
};

export type BeatScheduleEntry = {
  name: string;
  task: string | null;
  schedule: string;
  source: string;
  last_run_at?: string | null;
};

export type TasksResponse = {
  runs: TaskRun[];
  aggregates: TaskAggregate[];
  schedule: BeatScheduleEntry[];
};

export type DeliveryLog = {
  id: number;
  channel: string;
  kind: string;
  recipient: string;
  username: string | null;
  status: string;
  error: string;
  created_at: string | null;
};

export type LoginEvent = {
  id: number;
  username: string;
  success: boolean;
  ip: string;
  user_agent: string;
  created_at: string | null;
};

export const adminMonitoringApi = {
  overview: () =>
    api
      .get<MonitoringOverview>('/admin/monitoring/overview')
      .then((r) => r.data),

  tasks: (filters?: { task_name?: string; status?: string; limit?: number }) =>
    api
      .get<TasksResponse>('/admin/monitoring/tasks', { params: filters })
      .then((r) => r.data),

  deliveries: (filters?: {
    channel?: string;
    status?: string;
    username?: string;
    limit?: number;
  }) =>
    api
      .get<DeliveryLog[]>('/admin/monitoring/deliveries', { params: filters })
      .then((r) => r.data),

  logins: (filters?: {
    username?: string;
    success?: boolean;
    limit?: number;
  }) =>
    api
      .get<LoginEvent[]>('/admin/monitoring/logins', { params: filters })
      .then((r) => r.data),
};
