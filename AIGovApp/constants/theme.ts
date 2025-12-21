/**
 * Modern food app color palette inspired by contemporary design
 */

import { Platform } from 'react-native';

// Modern pink/magenta accent color
const primaryPink = '#FF6B9D';
const primaryPinkDark = '#FF4D7A';
const primaryPinkLight = '#FFB3D1';

// Green accent for prices/badges
const accentGreen = '#4CAF50';
const accentGreenDark = '#388E3C';
const accentGreenLight = '#81C784';

// Neutral colors
const backgroundLight = '#FFFFFF';
const backgroundGray = '#F5F5F5';
const textDark = '#1A1A1A';
const textGray = '#666666';
const textLight = '#999999';

const tintColorLight = primaryPink;
const tintColorDark = primaryPinkLight;

export const Colors = {
  light: {
    text: textDark,
    background: backgroundLight,
    backgroundSecondary: backgroundGray,
    tint: tintColorLight,
    icon: textGray,
    tabIconDefault: textLight,
    tabIconSelected: tintColorLight,
    primary: primaryPink,
    primaryDark: primaryPinkDark,
    primaryLight: primaryPinkLight,
    accent: accentGreen,
    accentDark: accentGreenDark,
    accentLight: accentGreenLight,
    cardBackground: '#FFFFFF',
    border: '#E0E0E0',
    textGray: textGray,
    textLight: textLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    backgroundSecondary: '#1F1F1F',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    primary: primaryPink,
    primaryDark: primaryPinkDark,
    primaryLight: primaryPinkLight,
    accent: accentGreen,
    accentDark: accentGreenDark,
    accentLight: accentGreenLight,
    cardBackground: '#1F1F1F',
    border: '#333333',
    textGray: '#9BA1A6',
    textLight: '#6B7280',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
