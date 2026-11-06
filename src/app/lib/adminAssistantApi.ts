/**
 * Typed wrapper for the assistant LLM settings (agri-api /admin/assistant/*,
 * AgriLogy/agri-api#472). The API key is write-only: the server never returns
 * it, only `has_api_key` and its last 4 characters.
 */
import api from './api';

export type ProviderId = 'anthropic' | 'openai' | 'ollama';

export type ProviderMeta = {
  label: string;
  default_base_url: string;
  default_model: string;
  suggested_models: string[];
  requires_api_key: boolean;
  supports_effort: boolean;
};

export type AssistantConfig = {
  source: 'settings' | 'env' | 'none';
  enabled: boolean;
  active: boolean;
  provider: ProviderId | '';
  model: string;
  base_url: string;
  effort: string;
  has_api_key: boolean;
  api_key_hint: string;
  api_key_unreadable: boolean;
  updated_at: string | null;
  updated_by: string | null;
  providers: Record<ProviderId, ProviderMeta>;
  effort_levels: string[];
};

export type AssistantTestResult =
  | { ok: true; model: string; reply: string; latency_ms: number }
  | { ok: false; error_kind: string; error: string; latency_ms: number };

export type AssistantFormValues = {
  enabled: boolean;
  provider: ProviderId;
  model: string;
  base_url: string;
  effort: string;
};

/**
 * How the key field maps to the API:
 * - `keyInput` typed (non-blank) → replace the stored key;
 * - `removeKey` → `""`, the server deletes the stored key;
 * - otherwise the field is omitted, the server keeps the stored key.
 */
export function buildSavePayload(
  values: AssistantFormValues,
  keyInput: string,
  removeKey: boolean
): AssistantFormValues & { api_key?: string } {
  const payload: AssistantFormValues & { api_key?: string } = {
    enabled: values.enabled,
    provider: values.provider,
    model: values.model.trim(),
    base_url: values.base_url.trim(),
    effort: values.effort,
  };
  const typed = keyInput.trim();
  if (typed) payload.api_key = typed;
  else if (removeKey) payload.api_key = '';
  return payload;
}

/** Same rule for a connection test: only send a key that was typed. */
export function buildTestPayload(
  values: AssistantFormValues,
  keyInput: string
): Partial<AssistantFormValues> & { api_key?: string } {
  const payload: Partial<AssistantFormValues> & { api_key?: string } = {
    provider: values.provider,
    model: values.model.trim(),
    base_url: values.base_url.trim(),
    effort: values.effort,
  };
  const typed = keyInput.trim();
  if (typed) payload.api_key = typed;
  return payload;
}

export const adminAssistantApi = {
  get: () =>
    api.get<AssistantConfig>('/admin/assistant/config').then((r) => r.data),
  save: (payload: ReturnType<typeof buildSavePayload>) =>
    api
      .put<AssistantConfig>('/admin/assistant/config', payload)
      .then((r) => r.data),
  test: (payload: ReturnType<typeof buildTestPayload>) =>
    api
      .post<AssistantTestResult>('/admin/assistant/test', payload)
      .then((r) => r.data),
};
