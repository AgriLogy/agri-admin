'use client';

import { Segmented } from 'antd';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';

/** Sub-navigation shared by the four monitoring pages. */
const MonitoringNav = () => {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname() ?? '/admin/monitoring';

  const value = pathname.startsWith('/admin/monitoring/automations')
    ? 'automations'
    : pathname.startsWith('/admin/monitoring/deliveries')
      ? 'deliveries'
      : pathname.startsWith('/admin/monitoring/activity')
        ? 'activity'
        : 'overview';

  return (
    <Segmented
      value={value}
      onChange={(v) => {
        const seg = v as string;
        router.push(
          seg === 'overview' ? '/admin/monitoring' : `/admin/monitoring/${seg}`
        );
      }}
      options={[
        { label: t('admin.monitoring.nav.overview'), value: 'overview' },
        { label: t('admin.monitoring.nav.automations'), value: 'automations' },
        { label: t('admin.monitoring.nav.deliveries'), value: 'deliveries' },
        { label: t('admin.monitoring.nav.activity'), value: 'activity' },
      ]}
      style={{ marginBottom: 16 }}
    />
  );
};

export default MonitoringNav;
