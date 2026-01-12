import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle, TextStyle, ActivityIndicator, View } from 'react-native';
import { HeartIcon, PlusIcon, BookmarkIcon } from 'heroicons-react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type AnimatedButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
  loading?: boolean;
  disabled?: boolean;
  icon?: 'heart' | 'plus' | 'bookmark';
  iconPosition?: 'left' | 'right';
};

export function AnimatedButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  style,
  textStyle,
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
}: AnimatedButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    }
  };

  React.useEffect(() => {
    opacity.value = disabled || loading ? 0.6 : 1;
  }, [disabled, loading]);

  const buttonStyle = [
    styles.button,
    variant === 'primary' && { backgroundColor: colors.primary },
    variant === 'secondary' && { backgroundColor: colors.accent },
    variant === 'outline' && {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: colors.primary,
    },
    size === 'small' && styles.small,
    size === 'large' && styles.large,
    animatedStyle,
    style,
  ];

  const textColor = variant === 'outline' ? colors.primary : '#FFFFFF';

  // Icon mapping
  const iconMap = {
    heart: <HeartIcon color={colors.primary} size={22} style={{ marginHorizontal: 4 }} />,
    plus: <PlusIcon color={colors.primary} size={22} style={{ marginHorizontal: 4 }} />,
    bookmark: <BookmarkIcon color={colors.primary} size={22} style={{ marginHorizontal: 4 }} />,
  };

  return (
    <AnimatedPressable
      style={buttonStyle}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' && iconMap[icon]}
          <Text
            style={[
              styles.text,
              { color: textColor },
              size === 'small' && styles.smallText,
              size === 'large' && styles.largeText,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && iconMap[icon]}
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    fontSize: 18,
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});


