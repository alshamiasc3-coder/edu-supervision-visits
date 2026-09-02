export type LegislationType = 'قانون' | 'نظام' | 'تعليمات';

export type Legislation = {
  id: string;
  title: string;
  number: string;
  year: number;
  type: LegislationType;
  gazetteIssue?: string;
  gazetteDate?: string;
  officialSource?: string;
  summary: string;
  relevance: string[];
  verified: boolean;
};

/**
 * مرجع أولي للتشريعات الرسمية ذات الصلة بعمل المشرف التربوي.
 * لا نعتبر أي سجل "موثقاً" إلا بعد ربطه بعدد الوقائع العراقية الرسمي.
 */
export const legislations: Legislation[] = [
  {
    id: 'vocational-education-2016',
    title: 'نظام التعليم المهني',
    number: '6',
    year: 2016,
    type: 'نظام',
    gazetteIssue: '4427',
    gazetteDate: '2016-12-12',
    summary:
      'ينظم أهداف التعليم المهني، المدارس والفروع والاختصاصات، ملاكات المدرسة، الدوام، الهيئة التدريسية، النشاط التربوي، التدريب المهني والامتحانات.',
    relevance: [
      'زيارات الاختصاص والإشراف',
      'متابعة الخطط والتدريسات',
      'السجلات المدرسية',
      'التدريب المهني',
    ],
    verified: true,
  },
  {
    id: 'teacher-protection-2018',
    title: 'قانون حماية المعلمين والمدرسين والمشرفين والمرشدين التربويين',
    number: '8',
    year: 2018,
    type: 'قانون',
    gazetteIssue: '4486',
    gazetteDate: '2018-04-09',
    summary:
      'تشريع أساسي للحماية القانونية للفئات التربوية المشمولة، ومن بينها المشرفون والمرشدون التربويون.',
    relevance: ['الحماية القانونية للمشرف', 'الواجبات أثناء أداء الوظيفة'],
    verified: true,
  },
  {
    id: 'teacher-protection-instructions-2021',
    title: 'تعليمات تسهيل تنفيذ أحكام قانون حماية المعلمين والمدرسين والمشرفين والمرشدين التربويين',
    number: '1',
    year: 2021,
    type: 'تعليمات',
    gazetteIssue: '4661',
    gazetteDate: '2022-01-03',
    summary:
      'تعليمات تنفيذية مرتبطة بقانون الحماية وتوضح أحكاماً تتعلق باحترام هيبة المؤسسات التربوية وعدم عرقلة أعمالها.',
    relevance: ['الحماية أثناء الزيارة', 'هيبة المؤسسة التربوية'],
    verified: true,
  },
  {
    id: 'ministry-education-2011',
    title: 'قانون وزارة التربية',
    number: '22',
    year: 2011,
    type: 'قانون',
    summary:
      'القانون الأساسي المنظم لوزارة التربية، ويُعرض هنا مع تنبيه إلى ضرورة قراءة التعديلات النافذة معه.',
    relevance: ['اختصاصات الوزارة', 'التنظيم التربوي'],
    verified: false,
  },
  {
    id: 'ministry-education-amendment-2025',
    title: 'التعديل الأول لقانون وزارة التربية',
    number: '9',
    year: 2025,
    type: 'قانون',
    gazetteIssue: '4841',
    gazetteDate: '2025-09-22',
    summary:
      'تعديل حديث لقانون وزارة التربية رقم (22) لسنة 2011. يجب اعتماد النص المنشور في الوقائع العراقية عند بناء المرجعية النهائية.',
    relevance: ['التشريعات النافذة', 'الملاكات التربوية'],
    verified: true,
  },
];
