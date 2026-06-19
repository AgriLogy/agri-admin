'use client';

import { App, Card, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Box } from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { AdminCrudTable } from '@/app/components/admin/_shared/AdminCrudTable';
import { PageInfoBar } from '@/app/components/layout/PageInfoBar';
import MonitoringNav from '@/app/components/admin/monitoring/MonitoringNav';
import {
  adminMonitoringApi,
  type BeatScheduleEntry,
  type TaskAggregate,
  type TaskRun,
} from '@/app/lib/adminMonitoringApi';
import { fmtDateTime, localeTag } from '@/app/lib/datetime';

const shortName = (name: string) => name.replace('agriapi.tasks.', '');

const MonitoringTasksMain = () => {
  const t = useTranslations();
  const tag = localeTag(useLocale());
  const { message } = App.useApp();

  const [runs, setRuns] = useState<TaskRun[]>([]);
  const [aggregates, setAggregates] = useState<TaskAggregate[]>([]);
  const [schedule, setSchedule] = useState<BeatScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | undefined>();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminMonitoringApi.tasks({ status });
      setRuns(res.runs);
      setAggregates(res.aggregates);
      setSchedule(res.schedule);
    } catch {
      message.error(t('admin.common.loadError'));
    } finally {
      setLoading(false);
    }
  }, [status, message, t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const scheduleColumns: ColumnsType<BeatScheduleEntry> = [
    {
      title: t('admin.monitoring.tasks.schedName'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('admin.monitoring.tasks.schedTask'),
      dataIndex: 'task',
      key: 'task',
      render: (v: string | null) => (v ? shortName(v) : '—'),
    },
    {
      title: t('admin.monitoring.tasks.schedEvery'),
      dataIndex: 'schedule',
      key: 'schedule',
    },
    {
      title: t('admin.monitoring.tasks.schedSource'),
      dataIndex: 'source',
      key: 'source',
      render: (v: string) => <Tag>{v}</Tag>,
    },
  ];

  const aggColumns: ColumnsType<TaskAggregate> = [
    {
      title: t('admin.monitoring.tasks.aggName'),
      dataIndex: 'task_name',
      key: 'task_name',
      render: shortName,
    },
    {
      title: t('admin.monitoring.tasks.aggRuns'),
      dataIndex: 'runs',
      key: 'runs',
    },
    {
      title: t('admin.monitoring.tasks.aggFailures'),
      dataIndex: 'failures',
      key: 'failures',
    },
    {
      title: t('admin.monitoring.tasks.aggSuccess'),
      dataIndex: 'success_rate',
      key: 'success_rate',
      render: (v: number, r) => (
        <Tag color={r.failures ? 'volcano' : 'green'}>{v}%</Tag>
      ),
    },
    {
      title: t('admin.monitoring.tasks.aggLastRun'),
      dataIndex: 'last_run',
      key: 'last_run',
      render: (iso: string | null) => fmtDateTime(iso, tag),
    },
  ];

  const runColumns: ColumnsType<TaskRun> = [
    {
      title: t('admin.monitoring.tasks.runName'),
      dataIndex: 'task_name',
      key: 'task_name',
      render: shortName,
    },
    {
      title: t('admin.monitoring.tasks.runStatus'),
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => (
        <Tag color={v === 'failure' ? 'volcano' : 'green'}>
          {t(`admin.monitoring.tasks.status.${v}`)}
        </Tag>
      ),
    },
    {
      title: t('admin.monitoring.tasks.runRuntime'),
      dataIndex: 'runtime_ms',
      key: 'runtime_ms',
      render: (v: number | null) => (v == null ? '—' : `${v} ms`),
    },
    {
      title: t('admin.monitoring.tasks.runError'),
      dataIndex: 'error',
      key: 'error',
      ellipsis: true,
      render: (v: string) => v || '—',
    },
    {
      title: t('admin.monitoring.tasks.runAt'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (iso: string | null) => fmtDateTime(iso, tag),
    },
  ];

  return (
    <Box px={{ base: 3, md: 4 }} py={{ base: 3, md: 4 }}>
      <PageInfoBar
        title={t('admin.monitoring.tasks.title')}
        subtitle={t('admin.monitoring.tasks.subtitle')}
      />
      <MonitoringNav />

      <Card
        size="small"
        title={t('admin.monitoring.tasks.scheduleTitle')}
        style={{ marginBottom: 16 }}
      >
        <Table<BeatScheduleEntry>
          rowKey={(r) => `${r.source}-${r.name}`}
          columns={scheduleColumns}
          dataSource={schedule}
          loading={loading}
          size="small"
          pagination={false}
        />
      </Card>

      <Card
        size="small"
        title={t('admin.monitoring.tasks.aggTitle')}
        style={{ marginBottom: 16 }}
      >
        <Table<TaskAggregate>
          rowKey="task_name"
          columns={aggColumns}
          dataSource={aggregates}
          loading={loading}
          size="small"
          pagination={false}
        />
      </Card>

      <Space wrap style={{ marginBottom: 16 }}>
        <Select
          allowClear
          placeholder={t('admin.monitoring.tasks.filterStatus')}
          value={status}
          onChange={(v) => setStatus(v)}
          style={{ width: 180 }}
          options={[
            {
              label: t('admin.monitoring.tasks.status.success'),
              value: 'success',
            },
            {
              label: t('admin.monitoring.tasks.status.failure'),
              value: 'failure',
            },
          ]}
        />
      </Space>

      <AdminCrudTable<TaskRun>
        rowKey="id"
        columns={runColumns}
        data={runs}
        loading={loading}
        emptyDescription={t('admin.monitoring.tasks.empty')}
      />
    </Box>
  );
};

export default MonitoringTasksMain;
