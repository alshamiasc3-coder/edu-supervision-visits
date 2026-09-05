import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const OFFICIAL_PAGE = 'https://moj.gov.iq/view.8184/';
const OFFICIAL_PDF = 'https://moj.gov.iq/upload/pdf/4777_453.pdf';

export default function Legislation() {
  const c = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.page, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10, borderBottomColor: c.border }]}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Feather name="arrow-right" size={23} color={c.foreground} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: c.foreground }]}>التشريعات والقوانين</Text>
          <Text style={[styles.subtitle, { color: c.mutedForeground }]}>مراجع قانونية رسمية للعمل الإشرافي</Text>
        </View>
        <View style={[styles.iconBox, { backgroundColor: c.secondary }]}>
          <Feather name="book-open" size={22} color={c.primary} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 15, paddingBottom: insets.bottom + 35 }}>
        <View style={[styles.notice, { backgroundColor: c.secondary }]}>
          <Feather name="shield" size={19} color={c.primary} />
          <Text style={[styles.noticeText, { color: c.secondaryForeground }]}>هذه الصفحة هي نقطة البداية لقسم التشريعات. في هذه المرحلة نعرض المرجع الرسمي فقط، ولا نستخدم الذكاء الاصطناعي لإنشاء نصوص أو أرقام مواد قانونية.</Text>
        </View>

        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={styles.cardTop}>
            <View style={[styles.badge, { backgroundColor: c.secondary }]}>
              <Feather name="file-text" size={19} color={c.primary} />
            </View>
            <View style={styles.cardTitleBox}>
              <Text style={[styles.category, { color: c.mutedForeground }]}>قانون</Text>
              <Text style={[styles.cardTitle, { color: c.foreground }]}>قانون العطلات الرسمية</Text>
            </View>
          </View>

          <View style={styles.metaGrid}>
            <Meta label="الرقم" value="12" c={c} />
            <Meta label="السنة" value="2024" c={c} />
            <Meta label="الوقائع العراقية" value="4777" c={c} />
            <Meta label="تاريخ النشر" value="27/05/2024" c={c} />
          </View>

          <Text style={[styles.sourceLabel, { color: c.mutedForeground }]}>المصدر الرسمي</Text>
          <Text style={[styles.sourceText, { color: c.foreground }]}>وزارة العدل – دائرة الوقائع العراقية</Text>

          <Pressable onPress={() => Linking.openURL(OFFICIAL_PAGE)} style={[styles.button, { backgroundColor: c.secondary }]}>
            <Feather name="external-link" size={18} color={c.primary} />
            <Text style={[styles.buttonText, { color: c.primary }]}>صفحة وزارة العدل</Text>
          </Pressable>

          <Pressable onPress={() => Linking.openURL(OFFICIAL_PDF)} style={[styles.button, { backgroundColor: c.primary }]}>
            <Feather name="file-text" size={18} color={c.primaryForeground} />
            <Text style={[styles.buttonText, { color: c.primaryForeground }]}>فتح العدد الرسمي PDF</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function Meta({ label, value, c }: any) {
  return (
    <View style={[styles.meta, { backgroundColor: c.background, borderColor: c.border }]}>
      <Text style={[styles.metaLabel, { color: c.mutedForeground }]}>{label}</Text>
      <Text style={[styles.metaValue, { color: c.foreground }]}>{value}</Text>
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
  notice: { borderRadius: 15, padding: 13, flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 9, marginBottom: 12 },
  noticeText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 19, textAlign: 'right' },
  card: { borderWidth: 1, borderRadius: 18, padding: 15 },
  cardTop: { flexDirection: 'row-reverse', alignItems: 'center', gap: 11 },
  badge: { width: 45, height: 45, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardTitleBox: { flex: 1, alignItems: 'flex-end' },
  category: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  cardTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, marginTop: 4, textAlign: 'right' },
  metaGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginTop: 15 },
  meta: { width: '48%', borderWidth: 1, borderRadius: 12, padding: 9 },
  metaLabel: { fontFamily: 'Inter_400Regular', fontSize: 9, textAlign: 'right' },
  metaValue: { fontFamily: 'Inter_700Bold', fontSize: 12, marginTop: 3, textAlign: 'right' },
  sourceLabel: { fontFamily: 'Inter_500Medium', fontSize: 10, textAlign: 'right', marginTop: 15 },
  sourceText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, textAlign: 'right', marginTop: 4 },
  button: { minHeight: 48, borderRadius: 13, marginTop: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row-reverse', gap: 8 },
  buttonText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
});