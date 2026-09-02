import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type School = { id: string; name: string; director: string; adminDeputy: string; technicalDeputy: string; studentsDeputy: string; sections: string[]; address: string; lastVisit?: string };
export type Visit = { id: string; schoolId: string; date: string; type: string; observations?: string; actions: string; proposals: string; followUp?: string; status: 'planned' | 'completed' | 'postponed'; photoUri?: string };
export type Task = { id: string; title: string; schoolId?: string; time: string; priority: 'high' | 'medium' | 'low'; notes: string; done: boolean; date: string };

const id = () => Date.now().toString() + Math.random().toString(36).slice(2, 8);
const seedSchools: School[] = [
 { id: 's1', name: 'إعدادية الموهوبين للبنين', director: 'أحمد عبد الستار', adminDeputy: 'سارة ناظم', technicalDeputy: 'محمد كريم', studentsDeputy: 'علي جاسم', sections: ['كهرباء', 'حاسبات', 'تجاري'], address: 'حي الجامعة - بغداد', lastVisit: '2026-08-12' },
 { id: 's2', name: 'ثانوية الأمل للبنات', director: 'زهراء فاضل', adminDeputy: 'نور حسين', technicalDeputy: 'هدى عباس', studentsDeputy: 'رنا كاظم', sections: ['علمي', 'أدبي'], address: 'الكرادة - بغداد' },
 { id: 's3', name: 'مدرسة النور المهنية', director: 'حسن علي', adminDeputy: 'مريم سعد', technicalDeputy: 'قاسم عادل', studentsDeputy: 'رائد مهدي', sections: ['محاسبة', 'ميكانيك'], address: 'الشعلة - بغداد', lastVisit: '2026-07-24' },
];
const seedVisits: Visit[] = [
 { id: 'v1', schoolId: 's1', date: '2026-08-24', type: 'زيارة اختصاص', actions: 'تدقيق السجلات ومتابعة خطة القسم', proposals: 'مواصلة متابعة تنفيذ خطة القسم وتوثيق النتائج.', status: 'planned' },
 { id: 'v2', schoolId: 's2', date: '2026-08-18', type: 'زيارة تقويمية', actions: 'إكمال خطة التحسين', proposals: 'متابعة تنفيذ خطة التحسين وقياس أثرها.', status: 'completed' },
 { id: 'v3', schoolId: 's3', date: '2026-08-15', type: 'زيارة تحقق', actions: 'إعادة الزيارة بعد أسبوع', proposals: 'إجراء زيارة متابعة للتحقق من تنفيذ التوصيات.', status: 'postponed' },
];
const seedTasks: Task[] = [
 { id: 't1', title: 'تدقيق سجل الزيارات', schoolId: 's1', time: '09:00', priority: 'high', notes: 'التأكد من توقيع الإدارة', done: false, date: '2026-08-20' },
 { id: 't2', title: 'إعداد تقرير الشهر', time: '12:30', priority: 'medium', notes: 'إرفاق صور السجلات', done: true, date: '2026-08-20' },
];

type StoreValue = { schools: School[]; visits: Visit[]; tasks: Task[]; ready: boolean; addSchool: (data: Omit<School, 'id'>) => void; updateSchool: (schoolId: string, data: Omit<School, 'id'>) => void; addVisit: (data: Omit<Visit, 'id'>) => void; addTask: (data: Omit<Task, 'id'>) => void; toggleTask: (taskId: string) => void; updateVisit: (visitId: string, status: Visit['status']) => void };
const StoreContext = createContext<StoreValue | null>(null);
export function StoreProvider({ children }: { children: React.ReactNode }) {
 const [schools, setSchools] = useState<School[]>(seedSchools); const [visits, setVisits] = useState<Visit[]>(seedVisits); const [tasks, setTasks] = useState<Task[]>(seedTasks); const [ready, setReady] = useState(false);
 useEffect(() => { (async () => { try { const raw = await AsyncStorage.getItem('edu-supervision-store'); if (raw) { const d = JSON.parse(raw); setSchools(d.schools ?? seedSchools); setVisits((d.visits ?? seedVisits).map((v: Visit) => ({ ...v, observations: v.observations ?? '', proposals: v.proposals ?? '', followUp: v.followUp ?? '' }))); setTasks(d.tasks ?? seedTasks); } } finally { setReady(true); } })(); }, []);
 useEffect(() => { if (ready) AsyncStorage.setItem('edu-supervision-store', JSON.stringify({ schools, visits, tasks })); }, [schools, visits, tasks, ready]);
 const addSchool = (data: Omit<School, 'id'>) => setSchools(v => [{ ...data, id: id() }, ...v]);
 const updateSchool = (schoolId: string, data: Omit<School, 'id'>) => setSchools(v => v.map(s => s.id === schoolId ? { ...data, id: schoolId } : s));
 const addVisit = (data: Omit<Visit, 'id'>) => setVisits(v => [{ ...data, id: id() }, ...v]);
 const addTask = (data: Omit<Task, 'id'>) => setTasks(v => [{ ...data, id: id() }, ...v]);
 const toggleTask = (taskId: string) => setTasks(v => v.map(t => t.id === taskId ? { ...t, done: !t.done } : t));
 const updateVisit = (visitId: string, status: Visit['status']) => setVisits(v => v.map(x => x.id === visitId ? { ...x, status } : x));
 const value = useMemo(() => ({ schools, visits, tasks, ready, addSchool, updateSchool, addVisit, addTask, toggleTask, updateVisit }), [schools, visits, tasks, ready]);
 return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
export const useStore = () => { const value = useContext(StoreContext); if (!value) throw new Error('useStore must be used within StoreProvider'); return value; };
export const visitTypes = ['زيارة اختصاص', 'زيارة صديق ناقد', 'زيارة تحقق', 'زيارة تحقيق', 'زيارة تقويمية', 'زيارة غير تقويمية'];
export const statusLabels = { planned: 'مخططة', completed: 'تمت', postponed: 'مؤجلة' };
