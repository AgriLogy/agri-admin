import {
  DEFAULT_NOTIFICATION_THRESHOLDS,
  evaluateV1NotificationDecision,
  parseNumericSensor,
} from './notificationDecisionEngine';

describe('parseNumericSensor', () => {
  it('passes through finite numbers', () => {
    expect(parseNumericSensor(12.5)).toBe(12.5);
  });

  it('parses localized / unit-suffixed strings', () => {
    expect(parseNumericSensor('18,4 %')).toBeCloseTo(18.4);
    expect(parseNumericSensor('3.2mm')).toBeCloseTo(3.2);
    expect(parseNumericSensor('-1.5°C')).toBeCloseTo(-1.5);
  });

  it('returns NaN for null/undefined/garbage', () => {
    expect(parseNumericSensor(null)).toBeNaN();
    expect(parseNumericSensor(undefined)).toBeNaN();
    expect(parseNumericSensor('n/a')).toBeNaN();
  });
});

describe('evaluateV1NotificationDecision', () => {
  const thresholds = DEFAULT_NOTIFICATION_THRESHOLDS; // humidity<=20 critical, ET0*Kc>=4 advisory

  it('flags critical when soil humidity is at or below the critical threshold', () => {
    const r = evaluateV1NotificationDecision({
      et0Mm: 1,
      soilHumidityPct: 20,
      kc: 1,
      thresholds,
    });
    expect(r.decision).toBe('critical');
    expect(r.rulesFired).toContain('R1_humidity_at_or_below_critical');
  });

  it('critical wins over advisory when both conditions hold', () => {
    const r = evaluateV1NotificationDecision({
      et0Mm: 10,
      soilHumidityPct: 5,
      kc: 1,
      thresholds,
    });
    expect(r.decision).toBe('critical');
  });

  it('flags advisory when ET0×Kc meets the advisory threshold', () => {
    const r = evaluateV1NotificationDecision({
      et0Mm: 4,
      soilHumidityPct: 50,
      kc: 1,
      thresholds,
    });
    expect(r.decision).toBe('advisory');
    expect(r.et0TimesKc).toBeCloseTo(4);
    expect(r.rulesFired).toContain('R2_et0_kc_above_advisory');
  });

  it('returns ok when within bounds', () => {
    const r = evaluateV1NotificationDecision({
      et0Mm: 1,
      soilHumidityPct: 80,
      kc: 1,
      thresholds,
    });
    expect(r.decision).toBe('ok');
    expect(r.rulesFired).toContain('R3_nominal');
  });

  it('falls back to advisory on non-finite input', () => {
    const r = evaluateV1NotificationDecision({
      et0Mm: NaN,
      soilHumidityPct: 50,
      kc: 1,
      thresholds,
    });
    expect(r.decision).toBe('advisory');
    expect(r.rulesFired).toContain('R0_invalid_numeric_input');
  });
});
