import { App } from 'antd';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import UserAccessLevelSelect from './UserAccessLevelSelect';
import { adminUserApi } from '@/app/lib/adminUserApi';

// next-intl's useTranslations needs a provider; mock it to echo the key so we
// can assert on option labels and messages without a full i18n context.
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Isolate the network: only setAccessLevel is exercised here.
jest.mock('@/app/lib/adminUserApi', () => ({
  adminUserApi: { setAccessLevel: jest.fn() },
}));

const mockedSetAccessLevel = adminUserApi.setAccessLevel as jest.Mock;

// antd relies on these browser APIs that jsdom does not implement.
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

  // rc-select schedules a macro task via MessageChannel, which jsdom lacks.
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
  mockedSetAccessLevel.mockReset();
});

const renderControl = (
  props: Partial<React.ComponentProps<typeof UserAccessLevelSelect>> = {}
) =>
  render(
    <App>
      <UserAccessLevelSelect
        username="farmer1"
        value="editor"
        selfUsername="admin1"
        {...props}
      />
    </App>
  );

const openDropdown = () => {
  fireEvent.mouseDown(screen.getByRole('combobox'));
};

describe('UserAccessLevelSelect', () => {
  it('renders the current tier', () => {
    renderControl();
    expect(
      screen.getByText('admin.accessLevel.tier.editor')
    ).toBeInTheDocument();
  });

  it('changes the tier and reports the change back (refetch trigger)', async () => {
    mockedSetAccessLevel.mockResolvedValue({
      username: 'farmer1',
      access_level: 'admin',
    });
    const onChanged = jest.fn();
    renderControl({ onChanged });

    openDropdown();
    fireEvent.click(
      await screen.findByText(
        'admin.accessLevel.tier.admin',
        { selector: '.ant-select-item-option-content' }
      )
    );

    await waitFor(() =>
      expect(mockedSetAccessLevel).toHaveBeenCalledWith('farmer1', 'admin')
    );
    await waitFor(() => expect(onChanged).toHaveBeenCalledWith('admin'));
  });

  it('disables the control on the admin’s own row (self-change guard)', () => {
    renderControl({ username: 'admin1', selfUsername: 'admin1' });
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('surfaces a readable error when the server rejects the change', async () => {
    mockedSetAccessLevel.mockRejectedValue({
      response: {
        status: 400,
        data: { detail: 'You cannot change your own access level.' },
      },
    });
    const onChanged = jest.fn();
    renderControl({ onChanged });

    openDropdown();
    fireEvent.click(
      await screen.findByText('admin.accessLevel.tier.admin', {
        selector: '.ant-select-item-option-content',
      })
    );

    expect(
      await screen.findByText('You cannot change your own access level.')
    ).toBeInTheDocument();
    expect(onChanged).not.toHaveBeenCalled();
  });
});
