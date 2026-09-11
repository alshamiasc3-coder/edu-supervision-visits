// البحث المحلي في فهرس التشريعات قبل إرسال السياق إلى Gemini.
// لا يصحح النصوص القانونية ولا ينشئ نصوصًا جديدة.

type LegislationRecord = {
  id: string;
  legislationId: string;
  legislationTitle: string;
  source?: string;
  article: string;
  paragraph?: string;
  page?: string;
  text: string;
  normalizedText?: string;
};

type LegislationIndex = {
  records: LegislationRecord[];
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/[^\u0600-\u06FF0-9a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const keywords = (value: string) =>
  normalize(value)
    .split(" ")
    .filter((x) => x.length >= 3);

export function searchLegislation(
  index: LegislationIndex,
  queryParts: string[],
  limit = 6,
) {
  const query = normalize(queryParts.filter(Boolean).join(" "));
  const terms = keywords(query);

  if (!terms.length) return [];

  return index.records
    .map((record) => {
      const haystack = normalize(
        `${record.legislationTitle} ${record.text}`,
      );

      let score = 0;
      for (const term of terms) {
        if (haystack.includes(term)) score += 1;
      }

      // تعزيز بسيط عندما تتكرر المصطلحات المهمة.
      for (const phrase of [
        "الامتحانات العامة",
        "الامتحان العام",
        "المدارس الثانوية",
        "الاشراف التربوي",
        "المشرف التربوي",
        "الاعتراض",
        "الطالب",
        "المدرس",
        "المدير",
      ]) {
        if (query.includes(normalize(phrase)) && haystack.includes(normalize(phrase))) {
          score += 2;
        }
      }

      return { record, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ record, score }) => ({
      score,
      legislationId: record.legislationId,
      legislationTitle: record.legislationTitle,
      article: record.article,
      paragraph: record.paragraph || "",
      source: record.source || "",
      page: record.page || "",
      text: record.text,
    }));
}

export function buildLegalContext(
  index: LegislationIndex,
  queryParts: string[],
  limit = 6,
) {
  return searchLegislation(index, queryParts, limit).map((item) => ({
    legislationId: item.legislationId,
    legislationTitle: item.legislationTitle,
    article: item.article,
    paragraph: item.paragraph,
    source: item.source,
    page: item.page,
    text: item.text,
  }));
}
