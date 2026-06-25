import {
  DEFAULT_DELIVERY_RATE,
  MAX_AMOUNT,
  MIN_AMOUNT,
  deliveryRateFromMinutes,
  deliveryRateToMinutes,
  deliveryRateToSeconds,
  isDeliveryUnit,
  matchPresetKey,
  msUntilNextDelivery,
  normalizeDeliveryRate,
  parseTimestamp,
  presetByKey,
  shouldDeliverNow,
} from './notificationDeliveryRate';

describe('isDeliveryUnit', () => {
  it('accepts the four known units and rejects anything else', () => {
    expect(isDeliveryUnit('minute')).toBe(true);
    expect(isDeliveryUnit('week')).toBe(true);
    expect(isDeliveryUnit('fortnight')).toBe(false);
    expect(isDeliveryUnit(undefined)).toBe(false);
    expect(isDeliveryUnit(60)).toBe(false);
  });
});

describe('normalizeDeliveryRate', () => {
  it('returns the default for non-object input', () => {
    expect(normalizeDeliveryRate(null)).toEqual(DEFAULT_DELIVERY_RATE);
    expect(normalizeDeliveryRate('every hour')).toEqual(DEFAULT_DELIVERY_RATE);
  });

  it('clamps the amount into [MIN_AMOUNT, MAX_AMOUNT] and rounds it', () => {
    expect(normalizeDeliveryRate({ amount: 0, unit: 'hour' }).amount).toBe(
      MIN_AMOUNT
    );
    expect(normalizeDeliveryRate({ amount: 99999, unit: 'hour' }).amount).toBe(
      MAX_AMOUNT
    );
    expect(normalizeDeliveryRate({ amount: 2.6, unit: 'day' }).amount).toBe(3);
  });

  it('falls back to the default unit for an unknown unit', () => {
    expect(normalizeDeliveryRate({ amount: 5, unit: 'century' }).unit).toBe(
      DEFAULT_DELIVERY_RATE.unit
    );
  });

  it('falls back to the default amount for a non-numeric amount', () => {
    expect(normalizeDeliveryRate({ amount: 'soon', unit: 'day' })).toEqual({
      amount: DEFAULT_DELIVERY_RATE.amount,
      unit: 'day',
    });
  });
});

describe('deliveryRate conversions', () => {
  it('converts to seconds and minutes', () => {
    expect(deliveryRateToSeconds({ amount: 2, unit: 'hour' })).toBe(7200);
    expect(deliveryRateToMinutes({ amount: 1, unit: 'day' })).toBe(1440);
    expect(deliveryRateToMinutes({ amount: 20, unit: 'minute' })).toBe(20);
  });
});

describe('deliveryRateFromMinutes', () => {
  it('picks the largest evenly-dividing unit', () => {
    expect(deliveryRateFromMinutes(1440)).toEqual({ amount: 1, unit: 'day' });
    expect(deliveryRateFromMinutes(240)).toEqual({ amount: 4, unit: 'hour' });
    expect(deliveryRateFromMinutes(10080)).toEqual({ amount: 1, unit: 'week' });
    expect(deliveryRateFromMinutes(25)).toEqual({ amount: 25, unit: 'minute' });
  });

  it('returns the default for invalid input', () => {
    expect(deliveryRateFromMinutes('nope')).toEqual(DEFAULT_DELIVERY_RATE);
    expect(deliveryRateFromMinutes(0)).toEqual(DEFAULT_DELIVERY_RATE);
  });
});

describe('preset helpers', () => {
  it('matches a known preset key by duration and returns null for custom', () => {
    expect(matchPresetKey({ amount: 4, unit: 'hour' })).toBe('every4hours');
    expect(matchPresetKey({ amount: 240, unit: 'minute' })).toBe('every4hours');
    expect(matchPresetKey({ amount: 3, unit: 'hour' })).toBeNull();
  });

  it('looks up a preset by key', () => {
    expect(presetByKey('daily')?.rate).toEqual({ amount: 1, unit: 'day' });
    expect(presetByKey('nonexistent')).toBeUndefined();
  });
});

describe('parseTimestamp', () => {
  it('accepts epoch numbers and ISO strings, rejects junk', () => {
    expect(parseTimestamp(1_700_000_000_000)).toBe(1_700_000_000_000);
    expect(parseTimestamp('2026-06-25T00:00:00.000Z')).toBe(
      Date.parse('2026-06-25T00:00:00.000Z')
    );
    expect(parseTimestamp('not-a-date')).toBeNull();
    expect(parseTimestamp(null)).toBeNull();
    expect(parseTimestamp({})).toBeNull();
  });
});

describe('shouldDeliverNow', () => {
  const rate = { amount: 1, unit: 'hour' } as const;
  const now = 1_700_000_000_000;

  it('delivers when never sent before', () => {
    expect(shouldDeliverNow(rate, null, now)).toBe(true);
  });

  it('does not deliver before the interval has elapsed', () => {
    const lastSent = now - 30 * 60 * 1000; // 30 min ago, rate is 1h
    expect(shouldDeliverNow(rate, lastSent, now)).toBe(false);
  });

  it('delivers exactly at the inclusive interval boundary', () => {
    const lastSent = now - 60 * 60 * 1000; // exactly 1h ago
    expect(shouldDeliverNow(rate, lastSent, now)).toBe(true);
  });

  it('does not deliver for a future last-sent timestamp (clock skew)', () => {
    expect(shouldDeliverNow(rate, now + 5000, now)).toBe(false);
  });
});

describe('msUntilNextDelivery', () => {
  const rate = { amount: 1, unit: 'hour' } as const;
  const now = 1_700_000_000_000;

  it('is 0 when never sent', () => {
    expect(msUntilNextDelivery(rate, null, now)).toBe(0);
  });

  it('reports the remaining time and never goes negative', () => {
    expect(msUntilNextDelivery(rate, now - 20 * 60 * 1000, now)).toBe(
      40 * 60 * 1000
    );
    expect(msUntilNextDelivery(rate, now - 5 * 60 * 60 * 1000, now)).toBe(0);
  });
});
