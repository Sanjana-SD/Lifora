import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  MapPin,
  Moon,
  Sun,
  type LucideIcon,
} from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { RADIUS, SPACING, TOUCH_TARGET, TYPE } from '@/constants/appConfig';
import { useTheme } from '@/hooks/useTheme';
import { useWeather } from '@/hooks/useWeather';
import { formatRelativeUpdated } from '@/utils/dateUtils';
import { describeWeather, formatTemp, type WeatherIconKey } from '@/utils/weather';

const ICONS: Record<WeatherIconKey, { day: LucideIcon; night: LucideIcon }> = {
  clear: { day: Sun, night: Moon },
  'partly-cloudy': { day: CloudSun, night: CloudMoon },
  cloudy: { day: Cloud, night: Cloud },
  fog: { day: CloudFog, night: CloudFog },
  drizzle: { day: CloudDrizzle, night: CloudDrizzle },
  rain: { day: CloudRain, night: CloudRain },
  snow: { day: CloudSnow, night: CloudSnow },
  thunder: { day: CloudLightning, night: CloudLightning },
};

function WeatherIcon({ icon, isDay, color }: { icon: WeatherIconKey; isDay: boolean; color: string }) {
  const { day, night } = ICONS[icon];
  return React.createElement(isDay ? day : night, { size: 30, color, strokeWidth: 2 });
}

/**
 * Phone-style weather at the top of Home: big temperature with an icon,
 * then the place, the condition, and today's high/low. Tap to refresh.
 */
export function WeatherWidget() {
  const { colors } = useTheme();
  const { access, weather, loading, stale, refresh, enable } = useWeather();

  if (access === 'undetermined' && !weather) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Show local weather"
        accessibilityHint="Asks for your approximate location"
        onPress={enable}
        style={({ pressed }) => [
          styles.prompt,
          { borderColor: colors.border, backgroundColor: pressed ? colors.accentSoft : colors.surface },
        ]}>
        <CloudSun size={20} color={colors.accent} />
        <Text style={[styles.promptText, { color: colors.accent }]}>Weather</Text>
      </Pressable>
    );
  }

  if (!weather) {
    return loading ? <ActivityIndicator color={colors.accent} style={styles.spinner} /> : null;
  }

  const { label, icon } = describeWeather(weather.code);
  const sunny = icon === 'clear' && weather.isDay;
  const summary = `${weather.place ? `${weather.place}: ` : ''}${formatTemp(weather.temperatureC)}, ${label}, high ${formatTemp(
    weather.highC,
  )}, low ${formatTemp(weather.lowC)}${stale ? `, last updated ${formatRelativeUpdated(weather.fetchedAt)}` : ''}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Weather. ${summary}`}
      accessibilityHint="Refreshes the weather"
      onPress={refresh}
      style={({ pressed }) => [styles.widget, pressed && { opacity: 0.7 }]}>
      <View style={styles.tempRow}>
        <WeatherIcon icon={icon} isDay={weather.isDay} color={sunny ? colors.warningFill : colors.accent} />
        <Text style={[styles.temp, { color: colors.text }]}>{formatTemp(weather.temperatureC)}</Text>
      </View>
      {weather.place ? (
        <View style={styles.placeRow}>
          <MapPin size={11} color={colors.textMuted} />
          <Text style={[styles.place, { color: colors.text }]} numberOfLines={1}>
            {weather.place}
          </Text>
        </View>
      ) : null}
      <Text style={[styles.detail, { color: colors.textMuted }]} numberOfLines={1}>
        {loading ? 'Updating…' : stale ? `As of ${formatRelativeUpdated(weather.fetchedAt)}` : label}
      </Text>
      <Text style={[styles.detail, { color: colors.textMuted }]}>
        H {formatTemp(weather.highC)}  L {formatTemp(weather.lowC)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  widget: {
    alignItems: 'flex-end',
    minHeight: TOUCH_TARGET,
    maxWidth: 150,
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  temp: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  place: {
    ...TYPE.label,
    flexShrink: 1,
  },
  detail: {
    ...TYPE.caption,
    textAlign: 'right',
  },
  prompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    minHeight: TOUCH_TARGET,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  promptText: {
    ...TYPE.label,
  },
  spinner: {
    margin: SPACING.md,
  },
});
