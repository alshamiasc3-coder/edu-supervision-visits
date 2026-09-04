import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useStore } from '@/context/AppContext';

const AI_URL = 'https://edu-supervision-ai-worker.alshamiasc3-coder.workers.dev';
const asString = (v?: string | string[] | null) => Array.isArray(v) ? v[0] ?? '' : v?.toString() ?? '';

async function uriToDataUrl(uri: string) {
  const response = await fetch(uri);
  if (!response.ok) throw new Error('تعذر قراءة صورة السجل.');
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const value = String(reader.result || '');
      if (!value.startsWith('data:')) reject(new Error('صيغة الصورة غير صالحة.'));
      else resolve(value);
    };
    reader.onerror = () => reject(new Error('تعذر تحويل الصورة.'));
    reader.readAsDataURL(blob);
  });
}

export default function VisitAI() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { visits } = useStore();
  const params = useLocalSearchParams<{ visitId?: string; schoolId?: string; schoolName?: string; visitType?: string; type?: string; date?: string; photoUri?: string }>();
  const schoolId = asString(params.schoolId);
  const schoolName = asString(params.schoolName) || 'المدرسة';
  const photoUri = asString(params.photoUri);
  const [visitType, setVisitType] = useState(asString(params.visitType || params.type));
  const [briefContext, setBriefContext] = useState('');
  const [actions, setActions] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [draftReady, setDraftReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);

  const previousVisits = useMemo(() => visits
    .filter(v => v.schoolId === schoolId && v.id !== asString(params.visitId))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8), [visits, schoolId, params.visitId]);

  const createDraft = async () => {
    if (!visitType.trim()) { setMessage('اكتب نوع الزيارة أولًا.'); setError(true); return; }
    if (!photoUri) { setMessage('أضف صورة سجل الزيارة من صفحة الزيارة أولًا.'); setError(true); return; }
    try {
      setLoading(true); setMessage(''); setError(false); setDraftReady(false);
      const registerImage = await uriToDataUrl(photoUri);
      const response = await fetch(`${AI_URL}/api/ai/visit-draft-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName,
          visitType: visitType.trim(),
          briefContext: briefContext.trim(),
          registerImage,
          previousVisits: previousVisits.map(v => ({ date: v.date, type: v.type, actions: v.actions })),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'تعذر إنشاء المسودة.');
      setVisitType(String(data.result?.visitType || visitType));
      setActions(String(data.result?.actions || ''));
      setRecommendations(String(data.result?.recommendations || ''));
      setFollowUp(String(data.result?.followUp || ''));
      setDraftReady(true);
      setMessage('تم إعداد المسودة. راجعها وعدّلها قبل اعتمادها.');
    } catch (e: any) {
      console.error(e);
      setMessage(e?.message || 'تعذر الاتصال بالمساعد الذكي.');
      setError(true);
    } finally { setLoading(false); }
  };

  const approveDraft = () => {
    if (!actions.trim()) { setMessage('لا يمكن اعتماد مسودة بلا إجراءات واضحة.'); setError(true); return; }
    router.replace({ pathname: '/visit-form', params: {
      visitId: asString(params.visitId), schoolId, date: asString(params.date),
      type: visitType.trim(), visitType: visitType.trim(),
      aiActions: actions.trim(), aiRecommendations: recommendations.trim(), aiFollowUp: followUp.trim(),
    }});
  };

  return (
    <View style={[styles.page, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10, borderBottomColor: c.border }]}>
        <Pressable onPress={() => router.back()} style={styles.back}><Feather name="arrow-right" size={23} color={c.foreground} /></Pressable>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: c.foreground }]}>المساعد الذكي للزيارة</Text>
          <Text style={[styles.subtitle, { color: c.mutedForeground }]}>يقرأ السجل ثم يكتب مسودة للمراجعة</Text>
        </View>
        <View style={[styles.iconBox, { backgroundColor: c.secondary }]}><Feather name="cpu" size={22} color={c.primary} /></View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 15, paddingBottom: insets.bottom + 35 }}>
        <View style={[styles.infoCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.infoLabel, { color: c.mutedForeground }]}>المدرسة</Text>
          <Text style={[styles.infoValue, { color: c.foreground }]}>{schoolName}</Text>
          <View style={styles.photoStatus}>
            <Feather name={photoUri ? 'check-circle' : 'alert-circle'} size={16} color={photoUri ? c.primary : c.mutedForeground} />
            <Text style={[styles.photoStatusText, { color: photoUri ? c.primary : c.mutedForeground }]}>{photoUri ? 'صورة سجل الزيارة جاهزة للقراءة' : 'لا توجد صورة سجل مرفقة'}</Text>
          </View>
        </View>

        <View style={[styles.notice, { backgroundColor: c.secondary }]}>
          <Feather name="shield" size={19} color={c.primary} />
          <Text style={[styles.noticeText, { color: c.secondaryForeground }]}>الصورة الحالية هي المصدر الأساسي للإجراءات الفعلية. الزيارات السابقة تُستخدم للسياق والاستمرارية والمصطلحات فقط، ولا تُنقل منها إجراءات إلى الزيارة الحالية.</Text>
        </View>

        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>نوع الزيارة</Text>
          <TextInput value={visitType} onChangeText={setVisitType} placeholder="مثال: زيارة متابعة فنية" placeholderTextColor={c.mutedForeground} style={[styles.input, { color: c.foreground, borderColor: c.border, backgroundColor: c.background }]} textAlign="right" />
        </View>

        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>محاور أو معلومات مختصرة <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10 }}>(اختياري)</Text></Text>
          <Text style={[styles.helper, { color: c.mutedForeground }]}>رؤوس أقلام فقط إذا كان هناك أمر محدد تريد من المساعد مراعاته.</Text>
          <TextInput value={briefContext} onChangeText={setBriefContext} placeholder="مثال: متابعة تنفيذ الخطة" placeholderTextColor={c.mutedForeground} style={[styles.textArea, { color: c.foreground, borderColor: c.border, backgroundColor: c.background }]} textAlign="right" textAlignVertical="top" multiline />
        </View>

        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={styles.sectionRow}><Text style={[styles.sectionTitle, { color: c.foreground }]}>سياق الزيارات السابقة</Text><Text style={[styles.count, { color: c.mutedForeground }]}>{previousVisits.length}</Text></View>
          <Text style={[styles.helper, { color: c.mutedForeground }]}>سيستخدمها المساعد للاستمرارية المهنية والأسلوب الظاهر في السجلات، دون استنتاجات نفسية.</Text>
          {previousVisits.slice(0, 3).map(v => <View key={v.id} style={[styles.historyItem, { borderTopColor: c.border }]}><Text style={[styles.historyType, { color: c.primary }]}>{v.type} · {v.date}</Text><Text style={[styles.historyText, { color: c.foreground }]} numberOfLines={3}>{v.actions || 'لا توجد تفاصيل محفوظة'}</Text></View>)}
        </View>

        {draftReady ? <>
          <Text style={[styles.reviewTitle, { color: c.foreground }]}>مراجعة المسودة قبل الاعتماد</Text>
          {[
            ['نوع الزيارة', visitType, setVisitType],
            ['الإجراءات المتخذة فعليًا', actions, setActions],
            ['التوصيات', recommendations, setRecommendations],
            ['المتابعة', followUp, setFollowUp],
          ].map(([label, value, setter]) => <View key={String(label)} style={styles.outputBlock}><Text style={[styles.label, { color: c.foreground }]}>{String(label)}</Text><TextInput value={String(value)} onChangeText={setter as any} multiline textAlign="right" textAlignVertical="top" style={[styles.reviewInput, { color: c.foreground, borderColor: c.border, backgroundColor: c.card }]} /></View>)}
        </> : null}

        {message ? <View style={[styles.message, { backgroundColor: error ? c.destructive : c.secondary }]}><Feather name={error ? 'alert-circle' : 'check-circle'} size={17} color={error ? '#FFF' : c.primary} /><Text style={[styles.messageText, { color: error ? '#FFF' : c.foreground }]}>{message}</Text></View> : null}

        <Pressable onPress={createDraft} disabled={loading} style={[styles.analyze, { backgroundColor: c.navy, opacity: loading ? 0.7 : 1 }]}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Feather name="zap" size={20} color={c.accent} />}
          <Text style={styles.analyzeText}>{loading ? 'جاري قراءة السجل وإعداد المسودة...' : draftReady ? 'إعادة إنشاء المسودة' : 'قراءة السجل وإنشاء المسودة'}</Text>
        </Pressable>

        {draftReady ? <Pressable onPress={approveDraft} style={[styles.approve, { backgroundColor: c.primary }]}><Feather name="check" size={20} color={c.primaryForeground} /><Text style={[styles.approveText, { color: c.primaryForeground }]}>اعتماد المسودة ونقلها إلى الزيارة</Text></Pressable> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 }, header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 14, borderBottomWidth: 1 }, back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }, headerText: { flex: 1, alignItems: 'flex-end' }, title: { fontFamily: 'Inter_700Bold', fontSize: 20, textAlign: 'right' }, subtitle: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 3, textAlign: 'right' }, iconBox: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, infoCard: { borderWidth: 1, borderRadius: 17, padding: 14, marginBottom: 12 }, infoLabel: { fontFamily: 'Inter_500Medium', fontSize: 10, textAlign: 'right' }, infoValue: { fontFamily: 'Inter_700Bold', fontSize: 13, textAlign: 'right', marginTop: 5 }, photoStatus: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7, marginTop: 10 }, photoStatusText: { fontFamily: 'Inter_500Medium', fontSize: 10, textAlign: 'right' }, notice: { borderRadius: 15, padding: 13, flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 9, marginBottom: 12 }, noticeText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 19, textAlign: 'right' }, card: { borderWidth: 1, borderRadius: 17, padding: 14, marginBottom: 12 }, sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 15, textAlign: 'right' }, helper: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 18, textAlign: 'right', marginTop: 6 }, input: { minHeight: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, paddingVertical: 10, marginTop: 12, fontFamily: 'Inter_500Medium', fontSize: 12 }, textArea: { minHeight: 85, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, paddingVertical: 12, marginTop: 10, fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 21 }, sectionRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' }, count: { fontFamily: 'Inter_700Bold', fontSize: 12 }, historyItem: { paddingTop: 10, marginTop: 10, borderTopWidth: 1 }, historyType: { fontFamily: 'Inter_600SemiBold', fontSize: 10, textAlign: 'right' }, historyText: { fontFamily: 'Inter_500Medium', fontSize: 10, lineHeight: 17, textAlign: 'right', marginTop: 4 }, reviewTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, textAlign: 'right', marginBottom: 10 }, outputBlock: { marginBottom: 12 }, label: { fontFamily: 'Inter_700Bold', fontSize: 13, textAlign: 'right', marginBottom: 7 }, reviewInput: { minHeight: 95, borderWidth: 1, borderRadius: 14, padding: 12, fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 21 }, message: { borderRadius: 13, padding: 11, flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 7, marginBottom: 12 }, messageText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 10, lineHeight: 17, textAlign: 'right' }, analyze: { minHeight: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row-reverse', gap: 9 }, analyzeText: { color: '#FFF', fontFamily: 'Inter_700Bold', fontSize: 13 }, approve: { minHeight: 54, borderRadius: 16, marginTop: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row-reverse', gap: 9 }, approveText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
});