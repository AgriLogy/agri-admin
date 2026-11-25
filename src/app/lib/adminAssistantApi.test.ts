import {
  buildModelsPayload,
  buildSavePayload,
  buildTestPayload,
  keyStatusFor,
  type AssistantConfig,
  type AssistantFormValues,
} from './adminAssistantApi';

const values: AssistantFormValues = {
  enabled: true,
  provider: 'anthropic',
  model: ' claude-haiku-5-5 ',
  base_url: '',
  effort: 'low',
};

describe('buildSavePayload (write-only API key)', () => {
  it('omits the key when the field was left empty, so the server keeps it', () => {
    const p = buildSavePayload(values, '   ', false);
    expect('api_key' in p).toBe(false);
    expect(p.model).toBe('claude-haiku-5-5');
  });

  it('sends a typed key to replace the stored one', () => {
    expect(buildSavePayload(values, ' sk-ant-new ', false).api_key).toBe(
      'sk-ant-new'
    );
  });

  it('sends an empty string to remove the stored key', () => {
    expect(buildSavePayload(values, '', true).api_key).toBe('');
  });

  it('a typed key wins over "remove"', () => {
    expect(buildSavePayload(values, 'k-2', true).api_key).toBe('k-2');
  });
});

describe('buildTestPayload', () => {
  it('only sends a key that was typed (else the server uses the saved one)', () => {
    expect('api_key' in buildTestPayload(values, '')).toBe(false);
    expect(buildTestPayload(values, 'k').api_key).toBe('k');
  });
});

describe('keyStatusFor (one key per provider)', () => {
  const base = {
    provider: 'anthropic',
    has_api_key: true,
    api_key_hint: 'AAAA',
  } as AssistantConfig;

  it('reads each provider from `keys`', () => {
    const config = {
      ...base,
      keys: {
        anthropic: { has_key: true, hint: 'AAAA' },
        groq: { has_key: true, hint: 'BBBB' },
      },
    } as AssistantConfig;
    expect(keyStatusFor(config, 'groq')).toEqual({
      has_key: true,
      hint: 'BBBB',
    });
    expect(keyStatusFor(config, 'mistral').has_key).toBe(false);
  });

  it('falls back to the single key of an older server, for its provider only', () => {
    expect(keyStatusFor(base, 'anthropic')).toEqual({
      has_key: true,
      hint: 'AAAA',
    });
    expect(keyStatusFor(base, 'groq').has_key).toBe(false);
    expect(keyStatusFor(null, 'groq').has_key).toBe(false);
  });
});

describe('buildModelsPayload', () => {
  it('sends only what was typed, so the server uses the saved key and default URL', () => {
    expect(buildModelsPayload('groq', ' ', '')).toEqual({ provider: 'groq' });
    expect(buildModelsPayload('custom', ' http://llm:8000/v1 ', ' k ')).toEqual(
      {
        provider: 'custom',
        base_url: 'http://llm:8000/v1',
        api_key: 'k',
      }
    );
  });
});
