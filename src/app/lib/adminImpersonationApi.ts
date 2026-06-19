/**
 * Typed wrapper for the admin impersonation endpoint
 * (POST /admin/impersonate/{username}).
 *
 * Starts a short-lived, read-only "view-as" session: the backend mints a token
 * that authenticates AS the target user but carries a `readonly` claim, so any
 * mutation made with it is rejected server-side (403).
 */
import api from './api';

export type ImpersonationSession = {
  access: string;
  username: string;
  readonly: boolean;
  expires_in: number;
};

export const adminImpersonationApi = {
  start: (username: string): Promise<ImpersonationSession> =>
    api
      .post<ImpersonationSession>(
        `/admin/impersonate/${encodeURIComponent(username)}`
      )
      .then((r) => r.data),
};

/** Farmer web-app base URL the view-as session hands off to. */
export const WEB_APP_URL =
  process.env.NEXT_PUBLIC_WEB_APP_URL || 'http://localhost:3000';

/**
 * Start a read-only session for `username` and open the farmer app in a new tab,
 * handing the token off via the URL hash (kept out of server logs / query
 * strings). Returns the opened session, or throws on failure.
 */
export const openViewAs = async (
  username: string
): Promise<ImpersonationSession> => {
  const session = await adminImpersonationApi.start(username);
  const url = `${WEB_APP_URL}/view-as#token=${encodeURIComponent(
    session.access
  )}&user=${encodeURIComponent(session.username)}`;
  window.open(url, '_blank', 'noopener');
  return session;
};
