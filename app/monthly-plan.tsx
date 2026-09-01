import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { Feather } from '@expo/vector-icons';
import { useStore } from '@/context/AppContext';

type PlanStatus = 'planned' | 'in_progress' | 'completed';

type PlanItem = {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  status: PlanStatus;
  schoolId?: string;
};

type AISuggestion = {
  schoolId: string;
  title: string;
  notes: string;
  reason: string;
};

const MONTHS = [
  'كانون الثاني',
  'شباط',
  'آذار',
  'نيسان',
  'أيار',
  'حزيران',
  'تموز',
  'آب',
  'أيلول',
  'تشرين الأول',
  'تشرين الثاني',
  'كانون الأول',
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 2 + i);

function normalizeArabicDigits(value: string) {
  return value
    .trim()
    .replace(/[٠-٩]/g, (digit) =>
      String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit))
    );
}

function isValidDate(year: number, month: number, day: number) {
  if (
    year < 1900 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return false;
  }

  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function getDateParts(value: string) {
  const normalized = normalizeArabicDigits(value);

  let match = normalized.match(
    /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/
  );

  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    if (!isValidDate(year, month, day)) {
      return null;
    }

    return {
      year,
      monthIndex: month - 1,
      day,
      iso: `${year}-${String(month).padStart(2, '0')}-${String(
        day
      ).padStart(2, '0')}`,
    };
  }

  match = normalized.match(
    /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/
  );

  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);

    if (!isValidDate(year, month, day)) {
      return null;
    }

    return {
      year,
      monthIndex: month - 1,
      day,
      iso: `${year}-${String(month).padStart(2, '0')}-${String(
        day
      ).padStart(2, '0')}`,
    };
  }

  return null;
}


function normalizePlanText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/ـ/g, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isSamePlanSuggestion(
  task: { schoolId?: string; title?: string },
  suggestion: AISuggestion
) {
  if (
    !task.schoolId ||
    !suggestion.schoolId ||
    task.schoolId !== suggestion.schoolId
  ) {
    return false;
  }

  const taskTitle = normalizePlanText(task.title || '');
  const suggestionTitle = normalizePlanText(
    suggestion.title || ''
  );

  if (!taskTitle || !suggestionTitle) return false;
  if (taskTitle === suggestionTitle) return true;

  const taskWords = new Set(taskTitle.split(' ').filter(Boolean));
  const suggestionWords = new Set(
    suggestionTitle.split(' ').filter(Boolean)
  );

  const common = [...taskWords].filter((word) =>
    suggestionWords.has(word)
  );

  const similarity =
    common.length /
    Math.max(taskWords.size, suggestionWords.size);

  return similarity >= 0.8 && common.length >= 2;
}

export default function MonthlyPlanScreen() {
  const router = useRouter();

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().getMonth()
  );

  const [selectedYear, setSelectedYear] = useState(
    CURRENT_YEAR
  );

  const {
    schools,
    tasks,
    visits,
    addTask,
    updateTask,
    deleteTask,
  } = useStore();

  const items = useMemo<PlanItem[]>(
  () =>
    tasks
      .map((task) => ({
        id: task.id,
        title: task.title,
        description: task.notes,
        targetDate: task.date,
        status:
          task.planStatus ||
          (task.done ? 'completed' : 'planned'),
        schoolId: task.schoolId,
      }))
      .sort((a, b) => {
  const dateA = getDateParts(a.targetDate);
  const dateB = getDateParts(b.targetDate);

  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;

  const timeA = new Date(
    dateA.year,
    dateA.monthIndex,
    dateA.day
  ).getTime();

  const timeB = new Date(
    dateB.year,
    dateB.monthIndex,
    dateB.day
  ).getTime();

  return timeA - timeB;
}),
  [tasks]
);

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const parts = getDateParts(item.targetDate);

        return (
          parts?.year === selectedYear &&
          parts.monthIndex === selectedMonth
        );
      }),
    [items, selectedMonth, selectedYear]
  );

  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [aiSuggestions, setAiSuggestions] =
  useState<AISuggestion[]>([]);

  const [showAISuggestions, setShowAISuggestions] =
  useState(false)

  const [acceptedSuggestion, setAcceptedSuggestion] =
  useState<AISuggestion | null>(null);

  const statistics = useMemo(() => {
    const total = filteredItems.length;

    const completed = filteredItems.filter(
      (item) => item.status === 'completed'
    ).length;

    const inProgress = filteredItems.filter(
      (item) => item.status === 'in_progress'
    ).length;

    const planned = filteredItems.filter(
      (item) => item.status === 'planned'
    ).length;

    const percentage =
      total === 0
        ? 0
        : Math.round((completed / total) * 100);

    return {
      total,
      completed,
      inProgress,
      planned,
      percentage,
    };
  }, [filteredItems]);

  const requestAISuggestions = async () => {
  try {
    const currentTasks = tasks
      .filter((task) => {
        const parts = getDateParts(task.date);

        return (
          parts &&
          parts.year === selectedYear &&
          parts.monthIndex === selectedMonth
        );
      })
      .map((task) => ({
        schoolId: task.schoolId || '',
        title: task.title || '',
        notes: task.notes || '',
        date: task.date || '',
        planStatus:
          task.planStatus ||
          (task.done ? 'completed' : 'planned'),
        done: !!task.done,
      }));

    const previousTasks = tasks
      .filter((task) => {
        const parts = getDateParts(task.date);

        return !(
          parts &&
          parts.year === selectedYear &&
          parts.monthIndex === selectedMonth
        );
      })
      .map((task) => ({
        schoolId: task.schoolId || '',
        title: task.title || '',
        notes: task.notes || '',
        date: task.date || '',
        planStatus:
          task.planStatus ||
          (task.done ? 'completed' : 'planned'),
        done: !!task.done,
      }));

    const response = await fetch(
      `${(
        process.env.EXPO_PUBLIC_API_URL ||
        'http://localhost:3000'
      ).replace(/\/$/, '')}/api/ai/monthly-plan`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          month: MONTHS[selectedMonth],
          year: String(selectedYear),
          schools: schools.map((school) => ({
            id: school.id,
            name: school.name,
          })),
          visits: visits.map((visit) => ({
            schoolId: visit.schoolId || '',
            date: visit.date || '',
            visitType: '',
          })),
          currentTasks,
          previousTasks,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data?.ok) {
      throw new Error(
        data?.error ||
          'تعذر الحصول على اقتراحات الخطة.'
      );
    }

    const rawSuggestions: AISuggestion[] =
      Array.isArray(data?.result?.suggestions)
        ? data.result.suggestions
        : [];

    const normalizeText = (value: unknown) =>
      String(value || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');

    /*
     * جميع المهام الموجودة في النظام تعتبر
     * مهام موجودة مسبقًا، بغض النظر عن:
     * - الشهر
     * - التاريخ
     * - الحالة
     */
    const existingTaskKeys = new Set(
    currentTasks.map((task) =>
    [
      normalizeText(task.schoolId),
      normalizeText(task.title),
    ].join('|')
  )
);

    const suggestions = rawSuggestions.filter(
  (suggestion) => {
    const suggestionSchoolId =
      normalizeText(suggestion.schoolId);

    const suggestionTitle =
      normalizeText(suggestion.title);

    const alreadyExists = currentTasks.some(
      (task) =>
        normalizeText(task.schoolId) ===
          suggestionSchoolId &&
        normalizeText(task.title) ===
          suggestionTitle
    );

    return !alreadyExists;
  }
);

    console.log(
      'MONTHLY PLAN AI RESULT:',
      data?.result
    );

    console.log(
      'MONTHLY PLAN AI RAW SUGGESTIONS:',
      rawSuggestions
    );

    console.log(
      'MONTHLY PLAN AI FILTERED SUGGESTIONS:',
      suggestions
    );

    setAiSuggestions(suggestions);
    setShowAISuggestions(true);

    if (suggestions.length === 0) {
      Alert.alert(
        'لا توجد اقتراحات جديدة',
        'لا توجد مهام جديدة مناسبة للاقتراح. تم استبعاد المهام الموجودة مسبقًا في الخطة.'
      );
    }
  } catch (error) {
    console.error(
      'MONTHLY PLAN AI ERROR:',
      error
    );

    Alert.alert(
      'تعذر إنشاء الاقتراحات',
      error instanceof Error
        ? error.message
        : 'حدث خطأ أثناء الاتصال بخدمة الذكاء الاصطناعي.'
    );
  }
};

  const addPlanItem = () => {
    if (!title.trim()) {
      Alert.alert(
        'بيانات ناقصة',
        'يرجى كتابة عنوان المهمة.'
      );
      return;
    }

    if (!schoolId) {
      Alert.alert(
        'بيانات ناقصة',
        'يرجى اختيار المدرسة المرتبطة بالمهمة.'
      );
      return;
    }

    if (!targetDate.trim()) {
      Alert.alert(
        'بيانات ناقصة',
        'يرجى إدخال اليوم المستهدف.'
      );
      return;
    }

    const normalizedDay =
      normalizeArabicDigits(targetDate);

    if (!/^\d{1,2}$/.test(normalizedDay)) {
      Alert.alert(
        'اليوم غير صحيح',
        'أدخل رقم اليوم فقط، مثل 20.'
      );
      return;
    }

    const day = Number(normalizedDay);

    const daysInMonth = new Date(
      selectedYear,
      selectedMonth + 1,
      0
    ).getDate();

    if (day < 1 || day > daysInMonth) {
      Alert.alert(
        'اليوم غير صحيح',
        `أدخل يومًا من 1 إلى ${daysInMonth}.`
      );
      return;
    }

    const isoDate =
      `${selectedYear}-` +
      `${String(selectedMonth + 1).padStart(2, '0')}-` +
      `${String(day).padStart(2, '0')}`;

    const savedTask = {
      title: title.trim(),
      schoolId,
      time: '',
      priority: 'medium' as const,
      notes:
        description.trim() ||
        'لا توجد ملاحظات إضافية.',
      done: false,
      date: isoDate,
      planStatus: 'planned' as const,
    };

    addTask(savedTask);

    // حذف الاقتراح الذي تم حفظه من قائمة المقترحات
setAiSuggestions((current) =>
  current.filter((suggestion) => {
    const sameSchool =
      String(suggestion.schoolId).trim() ===
      String(savedTask.schoolId).trim();

    const sameTitle =
      String(suggestion.title || '').trim().toLowerCase() ===
      String(savedTask.title || '').trim().toLowerCase();

    return !(sameSchool && sameTitle);
  })
);

setAcceptedSuggestion(null);
    setTitle('');
    setDescription('');
    setTargetDate('');
    setSchoolId('');
    setShowAddForm(false);

    Alert.alert(
      'تمت الإضافة',
      'تمت إضافة المهمة إلى الخطة الشهرية.'
    );
  };

  const changeStatus = (id: string) => {
    const task = tasks.find(
      (item) => item.id === id
    );

    if (!task) return;

    const currentStatus =
      task.planStatus ||
      (task.done ? 'completed' : 'planned');

    let nextStatus: PlanStatus = 'planned';

    if (currentStatus === 'planned') {
      nextStatus = 'in_progress';
    } else if (currentStatus === 'in_progress') {
      nextStatus = 'completed';
    }

    updateTask(id, {
      ...task,
      planStatus: nextStatus,
      done: nextStatus === 'completed',
    });
  };

  const deleteItem = (id: string) => {
    Alert.alert(
      'حذف المهمة',
      'هل أنت متأكد من حذف هذه المهمة من الخطة؟',
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => deleteTask(id),
        },
      ]
    );
  };

  const getStatusLabel = (
    status: PlanStatus
  ) => {
    if (status === 'completed') return 'مكتملة';
    if (status === 'in_progress') return 'قيد التنفيذ';
    return 'مخططة';
  };

  const getStatusIcon = (
    status: PlanStatus
  ) => {
    if (status === 'completed') {
      return 'check-circle';
    }

    if (status === 'in_progress') {
      return 'clock';
    }

    return 'calendar';
  };

  useEffect(() => {
    const scheduleTomorrowVisitsReminder = async () => {
      try {
        let permission = await Notifications.getPermissionsAsync();

        if (permission.status !== Notifications.PermissionStatus.GRANTED) {
          permission = await Notifications.requestPermissionsAsync();
        }

        if (permission.status !== Notifications.PermissionStatus.GRANTED) {
          return;
        }

        const tomorrow = new Date();
        tomorrow.setHours(0, 0, 0, 0);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const tomorrowIso =
          `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

        const tomorrowVisits = tasks.filter((task) => {
          const date = getDateParts(task.date);
          const status = task.planStatus || (task.done ? 'completed' : 'planned');

          return (
            date?.iso === tomorrowIso &&
            status === 'planned' &&
            /زيارة|زياره/.test(task.title || '')
          );
        });

        if (tomorrowVisits.length === 0) return;

        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        const exists = scheduled.some(
          (item) =>
            item.content.data?.type === 'tomorrow-visits-reminder' &&
            item.content.data?.date === tomorrowIso
        );

        if (exists) return;

        const schoolNames = tomorrowVisits.map(
          (task) =>
            schools.find((school) => school.id === task.schoolId)?.name ||
            'مدرسة غير محددة'
        );

        const body =
          schoolNames.length === 1
            ? `غدًا لديك زيارة إلى ${schoolNames[0]}.`
            : `غدًا لديك زيارات إلى: ${schoolNames.join('، ')}.`;

        const reminderDate = new Date(tomorrow);
        reminderDate.setDate(reminderDate.getDate() - 1);
        reminderDate.setHours(20, 0, 0, 0);

        // إذا كان وقت التذكير قد مضى اليوم، لا ننشئ إشعارًا قديمًا.
        if (reminderDate.getTime() <= Date.now()) return;

        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'تذكير بزيارات الغد',
            body,
            data: {
              type: 'tomorrow-visits-reminder',
              date: tomorrowIso,
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: reminderDate,
          },
        });
      } catch (error) {
        console.error('TOMORROW VISITS NOTIFICATION ERROR:', error);
      }
    };

    scheduleTomorrowVisitsReminder();
  }, [tasks, schools]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather
            name="arrow-right"
            size={22}
            color="#1f4e79"
          />
        </Pressable>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>
            الخطة الشهرية
          </Text>

          <Text style={styles.headerSubtitle}>
            تنظيم ومتابعة الأعمال الشهرية
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <Feather
            name="calendar"
            size={23}
            color="#ffffff"
          />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.monthCard}>
          <Text style={styles.sectionTitle}>
            السنة
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.months}
          >
            {YEARS.map((year) => {
              const selected =
                selectedYear === year;

              return (
                <Pressable
                  key={year}
                  style={[
                    styles.monthButton,
                    selected &&
                      styles.monthButtonSelected,
                  ]}
                  onPress={() =>
                    setSelectedYear(year)
                  }
                >
                  <Text
                    style={[
                      styles.monthText,
                      selected &&
                        styles.monthTextSelected,
                    ]}
                  >
                    {year}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text
            style={[
              styles.sectionTitle,
              { marginTop: 16 },
            ]}
          >
            الشهر المستهدف
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.months}
          >
            {MONTHS.map((month, index) => {
              const selected =
                selectedMonth === index;

              return (
                <Pressable
                  key={month}
                  style={[
                    styles.monthButton,
                    selected &&
                      styles.monthButtonSelected,
                  ]}
                  onPress={() =>
                    setSelectedMonth(index)
                  }
                >
                  <Text
                    style={[
                      styles.monthText,
                      selected &&
                        styles.monthTextSelected,
                    ]}
                  >
                    {month}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.selectedMonth}>
            خطة شهر {MONTHS[selectedMonth]}{' '}
            {selectedYear}
          </Text>
        </View>

        <View style={styles.statisticsRow}>
          <View style={styles.statCard}>
            <Feather
              name="list"
              size={22}
              color="#1f4e79"
            />

            <Text style={styles.statNumber}>
              {statistics.total}
            </Text>

            <Text style={styles.statLabel}>
              إجمالي الأعمال
            </Text>
          </View>

          <View style={styles.statCard}>
            <Feather
              name="clock"
              size={22}
              color="#b7791f"
            />

            <Text style={styles.statNumber}>
              {statistics.inProgress}
            </Text>

            <Text style={styles.statLabel}>
              قيد التنفيذ
            </Text>
          </View>

          <View style={styles.statCard}>
            <Feather
              name="check-circle"
              size={22}
              color="#2f855a"
            />

            <Text style={styles.statNumber}>
              {statistics.completed}
            </Text>

            <Text style={styles.statLabel}>
              مكتملة
            </Text>
          </View>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>
              نسبة تنفيذ الخطة
            </Text>

            <Text
              style={styles.progressPercentage}
            >
              {statistics.percentage}%
            </Text>
          </View>

          <View
            style={styles.progressBackground}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${statistics.percentage}%`,
                },
              ]}
            />
          </View>

          <Text style={styles.progressHint}>
            يتم احتساب النسبة بناءً على
            الأعمال المكتملة للشهر المحدد.
          </Text>
        </View>

         <Pressable
  style={styles.aiButton}
  onPress={requestAISuggestions}
>
  <Feather
    name="zap"
    size={20}
    color="#ffffff"
  />

  <Text style={styles.aiButtonText}>
    اقتراح خطة بالذكاء الاصطناعي
  </Text>
</Pressable>
{showAISuggestions && (
  <View style={styles.aiSuggestionsCard}>
    <View style={styles.aiSuggestionsHeader}>
      <View style={styles.aiSuggestionsHeaderText}>
        <Text style={styles.aiSuggestionsTitle}>
          مقترحات الذكاء الاصطناعي
        </Text>

        <Text style={styles.aiSuggestionsSubtitle}>
          راجع المقترحات قبل إضافتها إلى الخطة
        </Text>
      </View>

      <Pressable
        onPress={() =>
          setShowAISuggestions(false)
        }
      >
        <Feather
          name="x"
          size={20}
          color="#777"
        />
      </Pressable>
    </View>

    {aiSuggestions.map(
      (suggestion, index) => {
        const schoolName =
          schools.find(
            (school) =>
              school.id ===
              suggestion.schoolId
          )?.name ||
          'مدرسة غير محددة';

        return (
          <View
            key={`${suggestion.schoolId}-${index}`}
            style={styles.aiSuggestionItem}
          >
            <View
              style={styles.aiSuggestionIcon}
            >
              <Feather
                name="zap"
                size={18}
                color="#6b46c1"
              />
            </View>

            <View
              style={styles.aiSuggestionContent}
            >
              <Text
                style={
                  styles.aiSuggestionTitle
                }
              >
                {suggestion.title}
              </Text>

              <Text
                style={
                  styles.aiSuggestionSchool
                }
              >
                المدرسة: {schoolName}
              </Text>

              <Text
                style={
                  styles.aiSuggestionNotes
                }
              >
                {suggestion.notes}
              </Text>

              <Text
                style={
                  styles.aiSuggestionReason
                }
              >
                سبب الاقتراح: {suggestion.reason}
              </Text>
            </View>

            <Pressable
              style={
                styles.aiAcceptButton
              }
              onPress={() => {
                setTitle(
                  suggestion.title
                );

                setDescription(
                  suggestion.notes
                );

                setSchoolId(
                  suggestion.schoolId
                );
                setAcceptedSuggestion(suggestion);
                setShowAddForm(true);
                setShowAISuggestions(false);

                Alert.alert(
                  'تم تجهيز المهمة',
                  'تم نقل الاقتراح إلى نموذج الإضافة. اختر اليوم ثم احفظ المهمة.'
                );
              }}
            >
              <Feather
                name="check"
                size={16}
                color="#ffffff"
              />

              <Text
                style={
                  styles.aiAcceptButtonText
                }
              >
                اعتماد الاقتراح
              </Text>
            </Pressable>
          </View>
        );
      }
    )}
  </View>
)}

        <Pressable
          style={styles.addButton}
          onPress={() =>
            setShowAddForm((value) => !value)
          }
        >
          <Feather
            name={showAddForm ? 'x' : 'plus'}
            size={20}
            color="#ffffff"
          />

          <Text style={styles.addButtonText}>
            {showAddForm
              ? 'إلغاء إضافة مهمة'
              : 'إضافة مهمة إلى الخطة'}
          </Text>
        </Pressable>

        {showAddForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              إضافة عمل جديد
            </Text>

            <Text
              style={styles.singleSupervisorNote}
            >
              يتم تنفيذ الخطة بواسطة المشرف
              الحالي، لذلك لا حاجة لاختيار اسم
              مشرف.
            </Text>

            <Text style={styles.label}>
              المدرسة المرتبطة بالمهمة
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={
                styles.schoolChips
              }
            >
              {schools.map((school) => {
                const selected =
                  schoolId === school.id;

                return (
                  <Pressable
                    key={school.id}
                    onPress={() =>
                      setSchoolId(school.id)
                    }
                    style={[
                      styles.schoolChip,
                      selected &&
                        styles.schoolChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.schoolChipText,
                        selected &&
                          styles.schoolChipTextSelected,
                      ]}
                    >
                      {school.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.label}>
              عنوان المهمة
            </Text>

            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="مثال: زيارة مدرسة..."
              placeholderTextColor="#999"
              style={styles.input}
              textAlign="right"
            />

            <Text style={styles.label}>
              وصف المهمة
            </Text>

            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="اكتب تفاصيل العمل أو الهدف منه..."
              placeholderTextColor="#999"
              style={[
                styles.input,
                styles.textArea,
              ]}
              textAlign="right"
              multiline
            />

            <Text style={styles.label}>
              اليوم المستهدف
            </Text>

            <TextInput
              value={targetDate}
              onChangeText={setTargetDate}
              placeholder="مثال: 20"
              placeholderTextColor="#999"
              style={styles.input}
              textAlign="right"
              keyboardType="number-pad"
              maxLength={2}
            />

            <Text style={styles.dateHint}>
              أدخل رقم اليوم فقط، مثل 20. سيتم أخذ
              الشهر والسنة تلقائيًا من الاختيار
              أعلاه: {MONTHS[selectedMonth]}{' '}
              {selectedYear}.
            </Text>

            <Pressable
              style={styles.saveButton}
              onPress={addPlanItem}
            >
              <Feather
                name="save"
                size={19}
                color="#ffffff"
              />

              <Text
                style={styles.saveButtonText}
              >
                حفظ المهمة
              </Text>
            </Pressable>
          </View>
        )}

        <View style={styles.listHeader}>
          <View>
            <Text style={styles.listTitle}>
              أعمال الخطة
            </Text>

            <Text
              style={styles.listSubtitle}
            >
              {filteredItems.length} أعمال مسجلة
              لشهر {MONTHS[selectedMonth]}{' '}
              {selectedYear}
            </Text>
          </View>

          <Feather
            name="clipboard"
            size={23}
            color="#1f4e79"
          />
        </View>

        {filteredItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <Feather
              name="calendar"
              size={42}
              color="#a0aec0"
            />

            <Text style={styles.emptyTitle}>
              لا توجد أعمال
            </Text>

            <Text style={styles.emptyText}>
              لا توجد أعمال مسجلة لشهر{' '}
              {MONTHS[selectedMonth]}{' '}
              {selectedYear}. ابدأ بإضافة الأعمال
              والزيارات المطلوبة.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredItems}
            scrollEnabled={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.itemCard}>
                <View style={styles.itemTop}>
                  <View style={styles.itemIcon}>
                    <Feather
                      name={
                        getStatusIcon(
                          item.status
                        ) as any
                      }
                      size={21}
                      color="#1f4e79"
                    />
                  </View>

                  <View style={styles.itemMain}>
                    <Text style={styles.itemTitle}>
                      {item.title}
                    </Text>

                    <Text
                      style={
                        styles.itemDescription
                      }
                    >
                      {item.description}
                    </Text>

                    {item.schoolId ? (
                      <Text
                        style={styles.itemSchool}
                      >
                        المدرسة:{' '}
                        {schools.find(
                          (s) =>
                            s.id === item.schoolId
                        )?.name ||
                          'غير محددة'}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <View style={styles.itemDetails}>
                  <View
                    style={styles.detailRow}
                  >
                    <Feather
                      name="calendar"
                      size={15}
                      color="#777"
                    />

                    <Text
                      style={styles.detailText}
                    >
                      {item.targetDate}
                    </Text>
                  </View>
                </View>

                <View style={styles.itemFooter}>
                  <Pressable
                    style={[
                      styles.statusButton,
                      item.status ===
                        'completed' &&
                        styles.completedButton,
                      item.status ===
                        'in_progress' &&
                        styles.progressButton,
                    ]}
                    onPress={() =>
                      changeStatus(item.id)
                    }
                  >
                    <Feather
                      name={
                        getStatusIcon(
                          item.status
                        ) as any
                      }
                      size={15}
                      color="#ffffff"
                    />

                    <Text
                      style={
                        styles.statusButtonText
                      }
                    >
                      {getStatusLabel(
                        item.status
                      )}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.deleteButton}
                    onPress={() =>
                      deleteItem(item.id)
                    }
                  >
                    <Feather
                      name="trash-2"
                      size={17}
                      color="#c53030"
                    />
                  </Pressable>
                </View>
              </View>
            )}
          />
        )}

        <View style={styles.futureCard}>
          <Feather
            name="info"
            size={20}
            color="#1f4e79"
          />

          <View
            style={styles.futureTextContainer}
          >
            <Text style={styles.futureTitle}>
              التطوير القادم
            </Text>

            <Text style={styles.futureText}>
              سيتم ربط الخطة الشهرية بزيارات
              المدارس ومتابعة الكتب الوزارية
              والتوصيات، مع إمكانية استخراج
              تقرير شهري عن نسبة التنفيذ.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },

  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#eef4f8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTextContainer: {
    flex: 1,
    alignItems: 'flex-end',
    marginHorizontal: 12,
  },

  headerTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#1f4e79',
  },

  headerSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: '#777',
  },

  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#1f4e79',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: {
    flex: 1,
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  monthCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },

  sectionTitle: {
    textAlign: 'right',
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 12,
  },

  months: {
    flexDirection: 'row-reverse',
    gap: 8,
  },

  monthButton: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },

  monthButtonSelected: {
    backgroundColor: '#1f4e79',
  },

  monthText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
  },

  monthTextSelected: {
    color: '#ffffff',
  },

  selectedMonth: {
    textAlign: 'right',
    marginTop: 14,
    color: '#1f4e79',
    fontSize: 15,
    fontWeight: '700',
  },

  statisticsRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginBottom: 14,
  },

  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 7,
    alignItems: 'center',
  },

  statNumber: {
    fontSize: 23,
    fontWeight: '800',
    color: '#222',
    marginTop: 5,
  },

  statLabel: {
    fontSize: 11,
    color: '#777',
    marginTop: 3,
    textAlign: 'center',
  },

  progressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 17,
    marginBottom: 14,
  },

  progressHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  progressTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },

  progressPercentage: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1f4e79',
  },

  progressBackground: {
    height: 10,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#1f4e79',
    borderRadius: 10,
  },

  progressHint: {
    textAlign: 'right',
    marginTop: 8,
    fontSize: 11,
    color: '#888',
  },

   aiButton: {
  height: 50,
  borderRadius: 12,
  backgroundColor: '#6b46c1',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  marginBottom: 14,
},

aiButtonText: {
  color: '#ffffff',
  fontSize: 15,
  fontWeight: '700',
},

aiSuggestionsCard: {
  backgroundColor: '#ffffff',
  borderRadius: 14,
  padding: 16,
  marginBottom: 14,
  borderWidth: 1,
  borderColor: '#e2e8f0',
},

aiSuggestionsHeader: {
  flexDirection: 'row-reverse',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  marginBottom: 14,
},

aiSuggestionsHeaderText: {
  flex: 1,
  alignItems: 'flex-end',
},

aiSuggestionsTitle: {
  fontSize: 17,
  fontWeight: '700',
  color: '#1f4e79',
  marginBottom: 4,
  textAlign: 'right',
},

aiSuggestionsSubtitle: {
  fontSize: 13,
  color: '#718096',
  textAlign: 'right',
},

aiSuggestionItem: {
  borderTopWidth: 1,
  borderTopColor: '#edf2f7',
  paddingTop: 14,
  marginTop: 4,
},

aiSuggestionIcon: {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: '#f3e8ff',
  alignItems: 'center',
  justifyContent: 'center',
  alignSelf: 'flex-end',
  marginBottom: 8,
},

aiSuggestionContent: {
  width: '100%',
  alignItems: 'flex-end',
},

aiSuggestionTitle: {
  fontSize: 16,
  fontWeight: '700',
  color: '#2d3748',
  textAlign: 'right',
  marginBottom: 6,
},

aiSuggestionSchool: {
  fontSize: 14,
  fontWeight: '600',
  color: '#1f4e79',
  textAlign: 'right',
  marginBottom: 6,
},

aiSuggestionNotes: {
  fontSize: 14,
  lineHeight: 21,
  color: '#4a5568',
  textAlign: 'right',
  marginBottom: 6,
},

aiSuggestionReason: {
  fontSize: 13,
  lineHeight: 19,
  color: '#718096',
  textAlign: 'right',
  marginBottom: 12,
},

aiAcceptButton: {
  minHeight: 42,
  borderRadius: 10,
  backgroundColor: '#2f855a',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  paddingHorizontal: 14,
  marginTop: 4,
},

aiAcceptButtonText: {
  color: '#ffffff',
  fontSize: 14,
  fontWeight: '700',
},
  addButton: {
    height: 50,
    borderRadius: 11,
    backgroundColor: '#1f4e79',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },

  addButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },

  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 17,
    marginBottom: 18,
  },

  formTitle: {
    textAlign: 'right',
    fontSize: 17,
    fontWeight: '800',
    color: '#1f4e79',
    marginBottom: 15,
  },

  singleSupervisorNote: {
    textAlign: 'right',
    fontSize: 11,
    color: '#777',
    lineHeight: 18,
    marginBottom: 6,
  },

  schoolChips: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },

  schoolChip: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },

  schoolChipSelected: {
    backgroundColor: '#1f4e79',
    borderColor: '#1f4e79',
  },

  schoolChipText: {
    color: '#333333',
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
  },

  schoolChipTextSelected: {
    color: '#ffffff',
  },

  label: {
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '700',
    color: '#444',
    marginBottom: 6,
    marginTop: 8,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#d7dce1',
    borderRadius: 10,
    backgroundColor: '#fafafa',
    paddingHorizontal: 13,
    fontSize: 14,
    color: '#222',
  },

  textArea: {
    height: 90,
    paddingTop: 12,
    textAlignVertical: 'top',
  },

  dateHint: {
    textAlign: 'right',
    color: '#888',
    fontSize: 10,
    lineHeight: 17,
    marginTop: 5,
  },

  saveButton: {
    height: 48,
    borderRadius: 10,
    backgroundColor: '#2f855a',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },

  saveButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },

  listHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 10,
    paddingHorizontal: 3,
  },

  listTitle: {
    textAlign: 'right',
    fontSize: 18,
    fontWeight: '800',
    color: '#222',
  },

  listSubtitle: {
    textAlign: 'right',
    fontSize: 12,
    color: '#888',
    marginTop: 3,
  },

  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },

  itemTop: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
  },

  itemIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor: '#eef4f8',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 11,
  },

  itemMain: {
    flex: 1,
  },

  itemTitle: {
    textAlign: 'right',
    fontSize: 16,
    fontWeight: '800',
    color: '#222',
  },

  itemDescription: {
    textAlign: 'right',
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginTop: 5,
  },

  itemSchool: {
    marginTop: 5,
    fontSize: 10,
    color: '#1f4e79',
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'right',
  },

  itemDetails: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#edf0f2',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },

  detailRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
  },

  detailText: {
    fontSize: 11,
    color: '#777',
  },

  itemFooter: {
    marginTop: 14,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  statusButton: {
    minWidth: 115,
    height: 36,
    borderRadius: 9,
    backgroundColor: '#718096',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 12,
  },

  progressButton: {
    backgroundColor: '#b7791f',
  },

  completedButton: {
    backgroundColor: '#2f855a',
  },

  statusButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },

  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: '#fff5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 35,
    alignItems: 'center',
    marginBottom: 14,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#444',
    marginTop: 12,
  },

  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 13,
    lineHeight: 21,
    marginTop: 7,
  },

  futureCard: {
    marginTop: 10,
    backgroundColor: '#eef4f8',
    borderRadius: 14,
    padding: 15,
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
  },

  futureTextContainer: {
    flex: 1,
    marginRight: 10,
  },

  futureTitle: {
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '800',
    color: '#1f4e79',
  },

  futureText: {
    textAlign: 'right',
    fontSize: 12,
    color: '#5f6b75',
    lineHeight: 19,
    marginTop: 5,
  },
});