import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useStore, visitTypes } from '@/context/AppContext';

const asString = (v?: string | string[] | null) => Array.isArray(v) ? v[0] ?? '' : v?.toString() ?? '';

export default function VisitAI() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { visits } = useStore();
  const params = useLocalSearchParams<{ visitId?: string; schoolId?: string; schoolName?: string; visitType?: string; type?: string }>();
  const schoolId = asString(params.schoolId);
  const schoolName = asString(params.schoolName) || 'المدرسة';
  const visitType = asString(params.visitType || params.type) || visitTypes[0] || 'زيارة اختصاص';
  const [photoUri, setPhotoUri] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const previousVisits = useMemo(() => visits
    .filter(v => v.schoolId === schoolId && v.id !== asString(params.visitId))
    .sort((a, b) => b.date.localeCompare(a.date)), [visits, schoolId, params.visitId]);

  const takePhoto = async () => {
    try {
      setMessage('');
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) { setMessage('يرجى السماح للتطبيق باستخدام الكاميرا.'); return; }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.85, allowsEditing: false });
      if (!result.canceled && result.assets?.[0]?.uri) setPhotoUri(result.assets[0].uri);
    } catch { setMessage('تعذر فتح الكاميرا. حاول مرة أخرى.'); }
  };

  const choosePhoto = async () => {
    try {
      setMessage('');
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) { setMessage('يرجى السماح للتطبيق بالوصول إلى الصور.'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
      if (!result.canceled && result.assets?.[0]?.uri) setPhotoUri(result.assets[0].uri);
    } catch { setMessage('تعذر اختيار الصورة.'); }
  };

  const continueToAnalysis = () => {
    if (!photoUri) { setMessage('التقط صورة صفحة سجل الزيارة أولًا.'); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setMessage('تم تجهيز الصورة. الخطوة التالية ستكون ربط القراءة الذكية بالصورة والزيارات السابقة.');
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
          <Text style={[styles.subtitle, { color: c.mutedForeground }]}>قراءة سجل المدرسة وبناء مسودة الزيارة</Text>
        </View>
        <View style={[styles.iconBox, { backgroundColor: c.secondary }]}>
          <Feather name="cpu" size={22} color={c.primary} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 15, paddingBottom: insets.bottom + 35 }}>
        <View style={[styles.infoCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <Info label="المدرسة" value={schoolName} c={c} />
          <Info label="نوع الزيارة" value={visitType} c={c} />
        </View>

        <View style={[styles.notice, { backgroundColor: c.secondary }]}>
          <Feather name="info" size={19} color={c.primary} />
          <Text style={[styles.noticeText, { color: c.secondaryForeground }]}>لا حاجة لإعادة كتابة ما سجله المشرف في سجل المدرسة. التقط صورة الصفحة، وسيتولى المساعد قراءتها وربطها بالزيارات السابقة لهذه المدرسة.</Text>
        </View>

        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>صورة سجل الزيارة</Text>
          <Text style={[styles.helper, { color: c.mutedForeground }]}>يفضل تصوير الصفحة كاملة وبوضوح حتى يتمكن المساعد من قراءة الكتابة والمحتوى.</Text>
          <View style={styles.actions}>
            <Pressable onPress={takePhoto} style={[styles.actionButton, { backgroundColor: c.primary }]}>
              <Feather name="camera" size={20} color={c.primaryForeground} />
              <Text style={[styles.actionText, { color: c.primaryForeground }]}>تصوير السجل</Text>
            </Pressable>
            <Pressable onPress={choosePhoto} style={[styles.actionButton, { backgroundColor: c.secondary, borderColor: c.border, borderWidth: 1 }]}>
              <Feather name="image" size={20} color={c.primary} />
              <Text style={[styles.actionText, { color: c.foreground }]}>اختيار صورة</Text>
            </Pressable>
          </View>
          {photoUri ? <View style={styles.previewWrap}><Image source={{ uri: photoUri }} style={styles.preview} resizeMode="contain" /><Pressable onPress={() => setPhotoUri('')} style={styles.remove}><Feather name="x" size={17} color="#FFF" /></Pressable></View> : <View style={[styles.emptyPhoto, { borderColor: c.border, backgroundColor: c.background }]}><Feather name="file-text" size={34} color={c.mutedForeground} /><Text style={[styles.emptyText, { color: c.mutedForeground }]}>لم يتم اختيار صورة بعد</Text></View>}
        </View>

        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: c.foreground }]}>الزيارات السابقة للمدرسة</Text>
            <Text style={[styles.count, { color: c.mutedForeground }]}>{previousVisits.length}</Text>
          </View>
          {previousVisits.length === 0 ? <Text style={[styles.helper, { color: c.mutedForeground }]}>لا توجد زيارات سابقة محفوظة لهذه المدرسة.</Text> : previousVisits.slice(0, 5).map(v => <View key={v.id} style={[styles.historyItem, { borderTopColor: c.border }]}><View style={[styles.date, { backgroundColor: c.secondary }]}><Text style={[styles.dateText, { color: c.primary }]}>{v.date.slice(-2)}</Text></View><View style={{ flex: 1 }}><Text style={[styles.historyType, { color: c.primary }]}>{v.type}</Text><Text style={[styles.historyText, { color: c.foreground }]} numberOfLines={3}>{v.actions || 'لا توجد إجراءات محفوظة'}</Text>{v.recommendations ? <Text style={[styles.historySub, { color: c.mutedForeground }]} numberOfLines={2}>التوصيات: {v.recommendations}</Text> : null}</View></View>)}
        </View>

        {message ? <View style={[styles.message, { backgroundColor: c.secondary }]}><Feather name="info" size={17} color={c.primary} /><Text style={[styles.messageText, { color: c.foreground }]}>{message}</Text></View> : null}

        <Pressable onPress={continueToAnalysis} disabled={loading} style={[styles.analyze, { backgroundColor: c.navy, opacity: loading ? 0.7 : 1 }]}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Feather name="zap" size={20} color={c.accent} />}
          <Text style={styles.analyzeText}>{loading ? 'جاري التجهيز...' : 'قراءة السجل وإعداد المسودة'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Info({ label, value, c }: any) { return <View style={styles.infoRow}><Text style={[styles.infoLabel, { color: c.mutedForeground }]}>{label}</Text><Text style={[styles.infoValue, { color: c.foreground }]}>{value}</Text></View>; }

const styles = StyleSheet.create({
  page: { flex: 1 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 14, borderBottomWidth: 1 },
  back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, alignItems: 'flex-end' },
  title: { fontFamily: 'Inter_700Bold', fontSize: 20, textAlign: 'right' },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 3, textAlign: 'right' },
  iconBox: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  infoCard: { borderWidth: 1, borderRadius: 17, padding: 14, marginBottom: 12 },
  infoRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7, gap: 12 },
  infoLabel: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  infoValue: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 12, textAlign: 'right' },
  notice: { borderRadius: 15, padding: 13, flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 9, marginBottom: 12 },
  noticeText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 19, textAlign: 'right' },
  card: { borderWidth: 1, borderRadius: 17, padding: 14, marginBottom: 12 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 15, textAlign: 'right' },
  helper: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 18, textAlign: 'right', marginTop: 6 },
  actions: { flexDirection: 'row-reverse', gap: 8, marginTop: 13 },
  actionButton: { flex: 1, minHeight: 48, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row-reverse', gap: 7 },
  actionText: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  previewWrap: { marginTop: 13, height: 250, borderRadius: 14, overflow: 'hidden', position: 'relative' },
  preview: { width: '100%', height: '100%' },
  remove: { position: 'absolute', top: 8, left: 8, width: 34, height: 34, borderRadius: 17, backgroundColor: '#B42318', alignItems: 'center', justifyContent: 'center' },
  emptyPhoto: { marginTop: 13, height: 170, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 10 },
  sectionRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  count: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  historyItem: { flexDirection: 'row-reverse', gap: 10, paddingTop: 12, marginTop: 10, borderTopWidth: 1 },
  date: { width: 42, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dateText: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  historyType: { fontFamily: 'Inter_600SemiBold', fontSize: 10, textAlign: 'right' },
  historyText: { fontFamily: 'Inter_500Medium', fontSize: 10, lineHeight: 17, textAlign: 'right', marginTop: 4 },
  historySub: { fontFamily: 'Inter_400Regular', fontSize: 9, lineHeight: 15, textAlign: 'right', marginTop: 3 },
  message: { borderRadius: 13, padding: 11, flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 7, marginBottom: 12 },
  messageText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 10, lineHeight: 17, textAlign: 'right' },
  analyze: { minHeight: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row-reverse', gap: 9 },
  analyzeText: { color: '#FFF', fontFamily: 'Inter_700Bold', fontSize: 13 },
});