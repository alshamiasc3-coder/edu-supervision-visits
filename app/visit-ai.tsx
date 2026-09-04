import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useStore } from '@/context/AppContext';

const asString = (v?: string | string[] | null) => Array.isArray(v) ? v[0] ?? '' : v?.toString() ?? '';

export default function VisitAI() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { visits } = useStore();
  const params = useLocalSearchParams<{ visitId?: string; schoolId?: string; schoolName?: string; visitType?: string; type?: string; date?: string }>();
  const schoolId = asString(params.schoolId);
  const schoolName = asString(params.schoolName) || 'المدرسة';
  const [visitType, setVisitType] = useState(asString(params.visitType || params.type));
  const [briefContext, setBriefContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const previousVisits = useMemo(() => visits
    .filter(v => v.schoolId === schoolId && v.id !== asString(params.visitId))
    .sort((a, b) => b.date.localeCompare(a.date)), [visits, schoolId, params.visitId]);

  const createDraft = () => {
    if (!visitType.trim()) { setMessage('اكتب نوع الزيارة أولًا.'); return; }
    setMessage('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setMessage('واجهة الإدخال جاهزة. الخطوة التالية هي ربطها بالمساعد الذكي لإنشاء المسودة واعتمادها داخل الزيارة.');
    }, 250);
  };

  return (
    <View style={[styles.page, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10, borderBottomColor: c.border }]}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Feather name="arrow-right" size={23} color={c.foreground} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: c.foreground }]}>المساعد الذكي للزيارة</Text>
          <Text style={[styles.subtitle, { color: c.mutedForeground }]}>المساعد يكتب المسودة والمشرف يراجعها</Text>
        </View>
        <View style={[styles.iconBox, { backgroundColor: c.secondary }]}>
          <Feather name="cpu" size={22} color={c.primary} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 15, paddingBottom: insets.bottom + 35 }}>
        <View style={[styles.infoCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.infoLabel, { color: c.mutedForeground }]}>المدرسة</Text>
          <Text style={[styles.infoValue, { color: c.foreground }]}>{schoolName}</Text>
        </View>

        <View style={[styles.notice, { backgroundColor: c.secondary }]}>
          <Feather name="info" size={19} color={c.primary} />
          <Text style={[styles.noticeText, { color: c.secondaryForeground }]}>لا يعيد المشرف كتابة الإجراءات أو التوصيات أو المتابعة. يحدد نوع الزيارة ويعطي المساعد ما يلزم من محاور مختصرة، ثم يكتب المساعد المسودة كاملة.</Text>
        </View>

        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>نوع الزيارة</Text>
          <Text style={[styles.helper, { color: c.mutedForeground }]}>اكتب نوع الزيارة بحرية حسب طبيعة العمل.</Text>
          <TextInput
            value={visitType}
            onChangeText={setVisitType}
            placeholder="مثال: زيارة متابعة فنية"
            placeholderTextColor={c.mutedForeground}
            style={[styles.input, { color: c.foreground, borderColor: c.border, backgroundColor: c.background }]}
            textAlign="right"
          />
        </View>

        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>محاور أو معلومات مختصرة</Text>
          <Text style={[styles.helper, { color: c.mutedForeground }]}>اكتب رؤوس أقلام بسيطة فقط مما تريد من المساعد أن يراعيه في الزيارة.</Text>
          <TextInput
            value={briefContext}
            onChangeText={setBriefContext}
            placeholder={'مثال:\nمتابعة تنفيذ الخطة\nالاطلاع على السجلات\nمتابعة أداء المدرس'}
            placeholderTextColor={c.mutedForeground}
            style={[styles.textArea, { color: c.foreground, borderColor: c.border, backgroundColor: c.background }]}
            textAlign="right"
            textAlignVertical="top"
            multiline
          />
        </View>

        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: c.foreground }]}>سياق الزيارات السابقة</Text>
            <Text style={[styles.count, { color: c.mutedForeground }]}>{previousVisits.length}</Text>
          </View>
          <Text style={[styles.helper, { color: c.mutedForeground }]}>سيستفيد المساعد من الزيارات السابقة المحفوظة لهذه المدرسة لتحسين السياق والمقترحات، دون اختلاق إجراءات لم تحدث.</Text>
          {previousVisits.slice(0, 3).map(v => (
            <View key={v.id} style={[styles.historyItem, { borderTopColor: c.border }]}>
              <Text style={[styles.historyType, { color: c.primary }]}>{v.type} · {v.date}</Text>
              <Text style={[styles.historyText, { color: c.foreground }]} numberOfLines={3}>{v.actions || 'لا توجد تفاصيل محفوظة'}</Text>
            </View>
          ))}
        </View>

        {message ? <View style={[styles.message, { backgroundColor: c.secondary }]}><Feather name="info" size={17} color={c.primary} /><Text style={[styles.messageText, { color: c.foreground }]}>{message}</Text></View> : null}

        <Pressable onPress={createDraft} disabled={loading} style={[styles.analyze, { backgroundColor: c.navy, opacity: loading ? 0.7 : 1 }]}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Feather name="zap" size={20} color={c.accent} />}
          <Text style={styles.analyzeText}>{loading ? 'جاري إعداد المسودة...' : 'إنشاء مسودة الزيارة'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 14, borderBottomWidth: 1 },
  back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, alignItems: 'flex-end' },
  title: { fontFamily: 'Inter_700Bold', fontSize: 20, textAlign: 'right' },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 3, textAlign: 'right' },
  iconBox: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  infoCard: { borderWidth: 1, borderRadius: 17, padding: 14, marginBottom: 12 },
  infoLabel: { fontFamily: 'Inter_500Medium', fontSize: 10, textAlign: 'right' },
  infoValue: { fontFamily: 'Inter_700Bold', fontSize: 13, textAlign: 'right', marginTop: 5 },
  notice: { borderRadius: 15, padding: 13, flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 9, marginBottom: 12 },
  noticeText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 19, textAlign: 'right' },
  card: { borderWidth: 1, borderRadius: 17, padding: 14, marginBottom: 12 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 15, textAlign: 'right' },
  helper: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 18, textAlign: 'right', marginTop: 6 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, paddingVertical: 10, marginTop: 12, fontFamily: 'Inter_500Medium', fontSize: 12 },
  textArea: { minHeight: 115, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, paddingVertical: 12, marginTop: 12, fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 21 },
  sectionRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  count: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  historyItem: { paddingTop: 10, marginTop: 10, borderTopWidth: 1 },
  historyType: { fontFamily: 'Inter_600SemiBold', fontSize: 10, textAlign: 'right' },
  historyText: { fontFamily: 'Inter_500Medium', fontSize: 10, lineHeight: 17, textAlign: 'right', marginTop: 4 },
  message: { borderRadius: 13, padding: 11, flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 7, marginBottom: 12 },
  messageText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 10, lineHeight: 17, textAlign: 'right' },
  analyze: { minHeight: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row-reverse', gap: 9 },
  analyzeText: { color: '#FFF', fontFamily: 'Inter_700Bold', fontSize: 13 },
});