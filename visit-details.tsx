
import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
} from 'react-native';

import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Print from 'expo-print';

import { useColors } from '@/hooks/useColors';
import { useStore, statusLabels } from '@/context/AppContext';

export default function VisitDetails() {
  const c = useColors();
  const insets = useSafeAreaInsets();

  const { visitId } =
    useLocalSearchParams<{ visitId?: string }>();

  const { visits, schools } = useStore();

  const visit = visits.find(
    (item) => item.id === visitId
  );

  if (!visit) {
    return (
      <View
        style={[
          styles.page,
          { backgroundColor: c.background },
        ]}
      >
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + 10,
              borderBottomColor: c.border,
            },
          ]}
        >
          <Pressable
            onPress={() => router.back()}
            style={styles.headerButton}
          >
            <Feather
              name="arrow-right"
              size={23}
              color={c.foreground}
            />
          </Pressable>

          <View style={styles.headerText}>
            <Text
              style={[
                styles.title,
                { color: c.foreground },
              ]}
            >
              تفاصيل الزيارة
            </Text>

            <Text
              style={[
                styles.subtitle,
                { color: c.mutedForeground },
              ]}
            >
              الزيارة غير موجودة
            </Text>
          </View>

          <View
            style={[
              styles.headerIcon,
              {
                backgroundColor: c.secondary,
              },
            ]}
          >
            <Feather
              name="clipboard"
              size={22}
              color={c.primary}
            />
          </View>
        </View>

        <View style={styles.notFoundWrap}>
          <View
            style={[
              styles.notFoundIcon,
              {
                backgroundColor: c.secondary,
              },
            ]}
          >
            <Feather
              name="alert-circle"
              size={30}
              color={c.primary}
            />
          </View>

          <Text
            style={[
              styles.notFoundTitle,
              { color: c.foreground },
            ]}
          >
            لم يتم العثور على الزيارة
          </Text>

          <Text
            style={[
              styles.notFoundText,
              { color: c.mutedForeground },
            ]}
          >
            قد تكون الزيارة حُذفت أو أن الرابط غير صحيح.
          </Text>

          <Pressable
            onPress={() => router.back()}
            style={[
              styles.backAction,
              {
                backgroundColor: c.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.backActionText,
                {
                  color: c.primaryForeground,
                },
              ]}
            >
              العودة إلى الزيارات
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const school = schools.find(
    (item) => item.id === visit.schoolId
  );

  const statusBackground =
    visit.status === 'completed'
      ? '#E5F4EC'
      : visit.status === 'postponed'
        ? '#FFF2DD'
        : c.secondary;

  const statusColor =
    visit.status === 'completed'
      ? c.success
      : visit.status === 'postponed'
        ? c.warning
        : c.primary;

  /*
   * ============================
   * تعديل الزيارة
   * ============================
   */

  const editVisit = () => {
    router.push({
      pathname: '/visit-form',
      params: {
        visitId: visit.id,
      },
    });
  };

  /*
   * ============================
   * فتح المساعد الذكي
   * ============================
   */

  const openVisitAI = () => {
    router.push({
      pathname: '/visit-ai',
      params: {
        visitId: visit.id,
        schoolName:
          school?.name ?? 'مدرسة غير محددة',
        reason: visit.reason,
        actions: visit.actions,
      },
    });
  };

  /*
   * ============================
   * تنظيف HTML
   * ============================
   */

  const escapeHtml = (
    value: string = ''
  ) => {
    return value
      .toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  /*
   * ============================
   * تحويل النص إلى HTML
   * ============================
   */

  const formatText = (
    value: string = ''
  ) => {
    const normalized = value
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim();

    if (!normalized) {
      return '';
    }

    const lines = normalized
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const numbered =
      lines.length > 0 &&
      lines.every((line) =>
        /^\d+[\.\-\)]\s*/.test(line)
      );

    if (numbered) {
      return `
        <ol class="numbered-list">
          ${lines
            .map((line) => {
              const clean = line.replace(
                /^\d+[\.\-\)]\s*/,
                ''
              );

              return `
                <li>
                  ${escapeHtml(clean)}
                </li>
              `;
            })
            .join('')}
        </ol>
      `;
    }

    return lines
      .map(
        (line) =>
          `<p>${escapeHtml(line)}</p>`
      )
      .join('');
  };

  /*
   * ============================
   * استخراج قسم من الإجراءات
   * ============================
   */

  const extractSection = (
    source: string,
    title: string,
    nextTitles: string[]
  ) => {
    if (!source) {
      return '';
    }

    const escapedTitle = title.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    );

    const escapedNext = nextTitles
      .map((item) =>
        item.replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&'
        )
      )
      .join('|');

    const pattern = escapedNext
      ? new RegExp(
          `${escapedTitle}\\s*:?\\s*([\\s\\S]*?)(?=\\n\\s*(?:${escapedNext})\\s*:?)`,
          'i'
        )
      : new RegExp(
          `${escapedTitle}\\s*:?\\s*([\\s\\S]*)$`,
          'i'
        );

    const match = source.match(pattern);

    return match?.[1]?.trim() || '';
  };

  /*
   * ============================
   * طباعة تقرير الزيارة
   * ============================
   */

  const printVisitReport = async () => {
    try {
      const schoolName =
        school?.name ??
        'مدرسة غير محددة';

      const visitType =
        visit.type ||
        'زيارة تربوية';

      const visitDate =
        visit.date || '';

      const status =
        statusLabels[visit.status] ||
        visit.status ||
        '';

      const reason =
        visit.reason?.trim() ||
        'لم يتم إدخال سبب الزيارة.';

      const rawActions =
        visit.actions?.trim() || '';

      /*
       * ============================
       * استخراج الأقسام
       * ============================
       */

      const procedureTitles = [
        'الإجراءات',
        'الإجراءات المتخذة',
      ];

      const notesTitle =
        'الملاحظات';

      const recommendationsTitle =
        'التوصيات والإجراءات المقترحة';

      const followUpTitle =
        'خطة المتابعة';

      const allSectionTitles = [
        ...procedureTitles,
        notesTitle,
        recommendationsTitle,
        followUpTitle,
      ];

      const procedures =
        procedureTitles
          .map((title) =>
            extractSection(
              rawActions,
              title,
              allSectionTitles.filter(
                (item) => item !== title
              )
            )
          )
          .find(Boolean) || '';

      const notes =
        extractSection(
          rawActions,
          notesTitle,
          [
            recommendationsTitle,
            followUpTitle,
          ]
        );

      const recommendations =
        extractSection(
          rawActions,
          recommendationsTitle,
          [followUpTitle]
        );

      const followUp =
        extractSection(
          rawActions,
          followUpTitle,
          []
        );

      /*
       * ============================
       * القيم النهائية
       * ============================
       */

      const hasStructuredSections =
        Boolean(
          procedures ||
          notes ||
          recommendations ||
          followUp
        );

      const finalProcedures =
        procedures ||
        (
          hasStructuredSections
            ? 'لم يتم تسجيل إجراءات مستقلة.'
            : rawActions
        ) ||
        'لم يتم إدخال إجراءات للزيارة.';

      const finalNotes =
        notes ||
        'لا توجد ملاحظات إضافية مسجلة.';

      const finalRecommendations =
        recommendations ||
        'لا توجد توصيات إضافية مسجلة.';

      const finalFollowUp =
        followUp ||
        'لا توجد خطة متابعة مسجلة.';

      /*
       * ============================
       * القسم
       * ============================
       */

      const sectionHtml = (
        number: string,
        title: string,
        value: string
      ) => `
        <section class="report-section">

          <div class="section-heading">

            <span class="section-number">
              ${number}
            </span>

            <span>
              ${escapeHtml(title)}
            </span>

          </div>

          <div class="section-body">
            ${formatText(value)}
          </div>

        </section>
      `;

      /*
       * ============================
       * الشعار
       *
       * ضع الشعار في:
       * assets/images/ministry-logo.png
       *
       * لأن هذا الملف موجود في:
       * app/visit-details.tsx
       * ============================
       */

      let logoUri = '';

      try {
        const logoSource =
          Image.resolveAssetSource(
            require('../assets/images/ministry-logo.png')
          );

        logoUri =
          logoSource?.uri || '';
      } catch (logoError) {
        console.warn(
          'تعذر تحميل شعار الوزارة:',
          logoError
        );
      }

      /*
       * ============================
       * HTML التقرير
       * ============================
       */

      const html = `
<!DOCTYPE html>

<html
  lang="ar"
  dir="rtl"
>

<head>

  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>
    تقرير الزيارة الإشرافية
  </title>

  <style>

    @page {
      size: A4;
      margin: 10mm 12mm 12mm 12mm;
    }

    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      direction: rtl;
      background: #ffffff;
    }

    body {
      font-family:
        Tahoma,
        Arial,
        sans-serif;

      color: #163d48;

      font-size: 12px;

      line-height: 1.8;
    }

    .report {
      width: 100%;
    }

    /*
     * ============================
     * رأس التقرير
     * ============================
     */

    .report-header {
      border: 1px solid #d6e4e5;

      border-radius: 12px;

      padding: 12px 16px;

      margin-bottom: 12px;

      background: #f8fbfb;

      text-align: center;
    }

    .logo {
      width: 82px;

      height: 82px;

      object-fit: contain;

      display: block;

      margin: 0 auto 7px auto;
    }

    .logo-placeholder {
      width: 82px;

      height: 82px;

      margin: 0 auto 7px auto;

      border-radius: 50%;

      border: 1px solid #d6e4e5;

      display: flex;

      align-items: center;

      justify-content: center;

      color: #138f82;

      font-size: 10px;

      font-weight: bold;
    }

    .ministry-name {
      color: #103f4d;

      font-size: 14px;

      font-weight: 700;

      margin-bottom: 2px;
    }

    .report-title {
      color: #138f82;

      font-size: 22px;

      font-weight: 700;

      margin: 0;
    }

    .report-subtitle {
      color: #687b80;

      font-size: 10px;

      margin-top: 2px;
    }

    /*
     * ============================
     * معلومات الزيارة
     * ============================
     */

    .meta-box {
      border: 1px solid #d6e4e5;

      border-radius: 10px;

      overflow: hidden;

      margin-bottom: 14px;
    }

    .meta-table {
      width: 100%;

      border-collapse: collapse;
    }

    .meta-table td {
      padding: 8px 10px;

      border-bottom:
        1px solid #e3ecec;

      vertical-align: middle;
    }

    .meta-table tr:last-child td {
      border-bottom: none;
    }

    .meta-label {
      width: 17%;

      background: #eaf5f3;

      color: #35535b;

      font-weight: 700;
    }

    .meta-value {
      width: 33%;

      color: #173f49;

      font-weight: 600;
    }

    .status-badge {
      display: inline-block;

      padding: 3px 11px;

      border-radius: 14px;

      background: #e4f4ec;

      color: #14835f;

      font-weight: 700;

      font-size: 10px;
    }

    /*
     * ============================
     * الأقسام
     * ============================
     */

    .report-section {
      margin-bottom: 12px;

      page-break-inside: avoid;
    }

    .section-heading {
      display: flex;

      align-items: center;

      gap: 7px;

      background: #eaf5f3;

      border-right:
        4px solid #138f82;

      padding: 7px 10px;

      font-size: 13px;

      font-weight: 700;

      color: #123f4d;

      border-radius:
        5px 0 0 5px;

      margin-bottom: 6px;
    }

    .section-number {
      display: inline-flex;

      align-items: center;

      justify-content: center;

      min-width: 22px;

      height: 22px;

      border-radius: 50%;

      background: #138f82;

      color: #ffffff;

      font-size: 10px;

      font-weight: 700;
    }

    .section-body {
      border:
        1px solid #d6e4e5;

      border-radius: 8px;

      padding: 10px 12px;

      min-height: 48px;

      color: #263f46;

      background: #ffffff;
    }

    .section-body p {
      margin:
        0 0 5px;
    }

    .section-body p:last-child {
      margin-bottom: 0;
    }

    .numbered-list {
      margin: 0;

      padding-right: 22px;
    }

    .numbered-list li {
      padding: 3px 0;
    }

    /*
     * ============================
     * التوقيعات
     * ============================
     */

    .footer {
      margin-top: 20px;

      border-top:
        1px solid #d6e4e5;

      padding-top: 13px;

      page-break-inside: avoid;
    }

    .signature-table {
      width: 100%;

      border-collapse: collapse;
    }

    .signature-cell {
      width: 50%;

      text-align: center;

      padding:
        4px 15px 0;

      font-size: 11px;

      color: #35535b;
    }

    .signature-line {
      width: 130px;

      border-bottom:
        1px solid #74878c;

      margin:
        25px auto 5px;
    }

    .footer-note {
      text-align: center;

      color: #7a898d;

      font-size: 8px;

      margin-top: 12px;
    }

    /*
     * ============================
     * منع انقسام العناوين
     * ============================
     */

    .report-section,
    .meta-box,
    .report-header {
      break-inside: avoid;

      page-break-inside: avoid;
    }

  </style>

</head>

<body>

  <div class="report">

    <div class="report-header">

      ${
        logoUri
          ? `
            <img
              class="logo"
              src="${logoUri}"
              alt="شعار وزارة التربية"
            />
          `
          : `
            <div class="logo-placeholder">
              وزارة التربية
            </div>
          `
      }

      <div class="ministry-name">
        وزارة التربية
      </div>

      <h1 class="report-title">
        تقرير الزيارة الإشرافية
      </h1>

      <div class="report-subtitle">
        سجل الزيارات التربوية والمتابعة
      </div>

    </div>

    <!-- معلومات الزيارة -->

    <div class="meta-box">

      <table class="meta-table">

        <tr>

          <td class="meta-label">
            المدرسة
          </td>

          <td class="meta-value">
            ${escapeHtml(schoolName)}
          </td>

          <td class="meta-label">
            نوع الزيارة
          </td>

          <td class="meta-value">
            ${escapeHtml(visitType)}
          </td>

        </tr>

        <tr>

          <td class="meta-label">
            تاريخ الزيارة
          </td>

          <td class="meta-value">
            ${escapeHtml(visitDate)}
          </td>

          <td class="meta-label">
            حالة الزيارة
          </td>

          <td class="meta-value">

            <span class="status-badge">
              ${escapeHtml(status)}
            </span>

          </td>

        </tr>

      </table>

    </div>

    <!-- 1 -->

    ${sectionHtml(
      '1',
      'سبب الزيارة',
      reason
    )}

    <!-- 2 -->

    ${sectionHtml(
      '2',
      'الإجراءات المتخذة',
      finalProcedures
    )}

    <!-- 3 -->

    ${sectionHtml(
      '3',
      'الملاحظات',
      finalNotes
    )}

    <!-- 4 -->

    ${sectionHtml(
      '4',
      'التوصيات والإجراءات المقترحة',
      finalRecommendations
    )}

    <!-- 5 -->

    ${sectionHtml(
      '5',
      'خطة المتابعة',
      finalFollowUp
    )}

    <!-- التوقيعات -->

    <div class="footer">

      <table class="signature-table">

        <tr>

          <td class="signature-cell">

            المشرف التربوي

            <div
              class="signature-line"
            ></div>

            التوقيع

          </td>

          <td class="signature-cell">

            إدارة المدرسة

            <div
              class="signature-line"
            ></div>

            التوقيع

          </td>

        </tr>

      </table>

      <div class="footer-note">

        تم إعداد التقرير اعتمادًا على بيانات
        الزيارة المحفوظة في التطبيق.

      </div>

    </div>

  </div>

</body>

</html>
      `;

      /*
       * ============================
       * تنفيذ الطباعة
       * ============================
       */

      await Print.printAsync({
        html,
      });

    } catch (error) {

      console.error(
        'خطأ أثناء طباعة التقرير:',
        error
      );

      Alert.alert(
        'تعذر الطباعة',
        'حدث خطأ أثناء إعداد تقرير الزيارة للطباعة.'
      );
    }
  };

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
          style={
            styles.headerButton
          }
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
            تفاصيل الزيارة
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
            عرض الزيارة المحفوظة
          </Text>

        </View>

        <View
          style={[
            styles.headerIcon,
            {
              backgroundColor:
                c.secondary,
            },
          ]}
        >

          <Feather
            name="clipboard"
            size={22}
            color={c.primary}
          />

        </View>

      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom:
            insets.bottom + 35,
        }}
      >

        <View
          style={
            styles.content
          }
        >

          {/* SUMMARY */}

          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor:
                  c.card,

                borderColor:
                  c.border,
              },
            ]}
          >

            <View
              style={
                styles.summaryTop
              }
            >

              <View
                style={[
                  styles.dateBox,
                  {
                    backgroundColor:
                      c.secondary,
                  },
                ]}
              >

                <Text
                  style={[
                    styles.dateDay,
                    {
                      color:
                        c.primary,
                    },
                  ]}
                >
                  {visit.date.slice(-2)}
                </Text>

                <Text
                  style={[
                    styles.dateMonth,
                    {
                      color:
                        c.mutedForeground,
                    },
                  ]}
                >
                  {getMonthName(
                    visit.date
                  )}
                </Text>

              </View>

              <View
                style={
                  styles.summaryDetails
                }
              >

                <Text
                  style={[
                    styles.schoolName,
                    {
                      color:
                        c.foreground,
                    },
                  ]}
                >
                  {school?.name ??
                    'مدرسة غير محددة'}
                </Text>

                <Text
                  style={[
                    styles.visitType,
                    {
                      color:
                        c.primary,
                    },
                  ]}
                >
                  {visit.type}
                </Text>

                <Text
                  style={[
                    styles.dateText,
                    {
                      color:
                        c.mutedForeground,
                    },
                  ]}
                >
                  تاريخ الزيارة:
                  {' '}
                  {visit.date}
                </Text>

              </View>

              <View
                style={[
                  styles.status,
                  {
                    backgroundColor:
                      statusBackground,
                  },
                ]}
              >

                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        statusColor,
                    },
                  ]}
                >
                  {
                    statusLabels[
                      visit.status
                    ]
                  }
                </Text>

              </View>

            </View>

          </View>

          {/* EDIT */}

          <Pressable
            onPress={
              editVisit
            }
            style={({
              pressed,
            }) => [
              styles.editButton,
              {
                backgroundColor:
                  c.primary,

                opacity:
                  pressed
                    ? 0.78
                    : 1,
              },
            ]}
          >

            <Feather
              name="edit-2"
              size={18}
              color={
                c.primaryForeground
              }
            />

            <Text
              style={[
                styles.editButtonText,
                {
                  color:
                    c.primaryForeground,
                },
              ]}
            >
              تعديل بيانات الزيارة
            </Text>

          </Pressable>

          {/* PRINT */}

          <Pressable
            onPress={
              printVisitReport
            }
            style={({
              pressed,
            }) => [
              styles.printButton,
              {
                backgroundColor:
                  c.navy,

                opacity:
                  pressed
                    ? 0.82
                    : 1,
              },
            ]}
          >

            <View
              style={[
                styles.printIcon,
                {
                  backgroundColor:
                    c.accent,
                },
              ]}
            >

              <Feather
                name="printer"
                size={21}
                color={c.navy}
              />

            </View>

            <View
              style={
                styles.printTextWrap
              }
            >

              <Text
                style={
                  styles.printTitle
                }
              >
                طباعة تقرير الزيارة
              </Text>

              <Text
                style={
                  styles.printSubtitle
                }
              >
                طباعة التقرير في صفحة PDF
              </Text>

            </View>

            <Feather
              name="chevron-left"
              size={20}
              color="#FFFFFF"
            />

          </Pressable>

          {/* REASON */}

          <DetailSection
            title="سبب الزيارة"
            icon="help-circle"
            value={
              visit.reason ||
              'لم يتم إدخال سبب الزيارة.'
            }
            c={c}
          />

          {/* ACTIONS */}

          <DetailSection
            title="الإجراءات والتوصيات المحفوظة"
            icon="check-square"
            value={
              visit.actions ||
              'لم يتم إدخال إجراءات أو توصيات للزيارة.'
            }
            c={c}
          />

          {/* AI */}

          <View
            style={
              styles.actionSection
            }
          >

            <Pressable
              onPress={
                openVisitAI
              }
              style={({
                pressed,
              }) => [
                styles.aiButton,
                {
                  backgroundColor:
                    c.navy,

                  opacity:
                    pressed
                      ? 0.8
                      : 1,
                },
              ]}
            >

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
                  size={21}
                  color={c.navy}
                />

              </View>

              <View
                style={
                  styles.aiTextWrap
                }
              >

                <Text
                  style={
                    styles.aiTitle
                  }
                >
                  تحسين الزيارة بالذكاء الاصطناعي
                </Text>

                <Text
                  style={
                    styles.aiSubtitle
                  }
                >
                  صياغة الملاحظات والتوصيات بصورة تربوية مهنية
                </Text>

              </View>

              <Feather
                name="chevron-left"
                size={20}
                color="#FFFFFF"
              />

            </Pressable>

          </View>

          {/* PHOTO */}

          {visit.photoUri ? (
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
                  صورة سجل الزيارة
                </Text>

                <Feather
                  name="camera"
                  size={17}
                  color={
                    c.primary
                  }
                />

              </View>

              <Image
                source={{
                  uri:
                    visit.photoUri,
                }}
                style={[
                  styles.photo,
                  {
                    borderColor:
                      c.border,
                  },
                ]}
                resizeMode="cover"
              />

            </View>
          ) : null}

          {/* INFO */}

          <View
            style={[
              styles.infoBox,
              {
                backgroundColor:
                  c.secondary,
              },
            ]}
          >

            <Feather
              name="info"
              size={17}
              color={c.primary}
            />

            <Text
              style={[
                styles.infoText,
                {
                  color:
                    c.foreground,
                },
              ]}
            >
              هذه البيانات مأخوذة مباشرة من الزيارة المحفوظة في سجل التطبيق.
            </Text>

          </View>

          {/* BACK */}

          <Pressable
            onPress={() =>
              router.back()
            }
            style={({
              pressed,
            }) => [
              styles.backButton,
              {
                borderColor:
                  c.border,

                backgroundColor:
                  c.card,

                opacity:
                  pressed
                    ? 0.75
                    : 1,
              },
            ]}
          >

            <Feather
              name="arrow-right"
              size={18}
              color={c.primary}
            />

            <Text
              style={[
                styles.backButtonText,
                {
                  color:
                    c.primary,
                },
              ]}
            >
              العودة إلى سجل الزيارات
            </Text>

          </Pressable>

        </View>

      </ScrollView>

    </View>
  );
}

/*
 * ============================
 * قسم التفاصيل
 * ============================
 */

function DetailSection({
  title,
  icon,
  value,
  c,
}: {
  title: string;
  icon: any;
  value: string;
  c: any;
}) {
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

      <View
        style={[
          styles.textCard,
          {
            backgroundColor:
              c.card,

            borderColor:
              c.border,
          },
        ]}
      >

        <Text
          style={[
            styles.bodyText,
            {
              color:
                c.foreground,
            },
          ]}
        >
          {value}
        </Text>

      </View>

    </View>
  );
}

/*
 * ============================
 * اسم الشهر
 * ============================
 */

function getMonthName(
  date: string
) {
  const month =
    date.slice(5, 7);

  const months: Record<
    string,
    string
  > = {
    '01': 'كانون',
    '02': 'شباط',
    '03': 'آذار',
    '04': 'نيسان',
    '05': 'أيار',
    '06': 'حزيران',
    '07': 'تموز',
    '08': 'آب',
    '09': 'أيلول',
    '10': 'تشرين',
    '11': 'تشرين',
    '12': 'كانون',
  };

  return (
    months[month] || ''
  );
}

/*
 * ============================
 * Styles
 * ============================
 */

const styles =
  StyleSheet.create({

    page: {
      flex: 1,
    },

    header: {
      minHeight: 62,

      paddingHorizontal: 15,

      paddingBottom: 10,

      borderBottomWidth: 1,

      flexDirection:
        'row-reverse',

      alignItems:
        'center',

      gap: 10,
    },

    headerButton: {
      width: 40,

      height: 40,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    headerText: {
      flex: 1,

      alignItems:
        'flex-end',
    },

    title: {
      fontSize: 20,

      fontFamily:
        'Inter_700Bold',

      textAlign:
        'right',
    },

    subtitle: {
      fontSize: 10,

      fontFamily:
        'Inter_400Regular',

      marginTop: 3,

      textAlign:
        'right',
    },

    headerIcon: {
      width: 45,

      height: 45,

      borderRadius: 14,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    content: {
      paddingHorizontal: 12,

      paddingTop: 15,
    },

    summaryCard: {
      borderWidth: 1,

      borderRadius: 18,

      padding: 13,

      marginBottom: 18,
    },

    summaryTop: {
      flexDirection:
        'row-reverse',

      alignItems:
        'flex-start',

      gap: 10,
    },

    dateBox: {
      width: 48,

      height: 56,

      borderRadius: 13,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    dateDay: {
      fontSize: 18,

      fontFamily:
        'Inter_700Bold',
    },

    dateMonth: {
      fontSize: 9,

      fontFamily:
        'Inter_500Medium',

      marginTop: 2,
    },

    summaryDetails: {
      flex: 1,

      alignItems:
        'flex-end',
    },

    schoolName: {
      fontSize: 14,

      fontFamily:
        'Inter_700Bold',

      textAlign:
        'right',
    },

    visitType: {
      fontSize: 11,

      fontFamily:
        'Inter_600SemiBold',

      marginTop: 5,

      textAlign:
        'right',
    },

    dateText: {
      fontSize: 10,

      fontFamily:
        'Inter_400Regular',

      marginTop: 5,

      textAlign:
        'right',
    },

    status: {
      paddingHorizontal: 9,

      paddingVertical: 6,

      borderRadius: 9,
    },

    statusText: {
      fontSize: 10,

      fontFamily:
        'Inter_600SemiBold',
    },

    editButton: {
      minHeight: 50,

      borderRadius: 15,

      flexDirection:
        'row-reverse',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 8,

      marginBottom: 12,
    },

    editButtonText: {
      fontSize: 12,

      fontFamily:
        'Inter_700Bold',
    },

    printButton: {
      minHeight: 72,

      borderRadius: 17,

      paddingHorizontal: 12,

      flexDirection:
        'row-reverse',

      alignItems:
        'center',

      gap: 10,

      marginBottom: 18,
    },

    printIcon: {
      width: 46,

      height: 46,

      borderRadius: 14,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    printTextWrap: {
      flex: 1,

      alignItems:
        'flex-end',
    },

    printTitle: {
      color: '#FFFFFF',

      fontFamily:
        'Inter_700Bold',

      fontSize: 12,

      textAlign:
        'right',
    },

    printSubtitle: {
      color: '#B7D9D4',

      fontFamily:
        'Inter_400Regular',

      fontSize: 9,

      marginTop: 3,

      textAlign:
        'right',
    },

    section: {
      marginBottom: 17,
    },

    sectionHeader: {
      flexDirection:
        'row-reverse',

      alignItems:
        'center',

      gap: 7,

      marginBottom: 8,

      paddingHorizontal: 3,
    },

    sectionTitle: {
      fontSize: 13,

      fontFamily:
        'Inter_600SemiBold',
    },

    textCard: {
      minHeight: 100,

      borderWidth: 1,

      borderRadius: 16,

      padding: 14,
    },

    bodyText: {
      fontSize: 12,

      lineHeight: 23,

      fontFamily:
        'Inter_400Regular',

      textAlign:
        'right',
    },

    actionSection: {
      marginBottom: 17,
    },

    aiButton: {
      minHeight: 72,

      borderRadius: 17,

      paddingHorizontal: 12,

      flexDirection:
        'row-reverse',

      alignItems:
        'center',

      gap: 10,
    },

    aiIcon: {
      width: 46,

      height: 46,

      borderRadius: 14,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    aiTextWrap: {
      flex: 1,

      alignItems:
        'flex-end',
    },

    aiTitle: {
      color: '#FFFFFF',

      fontFamily:
        'Inter_700Bold',

      fontSize: 12,

      textAlign:
        'right',
    },

    aiSubtitle: {
      color: '#B7D9D4',

      fontFamily:
        'Inter_400Regular',

      fontSize: 9,

      marginTop: 3,

      textAlign:
        'right',
    },

    photo: {
      width: '100%',

      height: 220,

      borderWidth: 1,

      borderRadius: 16,
    },

    infoBox: {
      minHeight: 52,

      borderRadius: 14,

      paddingHorizontal: 12,

      flexDirection:
        'row-reverse',

      alignItems:
        'center',

      gap: 8,

      marginBottom: 15,
    },

    infoText: {
      flex: 1,

      fontSize: 10,

      lineHeight: 18,

      fontFamily:
        'Inter_400Regular',

      textAlign:
        'right',
    },

    backButton: {
      minHeight: 50,

      borderWidth: 1,

      borderRadius: 14,

      flexDirection:
        'row-reverse',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 7,
    },

    backButtonText: {
      fontSize: 12,

      fontFamily:
        'Inter_700Bold',
    },

    notFoundWrap: {
      flex: 1,

      alignItems:
        'center',

      justifyContent:
        'center',

      padding: 25,
    },

    notFoundIcon: {
      width: 68,

      height: 68,

      borderRadius: 20,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    notFoundTitle: {
      fontSize: 16,

      fontFamily:
        'Inter_700Bold',

      marginTop: 14,
    },

    notFoundText: {
      fontSize: 11,

      fontFamily:
        'Inter_400Regular',

      marginTop: 6,

      textAlign:
        'center',
    },

    backAction: {
      minHeight: 48,

      borderRadius: 14,

      paddingHorizontal: 20,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginTop: 18,
    },

    backActionText: {
      fontSize: 12,

      fontFamily:
        'Inter_700Bold',
    },

  });

