import {
  buildSavePayload,
  buildTestPayload,
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
