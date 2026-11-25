import { App } from 'antd';
import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { render, screen, waitFor } from '@testing-library/react';

import { AdminPageShell } from './AdminPageShell';
import KnowledgeMain from '@/app/components/admin/KnowledgeMain';
import api from '@/app/lib/api';
import {
  currentAccessGeneration,
  isAccessDenied,
  reportAccessDenied,
  startAccessGeneration,
} from '@/app/lib/accessDenied';

// Echo the key; one stable function per namespace, like next-intl's own.
jest.mock('next-intl', () => {
  const cache = new Map();
  return {
    useTranslations: (ns = '') => {
      if (!cache.has(ns)) {
        cache.set(ns, (k: string) => (ns ? `${ns}.${k}` : k));
      }
      return cache.get(ns);
    },
  };
});

// The staff guard (CurrentAdminProvider) has its own tests; here it only has
// to let the page through, so this suite stays about the 403 panel.
jest.mock('@/app/components/layout/CurrentAdminProvider', () => ({
  CurrentAdminProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

jest.mock('@/app/components/main/AdminHeader', () => ({
  __esModule: true,
  default: () => <header />,
}));
jest.mock('@/app/components/main/AdminSidebar', () => ({
  __esModule: true,
  default: () => <nav />,
}));
jest.mock('@/app/utils/useColorModeStyles', () => ({
  __esModule: true,
  default: () => ({ textColor: 'black', navBgColor: 'white' }),
}));
jest.mock('@/app/components/layout/PageInfoBar', () => ({
  PageInfoBar: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }),
  });
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  global.MessageChannel = class {
    port1: { onmessage: ((ev: unknown) => void) | null; close: () => void } = {
      onmessage: null,
      close() {},
    };
    port2 = {
      postMessage: () => {
        setTimeout(() => this.port1.onmessage?.({}), 0);
      },
      close() {},
    };
  } as unknown as typeof MessageChannel;
});

const originalAdapter = api.defaults.adapter;
afterEach(() => {
  api.defaults.adapter = originalAdapter;
});

/**
 * Answer every request through the real shared axios client (so its
 * interceptors run) with `status` and `data`, like agri-api would.
 */
function serve(status: number, data: unknown) {
  api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const response = {
      data,
      status,
      statusText: String(status),
      headers: {},
      config,
      request: {},
    };
    if (status >= 400) {
      throw new AxiosError(
        `Request failed with status code ${status}`,
        AxiosError.ERR_BAD_REQUEST,
        config,
        {},
        response
      );
    }
    return response;
  };
}

const emptyList = {
  available: true,
  items: [],
  counts: {},
  statuses: ['draft', 'review', 'approved', 'archived'],
  topics: [],
  languages: ['ary', 'ar', 'fr', 'en'],
};

const renderKnowledgePage = () =>
  render(
    <App>
      <AdminPageShell>
        <KnowledgeMain />
      </AdminPageShell>
    </App>
  );

it('shows "access refused" instead of the empty list when the API answers 403', async () => {
  serve(403, { detail: 'Admin access required' });
  renderKnowledgePage();

  expect(await screen.findByTestId('access-refused')).toBeInTheDocument();
  expect(screen.getByText('accessRefused.title')).toBeInTheDocument();
  expect(screen.getByText('accessRefused.description')).toBeInTheDocument();
  expect(screen.queryByText('admin.knowledge.empty')).not.toBeInTheDocument();
});

it('still shows the normal empty state for a 200 with no rows', async () => {
  serve(200, emptyList);
  renderKnowledgePage();

  expect(
    (await screen.findAllByText('admin.knowledge.empty')).length
  ).toBeGreaterThan(0);
  expect(screen.queryByTestId('access-refused')).not.toBeInTheDocument();
});

it('does not treat a refused write (non-GET 403) as a refused page', async () => {
  serve(403, { detail: 'Read-only (technician) access.' });
  startAccessGeneration();
  await expect(api.post('/admin/assistant/knowledge', {})).rejects.toThrow();
  expect(isAccessDenied()).toBe(false);
});

it('ignores a late 403 from the previous page view', () => {
  startAccessGeneration();
  const previous = currentAccessGeneration();
  startAccessGeneration();
  reportAccessDenied(previous);
  expect(isAccessDenied()).toBe(false);
});

it('a new page view clears the refusal', async () => {
  serve(403, {});
  startAccessGeneration();
  await expect(api.get('/admin/assistant/config')).rejects.toThrow();
  await waitFor(() => expect(isAccessDenied()).toBe(true));
  startAccessGeneration();
  expect(isAccessDenied()).toBe(false);
});
