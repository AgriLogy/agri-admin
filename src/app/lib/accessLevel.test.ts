import {
  ACCESS_LEVELS,
  accessLevelColor,
  accessLevelDescKey,
  accessLevelErrorMessage,
  accessLevelLabelKey,
  isAccessLevel,
} from './accessLevel';

describe('ACCESS_LEVELS', () => {
  it('lists the three tiers least → most privileged', () => {
    expect(ACCESS_LEVELS).toEqual(['monitor', 'editor', 'admin']);
  });
});

describe('isAccessLevel', () => {
  it('accepts known tiers', () => {
    expect(isAccessLevel('monitor')).toBe(true);
    expect(isAccessLevel('editor')).toBe(true);
    expect(isAccessLevel('admin')).toBe(true);
  });

  it('rejects unknown / non-string values', () => {
    expect(isAccessLevel('owner')).toBe(false);
    expect(isAccessLevel('')).toBe(false);
    expect(isAccessLevel(null)).toBe(false);
    expect(isAccessLevel(42)).toBe(false);
    expect(isAccessLevel(undefined)).toBe(false);
  });
});

describe('accessLevelColor', () => {
  it('maps each tier to a distinct Tag colour', () => {
    expect(accessLevelColor('admin')).toBe('red');
    expect(accessLevelColor('editor')).toBe('blue');
    expect(accessLevelColor('monitor')).toBe('default');
  });
});

describe('label / description keys', () => {
  it('builds namespaced i18n keys', () => {
    expect(accessLevelLabelKey('editor')).toBe('admin.accessLevel.tier.editor');
    expect(accessLevelDescKey('monitor')).toBe(
      'admin.accessLevel.desc.monitor'
    );
  });
});

describe('accessLevelErrorMessage', () => {
  const fallback = 'Could not change the access level.';

  it('falls back for a non-axios error', () => {
    expect(accessLevelErrorMessage(new Error('boom'), fallback)).toBe(fallback);
  });

  it('falls back when there is no response body', () => {
    expect(accessLevelErrorMessage({ response: {} }, fallback)).toBe(fallback);
  });

  it('surfaces the server 400 detail for a self-change', () => {
    const err = {
      response: {
        status: 400,
        data: { detail: 'You cannot change your own access level.' },
      },
    };
    expect(accessLevelErrorMessage(err, fallback)).toBe(
      'You cannot change your own access level.'
    );
  });

  it('surfaces a field error array on access_level', () => {
    const err = {
      response: { status: 400, data: { access_level: ['Unknown tier.'] } },
    };
    expect(accessLevelErrorMessage(err, fallback)).toBe('Unknown tier.');
  });

  it('accepts a plain-string body', () => {
    const err = { response: { status: 400, data: 'Forbidden.' } };
    expect(accessLevelErrorMessage(err, fallback)).toBe('Forbidden.');
  });

  it('falls back when the body is an empty object', () => {
    expect(
      accessLevelErrorMessage({ response: { data: {} } }, fallback)
    ).toBe(fallback);
  });
});
