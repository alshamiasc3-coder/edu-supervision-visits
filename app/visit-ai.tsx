import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore, visitTypes } from '@/context/AppContext';
import { buildVisitAiContext } from '@/utils/visitAiContext';
import { buildLegalAiContext } from '@/utils/legalAiContext';

export const VISIT_AI_DRAFT_KEY = '@edu_supervision/visit_ai_draft';
const AI_WORKER_URL = (process.env.EXPO_PUBLIC_AI_WORKER_URL || '').trim().replace(/\/$/, '');

type VisitAiDraft = {
  schoolName: string;
  visitDate: string;
  visitType: string;
  observations: string;
  actions: string;
  proposals: string;
  followUp: string;
};

export default function VisitAIScreen() {
  const router = useRouter();
  const { visits, schools } = useStore();
  const [schoolName, setSchoolName] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 10));
  const [visitType, setVisitType] = useState(visitTypes[0]);
  const [observations, setObservations] = useState('');
  const [actions, setActions] = useState('');
  const [proposals, setProposals] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [result, setResult] = useState('');
  const [suggested, setSuggested] = useState<VisitAiDraft | null>(null);
  const [loading, setLoading] = useState(false);

  const context = useMemo(() => buildVisitAiContext({ schoolName, visitDate, visitType, observations, actions, proposals, followUp }, visits), [schoolName, visitDate, visitType, observations, actions, proposals, followUp, visits]);
  const legal = useMemo(() => buildLegalAiContext({ visitType, observations, actions, proposals }), [visitType, observations, actions, proposals]);

  const generateSuggestion = async () => {
    if (loading) return;
    if (!AI_WORKER_URL && Platform.OS !== 'web') {
      Alert.alert('إعداد خدمة الذكاء الاصطناعي', 'أضف EXPO_PUBLIC_AI_WORKER_URL إلى بيئة التطبيق حتى يستطيع الهاتف الوصول إلى Worker الخاص بـ Gemini.');
      return;
    }

    setLoading(true);
    setResult('');
    setSuggested(null);

    try {
      const endpoint = `${AI_WORKER_URL || ''}/api/ai/visit-draft`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName,
          visitDate,
          visitType,
          observations,
          actions,
          proposals,
          followUp,
          history: context.history.contextText,
          legalReferences: legal.references,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'تعذر الاتصال بخدمة الذكاء الاصطناعي.');

      const ai = data.result || {};
      const draft: VisitAiDraft = {
        schoolName: schoolName.trim() || 'المدرسة',
        visitDate: ai.visitDate || visitDate || new Date().toISOString().slice(0, 10),
        visitType: ai.visitType || visitType,
        observations: typeof ai.observations === 'string' ? ai.observations.trim() : '',
        actions: typeof ai.actions === 'string' ? ai.actions.trim() : '',
        proposals: typeof ai.proposals === 'string' ? ai.proposals.trim() : '',
        followUp: typeof ai.followUp === 'string' ? ai.followUp.trim() : '',
      };

      setSuggested(draft);
      setResult([
        'صياغة زيارة إشرافية مقترحة من Gemini',
        `المدرسة: ${draft.schoolName}`,
        `التاريخ: ${draft.visitDate}`,
        `نوع الزيارة: ${draft.visitType}`,
        '',
        'الملاحظات والمشاهدات', draft.observations || 'لم تُنتج صياغة لهذا الحقل.',
        '',
        'الإجراءات المتخذة فعليًا', draft.actions || 'لم تُنتج صياغة لهذا الحقل.',
        '',
        'المقترحات والتوصيات', draft.proposals || 'لم تُنتج صياغة لهذا الحقل.',
        '',
        'المتابعة المقترحة', draft.followUp || 'لم تُنتج صياغة لهذا الحقل.',
        '',
        context.history.recentVisits.length > 0
          ? 'تم استخدام السجل السابق لفهم الاستمرارية المهنية فقط، دون استنتاج شخصية المشرف أو افتراض تنفيذ توصيات سابقة.'
          : 'لا توجد زيارات سابقة كافية لبناء سياق تراكمي؛ اعتمدت الصياغة على المعطيات الحالية.',
        '',
        legal.candidates.length ? `المراجع التشريعية المرشحة: ${legal.references}` : 'المراجع التشريعية: لا يوجد سند موثق مرتبط بشكل كافٍ بالمعطيات الحالية.',
        '',
        'تنبيه: هذه مسودة مساعدة للمراجعة وليست اعتمادًا نهائيًا أو رأيًا قانونيًا ملزمًا.',
      ].join('\n'));
    } catch (error) {
      Alert.alert('تعذر إنشاء المقترح', error instanceof Error ? error.message : 'حدث خطأ غير متوقع.');
    } finally {
      setLoading(false);
    }
  };

  const useInVisitForm = async () => {
    if (!suggested) return;
    await AsyncStorage.setItem(VISIT_AI_DRAFT_KEY, JSON.stringify(suggested));
    router.push('/visit-form');
  };

  const clearForm = () => {
    setSchoolName('');
    setVisitDate(new Date().toISOString().slice(0, 10));
    setVisitType(visitTypes[0]);
    setObservations(''); setActions(''); setProposals(''); setFollowUp(''); setResult(''); setSuggested(null);
  };

  return <>
    <Stack.Screen options={{ title: 'مساعد صياغة الزيارة', headerShown: false }} />
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable style={styles.back} onPress={() => router.back()}><Text style={styles.backText}>رجوع</Text></Pressable>
          <View style={{ flex: 1 }}><Text style={styles.kicker}>✦ المساعد الذكي · Gemini</Text><Text style={styles.title}>مساعد صياغة الزيارة</Text><Text style={styles.subtitle}>صياغة مبنية على الزيارة الحالية والسجل المهني السابق والمرجع التشريعي الموثق.</Text></View>
        </View>
        <View style={styles.info}>
          <Text style={styles.infoTitle}>السياق المهني متصل</Text>
          <Text style={styles.infoText}>الزيارات المسجلة: {visits.length} · المكتملة: {context.history.completedVisits} · المؤجلة: {context.history.postponedVisits}</Text>
          <Text style={styles.infoText}>المراجع التشريعية المرشحة: {legal.candidates.length}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.section}>بيانات الزيارة</Text>
          <Text style={styles.label}>المدرسة</Text>
          <TextInput value={schoolName} onChangeText={setSchoolName} placeholder={schools[0]?.name || 'اسم المدرسة'} placeholderTextColor="#8aa0a8" style={styles.input} textAlign="right" />
          <Text style={styles.label}>تاريخ الزيارة</Text>
          <TextInput value={visitDate} onChangeText={setVisitDate} placeholder="2026-09-02" placeholderTextColor="#8aa0a8" style={styles.input} textAlign="right" />
          <Text style={styles.label}>نوع الزيارة</Text>
          <View style={styles.types}>{visitTypes.slice(0, 6).map(type => <Pressable key={type} onPress={() => setVisitType(type)} style={[styles.type, visitType === type && styles.typeActive]}><Text style={[styles.typeText, visitType === type && styles.typeTextActive]}>{type}</Text></Pressable>)}</View>
        </View>
        <View style={styles.card}>
          <Text style={styles.section}>معطيات الزيارة</Text>
          <Field label="الملاحظات والمشاهدات" value={observations} onChange={setObservations} placeholder="ما الذي شاهده المشرف؟" />
          <Field label="الإجراءات المتخذة فعليًا" value={actions} onChange={setActions} placeholder="ما تم اتخاذه فعليًا أثناء الزيارة" />
          <Field label="المقترحات والتوصيات" value={proposals} onChange={setProposals} placeholder="ما يقترحه المشرف للمتابعة والمعالجة" />
          <Field label="المتابعة المقترحة" value={followUp} onChange={setFollowUp} placeholder="ما الذي ينبغي متابعته لاحقًا؟" />
          <Pressable style={[styles.generate, loading && styles.disabled]} onPress={generateSuggestion} disabled={loading}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.generateText}>✦ إنشاء صياغة واعية بالسجل</Text>}</Pressable>
          <Pressable style={styles.clear} onPress={clearForm}><Text style={styles.clearText}>مسح البيانات</Text></Pressable>
        </View>
        {result ? <View style={styles.result}><View style={styles.resultHead}><Text style={styles.resultTitle}>الصياغة المقترحة</Text><Text style={styles.badge}>AI</Text></View><Text style={styles.resultText}>{result}</Text><Text style={styles.editHint}>المقترح لا يُحفظ تلقائيًا. عند استخدامه في نموذج الزيارة يستطيع المشرف تعديل أي حقل أو حذف محتواه قبل الحفظ.</Text><Pressable style={styles.use} onPress={useInVisitForm}><Text style={styles.useText}>استخدامها في نموذج الزيارة</Text></Pressable></View> : null}
        <View style={styles.notice}><Text style={styles.noticeTitle}>مهم</Text><Text style={styles.noticeText}>لا يستنتج النظام شخصية المشرف. يستخدم السجل لفهم الاستمرارية المهنية فقط، ولا يفترض تنفيذ توصية سابقة إلا إذا أثبتها السجل.</Text></View>
      </ScrollView>
    </KeyboardAvoidingView>
  </>;
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return <><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="#8aa0a8" style={[styles.input, styles.area]} multiline textAlign="right" textAlignVertical="top" /></>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f9fc' }, content: { padding: 18, paddingBottom: 44 }, header: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, marginBottom: 16 }, back: { paddingHorizontal: 14, height: 40, borderRadius: 12, backgroundColor: '#dff2fa', justifyContent: 'center' }, backText: { color: '#17617a', fontWeight: '800' }, kicker: { color: '#2381a0', fontWeight: '800', textAlign: 'right' }, title: { color: '#123f4b', fontSize: 25, fontWeight: '900', textAlign: 'right', marginTop: 2 }, subtitle: { color: '#6d838c', fontSize: 13, lineHeight: 20, textAlign: 'right', marginTop: 5 }, info: { backgroundColor: '#e1f4fb', borderWidth: 1, borderColor: '#c7e8f3', borderRadius: 16, padding: 15, marginBottom: 14 }, infoTitle: { color: '#16627b', fontSize: 16, fontWeight: '900', textAlign: 'right' }, infoText: { color: '#58747e', fontSize: 13, textAlign: 'right', marginTop: 5 }, card: { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#deeaee' }, section: { color: '#164b5b', fontSize: 18, fontWeight: '900', textAlign: 'right', marginBottom: 12 }, label: { color: '#345b66', fontSize: 14, fontWeight: '800', textAlign: 'right', marginTop: 10, marginBottom: 6 }, input: { minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: '#d6e4e9', backgroundColor: '#fbfdfe', paddingHorizontal: 13, color: '#183f49', fontSize: 14 }, area: { minHeight: 86, paddingTop: 12 }, types: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 7 }, type: { paddingHorizontal: 10, paddingVertical: 9, borderRadius: 11, backgroundColor: '#eef5f7' }, typeActive: { backgroundColor: '#d9f1fa', borderWidth: 1, borderColor: '#a9dcec' }, typeText: { color: '#59717a', fontSize: 12, fontWeight: '700' }, typeTextActive: { color: '#17617a' }, generate: { marginTop: 18, height: 52, borderRadius: 14, backgroundColor: '#2381a0', justifyContent: 'center', alignItems: 'center' }, disabled: { opacity: .65 }, generateText: { color: '#fff', fontWeight: '900', fontSize: 15 }, clear: { alignItems: 'center', padding: 13 }, clearText: { color: '#71858c', fontWeight: '700' }, result: { backgroundColor: '#fff', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#bfe1ec', marginBottom: 14 }, resultHead: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }, resultTitle: { color: '#164b5b', fontSize: 18, fontWeight: '900' }, badge: { color: '#fff', backgroundColor: '#2381a0', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, fontWeight: '900' }, resultText: { color: '#294e58', fontSize: 14, lineHeight: 24, textAlign: 'right' }, editHint: { color: '#6b8087', fontSize: 12, lineHeight: 19, textAlign: 'right', marginTop: 10 }, use: { marginTop: 16, height: 48, borderRadius: 13, backgroundColor: '#e1f4fb', justifyContent: 'center', alignItems: 'center' }, useText: { color: '#17617a', fontWeight: '900' }, notice: { padding: 15, borderRadius: 15, backgroundColor: '#f7fbfc', borderWidth: 1, borderColor: '#e2ecef' }, noticeTitle: { color: '#476a73', fontWeight: '900', textAlign: 'right' }, noticeText: { color: '#6b8087', fontSize: 12, lineHeight: 20, textAlign: 'right', marginTop: 5 },
});
