'use client';

/**
 * Voice input for the farmers' chat (AgriLogy/agri-api#533): Whisper on Groq
 * transcribes the recorded question. On/off, model and language. It uses the
 * Groq key saved in the LLM card above (provider Groq), whichever provider
 * answers the chat; without that key it can't be turned on.
 */

import {
  Alert,
  App,
  Button,
  Card,
  Form,
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
  type VoiceConfig,
  type VoiceFormValues,
} from '@/app/lib/adminAssistantApi';

const tk = 'admin.assistantPage.voice';

const AssistantVoiceCard = () => {
  const t = useTranslations();
  const { message } = App.useApp();
  const [form] = Form.useForm<VoiceFormValues>();
  const [voice, setVoice] = useState<VoiceConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const apply = useCallback(
    (v: VoiceConfig) => {
      setVoice(v);
      form.setFieldsValue({
        enabled: v.enabled,
        model: v.model,
        language: v.language,
      });
    },
    [form]
  );

  useEffect(() => {
    let alive = true;
    adminAssistantApi
      .get()
      .then((c) => {
        if (alive && c.voice) apply(c.voice);
      })
      .catch(() => message.error(t('admin.common.loadError')))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [apply, message, t]);

  const save = async (values: VoiceFormValues) => {
    setSaving(true);
    try {
      apply(await adminAssistantApi.saveVoice(values));
      message.success(t(`${tk}.saved`));
    } catch {
      message.error(t(`${tk}.saveError`));
    } finally {
      setSaving(false);
    }
  };

  if (!loading && !voice) return null; // API without voice support

  return (
    <Card
      loading={loading}
      title={
        <Space>
          {t(`${tk}.title`)}
          {voice && (
            <Tag color={voice.active ? 'green' : 'default'}>
              {voice.active ? t(`${tk}.active`) : t(`${tk}.inactive`)}
            </Tag>
          )}
        </Space>
      }
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
          {t(`${tk}.intro`)}
        </Typography.Paragraph>
        {voice && !voice.has_groq_key && (
          <Alert type="warning" showIcon message={t(`${tk}.noKey`)} />
        )}
        <Form<VoiceFormValues> form={form} layout="vertical" onFinish={save}>
          <Form.Item
            name="enabled"
            label={t(`${tk}.enabled`)}
            valuePropName="checked"
          >
            <Switch disabled={!voice?.has_groq_key && !voice?.enabled} />
          </Form.Item>
          <Form.Item
            name="model"
            label={t(`${tk}.model`)}
            extra={t(`${tk}.modelHelp`)}
          >
            <Select
              options={(voice?.models ?? []).map((m) => ({
                value: m,
                label: m,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="language"
            label={t(`${tk}.language`)}
            extra={t(`${tk}.languageHelp`)}
          >
            <Select
              options={(voice?.languages ?? []).map((l) => ({
                value: l,
                label: t(`${tk}.lang.${l}`),
              }))}
            />
          </Form.Item>
          <Space
            style={{ width: '100%', justifyContent: 'space-between' }}
            wrap
          >
            <Typography.Text type="secondary">
              {t(`${tk}.limit`, { seconds: voice?.max_seconds ?? 120 })}
            </Typography.Text>
            <Button type="primary" htmlType="submit" loading={saving}>
              {t(`${tk}.save`)}
            </Button>
          </Space>
        </Form>
      </Space>
    </Card>
  );
};

export default AssistantVoiceCard;
