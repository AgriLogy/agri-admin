/**
 * Who may use the admin console. Only staff accounts: agri-api answers 403 to
 * every admin endpoint for anyone else, so letting them in only shows empty
 * pages. Same rule hydrateSsoSession applies to the shared SSO cookie.
 */

/** Query value the login page reads to explain why the user was sent back. */
export const ADMIN_NO_ACCESS_REASON = 'no-access';

/** Where a signed-in but non-staff account is sent. */
export const ADMIN_NO_ACCESS_PATH = `/admin/login?reason=${ADMIN_NO_ACCESS_REASON}`;

/** Shape of GET /users/me as far as the admin shell needs it. */
export interface CurrentAdminUser {
  username: string;
  is_staff?: boolean;
  is_superuser?: boolean;
  is_technician?: boolean;
  access_level?: string;
}

/**
 * True only when the server explicitly says the account is staff. Fails closed:
 * a missing or non-boolean flag is treated as "not staff".
 */
export const isStaffAccount = (
  account: { is_staff?: unknown } | null | undefined
): boolean => account?.is_staff === true;
