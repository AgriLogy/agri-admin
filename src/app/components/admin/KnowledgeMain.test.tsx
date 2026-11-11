import { App } from 'antd';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import KnowledgeMain from './KnowledgeMain';
import {
  adminKnowledgeApi,
  type KnowledgeArticle,
} from '@/app/lib/adminKnowledgeApi';

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

jest.mock('@/app/components/layout/PageInfoBar', () => ({
  PageInfoBar: ({
    title,
    actions,
  }: {
    title: string;
    actions?: React.ReactNode;
  }) => (
    <div>
      <h1>{title}</h1>
      {actions}
    </div>
  ),
}));

jest.mock('@/app/lib/adminKnowledgeApi', () => {
  const actual = jest.requireActual('@/app/lib/adminKnowledgeApi');
  return {
    ...actual,
    adminKnowledgeApi: {
      list: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      setStatus: jest.fn(),
      remove: jest.fn(),
    },
  };
});

const api = adminKnowledgeApi as jest.Mocked<typeof adminKnowledgeApi>;

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

const base: KnowledgeArticle = {
  id: 1,
  title: 'Irrigation de l’olivier',
  language: 'fr',
  topic: 'irrigation',
  crops: ['olivier'],
  keywords: 'sqi',
  body: 'Texte',
  sources: [{ title: 'FAO-56', url: 'https://www.fao.org/' }],
  status: 'review',
  review_due: null,
  review_overdue: false,
  reviewed_at: null,
  reviewed_by_id: null,
  created_by_id: 1,
  updated_by_id: 1,
  created_at: null,
  updated_at: null,
};

const listOf = (items: KnowledgeArticle[], available = true) => ({
  available,
  detail: available ? undefined : 'Apply the agri-db migration (b8d4f0a2c3e5).',
  items,
  counts: { review: items.length },
  statuses: ['draft', 'review', 'approved', 'archived'] as const,
  topics: ['irrigation', 'soil'],
  languages: ['ary', 'ar', 'fr', 'en'] as const,
});

const renderPage = () =>
  render(
    <App>
      <KnowledgeMain />
    </App>
  );

beforeEach(() => {
  jest.clearAllMocks();
});

it('approves an article in review', async () => {
  api.list.mockResolvedValue(listOf([base]) as never);
  api.setStatus.mockResolvedValue({ ...base, status: 'approved' });
  renderPage();

  const approve = await screen.findByRole('button', {
    name: 'admin.knowledge.action.approved',
  });
  const loadsBefore = api.list.mock.calls.length;
  fireEvent.click(approve);
  await waitFor(() =>
    expect(api.setStatus).toHaveBeenCalledWith(1, 'approved')
  );
  // The list is reloaded after the change.
  await waitFor(() =>
    expect(api.list.mock.calls.length).toBeGreaterThan(loadsBefore)
  );
});

it('cannot approve an article without a source', async () => {
  api.list.mockResolvedValue(listOf([{ ...base, sources: [] }]) as never);
  renderPage();
  const approve = await screen.findByRole('button', {
    name: 'admin.knowledge.action.approved',
  });
  expect(approve).toBeDisabled();
});

it('flags an overdue approved article', async () => {
  api.list.mockResolvedValue(
    listOf([
      {
        ...base,
        status: 'approved',
        review_due: '2026-01-01',
        review_overdue: true,
      },
    ]) as never
  );
  renderPage();
  expect(await screen.findByTestId('overdue')).toHaveTextContent('2026-01-01');
});

it('explains a missing table and blocks creation', async () => {
  api.list.mockResolvedValue(listOf([], false) as never);
  renderPage();
  expect(
    await screen.findByText('admin.knowledge.unavailable')
  ).toBeInTheDocument();
  expect(screen.getByText(/b8d4f0a2c3e5/)).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'admin.knowledge.new' })
  ).toBeDisabled();
});
