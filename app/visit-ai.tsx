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

type VisitType = string;

/* =========================================================
   VISIT TYPE LABELS
   نوع الزيارة
========================================================= */

const VISIT_TYPE_LABELS: Record<string, string> = {
  'زيارة اختصاص': 'زيارة اختصاص',
  'زيارة متابعة': 'زيارة متابعة',
  'زيارة صديق ناقد': 'زيارة صديق ناقد',
  'زيارة تحقق': 'زيارة تحقق',
  'زيارة تحقيق': 'زيارة تحقيق',
  'زيارة تقويمية': 'زيارة تقويمية',
  'زيارة غير تقويمية': 'زيارة غير تقويمية',
};

/* =========================================================
   NORMALIZE VISIT TYPE

   نوع الزيارة يأتي مباشرة من visit-form
   ولا يتم استنتاجه من الإجراءات.
========================================================= */

function normalizeVisitType(
  value?: string | string[]
): VisitType {
  const type = Array.isArray(value) ? value[0] : value;
  return type?.trim() || 'زيارة متابعة';
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

    /*
     * نوع الزيارة
     */
    visitType?: string;

    /*
     * الإجراءات
     */
    procedure?: string;
    actions?: string;

    /*
     * بيانات الذكاء الاصطناعي
     */
    aiActions?: string;
    aiNotes?: string;
    aiRecommendations?: string;
    aiFollowUp?: string;
  }>();

  /* =======================================================
     VISIT TYPE
  ======================================================= */

  const visitType = useMemo(() => {
    return normalizeVisitType(
      params.visitType
    );
  }, [params.visitType]);

  const typeLabel =
    VISIT_TYPE_LABELS[visitType];

  /* =======================================================
     INITIAL PROCEDURE
  ======================================================= */

  const initialProcedure = useMemo(() => {
    return (
      params.procedure ||
      params.actions ||
      params.aiActions ||
      ''
    ).toString();
  }, [
    params.procedure,
    params.actions,
    params.aiActions,
  ]);

  const [procedure, setProcedure] =
    useState(initialProcedure);

  const [actions, setActions] =
    useState(initialProcedure);

  /* =======================================================
     AI TEXT
  ======================================================= */

  const [notes, setNotes] =
    useState(
      params.aiNotes?.toString() ||
        'اضغط على «إعداد الصياغة الذكية» لإنشاء الملاحظات المناسبة لنوع الزيارة والإجراءات المحددة.'
    );

  const [recommendations, setRecommendations] =
    useState(
      params.aiRecommendations?.toString() ||
        'سيتم إنشاء التوصيات والإجراءات المقترحة بناءً على نوع الزيارة والإجراءات المحددة.'
    );

  const [followUp, setFollowUp] =
    useState(
      params.aiFollowUp?.toString() ||
        'سيتم إنشاء خطة متابعة مرتبطة مباشرة بنوع الزيارة والإجراءات بعد إعداد الصياغة الذكية.'
    );

  const [loading, setLoading] =
    useState(false);

  /* =======================================================
     PREPARE AI
  ======================================================= */

  const prepareAI = async () => {
    setLoading(true);

    try {
      const currentProcedure =
        actions.trim() ||
        procedure.trim();

      if (!currentProcedure) {
        throw new Error(
          'يرجى إدخال الإجراءات أو التوصيات أولًا.'
        );
      }

      const schoolName =
        params.schoolName?.toString() || '';

      /* ===================================================
         إرسال البيانات إلى الخادم

         visitType = نوع الزيارة
         procedure = الإجراءات
         schoolName = اسم المدرسة
      =================================================== */

      /*
       * عنوان خدمة الذكاء الاصطناعي:
       * - في نسخة APK نستخدم Worker المنشور.
       * - EXPO_PUBLIC_API_URL له الأولوية إذا تم تعريفه.
       *
       * لا نستخدم localhost كقيمة احتياطية في الهاتف،
       * لأن localhost على الهاتف يشير إلى الهاتف نفسه.
       */
      const apiBaseUrl = (
        process.env.EXPO_PUBLIC_API_URL ||
        'https://edu-supervision-ai-worker.alshamiasc3.workers.dev'
      ).replace(/\/$/, '');

      const response = await fetch(
        `${apiBaseUrl}/api/ai/visit-draft`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            visitType: visitType,

            procedure:
              currentProcedure,

            schoolName:
              schoolName,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok || !data?.ok) {
        throw new Error(
          data?.error ||
            'تعذر الاتصال بخدمة الذكاء الاصطناعي.'
        );
      }

      const draft =
        data.result;

      /* ===================================================
         NOTES
      =================================================== */

      setNotes(
        String(
          draft?.notes || ''
        ).trim()
      );

      /* ===================================================
         RECOMMENDATIONS
      =================================================== */

      setRecommendations(
        String(
          draft?.recommendations || ''
        ).trim()
      );

      /* ===================================================
         FOLLOW UP
      =================================================== */

      setFollowUp(
        String(
          draft?.followUp || ''
        ).trim()
      );

    } catch (error) {
      console.error(
        'AI visit draft error:',
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : 'حدث خطأ أثناء إعداد الصياغة الذكية.';

      setNotes(
        `تعذر إنشاء الصياغة الذكية: ${message}`
      );

      setRecommendations('');
      setFollowUp('');

    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     USE DRAFT

     إعادة البيانات إلى visit-form
  ======================================================= */

  const useDraft = () => {
    const finalActions =
      actions.trim() ||
      procedure.trim();

    router.push({
      pathname: '/visit-form',

      params: {
        visitId:
          params.visitId?.toString() || '',

        schoolName:
          params.schoolName?.toString() || '',

        /* نوع الزيارة */
        visitType:
          visitType,

        /* الإجراءات */
        procedure:
          finalActions,

        actions:
          finalActions,

        aiActions:
          finalActions,

        /* صياغة الذكاء الاصطناعي */
        aiNotes:
          notes,

        aiRecommendations:
          recommendations,

        aiFollowUp:
          followUp,
      },
    });
  };

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

            المعلومات الأساسية تظهر هنا فقط
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
          {/* =================================================
              المدرسة
          ================================================= */}

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

          {/* =================================================
              نوع الزيارة
          ================================================= */}

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
              نوع الزيارة
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
              {typeLabel}
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

          {/* =================================================
              الإجراءات
          ================================================= */}

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
            placeholder="اكتب الإجراءات أو التوصيات المطلوبة..."
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
              صياغة الزيارة اعتمادًا على نوع الزيارة والإجراءات
            </Text>
          </View>

          <Feather
            name="chevron-left"
            size={19}
            color="#FFFFFF"
          />
        </Pressable>

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
            استخدام الصياغة في الزيارة
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

    /* =====================================================
       HEADER
    ===================================================== */

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

    /* =====================================================
       CONTENT
    ===================================================== */

    content: {
      paddingHorizontal: 15,
      paddingTop: 16,
    },

    /* =====================================================
       INFORMATION CARD
    ===================================================== */

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

    /* =====================================================
       SECTION
    ===================================================== */

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

    /* =====================================================
       INPUT
    ===================================================== */

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

    /* =====================================================
       SMART BUTTON
    ===================================================== */

    smartButton: {
      minHeight: 70,
      borderRadius: 18,
      paddingHorizontal: 13,
      flexDirection:
        'row-reverse',
      alignItems:
        'center',
      gap: 10,
      marginBottom: 18,
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

    /* =====================================================
       USE BUTTON
    ===================================================== */

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

    /* =====================================================
       FOOTER
    ===================================================== */

    footer: {
      textAlign:
        'center',
      fontFamily:
        'Inter_400Regular',
      fontSize: 9,
      marginTop: 12,
    },
  });