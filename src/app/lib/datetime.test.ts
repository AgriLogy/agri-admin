import { fmtDateTime, localeTag } from './datetime';

describe('localeTag', () => {
  it('maps app locales to BCP-47 tags', () => {
    expect(localeTag('ar')).toBe('ar');
    expect(localeTag('en')).toBe('en-GB');
    expect(localeTag('fr')).toBe('fr-FR');
    expect(localeTag('whatever')).toBe('fr-FR'); // default
  });
});

describe('fmtDateTime', () => {
  it('renders an em dash for null/undefined/empty', () => {
    expect(fmtDateTime(null, 'fr-FR')).toBe('—');
    expect(fmtDateTime(undefined, 'fr-FR')).toBe('—');
    expect(fmtDateTime('', 'fr-FR')).toBe('—');
  });

  it('formats a valid ISO string (non-empty, not the dash)', () => {
    const out = fmtDateTime('2026-06-25T08:30:00.000Z', 'en-GB');
    expect(typeof out).toBe('string');
    expect(out).not.toBe('—');
    expect(out.length).toBeGreaterThan(0);
  });

  it('returns the raw input when formatting throws (invalid locale tag)', () => {
    expect(fmtDateTime('2026-06-25T08:30:00.000Z', 'not a valid tag!')).toBe(
      '2026-06-25T08:30:00.000Z'
    );
  });
});
