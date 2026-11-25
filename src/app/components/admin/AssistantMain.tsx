'use client';

/**
 * /admin/assistant: which LLM answers the farmers' assistant (Claude, GPT,
 * Groq, Mistral, Gemini, OpenRouter, DeepSeek, Ollama or any OpenAI-compatible
 * server) and with which API key. Admin tier: the API answers 403 otherwise.
 */

import { Box } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';

import AssistantLlmCard from '@/app/components/admin/AssistantLlmCard';
import { PageInfoBar } from '@/app/components/layout/PageInfoBar';

const AssistantMain = () => {
  const t = useTranslations();
  return (
    <Box px={{ base: 3, md: 4 }} py={{ base: 3, md: 4 }}>
      <PageInfoBar
        title={t('admin.assistantPage.title')}
        subtitle={t('admin.assistantPage.subtitle')}
      />
      <Box maxW="760px">
        <AssistantLlmCard />
      </Box>
    </Box>
  );
};

export default AssistantMain;
