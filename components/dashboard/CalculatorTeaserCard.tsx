import { router } from 'expo-router';
import { Calculator } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { DashboardSection } from './DashboardSection';

export function CalculatorTeaserCard() {
  const { colors } = useTheme();

  return (
    <DashboardSection icon={Calculator} title="Calculator" onPress={() => router.push('/calculator/index')}>
      <Text style={[styles.empty, { color: colors.textMuted }]}>
        Basic calculator plus EMI, GST, discount, and split-bill tools.
      </Text>
    </DashboardSection>
  );
}

const styles = StyleSheet.create({
  empty: {
    fontSize: 13,
    lineHeight: 18,
  },
});
