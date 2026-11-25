import { render, screen, waitFor } from '@testing-library/react';

import { CurrentAdminProvider, useCurrentAdmin } from './CurrentAdminProvider';
import api from '@/app/lib/api';

const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: mockReplace }),
}));

jest.mock('@/app/lib/api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const mockedGet = api.get as jest.Mock;

const WhoAmI = () => {
  const me = useCurrentAdmin();
  return <span>{me ? `user:${me.username}` : 'loading'}</span>;
};

beforeEach(() => {
  mockedGet.mockReset();
  mockReplace.mockReset();
  localStorage.clear();
  localStorage.setItem('accessToken', 'a');
  localStorage.setItem('refreshToken', 'r');
});

describe('CurrentAdminProvider (admin access guard)', () => {
  it('clears the tokens and sends a non-staff account back to the login', async () => {
    mockedGet.mockResolvedValue({
      data: { username: 'farmer', is_staff: false, access_level: 'editor' },
    });

    render(
      <CurrentAdminProvider>
        <WhoAmI />
      </CurrentAdminProvider>
    );

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith('/admin/login?reason=no-access')
    );
    expect(mockedGet).toHaveBeenCalledTimes(1);
    expect(mockedGet).toHaveBeenCalledWith('/users/me');
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(screen.getByText('loading')).toBeInTheDocument();
  });

  it('keeps a staff account and shares it with the shell', async () => {
    mockedGet.mockResolvedValue({
      data: { username: 'boss', is_staff: true, access_level: 'admin' },
    });

    render(
      <CurrentAdminProvider>
        <WhoAmI />
      </CurrentAdminProvider>
    );

    expect(await screen.findByText('user:boss')).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(localStorage.getItem('accessToken')).toBe('a');
  });

  it('leaves a failed request to the api client (no redirect here)', async () => {
    mockedGet.mockRejectedValue(new Error('network'));

    render(
      <CurrentAdminProvider>
        <WhoAmI />
      </CurrentAdminProvider>
    );

    await waitFor(() => expect(mockedGet).toHaveBeenCalled());
    expect(mockReplace).not.toHaveBeenCalled();
    expect(localStorage.getItem('accessToken')).toBe('a');
  });
});
