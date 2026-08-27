// app/visit-form.tsx

import React, { useEffect, useMemo, useState } from 'react';

import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';

import { Feather } from '@expo/vector-icons';

import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';

import {
  useStore,
  visitTypes,
} from '@/context/AppContext';

/* =========================================================
   HELPERS
========================================================= */

function asString(
  value?: string | string[] | null
) {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value?.toString() ?? '';
}

/*
 * بناء النص الموحد الذي سيتم تخزينه في actions.
 *
 * مهم:
 * visit-details-table-final.tsx يعتمد على هذه العناوين
 * لاستخراج الأقسام الأربعة من التقرير.
 */
function buildStructuredActions({
  actions,
  notes,
  recommendations,
  followUp,
}: {
  actions: string;
  notes: string;
  recommendations: string;
  followUp: string;
}) {
  const sections: string[] = [];

  const cleanActions = actions.trim();
  const cleanNotes = notes.trim();
  const cleanRecommendations =
    recommendations.trim();
  const cleanFollowUp = followUp.trim();

  if (cleanActions) {
    sections.push(
      `الإجراءات:\n${cleanActions}`
    );
  }

  if (cleanNotes) {
    sections.push(
      `الملاحظات:\n${cleanNotes}`
    );
  }

  if (cleanRecommendations) {
    sections.push(
      `التوصيات والإجراءات المقترحة:\n${cleanRecommendations}`
    );
  }

  if (cleanFollowUp) {
    sections.push(
      `خطة المتابعة:\n${cleanFollowUp}`
    );
  }

  return sections.join('\n\n');
}

/* =========================================================
   MAIN SCREEN
========================================================= */

export default function VisitForm() {
  const c = useColors();

  const insets =
    useSafeAreaInsets();

  const {
    schools,
    visits,
    addVisit,
    updateVisit,
  } = useStore();

  /* =======================================================
     PARAMETERS
  ======================================================= */

  const params =
    useLocalSearchParams<{
      visitId?: string;

      schoolId?: string;

      type?: string;

      visitType?: string;

      date?: string;

      actions?: string;

      procedure?: string;

      recommendations?: string;

      aiActions?: string;

      aiNotes?: string;

      aiRecommendations?: string;

      aiFollowUp?: string;
    }>();

  /* =======================================================
     EDIT MODE
  ======================================================= */

  const isEditMode =
    Boolean(params.visitId);

  /* =======================================================
     SCHOOL
  ======================================================= */

  const [schoolId, setSchoolId] =
    useState(
      asString(
        params.schoolId
      ) ||
        schools?.[0]?.id ||
        ''
    );

  /* =======================================================
     VISIT TYPE
  ======================================================= */

  const [type, setType] =
    useState(
      asString(
        params.type ||
          params.visitType
      ) ||
        visitTypes?.[0] ||
        'زيارة اختصاص'
    );

  /* =======================================================
     DATE
  ======================================================= */

  const [date, setDate] =
    useState(
      asString(params.date) ||
        new Date()
          .toISOString()
          .slice(0, 10)
    );

  /* =======================================================
     ACTIONS
  ======================================================= */

  const [actions, setActions] =
    useState(
      asString(
        params.actions ||
          params.procedure ||
          params.aiActions
      )
    );

  /* =======================================================
     AI NOTES
  ======================================================= */

  const [notes, setNotes] =
    useState(
      asString(
        params.aiNotes
      )
    );

  /* =======================================================
     RECOMMENDATIONS
  ======================================================= */

  const [
    recommendations,
    setRecommendations,
  ] = useState(
    asString(
      params.aiRecommendations ||
        params.recommendations
    )
  );

  /* =======================================================
     FOLLOW UP
  ======================================================= */

  const [
    followUp,
    setFollowUp,
  ] = useState(
    asString(
      params.aiFollowUp
    )
  );

  /* =======================================================
     PHOTO
  ======================================================= */

  const [
    photoUri,
    setPhotoUri,
  ] = useState<
    string | undefined
  >(undefined);

  /* =======================================================
     SAVE STATE
  ======================================================= */

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState('');

  const [
    messageType,
    setMessageType,
  ] = useState<
    'error' | 'success' | ''
  >('');

  /* =======================================================
     EXISTING VISIT
  ======================================================= */

  const existingVisit =
    useMemo(
      () =>
        params.visitId
          ? visits.find(
              (item) =>
                item.id ===
                String(
                  params.visitId
                )
            )
          : undefined,
      [
        params.visitId,
        visits,
      ]
    );

  /* =======================================================
     SELECTED SCHOOL
  ======================================================= */

  const selectedSchool =
    useMemo(
      () =>
        schools.find(
          (school) =>
            school.id ===
            schoolId
        ),
      [
        schools,
        schoolId,
      ]
    );

  /* =======================================================
     PREVIOUS VISIT
  ======================================================= */

  const previousVisits =
    useMemo(
      () =>
        visits
          .filter(
            (visit) =>
              visit.schoolId ===
                schoolId &&
              visit.id !==
                String(
                  params.visitId ||
                    ''
                )
          )
          .sort((a, b) =>
            b.date.localeCompare(
              a.date
            )
          ),
      [
        visits,
        schoolId,
        params.visitId,
      ]
    );

  const latestVisit =
    previousVisits[0];

  /* =======================================================
     LOAD EXISTING VISIT
  ======================================================= */

  useEffect(() => {
    if (!existingVisit) {
      return;
    }

    setSchoolId(
      String(
        existingVisit.schoolId
      )
    );

    setType(
      String(
        existingVisit.type
      )
    );

    setDate(
      String(
        existingVisit.date
      )
    );

    /*
     * إذا كانت الزيارة القديمة تحتوي على
     * نص منظم داخل actions، لا نعرضه كله
     * داخل حقل الإجراءات.
     *
     * نستخدمه كـ fallback فقط.
     */
    setActions(
      String(
        existingVisit.actions ||
          ''
      )
    );

    setRecommendations(
      String(
        (existingVisit as any)
          .recommendations ||
          ''
      )
    );

    /*
     * دعم البيانات الجديدة إذا أضيفت
     * إلى AppContext مستقبلاً.
     */
    setNotes(
      String(
        (existingVisit as any)
          .notes ||
          ''
      )
    );

    setFollowUp(
      String(
        (existingVisit as any)
          .followUp ||
          ''
      )
    );

    setPhotoUri(
      existingVisit.photoUri
    );
  }, [
    existingVisit,
  ]);

  /* =======================================================
     RECEIVE AI DATA
  ======================================================= */

  useEffect(() => {
    /*
     * الإجراءات
     */
    if (
      params.aiActions !==
      undefined
    ) {
      setActions(
        asString(
          params.aiActions
        )
      );
    } else if (
      params.actions !==
      undefined
    ) {
      setActions(
        asString(
          params.actions
        )
      );
    } else if (
      params.procedure !==
      undefined
    ) {
      setActions(
        asString(
          params.procedure
        )
      );
    }

    /*
     * الملاحظات
     */
    if (
      params.aiNotes !==
      undefined
    ) {
      setNotes(
        asString(
          params.aiNotes
        )
      );
    }

    /*
     * التوصيات
     */
    if (
      params.aiRecommendations !==
      undefined
    ) {
      setRecommendations(
        asString(
          params.aiRecommendations
        )
      );
    } else if (
      params.recommendations !==
      undefined
    ) {
      setRecommendations(
        asString(
          params.recommendations
        )
      );
    }

    /*
     * خطة المتابعة
     */
    if (
      params.aiFollowUp !==
      undefined
    ) {
      setFollowUp(
        asString(
          params.aiFollowUp
        )
      );
    }
  }, [
    params.aiActions,
    params.aiNotes,
    params.aiRecommendations,
    params.aiFollowUp,
    params.actions,
    params.procedure,
    params.recommendations,
  ]);

  /* =======================================================
     CLEAR MESSAGE
  ======================================================= */

  const clearMessage = () => {
    if (
      messageType ===
      'error'
    ) {
      setMessage('');
      setMessageType('');
    }
  };

  /* =======================================================
     OPEN CAMERA
  ======================================================= */

  const takePhoto =
    async () => {
      try {
        const permission =
          await ImagePicker.requestCameraPermissionsAsync();

        if (!permission.granted) {
          setMessage(
            'يرجى السماح للتطبيق باستخدام الكاميرا لتصوير سجل الزيارة.'
          );

          setMessageType(
            'error'
          );

          return;
        }

        const result =
          await ImagePicker.launchCameraAsync(
            {
              mediaTypes: [
                'images',
              ],
              quality: 0.8,
              allowsEditing: true,
            }
          );

        if (
          !result.canceled &&
          result.assets &&
          result.assets.length >
            0
        ) {
          setPhotoUri(
            result.assets[0].uri
          );

          clearMessage();
        }
      } catch (error) {
        console.error(
          'Camera error:',
          error
        );

        setMessage(
          'تعذر فتح الكاميرا. حاول مرة أخرى.'
        );

        setMessageType(
          'error'
        );
      }
    };

  /* =======================================================
     OPEN AI
  ======================================================= */

  const openAI = () => {
    if (!schoolId) {
      setMessage(
        'يرجى اختيار المدرسة أولاً.'
      );

      setMessageType(
        'error'
      );

      return;
    }

    if (!type.trim()) {
      setMessage(
        'يرجى اختيار نوع الزيارة أولاً.'
      );

      setMessageType(
        'error'
      );

      return;
    }

    router.push({
      pathname:
        '/visit-ai',

      params: {
        visitId:
          params.visitId?.toString() ||
          '',

        schoolId:
          schoolId.toString(),

        schoolName:
          selectedSchool?.name ||
          '',

        visitType:
          type.toString(),

        type:
          type.toString(),

        date:
          date.toString(),

        actions:
          actions.toString(),

        procedure:
          actions.toString(),

        recommendations:
          recommendations.toString(),

        aiNotes:
          notes.toString(),

        aiRecommendations:
          recommendations.toString(),

        aiFollowUp:
          followUp.toString(),
      },
    });
  };

  /* =======================================================
     SAVE VISIT
  ======================================================= */

  const saveVisit =
    async () => {
      if (saving) {
        return;
      }

      setMessage('');
      setMessageType('');

      /* المدرسة */

      if (!schoolId) {
        setMessage(
          'يرجى اختيار المدرسة أولاً.'
        );

        setMessageType(
          'error'
        );

        return;
      }

      /* التاريخ */

      if (!date.trim()) {
        setMessage(
          'يرجى إدخال تاريخ الزيارة.'
        );

        setMessageType(
          'error'
        );

        return;
      }

      /* نوع الزيارة */

      if (!type.trim()) {
        setMessage(
          'يرجى اختيار نوع الزيارة.'
        );

        setMessageType(
          'error'
        );

        return;
      }

      /*
       * الإجراءات أو أي جزء من صياغة AI
       */

      if (
        !actions.trim() &&
        !notes.trim() &&
        !recommendations.trim() &&
        !followUp.trim()
      ) {
        setMessage(
          'يرجى إدخال الإجراءات أو استخدام المساعد الذكي لإعداد صياغة الزيارة.'
        );

        setMessageType(
          'error'
        );

        return;
      }

      try {
        setSaving(true);

        /*
         * ===================================================
         * أهم نقطة في الإصلاح
         *
         * لا نحفظ الملاحظات وخطة المتابعة بشكل منفصل
         * فقط، لأن تقرير الزيارة الحالي يستخرجها
         * من actions.
         *
         * لذلك نبني نسخة منظمة ومتوافقة مع التقرير.
         * ===================================================
         */

        const structuredActions =
          buildStructuredActions({
            actions,
            notes,
            recommendations,
            followUp,
          });

        /*
         * إذا لم توجد بيانات AI،
         * نحتفظ بالإجراءات كما هي.
         */
        const finalActions =
          structuredActions ||
          actions.trim();

        /*
         * نحافظ أيضًا على حقل recommendations
         * حتى تبقى البيانات متوافقة مع AppContext
         * والزيارات السابقة.
         */
        const finalRecommendations =
          recommendations.trim();

        const visitData = {
          schoolId:
            String(
              schoolId
            ),

          date:
            date.trim(),

          type:
            type.trim(),

          actions:
            finalActions,

          recommendations:
            finalRecommendations,

          /*
           * دعم إضافي للنسخ المستقبلية من AppContext.
           * لن يسبب مشكلة إذا كان AppContext الحالي
           * يتجاهل الحقول الإضافية.
           */
          notes:
            notes.trim(),

          followUp:
            followUp.trim(),

          status:
            existingVisit?.status ||
            'completed',

          photoUri:
            photoUri,
        };

        console.log(
          '=============================='
        );

        console.log(
          isEditMode
            ? 'UPDATE VISIT DATA:'
            : 'SAVE VISIT DATA:',
          visitData
        );

        console.log(
          '=============================='
        );

        /* التعديل */

        if (
          isEditMode &&
          params.visitId
        ) {
          await Promise.resolve(
            updateVisit(
              String(
                params.visitId
              ),
              visitData as any
            )
          );
        } else {
          /* الإضافة */

          await Promise.resolve(
            addVisit(
              visitData as any
            )
          );
        }

        setMessage(
          isEditMode
            ? 'تم تعديل الزيارة وحفظ التغييرات بنجاح.'
            : 'تم حفظ الزيارة بنجاح.'
        );

        setMessageType(
          'success'
        );

        setTimeout(() => {
          router.back();
        }, 700);
      } catch (error) {
        console.error(
          '=============================='
        );

        console.error(
          'SAVE VISIT ERROR:',
          error
        );

        console.error(
          '=============================='
        );

        setMessage(
          'حدث خطأ أثناء حفظ الزيارة. تأكد من إعداد التخزين في AppContext.tsx.'
        );

        setMessageType(
          'error'
        );
      } finally {
        setSaving(false);
      }
    };

  /* =======================================================
     USER INTERFACE
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
      {/* HEADER */}

      <View
        style={[
          styles.header,
          {
            paddingTop:
              insets.top + 12,

            borderBottomColor:
              c.border,
          },
        ]}
      >
        <Pressable
          onPress={() =>
            router.back()
          }
          style={
            styles.backButton
          }
        >
          <Feather
            name="arrow-right"
            size={23}
            color={
              c.foreground
            }
          />
        </Pressable>

        <Text
          style={[
            styles.title,
            {
              color:
                c.foreground,
            },
          ]}
        >
          {isEditMode
            ? 'تعديل الزيارة'
            : 'تسجيل زيارة'}
        </Text>

        <View
          style={{
            width: 36,
          }}
        />
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
              insets.bottom +
              40,
          },
        ]}
      >
        {/* المدرسة */}

        <Text
          style={[
            styles.label,
            {
              color:
                c.foreground,
            },
          ]}
        >
          المدرسة
        </Text>

        {schools?.length ===
        0 ? (
          <View
            style={[
              styles.emptySchool,
              {
                backgroundColor:
                  c.card,
                borderColor:
                  c.border,
              },
            ]}
          >
            <Feather
              name="alert-circle"
              size={20}
              color={
                c.mutedForeground
              }
            />

            <Text
              style={[
                styles.emptySchoolText,
                {
                  color:
                    c.mutedForeground,
                },
              ]}
            >
              لا توجد مدارس مسجلة.
              يرجى إضافة مدرسة أولاً.
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.chips
            }
          >
            {schools.map(
              (school) => {
                const selected =
                  schoolId ===
                  school.id;

                return (
                  <Pressable
                    key={
                      school.id
                    }
                    onPress={() => {
                      setSchoolId(
                        school.id
                      );
                      clearMessage();
                    }}
                    style={[
                      styles.chip,
                      {
                        backgroundColor:
                          selected
                            ? c.primary
                            : c.card,

                        borderColor:
                          selected
                            ? c.primary
                            : c.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color:
                          selected
                            ? c.primaryForeground
                            : c.foreground,

                        fontFamily:
                          'Inter_500Medium',

                        fontSize: 11,
                      }}
                    >
                      {
                        school.name
                      }
                    </Text>
                  </Pressable>
                );
              }
            )}
          </ScrollView>
        )}

        {selectedSchool ? (
          <Text
            style={[
              styles.selectedSchool,
              {
                color:
                  c.mutedForeground,
              },
            ]}
          >
            المدرسة المحددة:
            {' '}
            {
              selectedSchool.name
            }
          </Text>
        ) : null}

        {/* آخر زيارة */}

        {selectedSchool ? (
          <View
            style={[
              styles.previousVisitCard,
              {
                backgroundColor:
                  c.secondary,
                borderColor:
                  c.border,
              },
            ]}
          >
            <View
              style={
                styles.previousVisitHeader
              }
            >
              <View
                style={[
                  styles.previousVisitIcon,
                  {
                    backgroundColor:
                      c.primary,
                  },
                ]}
              >
                <Feather
                  name="clock"
                  size={18}
                  color={
                    c.primaryForeground
                  }
                />
              </View>

              <View
                style={{
                  flex: 1,
                }}
              >
                <Text
                  style={[
                    styles.previousVisitTitle,
                    {
                      color:
                        c.foreground,
                    },
                  ]}
                >
                  آخر زيارة للمدرسة
                </Text>

                <Text
                  style={[
                    styles.previousVisitSchool,
                    {
                      color:
                        c.mutedForeground,
                    },
                  ]}
                >
                  {
                    selectedSchool.name
                  }
                </Text>
              </View>
            </View>

            {latestVisit ? (
              <View
                style={
                  styles.previousVisitBody
                }
              >
                <View
                  style={
                    styles.previousVisitRow
                  }
                >
                  <Text
                    style={[
                      styles.previousVisitValue,
                      {
                        color:
                          c.foreground,
                      },
                    ]}
                  >
                    {
                      latestVisit.date
                    }
                  </Text>

                  <Text
                    style={[
                      styles.previousVisitLabel,
                      {
                        color:
                          c.mutedForeground,
                      },
                    ]}
                  >
                    التاريخ
                  </Text>
                </View>

                <View
                  style={
                    styles.previousVisitRow
                  }
                >
                  <Text
                    style={[
                      styles.previousVisitValue,
                      {
                        color:
                          c.primary,
                      },
                    ]}
                  >
                    {
                      latestVisit.type ||
                      'زيارة مدرسية'
                    }
                  </Text>

                  <Text
                    style={[
                      styles.previousVisitLabel,
                      {
                        color:
                          c.mutedForeground,
                      },
                    ]}
                  >
                    نوع الزيارة
                  </Text>
                </View>

                {latestVisit.actions ? (
                  <View
                    style={
                      styles.previousTextBlock
                    }
                  >
                    <Text
                      style={[
                        styles.previousVisitLabel,
                        {
                          color:
                            c.mutedForeground,
                        },
                      ]}
                    >
                      الإجراءات السابقة
                    </Text>

                    <Text
                      style={[
                        styles.previousVisitText,
                        {
                          color:
                            c.foreground,
                        },
                      ]}
                      numberOfLines={
                        4
                      }
                    >
                      {
                        latestVisit.actions
                      }
                    </Text>
                  </View>
                ) : null}

                {(
                  latestVisit as any
                ).recommendations ? (
                  <View
                    style={
                      styles.previousTextBlock
                    }
                  >
                    <Text
                      style={[
                        styles.previousVisitLabel,
                        {
                          color:
                            c.mutedForeground,
                        },
                      ]}
                    >
                      التوصيات السابقة
                    </Text>

                    <Text
                      style={[
                        styles.previousVisitText,
                        {
                          color:
                            c.foreground,
                        },
                      ]}
                      numberOfLines={
                        4
                      }
                    >
                      {
                        (
                          latestVisit as any
                        ).recommendations
                      }
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <Text
                style={[
                  styles.noPreviousVisit,
                  {
                    color:
                      c.mutedForeground,
                  },
                ]}
              >
                لا توجد زيارة سابقة
                مسجلة لهذه المدرسة.
              </Text>
            )}
          </View>
        ) : null}

        {/* نوع الزيارة */}

        <Text
          style={[
            styles.label,
            {
              color:
                c.foreground,
            },
          ]}
        >
          نوع الزيارة
        </Text>

        <View
          style={
            styles.wrap
          }
        >
          {visitTypes.map(
            (visitType) => {
              const selected =
                type ===
                visitType;

              return (
                <Pressable
                  key={
                    visitType
                  }
                  onPress={() => {
                    setType(
                      visitType
                    );
                    clearMessage();
                  }}
                  style={[
                    styles.type,
                    {
                      backgroundColor:
                        selected
                          ? c.secondary
                          : c.card,

                      borderColor:
                        selected
                          ? c.primary
                          : c.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color:
                        selected
                          ? c.primary
                          : c.foreground,

                      fontFamily:
                        'Inter_500Medium',

                      fontSize: 11,
                    }}
                  >
                    {
                      visitType
                    }
                  </Text>
                </Pressable>
              );
            }
          )}
        </View>

        {/* التاريخ */}

        <Field
          label="تاريخ الزيارة"
          value={date}
          onChangeText={(
            value: string
          ) => {
            setDate(value);
            clearMessage();
          }}
          placeholder="YYYY-MM-DD"
          c={c}
        />

        {/* الإجراءات */}

        <Field
          label="الإجراءات"
          value={actions}
          onChangeText={(
            value: string
          ) => {
            setActions(value);
            clearMessage();
          }}
          placeholder="اكتب ما تم القيام به أثناء الزيارة..."
          c={c}
          multiline
        />

        {/* الملاحظات */}

        <Field
          label="الملاحظات"
          value={notes}
          onChangeText={(
            value: string
          ) => {
            setNotes(value);
            clearMessage();
          }}
          placeholder="اكتب الملاحظات والمشاهدات..."
          c={c}
          multiline
        />

        {/* التوصيات */}

        <Field
          label="التوصيات والإجراءات المقترحة"
          value={
            recommendations
          }
          onChangeText={(
            value: string
          ) => {
            setRecommendations(
              value
            );
            clearMessage();
          }}
          placeholder="اكتب التوصيات والإجراءات المقترحة..."
          c={c}
          multiline
        />

        {/* خطة المتابعة */}

        <Field
          label="خطة المتابعة"
          value={followUp}
          onChangeText={(
            value: string
          ) => {
            setFollowUp(value);
            clearMessage();
          }}
          placeholder="اكتب خطة المتابعة..."
          c={c}
          multiline
        />

        {/* AI */}

        <Pressable
          onPress={
            openAI
          }
          style={[
            styles.smartButton,
            {
              backgroundColor:
                c.navy,
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
            <Feather
              name="cpu"
              size={21}
              color={
                c.navy
              }
            />
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
              المساعد الذكي للزيارة
            </Text>

            <Text
              style={
                styles.smartSub
              }
            >
              إعداد الملاحظات والتوصيات وخطة المتابعة اعتمادًا على بيانات الزيارة
            </Text>
          </View>

          <Feather
            name="chevron-left"
            size={19}
            color="#FFFFFF"
          />
        </Pressable>

        {/* الكاميرا */}

        <Pressable
          onPress={
            takePhoto
          }
          style={[
            styles.camera,
            {
              backgroundColor:
                c.secondary,

              borderColor:
                c.border,
            },
          ]}
        >
          <View
            style={[
              styles.cameraIcon,
              {
                backgroundColor:
                  c.primary,
              },
            ]}
          >
            <Feather
              name="camera"
              size={20}
              color={
                c.primaryForeground
              }
            />
          </View>

          <View
            style={{
              flex: 1,
            }}
          >
            <Text
              style={[
                styles.cameraTitle,
                {
                  color:
                    c.foreground,
                },
              ]}
            >
              {photoUri
                ? 'تم إرفاق صورة السجل'
                : 'تصوير سجل الزيارة'}
            </Text>

            <Text
              style={[
                styles.cameraSub,
                {
                  color:
                    c.mutedForeground,
                },
              ]}
            >
              التقط صورة مباشرة من كاميرا الهاتف
            </Text>
          </View>

          <Feather
            name="chevron-left"
            size={18}
            color={
              c.mutedForeground
            }
          />
        </Pressable>

        {/* الصورة */}

        {photoUri ? (
          <View>
            <Image
              source={{
                uri: photoUri,
              }}
              style={
                styles.preview
              }
            />

            <Pressable
              onPress={() =>
                setPhotoUri(
                  undefined
                )
              }
              style={[
                styles.removePhoto,
                {
                  backgroundColor:
                    c.card,

                  borderColor:
                    c.border,
                },
              ]}
            >
              <Feather
                name="trash-2"
                size={16}
                color="#B42318"
              />

              <Text
                style={
                  styles.removePhotoText
                }
              >
                حذف الصورة
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* الرسالة */}

        {message ? (
          <View
            style={[
              styles.messageBox,
              {
                backgroundColor:
                  messageType ===
                  'success'
                    ? '#E8F7F3'
                    : '#FEECEC',

                borderColor:
                  messageType ===
                  'success'
                    ? c.primary
                    : '#E5A3A3',
              },
            ]}
          >
            <Feather
              name={
                messageType ===
                'success'
                  ? 'check-circle'
                  : 'alert-circle'
              }
              size={19}
              color={
                messageType ===
                'success'
                  ? c.primary
                  : '#B42318'
              }
            />

            <Text
              style={[
                styles.messageText,
                {
                  color:
                    messageType ===
                    'success'
                      ? c.primary
                      : '#B42318',
                },
              ]}
            >
              {
                message
              }
            </Text>
          </View>
        ) : null}

        {/* الحفظ */}

        <Pressable
          onPress={
            saveVisit
          }
          disabled={
            saving
          }
          style={[
            styles.save,
            {
              backgroundColor:
                c.primary,

              opacity:
                saving
                  ? 0.55
                  : 1,
            },
          ]}
        >
          <Feather
            name={
              saving
                ? 'loader'
                : 'check-circle'
            }
            size={20}
            color={
              c.primaryForeground
            }
          />

          <Text
            style={{
              color:
                c.primaryForeground,

              fontFamily:
                'Inter_700Bold',

              fontSize: 13,
            }}
          >
            {saving
              ? 'جارٍ حفظ الزيارة...'
              : isEditMode
                ? 'حفظ التعديلات'
                : 'حفظ الزيارة'}
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
          اضغط على «حفظ الزيارة» لتسجيل الزيارة في التطبيق.
        </Text>
      </ScrollView>
    </View>
  );
}

/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  c,
}: any) {
  return (
    <View
      style={
        styles.field
      }
    >
      <Text
        style={[
          styles.label,
          {
            color:
              c.foreground,
          },
        ]}
      >
        {label}
      </Text>

      <TextInput
        value={
          value
        }
        onChangeText={
          onChangeText
        }
        placeholder={
          placeholder
        }
        placeholderTextColor={
          c.mutedForeground
        }
        multiline={
          multiline
        }
        textAlign="right"
        textAlignVertical={
          multiline
            ? 'top'
            : 'center'
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

            minHeight:
              multiline
                ? 100
                : 48,
          },
        ]}
      />
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

    content: {
      paddingHorizontal: 12,
      paddingTop: 4,
    },

    header: {
      flexDirection:
        'row-reverse',
      alignItems:
        'center',
      justifyContent:
        'space-between',
      paddingHorizontal: 14,
      paddingBottom: 14,
      borderBottomWidth: 1,
    },

    backButton: {
      width: 36,
      height: 36,
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    title: {
      fontFamily:
        'Inter_700Bold',
      fontSize: 20,
    },

    label: {
      fontFamily:
        'Inter_600SemiBold',
      fontSize: 12,
      textAlign:
        'right',
      marginTop: 12,
      marginBottom: 8,
    },

    chips: {
      flexDirection:
        'row',
      gap: 8,
      paddingBottom: 3,
    },

    chip: {
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },

    selectedSchool: {
      fontFamily:
        'Inter_400Regular',
      fontSize: 9,
      textAlign:
        'right',
      marginTop: 5,
      marginBottom: 2,
    },

    emptySchool: {
      minHeight: 80,
      borderWidth: 1,
      borderRadius: 13,
      padding: 14,
      flexDirection:
        'row-reverse',
      alignItems:
        'center',
      gap: 10,
    },

    emptySchoolText: {
      flex: 1,
      fontFamily:
        'Inter_400Regular',
      fontSize: 11,
      textAlign:
        'right',
      lineHeight: 20,
    },

    wrap: {
      flexDirection:
        'row-reverse',
      flexWrap:
        'wrap',
      gap: 7,
    },

    type: {
      borderWidth: 1,
      borderRadius: 11,
      paddingHorizontal: 10,
      paddingVertical: 9,
    },

    field: {
      marginTop: 3,
    },

    input: {
      borderWidth: 1,
      borderRadius: 13,
      paddingHorizontal: 13,
      paddingVertical: 11,
      fontFamily:
        'Inter_400Regular',
      fontSize: 13,
      marginBottom: 3,
      lineHeight: 21,
    },

    previousVisitCard: {
      borderWidth: 1,
      borderRadius: 16,
      padding: 13,
      marginTop: 14,
    },

    previousVisitHeader: {
      flexDirection:
        'row-reverse',
      alignItems:
        'center',
      gap: 10,
    },

    previousVisitIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    previousVisitTitle: {
      fontFamily:
        'Inter_700Bold',
      fontSize: 12,
      textAlign:
        'right',
    },

    previousVisitSchool: {
      fontFamily:
        'Inter_400Regular',
      fontSize: 10,
      marginTop: 3,
      textAlign:
        'right',
    },

    previousVisitBody: {
      marginTop: 12,
      gap: 8,
    },

    previousVisitRow: {
      flexDirection:
        'row-reverse',
      justifyContent:
        'space-between',
      alignItems:
        'center',
      paddingVertical: 4,
    },

    previousVisitLabel: {
      fontFamily:
        'Inter_500Medium',
      fontSize: 10,
      textAlign:
        'right',
    },

    previousVisitValue: {
      fontFamily:
        'Inter_600SemiBold',
      fontSize: 11,
      textAlign:
        'right',
      flexShrink: 1,
    },

    previousTextBlock: {
      borderTopWidth: 1,
      borderTopColor:
        'rgba(0,0,0,0.06)',
      paddingTop: 8,
      marginTop: 2,
    },

    previousVisitText: {
      fontFamily:
        'Inter_400Regular',
      fontSize: 10,
      lineHeight: 18,
      textAlign:
        'right',
      marginTop: 4,
    },

    noPreviousVisit: {
      fontFamily:
        'Inter_400Regular',
      fontSize: 10,
      textAlign:
        'right',
      marginTop: 10,
    },

    smartButton: {
      minHeight: 72,
      borderRadius: 17,
      paddingHorizontal: 13,
      flexDirection:
        'row-reverse',
      alignItems:
        'center',
      gap: 10,
      marginTop: 16,
      marginBottom: 14,
    },

    smartIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    smartTitle: {
      color:
        '#FFFFFF',
      fontFamily:
        'Inter_700Bold',
      fontSize: 12,
      textAlign:
        'right',
    },

    smartSub: {
      color:
        '#B7D9D4',
      fontFamily:
        'Inter_400Regular',
      fontSize: 9,
      textAlign:
        'right',
      marginTop: 3,
      lineHeight: 15,
    },

    camera: {
      borderRadius: 16,
      borderWidth: 1,
      padding: 12,
      flexDirection:
        'row-reverse',
      alignItems:
        'center',
      gap: 10,
      marginTop: 2,
    },

    cameraIcon: {
      width: 42,
      height: 42,
      borderRadius: 13,
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    cameraTitle: {
      fontFamily:
        'Inter_600SemiBold',
      textAlign:
        'right',
      fontSize: 13,
    },

    cameraSub: {
      fontFamily:
        'Inter_400Regular',
      textAlign:
        'right',
      fontSize: 10,
      marginTop: 4,
      lineHeight: 15,
    },

    preview: {
      width: '100%',
      height: 180,
      borderRadius: 15,
      marginTop: 10,
    },

    removePhoto: {
      marginTop: 8,
      borderWidth: 1,
      borderRadius: 11,
      minHeight: 40,
      flexDirection:
        'row-reverse',
      alignItems:
        'center',
      justifyContent:
        'center',
      gap: 7,
    },

    removePhotoText: {
      fontFamily:
        'Inter_500Medium',
      fontSize: 11,
      color:
        '#B42318',
    },

    messageBox: {
      minHeight: 46,
      borderWidth: 1,
      borderRadius: 13,
      paddingHorizontal: 12,
      paddingVertical: 10,
      flexDirection:
        'row-reverse',
      alignItems:
        'center',
      justifyContent:
        'center',
      gap: 8,
      marginTop: 14,
    },

    messageText: {
      fontFamily:
        'Inter_600SemiBold',
      fontSize: 11,
      textAlign:
        'right',
      flexShrink: 1,
    },

    save: {
      minHeight: 55,
      borderRadius: 15,
      flexDirection:
        'row-reverse',
      alignItems:
        'center',
      justifyContent:
        'center',
      gap: 8,
      marginTop: 14,
    },

    footer: {
      textAlign:
        'center',
      fontFamily:
        'Inter_400Regular',
      fontSize: 9,
      marginTop: 10,
      lineHeight: 16,
    },
  });