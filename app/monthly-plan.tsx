import React, { useMemo, useState } from 'react';
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


export default function MonthlyPlanScreen() {
  const router = useRouter();

  const [selectedMonth, setSelectedMonth] = useState(7);
  const { schools, tasks, addTask, updateTask, deleteTask } = useStore();

  const items = useMemo<PlanItem[]>(() => {
    return tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.notes,
      targetDate: task.date,
      status: task.planStatus || (task.done ? 'completed' : 'planned'),
      schoolId: task.schoolId,
    }));
  }, [tasks]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [schoolId, setSchoolId] = useState('');

  const statistics = useMemo(() => {
    const total = items.length;
    const completed = items.filter(
      (item) => item.status === 'completed'
    ).length;
    const inProgress = items.filter(
      (item) => item.status === 'in_progress'
    ).length;
    const planned = items.filter(
      (item) => item.status === 'planned'
    ).length;

    const percentage =
      total === 0 ? 0 : Math.round((completed / total) * 100);

    return {
      total,
      completed,
      inProgress,
      planned,
      percentage,
    };
  }, [items]);

  const addPlanItem = () => {
    if (!title.trim()) {
      Alert.alert('بيانات ناقصة', 'يرجى كتابة عنوان المهمة.');
      return;
    }

    if (!schoolId) {
      Alert.alert('بيانات ناقصة', 'يرجى اختيار المدرسة المرتبطة بالمهمة.');
      return;
    }

    if (!targetDate.trim()) {
      Alert.alert('بيانات ناقصة', 'يرجى إدخال التاريخ المستهدف.');
      return;
    }

    addTask({
      title: title.trim(),
      schoolId,
      time: '',
      priority: 'medium',
      notes: description.trim() || 'لا توجد ملاحظات إضافية.',
      done: false,
      date: targetDate.trim(),
      planStatus: 'planned',
    });

    setTitle('');
    setDescription('');
    setTargetDate('');
    setSchoolId('');
    setShowAddForm(false);

    Alert.alert('تمت الإضافة', 'تمت إضافة المهمة إلى الخطة الشهرية.');
  };

  const changeStatus = (id: string) => {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;

    const currentStatus = task.planStatus || (task.done ? 'completed' : 'planned');
    let nextStatus: PlanStatus = 'planned';

    if (currentStatus === 'planned') {
      nextStatus = 'in_progress';
    } else if (currentStatus === 'in_progress') {
      nextStatus = 'completed';
    } else {
      nextStatus = 'planned';
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
          onPress: () => {
            deleteTask(id);
          },
        },
      ]
    );
  };

  const getStatusLabel = (status: PlanStatus) => {
    switch (status) {
      case 'completed':
        return 'مكتملة';
      case 'in_progress':
        return 'قيد التنفيذ';
      default:
        return 'مخططة';
    }
  };

  const getStatusIcon = (status: PlanStatus) => {
    switch (status) {
      case 'completed':
        return 'check-circle';
      case 'in_progress':
        return 'clock';
      default:
        return 'calendar';
    }
  };

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
            الشهر المستهدف
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.months}
          >
            {MONTHS.map((month, index) => {
              const selected = selectedMonth === index;

              return (
                <Pressable
                  key={month}
                  style={[
                    styles.monthButton,
                    selected && styles.monthButtonSelected,
                  ]}
                  onPress={() => setSelectedMonth(index)}
                >
                  <Text
                    style={[
                      styles.monthText,
                      selected && styles.monthTextSelected,
                    ]}
                  >
                    {month}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.selectedMonth}>
            خطة شهر {MONTHS[selectedMonth]} 2026
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
            <Text style={styles.statLabel}>إجمالي الأعمال</Text>
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
            <Text style={styles.statLabel}>قيد التنفيذ</Text>
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
            <Text style={styles.statLabel}>مكتملة</Text>
          </View>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>
              نسبة تنفيذ الخطة
            </Text>

            <Text style={styles.progressPercentage}>
              {statistics.percentage}%
            </Text>
          </View>

          <View style={styles.progressBackground}>
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
            يتم احتساب النسبة بناءً على الأعمال المكتملة.
          </Text>
        </View>

        <Pressable
          style={styles.addButton}
          onPress={() => setShowAddForm((value) => !value)}
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

            <Text style={styles.singleSupervisorNote}>
              يتم تنفيذ الخطة بواسطة المشرف الحالي، لذلك لا حاجة لاختيار اسم مشرف.
            </Text>

            <Text style={styles.label}>
              المدرسة المرتبطة بالمهمة
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.schoolChips}
            >
              {schools.map((school) => {
                const selected = schoolId === school.id;
                return (
                  <Pressable
                    key={school.id}
                    onPress={() => setSchoolId(school.id)}
                    style={[
                      styles.schoolChip,
                      selected && styles.schoolChipSelected,
                    ]}
                  >
                    <Text style={[styles.schoolChipText, selected && styles.schoolChipTextSelected]}>
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
              التاريخ المستهدف
            </Text>

            <TextInput
              value={targetDate}
              onChangeText={setTargetDate}
              placeholder="مثال: 2026-08-20"
              placeholderTextColor="#999"
              style={styles.input}
              textAlign="right"
            />

            <Pressable
              style={styles.saveButton}
              onPress={addPlanItem}
            >
              <Feather
                name="save"
                size={19}
                color="#ffffff"
              />
              <Text style={styles.saveButtonText}>
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

            <Text style={styles.listSubtitle}>
              {items.length} أعمال مسجلة لهذا الشهر
            </Text>
          </View>

          <Feather
            name="clipboard"
            size={23}
            color="#1f4e79"
          />
        </View>

        {items.length === 0 ? (
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
              ابدأ بإضافة الأعمال والزيارات المطلوبة لهذا الشهر.
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            scrollEnabled={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.itemCard}>
                <View style={styles.itemTop}>
                  <View style={styles.itemIcon}>
                    <Feather
                      name={getStatusIcon(item.status) as any}
                      size={21}
                      color="#1f4e79"
                    />
                  </View>

                  <View style={styles.itemMain}>
                    <Text style={styles.itemTitle}>
                      {item.title}
                    </Text>

                    <Text style={styles.itemDescription}>
                      {item.description}
                    </Text>

                    {item.schoolId ? (
                      <Text style={styles.itemSchool}>
                        المدرسة: {schools.find((s) => s.id === item.schoolId)?.name || 'غير محددة'}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <View style={styles.itemDetails}>
                  <View style={styles.detailRow}>
                    <Feather
                      name="calendar"
                      size={15}
                      color="#777"
                    />

                    <Text style={styles.detailText}>
                      {item.targetDate}
                    </Text>
                  </View>
                </View>

                <View style={styles.itemFooter}>
                  <Pressable
                    style={[
                      styles.statusButton,
                      item.status === 'completed' &&
                        styles.completedButton,
                      item.status === 'in_progress' &&
                        styles.progressButton,
                    ]}
                    onPress={() =>
                      changeStatus(item.id)
                    }
                  >
                    <Feather
                      name={getStatusIcon(
                        item.status
                      ) as any}
                      size={15}
                      color="#ffffff"
                    />

                    <Text style={styles.statusButtonText}>
                      {getStatusLabel(item.status)}
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

          <View style={styles.futureTextContainer}>
            <Text style={styles.futureTitle}>
              التطوير القادم
            </Text>

            <Text style={styles.futureText}>
              سيتم ربط الخطة الشهرية بزيارات المدارس
              ومتابعة الكتب الوزارية والتوصيات، مع إمكانية
              استخراج تقرير شهري عن نسبة التنفيذ.
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

  itemSchool: {
    marginTop: 5,
    fontSize: 10,
    color: '#1f4e79',
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'right',
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