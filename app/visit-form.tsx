// app/visit-form.tsx

import React, { useEffect, useState } from 'react';

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

  /*
   * =========================================================
   * PARAMETERS
   * =========================================================
   */

  const params =
    useLocalSearchParams<{
      aiActions?: string;
      aiNotes?: string;
      aiRecommendations?: string;
      aiFollowUp?: string;

      schoolId?: string;
      type?: string;
      visitId?: string;
    }>();

  /*
   * =========================================================
   * BASIC DATA
   * =========================================================
   */

  const [schoolId, setSchoolId] =
    useState(
      String(
        params.schoolId ||
          schools?.[0]?.id ||
          ''
      )
    );

  const [type, setType] =
    useState(
      String(
        params.type ||
          visitTypes?.[0] ||
          'زيارة اختصاص'
      )
    );

  const [date, setDate] =
    useState(
      new Date()
        .toISOString()
        .slice(0, 10)
    );

  /*
   * =========================================================
   * الإجراءات والتوصيات منفصلة
   * =========================================================
   */

  const [actions, setActions] =
    useState('');

  const [
    recommendations,
    setRecommendations,
  ] = useState('');

  /*
   * =========================================================
   * PHOTO
   * =========================================================
   */

  const [
    photoUri,
    setPhotoUri,
  ] = useState<
    string | undefined
  >(undefined);

  /*
   * =========================================================
   * SAVE STATE
   * =========================================================
   */

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

  /*
   * =========================================================
   * EDIT MODE
   * =========================================================
   */

  const isEditMode =
    Boolean(params.visitId);

  /*
   * =========================================================
   * LOAD EXISTING VISIT
   * =========================================================
   */

  useEffect(() => {
    if (
      !params.visitId ||
      !visits?.length
    ) {
      return;
    }

    const existingVisit =
      visits.find(
        (item) =>
          item.id ===
          String(params.visitId)
      );

    if (!existingVisit) {
      return;
    }

    /*
     * المدرسة
     */

    setSchoolId(
      String(
        existingVisit.schoolId
      )
    );

    /*
     * نوع الزيارة
     */

    setType(
      String(
        existingVisit.type
      )
    );

    /*
     * التاريخ
     */

    setDate(
      String(
        existingVisit.date
      )
    );

    /*
     * الإجراءات
     */

    setActions(
      String(
        existingVisit.actions ||
          ''
      )
    );

    /*
     * التوصيات
     *
     * نستخدمها إذا كانت موجودة في
     * الزيارة القديمة.
     */

    setRecommendations(
      String(
        (existingVisit as any)
          .recommendations ||
          ''
      )
    );

    /*
     * الصورة
     */

    setPhotoUri(
      existingVisit.photoUri
    );
  }, [
    params.visitId,
    visits,
  ]);

  /*
   * =========================================================
   * استقبال بيانات الذكاء الاصطناعي
   * =========================================================
   */

  useEffect(() => {
    /*
     * الإجراءات القادمة من الذكاء الاصطناعي
     */

    if (
      params.aiActions !==
      undefined
    ) {
      setActions(
        String(
          params.aiActions
        )
      );
    }

    /*
     * التوصيات القادمة من الذكاء الاصطناعي
     */

    if (
      params.aiRecommendations !==
      undefined
    ) {
      setRecommendations(
        String(
          params.aiRecommendations
        )
      );
    }

    /*
     * في حال كان المساعد الذكي يعيد
     * ملاحظات منفصلة، نضيفها إلى
     * الإجراءات فقط إذا لم توجد إجراءات.
     *
     * هذا يمنع دمج الإجراءات والتوصيات.
     */

    if (
      params.aiNotes !==
        undefined &&
      !params.aiActions
    ) {
      setActions(
        String(
          params.aiNotes
        )
      );
    }

    /*
     * خطة المتابعة تعتبر جزءًا من
     * التوصيات إذا لم توجد توصيات.
     */

    if (
      params.aiFollowUp !==
        undefined &&
      !params.aiRecommendations
    ) {
      setRecommendations(
        String(
          params.aiFollowUp
        )
      );
    }
  }, [
    params.aiActions,
    params.aiNotes,
    params.aiRecommendations,
    params.aiFollowUp,
  ]);

  /*
   * =========================================================
   * فتح الكاميرا
   * =========================================================
   */

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

          setMessage('');
          setMessageType('');
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

  /*
   * =========================================================
   * فتح المساعد الذكي
   * =========================================================
   */

  const openAI = () => {
    router.push({
      pathname:
        '/visit-ai',

      params: {
        actions:
          actions || '',

        recommendations:
          recommendations || '',

        schoolId:
          schoolId || '',

        type:
          type || '',
      },
    });
  };

  /*
   * =========================================================
   * حفظ الزيارة
   * =========================================================
   */

  const saveVisit =
    async () => {
      if (saving) {
        return;
      }

      setMessage('');
      setMessageType('');

      /*
       * التأكد من وجود المدرسة
       */

      if (!schoolId) {
        setMessage(
          'يرجى اختيار المدرسة أولاً.'
        );

        setMessageType(
          'error'
        );

        return;
      }

      /*
       * التأكد من التاريخ
       */

      if (!date.trim()) {
        setMessage(
          'يرجى إدخال تاريخ الزيارة.'
        );

        setMessageType(
          'error'
        );

        return;
      }

      try {
        setSaving(true);

        /*
         * الزيارة الموجودة عند التعديل
         */

        const existingVisit =
          params.visitId
            ? visits.find(
                (item) =>
                  item.id ===
                  String(
                    params.visitId
                  )
              )
            : undefined;

        /*
         * =====================================================
         * بيانات الزيارة
         * =====================================================
         *
         * مهم:
         *
         * لا يوجد reason هنا.
         *
         * الإجراءات:
         * actions
         *
         * التوصيات:
         * recommendations
         */

        const visitData = {
          schoolId:
            String(schoolId),

          date:
            date.trim(),

          type:
            type.trim(),

          actions:
            actions.trim(),

          recommendations:
            recommendations.trim(),

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

        /*
         * =====================================================
         * تعديل زيارة
         * =====================================================
         */

        if (
          isEditMode &&
          params.visitId
        ) {
          await Promise.resolve(
            updateVisit(
              String(
                params.visitId
              ),
              visitData
            )
          );
        } else {
          /*
           * ===================================================
           * إضافة زيارة جديدة
           * ===================================================
           */

          await Promise.resolve(
            addVisit(
              visitData
            )
          );
        }

        /*
         * رسالة النجاح
         */

        setMessage(
          isEditMode
            ? 'تم تعديل الزيارة وحفظ التغييرات بنجاح.'
            : 'تم حفظ الزيارة بنجاح.'
        );

        setMessageType(
          'success'
        );

        /*
         * العودة بعد الحفظ
         */

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

  /*
   * =========================================================
   * USER INTERFACE
   * =========================================================
   */

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
      {/* =====================================================
          HEADER
          ===================================================== */}

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
            width: 35,
          }}
        />
      </View>

      {/* =====================================================
          CONTENT
          ===================================================== */}

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom:
              insets.bottom + 40,
          },
        ]}
      >
        {/* ===================================================
            المدرسة
            =================================================== */}

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
            {schools?.map(
              (school) => {
                const selected =
                  schoolId ===
                  school.id;

                return (
                  <Pressable
                    key={
                      school.id
                    }
                    onPress={() =>
                      setSchoolId(
                        school.id
                      )
                    }
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

        {/* ===================================================
            نوع الزيارة
            =================================================== */}

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
                  onPress={() =>
                    setType(
                      visitType
                    )
                  }
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

        {/* ===================================================
            التاريخ
            =================================================== */}

        <Field
          label="تاريخ الزيارة"
          value={date}
          onChangeText={
            setDate
          }
          placeholder="YYYY-MM-DD"
          c={c}
        />

        {/* ===================================================
            الإجراءات المتخذة
            =================================================== */}

        <Field
          label="الإجراءات المتخذة"
          value={actions}
          onChangeText={
            setActions
          }
          placeholder="اكتب الإجراءات التي تم اتخاذها أثناء الزيارة..."
          c={c}
          multiline
        />

        {/* ===================================================
            التوصيات
            =================================================== */}

        <Field
          label="التوصيات"
          value={
            recommendations
          }
          onChangeText={
            setRecommendations
          }
          placeholder="اكتب التوصيات والمقترحات التي ينبغي متابعتها..."
          c={c}
          multiline
        />

        {/* ===================================================
            الذكاء الاصطناعي
            =================================================== */}

        <Pressable
          onPress={openAI}
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
              تحسين سجل الزيارة
              بالذكاء الاصطناعي
            </Text>

            <Text
              style={
                styles.smartSub
              }
            >
              صياغة الإجراءات
              والتوصيات بصورة
              تربوية ومهنية
            </Text>
          </View>

          <Feather
            name="chevron-left"
            size={19}
            color="#FFFFFF"
          />
        </Pressable>

        {/* ===================================================
            الكاميرا
            =================================================== */}

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
              التقط صورة مباشرة
              من كاميرا الهاتف
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

        {/* ===================================================
            معاينة الصورة
            =================================================== */}

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

        {/* ===================================================
            رسالة
            =================================================== */}

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

        {/* ===================================================
            حفظ
            =================================================== */}

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
          اضغط على «حفظ الزيارة»
          لتسجيل الزيارة في التطبيق.
        </Text>
      </ScrollView>
    </View>
  );
}

/*
 * =========================================================
 * FIELD COMPONENT
 * =========================================================
 */

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

/*
 * =========================================================
 * STYLES
 * =========================================================
 */

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

      gap: 6,
    },

    removePhotoText: {
      color:
        '#B42318',

      fontFamily:
        'Inter_600SemiBold',

      fontSize: 11,
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
    },

    emptySchool: {
      minHeight: 60,

      borderWidth: 1,

      borderRadius: 13,

      paddingHorizontal: 12,

      flexDirection:
        'row-reverse',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 8,
    },

    emptySchoolText: {
      fontFamily:
        'Inter_500Medium',

      fontSize: 11,

      textAlign:
        'right',

      flexShrink: 1,
    },
  });