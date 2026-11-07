import { Wallet } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/common/EmptyState';
import { useTheme } from '@/hooks/useTheme';

export default function FinanceScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <EmptyState
        icon={Wallet}
        title="Finance is on its way"
        description="Income, expenses, budgets, and bank statement import arrive in a later phase."
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
