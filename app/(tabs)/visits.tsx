import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { useStore, statusLabels } from '@/context/AppContext';

export default function Visits() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { visits, schools } = useStore();

  const completed = visits.filter(
    (v) => v.status === 'completed'
  ).length;

  const planned = visits.filter(
    (v) => v.status === 'planned'
  ).length;

  const postponed = visits.filter(
    (v) => v.status === 'postponed'
  ).length;

  const getSchoolName = (schoolId: string) => {
    return (
      schools.find((school) => school.id === schoolId)?.name ||
      'مدرسة غير محددة'
    );
  };

  const openSavedVisit = (visit: (typeof visits)[number]) => {
    router.push({
      pathname: '/visit-details',
      params: {
        visitId: String(visit.id),
      },
    });
  };

  const openVisitAI = (visit: (typeof visits)[number]) => {
    const schoolName = getSchoolName(visit.schoolId);

    router.push({
      pathname: '/visit-ai',
      params: {
        visitId: visit.id,
        schoolName,
        reason: visit.reason,
        actions: visit.actions,
      },
    });
  };

  return (
    <View
      style={[
        styles.page,
        { backgroundColor: c.background },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 12,
            borderBottomColor: c.border,
          },
        ]}
      >
        <View style={styles.headerText}>
          <Text
            style={[
              styles.title,
              { color: c.foreground },
            ]}
          >
            الزيارات
          </Text>

          <Text
            style={[
              styles.subtitle,
              { color: c.mutedForeground },
            ]}
          >
            سجل الزيارات التربوية ومتابعتها
          </Text>
        </View>

        <View
          style={[
            styles.headerIcon,
            { backgroundColor: c.secondary },
          ]}
        >
          <Feather
            name="camera"
            size={22}
            color={c.primary}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: insets.bottom + 110,
          },
        ]}
      >
        {/* Statistics */}
        <View style={styles.stats}>
          <StatCard
            icon="check-circle"
            label="تمت"
            value={completed}
            c={c}
          />

          <StatCard
            icon="clock"
            label="مخططة"
            value={planned}
            c={c}
          />

          <StatCard
            icon="pause-circle"
            label="مؤجلة"
            value={postponed}
            c={c}
          />
        </View>

        {/* New visit */}
        <Pressable
          onPress={() =>
            router.push('/visit-form')
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
            size={20}
            color={c.primaryForeground}
          />

          <Text
            style={[
              styles.newVisitText,
              { color: c.primaryForeground },
            ]}
          >
            تسجيل زيارة جديدة
          </Text>
        </Pressable>

        {/* Section title */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              { color: c.foreground },
            ]}
          >
            سجل الزيارات
          </Text>

          <Text
            style={[
              styles.countText,
              { color: c.mutedForeground },
            ]}
          >
            {visits.length} زيارة
          </Text>
        </View>

        {visits.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: c.card,
                borderColor: c.border,
              },
            ]}
          >
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: c.secondary },
              ]}
            >
              <Feather
                name="clipboard"
                size={27}
                color={c.primary}
              />
            </View>

            <Text
              style={[
                styles.emptyTitle,
                { color: c.foreground },
              ]}
            >
              لا توجد زيارات محفوظة
            </Text>

            <Text
              style={[
                styles.emptyText,
                { color: c.mutedForeground },
              ]}
            >
              ابدأ بتسجيل زيارة جديدة وستظهر هنا.
            </Text>
          </View>
        ) : (
          visits.map((visit) => {
            const schoolName = getSchoolName(
              visit.schoolId
            );

            return (
              <Pressable
                key={visit.id}
                onPress={() => openSavedVisit(visit)}
                style={({ pressed }) => [
                  styles.visitCard,
                  {
                    backgroundColor: c.card,
                    borderColor: c.border,
                    opacity: pressed ? 0.78 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`فتح زيارة ${schoolName}`}
              >
                {/* Date */}
                <View
                  style={[
                    styles.dateBox,
                    { backgroundColor: c.secondary },
                  ]}
                >
                  <Text
                    style={[
                      styles.dateDay,
                      { color: c.primary },
                    ]}
                  >
                    {visit.date.slice(-2)}
                  </Text>

                  <Text
                    style={[
                      styles.dateMonth,
                      { color: c.mutedForeground },
                    ]}
                  >
                    {getMonthName(visit.date)}
                  </Text>
                </View>

                {/* Details */}
                <View style={styles.visitDetails}>
                  <Text
                    style={[
                      styles.schoolName,
                      { color: c.foreground },
                    ]}
                  >
                    {schoolName}
                  </Text>

                  <Text
                    style={[
                      styles.visitType,
                      { color: c.primary },
                    ]}
                  >
                    {visit.type}
                  </Text>

                  <Text
                    style={[
                      styles.reason,
                      { color: c.mutedForeground },
                    ]}
                    numberOfLines={2}
                  >
                    {visit.reason}
                  </Text>

                  {visit.actions ? (
                    <Text
                      style={[
                        styles.actions,
                        { color: c.mutedForeground },
                      ]}
                      numberOfLines={2}
                    >
                      الإجراءات: {visit.actions}
                    </Text>
                  ) : null}
                </View>

                {/* Status */}
                <View
                  style={[
                    styles.status,
                    {
                      backgroundColor:
                        visit.status === 'completed'
                          ? '#E5F4EC'
                          : visit.status === 'postponed'
                            ? '#FFF2DD'
                            : c.secondary,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color:
                        visit.status === 'completed'
                          ? c.success
                          : visit.status === 'postponed'
                            ? c.warning
                            : c.primary,
                      fontFamily:
                        'Inter_600SemiBold',
                      fontSize: 10,
                    }}
                  >
                    {
                      statusLabels[
                        visit.status
                      ]
                    }
                  </Text>
                </View>

                {/* AI */}
                <Pressable
                  onPress={() =>
                    openVisitAI(visit)
                  }
                  style={[
                    styles.aiButton,
                    {
                      backgroundColor:
                        c.secondary,
                    },
                  ]}
                >
                  <Feather
                    name="cpu"
                    size={17}
                    color={c.primary}
                  />

                  <Text
                    style={{
                      color: c.primary,
                      fontFamily:
                        'Inter_600SemiBold',
                      fontSize: 10,
                    }}
                  >
                    المساعد
                  </Text>
                </Pressable>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function StatCard({
  icon,
  label,
  value,
  c,
}: {
  icon: any;
  label: string;
  value: number;
  c: any;
}) {
  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: c.card,
          borderColor: c.border,
        },
      ]}
    >
      <Feather
        name={icon}
        size={18}
        color={c.primary}
      />

      <Text
        style={[
          styles.statValue,
          { color: c.foreground },
        ]}
      >
        {value}
      </Text>

      <Text
        style={[
          styles.statLabel,
          { color: c.mutedForeground },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function getMonthName(date: string) {
  const month = date.slice(5, 7);

  const months: Record<string, string> = {
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

  return months[month] || '';
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },

  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 11,
  },

  headerText: {
    flex: 1,
    alignItems: 'flex-end',
  },

  title: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    textAlign: 'right',
  },

  subtitle: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    textAlign: 'right',
    marginTop: 3,
  },

  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    paddingHorizontal: 15,
    paddingTop: 15,
  },

  stats: {
    flexDirection: 'row-reverse',
    gap: 8,
  },

  statCard: {
    flex: 1,
    minHeight: 82,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statValue: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    marginTop: 4,
  },

  statLabel: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    marginTop: 2,
  },

  newVisitButton: {
    minHeight: 52,
    borderRadius: 15,
    marginTop: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  newVisitText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },

  sectionHeader: {
    marginTop: 22,
    marginBottom: 10,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },

  countText: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
  },

  visitCard: {
    borderRadius: 17,
    borderWidth: 1,
    padding: 11,
    marginBottom: 10,
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 9,
    flexWrap: 'wrap',
  },

  dateBox: {
    width: 45,
    height: 52,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dateDay: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
  },

  dateMonth: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
    marginTop: 2,
  },

  visitDetails: {
    flex: 1,
    minWidth: 150,
  },

  schoolName: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    textAlign: 'right',
  },

  visitType: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'right',
    marginTop: 4,
  },

  reason: {
    fontSize: 10,
    lineHeight: 17,
    fontFamily: 'Inter_400Regular',
    textAlign: 'right',
    marginTop: 4,
  },

  actions: {
    fontSize: 9,
    lineHeight: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'right',
    marginTop: 3,
  },

  status: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },

  aiButton: {
    minHeight: 34,
    borderRadius: 10,
    paddingHorizontal: 9,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },

  emptyCard: {
    minHeight: 230,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    marginTop: 12,
  },

  emptyText: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    marginTop: 5,
    textAlign: 'center',
  },
});