'use client';

import { Segmented } from 'antd';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';

/** Sub-navigation shared by the records pages. */
const RecordsNav = () => {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname() ?? '/admin/records';

  const value = pathname.startsWith('/admin/records/conversations')
    ? 'conversations'
    : pathname.startsWith('/admin/records/grants')
      ? 'grants'
      : 'notifications';

  return (
    <Segmented
      value={value}
      onChange={(v) => {
        const seg = v as string;
        router.push(
          seg === 'notifications' ? '/admin/records' : `/admin/records/${seg}`
        );
      }}
      options={[
        { label: t('admin.records.nav.notifications'), value: 'notifications' },
        { label: t('admin.records.nav.conversations'), value: 'conversations' },
        { label: t('admin.records.nav.grants'), value: 'grants' },
      ]}
      style={{ marginBottom: 16 }}
    />
  );
};

export default RecordsNav;
