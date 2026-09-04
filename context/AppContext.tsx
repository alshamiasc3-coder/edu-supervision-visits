import AsyncStorage from '@react-native-async-storage/async-storage';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

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

export type Visit = {
  id: string;
  schoolId: string;
  date: string;
  type: string;
  reason?: string;
  actions: string;
  recommendations: string;
  followUp?: string;
  status: 'planned' | 'completed' | 'postponed';
  photoUri?: string;
  photoUris?: string[];
};

export type Task = {
  id: string;
  title: string;
  schoolId?: string;
  time: string;
  priority: 'high' | 'medium' | 'low';
  notes: string;
  done: boolean;
  date: string;
  planStatus?: 'planned' | 'in_progress' | 'completed';
};

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

export type MinistryBookCategory = 'امتحانات' | 'نقل' | 'تعليمات' | 'هامة' | 'عاجلة' | 'أخرى';

export type MinistryBook = {
  id: string;
  title: string;
  bookNumber: string;
  date: string;
  category: MinistryBookCategory;
  imageUri: string;
  pdfUri?: string;
  pdfName?: string;
  pdfMimeType?: string;
  notes?: string;
  createdAt: string;
};

const id = () => Date.now().toString() + Math.random().toString(36).slice(2, 8);

const seedSchools: School[] = [
  { id: 's1', name: 'إعدادية الموهوبين للبنين', director: 'أحمد عبد الستار', adminDeputy: 'سارة ناظم', technicalDeputy: 'محمد كريم', studentsDeputy: 'علي جاسم', sections: ['كهرباء', 'حاسبات', 'تجاري'], address: 'حي الجامعة - بغداد', lastVisit: '2026-08-12' },
  { id: 's2', name: 'ثانوية الأمل للبنات', director: 'زهراء فاضل', adminDeputy: 'نور حسين', technicalDeputy: 'هدى عباس', studentsDeputy: 'رنا كاظم', sections: ['علمي', 'أدبي'], address: 'الكرادة - بغداد' },
  { id: 's3', name: 'مدرسة النور المهنية', director: 'حسن علي', adminDeputy: 'مريم سعد', technicalDeputy: 'قاسم عادل', studentsDeputy: '', sections: ['محاسبة', 'ميكانيك'], address: 'الشعلة - بغداد', lastVisit: '2026-07-24' },
];

const seedVisits: Visit[] = [
  { id: 'v1', schoolId: 's1', date: '2026-08-24', type: 'زيارة اختصاص', reason: 'متابعة خطة القسم', actions: 'تدقيق السجلات ومتابعة خطة القسم', recommendations: 'استكمال النواقص في السجلات ومتابعة تنفيذ خطة القسم.', status: 'planned' },
  { id: 'v2', schoolId: 's2', date: '2026-08-18', type: 'زيارة تقويمية', reason: 'متابعة خطة التحسين', actions: 'إكمال خطة التحسين', recommendations: 'تنفيذ خطة التحسين ومتابعة مستوى الأداء المدرسي.', status: 'completed' },
  { id: 'v3', schoolId: 's3', date: '2026-08-15', type: 'زيارة تحقق', reason: 'متابعة تنفيذ التوصيات السابقة', actions: 'إعادة الزيارة بعد أسبوع', recommendations: 'تنفيذ التوصيات السابقة ورفع مستوى الالتزام بالإجراءات المطلوبة.', status: 'postponed' },
];

const seedTasks: Task[] = [
  { id: 't1', title: 'تدقيق سجل الزيارات', schoolId: 's1', time: '09:00', priority: 'high', notes: 'التأكد من توقيع الإدارة', done: false, date: '2026-08-20', planStatus: 'planned' },
  { id: 't2', title: 'إعداد تقرير الشهر', time: '12:30', priority: 'medium', notes: 'إرفاق صور السجلات', done: true, date: '2026-08-20', planStatus: 'completed' },
];

const seedStaffing: Staffing[] = [
  { id: 'st1', schoolId: 's1', specialty: 'حاسوب', required: 4, current: 4, stage: 'إعدادي', district: 'الجامعة - بغداد' },
  { id: 'st2', schoolId: 's1', specialty: 'رياضيات', required: 8, current: 6, stage: 'إعدادي', district: 'الجامعة - بغداد' },
  { id: 'st3', schoolId: 's1', specialty: 'فيزياء', required: 5, current: 7, stage: 'إعدادي', district: 'الجامعة - بغداد', notes: 'متابعة وضع الفيض في الزيارة القادمة' },
];

export const ministryBookCategories: MinistryBookCategory[] = ['امتحانات', 'نقل', 'تعليمات', 'هامة', 'عاجلة', 'أخرى'];

const StoreContext = createContext<any>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [schools, setSchools] = useState<School[]>(seedSchools);
  const [visits, setVisits] = useState<Visit[]>(seedVisits);
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const [staffing, setStaffing] = useState<Staffing[]>(seedStaffing);
  const [ministryBooks, setMinistryBooks] = useState<MinistryBook[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('edu-supervision-store');
        if (raw) {
          const d = JSON.parse(raw);
          setSchools(d.schools ?? seedSchools);
          setVisits((d.visits ?? seedVisits).map((visit: any): Visit => {
            const legacyPhotos = Array.isArray(visit.photoUris) ? visit.photoUris.filter(Boolean).map(String) : [];
            if (visit.photoUri && !legacyPhotos.includes(String(visit.photoUri))) legacyPhotos.unshift(String(visit.photoUri));
            return {
              id: String(visit.id ?? id()), schoolId: String(visit.schoolId ?? ''), date: String(visit.date ?? ''), type: String(visit.type ?? ''),
              reason: visit.reason ? String(visit.reason) : '', actions: String(visit.actions ?? ''), recommendations: String(visit.recommendations ?? ''),
              followUp: visit.followUp ? String(visit.followUp) : '',
              status: visit.status === 'planned' || visit.status === 'postponed' ? visit.status : 'completed',
              photoUri: legacyPhotos[0] || undefined, photoUris: legacyPhotos,
            };
          }));
          setTasks((d.tasks ?? seedTasks).map((task: any): Task => ({
            id: String(task.id ?? id()), title: String(task.title ?? ''), schoolId: task.schoolId ? String(task.schoolId) : undefined,
            time: String(task.time ?? ''), priority: task.priority === 'high' || task.priority === 'low' ? task.priority : 'medium', notes: String(task.notes ?? ''),
            done: Boolean(task.done), date: String(task.date ?? ''), planStatus: task.planStatus === 'in_progress' || task.planStatus === 'completed' ? task.planStatus : task.done ? 'completed' : 'planned',
          })));
          setStaffing(d.staffing ?? seedStaffing);
          setMinistryBooks((d.ministryBooks ?? []).map((book: any): MinistryBook => ({
            id: String(book.id ?? id()), title: String(book.title ?? ''), bookNumber: String(book.bookNumber ?? ''), date: String(book.date ?? ''),
            category: ministryBookCategories.includes(book.category) ? book.category : 'أخرى', imageUri: String(book.imageUri ?? ''),
            pdfUri: book.pdfUri ? String(book.pdfUri) : undefined,
            pdfName: book.pdfName ? String(book.pdfName) : undefined,
            pdfMimeType: book.pdfMimeType ? String(book.pdfMimeType) : undefined,
            notes: book.notes ? String(book.notes) : '', createdAt: String(book.createdAt ?? new Date().toISOString()),
          })));
        }
      } catch (error) { console.warn('تعذر تحميل بيانات التطبيق:', error); }
      finally { setReady(true); }
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem('edu-supervision-store', JSON.stringify({ schools, visits, tasks, staffing, ministryBooks })).catch(error => console.warn('تعذر حفظ بيانات التطبيق:', error));
  }, [schools, visits, tasks, staffing, ministryBooks, ready]);

  const addSchool = (data: Omit<School, 'id'>) => setSchools(current => [{ ...data, id: id() }, ...current]);
  const updateSchool = (schoolId: string, data: Omit<School, 'id'>) => setSchools(current => current.map(school => school.id === schoolId ? { ...data, id: schoolId } : school));
  const addVisit = (data: Omit<Visit, 'id'>) => setVisits(current => [{ ...data, id: id() }, ...current]);
  const updateVisit = (visitId: string, data: Omit<Visit, 'id'>) => setVisits(current => current.map(visit => visit.id === visitId ? { ...data, id: visitId } : visit));
  const addTask = (data: Omit<Task, 'id'>) => setTasks(current => [{ ...data, id: id() }, ...current]);
  const updateTask = (taskId: string, data: Omit<Task, 'id'>) => setTasks(current => current.map(task => task.id === taskId ? { ...data, id: taskId } : task));
  const deleteTask = (taskId: string) => setTasks(current => current.filter(task => task.id !== taskId));
  const toggleTask = (taskId: string) => setTasks(current => current.map(task => task.id === taskId ? { ...task, done: !task.done, planStatus: !task.done ? 'completed' : 'planned' } : task));
  const addStaffing = (data: Omit<Staffing, 'id'>) => setStaffing(current => [{ ...data, id: id() }, ...current]);
  const updateStaffing = (staffingId: string, data: Omit<Staffing, 'id'>) => setStaffing(current => current.map(record => record.id === staffingId ? { ...data, id: staffingId } : record));
  const deleteStaffing = (staffingId: string) => setStaffing(current => current.filter(record => record.id !== staffingId));
  const addMinistryBook = (data: Omit<MinistryBook, 'id'>) => setMinistryBooks(current => [{ ...data, id: id() }, ...current]);
  const updateMinistryBook = (bookId: string, data: Omit<MinistryBook, 'id'>) => setMinistryBooks(current => current.map(book => book.id === bookId ? { ...data, id: bookId } : book));
  const deleteMinistryBook = (bookId: string) => setMinistryBooks(current => current.filter(book => book.id !== bookId));

  const value = useMemo(() => ({ schools, visits, tasks, staffing, ministryBooks, ready, addSchool, updateSchool, addVisit, updateVisit, addTask, updateTask, deleteTask, toggleTask, addStaffing, updateStaffing, deleteStaffing, addMinistryBook, updateMinistryBook, deleteMinistryBook }), [schools, visits, tasks, staffing, ministryBooks, ready]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error('useStore must be used inside StoreProvider');
  return value;
}

export const visitTypes = ['زيارة اختصاص', 'زيارة تقويمية', 'زيارة تحقق', 'زيارة متابعة'];
export const statusLabels: Record<string, string> = { planned: 'مخططة', completed: 'مكتملة', postponed: 'مؤجلة' };
