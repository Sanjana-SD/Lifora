import { NotebookPen } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/common/EmptyState';
import { useTheme } from '@/hooks/useTheme';

export default function NotesScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <EmptyState
        icon={NotebookPen}
        title="Notes are on their way"
        description="Notes and checklists, with search and templates, arrive in a later phase."
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
