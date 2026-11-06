'use client';

/**
 * Back-office settings for the farmer assistant's LLM (AgriLogy/agri-api#472):
 * provider (Claude / OpenAI-compatible / Ollama), model, base URL, effort and
 * API key, plus a "Test" round-trip. The key is write-only: the server only
 * reports whether one is stored and its last 4 characters.
 */

import {
  Alert,
  App,
  AutoComplete,
  Button,
  Card,
  Form,
  Input,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
} from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import {
  adminAssistantApi,
  buildSavePayload,
  buildTestPayload,
  type AssistantConfig,
  type AssistantFormValues,
  type AssistantTestResult,
  type ProviderId,
} from '@/app/lib/adminAssistantApi';

const tk = 'admin.settings.assistant';

const AssistantLlmCard = () => {
  const t = useTranslations();
  const { message } = App.useApp();
  const [form] = Form.useForm<AssistantFormValues>();
  const [config, setConfig] = useState<AssistantConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [removeKey, setRemoveKey] = useState(false);
  const [test, setTest] = useState<AssistantTestResult | null>(null);
  const provider = Form.useWatch('provider', form) as ProviderId | undefined;

  const apply = useCallback(
    (c: AssistantConfig) => {
      setConfig(c);
      setKeyInput('');
      setRemoveKey(false);
      form.setFieldsValue({
        enabled: c.source === 'settings' ? c.enabled : false,
        provider: (c.provider || 'anthropic') as ProviderId,
        model: c.model,
        base_url: c.base_url,
        effort: c.effort || 'low',
      });
    },
    [form]
  );

  useEffect(() => {
    adminAssistantApi
      .get()
      .then(apply)
      .catch(() => message.error(t('admin.common.loadError')))
      .finally(() => setLoading(false));
  }, [apply, message, t]);

  const meta = provider && config ? config.providers[provider] : undefined;
  // The stored key belongs to the stored provider only.
  const keyStoredHere =
    !!config?.has_api_key && config.provider === provider && !removeKey;

  const onProviderChange = (p: ProviderId) => {
    const m = config?.providers[p];
    setTest(null);
    form.setFieldsValue({
      model: p === config?.provider ? config.model : (m?.default_model ?? ''),
      base_url:
        p === config?.provider ? config.base_url : (m?.default_base_url ?? ''),
    });
  };

  const save = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const saved = await adminAssistantApi.save(
        buildSavePayload(values, keyInput, removeKey)
      );
      apply(saved);
      message.success(t(`${tk}.saved`));
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      message.error(detail || t('admin.common.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const runTest = async () => {
    const values = form.getFieldsValue();
    setTesting(true);
    setTest(null);
    try {
      setTest(await adminAssistantApi.test(buildTestPayload(values, keyInput)));
    } catch (err) {
      // A 400 carries the server's reason (e.g. "Choose a model first.").
      const detail = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      setTest({
        ok: false,
        error_kind: 'bad_request',
        error: detail || t(`${tk}.testFailed`),
        latency_ms: 0,
      });
    } finally {
      setTesting(false);
    }
  };

  const status = !config ? null : config.active ? (
    <Tag color="green">{t(`${tk}.statusActive`)}</Tag>
  ) : (
    <Tag>{t(`${tk}.statusOff`)}</Tag>
  );

  return (
    <Card
      size="small"
      loading={loading}
      title={
        <Space>
          {t(`${tk}.title`)}
          {status}
        </Space>
      }
      extra={
        <Space>
          <Button loading={testing} onClick={runTest}>
            {t(`${tk}.test`)}
          </Button>
          <Button type="primary" loading={saving} onClick={save}>
            {t('admin.settings.save')}
          </Button>
        </Space>
      }
    >
      <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
        {t(`${tk}.intro`)}
      </Typography.Paragraph>

      {config?.source === 'env' ? (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          title={t(`${tk}.fromEnv`)}
        />
      ) : null}
      {config?.api_key_unreadable ? (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          title={t(`${tk}.keyUnreadable`)}
        />
      ) : null}

      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item
          name="enabled"
          label={t(`${tk}.enabled`)}
          valuePropName="checked"
          extra={t(`${tk}.enabledHelp`)}
        >
          <Switch />
        </Form.Item>

        <Form.Item name="provider" label={t(`${tk}.provider`)}>
          <Select
            onChange={onProviderChange}
            options={Object.entries(config?.providers ?? {}).map(([id, p]) => ({
              value: id,
              label: p.label,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="model"
          label={t(`${tk}.model`)}
          rules={[{ required: true, message: t(`${tk}.modelRequired`) }]}
          extra={provider === 'ollama' ? t(`${tk}.ollamaModelHelp`) : undefined}
        >
          <AutoComplete
            options={(meta?.suggested_models ?? []).map((m) => ({ value: m }))}
            placeholder={meta?.default_model || 'gpt-4.1-mini, llama-3.3-70b…'}
          />
        </Form.Item>

        <Form.Item
          name="base_url"
          label={t(`${tk}.baseUrl`)}
          extra={
            provider === 'anthropic'
              ? t(`${tk}.baseUrlAnthropic`)
              : t(`${tk}.baseUrlHelp`)
          }
        >
          <Input placeholder={meta?.default_base_url || 'https://…/v1'} />
        </Form.Item>

        {meta?.supports_effort ? (
          <Form.Item
            name="effort"
            label={t(`${tk}.effort`)}
            extra={t(`${tk}.effortHelp`)}
          >
            <Select
              options={(config?.effort_levels ?? []).map((e) => ({
                value: e,
                label: t(`${tk}.effortLevel.${e}`),
              }))}
            />
          </Form.Item>
        ) : null}

        <Form.Item
          label={t(`${tk}.apiKey`)}
          extra={
            meta && !meta.requires_api_key
              ? t(`${tk}.apiKeyOptional`)
              : t(`${tk}.apiKeyHelp`)
          }
        >
          <Space.Compact style={{ width: '100%' }}>
            <Input.Password
              autoComplete="new-password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder={
                keyStoredHere
                  ? t(`${tk}.apiKeyStored`, {
                      hint: config?.api_key_hint ?? '',
                    })
                  : t(`${tk}.apiKeyPlaceholder`)
              }
            />
            {keyStoredHere ? (
              <Button danger onClick={() => setRemoveKey(true)}>
                {t(`${tk}.removeKey`)}
              </Button>
            ) : null}
          </Space.Compact>
          {removeKey ? (
            <Typography.Text type="warning">
              {t(`${tk}.keyWillBeRemoved`)}
            </Typography.Text>
          ) : null}
        </Form.Item>
      </Form>

      {test ? (
        <Alert
          type={test.ok ? 'success' : 'error'}
          showIcon
          title={
            test.ok
              ? t(`${tk}.testOk`, { model: test.model, ms: test.latency_ms })
              : t(`${tk}.testError`, { error: test.error })
          }
        />
      ) : null}

      {config?.updated_at ? (
        <Typography.Paragraph
          type="secondary"
          style={{ marginTop: 12, marginBottom: 0, fontSize: 12 }}
        >
          {t(`${tk}.updated`, {
            who: config.updated_by ?? '—',
            when: new Date(config.updated_at).toLocaleString(),
          })}
        </Typography.Paragraph>
      ) : null}
    </Card>
  );
};

export default AssistantLlmCard;
