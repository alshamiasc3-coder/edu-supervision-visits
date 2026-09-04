import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useColors } from '@/hooks/useColors';
import { useStore, statusLabels } from '@/context/AppContext';

export default function Home() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { schools, visits, tasks } = useStore();

  const currentMonth = useMemo(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }, []);

  const monthVisits = useMemo(() => visits.filter((visit) => {
    const date = new Date(visit.date);
    if (Number.isNaN(date.getTime())) return false;
    return date.getFullYear() === currentMonth.year && date.getMonth() + 1 === currentMonth.month;
  }), [visits, currentMonth]);

  const completed = monthVisits.filter((visit) => visit.status === 'completed').length;
  const planned = monthVisits.filter((visit) => visit.status === 'planned').length;

  const todayTasks = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return tasks.filter((task) => task.date === today);
  }, [tasks]);

  const recentVisits = monthVisits.slice(0, 3);

  const getSchoolName = (schoolId: string) =>
    schools.find((school) => school.id === schoolId)?.name || 'مدرسة غير محددة';

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 110 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.top}>
        <View style={styles.topText}>
          <Text style={[styles.eyebrow, { color: c.primary }]}>نظام الإشراف التربوي</Text>
          <Text style={[styles.greeting, { color: c.foreground }]}>صباح الخير، أستاذ ضرغام</Text>
        </View>
        <View style={[styles.avatar, { backgroundColor: c.secondary }]}>
          <Feather name="briefcase" size={23} color={c.primary} />
        </View>
      </View>

      <View style={[styles.hero, { backgroundColor: c.navy }]}>
        <View style={styles.heroText}>
          <Text style={styles.heroKicker}>المتابعة اليومية</Text>
          <Text style={styles.heroTitle}>سجّل زياراتك بوضوح، وابقَ قريباً من كل مدرسة.</Text>
          <Text style={styles.heroSub}>إدارة السجلات والخطط والكتب الوزارية من مكان واحد</Text>
        </View>
        <View style={[styles.heroIcon, { backgroundColor: c.accent }]}>
          <Feather name="map" size={31} color={c.navy} />
        </View>
      </View>

      <View style={styles.metrics}>
        <Metric icon="home" label="المدارس" value={schools.length} c={c} onPress={() => router.push('/(tabs)/schools')} />
        <Metric icon="check-circle" label="زيارات الشهر" value={completed} c={c} onPress={() => router.push('/(tabs)/visits')} />
        <Metric icon="clock" label="مخططة" value={planned} c={c} onPress={() => router.push('/monthly-plan')} />
      </View>

      <View style={styles.sectionHead}>
        <Text style={[styles.sectionTitle, { color: c.foreground }]}>إجراءات سريعة</Text>
      </View>

      <View style={styles.quickGrid}>
        <Quick icon="plus-square" label="إضافة مدرسة" onPress={() => router.push('/school-form')} c={c} />
        <Quick icon="camera" label="تسجيل زيارة" onPress={() => router.push('/visit-form')} c={c} />
        <Quick icon="calendar" label="جدولة عمل" onPress={() => router.push('/task-form')} c={c} />
        <Quick icon="clipboard" label="الخطة الشهرية" onPress={() => router.push('/monthly-plan')} c={c} />
        <Quick icon="file-text" label="الكتب الوزارية" onPress={() => router.push('/ministry-books')} c={c} />
      </View>

      <View style={styles.sectionHead}>
        <Text style={[styles.sectionTitle, { color: c.foreground }]}>زيارات هذا الشهر</Text>
        <Pressable onPress={() => router.push('/(tabs)/visits')}>
          <Text style={[styles.linkText, { color: c.primary }]}>عرض الكل</Text>
        </Pressable>
      </View>

      {recentVisits.length === 0 ? (
        <View style={[styles.emptyVisits, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={[styles.emptyVisitsIcon, { backgroundColor: c.secondary }]}>
            <Feather name="calendar" size={25} color={c.primary} />
          </View>
          <Text style={[styles.emptyVisitsTitle, { color: c.foreground }]}>لا توجد زيارات هذا الشهر</Text>
          <Text style={[styles.emptyVisitsText, { color: c.mutedForeground }]}>يمكنك تسجيل زيارة جديدة من الإجراءات السريعة.</Text>
        </View>
      ) : (
        recentVisits.map((visit) => (
          <Pressable
            key={visit.id}
            onPress={() => router.push({ pathname: '/visit-details', params: { visitId: String(visit.id) } })}
            style={({ pressed }) => [styles.visitRow, { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.78 : 1 }]}
          >
            <View style={[styles.dateBox, { backgroundColor: c.secondary }]}>
              <Text style={[styles.dateDay, { color: c.primary }]}>{visit.date.slice(-2)}</Text>
              <Text style={[styles.dateMonth, { color: c.mutedForeground }]}>{getArabicMonth(visit.date)}</Text>
            </View>
            <View style={styles.visitInfo}>
              <Text style={[styles.rowTitle, { color: c.foreground }]} numberOfLines={1}>{getSchoolName(visit.schoolId)}</Text>
              <Text style={[styles.rowSub, { color: c.mutedForeground }]} numberOfLines={1}>{visit.type} · {visit.date}</Text>
            </View>
            <Status status={visit.status} c={c} />
          </Pressable>
        ))
      )}

      <View style={[styles.todayCard, { backgroundColor: c.secondary }]}>
        <View style={[styles.todayIcon, { backgroundColor: c.card }]}>
          <Feather name="check-square" size={21} color={c.primary} />
        </View>
        <View style={styles.todayText}>
          <Text style={[styles.todayTitle, { color: c.foreground }]}>أعمال اليوم</Text>
          <Text style={[styles.todaySub, { color: c.mutedForeground }]}>لديك {todayTasks.length} {todayTasks.length === 1 ? 'مهمة' : 'مهام'} مسجلة لليوم.</Text>
        </View>
        <Pressable onPress={() => router.push('/(tabs)/tasks')}>
          <Text style={[styles.todayLink, { color: c.primary }]}>فتح</Text>
        </Pressable>
      </View>

      <View style={[styles.offline, { backgroundColor: c.secondary }]}>
        <Feather name="wifi-off" size={17} color={c.primary} />
        <Text style={[styles.offlineText, { color: c.secondaryForeground }]}>تعمل دون إنترنت · ستتم مزامنة البيانات عند توفر الاتصال</Text>
      </View>

      <Text style={[styles.credit, { color: c.mutedForeground }]}>تصميم وبرمجة: الاختصاص التربوي ضرغام مهدي</Text>
    </ScrollView>
  );
}

function getArabicMonth(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  const months = ['كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'];
  return months[date.getMonth()];
}

function Metric({ icon, label, value, c, onPress }: any) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.metric, { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.72 : 1 }]}
    >
      <Feather name={icon} size={18} color={c.primary} />
      <Text style={[styles.metricValue, { color: c.foreground }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: c.mutedForeground }]}>{label}</Text>
    </Pressable>
  );
}

function Quick({ icon, label, onPress, c }: any) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.quick, { backgroundColor: c.secondary, opacity: pressed ? 0.7 : 1 }]}>
      <Feather name={icon} size={23} color={c.primary} />
      <Text style={[styles.quickText, { color: c.secondaryForeground }]}>{label}</Text>
    </Pressable>
  );
}

function Status({ status, c }: any) {
  const backgroundColor = status === 'completed' ? '#E5F4EC' : status === 'postponed' ? '#FFF2DD' : c.secondary;
  const color = status === 'completed' ? c.success : status === 'postponed' ? c.warning : c.primary;
  return (
    <View style={[styles.status, { backgroundColor }]}>
      <Text style={[styles.statusText, { color }]}>{statusLabels[status as keyof typeof statusLabels] ?? status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 18 },
  top: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  topText: { flex: 1 },
  eyebrow: { fontSize: 12, fontFamily: 'Inter_600SemiBold', textAlign: 'right' },
  greeting: { fontSize: 20, fontFamily: 'Inter_700Bold', textAlign: 'right', marginTop: 5 },
  avatar: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  hero: { borderRadius: 24, padding: 20, flexDirection: 'row-reverse', alignItems: 'center', gap: 12, minHeight: 158 },
  heroText: { flex: 1 },
  heroKicker: { color: '#B7D9D4', fontSize: 12, fontFamily: 'Inter_600SemiBold', textAlign: 'right', marginBottom: 9 },
  heroTitle: { color: '#FFFFFF', fontSize: 18, lineHeight: 27, fontFamily: 'Inter_700Bold', textAlign: 'right' },
  heroSub: { color: '#B7D9D4', fontSize: 11, lineHeight: 17, fontFamily: 'Inter_400Regular', textAlign: 'right', marginTop: 9 },
  heroIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  metrics: { flexDirection: 'row-reverse', gap: 8, marginTop: 14 },
  metric: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 11, alignItems: 'center', justifyContent: 'center', minHeight: 84 },
  metricValue: { fontSize: 20, fontFamily: 'Inter_700Bold', marginTop: 4 },
  metricLabel: { fontSize: 10, fontFamily: 'Inter_500Medium', marginTop: 3 },
  sectionHead: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  linkText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quick: { width: '48%', borderRadius: 17, padding: 13, alignItems: 'center', justifyContent: 'center', minHeight: 84 },
  quickText: { fontFamily: 'Inter_600SemiBold', marginTop: 8, textAlign: 'center', fontSize: 12 },
  visitRow: { borderRadius: 17, borderWidth: 1, padding: 11, flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 9, gap: 10 },
  dateBox: { width: 45, height: 50, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  dateDay: { fontFamily: 'Inter_700Bold', fontSize: 17 },
  dateMonth: { fontFamily: 'Inter_500Medium', fontSize: 9 },
  visitInfo: { flex: 1, minWidth: 0 },
  rowTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13, textAlign: 'right' },
  rowSub: { fontFamily: 'Inter_400Regular', fontSize: 10, textAlign: 'right', marginTop: 4 },
  status: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  statusText: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  emptyVisits: { borderRadius: 18, borderWidth: 1, minHeight: 150, alignItems: 'center', justifyContent: 'center', padding: 20 },
  emptyVisitsIcon: { width: 52, height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  emptyVisitsTitle: { fontFamily: 'Inter_700Bold', fontSize: 14, marginTop: 10 },
  emptyVisitsText: { fontFamily: 'Inter_400Regular', fontSize: 10, textAlign: 'center', marginTop: 4 },
  todayCard: { marginTop: 8, borderRadius: 16, padding: 12, flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  todayIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  todayText: { flex: 1 },
  todayTitle: { fontFamily: 'Inter_700Bold', fontSize: 12, textAlign: 'right' },
  todaySub: { fontFamily: 'Inter_400Regular', fontSize: 10, textAlign: 'right', marginTop: 3 },
  todayLink: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  offline: { marginTop: 17, borderRadius: 14, padding: 12, flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  offlineText: { fontFamily: 'Inter_500Medium', fontSize: 11, flex: 1, textAlign: 'right' },
  credit: { textAlign: 'center', fontSize: 10, fontFamily: 'Inter_400Regular', marginTop: 20 },
});