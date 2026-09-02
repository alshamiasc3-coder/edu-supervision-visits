import type { Visit } from '@/context/AppContext';

export type VisitHistoryProfile = {
  totalVisits: number;
  completedVisits: number;
  postponedVisits: number;
  plannedVisits: number;
  visitTypeCounts: Record<string, number>;
  recurringActions: string[];
  recurringProposals: string[];
  recentVisits: Visit[];
  contextText: string;
};

const normalize = (value: string) => value.trim().replace(/\s+/g, ' ');

const topRepeated = (values: string[], limit = 5) => {
  const counts = new Map<string, number>();
  values.map(normalize).filter(Boolean).forEach((value) => {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value]) => value);
};

export function buildVisitHistoryProfile(visits: Visit[]): VisitHistoryProfile {
  const ordered = [...visits].sort((a, b) => b.date.localeCompare(a.date));
  const visitTypeCounts = ordered.reduce<Record<string, number>>((acc, visit) => {
    acc[visit.type] = (acc[visit.type] ?? 0) + 1;
    return acc;
  }, {});

  const recurringActions = topRepeated(ordered.map((visit) => visit.actions));
  const recurringProposals = topRepeated(ordered.map((visit) => visit.proposals));

  const completedVisits = ordered.filter((visit) => visit.status === 'completed').length;
  const postponedVisits = ordered.filter((visit) => visit.status === 'postponed').length;
  const plannedVisits = ordered.filter((visit) => visit.status === 'planned').length;

  const typeSummary = Object.entries(visitTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => `${type} (${count})`)
    .join('، ');

  const recentSummary = ordered.slice(0, 5).map((visit) =>
    `${visit.date} | ${visit.type} | الإجراءات المتخذة: ${normalize(visit.actions) || 'غير مسجلة'} | المقترحات والتوصيات: ${normalize(visit.proposals) || 'غير مسجلة'}`,
  );

  const contextText = [
    `إجمالي الزيارات المسجلة: ${ordered.length}`,
    `حالة الزيارات: ${completedVisits} مكتملة، ${plannedVisits} مخططة، ${postponedVisits} مؤجلة`,
    typeSummary ? `أنماط الزيارات الأكثر تكرارًا: ${typeSummary}` : '',
    recurringActions.length ? `الإجراءات المتكررة في السجل: ${recurringActions.join('؛ ')}` : '',
    recurringProposals.length ? `المقترحات المتكررة في السجل: ${recurringProposals.join('؛ ')}` : '',
    recentSummary.length ? `آخر الزيارات:\n${recentSummary.join('\n')}` : '',
  ].filter(Boolean).join('\n');

  return {
    totalVisits: ordered.length,
    completedVisits,
    postponedVisits,
    plannedVisits,
    visitTypeCounts,
    recurringActions,
    recurringProposals,
    recentVisits: ordered.slice(0, 10),
    contextText,
  };
}
