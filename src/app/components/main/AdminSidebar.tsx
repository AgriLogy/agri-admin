'use client';

import {
  AlertOutlined,
  AuditOutlined,
  ConsoleSqlOutlined,
  CreditCardOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  ExperimentOutlined,
  FileSearchOutlined,
  LineChartOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  TeamOutlined,
  WifiOutlined,
} from '@ant-design/icons';
import { App, Menu, Tooltip } from 'antd';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useMemo } from 'react';

import { logoutEverywhere } from '@/app/lib/logoutEverywhere';
import useColorModeStyles from '@/app/utils/useColorModeStyles';

const AdminSidebar = () => {
  const t = useTranslations();
  const { bg } = useColorModeStyles();
  const router = useRouter();
  const pathname = usePathname() ?? '/admin';
  const { modal } = App.useApp();

  const selectedKey = useMemo(() => {
    if (pathname.startsWith('/admin/users')) return 'users';
    if (pathname.startsWith('/admin/technicians')) return 'technicians';
    if (pathname.startsWith('/admin/alerts')) return 'alerts';
    if (pathname.startsWith('/admin/devices')) return 'fleet';
    if (pathname.startsWith('/admin/sensor-data')) return 'sensorData';
    if (pathname.startsWith('/admin/monitoring')) return 'monitoring';
    if (pathname.startsWith('/admin/affirmations')) return 'affirmations';
    if (pathname.startsWith('/admin/kc')) return 'kc';
    if (pathname.startsWith('/admin/billing')) return 'billing';
    if (pathname.startsWith('/admin/records')) return 'records';
    if (pathname.startsWith('/admin/audit')) return 'audit';
    if (pathname.startsWith('/admin/settings')) return 'settings';
    if (pathname.startsWith('/admin/database')) return 'database';
    return 'dashboard';
  }, [pathname]);

  const handleLogout = () => {
    modal.confirm({
      title: t('shell.admin.logoutConfirmTitle'),
      content: t('shell.admin.logoutConfirmBody'),
      okText: t('shell.admin.logoutConfirmOk'),
      okType: 'danger',
      cancelText: t('shell.admin.cancel'),
      onOk: () => {
        // Revoke the session everywhere (best-effort), clear local state, then
        // full-navigate to the identity gateway login (NEXT_PUBLIC_LOGIN_PATH).
        logoutEverywhere();
      },
    });
  };

  return (
    <div
      style={{
        background: bg,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <Menu
        mode="inline"
        inlineCollapsed
        selectedKeys={[selectedKey]}
        style={{ borderInlineEnd: 'none', background: 'transparent' }}
        items={[
          {
            key: 'dashboard',
            icon: (
              <Tooltip title={t('shell.admin.dashboard')} placement="right">
                <DashboardOutlined />
              </Tooltip>
            ),
            onClick: () => router.push('/admin'),
          },
          {
            key: 'users',
            icon: (
              <Tooltip title={t('shell.admin.users')} placement="right">
                <TeamOutlined />
              </Tooltip>
            ),
            onClick: () => router.push('/admin/users'),
          },
          {
            key: 'technicians',
            icon: (
              <Tooltip title={t('shell.admin.technicians')} placement="right">
                <SafetyCertificateOutlined />
              </Tooltip>
            ),
            onClick: () => router.push('/admin/technicians'),
          },
          {
            key: 'alerts',
            icon: (
              <Tooltip title={t('shell.admin.alerts')} placement="right">
                <AlertOutlined />
              </Tooltip>
            ),
            onClick: () => router.push('/admin/alerts'),
          },
          {
            key: 'fleet',
            icon: (
              <Tooltip title={t('shell.admin.fleet')} placement="right">
                <WifiOutlined />
              </Tooltip>
            ),
            onClick: () => router.push('/admin/devices/health'),
          },
          {
            key: 'sensorData',
            icon: (
              <Tooltip title={t('shell.admin.sensorData')} placement="right">
                <DatabaseOutlined />
              </Tooltip>
            ),
            onClick: () => router.push('/admin/sensor-data'),
          },
          {
            key: 'monitoring',
            icon: (
              <Tooltip title={t('shell.admin.monitoring')} placement="right">
                <LineChartOutlined />
              </Tooltip>
            ),
            onClick: () => router.push('/admin/monitoring'),
          },
          {
            key: 'affirmations',
            icon: (
              <Tooltip title={t('shell.admin.affirmations')} placement="right">
                <AuditOutlined />
              </Tooltip>
            ),
            onClick: () => router.push('/admin/affirmations'),
          },
          {
            key: 'kc',
            icon: (
              <Tooltip title={t('shell.admin.kc')} placement="right">
                <ExperimentOutlined />
              </Tooltip>
            ),
            onClick: () => router.push('/admin/kc'),
          },
          {
            key: 'records',
            icon: (
              <Tooltip title={t('shell.admin.records')} placement="right">
                <DatabaseOutlined />
              </Tooltip>
            ),
            onClick: () => router.push('/admin/records'),
          },
          {
            key: 'billing',
            icon: (
              <Tooltip title={t('shell.admin.billing')} placement="right">
                <CreditCardOutlined />
              </Tooltip>
            ),
            onClick: () => router.push('/admin/billing'),
          },
          {
            key: 'audit',
            icon: (
              <Tooltip title={t('shell.admin.audit')} placement="right">
                <FileSearchOutlined />
              </Tooltip>
            ),
            onClick: () => router.push('/admin/audit'),
          },
          {
            key: 'settings',
            icon: (
              <Tooltip title={t('shell.admin.settings')} placement="right">
                <SettingOutlined />
              </Tooltip>
            ),
            onClick: () => router.push('/admin/settings'),
          },
          {
            key: 'database',
            icon: (
              <Tooltip title={t('shell.admin.database')} placement="right">
                <ConsoleSqlOutlined />
              </Tooltip>
            ),
            onClick: () => router.push('/admin/database'),
          },
        ]}
      />
      <Menu
        mode="inline"
        inlineCollapsed
        selectable={false}
        style={{ borderInlineEnd: 'none', background: 'transparent' }}
        items={[
          {
            key: 'logout',
            danger: true,
            icon: (
              <Tooltip title={t('shell.admin.logout')} placement="right">
                <LogoutOutlined />
              </Tooltip>
            ),
            onClick: handleLogout,
          },
        ]}
      />
    </div>
  );
};

export default AdminSidebar;
