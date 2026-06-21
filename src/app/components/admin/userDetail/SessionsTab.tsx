'use client';

import {
  LogoutOutlined,
  ReloadOutlined,
  StopOutlined,
} from '@ant-design/icons';
import {
  App,
  Button,
  Descriptions,
  Skeleton,
  Space,
  Tag,
  Typography,
} from 'antd';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import {
  adminUserApi,
  type AdminUserDetail,
  type UserSessionStatus,
} from '@/app/lib/adminUserApi';

const localeTag = (locale: string): string =>
  locale === 'ar' ? 'ar' : locale === 'en' ? 'en-GB' : 'fr-FR';

const formatDateTime = (iso: string | null, tag: string): string => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(tag);
  } catch {
    return iso;
  }
};

const STATUS_COLOR: Record<UserSessionStatus['status'], string> = {
  active: 'green',
  revoked: 'orange',
  disabled: 'red',
  never_logged_in: 'default',
};

export type SessionsTabProps = {
  user: AdminUserDetail;
  onChange: (next: AdminUserDetail) => void;
};

export function SessionsTab({ user, onChange }: SessionsTabProps) {
  const t = useTranslations();
  const tag = localeTag(useLocale());
  const { message, modal } = App.useApp();

  const [status, setStatus] = useState<UserSessionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(false);
  const [toggling, setToggling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setStatus(await adminUserApi.sessions(user.username));
    } catch {
      message.error(t('admin.userSessions.loadError'));
    } finally {
      setLoading(false);
    }
  }, [message, t, user.username]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleForceLogout = () => {
    modal.confirm({
      title: t('admin.userSessions.forceLogoutConfirm', {
        name: user.username,
      }),
      content: t('admin.userSessions.forceLogoutExplainer', {
        minutes: status?.access_token_lifetime_minutes ?? 0,
      }),
      okText: t('admin.userSessions.forceLogout'),
      okButtonProps: { danger: true },
      cancelText: t('admin.userSessions.cancel'),
      onOk: async () => {
        setRevoking(true);
        try {
          setStatus(await adminUserApi.forceLogout(user.username));
          message.success(t('admin.userSessions.forceLogoutDone'));
        } catch {
          message.error(t('admin.userSessions.actionError'));
        } finally {
          setRevoking(false);
        }
      },
    });
  };

  const handleToggleActive = () => {
    const disabling = user.is_active;
    modal.confirm({
      title: disabling
        ? t('admin.userSessions.disableConfirm', { name: user.username })
        : t('admin.userSessions.enableConfirm', { name: user.username }),
      okText: disabling
        ? t('admin.userSessions.disableAccount')
        : t('admin.userSessions.enableAccount'),
      okButtonProps: { danger: disabling },
      cancelText: t('admin.userSessions.cancel'),
      onOk: async () => {
        setToggling(true);
        try {
          const updated = await adminUserApi.toggleActive(user.username);
          onChange({
            ...user,
            is_active: updated.is_active,
            sessions_revoked_at: updated.sessions_revoked_at,
          });
          message.success(
            updated.is_active
              ? t('admin.userSessions.enabled')
              : t('admin.userSessions.disabled')
          );
          await load();
        } catch {
          message.error(t('admin.userSessions.actionError'));
        } finally {
          setToggling(false);
        }
      },
    });
  };

  if (loading && !status) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }

  const statusKey = status?.status ?? 'never_logged_in';

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space size={8} wrap>
        <Tag
          color={STATUS_COLOR[statusKey]}
          style={{ fontSize: 14, padding: '2px 10px' }}
        >
          {t(`admin.userSessions.status.${statusKey}`)}
        </Tag>
        <Button
          size="small"
          icon={<ReloadOutlined />}
          onClick={() => void load()}
          loading={loading}
        >
          {t('admin.userSessions.refresh')}
        </Button>
      </Space>

      <Descriptions
        bordered
        size="small"
        column={1}
        styles={{ label: { width: 220 } }}
      >
        <Descriptions.Item label={t('admin.userSessions.lastLogin')}>
          {formatDateTime(status?.last_login ?? null, tag)}
        </Descriptions.Item>
        <Descriptions.Item label={t('admin.userSessions.tokenExpires')}>
          {formatDateTime(status?.current_token_expires_at ?? null, tag)}
        </Descriptions.Item>
        <Descriptions.Item label={t('admin.userSessions.revokedAt')}>
          {formatDateTime(status?.sessions_revoked_at ?? null, tag)}
        </Descriptions.Item>
        <Descriptions.Item label={t('admin.userSessions.tokenLifetime')}>
          {t('admin.userSessions.minutes', {
            minutes: status?.access_token_lifetime_minutes ?? 0,
          })}
        </Descriptions.Item>
      </Descriptions>

      <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
        {t('admin.userSessions.explainer', {
          minutes: status?.access_token_lifetime_minutes ?? 0,
        })}
      </Typography.Paragraph>

      <Space wrap>
        <Button
          danger
          icon={<LogoutOutlined />}
          onClick={handleForceLogout}
          loading={revoking}
          disabled={!user.is_active}
        >
          {t('admin.userSessions.forceLogout')}
        </Button>
        <Button
          danger={user.is_active}
          icon={<StopOutlined />}
          onClick={handleToggleActive}
          loading={toggling}
        >
          {user.is_active
            ? t('admin.userSessions.disableAccount')
            : t('admin.userSessions.enableAccount')}
        </Button>
      </Space>
    </Space>
  );
}

export default SessionsTab;
