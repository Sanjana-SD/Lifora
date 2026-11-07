import { CalendarDays } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/common/EmptyState';
import { useTheme } from '@/hooks/useTheme';

export default function CalendarScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <EmptyState
        icon={CalendarDays}
        title="Calendar is on its way"
        description="Month, week, and day views with events and recurrence arrive in a later phase."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
});
