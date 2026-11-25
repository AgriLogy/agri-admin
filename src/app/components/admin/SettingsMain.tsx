'use client';

import {
  App,
  Button,
  Card,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Switch,
} from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
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
  const [addOpen, setAddOpen] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [newValue, setNewValue] = useState('');
  const [creating, setCreating] = useState(false);

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

  const createKey = async () => {
    const key = newKey.trim();
    if (!key) return;
    setCreating(true);
    try {
      await adminSettingsApi.create({
        key,
        value: newValue,
        category: newCategory.trim() || 'general',
      });
      setAddOpen(false);
      setNewKey('');
      setNewValue('');
      setNewCategory('general');
      await refresh();
      message.success(t('admin.settings.created'));
    } catch {
      message.error(t('admin.settings.createError'));
    } finally {
      setCreating(false);
    }
  };

  const deleteKey = async (key: string) => {
    try {
      const data = await adminSettingsApi.remove(key);
      setGrouped(data);
      setDraft((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      message.success(t('admin.settings.deleted'));
    } catch {
      message.error(t('admin.common.saveError'));
    }
  };

  const categoryOptions = Object.keys(grouped).map((c) => ({
    label: c,
    value: c,
  }));

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
          <Space>
            <Button icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>
              {t('admin.settings.addKey')}
            </Button>
            <Button type="primary" loading={saving} onClick={save}>
              {t('admin.settings.save')}
            </Button>
          </Space>
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
                  <Box
                    fontSize="13px"
                    mb="4px"
                    color="gray.500"
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <span>
                      {t.has(`admin.settings.key.${r.key}`)
                        ? t(`admin.settings.key.${r.key}`)
                        : r.key}
                    </span>
                    <Popconfirm
                      title={t('admin.settings.deleteConfirm')}
                      onConfirm={() => void deleteKey(r.key)}
                    >
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                      />
                    </Popconfirm>
                  </Box>
                  {renderInput(r.key)}
                </Box>
              ))}
            </Space>
          </Card>
        ))}
      </SimpleGrid>

      <Modal
        open={addOpen}
        title={t('admin.settings.addKey')}
        onCancel={() => setAddOpen(false)}
        onOk={() => void createKey()}
        confirmLoading={creating}
        okButtonProps={{ disabled: !newKey.trim() }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Box>
            <Box fontSize="13px" mb="4px" color="gray.500">
              {t('admin.settings.fieldKey')}
            </Box>
            <Input
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="my_setting_key"
            />
          </Box>
          <Box>
            <Box fontSize="13px" mb="4px" color="gray.500">
              {t('admin.settings.fieldCategory')}
            </Box>
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              list="settings-categories"
              placeholder="general"
            />
            <datalist id="settings-categories">
              {categoryOptions.map((c) => (
                <option key={c.value} value={c.value} />
              ))}
            </datalist>
          </Box>
          <Box>
            <Box fontSize="13px" mb="4px" color="gray.500">
              {t('admin.settings.fieldValue')}
            </Box>
            <Input
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
            />
          </Box>
        </Space>
      </Modal>
    </Box>
  );
};

export default SettingsMain;
