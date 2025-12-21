import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable, PressableProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '@/constants/theme';
import { Spacing, Radius, Shadows } from '@/constants/spacing';
import { useColorScheme } from '@/hooks/use-color-scheme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type AnimatedCardProps = PressableProps & {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
  delay?: number;
};

export function AnimatedCard({ children, style, variant = 'default', delay = 0, ...props }: AnimatedCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    opacity.value = withTiming(1, { duration: 300 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const cardStyle = [
    styles.card,
    variant === 'elevated' && styles.elevated,
    variant === 'outlined' && { borderWidth: 1, borderColor: colors.border },
    { backgroundColor: colors.cardBackground },
    animatedStyle,
    style,
  ];

  if (props.onPress) {
    return (
      <AnimatedPressable
        style={cardStyle}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...props}>
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <Animated.View style={cardStyle} {...props}>
      {children}
    </Animated.View>
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

