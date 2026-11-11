/**
 * Typed wrapper for the assistant knowledge base (agri-api
 * /admin/assistant/knowledge, AgriLogy/agri-api#461 phase 2).
 *
 * Staff write agronomy articles, send them for review and approve them. Only
 * APPROVED articles reach the Agrogo assistant, which cites them to farmers.
 * Editing the text of an approved article sends it back to review (server
 * rule), so reviewed content stays reviewed.
 */
import dayjs, { type Dayjs } from 'dayjs';

import api from './api';

export type KnowledgeStatus = 'draft' | 'review' | 'approved' | 'archived';
export type KnowledgeLanguage = 'ary' | 'ar' | 'fr' | 'en';

export const KNOWLEDGE_STATUSES: readonly KnowledgeStatus[] = [
  'draft',
  'review',
  'approved',
  'archived',
];
export const KNOWLEDGE_LANGUAGES: readonly KnowledgeLanguage[] = [
  'ary',
  'ar',
  'fr',
  'en',
];

export type KnowledgeSource = { title: string; url: string };

export type KnowledgeArticle = {
  id: number;
  title: string;
  language: KnowledgeLanguage;
  topic: string;
  crops: string[];
  keywords: string;
  body: string;
  sources: KnowledgeSource[];
  status: KnowledgeStatus;
  review_due: string | null;
  review_overdue: boolean;
  reviewed_at: string | null;
  reviewed_by_id: number | null;
  created_by_id: number | null;
  updated_by_id: number | null;
  created_at: string | null;
  updated_at: string | null;
};

export type KnowledgeList = {
  available: boolean;
  /** Set when the table is missing: names the agri-db migration to apply. */
  detail?: string;
  items: KnowledgeArticle[];
  counts: Partial<Record<KnowledgeStatus, number>>;
  statuses: KnowledgeStatus[];
  topics: string[];
  languages: KnowledgeLanguage[];
};

export type KnowledgeFilters = {
  status?: KnowledgeStatus;
  topic?: string;
  language?: KnowledgeLanguage;
  q?: string;
};

export type KnowledgePayload = {
  title: string;
  language: KnowledgeLanguage;
  topic: string;
  body: string;
  keywords: string;
  crops: string[];
  sources: KnowledgeSource[];
  review_due: string | null;
  /** Creation only: 'draft' or 'review'. */
  status?: 'draft' | 'review';
};

/** The drawer form's shape (dates as dayjs for the DatePicker). */
export type KnowledgeFormValues = {
  title: string;
  language: KnowledgeLanguage;
  topic: string;
  body: string;
  keywords?: string;
  crops?: string[];
  sources?: Array<{ title?: string; url?: string }>;
  review_due?: Dayjs | null;
};

const clean = (s: string | undefined | null) => (s ?? '').trim();

/** Form → API body: trimmed, empty sources/crops dropped, date as ISO day. */
export function buildKnowledgePayload(
  values: KnowledgeFormValues
): KnowledgePayload {
  return {
    title: clean(values.title),
    language: values.language,
    topic: values.topic,
    body: clean(values.body),
    keywords: clean(values.keywords),
    crops: (values.crops ?? []).map(clean).filter(Boolean),
    sources: (values.sources ?? [])
      .map((s) => ({ title: clean(s?.title), url: clean(s?.url) }))
      .filter((s) => s.title !== ''),
    review_due: values.review_due
      ? values.review_due.format('YYYY-MM-DD')
      : null,
  };
}

/** API article → form values (for editing). */
export function articleToFormValues(a: KnowledgeArticle): KnowledgeFormValues {
  return {
    title: a.title,
    language: a.language,
    topic: a.topic,
    body: a.body,
    keywords: a.keywords,
    crops: [...a.crops],
    sources: a.sources.map((s) => ({ ...s })),
    review_due: a.review_due ? dayjs(a.review_due) : null,
  };
}

/** Workflow buttons offered for an article, in display order. */
export function statusActions(status: KnowledgeStatus): KnowledgeStatus[] {
  switch (status) {
    case 'draft':
      return ['review', 'archived'];
    case 'review':
      return ['approved', 'draft', 'archived'];
    case 'approved':
      return ['review', 'archived'];
    case 'archived':
      return ['draft'];
  }
}

/** Why an article cannot be approved yet (`null` = it can). Mirrors the server. */
export function approvalBlocker(
  a: Pick<KnowledgeArticle, 'sources'>
): 'noSource' | null {
  return a.sources.length === 0 ? 'noSource' : null;
}

/** Arabic-script languages render right-to-left in the editor and table. */
export const isRtl = (language: KnowledgeLanguage) =>
  language === 'ar' || language === 'ary';

const BASE = '/admin/assistant/knowledge';

export const adminKnowledgeApi = {
  list: (filters?: KnowledgeFilters) =>
    api.get<KnowledgeList>(BASE, { params: filters }).then((r) => r.data),
  create: (payload: KnowledgePayload) =>
    api.post<KnowledgeArticle>(BASE, payload).then((r) => r.data),
  update: (id: number, payload: KnowledgePayload) =>
    api.put<KnowledgeArticle>(`${BASE}/${id}`, payload).then((r) => r.data),
  setStatus: (id: number, status: KnowledgeStatus) =>
    api
      .post<KnowledgeArticle>(`${BASE}/${id}/status`, { status })
      .then((r) => r.data),
  remove: (id: number) => api.delete(`${BASE}/${id}`).then((r) => r.data),
};
