import { router, type Href } from 'expo-router';
import { Calculator } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { DashboardSection } from './DashboardSection';

export function CalculatorTeaserCard() {
  const { colors } = useTheme();

  return (
    <DashboardSection icon={Calculator} title="Calculator" onPress={() => router.push('/calculator/index' as Href)}>
      <Text style={[styles.empty, { color: colors.textMuted }]}>
        Quick everyday arithmetic, with your recent results saved.
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
