import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { legislations, LegislationType } from '@/data/legislation';

const filters: Array<'الكل' | LegislationType> = ['الكل', 'قانون', 'نظام', 'تعليمات'];

export default function LegislationScreen() {
  const c = useColors();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'الكل' | LegislationType>('الكل');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return legislations.filter(item => {
      const matchesType = filter === 'الكل' || item.type === filter;
      const text = `${item.title} ${item.number} ${item.year} ${item.gazetteIssue ?? ''} ${item.summary} ${item.relevance.join(' ')}`.toLowerCase();
      return matchesType && (!q || text.includes(q));
    });
  }, [query, filter]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={{ backgroundColor: c.background }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={[styles.back, { backgroundColor: c.secondary }]}>
            <Feather name="arrow-right" size={20} color={c.primary} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.kicker, { color: c.primary }]}>مرجعية رسمية</Text>
            <Text style={[styles.title, { color: c.foreground }]}>التشريعات التربوية</Text>
            <Text style={[styles.subtitle, { color: c.mutedForeground }]}>قوانين وأنظمة وتعليمات مرتبطة بعمل المشرف التربوي</Text>
          </View>
        </View>

        <View style={[styles.notice, { backgroundColor: c.secondary, borderColor: c.border }]}>
          <Feather name="shield" size={19} color={c.primary} />
          <Text style={[styles.noticeText, { color: c.secondaryForeground }]}>المصدر المعتمد في النسخة النهائية: جريدة الوقائع العراقية. لن نثبت نصاً قانونياً قبل التحقق من العدد الرسمي.</Text>
        </View>

        <View style={[styles.searchBox, { backgroundColor: c.card, borderColor: c.border }]}>
          <Feather name="search" size={19} color={c.mutedForeground} />
          <TextInput value={query} onChangeText={setQuery} placeholder="ابحث باسم التشريع أو الرقم أو السنة..." placeholderTextColor={c.mutedForeground} style={[styles.searchInput, { color: c.foreground }]} textAlign="right" />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {filters.map(item => (
            <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, { backgroundColor: filter === item ? c.primary : c.card, borderColor: filter === item ? c.primary : c.border }]}>
              <Text style={{ color: filter === item ? '#fff' : c.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>{item}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>المراجع ({results.length})</Text>
          <Text style={[styles.sectionHint, { color: c.mutedForeground }]}>الأحدث أولاً</Text>
        </View>

        {results.sort((a, b) => b.year - a.year).map(item => (
          <View key={item.id} style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={styles.cardTop}>
              <View style={[styles.typeBadge, { backgroundColor: c.secondary }]}>
                <Text style={{ color: c.primary, fontFamily: 'Inter_600SemiBold', fontSize: 11 }}>{item.type}</Text>
              </View>
              {item.verified ? (
                <View style={styles.verified}><Feather name="check-circle" size={14} color={c.success} /><Text style={{ color: c.success, fontSize: 10, fontFamily: 'Inter_600SemiBold' }}>موثق بالعدد</Text></View>
              ) : (
                <View style={styles.pending}><Feather name="clock" size={14} color={c.warning} /><Text style={{ color: c.warning, fontSize: 10, fontFamily: 'Inter_600SemiBold' }}>بانتظار التحقق</Text></View>
              )}
            </View>

            <Text style={[styles.cardTitle, { color: c.foreground }]}>{item.title}</Text>
            <Text style={[styles.meta, { color: c.mutedForeground }]}>رقم ({item.number}) لسنة {item.year}{item.gazetteIssue ? ` · الوقائع العراقية العدد ${item.gazetteIssue}` : ''}</Text>
            {item.gazetteDate ? <Text style={[styles.date, { color: c.mutedForeground }]}>تاريخ النشر: {item.gazetteDate}</Text> : null}
            <Text style={[styles.summary, { color: c.secondaryForeground }]}>{item.summary}</Text>

            <View style={styles.tags}>
              {item.relevance.map(tag => <View key={tag} style={[styles.tag, { backgroundColor: c.background }]}><Text style={{ color: c.mutedForeground, fontSize: 10 }}>{tag}</Text></View>)}
            </View>
          </View>
        ))}

        {results.length === 0 ? <View style={[styles.empty, { backgroundColor: c.card, borderColor: c.border }]}><Feather name="search" size={25} color={c.mutedForeground} /><Text style={{ color: c.mutedForeground, marginTop: 8, fontFamily: 'Inter_500Medium' }}>لا توجد نتائج مطابقة</Text></View> : null}

        <Text style={[styles.footer, { color: c.mutedForeground }]}>سيتم في المرحلة التالية إضافة نصوص المواد وروابط الأعداد الرسمية وربط المادة القانونية بالزيارة والتوصية.</Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 50 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, marginBottom: 16 },
  back: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  kicker: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textAlign: 'right' },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold', textAlign: 'right', marginTop: 3 },
  subtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'right', lineHeight: 19, marginTop: 4 },
  notice: { flexDirection: 'row-reverse', gap: 9, padding: 13, borderRadius: 14, borderWidth: 1, marginBottom: 13, alignItems: 'flex-start' },
  noticeText: { flex: 1, fontSize: 11, lineHeight: 18, textAlign: 'right', fontFamily: 'Inter_500Medium' },
  searchBox: { minHeight: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 13, flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular' },
  filters: { gap: 8, paddingVertical: 12 },
  filter: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12, borderWidth: 1 },
  sectionHead: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: 7, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  sectionHint: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  card: { borderRadius: 17, borderWidth: 1, padding: 15, marginBottom: 10 },
  cardTop: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9 },
  verified: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  pending: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  cardTitle: { fontSize: 15, lineHeight: 23, fontFamily: 'Inter_700Bold', textAlign: 'right', marginTop: 10 },
  meta: { fontSize: 10, fontFamily: 'Inter_500Medium', textAlign: 'right', marginTop: 5 },
  date: { fontSize: 10, fontFamily: 'Inter_400Regular', textAlign: 'right', marginTop: 3 },
  summary: { fontSize: 11, lineHeight: 19, textAlign: 'right', marginTop: 9, fontFamily: 'Inter_400Regular' },
  tags: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 5, marginTop: 10 },
  tag: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  empty: { borderRadius: 16, borderWidth: 1, alignItems: 'center', padding: 28 },
  footer: { fontSize: 10, lineHeight: 17, textAlign: 'center', marginTop: 15 },
});
