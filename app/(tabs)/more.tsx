import { MoreHorizontal } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/common/EmptyState';
import { useTheme } from '@/hooks/useTheme';

export default function MoreScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <EmptyState
        icon={MoreHorizontal}
        title="More is on its way"
        description="Reminders and Tasks, Calculator, and Settings will be reachable from here."
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
