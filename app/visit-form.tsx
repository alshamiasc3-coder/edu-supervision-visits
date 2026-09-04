import React, { useEffect, useMemo, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useStore } from '@/context/AppContext';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { ZoomableImage } from '@/components/ZoomableImage';

const asString = (v?: string | string[] | null) => Array.isArray(v) ? v[0] ?? '' : v?.toString() ?? '';

function extractSection(text: string, headings: string[]) {
  const source = String(text || '');
  for (const heading of headings) {
    const marker = `${heading}:`;
    const start = source.indexOf(marker);
    if (start >= 0) {
      const rest = source.slice(start + marker.length);
      const next = rest.search(/\n\n(?:الإجراءات المتخذة فعليًا|الإجراءات|التوصيات|التوصيات والإجراءات المقترحة|المتابعة|خطة المتابعة):/);
      return (next >= 0 ? rest.slice(0, next) : rest).trim();
    }
  }
  return '';
}

function parseVisitSections(text: string) {
  return {
    actions: extractSection(text, ['الإجراءات المتخذة فعليًا', 'الإجراءات']),
    recommendations: extractSection(text, ['التوصيات', 'التوصيات والإجراءات المقترحة']),
    followUp: extractSection(text, ['المتابعة', 'خطة المتابعة']),
  };
}

function buildStructuredVisit(actions: string, recommendations: string, followUp: string) {
  return [
    ['الإجراءات المتخذة فعليًا', actions],
    ['التوصيات', recommendations],
    ['المتابعة', followUp],
  ]
    .filter(([, value]) => String(value || '').trim())
    .map(([heading, value]) => `${heading}:\n${String(value).trim()}`)
    .join('\n\n');
}

export default function VisitForm() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { schools, visits, addVisit, updateVisit } = useStore();
  const params = useLocalSearchParams<{
    visitId?: string;
    schoolId?: string;
    date?: string;
    type?: string;
    visitType?: string;
    aiActions?: string;
    aiRecommendations?: string;
    aiFollowUp?: string;
  }>();
  const isEditMode = Boolean(params.visitId);
  const [schoolId, setSchoolId] = useState(asString(params.schoolId) || schools?.[0]?.id || '');
  const [date, setDate] = useState(asString(params.date) || new Date().toISOString().slice(0, 10));
  const [type, setType] = useState(asString(params.type || params.visitType));
  const [actions, setActions] = useState(asString(params.aiActions));
  const [recommendations, setRecommendations] = useState(asString(params.aiRecommendations));
  const [followUp, setFollowUp] = useState(asString(params.aiFollowUp));
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success' | ''>('');

  const existingVisit = useMemo(() => params.visitId ? visits.find(v => v.id === String(params.visitId)) : undefined, [params.visitId, visits]);
  const selectedSchool = useMemo(() => schools.find(s => s.id === schoolId), [schools, schoolId]);

  useEffect(() => {
    if (!existingVisit) return;
    setSchoolId(String(existingVisit.schoolId));
    setDate(String(existingVisit.date));
    setType(String(existingVisit.type || ''));
    const parsed = parseVisitSections(String(existingVisit.actions || ''));
    setActions(parsed.actions || String(existingVisit.actions || ''));
    setRecommendations(parsed.recommendations || String((existingVisit as any).recommendations || ''));
    setFollowUp(parsed.followUp || String((existingVisit as any).followUp || ''));
    const photos = Array.isArray((existingVisit as any).photoUris) ? (existingVisit as any).photoUris.filter(Boolean).map(String) : [];
    if (existingVisit.photoUri && !photos.includes(existingVisit.photoUri)) photos.unshift(existingVisit.photoUri);
    setPhotoUris(photos);
  }, [existingVisit]);

  useEffect(() => {
    if (params.aiActions !== undefined) setActions(asString(params.aiActions));
    if (params.aiRecommendations !== undefined) setRecommendations(asString(params.aiRecommendations));
    if (params.aiFollowUp !== undefined) setFollowUp(asString(params.aiFollowUp));
    if (params.type !== undefined || params.visitType !== undefined) setType(asString(params.type || params.visitType));
  }, [params.aiActions, params.aiRecommendations, params.aiFollowUp, params.type, params.visitType]);

  const clearError = () => {
    if (messageType === 'error') { setMessage(''); setMessageType(''); }
  };

  const addPhotos = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) { setMessage('يرجى السماح للتطبيق بالوصول إلى الصور.'); setMessageType('error'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsMultipleSelection: true, selectionLimit: 20 });
      if (!result.canceled && result.assets?.length) { setPhotoUris(old => Array.from(new Set([...old, ...result.assets.map(a => a.uri)]))); clearError(); }
    } catch (e) { console.error(e); setMessage('تعذر اختيار الصور.'); setMessageType('error'); }
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) { setMessage('يرجى السماح للتطبيق باستخدام الكاميرا.'); setMessageType('error'); return; }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true });
      if (!result.canceled && result.assets?.[0]?.uri) { setPhotoUris(old => Array.from(new Set([...old, result.assets[0].uri]))); clearError(); }
    } catch (e) { console.error(e); setMessage('تعذر فتح الكاميرا. حاول مرة أخرى.'); setMessageType('error'); }
  };

  const openAI = () => {
    if (!schoolId) { setMessage('يرجى اختيار المدرسة أولًا.'); setMessageType('error'); return; }
    if (!photoUris[0]) { setMessage('يرجى تصوير أو اختيار صورة سجل الزيارة أولًا حتى يتمكن المساعد من قراءتها.'); setMessageType('error'); return; }
    router.push({ pathname: '/visit-ai', params: {
      visitId: asString(params.visitId), schoolId: String(schoolId), schoolName: selectedSchool?.name || '',
      visitType: String(type || ''), type: String(type || ''), date: String(date), photoUri: photoUris[0],
    }});
  };

  const saveVisit = async () => {
    if (saving) return;
    setMessage(''); setMessageType('');
    if (!schoolId) { setMessage('يرجى اختيار المدرسة أولًا.'); setMessageType('error'); return; }
    if (!date.trim()) { setMessage('يرجى إدخال تاريخ الزيارة.'); setMessageType('error'); return; }
    if (!type.trim()) { setMessage('يرجى استخدام المساعد الذكي لإعداد نوع الزيارة والمسودة أولًا.'); setMessageType('error'); return; }
    if (!actions.trim()) { setMessage('يرجى إنشاء مسودة الزيارة واعتمادها قبل الحفظ.'); setMessageType('error'); return; }
    try {
      setSaving(true);
      const structured = buildStructuredVisit(actions, recommendations, followUp);
      const visitData: any = { schoolId: String(schoolId), date: date.trim(), type: type.trim(), actions: structured, recommendations: recommendations.trim(), followUp: followUp.trim(), status: existingVisit?.status || 'completed', photoUri: photoUris[0], photoUris };
      if (isEditMode && params.visitId) await Promise.resolve(updateVisit(String(params.visitId), visitData)); else await Promise.resolve(addVisit(visitData));
      setMessage(isEditMode ? 'تم تعديل الزيارة وحفظ التغييرات بنجاح.' : 'تم حفظ الزيارة بنجاح.'); setMessageType('success');
      setTimeout(() => router.back(), 700);
    } catch (e) { console.error(e); setMessage('حدث خطأ أثناء حفظ الزيارة.'); setMessageType('error'); }
    finally { setSaving(false); }
  };

  const outputField = (label: string, value: string, placeholder: string) => (
    <View style={styles.outputBlock}><Text style={[styles.label, { color: c.foreground }]}>{label}</Text><View style={[styles.outputBox, { backgroundColor: c.card, borderColor: c.border }]}><Text style={[styles.outputText, { color: value ? c.foreground : c.mutedForeground }]}>{value || placeholder}</Text></View></View>
  );

  return (
    <View style={[styles.page, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: c.border }]}>
        <Pressable onPress={() => router.back()} style={styles.back}><Feather name="arrow-right" size={23} color={c.foreground} /></Pressable>
        <Text style={[styles.title, { color: c.foreground }]}>{isEditMode ? 'تعديل الزيارة' : 'تسجيل زيارة'}</Text><View style={{ width: 36 }} />
      </View>
      <KeyboardAwareScrollViewCompat showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: insets.bottom + 40 }}>
        <Text style={[styles.label, { color: c.foreground }]}>المدرسة</Text>
        <View style={styles.wrap}>{schools.map(s => <Pressable key={s.id} onPress={() => { setSchoolId(s.id); clearError(); }} style={[styles.chip, { backgroundColor: schoolId === s.id ? c.primary : c.card, borderColor: schoolId === s.id ? c.primary : c.border }]}><Text style={{ color: schoolId === s.id ? c.primaryForeground : c.foreground, fontFamily: 'Inter_500Medium', fontSize: 11 }}>{s.name}</Text></Pressable>)}</View>
        {selectedSchool ? <Text style={[styles.selected, { color: c.mutedForeground }]}>المدرسة المحددة: {selectedSchool.name}</Text> : null}
        <Text style={[styles.label, { color: c.foreground }]}>تاريخ الزيارة</Text>
        <TextInput value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={c.mutedForeground} textAlign="right" style={[styles.input, { backgroundColor: c.card, borderColor: c.border, color: c.foreground }]} />
        {type ? <View style={[styles.typeCard, { backgroundColor: c.secondary, borderColor: c.border }]}><Text style={[styles.smallLabel, { color: c.mutedForeground }]}>نوع الزيارة</Text><Text style={[styles.typeValue, { color: c.foreground }]}>{type}</Text><Text style={[styles.typeHint, { color: c.mutedForeground }]}>تم تحديده وإعداده من خلال المساعد الذكي.</Text></View> : null}
        <View style={[styles.aiCard, { backgroundColor: c.navy }]}><View style={[styles.aiIcon, { backgroundColor: c.accent }]}><Feather name="cpu" size={21} color={c.navy} /></View><View style={{ flex: 1 }}><Text style={styles.aiTitle}>المساعد الذكي للزيارة</Text><Text style={styles.aiSub}>أنشئ المسودة أولًا، ثم ستُنقل الإجراءات والتوصيات والمتابعة إلى هذه الصفحة بعد اعتمادها.</Text></View><Pressable onPress={openAI} style={[styles.aiButton, { backgroundColor: c.primary }]}><Text style={[styles.aiButtonText, { color: c.primaryForeground }]}>فتح المساعد</Text></Pressable></View>
        {outputField('الإجراءات المتخذة فعليًا', actions, 'سيتم تعبئتها من المسودة المعتمدة في المساعد.')}
        {outputField('التوصيات', recommendations, 'سيتم تعبئتها من المسودة المعتمدة في المساعد.')}
        {outputField('المتابعة', followUp, 'سيتم تعبئتها من المسودة المعتمدة في المساعد.')}
        <View style={[styles.photoCard, { backgroundColor: c.card, borderColor: c.border }]}><Text style={[styles.label, { color: c.foreground, marginTop: 0 }]}>صور سجل الزيارة</Text><Text style={[styles.photoHint, { color: c.mutedForeground }]}>التصوير يبقى هنا في صفحة الزيارة، وليس داخل المساعد الذكي.</Text><View style={styles.photoActions}><Pressable onPress={takePhoto} style={[styles.photoButton, { backgroundColor: c.secondary, borderColor: c.border }]}><Feather name="camera" size={19} color={c.primary} /><Text style={[styles.photoButtonText, { color: c.foreground }]}>تصوير</Text></Pressable><Pressable onPress={addPhotos} style={[styles.photoButton, { backgroundColor: c.secondary, borderColor: c.border }]}><Feather name="image" size={19} color={c.primary} /><Text style={[styles.photoButtonText, { color: c.foreground }]}>اختيار صور</Text></Pressable></View>{photoUris.length > 0 ? <View style={styles.gallery}>{photoUris.map((uri, i) => <View key={`${uri}-${i}`} style={styles.thumbWrap}><Pressable onPress={() => setPreviewUri(uri)} style={styles.thumbPressable}><Image source={{ uri }} style={styles.thumb} /></Pressable><Pressable onPress={() => setPhotoUris(old => old.filter((_, x) => x !== i))} style={styles.deleteThumb}><Feather name="x" size={14} color="#FFF" /></Pressable></View>)}</View> : <Text style={[styles.photoHint, { color: c.mutedForeground }]}>يمكن إرفاق أكثر من صورة للزيارة.</Text>}</View>
        {message ? <View style={[styles.message, { backgroundColor: messageType === 'success' ? '#E8F7F3' : '#FEECEC' }]}><Feather name={messageType === 'success' ? 'check-circle' : 'alert-circle'} size={18} color={messageType === 'success' ? c.primary : '#B42318'} /><Text style={{ color: messageType === 'success' ? c.primary : '#B42318', fontFamily: 'Inter_600SemiBold', fontSize: 11, flex: 1 }}>{message}</Text></View> : null}
        <Pressable onPress={saveVisit} disabled={saving} style={[styles.save, { backgroundColor: c.primary, opacity: saving ? 0.55 : 1 }]}><Feather name="check-circle" size={20} color={c.primaryForeground} /><Text style={{ color: c.primaryForeground, fontFamily: 'Inter_700Bold', fontSize: 13 }}>{saving ? 'جارٍ الحفظ...' : isEditMode ? 'حفظ التعديلات' : 'حفظ الزيارة'}</Text></Pressable>
      </KeyboardAwareScrollViewCompat>
      <Modal visible={!!previewUri} animationType="fade" transparent statusBarTranslucent onRequestClose={() => setPreviewUri(null)}><View style={styles.viewerOverlay}><Pressable style={styles.viewerClose} onPress={() => setPreviewUri(null)}><Feather name="x" size={25} color="#FFF" /></Pressable>{previewUri ? <ZoomableImage uri={previewUri} /> : null}</View></Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 }, header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 14, borderBottomWidth: 1 }, back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }, title: { fontFamily: 'Inter_700Bold', fontSize: 20 }, label: { fontFamily: 'Inter_600SemiBold', fontSize: 12, textAlign: 'right', marginTop: 15, marginBottom: 7 }, smallLabel: { fontFamily: 'Inter_500Medium', fontSize: 10, textAlign: 'right' }, input: { minHeight: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, paddingVertical: 10, fontFamily: 'Inter_500Medium', fontSize: 12 }, wrap: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 }, chip: { borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 10 }, selected: { fontFamily: 'Inter_400Regular', fontSize: 10, textAlign: 'right', marginTop: 7 }, typeCard: { borderWidth: 1, borderRadius: 15, padding: 13, marginTop: 14 }, typeValue: { fontFamily: 'Inter_700Bold', fontSize: 13, textAlign: 'right', marginTop: 5 }, typeHint: { fontFamily: 'Inter_400Regular', fontSize: 9, textAlign: 'right', marginTop: 4 }, aiCard: { borderRadius: 17, padding: 13, marginTop: 14, flexDirection: 'row-reverse', alignItems: 'center', gap: 9 }, aiIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, aiTitle: { color: '#FFF', fontFamily: 'Inter_700Bold', fontSize: 13, textAlign: 'right' }, aiSub: { color: '#FFF', opacity: 0.82, fontFamily: 'Inter_400Regular', fontSize: 9, lineHeight: 16, textAlign: 'right', marginTop: 3 }, aiButton: { borderRadius: 11, paddingHorizontal: 11, paddingVertical: 10 }, aiButtonText: { fontFamily: 'Inter_700Bold', fontSize: 10 }, outputBlock: { marginTop: 2 }, outputBox: { minHeight: 86, borderWidth: 1, borderRadius: 13, padding: 12 }, outputText: { fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 20, textAlign: 'right' }, photoCard: { borderWidth: 1, borderRadius: 17, padding: 13, marginTop: 14 }, photoHint: { fontFamily: 'Inter_400Regular', fontSize: 9, lineHeight: 16, textAlign: 'right', marginTop: 5 }, photoActions: { flexDirection: 'row-reverse', gap: 8, marginTop: 11 }, photoButton: { flex: 1, minHeight: 46, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row-reverse', gap: 7 }, photoButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 10 }, gallery: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginTop: 11 }, thumbWrap: { width: 78, height: 78, borderRadius: 11, overflow: 'visible', position: 'relative' }, thumbPressable: { width: 78, height: 78, borderRadius: 11, overflow: 'hidden' }, thumb: { width: '100%', height: '100%' }, deleteThumb: { position: 'absolute', top: -6, left: -6, width: 23, height: 23, borderRadius: 12, backgroundColor: '#B42318', alignItems: 'center', justifyContent: 'center' }, message: { borderRadius: 13, padding: 11, flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 7, marginTop: 14 }, save: { minHeight: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row-reverse', gap: 8, marginTop: 14 }, viewerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.94)', justifyContent: 'center' }, viewerClose: { position: 'absolute', top: 45, right: 18, zIndex: 10, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
});