'use client';

import { Card, Col, Empty, Row, Skeleton, Statistic } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { adminAnalyticsApi, type Analytics } from '@/app/lib/adminAnalyticsApi';

const PALETTE = ['#16a34a', '#dc2626', '#2563eb', '#d97706', '#7c3aed'];

const ChartCard = ({
  title,
  children,
  loading,
  empty,
}: {
  title: string;
  children: React.ReactNode;
  loading: boolean;
  empty?: boolean;
}) => (
  <Card title={title} size="small" styles={{ body: { height: 220 } }}>
    {loading ? (
      <Skeleton active paragraph={{ rows: 4 }} />
    ) : empty ? (
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
    ) : (
      <ResponsiveContainer width="100%" height="100%">
        {children as React.ReactElement}
      </ResponsiveContainer>
    )}
  </Card>
);

/**
 * Business-analytics charts for the admin dashboard (recharts), fed by
 * GET /admin/analytics. Self-contained: fetches on mount, renders its own
 * loading / empty states.
 */
const AdminAnalyticsCharts = () => {
  const t = useTranslations();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await adminAnalyticsApi.get();
        if (!cancelled) setData(res);
      } catch {
        /* dashboard already surfaces the primary load error */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const payment = data
    ? Object.entries(data.payment_status).map(([name, value]) => ({
        name,
        value,
      }))
    : [];
  const zones = data
    ? Object.entries(data.zones_per_user).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12} lg={8}>
        <ChartCard
          title={t('admin.analytics.signups')}
          loading={loading}
          empty={!data?.signups_by_week.length}
        >
          <BarChart data={data?.signups_by_week ?? []}>
            <XAxis dataKey="week" hide />
            <YAxis allowDecimals={false} width={28} />
            <Tooltip />
            <Bar dataKey="count" fill={PALETTE[2]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>
      </Col>

      <Col xs={24} md={12} lg={8}>
        <ChartCard
          title={t('admin.analytics.payment')}
          loading={loading}
          empty={!payment.length}
        >
          <PieChart>
            <Pie
              data={payment}
              dataKey="value"
              nameKey="name"
              innerRadius={40}
              outerRadius={70}
            >
              {payment.map((entry, i) => (
                <Cell key={entry.name} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Legend />
            <Tooltip />
          </PieChart>
        </ChartCard>
      </Col>

      <Col xs={24} md={12} lg={8}>
        <ChartCard
          title={t('admin.analytics.alertsByType')}
          loading={loading}
          empty={!data?.alerts_by_type.length}
        >
          <BarChart data={data?.alerts_by_type ?? []} layout="vertical">
            <XAxis type="number" allowDecimals={false} hide />
            <YAxis
              type="category"
              dataKey="type"
              width={90}
              tick={{ fontSize: 10 }}
            />
            <Tooltip />
            <Bar dataKey="count" fill={PALETTE[3]} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartCard>
      </Col>

      <Col xs={24} md={12} lg={8}>
        <ChartCard
          title={t('admin.analytics.zonesPerUser')}
          loading={loading}
          empty={!zones.length}
        >
          <BarChart data={zones}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} width={28} />
            <Tooltip />
            <Bar dataKey="value" fill={PALETTE[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>
      </Col>

      <Col xs={24} md={12} lg={8}>
        <Card title={t('admin.analytics.userStatus')} size="small">
          {loading || !data ? (
            <Skeleton active paragraph={{ rows: 2 }} />
          ) : (
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title={t('admin.analytics.active')}
                  value={data.active_users}
                  valueStyle={{ color: PALETTE[0] }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={t('admin.analytics.inactive')}
                  value={data.inactive_users}
                  valueStyle={{ color: PALETTE[1] }}
                />
              </Col>
            </Row>
          )}
        </Card>
      </Col>

      <Col xs={24} md={12} lg={8}>
        <Card title={t('admin.analytics.devices')} size="small">
          {loading || !data ? (
            <Skeleton active paragraph={{ rows: 2 }} />
          ) : (
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title={t('admin.analytics.devTotal')}
                  value={data.devices.total}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title={t('admin.analytics.devOnline')}
                  value={data.devices.online}
                  valueStyle={{ color: PALETTE[0] }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title={t('admin.analytics.devStale')}
                  value={data.devices.stale}
                  valueStyle={{ color: PALETTE[1] }}
                />
              </Col>
            </Row>
          )}
        </Card>
      </Col>
    </Row>
  );
};

export default AdminAnalyticsCharts;
