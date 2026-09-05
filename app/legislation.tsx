import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const OFFICIAL_PAGE = 'https://moj.gov.iq/view.8184/';
const OFFICIAL_HOLIDAYS_PDF = 'https://moj.gov.iq/upload/pdf/4777_453.pdf';
const TEACHER_PROTECTION_PDF = 'https://mop.gov.iq/documents/legal_dept/informs/gazette/4661.pdf';

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
          <Text style={[styles.noticeText, { color: c.secondaryForeground }]}>هذه الصفحة تعتمد على مصادر رسمية موثقة. لا يستخدم الذكاء الاصطناعي لإنشاء نصوص أو أرقام مواد قانونية، ولا تُعد مقترحات التعديل قوانين نافذة.</Text>
        </View>

        <LegislationCard
          c={c}
          category="قانون"
          title="قانون العطلات الرسمية"
          number="12"
          year="2024"
          gazette="4777"
          date="27/05/2024"
          source="وزارة العدل – دائرة الوقائع العراقية"
          pdf={OFFICIAL_HOLIDAYS_PDF}
          pdfLabel="فتح العدد الرسمي PDF"
        />

        <LegislationCard
          c={c}
          category="قانون"
          title="قانون حماية المعلمين والمدرسين والمشرفين والمرشدين التربويين"
          number="8"
          year="2018"
          gazette="4486"
          date="09/04/2018"
          source="جريدة الوقائع العراقية"
          pdf={TEACHER_PROTECTION_PDF}
          pdfLabel="فتح النص الرسمي PDF"
        />

        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={styles.cardTop}>
            <View style={[styles.badge, { backgroundColor: c.secondary }]}>
              <Feather name="clipboard" size={19} color={c.primary} />
            </View>
            <View style={styles.cardTitleBox}>
              <Text style={[styles.category, { color: c.mutedForeground }]}>تعليمات</Text>
              <Text style={[styles.cardTitle, { color: c.foreground }]}>تعليمات تسهيل تنفيذ أحكام قانون حماية المعلمين والمدرسين والمشرفين والمرشدين التربويين</Text>
            </View>
          </View>

          <View style={styles.metaGrid}>
            <Meta label="الرقم" value="1" c={c} />
            <Meta label="السنة" value="2021" c={c} />
            <Meta label="المرجع" value="قانون رقم 8 لسنة 2018" c={c} />
            <Meta label="العدد" value="4661" c={c} />
          </View>

          <Text style={[styles.sourceLabel, { color: c.mutedForeground }]}>المصدر الرسمي</Text>
          <Text style={[styles.sourceText, { color: c.foreground }]}>نص التعليمات المنشور ضمن الوقائع العراقية</Text>

          <Pressable onPress={() => Linking.openURL(TEACHER_PROTECTION_PDF)} style={[styles.button, { backgroundColor: c.primary }]}>
            <Feather name="file-text" size={18} color={c.primaryForeground} />
            <Text style={[styles.buttonText, { color: c.primaryForeground }]}>فتح النص الرسمي PDF</Text>
          </Pressable>
        </View>

        <View style={[styles.sourceCard, { backgroundColor: c.secondary }]}>
          <Feather name="check-circle" size={18} color={c.primary} />
          <Text style={[styles.sourceCardText, { color: c.secondaryForeground }]}>المراجع أعلاه أضيفت كمراجع قانونية، وسيكون ربطها بالخطة الشهرية أو بالمساعد الذكي في خطوة مستقلة بعد اختبار هذه الصفحة.</Text>
        </View>

        <Pressable onPress={() => Linking.openURL(OFFICIAL_PAGE)} style={[styles.ministryButton, { borderColor: c.border, backgroundColor: c.card }]}>
          <Feather name="external-link" size={18} color={c.primary} />
          <Text style={[styles.buttonText, { color: c.primary }]}>صفحة وزارة العدل والوقائع العراقية</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function LegislationCard({ c, category, title, number, year, gazette, date, source, pdf, pdfLabel }: any) {
  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={styles.cardTop}>
        <View style={[styles.badge, { backgroundColor: c.secondary }]}>
          <Feather name="file-text" size={19} color={c.primary} />
        </View>
        <View style={styles.cardTitleBox}>
          <Text style={[styles.category, { color: c.mutedForeground }]}>{category}</Text>
          <Text style={[styles.cardTitle, { color: c.foreground }]}>{title}</Text>
        </View>
      </View>

      <View style={styles.metaGrid}>
        <Meta label="الرقم" value={number} c={c} />
        <Meta label="السنة" value={year} c={c} />
        <Meta label="الوقائع العراقية" value={gazette} c={c} />
        <Meta label="تاريخ النشر" value={date} c={c} />
      </View>

      <Text style={[styles.sourceLabel, { color: c.mutedForeground }]}>المصدر الرسمي</Text>
      <Text style={[styles.sourceText, { color: c.foreground }]}>{source}</Text>

      <Pressable onPress={() => Linking.openURL(pdf)} style={[styles.button, { backgroundColor: c.primary }]}>
        <Feather name="file-text" size={18} color={c.primaryForeground} />
        <Text style={[styles.buttonText, { color: c.primaryForeground }]}>{pdfLabel}</Text>
      </Pressable>
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
  card: { borderWidth: 1, borderRadius: 18, padding: 15, marginBottom: 12 },
  cardTop: { flexDirection: 'row-reverse', alignItems: 'center', gap: 11 },
  badge: { width: 45, height: 45, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardTitleBox: { flex: 1, alignItems: 'flex-end' },
  category: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  cardTitle: { fontFamily: 'Inter_700Bold', fontSize: 15, marginTop: 4, textAlign: 'right', lineHeight: 22 },
  metaGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginTop: 15 },
  meta: { width: '48%', borderWidth: 1, borderRadius: 12, padding: 9 },
  metaLabel: { fontFamily: 'Inter_400Regular', fontSize: 9, textAlign: 'right' },
  metaValue: { fontFamily: 'Inter_700Bold', fontSize: 11, marginTop: 3, textAlign: 'right' },
  sourceLabel: { fontFamily: 'Inter_500Medium', fontSize: 10, textAlign: 'right', marginTop: 15 },
  sourceText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, textAlign: 'right', marginTop: 4, lineHeight: 18 },
  button: { minHeight: 48, borderRadius: 13, marginTop: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row-reverse', gap: 8 },
  ministryButton: { minHeight: 48, borderRadius: 13, borderWidth: 1, marginTop: 2, alignItems: 'center', justifyContent: 'center', flexDirection: 'row-reverse', gap: 8 },
  buttonText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  sourceCard: { borderRadius: 15, padding: 13, flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 9, marginBottom: 12 },
  sourceCardText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 10, lineHeight: 18, textAlign: 'right' },
});
