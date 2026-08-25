import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  router,
  useLocalSearchParams,
} from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';

type VisitType =
  | 'cleanliness'
  | 'academic'
  | 'attendance'
  | 'teachers'
  | 'behavior'
  | 'administration'
  | 'general';

/* =========================================================
   NORMALIZE
========================================================= */

function normalize(value: string = '') {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[إأآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ـ/g, '')
    .replace(/[ًٌٍَُِّْ]/g, '');
}

/* =========================================================
   DETECT VISIT TYPE
========================================================= */

function detectVisitType(
  reason: string,
  procedure: string
): VisitType {
  const text = normalize(
    `${reason} ${procedure}`
  );

  // النظافة والخدمات المدرسية
  if (
    text.includes('خدمه') ||
    text.includes('الخدمه') ||
    text.includes('نظاف') ||
    text.includes('صفوف') ||
    text.includes('الصفوف') ||
    text.includes('مرافق') ||
    text.includes('المرافق') ||
    text.includes('البيئه المدرسيه') ||
    text.includes('نظافه البيئه')
  ) {
    return 'cleanliness';
  }

  // التحصيل الدراسي والطلاب
  if (
    text.includes('تحصيل') ||
    text.includes('التحصيل') ||
    text.includes('مستوي الطلاب') ||
    text.includes('مستوى الطلاب') ||
    text.includes('مستوي الطلبه') ||
    text.includes('مستوى الطلبه') ||
    text.includes('درجات الطلاب') ||
    text.includes('درجات الطلبه') ||
    text.includes('الطلاب') ||
    text.includes('الطلبه') ||
    text.includes('رياضيات') ||
    text.includes('الرياضيات') ||
    text.includes('قراءه') ||
    text.includes('القراءة') ||
    text.includes('تعلم الطلاب') ||
    text.includes('التعلم') ||
    text.includes('ماده') ||
    text.includes('الماده')
  ) {
    return 'academic';
  }

  // الحضور والانصراف والدوام
  if (
    text.includes('دوام') ||
    text.includes('الدوام') ||
    text.includes('حضور') ||
    text.includes('الحضور') ||
    text.includes('انصراف') ||
    text.includes('الانصراف') ||
    text.includes('سجلات الحضور') ||
    text.includes('سجلات الانصراف') ||
    text.includes('سجلات دوام')
  ) {
    return 'attendance';
  }

  // المعلمون والخطط الدراسية
  if (
    text.includes('مدرس') ||
    text.includes('المدرس') ||
    text.includes('مدرسين') ||
    text.includes('المدرسين') ||
    text.includes('معلم') ||
    text.includes('المعلم') ||
    text.includes('معلمين') ||
    text.includes('المعلمين') ||
    text.includes('خطه المدرس') ||
    text.includes('خطط المدرسين') ||
    text.includes('خطه المعلم') ||
    text.includes('خطط المعلمين') ||
    text.includes('الخطة الدراسية') ||
    text.includes('خطه دراسيه')
  ) {
    return 'teachers';
  }

  // الانضباط والسلوك
  if (
    text.includes('انضباط') ||
    text.includes('الانضباط') ||
    text.includes('سلوك') ||
    text.includes('السلوك') ||
    text.includes('مشكلات سلوكيه') ||
    text.includes('مشاكل سلوكيه') ||
    text.includes('مشكلات الطلاب') ||
    text.includes('مشاكل الطلاب')
  ) {
    return 'behavior';
  }

  // الإدارة والشؤون الإدارية
  if (
    text.includes('اداري') ||
    text.includes('اداريه') ||
    text.includes('الاداره') ||
    text.includes('اداره') ||
    text.includes('إدارة') ||
    text.includes('شؤون اداريه') ||
    text.includes('سجلات اداريه') ||
    text.includes('العمل الاداري')
  ) {
    return 'administration';
  }

  return 'general';
}

/* =========================================================
   BUILD AI DRAFT
========================================================= */

function buildDraft(
  reason: string,
  procedure: string,
  type: VisitType
) {
  const cleanReason =
    reason.trim() ||
    'متابعة واقع العمل في المدرسة';

  const cleanProcedure =
    procedure.trim() ||
    'متابعة الإجراءات المرتبطة بموضوع الزيارة';

  let generatedNotes = '';
  let generatedRecommendations = '';
  let generatedFollowUp = '';

  switch (type) {
    /* =====================================================
       النظافة والخدمات
    ===================================================== */

    case 'cleanliness':
      generatedNotes =
        `تمت زيارة المدرسة لغرض ${cleanReason}، حيث تم الاطلاع على مستوى نظافة الصفوف والمرافق المدرسية ومتابعة الإجراءات المتخذة للمحافظة على نظافة البيئة المدرسية، مع رصد الملاحظات التي تحتاج إلى معالجة ومتابعة.`;

      generatedRecommendations =
        `1. متابعة مستوى نظافة الصفوف والمرافق المدرسية بصورة مستمرة.\n\n` +
        `2. التأكد من تنفيذ أعمال النظافة وفق البرنامج المعتمد.\n\n` +
        `3. متابعة معالجة الملاحظات المتعلقة بنظافة الصفوف والمدرسة خلال المدة المحددة.\n\n` +
        `4. التأكد من توفر المستلزمات اللازمة لأعمال النظافة والمحافظة على البيئة المدرسية.\n\n` +
        `5. توثيق مستوى الإنجاز والإجراءات المتخذة ومعالجة أي ملاحظات جديدة.\n\n` +
        `6. متابعة الإجراء المحدد: ${cleanProcedure}`;

      generatedFollowUp =
        `تتم متابعة مستوى نظافة الصفوف والمدرسة خلال الزيارة القادمة، مع التحقق من تنفيذ الإجراءات المطلوبة ومعالجة الملاحظات المسجلة وتوثيق مستوى التحسن والنتائج المتحققة.`;
      break;

    /* =====================================================
       التحصيل الدراسي
    ===================================================== */

    case 'academic':
      generatedNotes =
        `تمت زيارة المدرسة لغرض ${cleanReason}، حيث تم الاطلاع على مستوى التحصيل الدراسي للطلبة ومتابعة واقع الأداء التعليمي في المادة أو المجال المعني، مع رصد الملاحظات المتعلقة بمستوى الطلبة والإجراءات المتخذة لمعالجة جوانب الضعف وتحسين مستوى التعلم.`;

      generatedRecommendations =
        `1. متابعة مستوى تحصيل الطلبة في المادة أو المجال المحدد.\n\n` +
        `2. تحديد الطلبة الذين يحتاجون إلى دعم تعليمي إضافي ووضع إجراءات مناسبة لمعالجة جوانب الضعف.\n\n` +
        `3. متابعة تنفيذ الإجراءات التعليمية والعلاجية المتخذة من قبل المدرسة.\n\n` +
        `4. التأكد من قياس مستوى التحسن بصورة دورية وتوثيق النتائج.\n\n` +
        `5. متابعة مستوى تنفيذ الإجراء المحدد: ${cleanProcedure}`;

      generatedFollowUp =
        `تتم متابعة مستوى تحصيل الطلبة خلال الزيارة القادمة، مع التحقق من أثر الإجراءات العلاجية والتعليمية المتخذة وقياس مستوى التحسن وتوثيق النتائج الجديدة.`;
      break;

    /* =====================================================
       الحضور والانصراف
    ===================================================== */

    case 'attendance':
      generatedNotes =
        `تمت زيارة المدرسة لغرض ${cleanReason}، حيث تم الاطلاع على سجلات الحضور والانصراف والدوام ومتابعة مدى انتظام الكوادر التعليمية والإدارية، مع رصد الملاحظات التي تحتاج إلى معالجة وفق التعليمات والإجراءات المعتمدة.`;

      generatedRecommendations =
        `1. متابعة سجلات الحضور والانصراف بصورة مستمرة.\n\n` +
        `2. التأكد من انتظام الدوام والالتزام بأوقات الحضور والانصراف المحددة.\n\n` +
        `3. معالجة حالات عدم الانتظام وفق التعليمات المعتمدة.\n\n` +
        `4. توثيق الإجراءات المتخذة والنتائج المتحققة.\n\n` +
        `5. متابعة تنفيذ الإجراء المحدد: ${cleanProcedure}`;

      generatedFollowUp =
        `تتم متابعة انتظام الدوام والحضور والانصراف خلال الزيارة القادمة، مع التحقق من معالجة حالات عدم الانتظام وتوثيق مستوى الالتزام والنتائج الجديدة.`;
      break;

    /* =====================================================
       المعلمون والخطط الدراسية
    ===================================================== */

    case 'teachers':
      generatedNotes =
        `تمت زيارة المدرسة لغرض ${cleanReason}، حيث تم الاطلاع على واقع أداء الكوادر التعليمية ومتابعة تنفيذ الخطط التعليمية والسجلات الخاصة بالمعلمين، مع رصد الملاحظات التي تحتاج إلى معالجة ومتابعة.`;

      generatedRecommendations =
        `1. متابعة تنفيذ الخطط التعليمية والسجلات الخاصة بالكوادر التعليمية.\n\n` +
        `2. التأكد من استكمال المتطلبات التعليمية وفق التعليمات المعتمدة.\n\n` +
        `3. متابعة الملاحظات المسجلة ومعالجة جوانب النقص خلال المدة المحددة.\n\n` +
        `4. توثيق مستوى الإنجاز والإجراءات المتخذة.\n\n` +
        `5. متابعة تنفيذ الإجراء المحدد: ${cleanProcedure}`;

      generatedFollowUp =
        `تتم متابعة أداء الكوادر التعليمية وتنفيذ الخطط خلال الزيارة القادمة، مع التحقق من معالجة الملاحظات السابقة وتوثيق مستوى الإنجاز والنتائج الجديدة.`;
      break;

    /* =====================================================
       الانضباط والسلوك
    ===================================================== */

    case 'behavior':
      generatedNotes =
        `تمت زيارة المدرسة لغرض ${cleanReason}، حيث تم الاطلاع على مستوى الانضباط والسلوك المدرسي ومتابعة الإجراءات المتخذة لمعالجة الحالات والملاحظات المسجلة، مع التأكيد على تطبيق التعليمات التربوية المعتمدة.`;

      generatedRecommendations =
        `1. متابعة مستوى الانضباط والسلوك داخل المدرسة بصورة مستمرة.\n\n` +
        `2. معالجة الحالات والملاحظات السلوكية وفق الأساليب التربوية والتعليمات المعتمدة.\n\n` +
        `3. تعزيز دور الإدارة والكوادر التعليمية في متابعة السلوك المدرسي.\n\n` +
        `4. توثيق الإجراءات المتخذة والنتائج المتحققة.\n\n` +
        `5. متابعة تنفيذ الإجراء المحدد: ${cleanProcedure}`;

      generatedFollowUp =
        `تتم متابعة مستوى الانضباط والسلوك خلال الزيارة القادمة، مع التحقق من معالجة الحالات السابقة وقياس مستوى التحسن وتوثيق النتائج الجديدة.`;
      break;

    /* =====================================================
       الإدارة
    ===================================================== */

    case 'administration':
      generatedNotes =
        `تمت زيارة المدرسة لغرض ${cleanReason}، حيث تم الاطلاع على واقع العمل الإداري ومتابعة السجلات والإجراءات الإدارية المتخذة، مع رصد الملاحظات التي تحتاج إلى معالجة ومتابعة وفق التعليمات وخطة العمل المعتمدة.`;

      generatedRecommendations =
        `1. متابعة تنفيذ الإجراءات الإدارية المرتبطة بموضوع الزيارة.\n\n` +
        `2. التأكد من استكمال السجلات والوثائق المطلوبة.\n\n` +
        `3. معالجة الملاحظات الإدارية المسجلة خلال المدة المحددة.\n\n` +
        `4. توثيق مستوى الإنجاز والإجراءات المتخذة.\n\n` +
        `5. متابعة تنفيذ الإجراء المحدد: ${cleanProcedure}`;

      generatedFollowUp =
        `تتم متابعة الإجراءات الإدارية خلال الزيارة القادمة، مع التحقق من استكمال المتطلبات ومعالجة الملاحظات السابقة وتوثيق مستوى الإنجاز والنتائج الجديدة.`;
      break;

    /* =====================================================
       عام
    ===================================================== */

    case 'general':
    default:
      generatedNotes =
        `تمت زيارة المدرسة لغرض ${cleanReason}، حيث تم الاطلاع على واقع العمل ومتابعة الإجراءات المتخذة والاطلاع على مستوى تنفيذها، مع رصد الملاحظات التي تحتاج إلى متابعة ومعالجة وفق خطة العمل المعتمدة.`;

      generatedRecommendations =
        `1. متابعة تنفيذ الإجراءات المرتبطة بموضوع الزيارة.\n\n` +
        `2. التأكد من معالجة الملاحظات التي تم رصدها خلال المدة المحددة.\n\n` +
        `3. متابعة مستوى التنفيذ وقياس مدى تحقق النتائج المطلوبة.\n\n` +
        `4. توثيق الإجراءات المنفذة والنتائج المتحققة.\n\n` +
        `5. متابعة تنفيذ الإجراء المحدد: ${cleanProcedure}`;

      generatedFollowUp =
        `تتم متابعة تنفيذ التوصيات والإجراءات خلال الزيارة القادمة، مع التحقق من مستوى الإنجاز وتوثيق النتائج والملاحظات الجديدة.`;
      break;
  }

  return {
    notes: generatedNotes,
    recommendations: generatedRecommendations,
    followUp: generatedFollowUp,
  };
}

/* =========================================================
   MAIN SCREEN
========================================================= */

export default function VisitAI() {
  const c = useColors();
  const insets = useSafeAreaInsets();

  const params = useLocalSearchParams<{
    visitId?: string;
    schoolName?: string;

    reason?: string;
    visitReason?: string;

    procedure?: string;
    actions?: string;

    aiActions?: string;
    aiNotes?: string;
    aiRecommendations?: string;
    aiFollowUp?: string;
  }>();

  /* =======================================================
     READ REASON
  ======================================================= */

  const initialReason = useMemo(() => {
    return (
      params.reason ||
      params.visitReason ||
      ''
    ).toString();
  }, [
    params.reason,
    params.visitReason,
  ]);

  /* =======================================================
     READ PROCEDURE
  ======================================================= */

  const initialProcedure = useMemo(() => {
    return (
      params.procedure ||
      params.actions ||
      ''
    ).toString();
  }, [
    params.procedure,
    params.actions,
  ]);

  const [reason] = useState(
    initialReason
  );

  const [procedure, setProcedure] =
    useState(initialProcedure);

  const [actions, setActions] =
    useState(
      initialProcedure ||
        'لم يتم إدخال إجراءات للزيارة بعد.'
    );

  /* =======================================================
     AI TEXT
  ======================================================= */

  const [notes, setNotes] =
    useState(
      params.aiNotes?.toString() ||
        'اضغط على «إعداد الصياغة الذكية» لإنشاء الملاحظات المناسبة لموضوع الزيارة.'
    );

  const [recommendations, setRecommendations] =
    useState(
      params.aiRecommendations?.toString() ||
        'سيتم إنشاء التوصيات والإجراءات المقترحة بناءً على سبب الزيارة والإجراءات المحددة.'
    );

  const [followUp, setFollowUp] =
    useState(
      params.aiFollowUp?.toString() ||
        'سيتم إنشاء خطة متابعة مرتبطة بموضوع الزيارة بعد إعداد الصياغة الذكية.'
    );

  const [loading, setLoading] =
    useState(false);

  const [generatedType, setGeneratedType] =
    useState<VisitType>('general');

  /* =======================================================
     PREPARE AI
  ======================================================= */

  const prepareAI = () => {
    setLoading(true);

    const currentProcedure =
      actions.trim() ||
      procedure.trim();

    const type =
      detectVisitType(
        reason,
        currentProcedure
      );

    const draft =
      buildDraft(
        reason,
        currentProcedure,
        type
      );

    setGeneratedType(type);

    setNotes(draft.notes);
    setRecommendations(
      draft.recommendations
    );
    setFollowUp(
      draft.followUp
    );

    setLoading(false);
  };

  /* =======================================================
     USE DRAFT
     
     IMPORTANT:
     نرسل سبب الزيارة إلى visit-form
     حتى لا يختفي بعد الضغط على
     "استخدام صياغتي في الزيارة".
  ======================================================= */

  const useDraft = () => {
    const finalReason =
      reason.trim();

    const finalActions =
      actions.trim() ||
      procedure.trim();

    router.push({
      pathname: '/visit-form',

      params: {
        /* بيانات الزيارة الأصلية */
        visitId:
          params.visitId?.toString() || '',

        schoolName:
          params.schoolName?.toString() || '',

        /* السبب - مهم جدًا */
        reason: finalReason,
        visitReason: finalReason,

        /* الإجراءات */
        procedure: finalActions,
        actions: finalActions,
        aiActions: finalActions,

        /* الملاحظات والتوصيات */
        aiNotes: notes,
        aiRecommendations:
          recommendations,
        aiFollowUp:
          followUp,
      },
    });
  };

  /* =======================================================
     TYPE LABEL
  ======================================================= */

  const typeLabel = {
    cleanliness:
      'النظافة والخدمات المدرسية',

    academic:
      'التحصيل الدراسي',

    attendance:
      'الحضور والانصراف',

    teachers:
      'الكوادر التعليمية والخطط',

    behavior:
      'الانضباط والسلوك',

    administration:
      'العمل الإداري',

    general:
      'موضوع عام',
  }[generatedType];

  /* =======================================================
     UI
  ======================================================= */

  return (
    <View
      style={[
        styles.page,
        {
          backgroundColor:
            c.background,
        },
      ]}
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <View
        style={[
          styles.header,
          {
            paddingTop:
              insets.top + 10,
            borderBottomColor:
              c.border,
          },
        ]}
      >
        <Pressable
          onPress={() =>
            router.back()
          }
          style={styles.backButton}
        >
          <Feather
            name="arrow-right"
            size={23}
            color={c.foreground}
          />
        </Pressable>

        <View
          style={
            styles.headerText
          }
        >
          <Text
            style={[
              styles.title,
              {
                color:
                  c.foreground,
              },
            ]}
          >
            المساعد الذكي للزيارة
          </Text>

          <Text
            style={[
              styles.subtitle,
              {
                color:
                  c.mutedForeground,
              },
            ]}
          >
            صياغة الملاحظات والتوصيات بصورة تربوية ومهنية
          </Text>
        </View>

        <View
          style={[
            styles.aiIcon,
            {
              backgroundColor:
                c.accent,
            },
          ]}
        >
          <Feather
            name="cpu"
            size={22}
            color={c.navy}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom:
              insets.bottom + 35,
          },
        ]}
      >
        {/* =================================================
            VISIT INFORMATION
        ================================================= */}

        <View
          style={[
            styles.infoCard,
            {
              backgroundColor:
                c.card,
              borderColor:
                c.border,
            },
          ]}
        >
          {/* المدرسة */}

          {params.schoolName ? (
            <>
              <View
                style={
                  styles.infoRow
                }
              >
                <Text
                  style={[
                    styles.infoLabel,
                    {
                      color:
                        c.mutedForeground,
                    },
                  ]}
                >
                  المدرسة
                </Text>

                <Text
                  style={[
                    styles.infoValue,
                    {
                      color:
                        c.foreground,
                    },
                  ]}
                >
                  {params.schoolName}
                </Text>
              </View>

              <View
                style={[
                  styles.divider,
                  {
                    backgroundColor:
                      c.border,
                  },
                ]}
              />
            </>
          ) : null}

          {/* سبب الزيارة */}

          <View
            style={
              styles.infoRow
            }
          >
            <Text
              style={[
                styles.infoLabel,
                {
                  color:
                    c.mutedForeground,
                },
              ]}
            >
              سبب الزيارة
            </Text>

            <Text
              style={[
                styles.infoValue,
                {
                  color:
                    c.foreground,
                },
              ]}
            >
              {reason ||
                'لم يتم إدخال سبب الزيارة'}
            </Text>
          </View>

          <View
            style={[
              styles.divider,
              {
                backgroundColor:
                  c.border,
              },
            ]}
          />

          {/* الإجراءات */}

          <View
            style={
              styles.infoRow
            }
          >
            <Text
              style={[
                styles.infoLabel,
                {
                  color:
                    c.mutedForeground,
                },
              ]}
            >
              الإجراءات
            </Text>

            <Text
              style={[
                styles.infoValue,
                {
                  color:
                    c.foreground,
                },
              ]}
            >
              {actions ||
                procedure ||
                'لم يتم إدخال إجراءات'}
            </Text>
          </View>
        </View>

        {/* =================================================
            ACTIONS
        ================================================= */}

        <Section
          title="الإجراءات أو التوصيات"
          icon="edit-3"
          c={c}
        >
          <TextInput
            value={actions}
            onChangeText={
              setActions
            }
            multiline
            textAlign="right"
            textAlignVertical="top"
            placeholder="اكتب الإجراءات المطلوبة..."
            placeholderTextColor={
              c.mutedForeground
            }
            style={[
              styles.input,
              {
                backgroundColor:
                  c.card,
                borderColor:
                  c.border,
                color:
                  c.foreground,
              },
            ]}
          />
        </Section>

        {/* =================================================
            SMART AI BUTTON
        ================================================= */}

        <Pressable
          onPress={
            prepareAI
          }
          disabled={loading}
          style={[
            styles.smartButton,
            {
              backgroundColor:
                c.navy,
              opacity:
                loading ? 0.75 : 1,
            },
          ]}
        >
          <View
            style={[
              styles.smartIcon,
              {
                backgroundColor:
                  c.accent,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator
                size="small"
                color={c.navy}
              />
            ) : (
              <Feather
                name="zap"
                size={21}
                color={c.navy}
              />
            )}
          </View>

          <View
            style={{
              flex: 1,
            }}
          >
            <Text
              style={
                styles.smartTitle
              }
            >
              {loading
                ? 'جاري إعداد الصياغة...'
                : 'إعداد الصياغة الذكية'}
            </Text>

            <Text
              style={
                styles.smartSub
              }
            >
              تحويل سبب الزيارة والإجراءات إلى صياغة تربوية رسمية
            </Text>
          </View>

          <Feather
            name="chevron-left"
            size={19}
            color="#FFFFFF"
          />
        </Pressable>

        {/* =================================================
            DETECTED TYPE
        ================================================= */}

        <View
          style={[
            styles.detectedBox,
            {
              backgroundColor:
                c.secondary ||
                c.card,
              borderColor:
                c.border,
            },
          ]}
        >
          <Feather
            name="check-circle"
            size={16}
            color={c.primary}
          />

          <Text
            style={[
              styles.detectedText,
              {
                color:
                  c.foreground,
              },
            ]}
          >
            نوع الصياغة المكتشف: {typeLabel}
          </Text>
        </View>

        {/* =================================================
            NOTES
        ================================================= */}

        <Section
          title="الملاحظات المقترحة"
          icon="edit-3"
          c={c}
        >
          <TextInput
            value={notes}
            onChangeText={
              setNotes
            }
            multiline
            textAlign="right"
            textAlignVertical="top"
            style={[
              styles.input,
              styles.largeInput,
              {
                backgroundColor:
                  c.card,
                borderColor:
                  c.border,
                color:
                  c.foreground,
              },
            ]}
          />
        </Section>

        {/* =================================================
            RECOMMENDATIONS
        ================================================= */}

        <Section
          title="التوصيات والإجراءات المقترحة"
          icon="edit-3"
          c={c}
        >
          <TextInput
            value={
              recommendations
            }
            onChangeText={
              setRecommendations
            }
            multiline
            textAlign="right"
            textAlignVertical="top"
            style={[
              styles.input,
              styles.xLargeInput,
              {
                backgroundColor:
                  c.card,
                borderColor:
                  c.border,
                color:
                  c.foreground,
              },
            ]}
          />
        </Section>

        {/* =================================================
            FOLLOW UP
        ================================================= */}

        <Section
          title="خطة المتابعة"
          icon="edit-3"
          c={c}
        >
          <TextInput
            value={followUp}
            onChangeText={
              setFollowUp
            }
            multiline
            textAlign="right"
            textAlignVertical="top"
            style={[
              styles.input,
              styles.largeInput,
              {
                backgroundColor:
                  c.card,
                borderColor:
                  c.border,
                color:
                  c.foreground,
              },
            ]}
          />
        </Section>

        {/* =================================================
            USE DRAFT
        ================================================= */}

        <Pressable
          onPress={
            useDraft
          }
          style={[
            styles.useButton,
            {
              backgroundColor:
                c.primary,
            },
          ]}
        >
          <Feather
            name="check-circle"
            size={20}
            color={
              c.primaryForeground
            }
          />

          <Text
            style={[
              styles.useButtonText,
              {
                color:
                  c.primaryForeground,
              },
            ]}
          >
            استخدام صياغتي في الزيارة
          </Text>
        </Pressable>

        <Text
          style={[
            styles.footer,
            {
              color:
                c.mutedForeground,
            },
          ]}
        >
          يمكنك تعديل النص المقترح قبل حفظ الزيارة.
        </Text>
      </ScrollView>
    </View>
  );
}

/* =========================================================
   SECTION COMPONENT
========================================================= */

function Section({
  title,
  icon,
  children,
  c,
}: any) {
  return (
    <View
      style={
        styles.section
      }
    >
      <View
        style={
          styles.sectionHeader
        }
      >
        <Text
          style={[
            styles.sectionTitle,
            {
              color:
                c.foreground,
            },
          ]}
        >
          {title}
        </Text>

        <Feather
          name={icon}
          size={17}
          color={c.primary}
        />
      </View>

      {children}
    </View>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles =
  StyleSheet.create({
    page: {
      flex: 1,
    },

    header: {
      minHeight: 62,
      paddingHorizontal: 16,
      paddingBottom: 10,
      flexDirection:
        'row-reverse',
      alignItems:
        'center',
      borderBottomWidth: 1,
    },

    headerText: {
      flex: 1,
      alignItems:
        'flex-end',
    },

    title: {
      fontFamily:
        'Inter_700Bold',
      fontSize: 20,
    },

    subtitle: {
      fontFamily:
        'Inter_400Regular',
      fontSize: 10,
      marginTop: 3,
    },

    backButton: {
      width: 38,
      height: 38,
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    aiIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems:
        'center',
      justifyContent:
        'center',
      marginLeft: 8,
    },

    content: {
      paddingHorizontal: 15,
      paddingTop: 16,
    },

    infoCard: {
      borderWidth: 1,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 18,
    },

    infoRow: {
      paddingVertical: 5,
      alignItems:
        'flex-end',
    },

    infoLabel: {
      fontFamily:
        'Inter_400Regular',
      fontSize: 10,
      marginBottom: 4,
    },

    infoValue: {
      fontFamily:
        'Inter_600SemiBold',
      fontSize: 12,
      lineHeight: 21,
      textAlign:
        'right',
    },

    divider: {
      height: 1,
      width: '100%',
    },

    section: {
      marginBottom: 18,
    },

    sectionHeader: {
      flexDirection:
        'row-reverse',
      alignItems:
        'center',
      gap: 7,
      marginBottom: 8,
    },

    sectionTitle: {
      fontFamily:
        'Inter_600SemiBold',
      fontSize: 12,
    },

    input: {
      minHeight: 90,
      borderWidth: 1,
      borderRadius: 15,
      paddingHorizontal: 13,
      paddingVertical: 12,
      fontFamily:
        'Inter_400Regular',
      fontSize: 12,
      lineHeight: 22,
    },

    largeInput: {
      minHeight: 115,
    },

    xLargeInput: {
      minHeight: 180,
    },

    smartButton: {
      minHeight: 70,
      borderRadius: 18,
      paddingHorizontal: 13,
      flexDirection:
        'row-reverse',
      alignItems:
        'center',
      gap: 10,
      marginBottom: 12,
    },

    smartIcon: {
      width: 45,
      height: 45,
      borderRadius: 14,
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    smartTitle: {
      color: '#FFFFFF',
      fontFamily:
        'Inter_700Bold',
      fontSize: 12,
      textAlign:
        'right',
    },

    smartSub: {
      color: '#B7D9D4',
      fontFamily:
        'Inter_400Regular',
      fontSize: 9,
      textAlign:
        'right',
      marginTop: 3,
    },

    detectedBox: {
      minHeight: 38,
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 12,
      flexDirection:
        'row-reverse',
      alignItems:
        'center',
      justifyContent:
        'flex-start',
      gap: 7,
      marginBottom: 18,
    },

    detectedText: {
      fontFamily:
        'Inter_400Regular',
      fontSize: 10,
      textAlign:
        'right',
    },

    useButton: {
      minHeight: 54,
      borderRadius: 15,
      flexDirection:
        'row-reverse',
      alignItems:
        'center',
      justifyContent:
        'center',
      gap: 8,
      marginTop: 4,
    },

    useButtonText: {
      fontFamily:
        'Inter_700Bold',
      fontSize: 13,
    },

    footer: {
      textAlign:
        'center',
      fontFamily:
        'Inter_400Regular',
      fontSize: 9,
      marginTop: 12,
    },
  });