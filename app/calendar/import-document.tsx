import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Stack, router } from 'expo-router';
import { AlertTriangle, CalendarCheck2, Camera, FileText, ImageIcon, ScanText, ShieldCheck } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/common/Button';
import { Checkbox } from '@/components/common/Checkbox';
import { Chip } from '@/components/common/Chip';
import { DateTimeField } from '@/components/common/DateTimeField';
import { EmptyState } from '@/components/common/EmptyState';
import { Input } from '@/components/common/Input';
import { KeyboardAwareScreen } from '@/components/common/KeyboardAwareScreen';
import { NotificationPermissionBanner } from '@/components/common/NotificationPermissionBanner';
import { PdfPasswordPrompt } from '@/components/common/PdfPasswordPrompt';
import { RADIUS, SPACING, TOUCH_TARGET, TYPE } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';
import { createEvent, EVENT_TITLE_MAX_LENGTH } from '@/services/calendarService';
import {
  DocumentReadError,
  canReadImages,
  canReadPdfs,
  describeReadFailure,
  readImageText,
  readPdfText,
} from '@/services/documentTextService';
import { ensurePermission } from '@/services/notificationService';
import { extractEvents, type DetectedEvent } from '@/utils/dateExtraction';
import { NO_RECURRENCE } from '@/utils/recurrence';

type Source = { uri: string; name: string; kind: 'pdf' | 'image' };
type Draft = DetectedEvent & { selected: boolean };
type Step =
  | { kind: 'pick'; message?: string }
  | { kind: 'password'; source: Source; error?: string }
  | { kind: 'reading'; source: Source }
  | { kind: 'review'; source: Source }
  | { kind: 'done'; added: number };

const REMINDERS = [
  { minutes: 0, label: 'At the time' },
  { minutes: 60, label: '1 hour before' },
  { minutes: 1440, label: '1 day before' },
  { minutes: 2880, label: '2 days before' },
];

export default function ImportDocumentScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>({ kind: 'pick' });
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [reminder, setReminder] = useState(1440);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const read = async (source: Source, password?: string) => {
    setStep({ kind: 'reading', source });
    try {
      const text = source.kind === 'pdf' ? await readPdfText(source.uri, password) : await readImageText(source.uri);
      const now = new Date();
      const found = extractEvents(text, now);
      if (found.length === 0) {
        setStep({
          kind: 'pick',
          message: 'No dates were found. Make sure the dates are clearly visible, like “12/12/2026” or “5 Dec”, and try again.',
        });
        return;
      }
      setDrafts(found.map((e) => ({ ...e, selected: e.start > now })));
      setStep({ kind: 'review', source });
    } catch (e) {
      const reason = e instanceof DocumentReadError ? e.reason : 'unreadable';
      if (source.kind === 'pdf' && (reason === 'password_required' || reason === 'incorrect_password')) {
        setStep({ kind: 'password', source, error: reason === 'incorrect_password' ? describeReadFailure(reason, 'document') : undefined });
      } else {
        setStep({ kind: 'pick', message: describeReadFailure(reason, 'document') });
      }
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setStep({
        kind: 'pick',
        message: permission.canAskAgain
          ? 'Camera access is needed to photograph a document.'
          : 'Camera access is off for LIFORA. Turn it on in Settings, or choose a photo instead.',
      });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9 });
    if (!result.canceled && result.assets[0]) await read({ uri: result.assets[0].uri, name: 'Photo', kind: 'image' });
  };

  const choosePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (!result.canceled && result.assets[0]) {
      await read({ uri: result.assets[0].uri, name: result.assets[0].fileName ?? 'Photo', kind: 'image' });
    }
  };

  const chooseFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const isPdf = asset.mimeType === 'application/pdf' || asset.name.toLowerCase().endsWith('.pdf');
    await read({ uri: asset.uri, name: asset.name, kind: isPdf ? 'pdf' : 'image' });
  };

  const update = (key: string, patch: Partial<Draft>) => setDrafts((list) => list.map((d) => (d.key === key ? { ...d, ...patch } : d)));

  const save = async (source: Source) => {
    const chosen = drafts.filter((d) => d.selected);
    setSaving(true);
    setSaveError(null);
    try {
      await ensurePermission();
      for (const d of chosen) {
        await createEvent({
          title: d.title,
          description: `Added from ${source.name}: “${d.sourceLine}”`,
          startAt: d.start,
          endAt: d.end > d.start ? d.end : new Date(d.start.getTime() + 3_600_000),
          location: '',
          categoryId: null,
          priority: 'medium',
          recurrence: NO_RECURRENCE,
          notificationOffsetMinutes: reminder,
        });
      }
      setStep({ kind: 'done', added: chosen.length });
    } catch (e) {
      setSaveError(e instanceof Error && e.name === 'ValidationError' ? e.message : "Couldn't add the events. Please check the titles and try again.");
    } finally {
      setSaving(false);
    }
  };

  let content: React.ReactNode;
  switch (step.kind) {
    case 'pick':
      content = <PickStep message={step.message} onCamera={takePhoto} onPhoto={choosePhoto} onFile={chooseFile} />;
      break;
    case 'password':
      content = (
        <ScrollView keyboardShouldPersistTaps="handled">
          <PdfPasswordPrompt
            fileName={step.source.name}
            error={step.error}
            onSubmit={(password) => read(step.source, password)}
            onCancel={() => setStep({ kind: 'pick' })}
          />
        </ScrollView>
      );
      break;
    case 'reading':
      content = (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.muted, { color: colors.textMuted }]}>Looking for dates on your phone…</Text>
        </View>
      );
      break;
    case 'done':
      content = (
        <ScrollView contentContainerStyle={styles.doneContent}>
          <EmptyState
            icon={CalendarCheck2}
            title={`Added ${step.added} ${step.added === 1 ? 'event' : 'events'}`}
            description={`You'll be reminded ${REMINDERS.find((r) => r.minutes === reminder)?.label.toLowerCase() ?? 'before each one'}.`}
            actionLabel="View calendar"
            onAction={() => router.back()}
          />
          <NotificationPermissionBanner />
        </ScrollView>
      );
      break;
    case 'review': {
      const source = step.source;
      const count = drafts.filter((d) => d.selected).length;
      const now = new Date();
      content = (
        <KeyboardAwareScreen>
          <FlatList
            data={drafts}
            keyExtractor={(d) => d.key}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.reviewList}
            ListHeaderComponent={
              <View>
                <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
                  {drafts.length} {drafts.length === 1 ? 'date' : 'dates'} found
                </Text>
                <Text style={[styles.muted, styles.left, { color: colors.textMuted }]}>
                  Check each one, fix anything the scan misread, and untick what you don’t need.
                </Text>
                <Text style={[styles.label, { color: colors.textMuted }]}>Remind me</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
                  {REMINDERS.map((r) => (
                    <Chip key={r.minutes} label={r.label} selected={reminder === r.minutes} onPress={() => setReminder(r.minutes)} />
                  ))}
                </ScrollView>
              </View>
            }
            renderItem={({ item: d }) => {
              const past = d.start <= now;
              return (
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: d.selected ? colors.accent : colors.border }]}>
                  <View style={styles.cardTop}>
                    <Checkbox
                      checked={d.selected}
                      onPress={() => update(d.key, { selected: !d.selected })}
                      accessibilityLabel={`Add ${d.title}`}
                    />
                    <Text style={[styles.source, { color: colors.textMuted }]} numberOfLines={2}>
                      From: “{d.sourceLine}”
                    </Text>
                  </View>
                  {past ? (
                    <View style={styles.pastRow}>
                      <AlertTriangle size={14} color={colors.warning} />
                      <Text style={[styles.pastText, { color: colors.warning }]}>This date has passed</Text>
                    </View>
                  ) : null}
                  <Input
                    label="Title"
                    value={d.title}
                    onChangeText={(title) => update(d.key, { title })}
                    maxLength={EVENT_TITLE_MAX_LENGTH}
                  />
                  <DateTimeField
                    label={d.hasTime ? 'Starts' : 'Date (starts 9:00 AM)'}
                    mode="datetime"
                    value={d.start}
                    onChange={(start) => {
                      if (!start) return;
                      const length = d.end.getTime() - d.start.getTime();
                      update(d.key, { start, end: new Date(start.getTime() + Math.max(length, 3_600_000)) });
                    }}
                  />
                </View>
              );
            }}
          />
          <View style={[styles.footer, { paddingBottom: SPACING.md + insets.bottom, backgroundColor: colors.background, borderTopColor: colors.border }]}>
            {saveError ? (
              <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
                {saveError}
              </Text>
            ) : null}
            <Button
              label={count === 0 ? 'Select events to add' : `Add ${count} ${count === 1 ? 'event' : 'events'} to calendar`}
              onPress={() => save(source)}
              disabled={count === 0}
              loading={saving}
            />
          </View>
        </KeyboardAwareScreen>
      );
      break;
    }
  }

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Add from document' }} />
      {content}
    </View>
  );
}

function PickStep({
  message,
  onCamera,
  onPhoto,
  onFile,
}: {
  message?: string;
  onCamera: () => void;
  onPhoto: () => void;
  onFile: () => void;
}) {
  const { colors } = useTheme();
  const images = canReadImages();
  const pdfs = canReadPdfs();
  const options = [
    { key: 'camera', icon: Camera, label: 'Take a photo', hint: 'Photograph a notice, timetable or letter', onPress: onCamera, enabled: images },
    { key: 'photo', icon: ImageIcon, label: 'Choose a photo or screenshot', hint: 'From your gallery', onPress: onPhoto, enabled: images },
    { key: 'file', icon: FileText, label: 'Choose a PDF or image file', hint: 'From your files or downloads', onPress: onFile, enabled: images || pdfs },
  ];

  return (
    <ScrollView contentContainerStyle={styles.pickContent}>
      <View style={[styles.hero, { backgroundColor: colors.accentSoft }]}>
        <ScanText size={34} color={colors.accent} />
      </View>
      <Text style={[styles.title, styles.centerText, { color: colors.text }]} accessibilityRole="header">
        Add dates from a document
      </Text>
      <Text style={[styles.muted, styles.lead, { color: colors.textMuted }]}>
        LIFORA finds the dates in an exam timetable, fee notice, invitation or bill, adds them to your calendar and reminds you
        before each one.
      </Text>
      {message ? (
        <View accessibilityRole="alert" style={[styles.notice, { borderColor: colors.warningFill, backgroundColor: colors.surface }]}>
          <AlertTriangle size={18} color={colors.warning} />
          <Text style={[styles.noticeText, { color: colors.text }]}>{message}</Text>
          {/Settings/.test(message) ? (
            <Pressable accessibilityRole="button" onPress={() => Linking.openSettings()}>
              <Text style={[styles.link, { color: colors.accent }]}>Settings</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {images || pdfs ? (
        options.map(({ key, icon: Icon, label, hint, onPress, enabled }) => (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityHint={hint}
            accessibilityState={{ disabled: !enabled }}
            disabled={!enabled}
            onPress={onPress}
            style={({ pressed }) => [
              styles.option,
              { borderColor: colors.border, backgroundColor: pressed ? colors.accentSoft : colors.surface, opacity: enabled ? 1 : 0.5 },
            ]}>
            <View style={[styles.optionIcon, { backgroundColor: colors.accentSoft }]}>
              <Icon size={22} color={colors.accent} />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.optionLabel, { color: colors.text }]}>{label}</Text>
              <Text style={[styles.optionHint, { color: colors.textMuted }]}>{hint}</Text>
            </View>
          </Pressable>
        ))
      ) : (
        <Text style={[styles.muted, { color: colors.warning }]}>{describeReadFailure('unsupported', 'document')}</Text>
      )}
      <View style={styles.privacy}>
        <ShieldCheck size={16} color={colors.success} />
        <Text style={[styles.privacyText, { color: colors.textMuted }]}>
          Text is read on your phone. Your photos and documents are never uploaded or saved by LIFORA.
        </Text>
      </View>
    </ScrollView>
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
  centerText: {
    textAlign: 'center',
  },
  left: {
    textAlign: 'left',
  },
  muted: {
    ...TYPE.bodySmall,
    textAlign: 'center',
  },
  lead: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  title: {
    ...TYPE.title,
  },
  pickContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  doneContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
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
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
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
  link: {
    ...TYPE.label,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: TOUCH_TARGET + 24,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    ...TYPE.subheading,
  },
  optionHint: {
    ...TYPE.caption,
    marginTop: 2,
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
  label: {
    ...TYPE.label,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  chips: {
    marginBottom: SPACING.lg,
  },
  card: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  source: {
    ...TYPE.caption,
    flex: 1,
    fontStyle: 'italic',
  },
  pastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  pastText: {
    ...TYPE.caption,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  error: {
    ...TYPE.bodySmall,
    marginBottom: SPACING.sm,
  },
});
