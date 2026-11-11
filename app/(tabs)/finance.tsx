import { addMonths, format, isSameMonth, startOfMonth } from 'date-fns';
import { Tabs, router, type Href } from 'expo-router';
import { BarChart3, ChevronLeft, ChevronRight, History, PieChart, Receipt, Wallet } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { FloatingActionButton } from '@/components/common/FloatingActionButton';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { CategoryBreakdown } from '@/components/finance/CategoryBreakdown';
import { SpendingTrend } from '@/components/finance/SpendingTrend';
import { TransactionRow } from '@/components/finance/TransactionRow';
import { RADIUS, SPACING, TOUCH_TARGET, TYPE } from '@/constants/appConfig';
import { useCategoryMap } from '@/hooks/useCalendar';
import { useFinanceDashboard } from '@/hooks/useFinance';
import { useTheme } from '@/hooks/useTheme';
import { toMonthKey } from '@/services/financeService';
import { formatPaise } from '@/utils/money';

const addTransaction = (type: 'expense' | 'income' = 'expense') =>
  router.push(`/finance/add-transaction?type=${type}` as Href);
const openTransaction = (id: number) => router.push(`/finance/transaction-details?id=${id}` as Href);
const openHistory = () => router.push('/finance/history' as Href);

export default function FinanceScreen() {
  const { colors } = useTheme();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const { dashboard, loading, error, reload } = useFinanceDashboard(month);
  const categories = useCategoryMap('finance');
  const isCurrentMonth = isSameMonth(month, new Date());

  const header = (
    <Tabs.Screen
      options={{
        headerRight: () => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Transaction history"
            onPress={openHistory}
            hitSlop={8}
            style={styles.headerIcon}>
            <History size={22} color={colors.accent} />
          </Pressable>
        ),
      }}
    />
  );

  if (!dashboard) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        {header}
        {loading ? (
          <ActivityIndicator color={colors.accent} />
        ) : error ? (
          <>
            <Text style={[styles.error, { color: colors.danger }]}>{"Couldn't load your finances."}</Text>
            <Button label="Try again" variant="secondary" onPress={reload} />
          </>
        ) : null}
      </View>
    );
  }

  if (!dashboard.hasAnyTransactions) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        {header}
        <EmptyState
          icon={Wallet}
          title="No expenses logged yet this month."
          description="Record what you spend and earn to see where your money goes. Everything stays on this device."
          actionLabel="Add an expense"
          onAction={() => addTransaction('expense')}
        />
        <Button label="Add income" variant="ghost" onPress={() => addTransaction('income')} style={styles.emptySecondary} />
      </View>
    );
  }

  const d = dashboard;
  const monthName = format(month, 'MMMM');
  const tiles = [
    { label: 'Today', value: d.spentTodayPaise },
    { label: 'This week', value: d.spentThisWeekPaise },
    { label: 'This month', value: d.spentThisMonthPaise },
  ];

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      {header}
      <ScrollView contentContainerStyle={styles.content}>
        {/* Spending so far, always relative to today. */}
        <Text style={[styles.overline, { color: colors.textMuted }]} accessibilityRole="header">
          Spent
        </Text>
        <View style={styles.tiles}>
          {tiles.map((t) => (
            <View
              key={t.label}
              accessible
              accessibilityLabel={`Spent ${t.label.toLowerCase()}: ${formatPaise(t.value)}`}
              style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.tileValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
                {formatPaise(t.value, { decimals: 'auto' })}
              </Text>
              <Text style={[styles.tileLabel, { color: colors.textMuted }]}>{t.label}</Text>
            </View>
          ))}
        </View>

        {/* The selected month: income, expenses, and net cash flow. */}
        <Card style={styles.card}>
          <View style={styles.monthNav}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous month"
              onPress={() => setMonth((m) => addMonths(m, -1))}
              style={styles.navButton}>
              <ChevronLeft size={22} color={colors.accent} />
            </Pressable>
            <Text style={[styles.monthTitle, { color: colors.text }]} accessibilityRole="header">
              {format(month, 'MMMM yyyy')}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next month"
              accessibilityState={{ disabled: isCurrentMonth }}
              disabled={isCurrentMonth}
              onPress={() => setMonth((m) => addMonths(m, 1))}
              style={[styles.navButton, isCurrentMonth && styles.navDisabled]}>
              <ChevronRight size={22} color={colors.accent} />
            </Pressable>
          </View>
          <View accessible accessibilityLabel={`Net balance for ${monthName}: ${formatPaise(d.netPaise, { signed: true })}`}>
            <Text style={[styles.netLabel, { color: colors.textMuted }]}>Net balance</Text>
            <Text
              style={[styles.net, { color: d.netPaise >= 0 ? colors.text : colors.danger }]}
              numberOfLines={1}
              adjustsFontSizeToFit>
              {formatPaise(d.netPaise, { signed: true })}
            </Text>
          </View>
          <View style={styles.flows}>
            <View style={styles.flow} accessible accessibilityLabel={`Income: ${formatPaise(d.incomePaise)}`}>
              <Text style={[styles.flowLabel, { color: colors.textMuted }]}>Income</Text>
              <Text style={[styles.flowValue, { color: colors.success }]} numberOfLines={1} adjustsFontSizeToFit>
                {formatPaise(d.incomePaise)}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.flow} accessible accessibilityLabel={`Expenses: ${formatPaise(d.expensePaise)}`}>
              <Text style={[styles.flowLabel, { color: colors.textMuted }]}>Expenses</Text>
              <Text style={[styles.flowValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
                {formatPaise(d.expensePaise)}
              </Text>
            </View>
          </View>
        </Card>

        <DashboardSection icon={PieChart} title={`Spending by category · ${monthName}`}>
          {d.expenseByCategory.length > 0 ? (
            <CategoryBreakdown totals={d.expenseByCategory} categories={categories} />
          ) : (
            <Text style={[styles.muted, { color: colors.textMuted }]}>No spending recorded in {monthName}.</Text>
          )}
        </DashboardSection>

        <DashboardSection icon={BarChart3} title="Monthly spending">
          <SpendingTrend months={d.trend} selected={toMonthKey(month)} onSelect={(m) => setMonth(startOfMonth(m))} />
        </DashboardSection>

        <DashboardSection icon={Receipt} title="Recent transactions" onPress={openHistory}>
          {d.recent.map((t) => (
            <TransactionRow
              key={t.id}
              transaction={t}
              category={t.categoryId !== null ? categories.get(t.categoryId) : undefined}
              onPress={() => openTransaction(t.id)}
              showDate
            />
          ))}
        </DashboardSection>
      </ScrollView>
      <FloatingActionButton accessibilityLabel="Add transaction" onPress={() => addTransaction('expense')} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  headerIcon: {
    padding: SPACING.sm,
    marginRight: SPACING.sm,
  },
  error: {
    ...TYPE.subheading,
  },
  emptySecondary: {
    alignSelf: 'center',
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 96,
  },
  overline: {
    ...TYPE.overline,
    marginBottom: SPACING.sm,
  },
  tiles: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  tile: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
  },
  tileValue: {
    ...TYPE.heading,
    fontVariant: ['tabular-nums'],
  },
  tileLabel: {
    ...TYPE.caption,
    marginTop: 2,
  },
  card: {
    marginBottom: SPACING.md,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -SPACING.sm,
    marginBottom: SPACING.sm,
  },
  navButton: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navDisabled: {
    opacity: 0.3,
  },
  monthTitle: {
    ...TYPE.heading,
  },
  netLabel: {
    ...TYPE.label,
    textAlign: 'center',
  },
  net: {
    ...TYPE.display,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  flows: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  flow: {
    flex: 1,
    alignItems: 'center',
  },
  flowLabel: {
    ...TYPE.caption,
  },
  flowValue: {
    ...TYPE.heading,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
  muted: {
    ...TYPE.bodySmall,
    paddingVertical: SPACING.sm,
  },
});
