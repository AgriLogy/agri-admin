import { act, fireEvent, render, screen } from '@testing-library/react';
import { App } from 'antd';

import AssistantVoiceCard from './AssistantVoiceCard';
import {
  adminAssistantApi,
  type VoiceConfig,
} from '@/app/lib/adminAssistantApi';

jest.mock('next-intl', () => {
  const t = (k: string, p?: Record<string, unknown>) =>
    `${k}${p ? JSON.stringify(p) : ''}`;
  return { useLocale: () => 'fr', useTranslations: () => t };
});

jest.mock('@/app/lib/adminAssistantApi', () => {
  const actual = jest.requireActual('@/app/lib/adminAssistantApi');
  return {
    ...actual,
    adminAssistantApi: { get: jest.fn(), saveVoice: jest.fn() },
  };
});

const api = adminAssistantApi as jest.Mocked<typeof adminAssistantApi>;

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

const voice = (over: Partial<VoiceConfig> = {}): VoiceConfig => ({
  enabled: false,
  provider: 'groq',
  model: 'whisper-large-v3',
  language: 'auto',
  has_groq_key: true,
  active: false,
  models: ['whisper-large-v3', 'whisper-large-v3-turbo'],
  languages: ['auto', 'ar', 'fr', 'en'],
  max_seconds: 120,
  ...over,
});

const mount = async () => {
  await act(async () => {
    render(
      <App>
        <AssistantVoiceCard />
      </App>
    );
  });
};

describe('AssistantVoiceCard', () => {
  beforeEach(() => jest.resetAllMocks());

  it('saves the switch, model and language', async () => {
    api.get.mockResolvedValue({ voice: voice() } as never);
    api.saveVoice.mockResolvedValue(voice({ enabled: true, active: true }));
    await mount();
    expect(
      screen.getByText('admin.assistantPage.voice.inactive')
    ).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole('switch'));
    });
    await act(async () => {
      fireEvent.click(screen.getByText('admin.assistantPage.voice.save'));
    });
    expect(api.saveVoice).toHaveBeenCalledWith({
      enabled: true,
      model: 'whisper-large-v3',
      language: 'auto',
    });
    expect(
      await screen.findByText('admin.assistantPage.voice.active')
    ).toBeInTheDocument();
  });

  it('warns and blocks the switch without a Groq key', async () => {
    api.get.mockResolvedValue({
      voice: voice({ has_groq_key: false }),
    } as never);
    await mount();
    expect(
      screen.getByText('admin.assistantPage.voice.noKey')
    ).toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeDisabled();
  });

  it('hides itself on an API without voice support', async () => {
    api.get.mockResolvedValue({} as never);
    await mount();
    expect(screen.queryByText('admin.assistantPage.voice.title')).toBeNull();
  });
});
