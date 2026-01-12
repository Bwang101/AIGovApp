import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable, PressableProps } from 'react-native';
import { HeartIcon, PlusIcon, BookmarkIcon } from 'heroicons-react';
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
  icon?: 'heart' | 'plus' | 'bookmark';
  iconPosition?: 'left' | 'right' | 'top';
  onIconPress?: () => void;
};

export function AnimatedCard({ children, style, variant = 'default', delay = 0, icon, iconPosition = 'top', onIconPress, ...props }: AnimatedCardProps) {
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

  // Icon mapping
  const iconMap = {
    heart: <HeartIcon color={colors.primary} size={28} style={{ margin: 4 }} />, 
    plus: <PlusIcon color={colors.primary} size={28} style={{ margin: 4 }} />, 
    bookmark: <BookmarkIcon color={colors.primary} size={28} style={{ margin: 4 }} />, 
  };

  const renderIcon = () =>
    icon ? (
      <Pressable onPress={onIconPress} style={styles.iconWrap} hitSlop={8}>
        {iconMap[icon]}
      </Pressable>
    ) : null;

  const content = (
    <>
      {icon && iconPosition === 'top' && renderIcon()}
      <View style={styles.contentRow}>
        {icon && iconPosition === 'left' && renderIcon()}
        <View style={{ flex: 1 }}>{children}</View>
        {icon && iconPosition === 'right' && renderIcon()}
      </View>
    </>
  );

  if (props.onPress) {
    return (
      <AnimatedPressable
        style={cardStyle}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...props}>
        {content}
      </AnimatedPressable>
    );
  }

  return (
    <Animated.View style={cardStyle} {...props}>
      {content}
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
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
});

