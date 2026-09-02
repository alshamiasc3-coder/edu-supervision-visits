import { legislations, type Legislation } from '@/data/legislation';

export type LegalAiContextInput = {
  visitType?: string;
  actions?: string;
  proposals?: string;
  observations?: string;
};

const normalize = (value = '') => value.trim().replace(/\s+/g, ' ');

const scoreLegislation = (law: Legislation, text: string) => {
  const source = normalize(text).toLowerCase();
  if (!source || !law.verified) return 0;

  return law.relevance.reduce((score, keyword) => {
    const normalizedKeyword = normalize(keyword).toLowerCase();
    return source.includes(normalizedKeyword) ? score + 2 : score;
  }, 0);
};

/**
 * Builds a conservative legal context for AI suggestions.
 * Only verified legislation is exposed to the model as a candidate reference.
 * The model must not invent article numbers or legal conclusions.
 */
export function buildLegalAiContext(input: LegalAiContextInput) {
  const text = [input.visitType, input.actions, input.proposals, input.observations]
    .map(normalize)
    .filter(Boolean)
    .join(' ');

  const candidates = legislations
    .filter((law) => law.verified)
    .map((law) => ({ law, score: scoreLegislation(law, text) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ law }) => law);

  const references = candidates.length
    ? candidates.map((law) => {
        const issue = law.gazetteIssue ? `العدد ${law.gazetteIssue}` : 'عدد الوقائع غير مسجل';
        const date = law.gazetteDate ? ` بتاريخ ${law.gazetteDate}` : '';
        return `- ${law.title} رقم (${law.number}) لسنة ${law.year} — ${issue}${date}. ${law.summary}`;
      }).join('\n')
    : 'لا يوجد سند تشريعي موثق مرتبط بشكل كافٍ بالمعطيات الحالية.';

  return {
    candidates,
    references,
    instruction:
      'استخدم هذه المراجع كقرائن موثقة فقط. لا تخترع أرقام مواد أو فقرات أو أحكامًا غير موجودة في النص الموثق. إذا لم يتوفر نص المادة ذات الصلة، اذكر اسم التشريع والعدد فقط واطلب الرجوع إلى النص الرسمي. يبقى القرار والتوصية النهائية للمشرف.',
  };
}
