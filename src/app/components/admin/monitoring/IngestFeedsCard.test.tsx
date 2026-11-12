import { act, render, screen } from '@testing-library/react';

import IngestFeedsCard, { INGEST_POLL_MS } from './IngestFeedsCard';
import {
  adminMonitoringApi,
  type IngestStatus,
} from '@/app/lib/adminMonitoringApi';

// Echo "ns.key" plus params, so interpolated values are assertable.
jest.mock('next-intl', () => {
  const cache = new Map();
  return {
    useLocale: () => 'en',
    useTranslations: (ns = '') => {
      if (!cache.has(ns)) {
        cache.set(
          ns,
          (k: string, p?: Record<string, unknown>) =>
            `${ns}.${k}${p ? JSON.stringify(p) : ''}`
        );
      }
      return cache.get(ns);
    },
  };
});

jest.mock('@/app/lib/adminMonitoringApi', () => {
  const actual = jest.requireActual('@/app/lib/adminMonitoringApi');
  return { ...actual, adminMonitoringApi: { ingest: jest.fn() } };
});

const ingest = adminMonitoringApi.ingest as jest.Mock;

const status = (over: Partial<IngestStatus> = {}): IngestStatus => ({
  checked_at: '2026-11-12T12:00:00+00:00',
  threshold_hours: 2,
  renotify_hours: 24,
  recipients: 3,
  feeds: [
    {
      key: 'lora',
      label: 'LoRaWAN uplinks (ChirpStack)',
      source: 'lora_uplink.received_at',
      status: 'stale',
      latest_at: '2026-06-13T11:42:25+00:00',
      hours_silent: 3672.3,
      last_hour_count: 0,
      alert_active: true,
    },
    {
      key: 'bivocom',
      label: 'Bivocom / router weather readings',
      source: 'analytics_temperatureweather.timestamp',
      status: 'ok',
      latest_at: '2026-11-12T11:55:00+00:00',
      hours_silent: 0.1,
      last_hour_count: 12,
      alert_active: false,
    },
  ],
  ...over,
});

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
});

beforeEach(() => ingest.mockReset());
afterEach(() => jest.useRealTimers());

it('shows each feed with its status, last-hour count and armed alert', async () => {
  ingest.mockResolvedValue(status());
  render(<IngestFeedsCard />);

  expect(await screen.findByTestId('ingest-lora')).toHaveTextContent(
    'admin.monitoring.ingest.stale{"h":3672.3}'
  );
  expect(screen.getByTestId('ingest-bivocom')).toHaveTextContent(
    'admin.monitoring.ingest.ok'
  );
  expect(screen.getByText('12')).toBeInTheDocument();
  expect(
    screen.getByText('admin.monitoring.ingest.alertArmed')
  ).toBeInTheDocument();
  expect(
    screen.getByText('admin.monitoring.ingest.footer{"h":2,"r":3,"n":24}')
  ).toBeInTheDocument();
});

it('hides itself when the backend has no ingest endpoint', async () => {
  ingest.mockRejectedValue(new Error('404'));
  const { container } = render(<IngestFeedsCard />);
  await act(async () => {});
  expect(container).toBeEmptyDOMElement();
});

it('polls so a feed coming back shows up without a reload', async () => {
  jest.useFakeTimers();
  ingest.mockResolvedValueOnce(status()).mockResolvedValueOnce(
    status({
      feeds: status().feeds.map((f) =>
        f.key === 'lora'
          ? { ...f, status: 'ok', hours_silent: 0, last_hour_count: 4 }
          : f
      ),
    })
  );
  render(<IngestFeedsCard />);
  await act(async () => {});
  expect(screen.getByTestId('ingest-lora')).toHaveTextContent(
    'admin.monitoring.ingest.stale'
  );

  await act(async () => {
    jest.advanceTimersByTime(INGEST_POLL_MS);
  });
  expect(ingest).toHaveBeenCalledTimes(2);
  expect(screen.getByTestId('ingest-lora')).toHaveTextContent(
    'admin.monitoring.ingest.ok'
  );
});
