import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const OFFICIAL_PAGE = 'https://moj.gov.iq/view.8184/';
const OFFICIAL_HOLIDAYS_PDF = 'https://moj.gov.iq/upload/pdf/4777_453.pdf';
const DISCIPLINE_PDF = 'https://moj.gov.iq/upload/pdf/%D9%82%D8%A7%D9%86%D9%88%D9%86%20%D8%A5%D9%86%D8%B6%D8%A8%D8%A7%D8%B7%20%D9%85%D9%88%D8%B8%D9%81%D9%8A%20%D8%A7%D9%84%D8%AF%D9%88%D9%84%D8%A9.pdf';

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
          <Text style={[styles.subtitle, { color: c.mutedForeground }]}>مراجع أساسية للعمل الإشرافي والتربوي</Text>
        </View>
        <View style={[styles.iconBox, { backgroundColor: c.secondary }]}>
          <Feather name="book-open" size={22} color={c.primary} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 15, paddingBottom: insets.bottom + 35 }}>
        <View style={[styles.notice, { backgroundColor: c.secondary }]}>
          <Feather name="shield" size={19} color={c.primary} />
          <Text style={[styles.noticeText, { color: c.secondaryForeground }]}>هذه الصفحة تعتمد على مراجع قانونية وتشريعية موثقة. لا يستخدم الذكاء الاصطناعي لإنشاء نصوص أو أرقام مواد قانونية، ولا تُعد مقترحات التعديل قوانين نافذة.</Text>
        </View>

        <SectionTitle c={c} title="المراجع الأكثر ارتباطًا بالعمل الإشرافي" />

        <LegislationCard c={c} category="نظام" title="نظام التعليم المهني رقم (6) لسنة 2016" meta={[['الرقم', '6'], ['السنة', '2016'], ['الوقائع العراقية', '4427'], ['تاريخ النشر', '12/12/2016']]} source="وزارة العدل – الوقائع العراقية" />
        <LegislationCard c={c} category="نظام" title="نظام المدارس الثانوية رقم (2) لسنة 1977 المعدل" meta={[['الرقم', '2'], ['السنة', '1977'], ['الحالة', 'معدل'], ['الموضوع', 'المدارس الثانوية']]} source="وزارة التربية والوقائع العراقية" />
        <LegislationCard c={c} category="تعليمات امتحانية" title="تعليمات رقم (1) لسنة 1983 بشأن امتحانات نصف السنة والامتحانات النهائية" meta={[['الرقم', '1'], ['السنة', '1983'], ['الموضوع', 'الامتحانات المدرسية'], ['الارتباط', 'نظام المدارس الثانوية']]} source="وزارة التربية – الأنظمة والتعليمات الامتحانية" />
        <LegislationCard c={c} category="نظام" title="نظام الامتحانات العامة رقم (18) لسنة 1987" meta={[['الرقم', '18'], ['السنة', '1987'], ['الموضوع', 'الامتحانات العامة'], ['الجهة', 'وزارة التربية']]} source="وزارة التربية – الوقائع العراقية" />

        <Pressable onPress={() => router.push('/exam-instructions-1983')} style={[styles.instructionsButton, { backgroundColor: c.secondary, borderColor: c.border }]}>
          <View style={[styles.instructionsIcon, { backgroundColor: c.card }]}>
            <Feather name="clipboard" size={21} color={c.primary} />
          </View>
          <View style={styles.instructionsTextBox}>
            <Text style={[styles.instructionsTitle, { color: c.foreground }]}>مجموعة التعليمات الامتحانية لسنة 1983</Text>
            <Text style={[styles.instructionsSub, { color: c.mutedForeground }]}>التعليمات من 1 إلى 10 في نافذة مستقلة</Text>
          </View>
          <Feather name="chevron-left" size={19} color={c.primary} />
        </Pressable>

        <SectionTitle c={c} title="مراجع عامة مهمة" />

        <LegislationCard c={c} category="قانون" title="قانون انضباط موظفي الدولة والقطاع العام رقم (14) لسنة 1991 المعدل" meta={[['الرقم', '14'], ['السنة', '1991'], ['الحالة', 'معدل'], ['الموضوع', 'انضباط الموظفين']]} source="وزارة العدل – الوقائع العراقية" pdf={DISCIPLINE_PDF} pdfLabel="فتح النص الرسمي PDF" />
        <LegislationCard c={c} category="قانون" title="قانون العطلات الرسمية رقم (12) لسنة 2024" meta={[['الرقم', '12'], ['السنة', '2024'], ['الوقائع العراقية', '4777'], ['تاريخ النشر', '27/05/2024']]} source="وزارة العدل – دائرة الوقائع العراقية" pdf={OFFICIAL_HOLIDAYS_PDF} pdfLabel="فتح العدد الرسمي PDF" />

        <View style={[styles.priorityCard, { backgroundColor: c.secondary }]}>
          <Feather name="star" size={18} color={c.primary} />
          <Text style={[styles.priorityText, { color: c.secondaryForeground }]}>سيكون التركيز في المساعد الذكي لاحقًا على هذه المراجع التربوية والامتحانية، مع الرجوع إلى النص الرسمي قبل الاستناد إلى أي مادة قانونية.</Text>
        </View>

        <Pressable onPress={() => Linking.openURL(OFFICIAL_PAGE)} style={[styles.ministryButton, { borderColor: c.border, backgroundColor: c.card }]}>
          <Feather name="external-link" size={18} color={c.primary} />
          <Text style={[styles.buttonText, { color: c.primary }]}>صفحة وزارة العدل والوقائع العراقية</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function SectionTitle({ c, title }: any) {
  return <View style={styles.sectionTitleWrap}><Text style={[styles.sectionTitle, { color: c.foreground }]}>{title}</Text></View>;
}

function LegislationCard({ c, category, title, meta, source, pdf, pdfLabel }: any) {
  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={styles.cardTop}>
        <View style={[styles.badge, { backgroundColor: c.secondary }]}><Feather name="file-text" size={19} color={c.primary} /></View>
        <View style={styles.cardTitleBox}><Text style={[styles.category, { color: c.mutedForeground }]}>{category}</Text><Text style={[styles.cardTitle, { color: c.foreground }]}>{title}</Text></View>
      </View>
      <View style={styles.metaGrid}>{meta.map(([label, value]: string[], index: number) => <Meta key={`${label}-${index}`} label={label} value={value} c={c} />)}</View>
      <Text style={[styles.sourceLabel, { color: c.mutedForeground }]}>المصدر</Text>
      <Text style={[styles.sourceText, { color: c.foreground }]}>{source}</Text>
      {pdf ? <Pressable onPress={() => Linking.openURL(pdf)} style={[styles.button, { backgroundColor: c.primary }]}><Feather name="file-text" size={18} color={c.primaryForeground} /><Text style={[styles.buttonText, { color: c.primaryForeground }]}>{pdfLabel}</Text></Pressable> : null}
    </View>
  );
}

function Meta({ label, value, c }: any) {
  return <View style={[styles.meta, { backgroundColor: c.background, borderColor: c.border }]}><Text style={[styles.metaLabel, { color: c.mutedForeground }]}>{label}</Text><Text style={[styles.metaValue, { color: c.foreground }]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 14, borderBottomWidth: 1 },
  back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, alignItems: 'flex-end' },
  title: { fontFamily: 'Inter_700Bold', fontSize: 20, textAlign: 'right' },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 3, textAlign: 'right' },
  iconBox: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  notice: { borderRadius: 15, padding: 13, flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 9, marginBottom: 8 },
  noticeText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 19, textAlign: 'right' },
  sectionTitleWrap: { marginTop: 12, marginBottom: 8 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 14, textAlign: 'right' },
  card: { borderWidth: 1, borderRadius: 18, padding: 15, marginBottom: 10 },
  cardTop: { flexDirection: 'row-reverse', alignItems: 'center', gap: 11 },
  badge: { width: 45, height: 45, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardTitleBox: { flex: 1, alignItems: 'flex-end' },
  category: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  cardTitle: { fontFamily: 'Inter_700Bold', fontSize: 14, marginTop: 4, textAlign: 'right', lineHeight: 21 },
  metaGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  meta: { width: '48%', borderWidth: 1, borderRadius: 12, padding: 9 },
  metaLabel: { fontFamily: 'Inter_400Regular', fontSize: 9, textAlign: 'right' },
  metaValue: { fontFamily: 'Inter_700Bold', fontSize: 10, marginTop: 3, textAlign: 'right' },
  sourceLabel: { fontFamily: 'Inter_500Medium', fontSize: 10, textAlign: 'right', marginTop: 13 },
  sourceText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, textAlign: 'right', marginTop: 4, lineHeight: 18 },
  button: { minHeight: 46, borderRadius: 13, marginTop: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row-reverse', gap: 8 },
  buttonText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  instructionsButton: { minHeight: 74, borderRadius: 17, borderWidth: 1, marginBottom: 12, padding: 11, flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  instructionsIcon: { width: 45, height: 45, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  instructionsTextBox: { flex: 1, alignItems: 'flex-end' },
  instructionsTitle: { fontFamily: 'Inter_700Bold', fontSize: 13, textAlign: 'right' },
  instructionsSub: { fontFamily: 'Inter_400Regular', fontSize: 9, textAlign: 'right', marginTop: 4 },
  priorityCard: { borderRadius: 15, padding: 13, flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 9, marginTop: 2, marginBottom: 12 },
  priorityText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 10, lineHeight: 18, textAlign: 'right' },
  ministryButton: { minHeight: 48, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row-reverse', gap: 8 },
});
