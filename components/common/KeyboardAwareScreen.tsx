import { HeaderHeightContext } from 'expo-router/react-navigation';
import React, { useContext } from 'react';
import { KeyboardAvoidingView, StyleSheet, ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

interface KeyboardAwareScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Keeps the focused field above the keyboard. Expo apps are edge-to-edge,
 * so Android no longer resizes the window for the keyboard; `padding`
 * is needed on both platforms, offset by the screen header's height.
 */
export function KeyboardAwareScreen({ children, style }: KeyboardAwareScreenProps) {
  const { colors } = useTheme();
  const headerHeight = useContext(HeaderHeightContext) ?? 0;

  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={headerHeight}
      style={[styles.flex, { backgroundColor: colors.background }, style]}>
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
