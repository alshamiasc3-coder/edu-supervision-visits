import type { Visit } from '@/context/AppContext';
import { buildVisitHistoryProfile } from '@/utils/visitHistory';
import { buildLegalAiContext } from '@/utils/legalAiContext';

export type VisitAiInput = {
  schoolName?: string;
  visitDate?: string;
  visitType?: string;
  observations?: string;
  strengths?: string;
  needs?: string;
  actions?: string;
  proposals?: string;
  followUp?: string;
};

export function buildVisitAiContext(input: VisitAiInput, visits: Visit[]) {
  const history = buildVisitHistoryProfile(visits);
  const legal = buildLegalAiContext(input);

  const currentVisit = [
    `المدرسة: ${input.schoolName?.trim() || 'غير محددة'}`,
    `تاريخ الزيارة: ${input.visitDate?.trim() || 'غير محدد'}`,
    `نوع الزيارة: ${input.visitType?.trim() || 'غير محدد'}`,
    `الملاحظات والمشاهدات: ${input.observations?.trim() || 'غير مسجلة'}`,
    `جوانب القوة: ${input.strengths?.trim() || 'غير مسجلة'}`,
    `الجوانب التي تحتاج إلى متابعة: ${input.needs?.trim() || 'غير مسجلة'}`,
    `الإجراءات المتخذة فعليًا: ${input.actions?.trim() || 'غير مسجلة'}`,
    `المقترحات والتوصيات: ${input.proposals?.trim() || 'غير مسجلة'}`,
    `المتابعة المقترحة: ${input.followUp?.trim() || 'غير مسجلة'}`,
  ].join('\n');

  const instructions = [
    'أنت مساعد مهني للمشرف التربوي، ولست صاحب القرار النهائي.',
    'استخدم السجل السابق لفهم استمرارية العمل المهني فقط، ولا تستنتج شخصية المشرف أو حالته النفسية أو نواياه.',
    'لا تخترع وقائع أو زيارات أو إجراءات غير موجودة في البيانات.',
    'فرّق بوضوح بين الإجراءات المتخذة فعليًا وبين المقترحات والتوصيات والمتابعة اللاحقة.',
    'إذا وجدت توصية سابقة مرتبطة بالزيارة الحالية، اقترح صياغة تشير إلى الاستمرارية دون الادعاء بتنفيذها ما لم يثبت ذلك في السجل.',
    'عند نقص البيانات، صرّح بالنقص بدل ملئه بتخمين.',
    'استخدم المراجع التشريعية الموثقة أدناه كمرجع فقط، ولا تخترع أرقام مواد أو فقرات أو أحكامًا غير موفرة في النص الموثق.',
    'إذا لم يتوفر نص المادة ذات الصلة، اذكر اسم التشريع والعدد فقط ووجّه المستخدم إلى الرجوع للنص الرسمي.',
    'لا تستخدم أي تشريع غير موثق في النظام كأساس لتوصية قانونية.',
  ].join('\n');

  return {
    history,
    legal,
    prompt: [
      instructions,
      '',
      'معطيات الزيارة الحالية:',
      currentVisit,
      '',
      'السياق المهني التراكمي للزيارات السابقة:',
      history.contextText || 'لا توجد زيارات سابقة مسجلة.',
      '',
      'السياق التشريعي الموثق المرشح:',
      legal.references,
      '',
      'تعليمات استخدام المرجع التشريعي:',
      legal.instruction,
    ].join('\n'),
  };
}
