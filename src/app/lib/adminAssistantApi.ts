/**
 * Typed wrapper for the assistant LLM settings (agri-api /admin/assistant/*,
 * AgriLogy/agri-api#472, #528). Each provider keeps its own API key, and keys
 * are write-only: the server never returns one, only whether each provider has
 * one (`keys`) and its last 4 characters.
 */
import api from './api';

/** Known presets; the server's catalog is the source of truth. */
export type ProviderId =
  | 'anthropic'
  | 'openai'
  | 'groq'
  | 'mistral'
  | 'gemini'
  | 'openrouter'
  | 'deepseek'
  | 'ollama'
  | 'custom';

export type ProviderMeta = {
  label: string;
  default_base_url: string;
  default_model: string;
  suggested_models: string[];
  requires_api_key: boolean;
  supports_effort: boolean;
  /** Speaks the OpenAI API (all but Claude). Absent on older servers. */
  openai_compatible?: boolean;
};

export type ProviderKeyStatus = { has_key: boolean; hint: string };

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
  /** Key status per provider (agri-api #528). Absent on older servers. */
  keys?: Partial<Record<ProviderId, ProviderKeyStatus>>;
  providers: Record<ProviderId, ProviderMeta>;
  effort_levels: string[];
  /** Voice input settings (agri-api #533). Absent on older servers. */
  voice?: VoiceConfig;
};

/** Whisper on Groq for the chat's microphone; uses the Groq key above. */
export type VoiceConfig = {
  enabled: boolean;
  provider: 'groq';
  model: string;
  language: string;
  has_groq_key: boolean;
  active: boolean;
  models: string[];
  languages: string[];
  max_seconds: number;
};

export type VoiceFormValues = {
  enabled: boolean;
  model: string;
  language: string;
};

export type AssistantModelsResult =
  | { ok: true; models: string[] }
  | { ok: false; error: string };

/**
 * Whether `provider` has a saved key, and its hint. Older servers (one key
 * only) report it through `has_api_key`, valid for the stored provider only.
 */
export function keyStatusFor(
  config: AssistantConfig | null,
  provider: ProviderId | undefined
): ProviderKeyStatus {
  const none = { has_key: false, hint: '' };
  if (!config || !provider) return none;
  if (config.keys) return config.keys[provider] ?? none;
  return config.has_api_key && config.provider === provider
    ? { has_key: true, hint: config.api_key_hint }
    : none;
}

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

/** Ask the provider for its models: only send a key or URL that was typed. */
export function buildModelsPayload(
  provider: ProviderId,
  baseUrl: string,
  keyInput: string
): { provider: ProviderId; base_url?: string; api_key?: string } {
  const payload: { provider: ProviderId; base_url?: string; api_key?: string } =
    { provider };
  if (baseUrl.trim()) payload.base_url = baseUrl.trim();
  if (keyInput.trim()) payload.api_key = keyInput.trim();
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
  models: (payload: ReturnType<typeof buildModelsPayload>) =>
    api
      .post<AssistantModelsResult>('/admin/assistant/models', payload)
      .then((r) => r.data),
  saveVoice: (payload: VoiceFormValues) =>
    api.put<VoiceConfig>('/admin/assistant/voice', payload).then((r) => r.data),
};
