import { ScrollView, StyleSheet } from 'react-native';

import { CalculatorTeaserCard } from '@/components/dashboard/CalculatorTeaserCard';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { FinanceOverviewCard } from '@/components/dashboard/FinanceOverviewCard';
import { QuickAddRow } from '@/components/dashboard/QuickAddRow';
import { RecentNotesCard } from '@/components/dashboard/RecentNotesCard';
import { RemindersCard } from '@/components/dashboard/RemindersCard';
import { TasksCard } from '@/components/dashboard/TasksCard';
import { TodayEventsCard } from '@/components/dashboard/TodayEventsCard';
import { UpcomingEventsCard } from '@/components/dashboard/UpcomingEventsCard';
import { useTheme } from '@/hooks/useTheme';

export default function HomeScreen() {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}>
      <DashboardHeader />
      <QuickAddRow />
      <TodayEventsCard />
      <UpcomingEventsCard />
      <RemindersCard />
      <TasksCard />
      <FinanceOverviewCard />
      <CalculatorTeaserCard />
      <RecentNotesCard />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 32,
  },
});
