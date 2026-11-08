import { router, type Href } from 'expo-router';
import { Wallet } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SPACING } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';
import { AddLink } from './AddLink';
import { DashboardSection } from './DashboardSection';

const ROWS = [
  { label: 'Today', value: '₹0' },
  { label: 'This Month', value: '₹0' },
  { label: 'Net Balance', value: '₹0' },
];

export function FinanceOverviewCard() {
  const { colors } = useTheme();

  return (
    <DashboardSection icon={Wallet} title="Finance" onPress={() => router.push('/(tabs)/finance' as Href)}>
      <Text style={[styles.empty, { color: colors.textMuted }]}>No expenses logged yet this month.</Text>
      <View style={styles.rows}>
        {ROWS.map((row) => (
          <View key={row.label} style={styles.row}>
            <Text style={[styles.rowValue, { color: colors.text }]}>{row.value}</Text>
            <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{row.label}</Text>
          </View>
        ))}
      </View>
      <AddLink label="Add an expense" onPress={() => router.push('/finance/add-transaction' as Href)} />
    </DashboardSection>
  );
}

const styles = StyleSheet.create({
  empty: {
    fontSize: 13,
    lineHeight: 18,
  },
  rows: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },
  row: {
    alignItems: 'center',
  },
  rowValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  rowLabel: {
    fontSize: 11,
    marginTop: 2,
  },
});
