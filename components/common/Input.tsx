import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { RADIUS, SPACING } from '@/constants/appConfig';

interface InputProps extends TextInputProps {
  label?: string;
  errorMessage?: string;
}

export function Input({ label, errorMessage, style, ...rest }: InputProps) {
  const { colors } = useTheme();
  const borderColor = errorMessage ? colors.danger : colors.border;

  return (
    <View style={styles.container}>
      {label ? <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          { borderColor, color: colors.text, backgroundColor: colors.background },
          style,
        ]}
        {...rest}
      />
      {errorMessage ? (
        <Text style={[styles.error, { color: colors.danger }]}>{errorMessage}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 12.5,
    marginBottom: SPACING.xs,
    fontWeight: '600',
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    fontSize: 15,
  },
  error: {
    fontSize: 12,
    marginTop: SPACING.xs,
  },
});
