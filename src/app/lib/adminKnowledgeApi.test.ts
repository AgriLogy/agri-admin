import dayjs from 'dayjs';

import {
  approvalBlocker,
  articleToFormValues,
  buildKnowledgePayload,
  isRtl,
  statusActions,
  type KnowledgeArticle,
} from './adminKnowledgeApi';

const article: KnowledgeArticle = {
  id: 7,
  title: 'السقي بالتنقيط للزيتون',
  language: 'ary',
  topic: 'irrigation',
  crops: ['زيتون'],
  keywords: 'sqi zitoun',
  body: 'فالصيف خاص الأرض تبقى رطبة.',
  sources: [{ title: 'FAO-56', url: 'https://www.fao.org/' }],
  status: 'approved',
  review_due: '2027-11-11',
  review_overdue: false,
  reviewed_at: '2026-11-11T10:00:00+00:00',
  reviewed_by_id: 1,
  created_by_id: 1,
  updated_by_id: 1,
  created_at: null,
  updated_at: null,
};

describe('buildKnowledgePayload', () => {
  it('trims, drops empty crops and untitled sources, formats the date', () => {
    const p = buildKnowledgePayload({
      title: '  Irrigation  ',
      language: 'fr',
      topic: 'irrigation',
      body: ' Texte ',
      keywords: ' sqi ',
      crops: [' olivier ', '  '],
      sources: [
        { title: ' FAO ', url: ' https://fao.org ' },
        { title: '  ', url: 'https://ignored.example' },
        {},
      ],
      review_due: dayjs('2027-01-31'),
    });
    expect(p).toEqual({
      title: 'Irrigation',
      language: 'fr',
      topic: 'irrigation',
      body: 'Texte',
      keywords: 'sqi',
      crops: ['olivier'],
      sources: [{ title: 'FAO', url: 'https://fao.org' }],
      review_due: '2027-01-31',
    });
  });

  it('sends null when there is no review date and [] for missing lists', () => {
    const p = buildKnowledgePayload({
      title: 't',
      language: 'en',
      topic: 'soil',
      body: 'b',
    });
    expect(p.review_due).toBeNull();
    expect(p.crops).toEqual([]);
    expect(p.sources).toEqual([]);
    expect(p.keywords).toBe('');
  });

  it('round-trips an article through the form', () => {
    const p = buildKnowledgePayload(articleToFormValues(article));
    expect(p).toEqual({
      title: article.title,
      language: article.language,
      topic: article.topic,
      body: article.body,
      keywords: article.keywords,
      crops: article.crops,
      sources: article.sources,
      review_due: article.review_due,
    });
  });
});

describe('workflow', () => {
  it.each([
    ['draft', ['review', 'archived']],
    ['review', ['approved', 'draft', 'archived']],
    ['approved', ['review', 'archived']],
    ['archived', ['draft']],
  ] as const)('%s offers %j', (status, expected) => {
    expect(statusActions(status)).toEqual(expected);
  });

  it('approval needs a source, like the server', () => {
    expect(approvalBlocker({ sources: [] })).toBe('noSource');
    expect(approvalBlocker(article)).toBeNull();
  });

  it('Darija and MSA are right-to-left', () => {
    expect(isRtl('ary')).toBe(true);
    expect(isRtl('ar')).toBe(true);
    expect(isRtl('fr')).toBe(false);
  });
});
