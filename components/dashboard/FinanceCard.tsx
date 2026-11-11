import { router, type Href } from 'expo-router';
import { Wallet } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SPACING, TYPE } from '@/constants/appConfig';
import { useCategoryMap } from '@/hooks/useCalendar';
import { useFinanceHomeSummary } from '@/hooks/useFinance';
import { useTheme } from '@/hooks/useTheme';
import { formatPaise } from '@/utils/money';
import { AddLink } from './AddLink';
import { DashboardSection } from './DashboardSection';

const BREAKDOWN_SHOWN = 3;

/**
 * Today's spending with a one-line category breakdown, and this month's
 * totals (PRD 1.2). Every figure is a live aggregate; the card hides until
 * the first transaction exists rather than showing placeholder zeros.
 */
export function FinanceCard() {
  const { colors } = useTheme();
  const { summary, error } = useFinanceHomeSummary();
  const categories = useCategoryMap('finance');

  if (!error && (!summary || !summary.hasAnyTransactions)) return null;

  const breakdown = (summary?.todayByCategory ?? [])
    .slice(0, BREAKDOWN_SHOWN)
    .map((c) => `${(c.categoryId !== null && categories.get(c.categoryId)?.name) || 'Uncategorized'} ${formatPaise(c.totalPaise, { decimals: 'auto' })}`)
    .join(' · ');

  return (
    <DashboardSection icon={Wallet} title="Today's spending" onPress={() => router.push('/(tabs)/finance' as Href)}>
      {error || !summary ? (
        <Text style={[styles.muted, { color: colors.danger }]}>{"Couldn't load your finances."}</Text>
      ) : (
        <>
          <Text
            style={[styles.today, { color: colors.text }]}
            accessibilityLabel={`Spent today: ${formatPaise(summary.spentTodayPaise)}`}>
            {formatPaise(summary.spentTodayPaise, { decimals: 'auto' })}
          </Text>
          <Text style={[styles.muted, { color: colors.textMuted }]} numberOfLines={2}>
            {breakdown || 'Nothing spent yet today.'}
          </Text>
          <View style={[styles.month, { borderTopColor: colors.border }]}>
            <View style={styles.stat} accessible accessibilityLabel={`Spent this month: ${formatPaise(summary.monthExpensePaise)}`}>
              <Text style={[styles.statValue, { color: colors.text }]}>{formatPaise(summary.monthExpensePaise, { decimals: 'auto' })}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Spent this month</Text>
            </View>
            <View style={styles.stat} accessible accessibilityLabel={`Income this month: ${formatPaise(summary.monthIncomePaise)}`}>
              <Text style={[styles.statValue, { color: colors.success }]}>{formatPaise(summary.monthIncomePaise, { decimals: 'auto' })}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Income this month</Text>
            </View>
          </View>
        </>
      )}
      <AddLink label="Add an expense" onPress={() => router.push('/finance/add-transaction?type=expense' as Href)} />
    </DashboardSection>
  );
}

const styles = StyleSheet.create({
  today: {
    ...TYPE.display,
    fontVariant: ['tabular-nums'],
  },
  muted: {
    ...TYPE.bodySmall,
    marginTop: 2,
  },
  month: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
  },
  stat: {
    flex: 1,
  },
  statValue: {
    ...TYPE.heading,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    ...TYPE.caption,
    marginTop: 2,
  },
});
