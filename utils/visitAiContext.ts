import type { Visit } from '@/context/AppContext';
import { buildVisitHistoryProfile } from '@/utils/visitHistory';

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
    'أي رأي قانوني أو استناد تشريعي يجب أن يعتمد فقط على مصدر تشريعي موثق يقدمه النظام، مع ذكر رقم القانون والمادة والعدد عند توفرها.',
  ].join('\n');

  return {
    history,
    prompt: `${instructions}\n\nمعطيات الزيارة الحالية:\n${currentVisit}\n\nالسياق المهني التراكمي للزيارات السابقة:\n${history.contextText || 'لا توجد زيارات سابقة مسجلة.'}`,
  };
}
