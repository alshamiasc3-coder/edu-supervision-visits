import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useStore } from '@/context/AppContext';
export default function SchoolForm() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { id: editId } =
    useLocalSearchParams<{ id?: string }>();

  const {
    schools,
    addSchool,
    updateSchool,
  } = useStore();

  const existing = editId
    ? schools.find(
        s => s.id === editId
      )
    : undefined;

  const [name, setName] = useState(
    existing?.name ?? ''
  );

  const [director, setDirector] =
    useState(existing?.director ?? '');

  const [adminDeputy, setAdminDeputy] =
    useState(existing?.adminDeputy ?? '');

  const [technicalDeputy, setTechnicalDeputy] =
    useState(existing?.technicalDeputy ?? '');

  const [studentsDeputy, setStudentsDeputy] =
    useState(existing?.studentsDeputy ?? '');

  const [sections, setSections] =
    useState(
      existing?.sections.join(', ') ?? ''
    );

  const [address, setAddress] =
    useState(existing?.address ?? '');

  const save = () => {
    if (!name.trim()) {
      return Alert.alert(
        'بيانات ناقصة',
        'يرجى إدخال اسم المدرسة'
      );
    }

    const data = {
      name,
      director,
      adminDeputy,
      technicalDeputy,
      studentsDeputy,
      sections: sections
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
      address,
      lastVisit: existing?.lastVisit,
    };

    if (editId) {
      updateSchool(editId, data);
    } else {
      addSchool(data);
    }

    router.back();
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
      <View
        style={[
          styles.header,
          {
            paddingTop:
              insets.top + 12,
          },
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
            styles.title,
            {
              color: c.foreground,
            },
          ]}
        >
          {editId
            ? 'تعديل المدرسة'
            : 'إضافة مدرسة'}
        </Text>

        <View
          style={{ width: 24 }}
        />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : 'height'
        }
        keyboardVerticalOffset={
          Platform.OS === 'ios'
            ? 0
            : 0
        }
      >
        <ScrollView
          style={styles.formScroll}
          contentContainerStyle={
            styles.formContent
          }
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === 'ios'
              ? 'interactive'
              : 'on-drag'
          }
          showsVerticalScrollIndicator={
            false
          }
          automaticallyAdjustKeyboardInsets={
            Platform.OS === 'ios'
          }
        >
          <Text
            style={[
              styles.intro,
              {
                color:
                  c.mutedForeground,
              },
            ]}
          >
            {editId
              ? 'حدّث بيانات المدرسة وأقسامها من هنا.'
              : 'أنشئ ملفاً كاملاً للمدرسة لتسهيل الزيارات والتقارير.'}
          </Text>

          <Field
            label="اسم المدرسة *"
            value={name}
            onChangeText={setName}
            placeholder="مثال: إعدادية الموهوبين"
            c={c}
          />

          <Field
            label="اسم المدير"
            value={director}
            onChangeText={setDirector}
            placeholder="الاسم الكامل"
            c={c}
          />

          <Field
            label="المعاون الإداري"
            value={adminDeputy}
            onChangeText={setAdminDeputy}
            placeholder="الاسم الكامل"
            c={c}
          />

          <Field
            label="المعاون الفني"
            value={technicalDeputy}
            onChangeText={setTechnicalDeputy}
            placeholder="الاسم الكامل"
            c={c}
          />

          <Field
            label="معاون شؤون الطلبة"
            value={studentsDeputy}
            onChangeText={setStudentsDeputy}
            placeholder="الاسم الكامل"
            c={c}
          />

          <Field
            label="أقسام المدرسة"
            value={sections}
            onChangeText={setSections}
            placeholder="كهرباء، حاسبات، تجاري"
            c={c}
            helper="اكتب أكثر من قسم وافصل بينها بفاصلة"
          />

          <Field
            label="العنوان"
            value={address}
            onChangeText={setAddress}
            placeholder="المنطقة أو الموقع"
            c={c}
          />

          <Pressable
            onPress={save}
            style={({ pressed }) => [
              styles.save,
              {
                backgroundColor:
                  c.primary,
                opacity: pressed
                  ? 0.8
                  : 1,
              },
            ]}
          >
            <Feather
              name="save"
              size={19}
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
              }}
            >
              {editId
                ? 'حفظ التعديلات'
                : 'حفظ ملف المدرسة'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, helper, c }: any) { return <View style={styles.field}><Text style={[styles.label, { color: c.foreground }]}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={c.mutedForeground} style={[styles.input, { backgroundColor: c.card, borderColor: c.border, color: c.foreground }]} textAlign="right" /><Text style={[styles.helper, { color: c.mutedForeground }]}>{helper || ''}</Text></View>; }
const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingHorizontal: 18,
  },

  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 18,
  },

  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
  },

  keyboardContainer: {
    flex: 1,
  },

  formScroll: {
    flex: 1,
  },

  formContent: {
    paddingBottom: 80,
  },

  intro: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    textAlign: 'right',
    lineHeight: 20,
    marginBottom: 18,
  },

  field: {
    marginBottom: 13,
  },

  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 7,
  },

  input: {
    borderWidth: 1,
    borderRadius: 13,
    minHeight: 48,
    paddingHorizontal: 13,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },

  helper: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    textAlign: 'right',
    marginTop: 4,
  },

  save: {
    minHeight: 52,
    borderRadius: 15,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 8,
  },
});
