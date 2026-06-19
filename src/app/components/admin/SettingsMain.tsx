'use client';

import { App, Button, Card, Input, InputNumber, Space, Switch } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { Box, SimpleGrid } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';

import { PageInfoBar } from '@/app/components/layout/PageInfoBar';
import {
  adminSettingsApi,
  type SettingsGrouped,
} from '@/app/lib/adminSettingsApi';

const SettingsMain = () => {
  const t = useTranslations();
  const { message } = App.useApp();

  const [grouped, setGrouped] = useState<SettingsGrouped>({});
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminSettingsApi.get();
      setGrouped(data);
      const flat: Record<string, unknown> = {};
      Object.values(data).forEach((rows) =>
        rows.forEach((r) => {
          flat[r.key] = r.value;
        })
      );
      setDraft(flat);
    } catch {
      message.error(t('admin.common.loadError'));
    } finally {
      setLoading(false);
    }
  }, [message, t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setVal = (key: string, value: unknown) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const data = await adminSettingsApi.patch(draft);
      setGrouped(data);
      message.success(t('admin.settings.saved'));
    } catch {
      message.error(t('admin.common.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (key: string) => {
    const v = draft[key];
    if (typeof v === 'boolean') {
      return <Switch checked={v} onChange={(c) => setVal(key, c)} />;
    }
    if (typeof v === 'number') {
      return (
        <InputNumber
          value={v}
          onChange={(n) => setVal(key, n)}
          style={{ width: '100%' }}
        />
      );
    }
    return (
      <Input
        value={String(v ?? '')}
        onChange={(e) => setVal(key, e.target.value)}
      />
    );
  };

  return (
    <Box px={{ base: 3, md: 4 }} py={{ base: 3, md: 4 }}>
      <PageInfoBar
        title={t('admin.settings.title')}
        subtitle={t('admin.settings.subtitle')}
        actions={
          <Button type="primary" loading={saving} onClick={save}>
            {t('admin.settings.save')}
          </Button>
        }
      />
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        {Object.entries(grouped).map(([category, rows]) => (
          <Card
            key={category}
            size="small"
            title={
              t.has(`admin.settings.category.${category}`)
                ? t(`admin.settings.category.${category}`)
                : category
            }
            loading={loading}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {rows.map((r) => (
                <Box key={r.key}>
                  <Box fontSize="13px" mb="4px" color="gray.500">
                    {t.has(`admin.settings.key.${r.key}`)
                      ? t(`admin.settings.key.${r.key}`)
                      : r.key}
                  </Box>
                  {renderInput(r.key)}
                </Box>
              ))}
            </Space>
          </Card>
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default SettingsMain;
