import { LayoutGrid } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { EmptyState } from '@/components/common/EmptyState';
import { APP_TAGLINE } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';

export default function HomeScreen() {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}>
      <Text style={[styles.tagline, { color: colors.textMuted }]}>{APP_TAGLINE}</Text>
      <EmptyState
        icon={LayoutGrid}
        title="Your dashboard is coming together"
        description="Today's events, tasks, reminders, and spending will all show up here as each module is built."
      />
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
  },
  tagline: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 8,
  },
});
