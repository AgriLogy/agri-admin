import axios from 'axios';
import { clearSsoSession } from './clearSsoSession';
import { hydrateSsoSession } from './hydrateSsoSession';
import { currentAccessGeneration, reportAccessDenied } from './accessDenied';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://back.agrogo-datafarm.com';
//  "http://localhost:8000";

if (process.env.NODE_ENV === 'development') {
  console.debug('[NEXT_PUBLIC_API_URL]', API_URL);
}

const api = axios.create({
  baseURL: API_URL,
  withCredentials: false, // This prevents sending cookies like CSRF token
});

// Page-view generation each request was sent in (see ./accessDenied), keyed on
// the request config so nothing extra is sent to the server.
const requestGeneration = new WeakMap<object, number>();

// Add an interceptor to include the access token in every request
api.interceptors.request.use(
  (config) => {
    // Ensure a single-sign-on session from the identity gateway is adopted
    // before the very first request, so the Bearer header is attached.
    hydrateSsoSession();
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    requestGeneration.set(config, currentAccessGeneration());
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const requestUrl = error.config?.url ?? '';
    const isAuthEndpoint =
      requestUrl.includes('/auth/sessions') ||
      requestUrl.includes('/auth/token');

    if (error.response && error.response.status === 401 && !isAuthEndpoint) {
      clearSsoSession();
      // Login route differs per app (web: /login, admin: /admin/login).
      // NEXT_PUBLIC_LOGIN_PATH overrides; default keeps the farmer app's path.
      window.location.href = process.env.NEXT_PUBLIC_LOGIN_PATH || '/login';
    }

    // A refused read means the account lacks the access level this page
    // needs: let AdminPageShell say so instead of showing an empty page.
    const method = (error.config?.method ?? 'get').toLowerCase();
    if (
      error.response &&
      error.response.status === 403 &&
      method === 'get' &&
      !isAuthEndpoint
    ) {
      reportAccessDenied(
        (error.config && requestGeneration.get(error.config)) ??
          currentAccessGeneration()
      );
    }
    return Promise.reject(error);
  }
);

export default api;
