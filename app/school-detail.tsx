import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { useStore, statusLabels } from '@/context/AppContext';
import type { Staffing } from '@/context/AppContext';

export default function SchoolDetail() {
  const c = useColors();
  const insets = useSafeAreaInsets();

  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    schools,
    visits,
    staffing,
    addStaffing,
    updateStaffing,
    deleteStaffing,
  } = useStore();

  const [staffingModalVisible, setStaffingModalVisible] = useState(false);
  const [editingStaffing, setEditingStaffing] = useState<Staffing | null>(null);
  const [specialty, setSpecialty] = useState('');
  const [required, setRequired] = useState('');
  const [current, setCurrent] = useState('');
  const [stage, setStage] = useState('');
  const [district, setDistrict] = useState('');
  const [notes, setNotes] = useState('');
  const [teacherNames, setTeacherNames] = useState('');

  const school = schools.find((s) => s.id === id);

  const schoolVisits = visits
    .filter((visit) => visit.schoolId === id)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (!school) {
    return (
      <View
        style={[
          styles.page,
          styles.center,
          { backgroundColor: c.background },
        ]}
      >
        <Text
          style={[
            styles.emptyText,
            { color: c.mutedForeground },
          ]}
        >
          لم يتم العثور على المدرسة
        </Text>
      </View>
    );
  }

  const latestVisit = schoolVisits[0];
  const schoolStaffing = staffing
    .filter((record) => record.schoolId === school.id)
    .sort((a, b) => a.specialty.localeCompare(b.specialty));

  const staffingSummary = schoolStaffing.reduce(
    (summary, record) => {
      if (record.current < record.required) {
        summary.vacant += record.required - record.current;
      } else if (record.current > record.required) {
        summary.surplus += record.current - record.required;
      } else {
        summary.complete += 1;
      }
      return summary;
    },
    { vacant: 0, surplus: 0, complete: 0 }
  );

  const getStaffingDisplay = (required: number, current: number) => {
    if (current < required) {
      return {
        label: 'شاغر',
        difference: required - current,
        tone: c.warning,
      };
    }

    if (current > required) {
      return {
        label: 'فيض',
        difference: current - required,
        tone: c.warning,
      };
    }

    return {
      label: 'مكتمل',
      difference: 0,
      tone: c.success,
    };
  };

  const resetStaffingForm = () => {
    setEditingStaffing(null);
    setSpecialty('');
    setRequired('');
    setCurrent('');
    setStage('');
    setDistrict('');
    setNotes('');
    setTeacherNames('');
  };

  const openAddStaffing = () => {
    resetStaffingForm();
    setStaffingModalVisible(true);
  };

  const openEditStaffing = (record: Staffing) => {
    setEditingStaffing(record);
    setSpecialty(record.specialty);
    setRequired(String(record.required));
    setCurrent(String(record.current));
    setStage(record.stage || '');
    setDistrict(record.district || '');
    setNotes(record.notes || '');
    setTeacherNames(
      (record.teacherNames || []).join(', ')
    );
    setStaffingModalVisible(true);
  };

  const closeStaffingModal = () => {
    setStaffingModalVisible(false);
    resetStaffingForm();
  };

  const saveStaffing = () => {
    const specialtyValue = specialty.trim();
    const requiredValue = Number.parseInt(required, 10);
    const currentValue = Number.parseInt(current, 10);

    if (!specialtyValue) {
      Alert.alert('بيانات ناقصة', 'يرجى إدخال اسم الاختصاص.');
      return;
    }

    if (
      !Number.isFinite(requiredValue) ||
      requiredValue < 0 ||
      !Number.isFinite(currentValue) ||
      currentValue < 0
    ) {
      Alert.alert(
        'بيانات غير صحيحة',
        'يرجى إدخال أعداد صحيحة للمطلوب والحالي.'
      );
      return;
    }

    const data: Omit<Staffing, 'id'> = {
      schoolId: school.id,
      specialty: specialtyValue,
      required: requiredValue,
      current: currentValue,
      stage: stage.trim(),
      district: district.trim(),
      notes: notes.trim(),
      teacherNames: teacherNames
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean),
    };

    if (editingStaffing) {
      updateStaffing(editingStaffing.id, data);
    } else {
      addStaffing(data);
    }

    closeStaffingModal();
  };

  const confirmDeleteStaffing = (record: Staffing) => {
    const message = `هل تريد حذف اختصاص ${record.specialty} من ملاك المدرسة؟`;

    // على الويب، Alert.alert لا يتعامل دائمًا مع أزرار التأكيد كما هو
    // الحال في Android / iOS، لذلك نستخدم نافذة التأكيد الأصلية للمتصفح.
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(message);

      if (confirmed) {
        deleteStaffing(record.id);
      }

      return;
    }

    Alert.alert(
      'حذف الاختصاص',
      message,
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => deleteStaffing(record.id),
        },
      ]
    );
  };


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
          { paddingTop: insets.top + 12 },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
        >
          <Feather
            name="arrow-right"
            size={23}
            color={c.foreground}
          />
        </Pressable>

        <Text
          style={[
            styles.headerTitle,
            { color: c.foreground },
          ]}
        >
          ملف المدرسة
        </Text>

        <Pressable
          onPress={() =>
            router.push({
              pathname: '/school-form',
              params: { id: school.id },
            })
          }
          hitSlop={10}
        >
          <Feather
            name="edit-2"
            size={20}
            color={c.primary}
          />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View
          style={[
            styles.cover,
            { backgroundColor: c.navy },
          ]}
        >
          <View
            style={[
              styles.schoolIcon,
              { backgroundColor: c.accent },
            ]}
          >
            <Feather
              name="home"
              size={26}
              color={c.navy}
            />
          </View>

          <Text style={styles.schoolName}>
            {school.name}
          </Text>

          <Text style={styles.address}>
            {school.address || 'العنوان غير مسجل'}
          </Text>
        </View>

        <Info
          label="المدير"
          value={school.director || 'غير مسجل'}
          c={c}
        />

        <Info
          label="المعاون الإداري"
          value={school.adminDeputy || 'غير مسجل'}
          c={c}
        />

        <Info
          label="المعاون الفني"
          value={school.technicalDeputy || 'غير مسجل'}
          c={c}
        />

        <Info
          label="معاون شؤون الطلبة"
          value={school.studentsDeputy || 'غير مسجل'}
          c={c}
        />

        <Text
          style={[
            styles.section,
            { color: c.foreground },
          ]}
        >
          أقسام المدرسة
        </Text>

        {school.sections?.length ? (
          <View style={styles.tags}>
            {school.sections.map((section) => (
              <View
                key={section}
                style={[
                  styles.tag,
                  { backgroundColor: c.secondary },
                ]}
              >
                <Text
                  style={[
                    styles.tagText,
                    { color: c.secondaryForeground },
                  ]}
                >
                  {section}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text
            style={[
              styles.emptySmall,
              { color: c.mutedForeground },
            ]}
          >
            لا توجد أقسام مسجلة
          </Text>
        )}


        <View style={styles.staffingHeader}>
          <Text
            style={[
              styles.section,
              styles.staffingTitle,
              { color: c.foreground },
            ]}
          >
            الملاك والاحتياج
          </Text>

          <View
            style={[
              styles.countBadge,
              { backgroundColor: c.secondary },
            ]}
          >
            <Text
              style={[
                styles.countText,
                { color: c.secondaryForeground },
              ]}
            >
              {schoolStaffing.length}
            </Text>
          </View>

          <Pressable
            onPress={openAddStaffing}
            style={({ pressed }) => [
              styles.addStaffingButton,
              {
                backgroundColor: c.primary,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Feather
              name="plus"
              size={15}
              color={c.primaryForeground}
            />
            <Text
              style={[
                styles.addStaffingButtonText,
                { color: c.primaryForeground },
              ]}
            >
              إضافة اختصاص
            </Text>
          </Pressable>
        </View>

        {schoolStaffing.length > 0 ? (
          <>
            <View style={styles.staffingSummaryRow}>
              <SummaryCard
                label="إجمالي الاختصاصات"
                value={String(schoolStaffing.length)}
                c={c}
              />
              <SummaryCard
                label="الشاغر"
                value={String(staffingSummary.vacant)}
                c={c}
              />
              <SummaryCard
                label="الفيض"
                value={String(staffingSummary.surplus)}
                c={c}
              />
              <SummaryCard
                label="المكتمل"
                value={String(staffingSummary.complete)}
                c={c}
              />
            </View>

            {schoolStaffing.map((record) => {
              const result = getStaffingDisplay(
                record.required,
                record.current
              );

              return (
                <View
                  key={record.id}
                  style={[
                    styles.staffingCard,
                    {
                      backgroundColor: c.card,
                      borderColor: c.border,
                    },
                  ]}
                >
                  <View style={styles.staffingTopRow}>
                    <Text
                      style={[
                        styles.staffingSpecialty,
                        { color: c.foreground },
                      ]}
                    >
                      {record.specialty}
                    </Text>

                    <View
                      style={[
                        styles.staffingStatus,
                        { backgroundColor: result.tone + '18' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.staffingStatusText,
                          { color: result.tone },
                        ]}
                      >
                        {result.label}
                        {result.difference > 0
                          ? ` ${result.difference}`
                          : ''}
                      </Text>
                    </View>

                    <View style={styles.staffingActions}>
                      <Pressable
                        onPress={() => openEditStaffing(record)}
                        style={[
                          styles.smallActionButton,
                          { backgroundColor: c.secondary },
                        ]}
                      >
                        <Feather
                          name="edit-2"
                          size={13}
                          color={c.primary}
                        />
                      </Pressable>

                      <Pressable
                        onPress={() => confirmDeleteStaffing(record)}
                        style={[
                          styles.smallActionButton,
                          { backgroundColor: c.secondary },
                        ]}
                      >
                        <Feather
                          name="trash-2"
                          size={13}
                          color={c.destructive || '#dc2626'}
                        />
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.staffingNumbers}>
                    <View style={styles.staffingNumberBox}>
                      <Text
                        style={[
                          styles.staffingNumber,
                          { color: c.foreground },
                        ]}
                      >
                        {record.required}
                      </Text>
                      <Text
                        style={[
                          styles.staffingNumberLabel,
                          { color: c.mutedForeground },
                        ]}
                      >
                        المطلوب
                      </Text>
                    </View>

                    <View style={styles.staffingNumberBox}>
                      <Text
                        style={[
                          styles.staffingNumber,
                          { color: c.foreground },
                        ]}
                      >
                        {record.current}
                      </Text>
                      <Text
                        style={[
                          styles.staffingNumberLabel,
                          { color: c.mutedForeground },
                        ]}
                      >
                        الحالي
                      </Text>
                    </View>

                    <View style={styles.staffingNumberBox}>
                      <Text
                        style={[
                          styles.staffingNumber,
                          { color: result.tone },
                        ]}
                      >
                        {result.difference}
                      </Text>
                      <Text
                        style={[
                          styles.staffingNumberLabel,
                          { color: c.mutedForeground },
                        ]}
                      >
                        الفرق
                      </Text>
                    </View>
                  </View>

                  {record.teacherNames?.length ? (
                    <View style={styles.teacherNamesBox}>
                      <View style={styles.teacherNamesHeader}>
                        <Feather
                          name="users"
                          size={14}
                          color={c.primary}
                        />
                        <Text
                          style={[
                            styles.teacherNamesTitle,
                            { color: c.foreground },
                          ]}
                        >
                          أسماء المدرسين
                        </Text>
                      </View>

                      <View style={styles.teacherNamesList}>
                        {record.teacherNames.map(
                          (teacherName, teacherIndex) => (
                            <View
                              key={`${record.id}-teacher-${teacherIndex}`}
                              style={[
                                styles.teacherNameChip,
                                {
                                  backgroundColor: c.secondary,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.teacherNameText,
                                  {
                                    color:
                                      c.secondaryForeground,
                                  },
                                ]}
                              >
                                {teacherName}
                              </Text>
                            </View>
                          )
                        )}
                      </View>
                    </View>
                  ) : null}

                  {(record.stage || record.district || record.notes) ? (
                    <View style={styles.staffingMeta}>
                      {record.stage ? (
                        <Text
                          style={[
                            styles.staffingMetaText,
                            { color: c.mutedForeground },
                          ]}
                        >
                          المرحلة: {record.stage}
                        </Text>
                      ) : null}

                      {record.district ? (
                        <Text
                          style={[
                            styles.staffingMetaText,
                            { color: c.mutedForeground },
                          ]}
                        >
                          القضاء/المحافظة: {record.district}
                        </Text>
                      ) : null}

                      {record.notes ? (
                        <Text
                          style={[
                            styles.staffingMetaText,
                            { color: c.mutedForeground },
                          ]}
                        >
                          ملاحظة: {record.notes}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </>
        ) : (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: c.card,
                borderColor: c.border,
              },
            ]}
          >
            <Feather
              name="bar-chart-2"
              size={28}
              color={c.mutedForeground}
            />
            <Text
              style={[
                styles.emptyTitle,
                { color: c.foreground },
              ]}
            >
              لا توجد بيانات ملاك مسجلة
            </Text>
            <Text
              style={[
                styles.emptyText,
                { color: c.mutedForeground },
              ]}
            >
              ستظهر هنا بيانات الاختصاصات والفيض والشاغر لهذه المدرسة.
            </Text>
          </View>
        )}

        <View style={styles.historyHeader}>
          <Text
            style={[
              styles.section,
              styles.historyTitle,
              { color: c.foreground },
            ]}
          >
            سجل الزيارات
          </Text>

          <View
            style={[
              styles.countBadge,
              { backgroundColor: c.secondary },
            ]}
          >
            <Text
              style={[
                styles.countText,
                { color: c.secondaryForeground },
              ]}
            >
              {schoolVisits.length}
            </Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <SummaryCard
            label="إجمالي الزيارات"
            value={String(schoolVisits.length)}
            c={c}
          />

          <SummaryCard
            label="آخر زيارة"
            value={latestVisit?.date || 'لا توجد'}
            c={c}
          />

          <SummaryCard
            label="الحالة"
            value={
              latestVisit
                ? statusLabels[latestVisit.status] ||
                  latestVisit.status
                : 'لا توجد'
            }
            c={c}
          />
        </View>

        <Pressable
          onPress={() =>
            router.push({
              pathname: '/visit-form',
              params: {
                schoolId: String(school.id),
              },
            })
          }
          style={({ pressed }) => [
            styles.newVisitButton,
            {
              backgroundColor: c.primary,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <Feather
            name="plus"
            size={19}
            color={c.primaryForeground}
          />

          <Text
            style={[
              styles.newVisitText,
              { color: c.primaryForeground },
            ]}
          >
            تسجيل زيارة جديدة لهذه المدرسة
          </Text>
        </Pressable>

        {schoolVisits.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: c.card,
                borderColor: c.border,
              },
            ]}
          >
            <Feather
              name="clipboard"
              size={28}
              color={c.mutedForeground}
            />

            <Text
              style={[
                styles.emptyTitle,
                { color: c.foreground },
              ]}
            >
              لا توجد زيارات سابقة
            </Text>

            <Text
              style={[
                styles.emptyText,
                { color: c.mutedForeground },
              ]}
            >
              لم يتم تسجيل أي زيارة لهذه المدرسة حتى الآن.
            </Text>
          </View>
        ) : (
          schoolVisits.map((visit) => (
            <Pressable
              key={visit.id}
              onPress={() =>
                router.push({
                  pathname: '/visit-details',
                  params: {
                    visitId: String(visit.id),
                  },
                })
              }
              style={({ pressed }) => [
                styles.visit,
                {
                  backgroundColor: c.card,
                  borderColor: c.border,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <View style={styles.visitArrow}>
                <Feather
                  name="chevron-left"
                  size={18}
                  color={c.primary}
                />
              </View>

              <View style={styles.visitContent}>
                <View style={styles.visitTopRow}>
                  <Text
                    style={[
                      styles.visitTitle,
                      { color: c.foreground },
                    ]}
                  >
                    {visit.type || 'زيارة مدرسية'}
                  </Text>

                  <Text
                    style={[
                      styles.visitDate,
                      { color: c.primary },
                    ]}
                  >
                    {visit.date}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.visitReason,
                    { color: c.mutedForeground },
                  ]}
                  numberOfLines={2}
                >
                  {visit.reason || 'بدون سبب محدد'}
                </Text>

                <View style={styles.visitBottomRow}>
                  <Text
                    style={[
                      styles.visitActionHint,
                      { color: c.mutedForeground },
                    ]}
                  >
                    اضغط لعرض تفاصيل الزيارة
                  </Text>

                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          visit.status === 'completed'
                            ? c.success + '18'
                            : c.warning + '18',
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color:
                          visit.status === 'completed'
                            ? c.success
                            : c.warning,
                        fontFamily: 'Inter_600SemiBold',
                        fontSize: 10,
                      }}
                    >
                      {statusLabels[visit.status] ||
                        visit.status}
                    </Text>
                  </View>
                </View>
              </View>
            </Pressable>
          ))
        )}

      </ScrollView>

      <Modal
        visible={staffingModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeStaffingModal}
      >
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : 'height'
          }
          keyboardVerticalOffset={0}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={closeStaffingModal}
          />

          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: c.card,
                borderColor: c.border,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text
                style={[
                  styles.modalTitle,
                  { color: c.foreground },
                ]}
              >
                {editingStaffing
                  ? 'تعديل بيانات الاختصاص'
                  : 'إضافة اختصاص جديد'}
              </Text>

              <Pressable
                onPress={closeStaffingModal}
                style={[
                  styles.modalClose,
                  { backgroundColor: c.secondary },
                ]}
              >
                <Feather
                  name="x"
                  size={18}
                  color={c.foreground}
                />
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              style={styles.modalScroll}
              contentContainerStyle={styles.modalContent}
            >
              <Field
                label="الاختصاص"
                value={specialty}
                onChangeText={setSpecialty}
                placeholder="مثال: رياضيات"
                c={c}
              />

              <View style={styles.modalTwoColumns}>
                <Field
                  label="المطلوب"
                  value={required}
                  onChangeText={setRequired}
                  placeholder="0"
                  keyboardType="number-pad"
                  c={c}
                />

                <Field
                  label="الحالي"
                  value={current}
                  onChangeText={setCurrent}
                  placeholder="0"
                  keyboardType="number-pad"
                  c={c}
                />
              </View>

              <Field
                label="المرحلة"
                value={stage}
                onChangeText={setStage}
                placeholder="مثال: إعدادي"
                c={c}
              />

              <Field
                label="القضاء / المحافظة"
                value={district}
                onChangeText={setDistrict}
                placeholder="مثال: الجامعة - بغداد"
                c={c}
              />

              <Field
                label="أسماء المدرسين (اختياري)"
                value={teacherNames}
                onChangeText={setTeacherNames}
                placeholder="أحمد علي، محمد حسن، ..."
                helper="يمكن إضافة أكثر من اسم وفصل الأسماء بفاصلة"
                c={c}
              />

              <Field
                label="ملاحظات"
                value={notes}
                onChangeText={setNotes}
                placeholder="ملاحظات اختيارية"
                multiline
                c={c}
              />

              <View style={styles.modalButtons}>
                <Pressable
                  onPress={closeStaffingModal}
                  style={[
                    styles.modalButton,
                    styles.cancelButton,
                    {
                      borderColor: c.border,
                      backgroundColor: c.background,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.modalButtonText,
                      { color: c.foreground },
                    ]}
                  >
                    إلغاء
                  </Text>
                </Pressable>

                <Pressable
                  onPress={saveStaffing}
                  style={[
                    styles.modalButton,
                    { backgroundColor: c.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.modalButtonText,
                      { color: c.primaryForeground },
                    ]}
                  >
                    حفظ
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}


function Field({
  label,
  value,
  onChangeText,
  placeholder,
  helper,
  keyboardType,
  multiline,
  c,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  helper?: string;
  keyboardType?: 'default' | 'number-pad';
  multiline?: boolean;
  c: any;
}) {
  return (
    <View style={styles.field}>
      <Text
        style={[
          styles.fieldLabel,
          { color: c.foreground },
        ]}
      >
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.mutedForeground}
        keyboardType={keyboardType || 'default'}
        multiline={multiline}
        textAlign="right"
        style={[
          styles.fieldInput,
          {
            color: c.foreground,
            backgroundColor: c.background,
            borderColor: c.border,
            minHeight: multiline ? 78 : undefined,
          },
        ]}
      />
      {helper ? (
        <Text
          style={[
            styles.fieldHelper,
            { color: c.mutedForeground },
          ]}
        >
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

function Info({
  label,
  value,
  c,
}: {
  label: string;
  value: string;
  c: any;
}) {
  return (
    <View
      style={[
        styles.info,
        {
          backgroundColor: c.card,
          borderColor: c.border,
        },
      ]}
    >
      <Text
        style={[
          styles.infoValue,
          { color: c.foreground },
        ]}
      >
        {value}
      </Text>

      <Text
        style={[
          styles.infoLabel,
          { color: c.mutedForeground },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function SummaryCard({
  label,
  value,
  c,
}: {
  label: string;
  value: string;
  c: any;
}) {
  return (
    <View
      style={[
        styles.summaryCard,
        {
          backgroundColor: c.card,
          borderColor: c.border,
        },
      ]}
    >
      <Text
        style={[
          styles.summaryValue,
          { color: c.foreground },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>

      <Text
        style={[
          styles.summaryLabel,
          { color: c.mutedForeground },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingHorizontal: 18,
  },

  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
  },

  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
  },

  content: {
    paddingBottom: 40,
  },

  cover: {
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
    marginBottom: 14,
  },

  schoolIcon: {
    width: 56,
    height: 56,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  schoolName: {
    color: '#fff',
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    textAlign: 'center',
  },

  address: {
    color: '#B7D9D4',
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
  },

  info: {
    borderWidth: 1,
    borderRadius: 15,
    padding: 12,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  infoValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    flex: 1,
    textAlign: 'left',
  },

  infoLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginLeft: 10,
  },

  section: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    textAlign: 'right',
    marginTop: 18,
    marginBottom: 10,
  },

  tags: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 7,
  },

  tag: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
  },

  tagText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },

  emptySmall: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    textAlign: 'right',
  },


  staffingHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },

  staffingTitle: {
    marginBottom: 0,
  },

  staffingSummaryRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },

  staffingCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 13,
    marginBottom: 9,
  },

  staffingTopRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },

  staffingSpecialty: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    textAlign: 'right',
    flex: 1,
  },

  staffingStatus: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 9,
  },

  staffingStatusText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
  },

  staffingNumbers: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginTop: 12,
  },

  staffingNumberBox: {
    flex: 1,
    borderRadius: 11,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(127, 127, 127, 0.06)',
  },

  staffingNumber: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },

  staffingNumberLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    marginTop: 3,
  },

  staffingMeta: {
    marginTop: 10,
    paddingTop: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(127, 127, 127, 0.18)',
    gap: 4,
  },

  staffingMetaText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    textAlign: 'right',
  },


  addStaffingButton: {
    minHeight: 34,
    borderRadius: 10,
    paddingHorizontal: 11,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 8,
    marginRight: 'auto',
  },

  addStaffingButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
  },

  staffingActions: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
  },

  smallActionButton: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },

  modalCard: {
    width: '100%',
    maxHeight: '88%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 15,
    paddingBottom: 22,
  },

  modalHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  modalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    textAlign: 'right',
  },

  modalClose: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalScroll: {
    flexGrow: 0,
  },

  modalContent: {
    paddingBottom: 24,
  },

  field: {
    marginBottom: 12,
    flex: 1,
  },

  fieldLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    textAlign: 'right',
    marginBottom: 6,
  },

  fieldInput: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    textAlignVertical: 'top',
  },

  teacherNamesBox: {
    marginTop: 11,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(127, 127, 127, 0.18)',
  },

  teacherNamesHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginBottom: 7,
  },

  teacherNamesTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
  },

  teacherNamesList: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },

  teacherNameChip: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
  },

  teacherNameText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
  },

  fieldHelper: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    textAlign: 'right',
    marginTop: 4,
  },

  modalTwoColumns: {
    flexDirection: 'row-reverse',
    gap: 9,
  },

  modalTwoColumnsItem: {
    flex: 1,
  },

  modalButtons: {
    flexDirection: 'row-reverse',
    gap: 9,
    marginTop: 8,
  },

  modalButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButton: {
    borderWidth: 1,
  },

  modalButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
  },

  historyHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },

  historyTitle: {
    marginBottom: 0,
  },

  countBadge: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },

  countText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
  },

  summaryRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginBottom: 12,
  },

  summaryCard: {
    flex: 1,
    minHeight: 66,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    textAlign: 'center',
  },

  summaryLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    marginTop: 5,
    textAlign: 'center',
  },

  newVisitButton: {
    minHeight: 50,
    borderRadius: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },

  newVisitText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
  },

  visit: {
    borderWidth: 1,
    borderRadius: 15,
    padding: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },

  visitContent: {
    flex: 1,
  },

  visitArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  visitTopRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },

  visitTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    textAlign: 'right',
    flex: 1,
  },

  visitDate: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },

  visitReason: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    textAlign: 'right',
    marginTop: 5,
  },

  visitBottomRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 8,
  },

  visitActionHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    flex: 1,
    textAlign: 'right',
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  emptyCard: {
    minHeight: 150,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    marginTop: 10,
  },

  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
  },
});