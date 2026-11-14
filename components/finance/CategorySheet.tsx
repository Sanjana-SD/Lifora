import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/common/BottomSheet';
import { RADIUS, SPACING, TYPE } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';
import type { Category } from '@/types/category';

interface CategorySheetProps {
  visible: boolean;
  title?: string;
  categories: Category[];
  value: number | null;
  onChange: (id: number) => void;
  onClose: () => void;
}

/** Pick one finance category; closes on selection. */
export function CategorySheet({ visible, title = 'Category', categories, value, onChange, onClose }: CategorySheetProps) {
  const { colors } = useTheme();
  return (
    <BottomSheet visible={visible} onClose={onClose} title={title} maxHeight="80%">
      <ScrollView>
        <View style={styles.wrap}>
          {categories.map((c) => {
            const selected = c.id === value;
            return (
              <Pressable
                key={c.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={c.name}
                onPress={() => {
                  onChange(c.id);
                  onClose();
                }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected ? colors.accentSoft : colors.surface,
                    borderColor: selected ? colors.accent : colors.border,
                  },
                ]}>
                <View style={[styles.dot, { backgroundColor: c.colorHex }]} />
                <Text style={[styles.label, { color: selected ? colors.accent : colors.text }]}>{c.name}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    ...TYPE.label,
  },
});
