import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { QuickAddRow } from '@/components/dashboard/QuickAddRow';
import { RecentNotesCard } from '@/components/dashboard/RecentNotesCard';
import { RemindersCard } from '@/components/dashboard/RemindersCard';
import { TasksCard } from '@/components/dashboard/TasksCard';
import { TodayEventsCard } from '@/components/dashboard/TodayEventsCard';
import { UpcomingEventsCard } from '@/components/dashboard/UpcomingEventsCard';
import { SPACING } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';

// Today first, then what's next. Cards with nothing to show hide themselves,
// except Today's events, which anchors the day. A finance summary joins once
// expenses can actually be recorded, never as placeholder numbers.
export default function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACING.lg }]}>
      <DashboardHeader />
      <QuickAddRow />
      <TodayEventsCard />
      <RemindersCard />
      <TasksCard />
      <UpcomingEventsCard />
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
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
});
