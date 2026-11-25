import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import AdminLoginBox from './AdminLoginBox';
import api from '@/app/lib/api';

// Echo translation keys so assertions don't depend on a locale.
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(globalThis.location.search),
}));

// The card only adds branding (image + SCSS module); render its children.
jest.mock('@/app/components/auth/LoginCard', () => ({
  LoginCard: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock('@/app/lib/api', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

const mockedPost = api.post as jest.Mock;

// antd relies on browser APIs that jsdom does not implement.
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

  // rc-form schedules a macro task via MessageChannel, which jsdom lacks.
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

beforeEach(() => {
  mockedPost.mockReset();
  mockPush.mockReset();
  localStorage.clear();
  window.history.replaceState({}, '', '/admin/login');
});

const signIn = () => {
  fireEvent.change(
    screen.getByPlaceholderText('misc.adminLogin.usernamePlaceholder'),
    {
      target: { value: 'someone' },
    }
  );
  fireEvent.change(
    screen.getByPlaceholderText('misc.adminLogin.passwordPlaceholder'),
    {
      target: { value: 'secret' },
    }
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'misc.adminLogin.submit' })
  );
};

describe('AdminLoginBox', () => {
  it('refuses a non-staff session: no tokens stored, no redirect, message shown', async () => {
    mockedPost.mockResolvedValue({
      status: 200,
      data: {
        access: 'a',
        refresh: 'r',
        is_staff: false,
        is_technician: false,
      },
    });

    render(<AdminLoginBox />);
    signIn();

    expect(
      await screen.findByText('misc.adminLogin.noAccess')
    ).toBeInTheDocument();
    expect(mockedPost).toHaveBeenCalledWith('/auth/sessions', {
      username: 'someone',
      password: 'secret',
    });
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('accepts a staff session: tokens stored and redirect to /admin', async () => {
    mockedPost.mockResolvedValue({
      status: 200,
      data: { access: 'a', refresh: 'r', is_staff: true, is_technician: false },
    });

    render(<AdminLoginBox />);
    signIn();

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin'));
    expect(localStorage.getItem('accessToken')).toBe('a');
    expect(localStorage.getItem('refreshToken')).toBe('r');
    expect(
      screen.queryByText('misc.adminLogin.noAccess')
    ).not.toBeInTheDocument();
  });

  it('explains the refusal when sent back by the admin shell', async () => {
    window.history.replaceState({}, '', '/admin/login?reason=no-access');

    render(<AdminLoginBox />);

    expect(
      await screen.findByText('misc.adminLogin.noAccess')
    ).toBeInTheDocument();
  });
});
