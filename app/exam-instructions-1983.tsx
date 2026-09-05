import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const instructions = [
  ['1', 'بشأن امتحانات نصف السنة والامتحانات النهائية'],
  ['2', 'بشأن الدرجات المقاربة لدرجة النجاح الصغرى'],
  ['3', 'بشأن لجان تدقيق نتائج الامتحانات للصفوف غير المنتهية'],
  ['4', 'بشأن احتساب الاختبارات الصفية واليومية والشهرية'],
  ['5', 'بشأن تبليغ نتائج الامتحانات وتنظيم قوائم الصفوف'],
  ['6', 'بشأن التحقيق في قضايا الامتحانات والشهادات'],
  ['7', 'بشأن سجلات الدرجات'],
  ['8', 'للطلاب المشتركين في الامتحانات العامة'],
  ['9', 'لمراقبي الامتحانات العامة'],
  ['10', 'لمديري مراكز الامتحانات العامة'],
];

export default function ExamInstructions1983() {
  const c = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.page, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10, borderBottomColor: c.border }]}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Feather name="arrow-right" size={23} color={c.foreground} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: c.foreground }]}>التعليمات الامتحانية لسنة 1983</Text>
          <Text style={[styles.subtitle, { color: c.mutedForeground }]}>مجموعة الأنظمة والتعليمات الخاصة بالامتحانات والشهادات</Text>
        </View>
        <View style={[styles.iconBox, { backgroundColor: c.secondary }]}>
          <Feather name="clipboard" size={22} color={c.primary} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 15, paddingBottom: insets.bottom + 35 }}>
        <View style={[styles.notice, { backgroundColor: c.secondary }]}>
          <Feather name="info" size={19} color={c.primary} />
          <Text style={[styles.noticeText, { color: c.secondaryForeground }]}>هذه نافذة مرجعية للمجموعة الامتحانية لسنة 1983. أدرجت أرقام التعليمات وعناوينها كما تظهر في المراجع المتاحة، وسنربط النصوص وملفات PDF الموثقة لاحقًا دون اختلاق نصوص أو أرقام مواد.</Text>
        </View>

        {instructions.map(([number, title]) => (
          <View key={number} style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={[styles.number, { backgroundColor: c.secondary }]}>
              <Text style={[styles.numberText, { color: c.primary }]}>{number}</Text>
            </View>
            <View style={styles.textBox}>
              <Text style={[styles.label, { color: c.mutedForeground }]}>تعليمات رقم {number} لسنة 1983</Text>
              <Text style={[styles.cardTitle, { color: c.foreground }]}>{title}</Text>
            </View>
          </View>
        ))}

        <View style={[styles.sourceCard, { backgroundColor: c.secondary }]}>
          <Feather name="book-open" size={18} color={c.primary} />
          <Text style={[styles.sourceText, { color: c.secondaryForeground }]}>مرجع المجموعة: المكتبة الوطنية ودار الكتب والوثائق العراقية تسجل «مجموعة الأنظمة والتعليمات الخاصة بالامتحانات والشهادات» المنشورة في بغداد عن مطبعة وزارة التربية سنة 1983، وعدد صفحاتها 119 صفحة.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 14, borderBottomWidth: 1 },
  back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, alignItems: 'flex-end' },
  title: { fontFamily: 'Inter_700Bold', fontSize: 18, textAlign: 'right' },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 3, textAlign: 'right', lineHeight: 16 },
  iconBox: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  notice: { borderRadius: 15, padding: 13, flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 9, marginBottom: 12 },
  noticeText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 10, lineHeight: 18, textAlign: 'right' },
  card: { borderWidth: 1, borderRadius: 17, padding: 13, marginBottom: 9, flexDirection: 'row-reverse', alignItems: 'center', gap: 11 },
  number: { width: 43, height: 43, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  numberText: { fontFamily: 'Inter_700Bold', fontSize: 17 },
  textBox: { flex: 1, alignItems: 'flex-end' },
  label: { fontFamily: 'Inter_500Medium', fontSize: 9, textAlign: 'right' },
  cardTitle: { fontFamily: 'Inter_700Bold', fontSize: 13, lineHeight: 20, textAlign: 'right', marginTop: 3 },
  sourceCard: { marginTop: 5, borderRadius: 15, padding: 13, flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 9 },
  sourceText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 10, lineHeight: 18, textAlign: 'right' },
});
