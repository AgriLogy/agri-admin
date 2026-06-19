/** Local locale-aware datetime formatting for the records views. */

export const localeTag = (locale: string): string =>
  locale === 'ar' ? 'ar' : locale === 'en' ? 'en-GB' : 'fr-FR';

export const fmtDateTime = (
  iso: string | null | undefined,
  tag: string
): string => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(tag);
  } catch {
    return iso;
  }
};
