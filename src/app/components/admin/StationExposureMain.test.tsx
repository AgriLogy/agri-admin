import { act, fireEvent, render, screen } from '@testing-library/react';
import { App } from 'antd';

import StationExposureMain from './StationExposureMain';
import {
  adminStationsApi,
  summarizeStations,
  type StationRow,
} from '@/app/lib/adminStationsApi';

// Echo "key" plus params, so interpolated values are assertable.
jest.mock('next-intl', () => {
  const t = (k: string, p?: Record<string, unknown>) =>
    `${k}${p ? JSON.stringify(p) : ''}`;
  return { useLocale: () => 'en', useTranslations: () => t };
});

jest.mock('@/app/lib/adminStationsApi', () => {
  const actual = jest.requireActual('@/app/lib/adminStationsApi');
  return {
    ...actual,
    adminStationsApi: {
      list: jest.fn(),
      setPlacement: jest.fn(),
      checkNow: jest.fn(),
    },
  };
});

const api = adminStationsApi as jest.Mocked<typeof adminStationsApi>;

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
  // antd's message toasts schedule through MessageChannel (absent in jsdom).
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

const router02 = (over: Partial<StationRow> = {}): StationRow => ({
  device_id: 2,
  device: 'Router02',
  serial: 'router02',
  zone_id: 5,
  user_id: 7,
  username: 'farm2',
  placement: 'outdoor',
  placement_updated_at: '2026-11-24T20:00:00+00:00',
  placement_updated_by: 'ops',
  last_reading: '2026-11-24T20:22:00+00:00',
  report: {
    device_id: 2,
    device: 'Router02',
    checked_at: '2026-11-24T14:00:00+00:00',
    window_hours: 24,
    status: 'sheltered',
    hours_compared: 24,
    signals: [{ code: 'warm_nights', detail: { mean_bias_c: 5.3 } }],
    sensors: { solar: 'sheltered', wind: 'sheltered', temperature: 'ok' },
    placement: 'outdoor',
    detected: 'indoor',
    mismatch: true,
  },
  ...over,
});

const field1: StationRow = {
  ...router02(),
  device_id: 3,
  device: 'Field 1',
  serial: 'field-1',
  placement: 'indoor',
  report: null,
};

describe('summarizeStations', () => {
  it('counts sheltered, mismatches and declared indoor', () => {
    expect(summarizeStations([router02(), field1])).toEqual({
      total: 2,
      sheltered: 1,
      mismatch: 1,
      declaredIndoor: 1,
    });
  });
});

describe('StationExposureMain', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    api.list.mockResolvedValue({
      stations: [router02(), field1],
      placements: ['auto', 'outdoor', 'indoor'],
      window_hours: 24,
    });
  });

  const mount = async () => {
    await act(async () => {
      render(
        <App>
          <StationExposureMain />
        </App>
      );
    });
  };

  it('shows detection, mismatch, per-sensor verdicts and why', async () => {
    await mount();
    expect(screen.getByText('Router02')).toBeInTheDocument();
    expect(
      screen.getByText('admin.stations.detected.indoor')
    ).toBeInTheDocument();
    expect(screen.getByText('admin.stations.mismatch')).toBeInTheDocument();
    expect(
      screen.getAllByText('admin.stations.sensor.solar').length
    ).toBeGreaterThan(0);
    expect(
      screen.getByText('admin.stations.signal.warm_nights{"mean_bias_c":5.3}')
    ).toBeInTheDocument();
    // Field 1 has no report yet.
    expect(
      screen.getByText('admin.stations.notCheckedYet')
    ).toBeInTheDocument();
  });

  it('check now replaces the row report', async () => {
    await mount();
    api.checkNow.mockResolvedValue({
      ...router02().report!,
      device_id: 3,
      device: 'Field 1',
      status: 'ok',
      signals: [],
      detected: 'outdoor',
      mismatch: true,
      sensors: { solar: 'ok', wind: 'ok', temperature: 'ok' },
    });
    const buttons = screen.getAllByText('admin.stations.checkNow');
    await act(async () => {
      fireEvent.click(buttons[1]);
    });
    expect(api.checkNow).toHaveBeenCalledWith(3);
    expect(screen.queryByText('admin.stations.notCheckedYet')).toBeNull();
    expect(
      screen.getByText('admin.stations.detected.outdoor')
    ).toBeInTheDocument();
  });
});
