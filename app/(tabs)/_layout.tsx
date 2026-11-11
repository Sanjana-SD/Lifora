import { Tabs } from 'expo-router';
import { Calendar, Home, MoreHorizontal, StickyNote, Wallet, type LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RADIUS, TYPE } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';

function TabIcon({ icon: Icon, color, focused }: { icon: LucideIcon; color: ColorValue; focused: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.pill, focused && { backgroundColor: colors.accentSoft }]}>
      <Icon size={22} color={color} strokeWidth={focused ? 2.4 : 2} />
    </View>
  );
}

const TABS: { name: string; title: string; icon: LucideIcon }[] = [
  { name: 'home', title: 'Home', icon: Home },
  { name: 'calendar', title: 'Calendar', icon: Calendar },
  { name: 'finance', title: 'Finance', icon: Wallet },
  { name: 'notes', title: 'Notes', icon: StickyNote },
  { name: 'more', title: 'More', icon: MoreHorizontal },
];

// Tall enough for the pill indicator plus its label (the default bar clips the label).
const TAB_BAR_HEIGHT = 68;

export default function TabLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { ...TYPE.title, color: colors.text },
        headerTitleAlign: 'left',
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.item,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          elevation: 0,
          height: TAB_BAR_HEIGHT + insets.bottom,
        },
      }}>
      {TABS.map(({ name, title, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            // Home draws its own greeting header; a "Home" bar above it would repeat it.
            headerShown: name !== 'home',
            tabBarAccessibilityLabel: title,
            tabBarIcon: ({ color, focused }) => <TabIcon icon={icon} color={color} focused={focused} />,
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  pill: {
    width: 56,
    height: 28,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  item: {
    paddingVertical: 0,
  },
});
