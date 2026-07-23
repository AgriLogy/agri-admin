/**
 * RBAC access-level tiers (USR-1). Pure, dependency-free helpers so the label /
 * colour / error-mapping logic can be unit-tested without React or the network.
 *
 * Tiers (least → most privileged):
 *   monitor — read-only
 *   editor  — create / edit
 *   admin   — full access + user management
 */

export type AccessLevel = 'monitor' | 'editor' | 'admin';

/** Display order, least to most privileged. */
export const ACCESS_LEVELS: readonly AccessLevel[] = [
  'monitor',
  'editor',
  'admin',
] as const;

/** Runtime guard for values coming off the wire. */
export const isAccessLevel = (value: unknown): value is AccessLevel =>
  typeof value === 'string' &&
  (ACCESS_LEVELS as readonly string[]).includes(value);

/** antd Tag colour for a tier. */
export const accessLevelColor = (level: AccessLevel): string => {
  switch (level) {
    case 'admin':
      return 'red';
    case 'editor':
      return 'blue';
    case 'monitor':
    default:
      return 'default';
  }
};

/** i18n key for a tier's short label (Monitor / Editor / Admin). */
export const accessLevelLabelKey = (level: AccessLevel): string =>
  `admin.accessLevel.tier.${level}`;

/** i18n key for a tier's one-line description. */
export const accessLevelDescKey = (level: AccessLevel): string =>
  `admin.accessLevel.desc.${level}`;

/**
 * Extract a human-readable message from a rejected access-level change — most
 * importantly the server's 400 when an admin tries to change their OWN level —
 * falling back to a generic message when the response carries nothing usable.
 */
export const accessLevelErrorMessage = (
  err: unknown,
  fallback: string
): string => {
  const data = (err as { response?: { data?: unknown } })?.response?.data;

  if (typeof data === 'string' && data.trim()) return data;

  if (data && typeof data === 'object') {
    const rec = data as Record<string, unknown>;
    const pick = (value: unknown): string | null => {
      if (typeof value === 'string' && value.trim()) return value;
      if (Array.isArray(value) && typeof value[0] === 'string' && value[0])
        return value[0];
      return null;
    };
    return (
      pick(rec.detail) ??
      pick(rec.access_level) ??
      pick(rec.error) ??
      pick(rec.message) ??
      fallback
    );
  }

  return fallback;
};
