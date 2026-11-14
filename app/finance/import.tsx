import { format } from 'date-fns';
import * as DocumentPicker from 'expo-document-picker';
import { Stack, router, type Href } from 'expo-router';
import { AlertTriangle, CheckCircle2, Copy, FileText, ShieldCheck, Upload } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Checkbox } from '@/components/common/Checkbox';
import { EmptyState } from '@/components/common/EmptyState';
import { PdfPasswordPrompt } from '@/components/common/PdfPasswordPrompt';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { CategorySheet } from '@/components/finance/CategorySheet';
import { RADIUS, SPACING, TOUCH_TARGET, TYPE } from '@/constants/appConfig';
import { useCategories } from '@/hooks/useCalendar';
import { useTheme } from '@/hooks/useTheme';
import { DocumentReadError, canReadPdfs, describeReadFailure } from '@/services/documentTextService';
import * as financeService from '@/services/financeService';
import type { ImportCandidate } from '@/services/financeService';
import type { TransactionType } from '@/types/transaction';
import type { ParsedStatement } from '@/utils/statementParser';
import { formatPaise } from '@/utils/money';
import { ValidationError } from '@/utils/validationUtils';

type PickedFile = { uri: string; name: string };
type Step =
  | { kind: 'pick'; message?: string }
  | { kind: 'password'; file: PickedFile; error?: string }
  | { kind: 'reading'; file: PickedFile }
  | { kind: 'review'; file: PickedFile; statement: ParsedStatement }
  | { kind: 'done'; imported: number };

const DIRECTIONS = [
  { value: 'expense', label: 'Money out' },
  { value: 'income', label: 'Money in' },
] as const;

const PASSWORD_HINT =
  'Banks usually lock statements with your customer ID, date of birth (DDMMYYYY), or a mix of your name and birth date. Check the email the statement came with.';

export default function ImportStatementScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { categories } = useCategories('finance');
  const [step, setStep] = useState<Step>({ kind: 'pick' });
  const [candidates, setCandidates] = useState<ImportCandidate[]>([]);
  const [editing, setEditing] = useState<ImportCandidate | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const read = async (file: PickedFile, password?: string) => {
    setStep({ kind: 'reading', file });
    try {
      const statement = await financeService.readStatement(file.uri, password);
      if (statement.rows.length === 0) {
        setStep({
          kind: 'pick',
          message:
            "No transactions were found in this PDF. Make sure it's an account statement downloaded from your bank's net banking or app (not a scanned copy).",
        });
        return;
      }
      setCandidates(await financeService.prepareImport(statement, categories));
      setStep({ kind: 'review', file, statement });
    } catch (e) {
      const reason = e instanceof DocumentReadError ? e.reason : 'unreadable';
      if (reason === 'password_required' || reason === 'incorrect_password') {
        setStep({ kind: 'password', file, error: reason === 'incorrect_password' ? describeReadFailure(reason, 'statement') : undefined });
      } else {
        setStep({ kind: 'pick', message: describeReadFailure(reason, 'statement') });
      }
    }
  };

  const pick = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true, multiple: false });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    await read({ uri: asset.uri, name: asset.name });
  };

  const update = (key: string, patch: Partial<ImportCandidate>) =>
    setCandidates((list) => list.map((c) => (c.key === key ? { ...c, ...patch } : c)));

  const save = async (file: PickedFile, statement: ParsedStatement) => {
    setSaving(true);
    setSaveError(null);
    try {
      const { imported } = await financeService.commitImport({ fileName: file.name, bankName: statement.bankName, candidates });
      setStep({ kind: 'done', imported });
    } catch (e) {
      setSaveError(e instanceof ValidationError ? e.message : "Couldn't save the import. Nothing was changed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const content = (() => {
    switch (step.kind) {
      case 'pick':
        return <PickStep message={step.message} onPick={pick} />;
      case 'password':
        return (
          <ScrollView keyboardShouldPersistTaps="handled">
            <PdfPasswordPrompt
              fileName={step.file.name}
              error={step.error}
              hint={PASSWORD_HINT}
              onSubmit={(password) => read(step.file, password)}
              onCancel={() => setStep({ kind: 'pick' })}
            />
          </ScrollView>
        );
      case 'reading':
        return (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.muted, { color: colors.textMuted }]}>Reading {step.file.name} on your phone…</Text>
          </View>
        );
      case 'done':
        return (
          <View style={styles.center}>
            <EmptyState
              icon={CheckCircle2}
              title={`Imported ${step.imported} ${step.imported === 1 ? 'transaction' : 'transactions'}`}
              description="Your spending, income and charts are up to date."
              actionLabel="View Finance"
              onAction={() => router.dismissTo('/(tabs)/finance' as Href)}
            />
            <Button label="Import another statement" variant="ghost" onPress={() => setStep({ kind: 'pick' })} />
          </View>
        );
      case 'review':
        return (
          <ReviewStep
            file={step.file}
            statement={step.statement}
            candidates={candidates}
            onToggle={(c) => update(c.key, { selected: !c.selected })}
            onSetType={(c, type) =>
              update(c.key, {
                type,
                selected: true,
                categoryId: financeService.suggestCategoryFor(c.row, type, categories),
              })
            }
            onEditCategory={setEditing}
            onSelectAll={(selected) =>
              setCandidates((list) => list.map((c) => ({ ...c, selected: selected && financeService.canImport(c) && !c.duplicate })))
            }
            footer={
              <View style={[styles.footer, { paddingBottom: SPACING.md + insets.bottom, backgroundColor: colors.background, borderTopColor: colors.border }]}>
                {saveError ? (
                  <Text accessibilityRole="alert" style={[styles.saveError, { color: colors.danger }]}>
                    {saveError}
                  </Text>
                ) : null}
                <ImportButton candidates={candidates} saving={saving} onPress={() => save(step.file, step.statement)} />
              </View>
            }
          />
        );
    }
  })();

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Import statement' }} />
      {content}
      <CategorySheet
        visible={editing !== null}
        title={editing ? `Category for ${editing.row.counterparty}` : undefined}
        categories={categories}
        value={editing?.categoryId ?? null}
        onChange={(id) => editing && update(editing.key, { categoryId: id })}
        onClose={() => setEditing(null)}
      />
    </View>
  );
}

function PickStep({ message, onPick }: { message?: string; onPick: () => void }) {
  const { colors } = useTheme();
  const available = canReadPdfs();
  const steps = [
    'Open your bank’s app or net banking and download your account statement as a PDF.',
    'Tap “Choose statement PDF” and pick the file. If it’s locked, you’ll be asked for its password.',
    'Check the transactions LIFORA found, then import them.',
  ];
  return (
    <ScrollView contentContainerStyle={styles.pickContent}>
      <View style={[styles.hero, { backgroundColor: colors.accentSoft }]}>
        <FileText size={34} color={colors.accent} />
      </View>
      <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
        Import a bank statement
      </Text>
      <Text style={[styles.lead, { color: colors.textMuted }]}>
        LIFORA reads your statement PDF and turns it into a clear picture of what you spent and earned.
      </Text>
      {message ? (
        <View accessibilityRole="alert" style={[styles.notice, { borderColor: colors.warningFill, backgroundColor: colors.surface }]}>
          <AlertTriangle size={18} color={colors.warning} />
          <Text style={[styles.noticeText, { color: colors.text }]}>{message}</Text>
        </View>
      ) : null}
      <Card style={styles.steps}>
        {steps.map((text, i) => (
          <View key={text} style={styles.stepRow}>
            <View style={[styles.stepNumber, { backgroundColor: colors.accentSoft }]}>
              <Text style={[styles.stepNumberText, { color: colors.accent }]}>{i + 1}</Text>
            </View>
            <Text style={[styles.stepText, { color: colors.text }]}>{text}</Text>
          </View>
        ))}
      </Card>
      {available ? (
        <Button label="Choose statement PDF" icon={Upload} onPress={onPick} />
      ) : (
        <Text style={[styles.lead, { color: colors.warning }]}>{describeReadFailure('unsupported', 'statement')}</Text>
      )}
      <View style={styles.privacy}>
        <ShieldCheck size={16} color={colors.success} />
        <Text style={[styles.privacyText, { color: colors.textMuted }]}>
          Read entirely on your phone. Nothing is uploaded, and LIFORA never asks for bank logins.
        </Text>
      </View>
    </ScrollView>
  );
}

function ReviewStep({
  file,
  statement,
  candidates,
  onToggle,
  onSetType,
  onEditCategory,
  onSelectAll,
  footer,
}: {
  file: PickedFile;
  statement: ParsedStatement;
  candidates: ImportCandidate[];
  onToggle: (c: ImportCandidate) => void;
  onSetType: (c: ImportCandidate, type: TransactionType) => void;
  onEditCategory: (c: ImportCandidate) => void;
  onSelectAll: (selected: boolean) => void;
  footer: React.ReactNode;
}) {
  const { colors } = useTheme();
  const { categories } = useCategories('finance');
  const categoryName = (id: number | null) => categories.find((c) => c.id === id)?.name ?? 'Uncategorized';
  const chosen = candidates.filter((c) => c.selected && financeService.canImport(c));
  const totals = chosen.reduce(
    (acc, c) => {
      if (c.type === 'income') acc.in += c.row.amountPaise;
      else acc.out += c.row.amountPaise;
      return acc;
    },
    { in: 0, out: 0 },
  );
  const review = candidates.filter((c) => c.row.reviewReason !== null).length;
  const duplicates = candidates.filter((c) => c.duplicate).length;
  const period =
    statement.periodFrom && statement.periodTo
      ? `${format(financeService.fromDateKey(statement.periodFrom), 'd MMM')} – ${format(financeService.fromDateKey(statement.periodTo), 'd MMM yyyy')}`
      : '';

  const header = (
    <View>
      <Card style={styles.summary}>
        <Text style={[styles.summaryTitle, { color: colors.text }]} numberOfLines={1}>
          {statement.bankName ?? file.name}
        </Text>
        <Text style={[styles.muted, { color: colors.textMuted }]}>
          {candidates.length} transactions found{period ? ` · ${period}` : ''}
        </Text>
        <View style={styles.summaryRow}>
          <View style={styles.flex}>
            <Text style={[styles.caption, { color: colors.textMuted }]}>Money in</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>{formatPaise(totals.in)}</Text>
          </View>
          <View style={styles.flex}>
            <Text style={[styles.caption, { color: colors.textMuted }]}>Money out</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{formatPaise(totals.out)}</Text>
          </View>
        </View>
      </Card>
      {review > 0 ? (
        <Notice icon={<AlertTriangle size={16} color={colors.warning} />} text={`${review} need your check. Tell LIFORA whether each is money in or out to include it.`} />
      ) : null}
      {duplicates > 0 ? (
        <Notice icon={<Copy size={16} color={colors.textMuted} />} text={`${duplicates} look already imported, so they're unticked. Tick any you still want.`} />
      ) : null}
      <View style={styles.selectRow}>
        <Text style={[styles.caption, { color: colors.textMuted }]}>{chosen.length} selected</Text>
        <View style={styles.selectButtons}>
          <Pressable accessibilityRole="button" onPress={() => onSelectAll(true)} style={styles.textButton}>
            <Text style={[styles.textButtonLabel, { color: colors.accent }]}>Select all</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => onSelectAll(false)} style={styles.textButton}>
            <Text style={[styles.textButtonLabel, { color: colors.accent }]}>Clear</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.flex}>
      <FlatList
        data={candidates}
        keyExtractor={(c) => c.key}
        ListHeaderComponent={header}
        contentContainerStyle={styles.reviewList}
        renderItem={({ item: c }) => {
          const income = c.type === 'income';
          const importable = financeService.canImport(c);
          return (
            <View style={[styles.candidate, { backgroundColor: colors.surface, borderColor: c.row.reviewReason ? colors.warningFill : colors.border }]}>
              <View style={styles.candidateTop}>
                <Checkbox
                  checked={c.selected && importable}
                  onPress={() => importable && onToggle(c)}
                  accessibilityLabel={`Import ${c.row.counterparty}, ${formatPaise(c.row.amountPaise)}`}
                />
                <View style={styles.flex}>
                  <Text style={[styles.payee, { color: colors.text }]} numberOfLines={1}>
                    {c.row.counterparty}
                  </Text>
                  <Text style={[styles.caption, { color: colors.textMuted }]} numberOfLines={1}>
                    {format(financeService.fromDateKey(c.row.date), 'd MMM yyyy')} · {c.row.channel}
                  </Text>
                </View>
                <Text style={[styles.amount, { color: c.type === null ? colors.textMuted : income ? colors.success : colors.text }]}>
                  {c.type === null ? formatPaise(c.row.amountPaise) : formatPaise(income ? c.row.amountPaise : -c.row.amountPaise, { signed: true })}
                </Text>
              </View>
              {c.row.reviewReason ? <Text style={[styles.reason, { color: colors.warning }]}>{c.row.reviewReason}</Text> : null}
              {c.row.reviewReason && !/future/.test(c.row.reviewReason) ? (
                <SegmentedControl<TransactionType>
                  options={DIRECTIONS}
                  value={c.type ?? ('none' as TransactionType)}
                  onChange={(type) => onSetType(c, type)}
                />
              ) : null}
              {c.duplicate ? <Text style={[styles.reason, { color: colors.textMuted }]}>Looks already imported</Text> : null}
              {c.type !== null ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Category: ${categoryName(c.categoryId)}. Change`}
                  onPress={() => onEditCategory(c)}
                  style={[styles.categoryChip, { borderColor: colors.border }]}>
                  <Text style={[styles.categoryText, { color: colors.accent }]}>{categoryName(c.categoryId)}</Text>
                </Pressable>
              ) : null}
            </View>
          );
        }}
      />
      {footer}
    </View>
  );
}

function ImportButton({ candidates, saving, onPress }: { candidates: ImportCandidate[]; saving: boolean; onPress: () => void }) {
  const count = candidates.filter((c) => c.selected && financeService.canImport(c)).length;
  return (
    <Button
      label={count === 0 ? 'Select transactions to import' : `Import ${count} ${count === 1 ? 'transaction' : 'transactions'}`}
      onPress={onPress}
      disabled={count === 0}
      loading={saving}
    />
  );
}

function Notice({ icon, text }: { icon: React.ReactNode; text: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.inlineNotice, { backgroundColor: colors.surfaceAlt }]}>
      {icon}
      <Text style={[styles.noticeText, { color: colors.text }]}>{text}</Text>
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
    padding: SPACING.lg,
  },
  muted: {
    ...TYPE.bodySmall,
    textAlign: 'center',
  },
  caption: {
    ...TYPE.caption,
  },
  pickContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  hero: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    ...TYPE.title,
    textAlign: 'center',
  },
  lead: {
    ...TYPE.body,
    textAlign: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  notice: {
    flexDirection: 'row',
    gap: SPACING.sm,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  noticeText: {
    ...TYPE.bodySmall,
    flex: 1,
  },
  steps: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  stepRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    ...TYPE.label,
    fontWeight: '700',
  },
  stepText: {
    ...TYPE.bodySmall,
    flex: 1,
  },
  privacy: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  privacyText: {
    ...TYPE.caption,
    flex: 1,
  },
  reviewList: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  summary: {
    marginBottom: SPACING.md,
  },
  summaryTitle: {
    ...TYPE.heading,
  },
  summaryRow: {
    flexDirection: 'row',
    marginTop: SPACING.md,
  },
  summaryValue: {
    ...TYPE.heading,
    fontVariant: ['tabular-nums'],
  },
  inlineNotice: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'flex-start',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: SPACING.xs,
  },
  selectButtons: {
    flexDirection: 'row',
  },
  textButton: {
    minHeight: TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  textButtonLabel: {
    ...TYPE.label,
  },
  candidate: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  candidateTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  payee: {
    ...TYPE.subheading,
  },
  amount: {
    ...TYPE.subheading,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  reason: {
    ...TYPE.caption,
  },
  categoryChip: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    minHeight: 36,
    justifyContent: 'center',
    marginLeft: 26 + SPACING.md,
  },
  categoryText: {
    ...TYPE.label,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  saveError: {
    ...TYPE.bodySmall,
    marginBottom: SPACING.sm,
  },
});
