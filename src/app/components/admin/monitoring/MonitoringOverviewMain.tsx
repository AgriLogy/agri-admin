'use client';

import { App, Card, Col, Progress, Row, Skeleton, Statistic, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Box } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { PageInfoBar } from '@/app/components/layout/PageInfoBar';
import MonitoringNav from '@/app/components/admin/monitoring/MonitoringNav';
import {
  adminMonitoringApi,
  type MonitoringOverview,
} from '@/app/lib/adminMonitoringApi';
import { fmtDateTime, localeTag } from '@/app/lib/datetime';

const rateColor = (rate: number): string =>
  rate >= 99 ? '#16a34a' : rate >= 90 ? '#d97706' : '#dc2626';

const errColor = (rate: number): string =>
  rate <= 1 ? '#16a34a' : rate <= 10 ? '#d97706' : '#dc2626';

type Failure = MonitoringOverview['recent_failures'][number];

const MonitoringOverviewMain = () => {
  const t = useTranslations();
  const tag = localeTag(useLocale());
  const { message } = App.useApp();

  const [data, setData] = useState<MonitoringOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await adminMonitoringApi.overview();
        if (!cancelled) setData(res);
      } catch {
        if (!cancelled) message.error(t('admin.common.loadError'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [message, t]);

  const failureColumns: ColumnsType<Failure> = [
    {
      title: t('admin.monitoring.overview.failType'),
      dataIndex: 'type',
      key: 'type',
      render: (v: string) => (
        <Tag color={v === 'task' ? 'volcano' : 'orange'}>
          {t(`admin.monitoring.overview.type.${v}`)}
        </Tag>
      ),
    },
    {
      title: t('admin.monitoring.overview.failName'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('admin.monitoring.overview.failError'),
      dataIndex: 'error',
      key: 'error',
      ellipsis: true,
    },
    {
      title: t('admin.monitoring.overview.failAt'),
      dataIndex: 'at',
      key: 'at',
      render: (iso: string | null) => fmtDateTime(iso, tag),
    },
  ];

  return (
    <Box px={{ base: 3, md: 4 }} py={{ base: 3, md: 4 }}>
      <PageInfoBar
        title={t('admin.monitoring.overview.title')}
        subtitle={t('admin.monitoring.overview.subtitle')}
      />
      <MonitoringNav />

      {loading || !data ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12} lg={6}>
              <Card size="small">
                <Statistic
                  title={t('admin.monitoring.overview.taskSuccess')}
                  value={data.tasks.success_rate}
                  suffix="%"
                  valueStyle={{ color: rateColor(data.tasks.success_rate) }}
                />
                <Box mt={2} fontSize="xs" color="gray.500">
                  {t('admin.monitoring.overview.runs', {
                    n: data.tasks.total,
                    f: data.tasks.failures,
                  })}
                </Box>
              </Card>
            </Col>
            <Col xs={24} md={12} lg={6}>
              <Card size="small">
                <Statistic
                  title={t('admin.monitoring.overview.deliveryErr')}
                  value={data.deliveries.error_rate}
                  suffix="%"
                  valueStyle={{ color: errColor(data.deliveries.error_rate) }}
                />
                <Box mt={2} fontSize="xs" color="gray.500">
                  {t('admin.monitoring.overview.deliveries', {
                    n: data.deliveries.total,
                    f: data.deliveries.failed,
                  })}
                </Box>
              </Card>
            </Col>
            <Col xs={24} md={12} lg={6}>
              <Card size="small">
                <Statistic
                  title={t('admin.monitoring.overview.logins')}
                  value={data.logins.total}
                />
                <Box mt={2} fontSize="xs" color="gray.500">
                  {t('admin.monitoring.overview.loginsDetail', {
                    u: data.logins.unique_users,
                    f: data.logins.failed,
                  })}
                </Box>
              </Card>
            </Col>
            <Col xs={24} md={12} lg={6}>
              <Card size="small">
                <Statistic
                  title={t('admin.monitoring.overview.fleetOffline')}
                  value={data.fleet.offline_pct}
                  suffix="%"
                  valueStyle={{ color: errColor(data.fleet.offline_pct) }}
                />
                <Progress
                  percent={100 - data.fleet.offline_pct}
                  showInfo={false}
                  strokeColor="#16a34a"
                  size="small"
                />
                <Box mt={1} fontSize="xs" color="gray.500">
                  {t('admin.monitoring.overview.fleetDetail', {
                    online: data.fleet.online,
                    total: data.fleet.total,
                  })}
                </Box>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={12}>
              <Card
                size="small"
                title={t('admin.monitoring.overview.byChannel')}
              >
                {data.deliveries.by_channel.length === 0 ? (
                  <Box color="gray.500" fontSize="sm">
                    {t('admin.monitoring.overview.noData')}
                  </Box>
                ) : (
                  data.deliveries.by_channel.map((c) => (
                    <Box key={c.channel} mb={2}>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        fontSize="sm"
                      >
                        <span>{c.channel}</span>
                        <span>
                          {c.total} · {c.failed} {t('admin.monitoring.overview.failedShort')}
                        </span>
                      </Box>
                      <Progress
                        percent={100 - c.error_rate}
                        size="small"
                        strokeColor={errColor(c.error_rate)}
                        showInfo={false}
                      />
                    </Box>
                  ))
                )}
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card size="small" title={t('admin.monitoring.overview.byTask')}>
                {data.tasks.by_task.length === 0 ? (
                  <Box color="gray.500" fontSize="sm">
                    {t('admin.monitoring.overview.noData')}
                  </Box>
                ) : (
                  data.tasks.by_task.map((tk) => (
                    <Box
                      key={tk.task_name}
                      display="flex"
                      justifyContent="space-between"
                      fontSize="sm"
                      mb={1}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {tk.task_name.replace('agriapi.tasks.', '')}
                      </span>
                      <Tag color={tk.failures ? 'volcano' : 'green'}>
                        {tk.success_rate}%
                      </Tag>
                    </Box>
                  ))
                )}
              </Card>
            </Col>
          </Row>

          <Card
            size="small"
            title={t('admin.monitoring.overview.recentFailures')}
            style={{ marginTop: 16 }}
          >
            <Table<Failure>
              rowKey={(r) => `${r.type}-${r.name}-${r.at}`}
              columns={failureColumns}
              dataSource={data.recent_failures}
              size="small"
              pagination={false}
              locale={{ emptyText: t('admin.monitoring.overview.noFailures') }}
            />
          </Card>
        </>
      )}
    </Box>
  );
};

export default MonitoringOverviewMain;
