import { LockKeyhole } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SPACING, TYPE } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';
import { Button } from './Button';
import { Input } from './Input';

interface PdfPasswordPromptProps {
  fileName: string;
  /** Shown after a wrong attempt. */
  error?: string | null;
  hint?: string;
  onSubmit: (password: string) => void;
  onCancel: () => void;
}

/** Unlocks a password-protected PDF. The password is used once, on the device, and never stored. */
export function PdfPasswordPrompt({ fileName, error, hint, onSubmit, onCancel }: PdfPasswordPromptProps) {
  const { colors } = useTheme();
  const [password, setPassword] = useState('');

  return (
    <View style={styles.container}>
      <View style={[styles.iconWell, { backgroundColor: colors.accentSoft }]}>
        <LockKeyhole size={26} color={colors.accent} />
      </View>
      <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
        This PDF is locked
      </Text>
      <Text style={[styles.body, { color: colors.textMuted }]} numberOfLines={2}>
        {fileName}
      </Text>
      {hint ? <Text style={[styles.body, { color: colors.textMuted }]}>{hint}</Text> : null}
      <View style={styles.field}>
        <Input
          label="PDF password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={() => password && onSubmit(password)}
          errorMessage={error ?? undefined}
        />
      </View>
      <Button label="Unlock" onPress={() => onSubmit(password)} disabled={!password} style={styles.button} />
      <Button label="Choose another file" variant="ghost" onPress={onCancel} style={styles.button} />
      <Text style={[styles.privacy, { color: colors.textMuted }]}>
        The password is used only to open this file on your phone. It isn’t saved.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  iconWell: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    ...TYPE.title,
    textAlign: 'center',
  },
  body: {
    ...TYPE.bodySmall,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  field: {
    alignSelf: 'stretch',
    marginTop: SPACING.lg,
  },
  button: {
    alignSelf: 'stretch',
    marginTop: SPACING.sm,
  },
  privacy: {
    ...TYPE.caption,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
});
