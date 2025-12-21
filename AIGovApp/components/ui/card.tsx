import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable, PressableProps } from 'react-native';
import { Colors } from '@/constants/theme';
import { Spacing, Radius, Shadows } from '@/constants/spacing';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type CardProps = PressableProps & {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
};

export function Card({ children, style, variant = 'default', ...props }: CardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const cardStyle = [
    styles.card,
    variant === 'elevated' && styles.elevated,
    variant === 'outlined' && { borderWidth: 1, borderColor: colors.border },
    { backgroundColor: colors.cardBackground },
    style,
  ];

  if (props.onPress) {
    return (
      <Pressable style={cardStyle} {...props}>
        {children}
      </Pressable>
    );
  }

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    backgroundColor: '#FFFFFF',
  },
  elevated: {
    ...Shadows.lg,
  },
});

