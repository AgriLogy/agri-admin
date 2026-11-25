'use client';

import { Result } from 'antd';
import { useTranslations } from 'next-intl';

/**
 * Shown in place of a back-office page when agri-api refused its data with a
 * 403 (the account lacks the access level the page needs). AntD's Result picks
 * up the app's theme (dark mode) and text direction (RTL) from ConfigProvider.
 */
export function AccessRefused() {
  const t = useTranslations('accessRefused');
  return (
    <div role="alert" data-testid="access-refused">
      <Result status="403" title={t('title')} subTitle={t('description')} />
    </div>
  );
}

export default AccessRefused;
