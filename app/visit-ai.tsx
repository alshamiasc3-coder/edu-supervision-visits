import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';

export default function VisitAIScreen() {
  const router = useRouter();

  const [schoolName, setSchoolName] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [visitType, setVisitType] = useState('زيارة إشرافية');
  const [observations, setObservations] = useState('');
  const [strengths, setStrengths] = useState('');
  const [needs, setNeeds] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const generateSuggestion = () => {
    setLoading(true);
    setResult('');

    setTimeout(() => {
      const school = schoolName.trim() || 'المدرسة';
      const date = visitDate.trim() || 'التاريخ المحدد للزيارة';

      const observationText =
        observations.trim() ||
        'تمت متابعة سير العملية التعليمية والاطلاع على مستوى تنفيذ الأعمال والمهام الموكلة للمدرسة.';

      const strengthsText =
        strengths.trim() ||
        'وجود تعاون جيد من إدارة المدرسة والهيئة التعليمية، مع اهتمام بمتابعة سير العمل التربوي.';

      const needsText =
        needs.trim() ||
        'الحاجة إلى الاستمرار في متابعة الجوانب التي تحتاج إلى تطوير ومعالجة الملاحظات وفق الأولويات.';

      const recommendationsText =
        recommendations.trim() ||
        'متابعة تنفيذ التوصيات بصورة دورية وتوثيق الإجراءات المتخذة ورفع مستوى المتابعة خلال الزيارات القادمة.';

      const generated = `
تقرير زيارة إشرافية

المدرسة: ${school}
تاريخ الزيارة: ${date}
نوع الزيارة: ${visitType}

أولاً: مجريات الزيارة والملاحظات
${observationText}

ثانياً: جوانب القوة
${strengthsText}

ثالثاً: الجوانب التي تحتاج إلى متابعة
${needsText}

رابعاً: التوصيات والإجراءات المقترحة
${recommendationsText}

خامساً: خطة المتابعة
يوصى بمتابعة تنفيذ التوصيات الواردة أعلاه خلال الفترة المحددة، والتحقق من مستوى الإنجاز في الزيارة القادمة، مع توثيق الإجراءات المتخذة والنتائج المتحققة.

الصياغة المقترحة:
تم خلال الزيارة الاطلاع على واقع العمل التربوي والإداري في ${school}، ومتابعة مستوى تنفيذ المهام والخطط المعتمدة. وقد أظهرت الزيارة وجود عدد من الجوانب الإيجابية التي تستحق التعزيز، إلى جانب بعض الجوانب التي تتطلب مزيداً من المتابعة والمعالجة. وعليه تم توجيه إدارة المدرسة إلى متابعة الملاحظات الواردة أعلاه والعمل على تنفيذ التوصيات، على أن تتم متابعة مستوى الإنجاز في الزيارات اللاحقة.
      `.trim();

      setResult(generated);
      setLoading(false);
    }, 700);
  };

  const clearForm = () => {
    setSchoolName('');
    setVisitDate('');
    setVisitType('زيارة إشرافية');
    setObservations('');
    setStrengths('');
    setNeeds('');
    setRecommendations('');
    setResult('');
  };

  const copySuggestion = () => {
    // سيتم ربط هذه الوظيفة لاحقاً بحفظ التقرير أو إرساله إلى نموذج الزيارة.
    if (!result) return;
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'مساعد صياغة الزيارة',
          headerShown: false,
        }}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>رجوع</Text>
            </Pressable>

            <View style={styles.headerTextContainer}>
              <Text style={styles.logo}>✦</Text>
              <Text style={styles.title}>مساعد صياغة الزيارة</Text>
              <Text style={styles.subtitle}>
                أداة تساعد المشرف على إعداد صياغة مهنية للزيارة بناءً على
                المعطيات المدخلة
              </Text>
            </View>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>المساعد الذكي</Text>
            <Text style={styles.infoText}>
              أدخل ملاحظاتك كما هي، وسنحوّلها إلى صياغة منظمة ومهنية قابلة
              للمراجعة والتعديل.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>بيانات الزيارة</Text>

            <Text style={styles.label}>اسم المدرسة</Text>
            <TextInput
              value={schoolName}
              onChangeText={setSchoolName}
              placeholder="مثال: مدرسة النور الابتدائية"
              placeholderTextColor="#999"
              style={styles.input}
              textAlign="right"
            />

            <Text style={styles.label}>تاريخ الزيارة</Text>
            <TextInput
              value={visitDate}
              onChangeText={setVisitDate}
              placeholder="مثال: 24-08-2026"
              placeholderTextColor="#999"
              style={styles.input}
              textAlign="right"
            />

            <Text style={styles.label}>نوع الزيارة</Text>
            <View style={styles.typeRow}>
              {[
                'زيارة إشرافية',
                'زيارة متابعة',
                'زيارة تقويمية',
              ].map((type) => (
                <Pressable
                  key={type}
                  onPress={() => setVisitType(type)}
                  style={[
                    styles.typeButton,
                    visitType === type && styles.typeButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      visitType === type &&
                        styles.typeButtonTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>معطيات الزيارة</Text>

            <Text style={styles.label}>الملاحظات والمشاهدات</Text>
            <TextInput
              value={observations}
              onChangeText={setObservations}
              placeholder="اكتب ما شاهدته أثناء الزيارة..."
              placeholderTextColor="#999"
              style={[styles.input, styles.textArea]}
              multiline
              textAlign="right"
              textAlignVertical="top"
            />

            <Text style={styles.label}>جوانب القوة</Text>
            <TextInput
              value={strengths}
              onChangeText={setStrengths}
              placeholder="ما الجوانب الإيجابية التي لاحظتها؟"
              placeholderTextColor="#999"
              style={[styles.input, styles.textArea]}
              multiline
              textAlign="right"
              textAlignVertical="top"
            />

            <Text style={styles.label}>الجوانب التي تحتاج إلى متابعة</Text>
            <TextInput
              value={needs}
              onChangeText={setNeeds}
              placeholder="ما الأمور التي تحتاج إلى معالجة أو تطوير؟"
              placeholderTextColor="#999"
              style={[styles.input, styles.textArea]}
              multiline
              textAlign="right"
              textAlignVertical="top"
            />

            <Text style={styles.label}>التوصيات المقترحة</Text>
            <TextInput
              value={recommendations}
              onChangeText={setRecommendations}
              placeholder="اكتب التوصيات أو الإجراءات المقترحة..."
              placeholderTextColor="#999"
              style={[styles.input, styles.textArea]}
              multiline
              textAlign="right"
              textAlignVertical="top"
            />

            <Pressable
              style={[
                styles.generateButton,
                loading && styles.buttonDisabled,
              ]}
              onPress={generateSuggestion}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.generateIcon}>✦</Text>
                  <Text style={styles.generateButtonText}>
                    إنشاء صياغة مقترحة
                  </Text>
                </>
              )}
            </Pressable>

            <Pressable
              style={styles.clearButton}
              onPress={clearForm}
            >
              <Text style={styles.clearButtonText}>مسح البيانات</Text>
            </Pressable>
          </View>

          {result ? (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <View>
                  <Text style={styles.resultTitle}>
                    الصياغة المقترحة
                  </Text>
                  <Text style={styles.resultSubtitle}>
                    راجع النص وعدّل عليه قبل اعتماده
                  </Text>
                </View>

                <Text style={styles.aiBadge}>AI</Text>
              </View>

              <View style={styles.resultContent}>
                <Text style={styles.resultText}>{result}</Text>
              </View>

              <View style={styles.resultActions}>
                <Pressable
                  style={styles.primaryAction}
                  onPress={copySuggestion}
                >
                  <Text style={styles.primaryActionText}>
                    استخدام الصياغة
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.secondaryAction}
                  onPress={() => setResult('')}
                >
                  <Text style={styles.secondaryActionText}>
                    إغلاق
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>مهم</Text>
            <Text style={styles.noticeText}>
              هذه الصياغة مقترحة للمساعدة فقط. يبقى اعتماد التقرير
              وتعديله من مسؤولية المشرف قبل الحفظ أو الإرسال.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7f8',
  },

  content: {
    padding: 18,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 16,
  },

  headerTextContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },

  backButton: {
    minWidth: 64,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#e3eeee',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  backButtonText: {
    color: '#14515f',
    fontSize: 14,
    fontWeight: '700',
  },

  logo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#14515f',
    color: '#fff',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 24,
    marginBottom: 6,
  },

  title: {
    fontSize: 25,
    fontWeight: '800',
    color: '#123f4b',
    textAlign: 'right',
  },

  subtitle: {
    marginTop: 5,
    fontSize: 13,
    color: '#718087',
    textAlign: 'right',
    lineHeight: 21,
  },

  infoBox: {
    backgroundColor: '#e4f2f1',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#cce5e3',
  },

  infoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#14515f',
    textAlign: 'right',
    marginBottom: 5,
  },

  infoText: {
    fontSize: 13,
    color: '#52676c',
    textAlign: 'right',
    lineHeight: 21,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e1e8ea',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#183f49',
    textAlign: 'right',
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#33444a',
    textAlign: 'right',
    marginBottom: 7,
    marginTop: 8,
  },

  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#d7e0e2',
    borderRadius: 11,
    backgroundColor: '#fafcfc',
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#26383d',
  },

  textArea: {
    minHeight: 115,
    paddingTop: 13,
  },

  typeRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },

  typeButton: {
    borderWidth: 1,
    borderColor: '#d3dfe1',
    backgroundColor: '#fafcfc',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },

  typeButtonActive: {
    backgroundColor: '#14515f',
    borderColor: '#14515f',
  },

  typeButtonText: {
    fontSize: 12,
    color: '#53656a',
  },

  typeButtonTextActive: {
    color: '#fff',
    fontWeight: '700',
  },

  generateButton: {
    height: 52,
    borderRadius: 11,
    backgroundColor: '#1f5b86',
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  generateIcon: {
    color: '#fff',
    fontSize: 19,
  },

  generateButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },

  clearButton: {
    height: 44,
    borderRadius: 10,
    marginTop: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  clearButtonText: {
    color: '#68787d',
    fontSize: 14,
    fontWeight: '600',
  },

  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#cbdfe1',
  },

  resultHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  resultTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#143f4a',
    textAlign: 'right',
  },

  resultSubtitle: {
    fontSize: 12,
    color: '#7b898d',
    textAlign: 'right',
    marginTop: 4,
  },

  aiBadge: {
    backgroundColor: '#e3f1ef',
    color: '#14515f',
    fontSize: 13,
    fontWeight: '900',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  resultContent: {
    backgroundColor: '#f8fafb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e3e9eb',
  },

  resultText: {
    fontSize: 14,
    lineHeight: 27,
    color: '#293c42',
    textAlign: 'right',
  },

  resultActions: {
    flexDirection: 'row-reverse',
    gap: 9,
    marginTop: 14,
  },

  primaryAction: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#14515f',
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },

  secondaryAction: {
    width: 90,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#eef2f3',
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryActionText: {
    color: '#52646a',
    fontSize: 14,
    fontWeight: '700',
  },

  notice: {
    backgroundColor: '#fff9e8',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f0e2b5',
  },

  noticeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#856b1d',
    textAlign: 'right',
    marginBottom: 4,
  },

  noticeText: {
    fontSize: 12,
    color: '#75683f',
    textAlign: 'right',
    lineHeight: 20,
  },
});
