'use client';

import { App, Select, Tooltip } from 'antd';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { adminUserApi } from '@/app/lib/adminUserApi';
import {
  ACCESS_LEVELS,
  accessLevelErrorMessage,
  type AccessLevel,
} from '@/app/lib/accessLevel';

export type UserAccessLevelSelectProps = {
  /** The target user whose tier this control edits. */
  username: string;
  /** The target user's current tier. */
  value: AccessLevel;
  /** The signed-in admin's username, used to block a self-change. */
  selfUsername?: string | null;
  /** Called with the new tier once the server accepts the change. */
  onChanged?: (next: AccessLevel) => void;
  size?: 'small' | 'middle' | 'large';
};

/**
 * Fixed selector that assigns an RBAC tier (Monitor / Editor / Admin) to a
 * user via POST /users/{username}/access-level, then reports the change back so
 * the caller can refetch. Disabled on the admin's own row; a server-side
 * self-change rejection is surfaced as a readable error.
 */
export function UserAccessLevelSelect({
  username,
  value,
  selfUsername,
  onChanged,
  size = 'small',
}: UserAccessLevelSelectProps) {
  const t = useTranslations();
  const { message } = App.useApp();
  const [saving, setSaving] = useState(false);

  const isSelf = Boolean(selfUsername) && selfUsername === username;

  const handleChange = async (next: AccessLevel) => {
    if (next === value) return;
    setSaving(true);
    try {
      const updated = await adminUserApi.setAccessLevel(username, next);
      message.success(t('admin.accessLevel.changeSuccess', { username }));
      onChanged?.(updated.access_level);
    } catch (err: unknown) {
      message.error(
        accessLevelErrorMessage(err, t('admin.accessLevel.changeError'))
      );
    } finally {
      setSaving(false);
    }
  };

  const options = ACCESS_LEVELS.map((level) => ({
    value: level,
    label: t(`admin.accessLevel.tier.${level}`),
  }));

  const select = (
    <Select<AccessLevel>
      value={value}
      options={options}
      onChange={handleChange}
      disabled={isSelf || saving}
      loading={saving}
      size={size}
      style={{ minWidth: 132 }}
      aria-label={t('admin.accessLevel.ariaLabel', { username })}
      data-testid={`access-level-select-${username}`}
    />
  );

  return isSelf ? (
    <Tooltip title={t('admin.accessLevel.selfDisabledTooltip')}>
      <span data-testid={`access-level-self-${username}`}>{select}</span>
    </Tooltip>
  ) : (
    select
  );
}

export default UserAccessLevelSelect;
