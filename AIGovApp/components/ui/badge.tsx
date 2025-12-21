import React from 'react';
import { View, StyleSheet, Text, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '@/constants/theme';
import { Spacing, Radius } from '@/constants/spacing';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type BadgeProps = {
  label: string;
  variant?: 'primary' | 'accent' | 'gray';
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export function Badge({ label, variant = 'accent', style, textStyle }: BadgeProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const badgeStyle = [
    styles.badge,
    variant === 'primary' && { backgroundColor: colors.primaryLight },
    variant === 'accent' && { backgroundColor: colors.accent },
    variant === 'gray' && { backgroundColor: colors.backgroundSecondary },
    style,
  ];

  const badgeTextColor =
    variant === 'accent' ? '#FFFFFF' : variant === 'primary' ? colors.primaryDark : colors.text;

  return (
    <View style={badgeStyle}>
      <Text style={[styles.text, { color: badgeTextColor }, textStyle]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
});

