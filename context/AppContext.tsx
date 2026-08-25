import AsyncStorage from '@react-native-async-storage/async-storage';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

/*
 * =========================================================
 * المدرسة
 * =========================================================
 */

export type School = {
  id: string;
  name: string;
  director: string;
  adminDeputy: string;
  technicalDeputy: string;
  studentsDeputy: string;
  sections: string[];
  address: string;
  lastVisit?: string;
};

/*
 * =========================================================
 * الزيارة
 * =========================================================
 */

export type Visit = {
  id: string;
  schoolId: string;
  date: string;
  type: string;
  actions: string;
  recommendations: string;
  status: 'planned' | 'completed' | 'postponed';
  photoUri?: string;
};

/*
 * =========================================================
 * المهمة
 * =========================================================
 */

export type Task = {
  id: string;
  title: string;
  schoolId?: string;
  time: string;
  priority: 'high' | 'medium' | 'low';
  notes: string;
  done: boolean;
  date: string;
};

/*
 * =========================================================
 * الملاك والاحتياج
 * =========================================================
 */

export type Staffing = {
  id: string;
  schoolId: string;
  specialty: string;
  required: number;
  current: number;
  stage?: string;
  district?: string;
  notes?: string;
};

/*
 * =========================================================
 * الكتب الوزارية
 * =========================================================
 */

export type MinistryBookCategory =
  | 'امتحانات'
  | 'نقل'
  | 'تعليمات'
  | 'هامة'
  | 'عاجلة'
  | 'أخرى';

export type MinistryBook = {
  id: string;

  /*
   * عنوان مختصر للكتاب
   */
  title: string;

  /*
   * رقم الكتاب الوزاري
   */
  bookNumber: string;

  /*
   * تاريخ الكتاب
   */
  date: string;

  /*
   * تصنيف الكتاب
   */
  category: MinistryBookCategory;

  /*
   * صورة الكتاب
   */
  imageUri: string;

  /*
   * ملاحظات اختيارية
   */
  notes?: string;

  /*
   * تاريخ إضافة الكتاب إلى التطبيق
   */
  createdAt: string;
};

/*
 * =========================================================
 * إنشاء ID
 * =========================================================
 */

const id = () =>
  Date.now().toString() +
  Math.random().toString(36).slice(2, 8);

/*
 * =========================================================
 * المدارس الافتراضية
 * =========================================================
 */

const seedSchools: School[] = [
  {
    id: 's1',
    name: 'إعدادية الموهوبين للبنين',
    director: 'أحمد عبد الستار',
    adminDeputy: 'سارة ناظم',
    technicalDeputy: 'محمد كريم',
    studentsDeputy: 'علي جاسم',
    sections: ['كهرباء', 'حاسبات', 'تجاري'],
    address: 'حي الجامعة - بغداد',
    lastVisit: '2026-08-12',
  },

  {
    id: 's2',
    name: 'ثانوية الأمل للبنات',
    director: 'زهراء فاضل',
    adminDeputy: 'نور حسين',
    technicalDeputy: 'هدى عباس',
    studentsDeputy: 'رنا كاظم',
    sections: ['علمي', 'أدبي'],
    address: 'الكرادة - بغداد',
  },

  {
    id: 's3',
    name: 'مدرسة النور المهنية',
    director: 'حسن علي',
    adminDeputy: 'مريم سعد',
    technicalDeputy: 'قاسم عادل',
    studentsDeputy: '',
    sections: ['محاسبة', 'ميكانيك'],
    address: 'الشعلة - بغداد',
    lastVisit: '2026-07-24',
  },
];

/*
 * =========================================================
 * الزيارات الافتراضية
 * =========================================================
 */

const seedVisits: Visit[] = [
  {
    id: 'v1',
    schoolId: 's1',
    date: '2026-08-24',
    type: 'زيارة اختصاص',
    actions: 'تدقيق السجلات ومتابعة خطة القسم',
    recommendations:
      'استكمال النواقص في السجلات ومتابعة تنفيذ خطة القسم.',
    status: 'planned',
  },

  {
    id: 'v2',
    schoolId: 's2',
    date: '2026-08-18',
    type: 'زيارة تقويمية',
    actions: 'إكمال خطة التحسين',
    recommendations:
      'تنفيذ خطة التحسين ومتابعة مستوى الأداء المدرسي.',
    status: 'completed',
  },

  {
    id: 'v3',
    schoolId: 's3',
    date: '2026-08-15',
    type: 'زيارة تحقق',
    actions: 'إعادة الزيارة بعد أسبوع',
    recommendations:
      'تنفيذ التوصيات السابقة ورفع مستوى الالتزام بالإجراءات المطلوبة.',
    status: 'postponed',
  },
];

/*
 * =========================================================
 * المهام الافتراضية
 * =========================================================
 */

const seedTasks: Task[] = [
  {
    id: 't1',
    title: 'تدقيق سجل الزيارات',
    schoolId: 's1',
    time: '09:00',
    priority: 'high',
    notes: 'التأكد من توقيع الإدارة',
    done: false,
    date: '2026-08-20',
  },

  {
    id: 't2',
    title: 'إعداد تقرير الشهر',
    time: '12:30',
    priority: 'medium',
    notes: 'إرفاق صور السجلات',
    done: true,
    date: '2026-08-20',
  },
];

/*
 * =========================================================
 * الملاك الافتراضي
 * =========================================================
 */

const seedStaffing: Staffing[] = [
  {
    id: 'st1',
    schoolId: 's1',
    specialty: 'حاسوب',
    required: 4,
    current: 4,
    stage: 'إعدادي',
    district: 'الجامعة - بغداد',
  },

  {
    id: 'st2',
    schoolId: 's1',
    specialty: 'رياضيات',
    required: 8,
    current: 6,
    stage: 'إعدادي',
    district: 'الجامعة - بغداد',
  },

  {
    id: 'st3',
    schoolId: 's1',
    specialty: 'فيزياء',
    required: 5,
    current: 7,
    stage: 'إعدادي',
    district: 'الجامعة - بغداد',
    notes: 'متابعة وضع الفيض في الزيارة القادمة',
  },
];

/*
 * =========================================================
 * تصنيفات الكتب الوزارية
 * =========================================================
 */

export const ministryBookCategories: MinistryBookCategory[] = [
  'امتحانات',
  'نقل',
  'تعليمات',
  'هامة',
  'عاجلة',
  'أخرى',
];

/*
 * =========================================================
 * Store Value
 * =========================================================
 */

type StoreValue = {
  schools: School[];
  visits: Visit[];
  tasks: Task[];
  staffing: Staffing[];

  /*
   * الكتب الوزارية
   */
  ministryBooks: MinistryBook[];

  ready: boolean;

  /*
   * المدارس
   */
  addSchool: (
    data: Omit<School, 'id'>
  ) => void;

  updateSchool: (
    schoolId: string,
    data: Omit<School, 'id'>
  ) => void;

  /*
   * الزيارات
   */
  addVisit: (
    data: Omit<Visit, 'id'>
  ) => void;

  updateVisit: (
    visitId: string,
    data: Omit<Visit, 'id'>
  ) => void;

  /*
   * المهام
   */
  addTask: (
    data: Omit<Task, 'id'>
  ) => void;

  toggleTask: (
    taskId: string
  ) => void;

  /*
   * الملاك
   */
  addStaffing: (
    data: Omit<Staffing, 'id'>
  ) => void;

  updateStaffing: (
    staffingId: string,
    data: Omit<Staffing, 'id'>
  ) => void;

  deleteStaffing: (
    staffingId: string
  ) => void;

  /*
   * الكتب الوزارية
   */
  addMinistryBook: (
    data: Omit<MinistryBook, 'id'>
  ) => void;

  updateMinistryBook: (
    bookId: string,
    data: Omit<MinistryBook, 'id'>
  ) => void;

  deleteMinistryBook: (
    bookId: string
  ) => void;
};

/*
 * =========================================================
 * Context
 * =========================================================
 */

const StoreContext =
  createContext<StoreValue | null>(null);

/*
 * =========================================================
 * Store Provider
 * =========================================================
 */

export function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  /*
   * المدارس
   */
  const [schools, setSchools] =
    useState<School[]>(seedSchools);

  /*
   * الزيارات
   */
  const [visits, setVisits] =
    useState<Visit[]>(seedVisits);

  /*
   * المهام
   */
  const [tasks, setTasks] =
    useState<Task[]>(seedTasks);

  /*
   * الملاك
   */
  const [staffing, setStaffing] =
    useState<Staffing[]>(seedStaffing);

  /*
   * الكتب الوزارية
   */
  const [ministryBooks, setMinistryBooks] =
    useState<MinistryBook[]>([]);

  /*
   * جاهزية التخزين
   */
  const [ready, setReady] =
    useState(false);

  /*
   * =======================================================
   * تحميل البيانات من AsyncStorage
   * =======================================================
   */

  useEffect(() => {
    (async () => {
      try {
        const raw =
          await AsyncStorage.getItem(
            'edu-supervision-store'
          );

        if (raw) {
          const d =
            JSON.parse(raw);

          /*
           * المدارس
           */
          setSchools(
            d.schools ??
              seedSchools
          );

          /*
           * الزيارات
           *
           * توافق مع النسخ القديمة
           */
          setVisits(
            (
              d.visits ??
              seedVisits
            ).map(
              (
                visit: any
              ): Visit => ({
                id:
                  visit.id,

                schoolId:
                  visit.schoolId,

                date:
                  visit.date,

                type:
                  visit.type,

                actions:
                  visit.actions ??
                  '',

                recommendations:
                  visit.recommendations ??
                  '',

                status:
                  visit.status ??
                  'completed',

                photoUri:
                  visit.photoUri,
              })
            )
          );

          /*
           * المهام
           */
          setTasks(
            d.tasks ??
              seedTasks
          );

          /*
           * الملاك
           */
          setStaffing(
            d.staffing ??
              seedStaffing
          );

          /*
           * الكتب الوزارية
           *
           * إذا لم تكن موجودة في النسخة
           * القديمة نبدأ بمصفوفة فارغة.
           */
          setMinistryBooks(
            (
              d.ministryBooks ??
              []
            ).map(
              (
                book: any
              ): MinistryBook => ({
                id:
                  String(
                    book.id ??
                    id()
                  ),

                title:
                  String(
                    book.title ??
                    ''
                  ),

                bookNumber:
                  String(
                    book.bookNumber ??
                    ''
                  ),

                date:
                  String(
                    book.date ??
                    ''
                  ),

                category:
                  ministryBookCategories.includes(
                    book.category
                  )
                    ? book.category
                    : 'أخرى',

                imageUri:
                  String(
                    book.imageUri ??
                    ''
                  ),

                notes:
                  book.notes
                    ? String(
                        book.notes
                      )
                    : '',

                createdAt:
                  String(
                    book.createdAt ??
                    new Date().toISOString()
                  ),
              })
            )
          );
        }
      } catch (error) {
        console.warn(
          'تعذر تحميل بيانات التطبيق:',
          error
        );
      } finally {
        setReady(true);
      }
    })();
  }, []);

  /*
   * =======================================================
   * حفظ جميع البيانات
   * =======================================================
   */

  useEffect(() => {
    if (!ready) {
      return;
    }

    AsyncStorage.setItem(
      'edu-supervision-store',
      JSON.stringify({
        schools,
        visits,
        tasks,
        staffing,

        /*
         * الكتب الوزارية
         */
        ministryBooks,
      })
    ).catch(
      (error) => {
        console.warn(
          'تعذر حفظ بيانات التطبيق:',
          error
        );
      }
    );
  }, [
    schools,
    visits,
    tasks,
    staffing,
    ministryBooks,
    ready,
  ]);

  /*
   * =======================================================
   * المدارس
   * =======================================================
   */

  const addSchool = (
    data: Omit<School, 'id'>
  ) =>
    setSchools(
      (current) => [
        {
          ...data,
          id: id(),
        },

        ...current,
      ]
    );

  const updateSchool = (
    schoolId: string,
    data: Omit<School, 'id'>
  ) =>
    setSchools(
      (current) =>
        current.map(
          (school) =>
            school.id ===
            schoolId
              ? {
                  ...data,
                  id: schoolId,
                }
              : school
        )
    );

  /*
   * =======================================================
   * الزيارات
   * =======================================================
   */

  const addVisit = (
    data: Omit<Visit, 'id'>
  ) =>
    setVisits(
      (current) => [
        {
          ...data,
          id: id(),
        },

        ...current,
      ]
    );

  const updateVisit = (
    visitId: string,
    data: Omit<Visit, 'id'>
  ) =>
    setVisits(
      (current) =>
        current.map(
          (visit) =>
            visit.id ===
            visitId
              ? {
                  ...data,
                  id: visitId,
                }
              : visit
        )
    );

  /*
   * =======================================================
   * المهام
   * =======================================================
   */

  const addTask = (
    data: Omit<Task, 'id'>
  ) =>
    setTasks(
      (current) => [
        {
          ...data,
          id: id(),
        },

        ...current,
      ]
    );

  const toggleTask = (
    taskId: string
  ) =>
    setTasks(
      (current) =>
        current.map(
          (task) =>
            task.id ===
            taskId
              ? {
                  ...task,
                  done:
                    !task.done,
                }
              : task
        )
    );

  /*
   * =======================================================
   * الملاك والاحتياج
   * =======================================================
   */

  const addStaffing = (
    data: Omit<Staffing, 'id'>
  ) =>
    setStaffing(
      (current) => [
        {
          ...data,
          id: id(),
        },

        ...current,
      ]
    );

  const updateStaffing = (
    staffingId: string,
    data: Omit<Staffing, 'id'>
  ) =>
    setStaffing(
      (current) =>
        current.map(
          (record) =>
            record.id ===
            staffingId
              ? {
                  ...data,
                  id: staffingId,
                }
              : record
        )
    );

  const deleteStaffing = (
    staffingId: string
  ) =>
    setStaffing(
      (current) =>
        current.filter(
          (record) =>
            record.id !==
            staffingId
        )
    );

  /*
   * =======================================================
   * الكتب الوزارية
   * =======================================================
   */

  /*
   * إضافة كتاب
   */
  const addMinistryBook = (
    data: Omit<MinistryBook, 'id'>
  ) =>
    setMinistryBooks(
      (current) => [
        {
          ...data,
          id: id(),
        },

        ...current,
      ]
    );

  /*
   * تعديل كتاب
   */
  const updateMinistryBook = (
    bookId: string,
    data: Omit<MinistryBook, 'id'>
  ) =>
    setMinistryBooks(
      (current) =>
        current.map(
          (book) =>
            book.id ===
            bookId
              ? {
                  ...data,
                  id: bookId,
                }
              : book
        )
    );

  /*
   * حذف كتاب
   */
  const deleteMinistryBook = (
    bookId: string
  ) =>
    setMinistryBooks(
      (current) =>
        current.filter(
          (book) =>
            book.id !==
            bookId
        )
    );

  /*
   * =======================================================
   * Store Value
   * =======================================================
   */

  const value =
    useMemo(
      () => ({
        schools,
        visits,
        tasks,
        staffing,

        /*
         * الكتب
         */
        ministryBooks,

        ready,

        /*
         * المدارس
         */
        addSchool,
        updateSchool,

        /*
         * الزيارات
         */
        addVisit,
        updateVisit,

        /*
         * المهام
         */
        addTask,
        toggleTask,

        /*
         * الملاك
         */
        addStaffing,
        updateStaffing,
        deleteStaffing,

        /*
         * الكتب
         */
        addMinistryBook,
        updateMinistryBook,
        deleteMinistryBook,
      }),
      [
        schools,
        visits,
        tasks,
        staffing,
        ministryBooks,
        ready,
      ]
    );

  return (
    <StoreContext.Provider
      value={value}
    >
      {children}
    </StoreContext.Provider>
  );
}

/*
 * =========================================================
 * useStore
 * =========================================================
 */

export const useStore = () => {
  const value =
    useContext(
      StoreContext
    );

  if (!value) {
    throw new Error(
      'useStore must be used within StoreProvider'
    );
  }

  return value;
};

/*
 * =========================================================
 * أنواع الزيارات
 * =========================================================
 */

export const visitTypes = [
  'زيارة اختصاص',
  'زيارة متابعة',
  'زيارة صديق ناقد',
  'زيارة تحقق',
  'زيارة تحقيق',
  'زيارة تقويمية',
  'زيارة غير تقويمية',
];

/*
 * =========================================================
 * حالات الزيارة
 * =========================================================
 */

export const statusLabels = {
  planned: 'مخططة',
  completed: 'تمت',
  postponed: 'مؤجلة',
};