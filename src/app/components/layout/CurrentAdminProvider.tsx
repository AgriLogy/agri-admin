'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import api from '@/app/lib/api';
import {
  ADMIN_NO_ACCESS_PATH,
  isStaffAccount,
  type CurrentAdminUser,
} from '@/app/lib/adminAccess';
import { checkAuthTokens } from '@/app/lib/checkAuthTokens';
import { clearSsoSession } from '@/app/lib/clearSsoSession';

const CurrentAdminContext = createContext<CurrentAdminUser | null>(null);

/** The signed-in staff account (null until GET /users/me has answered). */
export const useCurrentAdmin = (): CurrentAdminUser | null =>
  useContext(CurrentAdminContext);

/**
 * Loads the signed-in account once for the admin shell and shares it with the
 * header menus. Also the access guard: a session that is not staff has its
 * tokens cleared and is sent back to the admin login with an explanation.
 *
 * Children render straight away, as before; a missing or expired session is
 * still handled by the api client's 401 redirect.
 */
export function CurrentAdminProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [me, setMe] = useState<CurrentAdminUser | null>(null);

  useEffect(() => {
    // Adopts a staff SSO cookie if present. Without tokens there is nothing to
    // check here; the request below gets a 401 and the api client redirects.
    checkAuthTokens();

    let cancelled = false;
    api
      .get<CurrentAdminUser>('/users/me')
      .then((res) => {
        if (cancelled) return;
        if (!isStaffAccount(res.data)) {
          clearSsoSession();
          router.replace(ADMIN_NO_ACCESS_PATH);
          return;
        }
        setMe(res.data);
      })
      .catch(() => {
        /* 401 is handled by the api client; other errors keep the defaults */
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <CurrentAdminContext.Provider value={me}>
      {children}
    </CurrentAdminContext.Provider>
  );
}
