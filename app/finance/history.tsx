import { format, isToday, isYesterday } from 'date-fns';
import { Stack, router, type Href } from 'expo-router';
import { ReceiptText, SearchX, SlidersHorizontal, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { FloatingActionButton } from '@/components/common/FloatingActionButton';
import { SearchField } from '@/components/common/SearchField';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import {
  NO_FILTERS,
  TransactionFilterSheet,
  activeFilterCount,
  type HistoryFilters,
} from '@/components/finance/TransactionFilterSheet';
import { TransactionRow } from '@/components/finance/TransactionRow';
import { RADIUS, SPACING, TOUCH_TARGET, TYPE } from '@/constants/appConfig';
import { useCategoryMap } from '@/hooks/useCalendar';
import { useTransactions } from '@/hooks/useFinance';
import { useTheme } from '@/hooks/useTheme';
import { fromDateKey, groupByDay, rangeForPreset } from '@/services/financeService';
import type { TransactionType } from '@/types/transaction';
import { formatPaise } from '@/utils/money';

const TYPES = [
  { value: 'all', label: 'All' },
  { value: 'expense', label: 'Expenses' },
  { value: 'income', label: 'Income' },
] as const;

function dayLabel(key: string): string {
  const date = fromDateKey(key);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEE, d MMM yyyy');
}

export default function TransactionHistoryScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const categories = useCategoryMap('finance');
  const [search, setSearch] = useState('');
  const [type, setType] = useState<'all' | TransactionType>('all');
  const [filters, setFilters] = useState<HistoryFilters>(NO_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);

  const range = rangeForPreset(filters.range);
  const { transactions, loading, error, reload } = useTransactions({
    search,
    type: type === 'all' ? null : type,
    categoryId: filters.categoryId,
    paymentMethod: filters.paymentMethod,
    from: range.from,
    to: range.to,
  });

  const sections = useMemo(() => groupByDay(transactions), [transactions]);
  const totals = useMemo(
    () =>
      transactions.reduce(
        (acc, t) => {
          if (t.type === 'income') acc.income += t.amountPaise;
          else acc.expense += t.amountPaise;
          return acc;
        },
        { income: 0, expense: 0 },
      ),
    [transactions],
  );

  const filterCount = activeFilterCount(filters);
  const narrowed = filterCount > 0 || type !== 'all' || search.trim() !== '';

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Transactions' }} />
      <View style={styles.controls}>
        <SearchField value={search} onChangeText={setSearch} placeholder="Search transactions" />
        <View style={styles.row}>
          <View style={styles.flex}>
            <SegmentedControl options={TYPES} value={type} onChange={setType} />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={filterCount > 0 ? `Filters, ${filterCount} active` : 'Filters'}
            onPress={() => setSheetOpen(true)}
            style={({ pressed }) => [
              styles.filterButton,
              {
                borderColor: filterCount > 0 ? colors.accent : colors.borderStrong,
                backgroundColor: filterCount > 0 || pressed ? colors.accentSoft : colors.surface,
              },
            ]}>
            <SlidersHorizontal size={18} color={colors.accent} />
            {filterCount > 0 ? <Text style={[styles.badge, { color: colors.accent }]}>{filterCount}</Text> : null}
          </Pressable>
        </View>
        {filterCount > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear filters"
            onPress={() => setFilters(NO_FILTERS)}
            style={styles.clear}>
            <X size={14} color={colors.accent} />
            <Text style={[styles.clearText, { color: colors.accent }]}>Clear filters</Text>
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={[styles.error, { color: colors.danger }]}>{"Couldn't load transactions."}</Text>
          <Button label="Try again" variant="secondary" onPress={reload} />
        </View>
      ) : loading && transactions.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(t) => String(t.id)}
          contentContainerStyle={[styles.list, { paddingBottom: 96 + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
          stickySectionHeadersEnabled
          ListHeaderComponent={
            transactions.length > 0 ? (
              <Text style={[styles.summary, { color: colors.textMuted }]}>
                {transactions.length} {transactions.length === 1 ? 'transaction' : 'transactions'} · Spent{' '}
                {formatPaise(totals.expense, { decimals: 'auto' })} · Received {formatPaise(totals.income, { decimals: 'auto' })}
              </Text>
            ) : undefined
          }
          renderSectionHeader={({ section }) => (
            <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]} accessibilityRole="header">
                {dayLabel(section.date)}
              </Text>
              <Text style={[styles.sectionTotal, { color: colors.textMuted }]}>
                {formatPaise(section.netPaise, { signed: true, decimals: 'auto' })}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TransactionRow
              transaction={item}
              category={item.categoryId !== null ? categories.get(item.categoryId) : undefined}
              onPress={() => router.push(`/finance/transaction-details?id=${item.id}` as Href)}
            />
          )}
          ListEmptyComponent={
            narrowed ? (
              <EmptyState icon={SearchX} title="No matching transactions" description="Try another search, or clear the filters." />
            ) : (
              <EmptyState icon={ReceiptText} title="No transactions yet" description="Expenses and income you add will be listed here." />
            )
          }
        />
      )}

      <FloatingActionButton
        clearSystemBar
        accessibilityLabel="Add transaction"
        onPress={() => router.push('/finance/add-transaction' as Href)}
      />
      <TransactionFilterSheet visible={sheetOpen} value={filters} onChange={setFilters} onClose={() => setSheetOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  controls: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    gap: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minWidth: TOUCH_TARGET,
    height: TOUCH_TARGET,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderRadius: RADIUS.md,
  },
  badge: {
    ...TYPE.label,
  },
  clear: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    minHeight: 32,
  },
  clearText: {
    ...TYPE.label,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  error: {
    ...TYPE.subheading,
  },
  list: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
  },
  summary: {
    ...TYPE.caption,
    paddingTop: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  sectionTitle: {
    ...TYPE.overline,
  },
  sectionTotal: {
    ...TYPE.caption,
    fontVariant: ['tabular-nums'],
  },
});
