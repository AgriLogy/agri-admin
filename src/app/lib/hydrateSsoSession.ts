// Single-sign-on bridge for the admin console. The identity gateway
// (identity.agrogo-datafarm.com) drops a cookie on the shared parent domain
// after one login; here we copy it into the localStorage keys this app already
// uses so the existing Bearer/refresh/guard flow runs unchanged.
//
// The cookie is readable by JS (not httpOnly) by design — these tokens already
// live in localStorage, so there is no extra exposure.

const SSO_COOKIE_NAME = process.env.NEXT_PUBLIC_SSO_COOKIE_NAME || 'agrogo_sso';

interface SsoSession {
  access?: string;
  refresh?: string;
  is_staff?: boolean;
  is_technician?: boolean;
}

function readSsoCookie(): SsoSession | null {
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${SSO_COOKIE_NAME}=`));
  if (!match) return null;
  try {
    return JSON.parse(
      decodeURIComponent(match.split('=').slice(1).join('='))
    ) as SsoSession;
  } catch {
    return null;
  }
}

// Returns true if an admin session is available locally. Only staff sessions
// are adopted here — a farmer's SSO cookie is ignored so a non-staff tester
// can't land in the admin console (agri-api would reject them anyway).
export const hydrateSsoSession = (): boolean => {
  if (typeof window === 'undefined') return false;

  if (
    localStorage.getItem('accessToken') &&
    localStorage.getItem('refreshToken')
  ) {
    return true;
  }

  const session = readSsoCookie();
  if (session?.access && session?.refresh && session.is_staff) {
    localStorage.setItem('accessToken', session.access);
    localStorage.setItem('refreshToken', session.refresh);
    return true;
  }

  return false;
};
