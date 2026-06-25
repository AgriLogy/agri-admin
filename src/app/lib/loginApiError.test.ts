import { formatLoginApiError } from './loginApiError';

// Build a minimal object that `axios.isAxiosError` recognises (it checks the
// `isAxiosError === true` marker), so we exercise the mapper without a real request.
const axiosError = (response?: { status: number; data?: unknown }) => ({
  isAxiosError: true,
  response,
});

describe('formatLoginApiError (French fallback, no translator)', () => {
  it('handles a non-axios error', () => {
    expect(formatLoginApiError(new Error('boom'))).toMatch(/inattendue/i);
  });

  it('handles a network error (no response)', () => {
    expect(formatLoginApiError(axiosError())).toMatch(/joindre le serveur/i);
  });

  it('prefers a server-provided detail message verbatim', () => {
    expect(
      formatLoginApiError(
        axiosError({ status: 400, data: { detail: 'Compte désactivé.' } })
      )
    ).toBe('Compte désactivé.');
  });

  it('surfaces the first field error (username/email/password)', () => {
    expect(
      formatLoginApiError(
        axiosError({ status: 400, data: { username: ['Requis.'] } })
      )
    ).toBe('Requis.');
  });

  it('maps 429 to a rate-limit message', () => {
    expect(formatLoginApiError(axiosError({ status: 429 }))).toMatch(
      /tentatives/i
    );
  });

  it('maps 401 to wrong-credentials', () => {
    expect(formatLoginApiError(axiosError({ status: 401 }))).toMatch(
      /incorrect/i
    );
  });

  it('maps a bare 400 to the 400-specific hint', () => {
    expect(formatLoginApiError(axiosError({ status: 400 }))).toMatch(/400/);
  });
});

describe('formatLoginApiError (with translator)', () => {
  const t = (key: string) => `tr:${key}`;

  it('uses the translator key instead of the French fallback', () => {
    expect(formatLoginApiError(axiosError({ status: 401 }), t)).toBe(
      'tr:data.loginError.wrongCreds'
    );
  });

  it('still returns server detail verbatim even with a translator', () => {
    expect(
      formatLoginApiError(axiosError({ status: 400, data: { detail: 'X' } }), t)
    ).toBe('X');
  });
});
