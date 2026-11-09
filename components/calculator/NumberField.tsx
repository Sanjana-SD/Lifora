import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { RADIUS, SPACING } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';

interface NumberFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  error?: string | null;
  integer?: boolean;
  accessibilityLabel?: string;
}

export function NumberField({
  label,
  value,
  onChangeText,
  prefix,
  suffix,
  placeholder,
  error,
  integer = false,
  accessibilityLabel,
}: NumberFieldProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <View
        style={[
          styles.box,
          { borderColor: error ? colors.danger : colors.border, backgroundColor: colors.background },
        ]}>
        {prefix ? <Text style={[styles.affix, { color: colors.textMuted }]}>{prefix}</Text> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={integer ? 'number-pad' : 'decimal-pad'}
          accessibilityLabel={accessibilityLabel ?? label}
          style={[styles.input, { color: colors.text }]}
        />
        {suffix ? <Text style={[styles.affix, { color: colors.textMuted }]}>{suffix}</Text> : null}
      </View>
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    minHeight: 46,
  },
  affix: {
    fontSize: 15,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  error: {
    fontSize: 12,
    marginTop: SPACING.xs,
  },
});
